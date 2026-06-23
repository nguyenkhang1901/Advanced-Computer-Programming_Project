# Asia University AI Admission Consultant 🎓🤖

Hệ thống tư vấn tuyển sinh tự động sử dụng Trí tuệ Nhân tạo (Google Gemini 2.5 Flash), được thiết kế dành riêng cho Asia University Vietnam.

## 🌟 Tính Năng Nổi Bật

### Dành cho Sinh viên (Frontend)
- **Hỗ trợ Song ngữ (Bilingual):** Chuyển đổi mượt mà giữa Tiếng Anh và Tiếng Việt. Giao diện và câu trả lời của AI sẽ thay đổi ngay lập tức.
- **Tư vấn AI Thời gian thực:** Giải đáp mọi thắc mắc về học phí, điều kiện xét tuyển, học bổng và chi tiết các ngành học.
- **Tự động thu thập thông tin (Lead Generation):** Form đăng ký tự động hiện ra sau 3 tin nhắn để mời sinh viên để lại thông tin (Tên, Email, SĐT, Ngành quan tâm).
- **Gợi ý Cá nhân hóa:** AI phân tích lịch sử trò chuyện và sở thích để đưa ra gợi ý ngành học/học bổng phù hợp nhất.

### Dành cho Quản trị viên (Admin)
- **Khu vực bảo mật:** Giao diện quản lý được bảo vệ bằng mật khẩu bảo mật (Truy cập bằng cách thêm `/admin` vào cuối đường dẫn link).
- **Quản lý Lead (Khách hàng tiềm năng):** Hiển thị danh sách sinh viên đã đăng ký. Hỗ trợ nút **Export CSV** để tải xuống Excel phục vụ gọi điện tư vấn.
- **Lịch sử Chat:** Lưu trữ và hiển thị toàn bộ nội dung trò chuyện giữa sinh viên và AI để Admin đánh giá và thấu hiểu nhu cầu.

### Cấu trúc Dữ liệu & Hệ thống
- **Nạp kiến thức động (Dynamic RAG):** Hệ thống không dùng Database phức tạp để lưu kiến thức. Thay vào đó, AI tự động nạp dữ liệu từ tất cả các file văn bản (`.txt`) nằm trong thư mục `data/Data_raw/`. Khi có thông tin tuyển sinh mới, chỉ cần thả file text vào đây là AI sẽ tự động học được.
- **Kiến trúc One-Port:** Backend NodeJS phục vụ cả API và giao diện React đã build trên cùng một cổng (Port 5000), dễ dàng public ra ngoài internet.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React.js (Vite), React Router, Lucide-react (Icons), React-markdown.
- **Backend:** Node.js, Express.js.
- **Cơ sở dữ liệu:** SQLite (Lưu trữ khách hàng và lịch sử chat cục bộ).
- **AI Engine:** `@google/genai` (Model: `gemini-2.5-flash`).
- **Triển khai:** Localtunnel (Public website ra internet).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Yêu cầu hệ thống:
- Cài đặt sẵn **Node.js** (Phiên bản 18 trở lên).
- Khởi tạo thư viện: Mở terminal tại thư mục `backend` và `frontend`, chạy lệnh `npm install`.

### 2. Thiết lập cấu hình API (Rất quan trọng):
Bởi vì lý do bảo mật, API Key thật đã được ẩn đi. Khi tải code về, bạn cần thiết lập như sau:
1. Vào thư mục `backend/`, tìm file có tên là `.env.example`.
2. Đổi tên file đó thành `.env`.
3. Mở file `.env` lên và thay thế dòng chữ `YOUR_GEMINI_API_KEY_HERE` bằng mã API Key Gemini của riêng bạn (Bạn có thể lấy mã này hoàn toàn miễn phí tại *Google AI Studio*).

### 3. Các bước khởi chạy (Dành cho Windows):
Dự án được tích hợp sẵn file khởi động nhanh cực kỳ tiện lợi.

1. Mở thư mục gốc của dự án.
2. Kích đúp vào file **`run.bat`**.
3. Chọn 1 trong 2 chế độ khởi chạy:

#### Chế độ [1]: Offline (Dành cho Lập trình viên)
- Khởi động Backend và Frontend ở 2 cửa sổ khác nhau (Chạy dạng Dev).
- Truy cập tại đường dẫn: `http://localhost:5173`
- Dữ liệu chỉnh sửa trong code sẽ được cập nhật ngay lập tức (Hot-reload).

#### Chế độ [2]: Online (Dành cho Triển khai / Demo)
- Tự động đóng gói (build) giao diện Frontend.
- Chạy Backend và Frontend chung trên 1 cổng duy nhất (Port 5000).
- Hệ thống tự động lấy địa chỉ IP của bạn.
- Hệ thống tự động khởi tạo **Localtunnel** và cung cấp một đường link dạng `https://xxx.loca.lt` để bạn gửi cho người khác truy cập vào.
- *(Mẹo: Khi người khác truy cập lần đầu, hãy cung cấp cho họ dãy số IP được hiển thị trên màn hình để họ vượt qua lớp bảo vệ của Localtunnel).*

---

## 🔒 Thông Tin Quản Trị (Admin)
- **Đường dẫn:** Đi tới link trang web và thêm `/admin` ở cuối (Ví dụ: `http://localhost:5173/admin` hoặc `https://xxx.loca.lt/admin`).
- **Mật khẩu mặc định:** `admin123`

---

## 📂 Quản Lý Kiến Thức AI
Để thêm hoặc cập nhật thông tin cho AI tư vấn (Lịch thi, chương trình học mới, học bổng...):
1. Mở thư mục `data/Data_raw/`.
2. Tạo một file `.txt` mới (hoặc chỉnh sửa file cũ) và dán nội dung văn bản vào.
3. Chạy lại file `run.bat` để AI cập nhật kiến thức mới.
