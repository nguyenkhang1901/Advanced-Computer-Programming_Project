import sqlite3
conn = sqlite3.connect('database.db')
cursor = conn.cursor()
cursor.execute("SELECT filename, content FROM knowledge_base WHERE content LIKE '%club%' OR content LIKE '%câu lạc bộ%'")
rows = cursor.fetchall()
with open('clubs_result.txt', 'w', encoding='utf-8') as f:
    for row in rows:
        f.write(f'File: {row[0]}\nContent: {row[1]}\n---\n')
