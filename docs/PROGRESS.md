# Tiến độ dự án — Website Quỹ tín dụng nhân dân [TÊN QUỸ]

> Tài liệu theo dõi tiến độ chi tiết theo lộ trình `docs/ROADMAP.md` và quy trình `/next-task`.
> **Ghi chú hạ tầng:** Hạ tầng thực tế là Cloudflare Workers Builds (static assets) trên domain `*.workers.dev`. Production dùng `npx wrangler deploy`, nhánh khác dùng `npx wrangler preview`, cấu hình ở `wrangler.jsonc` (có khối `previews`).

## 1. Bảng trạng thái tổng quan

| Task | Nội dung                                               | Trạng thái      | Ngày hoàn thành | Commit    | Ghi chú                                                                              |
| ---- | ------------------------------------------------------ | --------------- | --------------- | --------- | ------------------------------------------------------------------------------------ |
| 1    | Scaffold Astro + Tailwind v4                           | Xong            | 2026-10-20      | `f29037f` | Nền tảng dự án, tooling, lint                                                        |
| 2    | Schema Zod, dữ liệu placeholder, format.ts             | Xong            | 2026-10-20      | `e6eb322` | Zod schema, YAML, format vi-VN                                                       |
| 3    | Collection news, layout, Header/Footer, trang chủ, 404 | Xong            | 2026-10-20      | `63746e9` | Mọi tiêu chí đạt bằng lệnh; đã kiểm thử Playwright tự động ở Task 4                  |
| 4    | Playwright, axe, _headers, check-dist                  | Xong            | 2026-10-20      | `65baddb` | Smoke test 3 viewports, a11y axe-core, CSP headers, check:dist pass                  |
| 5    | CI GitHub Actions                                      | Xong            | 2026-10-20      | `1c9cda0` | Task 5 đạt; cấu hình CI chuẩn hóa mọi bước kiểm tra; Cổng G1 đã hoàn thành           |
| 6    | Design system                                          | Xong            | 2026-10-21      | `6ed277a` | Tokens, Be Vietnam Pro tự host, 7 UI components, check:contrast pass, G2 chờ duyệt   |
| 7    | Trang Giới thiệu và Ban lãnh đạo                       | Xong            | 2026-10-21      | `6553a03` | Collection pages, /gioi-thieu, /lich-su, /ban-lanh-dao, nav.ts động, 59/59 test pass |
| 8    | Trang Quy mô, Sản phẩm và Lãi suất                     | Xong            | 2026-10-21      | `6f988ed` | /quy-mo, /san-pham, /lai-suat, nav `primary`, 137 test pass                          |
| 9    | Trang Tin tức và Thông báo                             | Chưa làm        | —               | —         |                                                                                      |
| 10   | Trang Quy chế và Biểu mẫu                              | Chưa làm        | —               | —         |                                                                                      |
| 11   | Trang Liên hệ                                          | Chưa làm        | —               | —         |                                                                                      |
| 12   | Decap CMS cấu hình                                     | Bỏ qua (CMS: A) | —               | —         | Giữ theo quyết định CMS: A                                                           |
| 13   | Cloudflare Access cho /admin                           | Bỏ qua (CMS: A) | —               | —         | Giữ theo quyết định CMS: A                                                           |
| 14   | SEO và Sitemap                                         | Chưa làm        | —               | —         |                                                                                      |
| 15   | Bảo mật và Lighthouse CI                               | Chưa làm        | —               | —         |                                                                                      |
| 16   | QA tổng và UAT                                         | Chưa làm        | —               | —         |                                                                                      |
| 17   | Go-live                                                | Chưa làm        | —               | —         |                                                                                      |
| 18   | Runbook                                                | Chưa làm        | —               | —         |                                                                                      |

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
- **Việc người dùng cần làm tiếp:** Thực hiện các bước thủ công Cổng G1 (hoặc tiếp tục Task 6 nếu chưa làm G1).

---

## 4. Chi tiết đánh giá Task 5

- **Ngày đánh giá:** 2026-10-20
- **Kết quả đối chiếu tiêu chí hoàn thành (kiểm tra bằng lệnh):**
  1. File `.github/workflows/ci.yml` tồn tại và hợp lệ: **ĐẠT** (YAML hợp lệ, không lỗi cú pháp).
  2. Các lệnh trong workflow khớp 100% với `package.json`: **ĐẠT** (`npm ci`, `npm run lint`, `npm run check`, `npm run build`, `npm run check:dist`, `npm run check:placeholders`, `npx playwright install --with-deps chromium`, `npm test`).
  3. Không có token, secret, khóa bí mật nào trong file: **ĐẠT** (Không sử dụng bất kỳ secret nào; việc deploy do Cloudflare Workers Builds (static assets) độc lập đảm nhiệm qua `wrangler.jsonc` có khối `previews`).
  4. Cấu hình workflow đầy đủ các tiêu chuẩn:
     - Kích hoạt trên `push` và `pull_request` nhánh `main`.
     - `permissions: contents: read`.
     - `concurrency` hủy các lần chạy cũ khi có push mới.
     - Sử dụng Node.js theo `.nvmrc` (`actions/setup-node@v4` với cache `npm`).
     - `check:placeholders` chạy cảnh báo, không làm gián đoạn build.
     - Tự động upload artifact `playwright-report/` khi có test thất bại.
- **Số placeholder hiện tại:** 29 (toàn bộ nằm trong `src/data` và `src/content`, không còn placeholder cứng trong UI).
- **Đánh giá Task 5:** **ĐẠT**.
- **Việc người dùng cần làm tiếp:** Cổng G1 đã hoàn thành. Chuyển sang thực hiện Task 6.

---

## 5. Chi tiết đánh giá Task 6

- **Ngày đánh giá:** 2026-10-21
- **Kết quả đối chiếu tiêu chí hoàn thành (kiểm tra bằng lệnh):**
  1. `npm run check:contrast` thoát mã 0: **ĐẠT** (Toàn bộ 15/15 cặp màu thực tế sử dụng đều đạt WCAG AA và AAA; chữ thường ≥ 4.5:1, chữ lớn ≥ 3.0:1).
  2. `npm run check` (Astro check): **ĐẠT** (0 errors, 0 warnings, 0 hints trên 39 files).
  3. `npm run lint` (ESLint + Prettier check): **ĐẠT** (Toàn bộ codebase đúng quy chuẩn định dạng).
  4. `npm run build`: **ĐẠT** (Build tĩnh thành công, đóng gói toàn bộ tài nguyên font cục bộ cùng origin).
  5. `npm test` (Playwright + Axe accessibility): **ĐẠT** (20 passed, 1 skipped trên 3 viewports desktop, tablet, mobile).
  6. `npm run check:dist`: **ĐẠT** (Không có script/style inline, không vỡ liên kết, đầy đủ metadata SEO và a11y).
  7. Tự host font Be Vietnam Pro qua `@fontsource/be-vietnam-pro`: **ĐẠT** (Chỉ nạp subset `latin` và `vietnamese`, trọng số 400, 600, 700; CSP `font-src 'self'` pass 100%).
  8. Hệ thống 7 UI components nền tảng (`Container`, `Section`, `Button`/`LinkButton`, `StatItem`, `DataTable`, `Notice`, `Card`): **ĐẠT** (StatItem hỗ trợ null hiển thị 'Đang cập nhật' text-lg, DataTable chuyển thẻ mobile bằng data-label không cuộn ngang, Notice có icon SVG nhúng inline aria-hidden, câu lưu ý lãi suất ≥ 16px không in nghiêng).
  9. Kiểm tra hiển thị copyright Footer: **ĐẠT** (Đảm bảo khoảng trắng giữa năm và tên quỹ khớp `/©\s*\d{4}\s+\S/`).
  10. Chụp ảnh màn hình tự động `npm run shots`: **ĐẠT** (8 file ảnh chất lượng cao lưu tại `screenshots/` ở 360, 768, 1280, 1920px).
- **Số placeholder hiện tại:** 29 (duy trì toàn vẹn trong data và content, không phát sinh mới).
- **Đánh giá Task 6:** **ĐẠT**.
- **Việc người dùng cần làm tiếp:** Cổng G2 (Đã duyệt hoàn thành).

---

## 6. Chi tiết đánh giá Task 7

- **Ngày đánh giá:** 2026-10-21
- **Kết quả đối chiếu tiêu chí hoàn thành (kiểm tra bằng lệnh):**
  1. `npm run lint` (ESLint + Prettier check): **ĐẠT** (Codebase đúng định dạng, không lỗi ESLint hay cảnh báo Prettier).
  2. `npm run check` (Astro check): **ĐẠT** (0 errors, 0 warnings, 0 hints trên 43 files).
  3. `npm run build`: **ĐẠT** (Build tĩnh thành công 5 trang: `/`, `/404`, `/gioi-thieu`, `/lich-su`, `/ban-lanh-dao`).
  4. `npm run check:dist`: **ĐẠT** (Không có script/style inline, không vỡ liên kết, đầy đủ metadata SEO và a11y).
  5. `npm test` (Playwright + Axe accessibility): **ĐẠT** (59 passed, 1 skipped trên 3 viewports desktop, tablet, mobile).
  6. Kiểm tra vi phạm CSP cố ý (`<script is:inline src="https://example.com/x.js">`): **ĐẠT** (Cả `check:dist` và Playwright CSP assertions fail chuẩn xác, sau đó hoàn tác sạch sẽ).
  7. Danh sách trang trong `tests/smoke.spec.ts` và `tests/a11y.spec.ts` được lấy tự động từ `getNavRoutes()` trong `src/lib/nav.ts`, không hard-code thủ công: **ĐẠT**.
  8. Collection `pages` (Zod schema với `title`, `description`, `updated`) và 3 tài liệu markdown (`gioi-thieu.md`, `lich-su.md`, `su-menh.md`): **ĐẠT**.
  9. Không có số liệu, tên người, địa chỉ, số điện thoại hard-code ngoài `src/data` và `src/content`: **ĐẠT**.
  10. Ảnh thành viên ban lãnh đạo chỉ hiển thị khi có đường dẫn ảnh thật hợp lệ; khi null hoặc placeholder thì hiển thị avatar silhouette SVG trung tính: **ĐẠT**.
  11. Chụp ảnh màn hình tự động `npm run shots`: **ĐẠT** (20 file ảnh chất lượng cao lưu tại `screenshots/` ở 360, 768, 1280, 1920px cho 5 trang).
- **Số placeholder hiện tại:** 40 (duy trì toàn vẹn trong data và content collections, 0 placeholder trong mã giao diện).
- **Đánh giá Task 7:** **ĐẠT**.
- **Việc người dùng cần làm tiếp:** Tiếp tục chạy `/next-task` để thực hiện Task 8 (Trang Sản phẩm và Lãi suất).

---

## 7. Cập nhật sửa lỗi Layout & Typography các trang nội dung (Task 7)

- **Ngày thực hiện:** 2026-10-21
- **Vấn đề xử lý:**
  1. _Lỗi A (Layout):_ Khối nội dung chính và sidebar của các trang `/gioi-thieu`, `/lich-su`, `/ban-lanh-dao` tràn ra ngoài khung căn giữa (bắt đầu ở x=0 sát mép trình duyệt, chạm mép phải, cắt chữ trên mobile).
  2. _Lỗi B (Typography):_ Các đề mục markdown (`h2`, `h3`...) hiển thị như đoạn văn thường do preflight Tailwind v4 reset heading.
- **Giải pháp:**
  - Viết bộ test kiểm thử hình học trước (`tests/layout.spec.ts`) bắt trọn vẹn lỗi: kiểm tra `rect.left >= 0`, `rect.right <= viewportWidth`, căn đều `Left H1 = Left Content = Left Header/Footer Brand` (sai số ≤ 1px), giới hạn `p.width <= 820px`, kiểm tra `h2` có `font-weight >= 600` và `font-size >= 1.2 * p.fontSize`. Test đã FAIL đúng 100% trước khi sửa.
  - Sửa nguyên nhân gốc: Thêm thuộc tính `container?: boolean` cho component nền tảng `Section.astro`; bọc `Container` cho nội dung và sidebar của các trang `/gioi-thieu`, `/lich-su`, `/ban-lanh-dao`.
  - Bổ sung bộ class typography `.content-body` thuần trong `src/styles/global.css` sử dụng CSS variables hiện có, áp dụng cho phần nội dung markdown (không cài thêm gói ngoài).
- **Kết quả đối chiếu:**
  1. `npm test`: **82 passed**, 0 failed trên cả 3 profile desktop, tablet, mobile.
  2. `npm run check`: **0 errors, 0 warnings, 0 hints** trên 44 files.
  3. `npm run lint`: **ĐẠT** (ESLint + Prettier check pass 100%).
  4. `npm run build`: **ĐẠT** (Static build thành công 5 trang).
  5. `npm run check:dist` & `npm run check:contrast`: **ĐẠT 100%**.
  6. Kiểm tra ảnh màn hình `screenshots/` bằng mắt: Xác nhận các trang đã căn giữa chuẩn xác, lề đối xứng, đề mục nổi bật, không cắt viền/chữ ở cả 360px và 1280px.

---

## 8. Chi tiết đánh giá Task 8 (Quy mô, Sản phẩm, Lãi suất)

- **Ngày đánh giá:** 2026-10-21 (nhánh `task-8-quy-mo-san-pham-lai-suat`, tạo từ `origin/main` sau khi merge PR #7)
- **Commit:** `8a56bf4` (data), `305f682` (ui), `6f988ed` (pages), `870b76b` (nav), `29135bb` (test), `d7bdd99` (shots)
- **Kết quả:**
  1. Menu: `nav.ts` có `primary: boolean`; menu ngang desktop chỉ hiển thị 5 mục primary (tối đa 6); panel mobile và footer có đủ 8 mục: **ĐẠT**.
  2. Các mục menu trỏ thẳng `/quy-mo`, `/san-pham`, `/lai-suat`, `/#lien-he`; test bấm từng mục từ `/gioi-thieu` và không chứa `/gioi-thieu#`: **ĐẠT**.
  3. `/quy-mo`, `/san-pham`, `/lai-suat` dùng `PageHeader`, `Breadcrumb`, `Container` bọc khối `data-page-content`; test hình học `layout.spec.ts` tự phủ qua `getNavRoutes()`: **ĐẠT**. Ba trang mới chưa có nội dung markdown nên chưa dùng `.content-body`.
  4. Dữ liệu sản phẩm `src/data/products.yaml` là khung placeholder theo schema Zod; bảng lãi suất luôn kèm `RATE_DISCLAIMER` (trong `RatesTables`); "Thời điểm áp dụng" lấy từ `effective_from`, null thì "Đang cập nhật": **ĐẠT**.
  5. `tests/helpers.ts` không sửa; không làm yếu test nào: **ĐẠT**.
  6. `npm test`: 137 passed, 70 skipped (trước đó 82 passed, 41 skipped); `lint`, `check`, `build`, `check:dist`, `check:contrast` pass.
- **Số placeholder hiện tại:** 42 (thêm 2 trong `products.yaml`).
- **Việc người dùng cần làm tiếp:** cung cấp nội dung thật cho sản phẩm, lãi suất, số liệu quy mô (G3).
