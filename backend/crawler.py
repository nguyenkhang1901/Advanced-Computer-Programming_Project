import os
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# ================= CẤU HÌNH =================
START_URL = "https://asia-vn.edu.vn/" # Thay bằng trang web bạn muốn lấy data
MAX_PAGES = 9999 # Giới hạn số trang (Tăng lên nếu muốn cào nhiều hơn)
# ============================================

# Đường dẫn lưu file vào đúng thư mục data_raw của hệ thống AI
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'data_raw')

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def get_base_domain(url):
    return urlparse(url).netloc

def extract_text_from_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Bỏ đi các phần thừa thãi (script, style, thanh điều hướng, chân trang)
    for element in soup(['script', 'style', 'header', 'footer', 'nav', 'aside', 'noscript']):
        element.decompose()
        
    # Lấy text
    text = soup.get_text(separator='\n', strip=True)
    
    # Lọc bớt các dòng trống
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return '\n'.join(lines)

def crawl_website(start_url, max_pages=50):
    visited = set()
    queue = [start_url]
    base_domain = get_base_domain(start_url)
    
    pages_crawled = 0
    
    print(f"\n🕷️ BẮT ĐẦU CÀO DỮ LIỆU TỪ: {start_url}")
    print("-" * 50)
    
    while queue and pages_crawled < max_pages:
        current_url = queue.pop(0)
        
        # Bỏ qua các link chứa dấu # (anchor links chuyển đến cùng 1 trang)
        current_url = current_url.split('#')[0]
        
        if current_url in visited:
            continue
            
        visited.add(current_url)
        print(f"⏳ Đang cào [{pages_crawled + 1}/{max_pages}]: {current_url}")
        
        try:
            # Gửi request giả danh làm trình duyệt (để không bị chặn)
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(current_url, headers=headers, timeout=10)
            
            # Chỉ xử lý nếu đó là trang Web (HTML)
            if 'text/html' not in response.headers.get('Content-Type', ''):
                continue
                
            # Lọc nội dung
            text_content = extract_text_from_html(response.text)
            
            # Chỉ lưu những trang có độ dài nội dung > 100 ký tự (bỏ qua trang rỗng)
            if len(text_content) > 100:
                # Tạo tên file từ URL
                safe_name = current_url.replace('https://', '').replace('http://', '').replace('/', '_').replace('?', '_')
                if not safe_name: safe_name = "trang_chu"
                safe_name = safe_name[:100] # Giới hạn tên file không quá dài
                
                filename = os.path.join(OUTPUT_DIR, f"crawled_{safe_name}.txt")
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"Nguồn: {current_url}\n")
                    f.write("-" * 50 + "\n\n")
                    f.write(text_content)
                
                pages_crawled += 1
                print(f"✅ Đã lưu thành công vào: crawled_{safe_name}.txt")
            else:
                print(f"⏭️ Bỏ qua (Trang không có nội dung)")
            
            # Bước 2: Tìm tất cả các link mới có trên trang này để cào tiếp
            soup = BeautifulSoup(response.text, 'html.parser')
            for a_tag in soup.find_all('a', href=True):
                href = a_tag['href']
                
                # Bỏ qua link email, số điện thoại
                if href.startswith(('mailto:', 'tel:', 'javascript:')):
                    continue
                    
                full_url = urljoin(current_url, href)
                
                # CHỈ LẤY LINK CÙNG DOMAIN (Để nhện không bò nhầm sang Facebook hay YouTube)
                if get_base_domain(full_url) == base_domain and full_url not in visited and full_url not in queue:
                    queue.append(full_url)
            
            # Bước 3: Ngủ 1 giây để lịch sự, không làm sập server người ta
            time.sleep(1)
            
        except Exception as e:
            print(f"❌ Lỗi khi cào {current_url}: {str(e)}")
            continue

    print("-" * 50)
    print(f"🎉 HOÀN TẤT! Đã lấy thành công {pages_crawled} trang web.")
    print(f"📂 Dữ liệu đã được tự động lưu vào thư mục: data/data_raw")
    print(f"💡 Nhớ chạy lại file run.bat để AI nạp kiến thức mới nhé!")

if __name__ == "__main__":
    crawl_website(START_URL, MAX_PAGES)
