---
description: Tạo một trang mới theo layout chuẩn, có đủ bản desktop và mobile
---

Đọc AGENTS.md trước. Sau đó tạo trang mới theo yêu cầu của người dùng.

1. Hỏi người dùng (nếu chưa nói): tên trang, đường dẫn, nội dung chính, dữ liệu lấy từ đâu.
2. Lập plan ngắn: file sẽ tạo/sửa, bố cục **desktop** và bố cục **mobile**. Chờ người dùng duyệt.
3. Tạo trang trong `src/pages/` dùng layout chung trong `src/layouts/`. Tái sử dụng component có sẵn, không nhân bản.
4. Có `<title>`, meta description tiếng Việt, một `<h1>`, `lang="vi"`.
5. Dữ liệu thay đổi được (số liệu, lãi suất, liên hệ) lấy từ `src/data/` hoặc content collection, không hard-code. Thiếu thì ghi `[CẦN BỔ SUNG]`.
6. Thêm trang vào menu và sitemap nếu phù hợp.
7. Chạy `npm run lint`, `npm run check`, `npm run build`. Kiểm tra giao diện ở 360 / 768 / 1280 / 1920px bằng trình duyệt (tối đa 3 vòng sửa).
8. Commit local (Conventional Commits), không push.
9. Báo cáo theo định dạng ở mục 10 của AGENTS.md.
