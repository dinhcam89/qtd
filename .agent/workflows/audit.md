---
description: Kiểm tra tổng hợp toàn dự án (chỉ đọc, không sửa, không commit) và xuất báo cáo
---

Đọc AGENTS.md và docs/ROADMAP.md (mục 1 và mục 0). Làm kiểm tra tổng hợp. KHÔNG sửa bất kỳ file nào, KHÔNG commit.

1. Chạy và dán OUTPUT THẬT: git status --short; git ls-files --eol (tìm crlf); npm ci; npm run lint; npm run check; npm run build; npm test; npm run check:dist; npm run check:placeholders; node scripts/check-placeholders.mjs --strict (ghi mã thoát). Lệnh nào chưa tồn tại thì ghi "chưa có".
2. So sánh các task trong docs/PROGRESS.md đánh dấu "Xong" với tiêu chí hoàn thành tương ứng trong ROADMAP.md: kiểm tra lại từng tiêu chí bằng lệnh, báo tiêu chí nào thực tế KHÔNG đạt dù PROGRESS ghi Xong.
3. Quét mã nguồn tìm:
   - số liệu, số điện thoại, tên người, lãi suất hard-code ngoài src/data và src/content
   - tài nguyên bên thứ ba (script, font, CSS, ảnh, iframe)
   - script hoặc style inline trong dist
   - `overflow-x: hidden` đặt trên html hoặc body
   - ảnh thiếu alt, link hỏng
   - dependency không nằm trong bảng "Gói đã duyệt trước" của các task đã làm
   - file thuộc nhóm "chỉ sửa khi được yêu cầu" bị đổi ngoài task tương ứng
4. Xuất bảng: Hạng mục | Kết quả (Đạt/Không đạt) | Bằng chứng | Mức độ (Chặn / Nên sửa / Gợi ý). Cuối cùng liệt kê tối đa 10 việc nên làm tiếp theo, xếp theo ưu tiên.
