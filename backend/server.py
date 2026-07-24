import os
import io
import csv
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from database import setup_database, get_db_connection
from google import genai

load_dotenv()

app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["1000 per day", "100 per hour"],
    storage_uri="memory://"
)

PORT = int(os.environ.get('PORT', 5000))
MODEL_NAME = os.environ.get('MODEL_NAME', 'gemini-3.5-flash-lite')

# Setup database on startup
setup_database()

# Initialize Gemini AI with Round-Robin strategy for multiple keys
api_keys_str = os.environ.get('GEMINI_API_KEY')
ai_clients = []
current_client_index = 0

if api_keys_str:
    # Split keys by comma if the user provides multiple keys
    api_keys = [k.strip() for k in api_keys_str.split(',') if k.strip()]
    for key in api_keys:
        try:
            client = genai.Client(api_key=key)
            ai_clients.append(client)
        except Exception as e:
            print(f"Failed to initialize Gemini Client for key {key[:5]}...: {e}")

def get_next_ai_client():
    global current_client_index
    if not ai_clients:
        return None
    
    client = ai_clients[current_client_index]
    # Move to the next key for the next request (Round-Robin)
    current_client_index = (current_client_index + 1) % len(ai_clients)
    return client

def execute_with_retry(func, *args, **kwargs):
    """
    Tries to execute an AI function using the Round-Robin clients.
    If a client throws an error (e.g. Rate Limit, Bad Key), it catches it
    and tries the next client in the list, up to len(ai_clients) times.
    """
    if not ai_clients:
        return None
    
    last_exception = None
    for _ in range(len(ai_clients)):
        client = get_next_ai_client()
        try:
            return func(client, *args, **kwargs)
        except Exception as e:
            print(f"API Client failed (rotating to next): {e}")
            last_exception = e
            
    raise last_exception

def execute_stream_with_retry(func, *args, **kwargs):
    """
    Special retry logic for streaming responses.
    Generator network requests only fire upon iteration, so we must manually
    fetch the first chunk to catch rate limit/auth errors before yielding.
    """
    if not ai_clients:
        return
        
    last_exception = None
    for _ in range(len(ai_clients)):
        client = get_next_ai_client()
        try:
            # First attempt with primary model
            response = func(client, *args, **kwargs)
            iterator = iter(response)
            
            # Fetch first chunk to trigger any immediate API errors
            try:
                first_chunk = next(iterator)
                # If we reach here, the API key and model work!
                yield first_chunk
                for chunk in iterator:
                    yield chunk
                return # Success
            except StopIteration:
                return # Empty stream, valid
                
        except Exception as e:
            print(f"API Stream Client failed (rotating to next): {e}")
            last_exception = e
            
            # If the error is likely due to rate limits or quota, try fallback model with SAME key
            error_msg = str(e).lower()
            if "429" in error_msg or "quota" in error_msg or "resource_exhausted" in error_msg:
                try:
                    print("Attempting fallback to gemini-3.1-flash-lite...")
                    # Pass a special flag to func to indicate fallback model
                    fallback_kwargs = kwargs.copy()
                    fallback_kwargs['fallback'] = True
                    fallback_response = func(client, *args, **fallback_kwargs)
                    fallback_iterator = iter(fallback_response)
                    
                    try:
                        first_chunk = next(fallback_iterator)
                        yield first_chunk
                        for chunk in fallback_iterator:
                            yield chunk
                        return # Success with fallback
                    except StopIteration:
                        return
                except Exception as fallback_e:
                    print(f"Fallback model also failed: {fallback_e}")
                    # Continue to next key if fallback also fails
            
    raise last_exception

# Load Knowledge Data
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
RAW_DIR = os.path.join(DATA_DIR, 'Data_raw')
if not os.path.exists(RAW_DIR):
    RAW_DIR = os.path.join(DATA_DIR, 'data_raw')

# RAG System Logic (SQLite Hybrid Search)
import re
import math
from collections import Counter

# Keep load_knowledge as a dummy function so admin API doesn't crash when reloading
def load_knowledge():
    pass

def retrieve_context(query, top_k=5):
    query_lower = query.lower()
    
    # English to Vietnamese keyword mapping for BM25 search
    keyword_map = {
        'admission': 'tuyển sinh xét tuyển',
        'requirement': 'điều kiện yêu cầu hồ sơ',
        'requirements': 'điều kiện yêu cầu hồ sơ',
        'scholarship': 'học bổng',
        'scholarships': 'học bổng',
        'major': 'ngành chuyên ngành',
        'majors': 'ngành chuyên ngành',
        'program': 'chương trình đào tạo',
        'programs': 'chương trình đào tạo',
        'course': 'khóa học môn học',
        'tuition': 'học phí',
        'fee': 'chi phí học phí',
        'fees': 'chi phí học phí',
        'campus': 'cơ sở địa chỉ',
        'location': 'cơ sở địa chỉ',
        'contact': 'liên hệ',
        'dormitory': 'ký túc xá',
        'housing': 'chỗ ở ký túc xá',
        'international': 'quốc tế'
    }
    
    # Append Vietnamese keywords to the query to boost match rates
    added_keywords = []
    for eng_word, vi_words in keyword_map.items():
        if eng_word in query_lower:
            added_keywords.append(vi_words)
            
    if added_keywords:
        query_lower += " " + " ".join(added_keywords)

    # Extract alphanumeric words
    words = re.findall(r'\w+', query_lower)
    
    query_tokens = []
    # Generate 1-gram, 2-gram, 3-gram
    for n in range(1, 4):
        for i in range(len(words) - n + 1):
            query_tokens.append(' '.join(words[i:i+n]))
            
    # Filter out very short tokens and duplicates
    query_tokens = list(set([t for t in query_tokens if len(t) > 2]))
    
    if not query_tokens:
        query_tokens = ['asia', 'university'] # fallback default
    
    conn = get_db_connection()
    try:
        # Fetch all documents since we cleaned the DB to only contain core data
        # Fetch filename as well to boost structured data
        query_sql = "SELECT filename, content FROM knowledge_base"
        rows = conn.execute(query_sql).fetchall()
        
        if not rows:
            return "No relevant context found."
            
        retrieved_chunks = []
        chunk_filenames = []
        for row in rows:
            content = row['content']
            filename = row['filename']
            
            # Do not chunk if the entire document is reasonably small (e.g., < 3000 chars)
            if len(content) < 3000:
                retrieved_chunks.append(content)
                chunk_filenames.append(filename)
                continue
                
            lines = content.split('\n')
            current_chunk = []
            current_len = 0
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                current_chunk.append(line)
                current_len += len(line)
                if current_len > 1200:
                    retrieved_chunks.append('\n'.join(current_chunk))
                    chunk_filenames.append(filename)
                    current_chunk = []
                    current_len = 0
            if current_chunk:
                retrieved_chunks.append('\n'.join(current_chunk))
                chunk_filenames.append(filename)
                    
        # Implement N-Gram BM25 Scoring
        k1 = 1.5
        b = 0.75
        
        doc_lengths = [len(re.findall(r'\w+', doc.lower())) for doc in retrieved_chunks]
        avg_dl = sum(doc_lengths) / max(1, len(doc_lengths))
        
        idfs = {}
        N = len(retrieved_chunks)
        retrieved_chunks_lower = [doc.lower() for doc in retrieved_chunks]
        
        for q in query_tokens:
            n_q = sum(1 for doc_lower in retrieved_chunks_lower if q in doc_lower)
            idf = math.log(((N - n_q + 0.5) / (n_q + 0.5)) + 1)
            idfs[q] = max(0.01, idf)
            
        scores = []
        for i, chunk_lower in enumerate(retrieved_chunks_lower):
            dl = doc_lengths[i]
            
            score = 0
            for q in query_tokens:
                # Count exact phrase occurrences in the document chunk
                tf = chunk_lower.count(q)
                if tf > 0:
                    n_gram_weight = len(q.split()) # Give 2x weight to 2-grams, 3x weight to 3-grams
                    numerator = tf * (k1 + 1)
                    denominator = tf + k1 * (1 - b + b * (dl / max(1, avg_dl)))
                    score += idfs[q] * (numerator / denominator) * n_gram_weight
            
            # Boost score for structured data (JSON derived) to ensure it beats random news articles
            if chunk_filenames[i].endswith('.json') or chunk_filenames[i] == 'all_scholarships_combined.txt':
                score *= 20.0
                
            scores.append(score)
            
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        best_chunks = [retrieved_chunks[i] for i in top_indices if scores[i] > 0]
        
        return "\n\n---\n\n".join(best_chunks) if best_chunks else "No relevant context found."
    except Exception as e:
        print("SQLite BM25 Error:", e)
        return "No relevant context found."
    finally:
        conn.close()

import time
import unicodedata

# Simple in-memory cache to bypass Google API limits
response_cache = {}

def normalize_query(query):
    # Remove accents
    s = ''.join(c for c in unicodedata.normalize('NFD', query) if unicodedata.category(c) != 'Mn')
    s = s.lower()
    # Remove common stop words and filler words
    stop_words = ["cho", "em", "hoi", "a", "da", "ad", "admin", "thay", "co", "truong", "minh", "ban", "vay", "la", "nhieu"]
    # Keep only alphanumeric
    s = re.sub(r'[^a-z0-9\s]', '', s)
    tokens = [t for t in s.split() if t not in stop_words and len(t) > 1]
    return " ".join(sorted(tokens))

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "awake", "message": "Render server is running!"}), 200

@app.route('/api/chat', methods=['POST'])
@limiter.limit("20 per minute")
def chat():
    try:
        data = request.json
        message = data.get('message')
        history = data.get('history', [])
        session_id = data.get('sessionId', 'anonymous')
        language = data.get('language', 'en')
        
        if not message:
            return jsonify({"error": "Message is required"}), 400

        conn = get_db_connection()
        conn.execute('INSERT INTO chat_logs (session_id, role, message) VALUES (?, ?, ?)',
                     (session_id, 'user', message))
        conn.commit()

        client = get_next_ai_client()
        if not client:
            # Fallback
            reply = "I am currently running in offline mode (no API key). Please contact admissions@asia-vn.edu.vn for more information."
            conn.execute('INSERT INTO chat_logs (session_id, role, message) VALUES (?, ?, ?)',
                         (session_id, 'bot', reply))
            conn.commit()
            conn.close()
            return jsonify({"reply": reply})

        # Check Cache before calling Google API
        cache_key = normalize_query(message)
        if cache_key and cache_key in response_cache:
            print(f"CACHE HIT: {cache_key}")
            from flask import stream_with_context
            import json
            def cached_stream():
                cached_text = response_cache[cache_key]
                words = cached_text.split()
                # Simulate fast streaming
                for i in range(0, len(words), 5):
                    chunk = " ".join(words[i:i+5]) + " "
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                    time.sleep(0.05)
                yield "data: [DONE]\n\n"
            return Response(stream_with_context(cached_stream()), mimetype='text/event-stream')

        chat_contents = "\n".join([h.get('text', '') for h in history]) + f"\n{message}"
        
        # Retrieve context for this specific message using RAG
        context = retrieve_context(message, top_k=3)
        
        system_prompt = f"""You are a professional admission consultant for Asia University Vietnam.
Use the following RELEVANT CONTEXT to answer the student's question. If the context doesn't contain the answer, say you don't know and advise them to contact admissions@asia-vn.edu.vn.

CRITICAL RULES ABOUT THE UNIVERSITY:
1. The university ONLY offers exactly 4 majors: Artificial Intelligence (Trí tuệ nhân tạo), Semiconductor Technology (Công nghệ bán dẫn), Finance (Tài chính), and Business Administration (Quản trị kinh doanh). NEVER mention any other majors like 'Kỹ thuật điện tử', 'Công nghệ thông tin' or 'Hệ thống nhúng'. You must translate the major names naturally into the language you are responding in.
2. The university offers a total of 6 scholarships (Asia Change Maker, Asia Future Delight, Asia Pioneer, Asia Pioneer ++, Asia Next Gen, Asia Talent). If asked about scholarships, you MUST summarize all 6 of them based on the context, do not just list a few.

RELEVANT CONTEXT:
{context}

RULES:
1. Always be polite and welcoming.
2. Provide complete and helpful answers. Give enough information to fully address the user's question, but avoid unnecessary overly detailed fluff.
3. Use Markdown for formatting.
4. DO NOT use LaTeX formatting (like `$\ge$`, `\le`) for math operators. ALWAYS use plain text characters like `>=` or `<=` instead.
"""

        lang_instruction = "\nCRITICAL: You must reply in English." if language == 'en' else "\nCRITICAL: You must reply in Vietnamese."
        
        import json
        import base64
        from flask import stream_with_context
        from google.genai import types
        
        # Setup contents list
        contents_list = [chat_contents]
        
        image_base64 = data.get('imageBase64')
        if image_base64:
            try:
                # Remove data URI prefix if present
                if ',' in image_base64:
                    header, base64_data = image_base64.split(',', 1)
                    mime_type = header.split(';')[0].split(':')[1]
                else:
                    base64_data = image_base64
                    mime_type = 'image/jpeg' # fallback
                
                image_bytes = base64.b64decode(base64_data)
                image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                contents_list.append(image_part)
            except Exception as e:
                print("Image decoding error:", e)
        
        # Helper function for retry logic
        def ai_call(client, contents, config, fallback=False):
            target_model = MODEL_NAME
            if fallback:
                target_model = 'gemini-3.1-flash-lite' # Fallback to a lighter, higher rate-limit model
                print(f"Using fallback model: {target_model}")
            
            return client.models.generate_content_stream(
                model=target_model,
                contents=contents,
                config=config
            )

        def generate():
            full_reply = ""
            try:
                # Use retry logic to handle rate limits or bad keys
                config = {
                    'system_instruction': system_prompt + lang_instruction,
                    'temperature': 0.3
                }
                
                # Ensure we have at least one client
                if not ai_clients:
                    yield f"data: {json.dumps({'error': 'No API keys configured'})}\n\n"
                    return
                    
                response = execute_stream_with_retry(ai_call, contents_list, config)
                
                for chunk in response:
                    text = chunk.text
                    if text:
                        full_reply += text
                        yield f"data: {json.dumps({'text': text})}\n\n"
                        
                # End of stream marker
                yield "data: [DONE]\n\n"
                
            except Exception as e:
                print("Stream error:", e)
                error_msg = str(e).replace('"', "'")
                # Format a user-friendly message based on the exception type
                if "429" in error_msg or "Quota" in error_msg:
                    display_error = "Google Gemini API Limit Exceeded (429 Quota). Please try again later."
                elif "400" in error_msg or "INVALID_ARGUMENT" in error_msg:
                    display_error = "Invalid Google Gemini API Key configured in backend."
                else:
                    display_error = f"API Error: {error_msg[:100]}"
                yield f"data: {json.dumps({'error': display_error})}\n\n"
            
            finally:
                # Save the complete reply to the database and cache
                if full_reply:
                    if cache_key:
                        response_cache[cache_key] = full_reply
                    conn = get_db_connection()
                    conn.execute('INSERT INTO chat_logs (session_id, role, message) VALUES (?, ?, ?)',
                                 (session_id, 'bot', full_reply))
                    conn.commit()
                    conn.close()
                    
        return Response(stream_with_context(generate()), mimetype='text/event-stream')
        
    except Exception as e:
        print("AI Error:", e)
        return jsonify({"error": "Failed to process chat request"}), 500

@app.route('/api/quiz', methods=['POST'])
@limiter.limit("10 per minute")
def career_quiz():
    try:
        data = request.json
        answers = data.get('answers', [])
        language = data.get('language', 'vi')
        
        client = get_next_ai_client()
        if not client:
            return jsonify({"recommendation": "Hệ thống đang bảo trì, vui lòng liên hệ Ban Tuyển sinh."})

        prompt = f"""Bạn là một chuyên gia hướng nghiệp xuất sắc của Asia University Vietnam.
Nhiệm vụ của bạn là dựa vào các câu trả lời trắc nghiệm của học sinh dưới đây, phân tích và đề xuất 1 trong 4 ngành học sau:
1. Công nghệ bán dẫn (Semiconductor Technology)
2. Trí tuệ nhân tạo (Artificial Intelligence)
3. Quản trị kinh doanh (Business Administration)
4. Tài chính (Finance)

Câu trả lời của học sinh:
{answers}

YÊU CẦU:
- Phân tích ngắn gọn (dưới 150 chữ).
- Nêu rõ tên ngành học phù hợp nhất và giải thích TẠI SAO nó phù hợp với tính cách/sở thích của họ.
- Xưng hô "bạn" và "chúng tôi". Luôn thân thiện, khích lệ.
"""
        lang_instruction = "\nCRITICAL: Reply in English." if language == 'en' else "\nCRITICAL: Reply in Vietnamese."
        
        def quiz_ai_call(client, contents, config):
            return client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents,
                config=config
            )

        response = execute_with_retry(
            quiz_ai_call, 
            prompt, 
            {'system_instruction': prompt + lang_instruction, 'temperature': 0.7}
        )
        return jsonify({"recommendation": response.text})
    except Exception as e:
        print("Quiz API Error:", e)
        return jsonify({"error": "Failed to generate recommendation"}), 500

@app.route('/api/leads', methods=['POST'])
def save_lead():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone', '')
        program = data.get('program', '')
        
        if not name or not email:
            return jsonify({"error": "Name and email are required"}), 400
            
        conn = get_db_connection()
        conn.execute('INSERT INTO leads (name, email, phone, program) VALUES (?, ?, ?, ?)',
                     (name, email, phone, program))
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Lead saved successfully"})
    except Exception as e:
        print("Lead Error:", e)
        return jsonify({"error": "Failed to save lead"}), 500

@app.route('/api/admin/leads', methods=['GET'])
def get_leads():
    try:
        conn = get_db_connection()
        leads = conn.execute('SELECT * FROM leads ORDER BY created_at DESC').fetchall()
        conn.close()
        return jsonify([dict(ix) for ix in leads])
    except Exception as e:
        print("Admin Leads Error:", e)
        return jsonify({"error": "Failed to fetch leads"}), 500

@app.route('/api/admin/leads/export', methods=['GET'])
def export_leads():
    try:
        conn = get_db_connection()
        leads = conn.execute('SELECT * FROM leads ORDER BY created_at DESC').fetchall()
        conn.close()
        
        si = io.StringIO()
        cw = csv.writer(si)
        cw.writerow(['ID', 'Name', 'Email', 'Phone', 'Program', 'Created At'])
        for lead in leads:
            cw.writerow([lead['id'], lead['name'], lead['email'], lead['phone'], lead['program'], lead['created_at']])
            
        output = si.getvalue()
        return Response(output, mimetype='text/csv', headers={"Content-Disposition": "attachment; filename=leads.csv"})
    except Exception as e:
        print("Export Error:", e)
        return jsonify({"error": "Failed to export leads"}), 500

@app.route('/api/admin/chat_logs', methods=['GET'])
def get_chat_logs():
    try:
        conn = get_db_connection()
        logs = conn.execute('SELECT * FROM chat_logs ORDER BY created_at ASC').fetchall()
        conn.close()
        
        grouped = {}
        for log in logs:
            session_id = log['session_id']
            if session_id not in grouped:
                grouped[session_id] = []
            grouped[session_id].append(dict(log))
            
        return jsonify(grouped)
    except Exception as e:
        print("Chat Logs Error:", e)
        return jsonify({"error": "Failed to fetch chat logs"}), 500

@app.route('/api/admin/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        if file and file.filename.endswith('.txt'):
            os.makedirs(RAW_DIR, exist_ok=True)
            file.save(os.path.join(RAW_DIR, file.filename))
            load_knowledge() # Reload RAG chunks
            return jsonify({"success": True, "message": "File uploaded and knowledge updated"})
        return jsonify({"error": "Invalid file format, only .txt allowed"}), 400
    except Exception as e:
        print("Upload Error:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/files', methods=['GET'])
def get_files():
    try:
        files = []
        if os.path.exists(RAW_DIR):
            for file in os.listdir(RAW_DIR):
                if file.endswith('.txt'):
                    files.append(file)
        return jsonify(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/files/<filename>', methods=['DELETE'])
def delete_file(filename):
    try:
        if filename.endswith('.txt'):
            file_path = os.path.join(RAW_DIR, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                load_knowledge() # Reload RAG
                return jsonify({"success": True, "message": "File deleted"})
        return jsonify({"error": "File not found or invalid"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        lead_data = data.get('leadData', {})
        history = data.get('history', [])
        language = data.get('language', 'en')
        
        if not ai_client:
            return jsonify({"recommendation": "AI is currently offline. Based on your profile, please review our website programs."})
            
        history_text = "\n".join([f"{h.get('role', 'unknown')}: {h.get('text', '')}" for h in history]) if history else "No history provided."
        
        context = retrieve_context(f"{lead_data.get('program', '')} scholarships", top_k=10)
        
        prompt = f"""Based on the following user conversation history and profile, provide a highly personalized program and scholarship recommendation for Asia University Vietnam.
        
User Profile:
Name: {lead_data.get('name', 'Unknown')}
Program of Interest: {lead_data.get('program', 'Unknown')}

Conversation History:
{history_text}

RELEVANT UNIVERSITY INFORMATION:
{context}

Provide a direct, enthusiastic, and personalized recommendation highlighting why a specific program fits them, and suggest a scholarship they should apply for based on their interest. Use Markdown for formatting.
{'IMPORTANT: Answer entirely in English.' if language == 'en' else 'IMPORTANT: Answer entirely in Vietnamese.'}"""

        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={'temperature': 0.5}
        )
        
        return jsonify({"recommendation": response.text})
    except Exception as e:
        print("Recommendation Error:", e)
        return jsonify({"error": "Failed to generate recommendation"}), 500

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True)
