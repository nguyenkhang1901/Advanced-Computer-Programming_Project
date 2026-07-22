import sqlite3
import os
import json

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    # Drop existing table and start fresh!
    conn.execute('DROP TABLE IF EXISTS knowledge_base')
    conn.execute('''
        CREATE TABLE knowledge_base (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            content TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def insert_document(filename, content):
    conn = get_db_connection()
    conn.execute('INSERT INTO knowledge_base (filename, content) VALUES (?, ?)',
                 (filename, content))
    conn.commit()
    conn.close()

def process_json_scholarships(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            content = (
                f"Học bổng: {item.get('name', '')}\n"
                f"Giá trị học bổng được cấp: {item.get('value', '')}\n"
                f"Tiêu chuẩn GPA: {item.get('gpa_requirement', '')}\n"
                f"Tiêu chuẩn Tiếng Anh học bạ: {item.get('english_transcript_requirement', '')}\n"
                f"Tiêu chuẩn IELTS: {item.get('ielts_requirement', '')}\n"
                f"Quy định Phỏng vấn/Thi: {item.get('interview_exam', '')}"
            )
            insert_document(os.path.basename(filepath), content)

def process_json_programs(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            content = f"Ngành học: {item.get('name', '')}\nKhoa: {item.get('faculty', '')}\nThời gian đào tạo: {item.get('duration', '')}\nHọc phí: {item.get('tuition', '')}\nĐiều kiện đầu vào: {item.get('entry_requirements', '')}\nMô tả ngành: {item.get('description', '')}"
            insert_document(os.path.basename(filepath), content)

def process_json_faqs(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            content = f"Câu hỏi: {item.get('question', '')}\nTrả lời: {item.get('answer', '')}"
            insert_document(os.path.basename(filepath), content)

def process_json_curriculum(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        lines = []
        for item in data:
            col1 = item.get('Nội dung đào tạo', '').strip()
            col2 = item.get('field 2', '').strip()
            col3 = item.get('field 3', '').strip()
            row_str = " | ".join(filter(None, [col1, col2, col3]))
            if row_str:
                lines.append(row_str)
        content = "Chương trình đào tạo (Curriculum):\n" + "\n".join(lines)
        insert_document(os.path.basename(filepath), content)

def process_txt_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        insert_document(os.path.basename(filepath), content)

def main():
    print("Initializing fresh database...")
    init_db()
    
    data_dir = '../data'
    data_raw_dir = '../data/data_raw'
    
    print("Processing JSON files...")
    if os.path.exists(os.path.join(data_raw_dir, 'scholarships.json')):
        process_json_scholarships(os.path.join(data_raw_dir, 'scholarships.json'))
    if os.path.exists(os.path.join(data_raw_dir, 'programs.json')):
        process_json_programs(os.path.join(data_raw_dir, 'programs.json'))
    if os.path.exists(os.path.join(data_raw_dir, 'faqs.json')):
        process_json_faqs(os.path.join(data_raw_dir, 'faqs.json'))
    if os.path.exists(os.path.join(data_raw_dir, 'data.json')):
        process_json_curriculum(os.path.join(data_raw_dir, 'data.json'))
        
    print("Processing TXT files from data_raw...")
    if os.path.exists(data_raw_dir):
        for filename in os.listdir(data_raw_dir):
            if filename.endswith('.txt'):
                filepath = os.path.join(data_raw_dir, filename)
                process_txt_file(filepath)
                
    data_cleaned_dir = '../data/data_cleaned'
    print("Processing TXT files from data_cleaned...")
    if os.path.exists(data_cleaned_dir):
        for filename in os.listdir(data_cleaned_dir):
            if filename.endswith('.txt'):
                filepath = os.path.join(data_cleaned_dir, filename)
                process_txt_file(filepath)
                
    conn = get_db_connection()
    count = conn.execute('SELECT COUNT(*) FROM knowledge_base').fetchone()[0]
    print(f"Database rebuilt successfully! Total documents ingested: {count}")

if __name__ == '__main__':
    main()
