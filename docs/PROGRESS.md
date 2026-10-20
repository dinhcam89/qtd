# Tiến độ dự án — Website Quỹ tín dụng nhân dân [TÊN QUỸ]

> Tài liệu theo dõi tiến độ chi tiết theo lộ trình `docs/ROADMAP.md` và quy trình `/next-task`.

## 1. Bảng trạng thái tổng quan

| Task | Nội dung                                               | Trạng thái      | Ngày hoàn thành | Commit                          | Ghi chú                                                             |
| ---- | ------------------------------------------------------ | --------------- | --------------- | ------------------------------- | ------------------------------------------------------------------- |
| 1    | Scaffold Astro + Tailwind v4                           | Xong            | 2026-10-20      | `f29037f`                       | Nền tảng dự án, tooling, lint                                       |
| 2    | Schema Zod, dữ liệu placeholder, format.ts             | Xong            | 2026-10-20      | `e6eb322`                       | Zod schema, YAML, format vi-VN                                      |
| 3    | Collection news, layout, Header/Footer, trang chủ, 404 | Xong            | 2026-10-20      | `7aba935`, `b5598fd`, `63746e9` | Mọi tiêu chí đạt bằng lệnh; đã kiểm thử Playwright tự động ở Task 4 |
| 4    | Playwright, axe, _headers, check-dist                  | Xong            | 2026-10-20      | `65baddb`                       | Smoke test 3 viewports, a11y axe-core, CSP headers, check:dist pass |
| 5    | CI GitHub Actions                                      | Chưa làm        | —               | —                               | Task tiếp theo                                                      |
| 6    | Design system                                          | Chưa làm        | —               | —                               |                                                                     |
| 7    | Trang Giới thiệu và Ban lãnh đạo                       | Chưa làm        | —               | —                               |                                                                     |
| 8    | Trang Sản phẩm và Lãi suất                             | Chưa làm        | —               | —                               |                                                                     |
| 9    | Trang Tin tức và Thông báo                             | Chưa làm        | —               | —                               |                                                                     |
| 10   | Trang Quy chế và Biểu mẫu                              | Chưa làm        | —               | —                               |                                                                     |
| 11   | Trang Liên hệ                                          | Chưa làm        | —               | —                               |                                                                     |
| 12   | Decap CMS cấu hình                                     | Bỏ qua (CMS: A) | —               | —                               | Giữ theo quyết định CMS: A                                          |
| 13   | Cloudflare Access cho /admin                           | Bỏ qua (CMS: A) | —               | —                               | Giữ theo quyết định CMS: A                                          |
| 14   | SEO và Sitemap                                         | Chưa làm        | —               | —                               |                                                                     |
| 15   | Bảo mật và Lighthouse CI                               | Chưa làm        | —               | —                               |                                                                     |
| 16   | QA tổng và UAT                                         | Chưa làm        | —               | —                               |                                                                     |
| 17   | Go-live                                                | Chưa làm        | —               | —                               |                                                                     |
| 18   | Runbook                                                | Chưa làm        | —               | —                               |                                                                     |

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
- **Kiểm tra giao diện:** Đã xác nhận qua Playwright ở Task 4 (không cuộn ngang, menu hoạt động đúng).

---

## 3. Chi tiết đánh giá Task 4

- **Ngày đánh giá:** 2026-10-20
- **Kết quả đối chiếu tiêu chí hoàn thành (kiểm tra bằng lệnh):**
  1. `npm test` pass ở cả 3 project (desktop 1280x800, tablet 768x1024, mobile 360x640): **ĐẠT** (16 passed, 2 skipped).
  2. `npm run check:dist` thoát mã 0: **ĐẠT** (Quét toàn bộ dist không có script/style inline, không vỡ link, đầy đủ metadata h1/title/desc/lang/alt).
  3. Cố ý thêm `<script>` inline và `<img>` thiếu alt: `check:dist` fail (đã kiểm chứng và hoàn tác): **ĐẠT**.
  4. Cố ý thêm `<script src="https://example.com/x.js">`: test CSP fail (đã kiểm chứng và hoàn tác): **ĐẠT**.
  5. Không còn `[CẦN BỔ SUNG]` nào mới ngoài những chỗ đã có: **ĐẠT** (duy trì 33 placeholder).
- **Số placeholder hiện tại:** 33.
- **Việc người dùng cần làm tiếp:** Chạy Task 5 (CI GitHub Actions).
