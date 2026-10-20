# Tiến độ dự án — Website Quỹ tín dụng nhân dân [TÊN QUỸ]

> Tài liệu theo dõi tiến độ chi tiết theo lộ trình `docs/ROADMAP.md` và quy trình `/next-task`.

## 1. Bảng trạng thái tổng quan

| Task | Nội dung                                               | Trạng thái      | Ngày hoàn thành | Commit                          | Ghi chú                                                                                          |
| ---- | ------------------------------------------------------ | --------------- | --------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1    | Scaffold Astro + Tailwind v4                           | Xong            | 2026-10-20      | `f29037f`                       | Nền tảng dự án, tooling, lint                                                                    |
| 2    | Schema Zod, dữ liệu placeholder, format.ts             | Xong            | 2026-10-20      | `e6eb322`                       | Zod schema, YAML, format vi-VN                                                                   |
| 3    | Collection news, layout, Header/Footer, trang chủ, 404 | Xong            | 2026-10-20      | `7aba935`, `b5598fd`, `63746e9` | Mọi tiêu chí đạt bằng lệnh; chưa kiểm tra bằng trình duyệt, sẽ được Playwright ở Task 4 kiểm tra |
| 4    | Playwright, axe, _headers, check-dist                  | Chưa làm        | —               | —                               | Chờ điều kiện môi trường trước Task 4                                                            |
| 5    | CI GitHub Actions                                      | Chưa làm        | —               | —                               |                                                                                                  |
| 6    | Design system                                          | Chưa làm        | —               | —                               |                                                                                                  |
| 7    | Trang Giới thiệu và Ban lãnh đạo                       | Chưa làm        | —               | —                               |                                                                                                  |
| 8    | Trang Sản phẩm và Lãi suất                             | Chưa làm        | —               | —                               |                                                                                                  |
| 9    | Trang Tin tức và Thông báo                             | Chưa làm        | —               | —                               |                                                                                                  |
| 10   | Trang Quy chế và Biểu mẫu                              | Chưa làm        | —               | —                               |                                                                                                  |
| 11   | Trang Liên hệ                                          | Chưa làm        | —               | —                               |                                                                                                  |
| 12   | Decap CMS cấu hình                                     | Bỏ qua (CMS: A) | —               | —                               | Giữ theo quyết định CMS: A                                                                       |
| 13   | Cloudflare Access cho /admin                           | Bỏ qua (CMS: A) | —               | —                               | Giữ theo quyết định CMS: A                                                                       |
| 14   | SEO và Sitemap                                         | Chưa làm        | —               | —                               |                                                                                                  |
| 15   | Bảo mật và Lighthouse CI                               | Chưa làm        | —               | —                               |                                                                                                  |
| 16   | QA tổng và UAT                                         | Chưa làm        | —               | —                               |                                                                                                  |
| 17   | Go-live                                                | Chưa làm        | —               | —                               |                                                                                                  |
| 18   | Runbook                                                | Chưa làm        | —               | —                               |                                                                                                  |

---

## 2. Chi tiết đánh giá Task 3

- **Ngày đánh giá:** 2026-10-20
- **Kết quả đối chiếu tiêu chí hoàn thành (kiểm tra bằng lệnh):**
  1. `npm run lint`, `npm run check`, `npm run build`: **ĐẠT** (0 lỗi, 0 cảnh báo, 0 hint).
  2. Không có `<script>` inline trong `dist/**/*.html`: **ĐẠT** (`Get-ChildItem dist -Recurse -Filter *.html | Select-String -Pattern '<script(?![^>]*\ssrc=)'` không có kết quả).
  3. Không có `<style>` inline trong `dist/**/*.html`: **ĐẠT** (`Get-ChildItem dist -Recurse -Filter *.html | Select-String -Pattern '<style'` không có kết quả).
  4. Không có số điện thoại, năm, số tiền, lãi suất hard-code trong `src/pages` và `src/components`: **ĐẠT** (Mọi dữ liệu nạp động từ collections qua `src/lib/data.ts`).
  5. Bài tin mẫu `draft: true` không xuất hiện trong `dist`: **ĐẠT** (Quét không có trong `dist/**/*.html`).
  6. Tồn tại đầy đủ 4 file: `src/pages/404.astro`, `src/lib/data.ts`, `src/lib/nav.ts`, `src/lib/news.ts`: **ĐẠT**.
- **Kiểm tra giao diện:** Chưa kiểm tra bằng trình duyệt, sẽ được Playwright ở Task 4 kiểm tra.
- **Số placeholder hiện tại:** 33.
- **Việc người dùng cần làm tiếp:** Xác nhận các điều kiện trước khi bắt đầu Task 4 trong `docs/ROADMAP.md` (giải quyết CRLF/`.gitattributes`).
