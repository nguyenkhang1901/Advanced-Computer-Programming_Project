import requests
from bs4 import BeautifulSoup
import os

url = 'https://asia-vn.edu.vn/hoc-bong/'

# Send a request to access the website
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

# Get all text from the page, remove HTML code
text_data = soup.get_text(separator='\n', strip=True)

# Ensure data directory exists
os.makedirs('data/Data_raw', exist_ok=True)

# Save to the data_raw folder so the AI can learn it
with open('data/Data_raw/tuyen_sinh.txt', 'a', encoding="utf-8") as file:
    file.write(text_data)

print("Data successfully saved to txt file in data/Data_raw!")