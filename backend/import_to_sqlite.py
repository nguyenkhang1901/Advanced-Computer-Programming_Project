import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database.db')
RAW_DIR = os.path.join(BASE_DIR, '..', 'data', 'data_raw')

def import_to_sqlite():
    # Kết nối database (tự tạo nếu chưa có)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Tạo bảng knowledge_base nếu chưa tồn tại
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Đọc tất cả file .txt và cho vào database
    if not os.path.exists(RAW_DIR):
        print(f"Không tìm thấy thư mục {RAW_DIR}")
        return
        
    count = 0
    for file in os.listdir(RAW_DIR):
        if file.endswith('.txt'):
            file_path = os.path.join(RAW_DIR, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            try:
                # Dùng INSERT OR REPLACE để nếu file đã có thì cập nhật nội dung mới
                cursor.execute('''
                    INSERT OR REPLACE INTO knowledge_base (filename, content) 
                    VALUES (?, ?)
                ''', (file, content))
                count += 1
                print(f"Đã thêm: {file}")
            except Exception as e:
                print(f"Lỗi khi thêm {file}: {e}")
                
    conn.commit()
    conn.close()
    
    print(f"\n🎉 HOÀN TẤT! Đã nhét thành công {count} bài viết vào file SQLite (database.db)")

if __name__ == "__main__":
    import_to_sqlite()
