import sqlite3

content = """
THÔNG TIN HỌC BỔNG ASIA UNIVERSITY VIETNAM NĂM 2026

1. CÁC LOẠI HỌC BỔNG DỰA TRÊN THÀNH TÍCH HỌC TẬP (GPA VÀ IELTS)
Tất cả các học bổng này đều yêu cầu thí sinh có Điểm trung bình tiếng Anh học bạ >= 6.5. Thí sinh có thể được đề nghị tham gia thi học bổng để đánh giá kỹ hơn năng lực và thái độ học tập.

- Học bổng Asia Change Maker: Giá trị 10% học phí. Điều kiện: GPA >= 8.0. (Được cộng thêm 10% nếu có IELTS >= 5.5).
- Học bổng Asia Future Delight: Giá trị 20% học phí. Điều kiện: GPA >= 8.0. (Được cộng thêm 10% nếu có IELTS >= 6.5).
- Học bổng Asia Pioneer: Giá trị 30% học phí. Điều kiện: Học sinh giỏi Tỉnh/Thành phố (đạt giải Nhất/Nhì/Ba các môn văn hóa, trừ môn Ngoại Ngữ).
- Học bổng Asia Pioneer ++: Giá trị 40% học phí. Điều kiện: Học sinh giỏi Tỉnh/Thành phố (đạt giải Nhất/Nhì/Ba các môn văn hóa, trừ môn Ngoại Ngữ). (Được cộng thêm 10% nếu có IELTS >= 7.0).
- Học bổng Asia Next Gen: Giá trị 50% - 100% học phí. Điều kiện: Học sinh giỏi Quốc gia (trừ môn Ngoại ngữ). (Được cộng thêm 10% nếu có IELTS >= 5.5).
- Học bổng Asia Talent: Giá trị 50% - 100% học phí. Điều kiện: Học sinh giỏi Quốc gia (trừ môn Ngoại ngữ).

2. HỌC BỔNG FPT NEXT GEN
Giá trị: Tương đương 20% học phí chuyên ngành.
Đối tượng: Dành riêng cho các thí sinh có bố hoặc mẹ đang có hợp đồng lao động chính thức tại các đơn vị thuộc Tập đoàn FPT hoặc học sinh tốt nghiệp THPT FPT, cao đẳng FPT Polytechnic và đáp ứng các điều kiện:
- Điểm trung bình lớp 11 hoặc học kỳ 1 hoặc cả năm lớp 12 từ 8.0 và điểm trung bình tiếng Anh từ 6.5 trở lên.
- Bố mẹ đang ký hợp đồng lao động tại các công ty thuộc FPT (FPT Telecom, FPT Retail, FPT Synex…) hoặc do FPT góp vốn trên 50%.
- Có thái độ tích cực, mong muốn đóng góp cho xã hội.

3. HỌC BỔNG KHI GIỮ CHỖ SỚM TẠI SỰ KIỆN (X-Day, Info Day)
Thí sinh giữ chỗ tại các sự kiện đặc biệt sẽ nhận thêm 1 trong 2 học bổng:
- Học bổng Taiwan Pathway: Trị giá 5.000.000 VNĐ (trừ trực tiếp vào học phí), dành cho 500 thí sinh giữ chỗ sớm nhất.
- Học bổng Taiwan Gateway: Chuyến kiến học tại Đài Loan trị giá 15.000.000 VNĐ, cấp sau khi khai giảng, dành cho 150 thí sinh giữ chỗ sớm nhất có IELTS >= 5.5.

4. THỦ TỤC VÀ QUY TRÌNH XÉT HỌC BỔNG
Việc xác định mức học bổng phụ thuộc vào kết quả sau 2 vòng:
- Vòng 1 (Xét hồ sơ): Thí sinh nộp hồ sơ online gồm kết quả học tập THPT, chứng chỉ tiếng Anh, hoạt động xã hội.
- Vòng 2 (Thi/Phỏng vấn): Thí sinh vượt qua Vòng 1 sẽ làm bài kiểm tra hoặc phỏng vấn đánh giá năng lực tư duy logic, sáng tạo.
- Xác nhận giữ chỗ: Thí sinh trúng học bổng cần nộp 4.600.000 VNĐ tiền giữ chỗ trong thời hạn thông báo. Nếu nộp đúng hạn, sẽ được miễn tiền dịch vụ tuyển sinh (4.600.000 VNĐ) và ưu đãi 50% học phí kỳ Công dân toàn cầu đầu tiên (15.000.000 VNĐ).

5. QUY ĐỊNH DUY TRÌ VÀ CÁC ĐIỀU KHOẢN KHÁC
- Học bổng chuyên ngành chỉ áp dụng cho các học kỳ chuyên ngành, trừ dần vào học phí.
- Sinh viên có thể bị giảm trừ học bổng nếu: rớt môn, lùi tiến độ quá 2 kỳ, vi phạm kỷ luật, điểm danh dưới 80%, hoặc vi phạm pháp luật.
- Tiền giữ chỗ học bổng sẽ không được hoàn lại nếu thí sinh đổi ý không nhập học.
- Khi chuyển tiếp sang Asia University Đài Loan, sinh viên vẫn được nhận tỷ lệ học bổng tương ứng do Hội đồng trường Đài Loan quyết định.
"""

conn = sqlite3.connect('backend/database.db')
c = conn.cursor()
c.execute("INSERT INTO knowledge_base (filename, content) VALUES (?, ?)", ("hoc_bong_2026.txt", content))
conn.commit()
conn.close()
print("Successfully inserted scholarship data into database.")
