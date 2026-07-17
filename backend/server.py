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

# Setup database on startup
setup_database()

# Initialize Google Gen AI
api_key = os.environ.get('GEMINI_API_KEY')
ai_client = genai.Client(api_key=api_key) if api_key else None

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
    query_tokens = [t for t in re.findall(r'\w+', query.lower()) if len(t) > 2]
    if not query_tokens:
        query_tokens = ['asia', 'university'] # fallback default
    
    conn = get_db_connection()
    try:
        # SQLite does the heavy lifting: filter to max 50 relevant pages instantly
        conditions = " OR ".join(["content LIKE ?" for _ in query_tokens])
        params = [f"%{word}%" for word in query_tokens]
        
        query_sql = f"SELECT content FROM knowledge_base WHERE {conditions} LIMIT 50"
        rows = conn.execute(query_sql, params).fetchall()
        
        if not rows:
            return "No relevant context found."
            
        # Re-score the paragraphs in Python
        retrieved_chunks = []
        for row in rows:
            content = row['content']
            paragraphs = re.split(r'\n\s*\n', content)
            for p in paragraphs:
                if len(p.strip()) > 50:
                    retrieved_chunks.append(p.strip())
                    
        # Score the extracted paragraphs
        scores = []
        for chunk in retrieved_chunks:
            chunk_tokens = re.findall(r'\w+', chunk.lower())
            chunk_counts = Counter(chunk_tokens)
            score = sum(chunk_counts[q] for q in query_tokens)
            score = score / (math.sqrt(len(chunk_tokens)) + 1) if chunk_tokens else 0
            scores.append(score)
            
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        best_chunks = [retrieved_chunks[i] for i in top_indices if scores[i] > 0]
        
        return "\n\n---\n\n".join(best_chunks) if best_chunks else "No relevant context found."
    except Exception as e:
        print("SQLite RAG Error:", e)
        return "No relevant context found."
    finally:
        conn.close()

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

        if not ai_client:
            # Fallback
            reply = "I am currently running in offline mode (no API key). Please contact admissions@asia-vn.edu.vn for more information."
            conn.execute('INSERT INTO chat_logs (session_id, role, message) VALUES (?, ?, ?)',
                         (session_id, 'bot', reply))
            conn.commit()
            conn.close()
            return jsonify({"reply": reply})

        chat_contents = "\n".join([h.get('text', '') for h in history]) + f"\n{message}"
        
        # Retrieve context for this specific message using RAG
        context = retrieve_context(message, top_k=3)
        
        system_prompt = f"""You are a professional admission consultant for Asia University Vietnam.
Use the following RELEVANT CONTEXT to answer the student's question. If the context doesn't contain the answer, say you don't know and advise them to contact admissions@asia-vn.edu.vn.

RELEVANT CONTEXT:
{context}

RULES:
1. Always be polite and welcoming.
2. Provide complete and helpful answers. Give enough information to fully address the user's question, but avoid unnecessary overly detailed fluff.
3. Use Markdown for formatting.
"""

        lang_instruction = "\nCRITICAL: You must reply in English." if language == 'en' else "\nCRITICAL: You must reply in Vietnamese."
        
        import json
        import base64
        from flask import stream_with_context
        from google.genai import types
        
        image_base64 = data.get('imageBase64')
        contents_list = [chat_contents]
        
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
        
        def generate():
            full_reply = ""
            try:
                response = ai_client.models.generate_content_stream(
                    model='gemini-2.5-flash',
                    contents=contents_list,
                    config={
                        'system_instruction': system_prompt + lang_instruction,
                        'temperature': 0.3
                    }
                )
                
                for chunk in response:
                    text = chunk.text
                    if text:
                        full_reply += text
                        yield f"data: {json.dumps({'text': text})}\n\n"
                        
                # End of stream marker
                yield "data: [DONE]\n\n"
                
            except Exception as e:
                print("Stream error:", e)
                yield f"data: {json.dumps({'error': 'Stream failed'})}\n\n"
            
            finally:
                # Save the complete reply to the database
                if full_reply:
                    conn = get_db_connection()
                    conn.execute('INSERT INTO chat_logs (session_id, role, message) VALUES (?, ?, ?)',
                                 (session_id, 'bot', full_reply))
                    conn.commit()
                    conn.close()
                    
        return Response(stream_with_context(generate()), mimetype='text/event-stream')
        
    except Exception as e:
        print("AI Error:", e)
        return jsonify({"error": "Failed to process chat request"}), 500

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
