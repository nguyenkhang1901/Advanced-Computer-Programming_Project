import requests
from bs4 import BeautifulSoup
import os
url = ['https://asia-vn.edu.vn/hoc-bong/']


# Gửi yêu cầu truy cập trang web
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')
# Lấy toàn bộ văn bản (text) trên trang, loại bỏ code HTML
text_data = soup.get_text(separator='\n', strip=True)

# Lưu vào thư mục data_tuyen_sinh
with open('tuyen_sinh.txt', 'a', encoding="utf-8") as file:
    file.write(text_data)

print("Đã lưu dữ liệu thành công vào file txt!")