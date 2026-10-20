---
description: Review thay đổi hiện tại (git diff) theo checklist nội dung, bảo mật và responsive
---

Đọc AGENTS.md. Xem `git diff` (và `git status`) của nhánh hiện tại, rồi đánh giá theo checklist. **Không sửa code**, chỉ báo cáo.

**Nội dung và dữ liệu**
- Có số liệu, lãi suất, tên người, điều khoản nào xuất hiện mà không có nguồn từ người dùng không?
- Số liệu có `as_of`, lãi suất có `effective_from` và dòng lưu ý không?
- Có dữ liệu cá nhân hoặc danh sách thành viên cá nhân không?

**Bảo mật**
- Có tài nguyên bên thứ ba, inline script, secret, token không?
- Có sửa `_headers`, CI, cấu hình CMS/xác thực ngoài yêu cầu không?
- Link ra ngoài có `rel="noopener noreferrer"` không?

**Responsive và truy cập**
- Có bản mobile hoàn chỉnh cho mọi thay đổi giao diện không? Có cuộn ngang cấp trang không?
- Heading, landmark, `alt`, tương phản, vùng bấm, focus có đạt không?

**Phạm vi**
- Diff có chứa thay đổi ngoài yêu cầu không? Có dependency mới không?

Kết quả: danh sách phát hiện chia theo mức **Chặn merge / Nên sửa / Gợi ý**, mỗi mục ghi rõ file và dòng.
