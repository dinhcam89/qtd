---
description: Chạy toàn bộ kiểm tra chất lượng và báo cáo kết quả
---

Đọc AGENTS.md. Chạy lần lượt và ghi lại kết quả từng bước:

1. `npm run lint`
2. `npm run check`
3. `npm run build`
4. `npm test` (Playwright + axe)
5. `npm run lhci` nếu đã cấu hình

Sau đó:
- Tìm số liệu/lãi suất/văn bản hard-code ngoài `src/data/` và content collections.
- Tìm tài nguyên bên thứ ba (script, font, CSS, ảnh từ domain khác).
- Tìm ảnh thiếu `alt`, trang thiếu `<h1>` hoặc meta description, link hỏng.
- Liệt kê tất cả chỗ còn `[CẦN BỔ SUNG]`.

**Không tự sửa** trừ khi người dùng yêu cầu. Báo cáo dạng bảng: Hạng mục | Kết quả (Đạt/Không đạt) | Ghi chú. Cuối cùng đưa ra danh sách việc cần sửa, sắp xếp theo mức độ ưu tiên.
