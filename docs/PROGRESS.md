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
| 9    | Quy chế và văn bản                                     | Xong            | 2026-10-21      | `8a48c1c` | Collection documents, /quy-che, nhóm tài liệu, test build fail, 150 test pass        |
| 10   | Tin tức và Thông báo                                   | Xong            | 2026-10-22      | `3f7c75f` | /tin-tuc, /thong-bao, fixture news/schedule, pagination, check-dist động             |
| 11   | Liên hệ và Kênh chính thức                             | Xong            | 2026-10-22      | `4e11c50` | /lien-he, /kenh-chinh-thuc, fixture contact/site/pages, check-dist iframe/tel/mailto |
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

---

## 9. Chi tiết đánh giá Task 9 (Quy chế và văn bản)

- **Ngày đánh giá:** 2026-10-21 (nhánh `task-9-quy-che`, tạo từ `main` sau khi merge Task 8)
- **Commit:**
  - `af491c7`: `test(layout): make 1024px header test fail on overloaded menu (brand wrap and min gap)`
  - `40a15ca`: `style(layout): format layout.spec.ts`
  - `8a48c1c`: `feat(documents): implement collection documents and page /quy-che with group download list`
- **Kết quả đối chiếu tiêu chí hoàn thành:**
  1. **Bước 0:**
     - Đã giải thích và chứng minh test header 1024px: bổ sung đo số dòng của brand và khoảng cách brand-menu (>= 16px). Đã chứng minh test FAIL khi quá tải (received 0px < 16px) và PASS khi ở trạng thái chuẩn.
     - Kiểm tra `getNavRoutes()`: Mọi test `layout.spec.ts`, `smoke.spec.ts`, `a11y.spec.ts` đều dùng `getNavRoutes()` (bao gồm `/404`), tự động bao phủ trang mới `/quy-che`.
  2. **Task 9:**
     - Collection `documents` với Zod schema (`title`, `date`, `file`, `category`). Validate file tồn tại trong `public/docs/`.
     - Đã chứng minh bằng chứng build FAIL khi trỏ tới file không tồn tại (`InvalidContentEntryDataError`), sau đó hoàn tác sạch sẽ.
     - Link tải: Định dạng đầy đủ mô tả `Tải xuống: <tên> (PDF, <dung lượng>)`, cùng origin, có `rel="noopener noreferrer"`.
     - `check:dist` kiểm tra link nội bộ tới file `.pdf` trong `dist`. Đã chứng minh bằng chứng FAIL khi thêm link PDF hỏng vào HTML trong dist, sau đó hoàn tác.
     - Dung lượng tính lúc build từ file thực tế qua `formatFileSize` trong `src/lib/format.ts` theo chuẩn vi-VN.
     - `/quy-che` đã khai báo trong `nav.ts` (`primary: false`), có thẻ liên kết ở `/gioi-thieu`, footer hiển thị đầy đủ.
     - Cấu trúc trang chuẩn: `Container`, `PageHeader`, `Breadcrumb`, `data-page-content`.
     - Test trang: có h1, trạng thái rỗng hiển thị "Đang cập nhật", không có liên kết tới file rác/không tồn tại.
  3. **Không làm yếu test:**
     - Số lượng assertions toàn bộ bộ test: 156 (trước task) -> 165 (sau task).
  4. **Kiểm tra chất lượng:**
     - Toàn bộ `npm run verify` PASS (lint, check, build, test, check:dist, check:contrast, check:placeholders, eol).
     - Test Playwright: 150 passed, 2 skipped, 0 failed.
- **Số placeholder hiện tại:** 42.
- **Việc người dùng cần làm tiếp:** Chuẩn bị các file văn bản PDF thật (điều lệ, quy chế, biểu mẫu...) đưa vào `public/docs/` và khai báo nội dung tương ứng vào `src/content/documents/`.

---

## 10. Chi tiết đánh giá Task 10 (Tin tức và Thông báo)

- **Ngày đánh giá:** 2026-10-22 (nhánh `task-10-tin-tuc-thong-bao`, tạo từ `main`)
- **Các commit:**
  - `83ee4cf`: `feat(lib): add pure paginate function and PAGE_SIZE with unit tests`
  - `fb19b73`: `feat(fixtures): extend fixture mode to news and schedule with test data and helpers`
  - `f5b0293`: `feat(news): add /tin-tuc list with pagination, detail pages and fixture tests`
  - `95d75a4`: `feat(notices): add /thong-bao page with schedule, holidays and latest notices plus fixture tests`
  - `fabfe73`: `feat(nav): add /tin-tuc (primary) and /thong-bao to nav and footer, update home and intro links`
  - `39fbb65`: `feat(scripts): extend check-dist for dynamic routes and test:fixtures, skip fixtures in check-placeholders`
  - `0d5e17a`: `test(pages): add empty state tests for /tin-tuc and /thong-bao plus draft leak prevention test`
- **Kết quả đối chiếu tiêu chí hoàn thành:**
  1. **Phân trang (`src/lib/pagination.ts`):** Hàm thuần trả về `items`, `page`, `totalPages`, `hasPrev`, `hasNext`. `PAGE_SIZE = 10` đặt tại `src/lib/constants.ts`. Unit test bao phủ toàn bộ các biên: 0 bài, 1 bài, đúng 10, 11, 20, 21 bài, `page < 1` hoặc `page > totalPages`, `pageSize` không hợp lệ (RangeError). URL: trang 1 là `/tin-tuc/`, các trang sau là `/tin-tuc/trang/[page]/`, chi tiết là `/tin-tuc/[slug]/` không xung đột với `trang`.
  2. **Trang `/tin-tuc`:** Lọc bỏ hoàn toàn draft qua `filterPublishedNews`, sắp xếp `pubDate` mới trước (trùng ngày thì theo `id` ổn định). Mỗi mục dùng `Card`: tiêu đề (link), ngày `dd/mm/yyyy`, nhãn category tiếng Việt ("Tin tức", "Thông báo", "Hoạt động"), description, ảnh nếu có kèm `alt`. Điều khiển phân trang bằng `<nav aria-label="Phân trang tin tức">`, `aria-current="page"`, liên kết Trước/Sau chỉ hiện khi có. Trạng thái rỗng hiển thị `[data-news-empty]` "Đang cập nhật".
  3. **Trang chi tiết (`/tin-tuc/[slug]`):** Dùng `PageHeader`, `Breadcrumb` (Trang chủ > Tin tức > tiêu đề), nội dung markdown trong `.content-body`, ảnh minh họa kèm `alt`, liên kết "Quay lại danh sách" và "Bài trước/Bài sau" theo thứ tự thời gian. Lỗi build rõ ràng nếu trùng slug hoặc dùng slug dành riêng `trang`.
  4. **Trang `/thong-bao`:** (i) Lịch làm việc thường xuyên từ `schedule.yaml`, (ii) danh sách ngày nghỉ sắp xếp theo ngày bắt đầu tăng dần, trường null hiển thị "Đang cập nhật", (iii) 5 bài mới nhất thuộc category `thong-bao` kèm liên kết "Xem tất cả" về `/tin-tuc/`. Không dùng ngày build để ẩn/hiện hoặc gắn nhãn sắp tới/đã qua.
  5. **Điều hướng (Nav & Footer):** `/tin-tuc` `primary: true` (menu ngang đúng 6 mục: Trang chủ, Giới thiệu, Sản phẩm, Lãi suất, Tin tức, Liên hệ). `/thong-bao` `primary: false`, xuất hiện trong menu mobile, footer và có thẻ liên kết ở `/tin-tuc` và `/gioi-thieu`. Test 1024px trong `layout.spec.ts` pass 100% với 6 mục. `getNavRoutes()` tự động bao phủ `/tin-tuc` và `/thong-bao` trong smoke, a11y, layout.
  6. **Fixture và kiểm thử fixture:** Tạo >= 23 bài công khai (3 trang), bài tiêu đề >= 120 ký tự, bài có ảnh với `alt`, bài markdown phong phú (h2, h3, danh sách, bảng, trích dẫn, link), >= 5 bài `thong-bao`, >= 2 bài `draft: true` (không lọt vào bất kỳ trang nào), 2 bài trùng ngày đăng. Schedule fixture gồm lịch thường xuyên và 4 kỳ nghỉ (1 kỳ có trường null). Chế độ `QTD_FIXTURES` mở rộng cho cả collection `news` và `schedule`.
  7. **Check-dist cho trang động:** `scripts/check-dist.mjs` nhận tham số thư mục kiểm tra (mặc định `dist`), bỏ qua quy tắc cấm `[FIXTURE]` khi chạy với `dist-fixtures`. Tích hợp vào `npm run test:fixtures`. Đã chứng minh bắt lỗi link nội bộ hỏng (24 lỗi khi cố ý đổi link "Bài sau" sang bài không tồn tại) và hoàn tác sạch sẽ.
  8. **Kiểm tra placeholder:** `scripts/check-placeholders.mjs` bỏ qua thư mục `fixtures`, giữ nguyên 42 placeholder sản phẩm/lãi suất/lãnh đạo/lịch/site của repo.
  9. **Chế độ rỗng production:** Đã kiểm thử `/tin-tuc` và `/thong-bao` hiển thị "Đang cập nhật" gọn gàng; bài mẫu `draft: true` trong `src/content/news` không xuất hiện trong bất kỳ file nào của `dist`.
  10. **Không làm yếu test & số assertion:** Toàn bộ bộ test không sửa `tests/helpers.ts`, số assertion tăng từ 257 lên 426 (+169 assertion).
- **Số placeholder hiện tại:** 42.
- **Việc người dùng cần làm tiếp:** Tiếp tục chuẩn bị nội dung cho Task 11 (Liên hệ và Kênh chính thức).

---

## 11. Chi tiết đánh giá Task 11 (Liên hệ và Kênh chính thức)

- **Ngày đánh giá:** 2026-10-22 (nhánh `task-11-lien-he-kenh-chinh-thuc`, tạo từ `main`)
- **Các commit:**
  - `2fa66a2`: `feat: them lenh shots:fixtures chup anh giao dien co du lieu`
  - `9414c6b`: `feat(scripts): bo sung kiem tra iframe va href tel mailto trong check-dist`
  - `4e11c50`: `feat(pages): cai dat trang Lien he va Kenh chinh thuc theo Task 11`
- **Kết quả đối chiếu tiêu chí hoàn thành:**
  1. **Schema & Dữ liệu:**
     - `src/lib/schemas/contact.ts`: Thêm schema `branches` gồm `name`, `address`, `phone`, `working_hours` (mọi trường cho phép nullable/optional). Khai báo trong `contact.yaml` là `branches: []`.
     - `src/lib/schemas/site.ts`: Thêm trường `official_domain` với regex kiểm tra hostname chuẩn, cấm `https://` và đường dẫn con. Khai báo trong `site.yaml` là `official_domain: null`.
  2. **Hàm thuần (`src/lib/contact.ts`) & Unit tests:**
     - `toTelHref(value)`: Chuẩn hóa số điện thoại bỏ khoảng trắng, dấu chấm, dấu gạch ngang; hỗ trợ đầu `0` và `+84`; kiểm tra độ dài chữ số; trả về `null` cho dữ liệu lỗi/placeholder/chữ/quá ngắn.
     - `toMailtoHref(value)`: Chuẩn hóa email, trả về `null` khi email sai cú pháp hoặc là placeholder.
     - `buildMapUrl(address)`: Tạo liên kết Google Maps Search an toàn (`https://www.google.com/maps/search/?api=1&query=...`), trả về `null` khi thiếu địa chỉ hoặc là placeholder.
     - `buildOfficialDomainUrl(domain)`: Tạo URL `https://<domain>` an toàn khi hostname hợp lệ, trả về `null` khi có protocol/path/ký tự lạ/placeholder.
     - `formatContactText(value)`: Định dạng chuỗi liên hệ, trả về `'Đang cập nhật'` khi giá trị là `null`, `undefined`, rỗng hoặc placeholder.
     - Đầy đủ 25 unit tests (trong đó có 7 bài test mới cho `contact.ts`) bao phủ mọi trường hợp biên.
  3. **Trang `/lien-he`:**
     - Hiển thị thông tin trụ sở chính: Địa chỉ, Số điện thoại, Đường dây nóng, Hộp thư điện tử, Lịch làm việc thường xuyên (từ `schedule.yaml`).
     - Danh sách các điểm giao dịch (`branches`) khi có dữ liệu; trường null hiển thị "Đang cập nhật".
     - Liên kết "Xem bản đồ trên Google Maps" mở tab mới (`target="_blank"`, `rel="noopener noreferrer"`).
     - Tuyệt đối không nhúng `<iframe>`, không tải tài nguyên bên thứ ba, không có form thu thập dữ liệu.
     - Thẻ `a[href^="tel:"]` và `a[href^="mailto:"]` chỉ sinh ra khi hàm chuẩn hóa trả về URL hợp lệ; ngược lại hiển thị văn bản tĩnh hoặc "Đang cập nhật".
  4. **Trang `/kenh-chinh-thuc`:**
     - Đọc nội dung Markdown trung tính từ collection `pages` (`src/content/pages/kenh-chinh-thuc.md`) với các đề mục chuẩn: "Cách nhận biết kênh chính thức của quỹ", "Nếu bạn nghi ngờ bị giả mạo". Sử dụng placeholder `[CẦN BỔ SUNG: ...]` để chặn xuất bản production nhầm khi chưa duyệt.
     - Khối thông tin nhận diện: Tên miền website chính thức, Hotline, Điện thoại, Email, Địa chỉ trụ sở.
  5. **Điều hướng (Nav & Footer):**
     - `/lien-he` có `primary: true` (menu ngang đúng 6 mục: Trang chủ, Giới thiệu, Sản phẩm, Lãi suất, Tin tức, Liên hệ).
     - `/kenh-chinh-thuc` có `primary: false`, liên kết từ banner tại `/lien-he` và trong Footer.
     - Mọi liên kết không còn trỏ về neo `#lien-he` của trang chủ (nút Hero trên trang chủ đã trỏ về `/lien-he`).
     - Test responsive 1024px trong `tests/layout.spec.ts` pass 100% không tràn và không xuống dòng.
  6. **Fixture & Mở rộng `QTD_FIXTURES`:**
     - Mở rộng hỗ trợ fixture cho `contact`, `site` và `pages` trong `src/content.config.ts`.
     - Bộ dữ liệu `src/fixtures/`: 3 điểm giao dịch, 1 địa chỉ rất dài (kiểm tra wrap text và tràn ngang), 1 branch có trường null, 1 số điện thoại viết kiểu `0123.456.789`, tên miền `fixture.example.invalid`. Mọi tên định danh có tiền tố `[FIXTURE]`.
     - Fixture tests (`tests/fixtures/lien-he.spec.ts`, `tests/fixtures/kenh-chinh-thuc.spec.ts`) kiểm tra chi tiết href `tel:` và `mailto:`, link Google Maps, không có iframe, địa chỉ dài không tràn, hình học khớp khung Container, không rò rỉ `[FIXTURE]` ra ngoài `dist-fixtures`.
  7. **Hàng rào kiểm soát chất lượng (`scripts/check-dist.mjs`):**
     - Bổ sung quy tắc cấm hoàn toàn thẻ `<iframe>` trong toàn bộ file HTML xuất xưởng (`dist` và `dist-fixtures`).
     - Bổ sung quy tắc kiểm tra định dạng hợp lệ của mọi `href="tel:..."` và `href="mailto:..."`.
     - Đã chứng minh bằng 2 lần cố ý làm fail (chèn iframe giả và chèn href tel sai) và hoàn tác sạch sẽ.
  8. **Chế độ rỗng production:**
     - Kiểm thử trong `tests/pages.spec.ts` chứng minh cả hai trang `/lien-he` và `/kenh-chinh-thuc` ở production không có bất kỳ thẻ `a[href^="tel:"]`, `a[href^="mailto:"]`, không có link bản đồ hay iframe, hiển thị "Đang cập nhật" chuẩn chỉnh.
  9. **Số assertion:**
     - Trước task: 426 assertion.
     - Sau task: 565 assertion (+139 assertion).
- **Số placeholder hiện tại:** 44 (thêm 2 placeholder trường nội dung cho `site.official_domain` và frontmatter bản nháp).
- **Việc người dùng cần làm tiếp:** Chuẩn bị tên miền thật và thông tin điểm giao dịch của quỹ, chuẩn bị cho Task 14 (SEO và Sitemap).

