# ROADMAP — Website Quỹ tín dụng nhân dân [TÊN QUỸ]

> Cách dùng: khi nhận một task, agent đọc `AGENTS.md`, mục **1. Giao thức chung** và **đúng mục của task đó** trong file này. Không cần đọc toàn bộ file (tiết kiệm token).
> Nguyên tắc: mọi tiêu chí hoàn thành đều **kiểm tra bằng lệnh**. Agent phải dán kết quả thật của lệnh vào báo cáo, không tóm tắt bằng lời.
> **Ghi chú hạ tầng:** Hạ tầng thực tế là Cloudflare Workers Builds (static assets) trên domain `*.workers.dev`. Production dùng `npx wrangler deploy`, nhánh khác dùng `npx wrangler preview`, cấu hình ở `wrangler.jsonc` (có khối `previews`).

## 0. Trạng thái

| Task  | Nội dung                                                                    | Trạng thái      |
| ----- | --------------------------------------------------------------------------- | --------------- |
| 1     | Scaffold Astro + Tailwind v4                                                | Xong            |
| 2     | Schema Zod, dữ liệu placeholder, `format.ts`, `check-placeholders --strict` | Xong            |
| 3     | Collection `news`, Header/Footer, trang chủ, 404                            | Xong            |
| 4     | Playwright, axe, `_headers`, `check-dist`                                   | Xong            |
| 5     | CI GitHub Actions                                                           | Xong            |
| 6     | Design system                                                               | Xong            |
| 7     | Giới thiệu và Ban lãnh đạo                                                  | Xong            |
| 8     | Quy mô, Sản phẩm, Lãi suất                                                  | Xong            |
| 9     | Quy chế và văn bản                                                          | Xong            |
| 9b    | Test trạng thái có dữ liệu                                                  | Xong            |
| 10    | Tin tức và Thông báo                                                        | Xong            |
| 11    | Các trang nội dung (Liên hệ, Kênh chính thức)                               | Xong            |
| 12–13 | CMS (có điều kiện)                                                          | Bỏ qua (CMS: A) |
| 14    | SEO và Sitemap                                                              | Xong            |
| 15    | Bảo mật, hiệu năng, bảo trì                                                 | Xong            |
| 16    | QA tổng, UAT                                                                | Chưa làm        |
| 17    | Go-live                                                                     | Chưa làm        |
| 18    | Runbook                                                                     | Chưa làm        |

**Điều kiện trước khi bắt đầu Task 4 (người dùng xác nhận):**

- [ ] `AGENTS.md` có mục 4.1 (môi trường) và các số mục khớp với chỗ tham chiếu
- [ ] Repo có `.gitattributes` (`* text=auto eol=lf`), `.editorconfig`, Prettier `endOfLine: "lf"`
- [ ] `git ls-files --eol` không còn dòng nào có `crlf`
- [ ] Task 3 đã commit và `lint`, `check`, `build` pass

## 1. Giao thức chung (áp dụng cho mọi task)

**Bắt đầu**

1. Đọc `AGENTS.md`, mục này, và mục của task. Tóm tắt hiểu biết trong tối đa 5 dòng, kèm danh sách file sẽ tạo/sửa.
2. Task ghi "Cần duyệt plan" thì dừng chờ người dùng. Các task còn lại thì làm luôn.

**Trong khi làm** 3. Chỉ làm đúng phạm vi task. Không "tiện tay" thêm việc. 4. Chỉ cài gói trong bảng **Gói đã duyệt trước** của đúng task đó. Gói khác: dừng và hỏi. 5. Ghi file bằng công cụ ghi file của IDE. Một cách ghi file lỗi 2 lần thì dừng và báo. 6. Không đọc `node_modules` trừ khi bắt buộc. Khám phá tối đa 15 lệnh. 7. Kiểm tra bằng trình duyệt tối đa **một lần ở cuối task**, tối đa 3 vòng sửa mỗi vấn đề.

**Kết thúc (bắt buộc, theo thứ tự)** 8. Chạy `npm run lint`, `npm run check`, `npm run build`, `npm test` (nếu đã có), `npm run check:dist` (nếu đã có). **Dán nguyên output** của từng lệnh. 9. Chạy `git ls-files --eol` và xác nhận không có `crlf`. 10. Chạy `/qa`, rồi `/review` trên `git diff` của task. Sửa mọi phát hiện mức "Chặn merge". Mức "Nên sửa" thì sửa nếu dưới 10 phút, không thì ghi vào báo cáo. 11. Commit local (Conventional Commits), **không push**. 12. Báo cáo theo mục "Quy trình làm việc của agent" trong `AGENTS.md`, thêm: output lệnh (bước 8), danh sách gói đã thêm, và kết quả đối chiếu **Tiêu chí hoàn thành** của task (từng dòng Đạt/Không đạt).

**Dừng và hỏi (không tự quyết) khi**

- Cần dữ liệu thật (số liệu, tên người, lãi suất, văn bản pháp lý, địa chỉ) mà chưa có trong repo
- Cần sửa file thuộc nhóm "chỉ sửa khi được yêu cầu" mà task không nêu
- Có chỗ trong `AGENTS.md` mâu thuẫn với task
- Kiểm tra thất bại 3 lần mà chưa rõ nguyên nhân

**Quyết định của người dùng về truy cập (accessibility):** không cần kiểm tra thủ công bằng bàn phím/trình đọc màn hình. Vẫn giữ HTML ngữ nghĩa, tương phản đủ đọc, vùng bấm ≥ 44px. Test tự động axe chỉ cần fail với lỗi mức `serious` và `critical`.

## 2. Cổng duyệt của con người (không tự động hóa được)

| Cổng | Sau task | Người dùng phải làm                                                                                                               |
| ---- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| G1   | 5        | Tạo repo GitHub, branch protection, kết nối Cloudflare Workers Builds (static assets), kiểm tra header trên bản preview (Đã xong) |
| G2   | 6        | Xem giao diện thực trên điện thoại và máy tính, duyệt phong cách                                                                  |
| G3   | 11       | Điền nội dung thật, người của quỹ duyệt từng trang                                                                                |
| G4   | 13       | Thiết lập OAuth, Cloudflare Access (nếu làm CMS)                                                                                  |
| G5   | 16       | Duyệt bảo mật tài khoản và kết quả QA, người của quỹ ký xác nhận                                                                  |
| G6   | 17       | Mua và cấu hình domain, go-live, kiểm tra sau go-live                                                                             |

## 3. Gói đã duyệt trước

Agent chỉ cài những gói này, và chỉ ở task tương ứng. Nếu gói không tồn tại hoặc không tương thích: dừng và hỏi, không tự chọn gói thay thế.

| Task  | Gói                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------- |
| 4     | `@playwright/test`, `@axe-core/playwright` (devDependencies)                                                |
| 6     | Một gói font tự host dạng npm có bộ ký tự tiếng Việt (ví dụ họ `@fontsource`), nếu không có thì dừng và hỏi |
| 14    | `@astrojs/sitemap`                                                                                          |
| 15    | `@lhci/cli` (devDependency)                                                                                 |
| 12–13 | Chưa duyệt trước, quyết định riêng                                                                          |

---

## Task 3 — Collection news, layout, trang chủ (đang làm)

**Tiêu chí hoàn thành (kiểm tra bằng lệnh):**

- `npm run lint`, `npm run check`, `npm run build` pass
- `Get-ChildItem dist -Recurse -Filter *.html | Select-String -Pattern '<script(?![^>]*\ssrc=)'` không có kết quả
- `Get-ChildItem dist -Recurse -Filter *.html | Select-String -Pattern '<style'` không có kết quả
- `rg` hoặc `Select-String` trong `src/pages` và `src/components` không có số điện thoại, năm, số tiền, lãi suất hard-code
- Bài tin mẫu `draft: true` không xuất hiện trong `dist`
- Có `src/pages/404.astro`, `src/lib/data.ts`, `src/lib/nav.ts`, `src/lib/news.ts`

**Người dùng kiểm tra tay (5 phút):** chế độ thiết bị 360px, bấm hamburger mở rồi đóng, bấm một link thì menu tự đóng, tắt JS vẫn thấy link, không cuộn ngang.

---

## Task 4 — Kiểm thử tự động, security headers, check-dist

**Model/chế độ:** Planning (Gemini Pro Medium) rồi thực thi (Flash hoặc Pro Low/Medium). **Cần duyệt plan:** không.

**Việc cần làm**

1. Cài gói đã duyệt trước, chạy `npx playwright install chromium`.
2. `playwright.config.ts`: web server là bản build + `astro preview`, 3 project viewport: desktop 1280×800, tablet 768×1024, mobile 360×640.
3. `tests/smoke.spec.ts` (chạy trên cả 3 project):
   - Mỗi trang: `<title>` không rỗng, đúng một `<h1>`, `html[lang="vi"]`, meta description không rỗng
   - Không cuộn ngang: `document.documentElement.scrollWidth <= clientWidth`
   - Mobile: bấm hamburger thì `aria-expanded` đổi, bấm một link thì panel đóng
   - Không có `console.error`
   - Trang 404 trả nội dung có link về trang chủ
4. `tests/a11y.spec.ts`: quét axe mỗi trang ở 3 viewport, chỉ fail với `serious` và `critical`.
5. **Áp `_headers` vào test** (vì `astro preview` không đọc `_headers`): trong test, dùng `page.route` để thêm các header từ khối `/*` của `public/_headers` vào mọi response, rồi fail test nếu console có thông báo vi phạm Content Security Policy.
6. `public/_headers` (task này được phép tạo): CSP `default-src 'self'` kèm `script-src 'self'`, `style-src 'self'`, `img-src 'self' data:`, `font-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`; `Strict-Transport-Security: max-age=31536000` (chưa dùng `includeSubDomains`/`preload`); `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` tắt camera, microphone, geolocation. Thêm khối chặn index cho host `*.pages.dev` bằng `X-Robots-Tag: noindex`: **kiểm tra cú pháp đúng trong docs hiện hành của Cloudflare Pages** (cú pháp placeholder host) trước khi viết.
7. `public/robots.txt`: `User-agent: *` và `Allow: /`. Dòng `Sitemap` thêm ở Task 14.
8. `scripts/check-dist.mjs` + script `npm run check:dist`, quét `dist/**/*.html`, fail (thoát mã 1) nếu:
   - có `<script>` hoặc `<style>` inline (trừ `type="application/ld+json"`)
   - có `src`/`href` tới domain bên ngoài (trừ link `<a>` ra ngoài có `rel="noopener noreferrer"`)
   - thiếu `<h1>`, `<title>`, meta description, `lang`
   - `<img>` thiếu `alt`
   - link nội bộ trỏ tới file không có trong `dist`
9. Thêm `npm run check:dist` vào danh sách lệnh trong `AGENTS.md` mục 4.

**Tiêu chí hoàn thành**

- `npm test` pass ở cả 3 project, `npm run check:dist` thoát mã 0
- Cố ý thêm thử một `<script>` inline và một `<img>` thiếu `alt`: `check:dist` phải fail (sau đó hoàn tác)
- Cố ý thêm thử một `<script src="https://example.com/x.js">`: test CSP phải fail (sau đó hoàn tác)
- Không còn `[CẦN BỔ SUNG]` nào mới ngoài những chỗ đã có

---

## Task 5 — CI GitHub Actions

**Model:** Flash/Low. **Cần duyệt plan:** không.

**Việc cần làm:** `.github/workflows/ci.yml`

- Kích hoạt: `push` lên `main`, `pull_request`
- `permissions: contents: read`, `concurrency` huỷ lượt cũ
- Node theo `.nvmrc` (`actions/setup-node` với `node-version-file`), cache npm
- Các bước: `npm ci`, `npm run lint`, `npm run check`, `npm run build`, `npm run check:dist`, `npx playwright install --with-deps chromium`, `npm test`
- `check:placeholders` chạy ở chế độ cảnh báo, không làm fail
- Upload báo cáo Playwright (artifact) khi test fail
- Không dùng secret, không có bước deploy (Cloudflare tự build)

**Tiêu chí hoàn thành**

- File YAML hợp lệ, các lệnh trong CI khớp với `package.json`
- Không có token hay secret nào trong file

**Người dùng làm tay (cổng G1 — Đã xong):**

1. Tạo repo GitHub đứng tên pháp nhân/tổ chức của quỹ, bật 2FA. Đổi `origin` rồi push. Mở PR đầu tiên để CI chạy thử.
2. Branch protection cho `main`: bắt buộc PR, bắt buộc check CI pass, cấm force push.
3. Cloudflare Workers Builds (static assets): kết nối repo, cấu hình `wrangler.jsonc` (có khối `previews`), production dùng `npx wrangler deploy`, nhánh khác dùng `npx wrangler preview`, build `npm run build`, output `dist`, biến môi trường `NODE_VERSION=22` và `SITE_URL`. Hạ tầng thực tế chạy trên domain `*.workers.dev`, không phải Pages.
4. Kiểm tra bản preview: `curl -I <url preview>` phải thấy CSP, nosniff và `X-Robots-Tag: noindex` trên `*.workers.dev` (và `*.pages.dev` nếu có).
5. Gắn tag `v0.1`.

---

## Task 6 — Design system

**Đầu vào cần có:** logo (SVG) và 1–2 màu thương hiệu. Chưa có thì dùng palette trung tính và để `[CẦN BỔ SUNG: logo/màu]`.

**Model:** Planning Medium. **Cần duyệt plan:** có (phong cách là chuyện cảm nhận).

**Việc cần làm**

1. Token trong `@theme`: bảng màu (brand, ink, surface, border, trạng thái), cỡ chữ (gốc 16px, thang mặc định Tailwind + `--text-stat`), khoảng cách, bo góc, bóng.
2. `scripts/check-contrast.mjs`: tính tỉ lệ tương phản cho các cặp màu chữ/nền khai báo, fail nếu chữ thường < 4,5:1 hoặc chữ lớn < 3:1. Không cần thêm gói.
3. Font tự host (gói đã duyệt), chỉ nạp subset latin và vietnamese, `font-display: swap`, chạy được với CSP `font-src 'self'`.
4. Component nền, chỉ tạo cái nào sẽ dùng ngay: `Container`, `Section`, `PageHeader`, `Card`, `Button`/`LinkButton`, `StatItem`, `DataTable` (bảng, mobile xếp thẻ), `Notice`, `Breadcrumb`.
5. Áp vào Header/Footer/trang chủ hiện có.

**Tiêu chí hoàn thành:** `check-contrast` thoát mã 0, `npm test` và `check:dist` pass, không dùng màu hard-code ngoài token, font tải từ cùng origin.

**Cổng G2:** người dùng xem trên điện thoại thật và PC, duyệt hoặc yêu cầu chỉnh.

---

## Task 7–11 — Các trang nội dung

Mỗi task dùng workflow `/new-page`. **Cần duyệt plan:** không (bố cục dùng component của Task 6). Toàn bộ nội dung là placeholder tới khi người dùng điền. **Không bịa nội dung.**

**Task 7 — Giới thiệu và Ban lãnh đạo**

- Thêm collection `pages` (title, description, updated) cho văn bản dài: `gioi-thieu`, `lich-su`, `su-menh`. Nội dung nháp là khung có `[CẦN BỔ SUNG]`.
- Trang `/gioi-thieu`, `/lich-su`, `/ban-lanh-dao` (dùng `leadership`, ảnh chỉ hiện khi có và đã xác nhận quyền).

**Task 8 — Quy mô, Sản phẩm, Lãi suất**

- `/quy-mo`: số liệu từ `site.stats` kèm "tính đến …".
- `/san-pham`: cho vay và tiền gửi (thêm collection/data `products`, placeholder).
- `/lai-suat`: bảng đầy đủ từ `rates`, `effective_from`, luôn có `RATE_DISCLAIMER`. Một `<table>` duy nhất, mobile xếp thẻ.

**Task 9 — Quy chế và văn bản**

- Collection `documents` (title, date, file, category). PDF đặt trong `public/docs/`. Trang `/quy-che` liệt kê, mỗi mục có tên, ngày, dung lượng, link tải.
- Placeholder: không đưa file PDF giả. Danh sách rỗng hiện "Đang cập nhật".

**Task 9b — Test trạng thái có dữ liệu**

- Chế độ fixture qua biến môi trường `QTD_FIXTURES=1`, dữ liệu cô lập dưới `src/fixtures/`, build ra `dist-fixtures/`.
- Unit test thuần tại `tests/unit.spec.ts` cho `format.ts`, `news.ts`, `documents.ts`.
- Fixture test tại `tests/fixtures/quy-che.spec.ts` kiểm thử giao diện đầy đủ dữ liệu ở các viewport 360, 768, 1280.
- Hàng rào chống lọt trong `scripts/check-dist.mjs`.
- **Ghi chú bắt buộc:** Mọi trang động mới từ Task 10 trở đi phải có fixture và test tương ứng.

**Task 10 — Tin tức và Thông báo**

- `/tin-tuc` (danh sách có phân trang nếu > 10 bài) và `/tin-tuc/[slug]`, luôn lọc `draft` qua `lib/news.ts`.
- `/thong-bao`: lịch làm việc và thông báo nghỉ từ `schedule`.

**Task 11 — Liên hệ và Kênh chính thức**

- `/lien-he`: địa chỉ, hotline, email, giờ làm việc, các điểm giao dịch. Bản đồ chỉ là **link mở Google Maps ở tab mới**, **không nhúng iframe** (vi phạm CSP và nguyên tắc không tải từ bên thứ ba).
- `/kenh-chinh-thuc`: domain chính thức, hotline, cảnh báo giả mạo.

**Tiêu chí hoàn thành chung cho Task 7–11**

- `lint`, `check`, `build`, `npm test`, `check:dist` đều pass
- Mọi trang mới có trong `nav.ts` và được smoke test bao phủ (test lấy danh sách trang từ `nav.ts`/sitemap, không liệt kê tay)
- `grep` không có số liệu, tên người, địa chỉ, số điện thoại hard-code ngoài `src/data` và `src/content`
- `npm run check:placeholders` liệt kê được toàn bộ chỗ còn thiếu, kết quả dán vào báo cáo

**Cổng G3:** người dùng điền nội dung thật, người của quỹ duyệt từng trang (dùng `check:placeholders` làm danh sách việc cần điền).

---

## Task 12–13 — CMS (có điều kiện)

**Quyết định trước khi làm (người dùng chọn):**

- **Phương án A (đề xuất cho giai đoạn đầu):** sửa file YAML/Markdown trực tiếp trên GitHub (trình soạn thảo web) qua PR. CI và preview chạy sẵn, không cần thêm hạ tầng. Chỉ cần viết hướng dẫn ngắn trong runbook (Task 18).
- **Phương án B:** CMS dạng giao diện (Decap hoặc Sveltia), dùng khi người khác ngoài bạn cần cập nhật nội dung.

Phương án B có nhiều việc nhạy cảm về bảo mật: bundle CMS từ npm thay vì nạp từ CDN, trang `/admin` có CSP riêng nới đúng phạm vi `/admin/*`, đăng nhập GitHub OAuth qua một Cloudflare Worker, và đặt `/admin` sau Cloudflare Access. Nếu chọn B, mở một cuộc hội thoại riêng ở mức High, **cần duyệt plan**, và người dùng tự cấu hình OAuth và secret.

**Cổng G4:** người dùng tự thiết lập OAuth App, Worker và Cloudflare Access, không đưa secret cho agent.

---

## Task 14 — SEO

**Việc cần làm**

1. Mỗi trang có title, description, canonical, Open Graph (ảnh mặc định `/images/og-default.*`, nếu chưa có thì `[CẦN BỔ SUNG]`).
2. `@astrojs/sitemap` (gói đã duyệt), thêm dòng `Sitemap:` vào `robots.txt` dựa trên `SITE_URL`.
3. JSON-LD `FinancialService` sinh từ `contact.yaml`, **bỏ trường nào còn `null`**, không phát ra nếu thiếu dữ liệu cốt lõi.
4. Trang 404 đã có, kiểm tra lại.

**Tiêu chí hoàn thành:** `build` sinh `sitemap-index.xml`, `check:dist` pass (JSON-LD là ngoại lệ đã cho phép), mỗi trang có canonical đúng, không có dữ liệu giả trong JSON-LD.

---

## Task 15 — Bảo mật, hiệu năng, bảo trì

**Việc cần làm**

1. `@lhci/cli` với `staticDistDir`, ngưỡng mobile: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 95, SEO ≥ 95. Thêm vào CI.
2. `.github/dependabot.yml`: cập nhật `npm` và `github-actions` hàng tuần.
3. Bước `npm audit --omit=dev --audit-level=high` trong CI.
4. `scripts/build-cf.mjs` (lệnh build cho Cloudflare Workers Builds): kiểm tra nhánh production thì chạy `check-placeholders --strict` trước khi build, ngược lại chỉ build. Với nhánh khác `production` (dùng `npx wrangler preview`), vẫn cho phép placeholder.
5. Cập nhật `AGENTS.md` mục 4 với các lệnh mới.

**Tiêu chí hoàn thành:** `lhci` đạt ngưỡng, CI xanh, chạy thử lệnh build nhánh production khi còn placeholder phải **fail**.

**Thứ tự việc người dùng cần làm sau khi merge (agent không thể tự làm):**

1. Đặt biến `SITE_URL` trong Cloudflare, mục Build variables, giá trị `https://qtd.dinhcam1512.workers.dev`.
2. Chạy thử `npm run build:cf` ở máy cục bộ để kiểm tra toàn vẹn.
3. Đổi Build command trong Cloudflare từ `npm run build` thành `npm run build:cf`, cho cả cấu hình production lẫn non-production nếu dashboard tách.
4. Kiểm tra một build trên nhánh preview trước khi tin tưởng.
5. Nếu phát sinh lỗi, đổi lại lệnh cũ hoặc rollback.

---

## Task 16 — QA tổng và UAT

**Model:** `/review` chạy ở mức High, một lần.

**Việc cần làm (agent)**

- Chạy toàn bộ lệnh kiểm tra, `/qa` và `/review` trên toàn repo. Báo cáo dạng bảng Hạng mục / Kết quả / Ghi chú.
- Đối chiếu danh sách trang trong sitemap với trang trong `nav.ts`.

**Người dùng làm (cổng G5)**

- Test trên điện thoại thật (Android và iPhone), mạng chậm
- Mở link trong trình duyệt tích hợp của **Zalo** và **Facebook**
- Chữ lớn trong cài đặt hệ thống (tuỳ chọn)
- Người của quỹ duyệt nội dung toàn bộ trang bằng văn bản (tin nhắn/email)
- Bật 2FA (GitHub, Cloudflare, nhà đăng ký tên miền), khoá tên miền

**Tiêu chí hoàn thành:** `check-placeholders --strict` thoát mã 0, mọi lệnh kiểm tra pass, có xác nhận duyệt của quỹ.

---

## Task 17 — Go-live (chủ yếu người dùng làm)

1. Domain .vn đứng tên pháp nhân của quỹ. Đưa DNS về Cloudflare (theo hướng dẫn Cloudflare Workers Custom Domains).
2. Tạo nhánh `production` từ `main`, cấu hình Production branch trong Cloudflare Workers Builds (`npx wrangler deploy`). `main` trở thành nhánh preview/staging (`npx wrangler preview`).
3. Gắn custom domain trong Cloudflare Workers, redirect `www` về domain chính, HTTPS bắt buộc.
4. Merge `main` vào `production`. Build production phải pass kiểm tra strict.
5. Sau go-live: `curl -I https://<domain>`, kiểm tra CSP, HSTS, không còn `X-Robots-Tag: noindex` trên domain chính. Quét bằng công cụ kiểm tra header và SSL bên ngoài.
6. Đăng ký Google Search Console, gửi sitemap. Bật theo dõi uptime. Diễn tập rollback một lần (rollback ở Cloudflare Workers dashboard hoặc `git revert`).
7. Gắn tag `v1.0`.

---

## Task 18 — Runbook

Agent viết `docs/RUNBOOK.md` (một trang, ngắn), gồm:

- Cập nhật lãi suất (file nào, các trường, cách xem preview, cách merge)
- Đăng tin/thông báo, đổi lịch nghỉ
- Rollback
- Quy trình cập nhật phụ thuộc hàng tháng (Dependabot PR, CI, merge)
- Cách thay đổi người quản trị (chuyển quyền GitHub, Cloudflare, domain)
- Khi nghi ngờ trang bị sửa trái phép: kiểm tra lịch sử Git, đổi mật khẩu/khóa, khôi phục bản sạch gần nhất

**Tiêu chí hoàn thành:** người chưa biết dự án làm theo được trường hợp "đổi lãi suất" mà không hỏi thêm.
