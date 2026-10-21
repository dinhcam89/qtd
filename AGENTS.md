# AGENTS.md — Website Quỹ tín dụng nhân dân [TÊN QUỸ]

> File này là nguồn hướng dẫn duy nhất cho coding agent. Đọc toàn bộ trước khi làm bất cứ việc gì.
> Khi có xung đột giữa yêu cầu trong chat và file này, hãy **dừng lại và hỏi**, không tự chọn.

## 0. Trạng thái hiện tại (người dùng cập nhật mỗi khi đổi phase)

- Phase hiện tại: **Phase 1 – Nền tảng**
- Ưu tiên của phase: scaffold dự án, CI cơ bản, deploy preview
- Chưa làm: CMS, SEO nâng cao, nội dung thật

## 1. Mục tiêu và phạm vi

Website **tĩnh** để giới thiệu quỹ cho khách hàng cũ và mới: giới thiệu, lịch sử hình thành, quy mô, ban lãnh đạo, quy chế hoạt động, sản phẩm, lãi suất cho vay và tiền gửi, tin tức, thông báo (lịch làm việc/nghỉ), liên hệ.

**Ngoài phạm vi (KHÔNG làm, kể cả khi được gợi ý):**
- Đăng nhập, tài khoản người dùng, giao dịch, thanh toán, internet banking
- Thu thập hoặc lưu dữ liệu cá nhân (không form đăng ký, không cookie theo dõi)
- Danh sách thành viên cá nhân. Chỉ hiển thị **số liệu tổng hợp** (số thành viên, vốn điều lệ, tổng tài sản…)
- Backend/database riêng. Mọi thứ là file tĩnh trong Git

Người dùng chính: khách hàng cũ và mới của quỹ, nhiều độ tuổi, dùng cả điện thoại và máy tính; desktop là bản thiết kế chuẩn, mobile phải hoàn chỉnh như nhau. Toàn bộ giao diện bằng **tiếng Việt**.

## 2. Stack (không tự ý thay đổi)

| Hạng mục | Lựa chọn |
|---|---|
| Framework | Astro (static output, không SSR) |
| Style | Tailwind CSS |
| Nội dung | Astro Content Collections (Markdown/MDX) + schema Zod |
| Dữ liệu thay đổi thường xuyên | YAML/JSON trong `src/data/`, có schema Zod |
| CMS | Decap CMS (hoặc Sveltia CMS) tại `/admin`, lưu vào Git |
| Tìm kiếm | Pagefind |
| Test | Playwright (smoke + screenshot), axe (accessibility), Lighthouse CI |
| Lint/format | ESLint, Prettier, `astro check` |
| Hosting | Cloudflare Pages (preview cho mỗi PR) |
| CI | GitHub Actions |

Dùng phiên bản ổn định mới nhất lúc scaffold, ghi cố định version trong `package.json`, commit lockfile, cài bằng `npm ci`. **Không thêm dependency mới** khi chưa nêu lý do và được người dùng đồng ý.

## 3. Cấu trúc thư mục

```
/
├─ AGENTS.md
├─ astro.config.mjs
├─ package.json
├─ public/
│  ├─ admin/            # Decap CMS (index.html, config.yml)
│  ├─ docs/             # PDF quy chế, biểu mẫu
│  ├─ fonts/            # font tự host (subset tiếng Việt)
│  ├─ images/
│  ├─ _headers          # security headers cho Cloudflare Pages
│  ├─ _redirects
│  └─ robots.txt
├─ src/
│  ├─ components/       # UI dùng chung
│  ├─ layouts/
│  ├─ pages/
│  ├─ content/          # news/ (bài viết), thông báo
│  ├─ content.config.ts # schema Zod (hoặc theo chuẩn Astro hiện hành)
│  ├─ data/             # site.yaml, rates.yaml, contact.yaml, schedule.yaml, leadership.yaml
│  ├─ styles/
│  └─ lib/              # hàm tiện ích (format số, ngày…)
├─ tests/
└─ .github/workflows/ci.yml
```

## 4. Lệnh

```
npm run dev      # chạy local
npm run build    # build static (phải pass)
npm run lint     # ESLint + Prettier check
npm run check    # astro check (type + content schema)
npm test         # Playwright + axe
npm run test:unit # chạy unit tests thuần (format, news, documents)
npm run test:fixtures # build fixture và chạy tests với dữ liệu fixture
npm run verify   # chạy toàn bộ kiểm tra chất lượng trước khi chốt task
npm run check:dist # kiểm tra toàn vẹn thư mục dist (không script/style inline, không vỡ link)
npm run lhci     # Lighthouse CI (khi đã cấu hình)

```
### 4.1 Môi trường và công cụ
- Mã nguồn nằm tại D:\TaiLieu\projects\qtd, terminal là PowerShell. Chạy lệnh trực tiếp (npm, git, node), không dùng wsl. Nối lệnh bằng `;` thay vì `&&`.
- Tạo và sửa file CHỈ bằng công cụ ghi file của IDE. KHÔNG ghi file bằng heredoc, base64, PowerShell hay Python, và không tạo script tạm để "đồng bộ" file.
- Nếu một cách ghi file lỗi 2 lần: DỪNG và báo cáo, không thử cách vòng vèo khác.
- Trước khi `npm install` bất kỳ gói nào (kể cả devDependency, @types/*, parser), nêu danh sách và lý do để người dùng đồng ý.
- Không đọc mã nguồn trong node_modules trừ khi bắt buộc. Cần biết API thì ưu tiên docs chính thức hoặc file kiểu dữ liệu (.d.ts), tối đa 15 lệnh cho phần khám phá.
- Lộ trình, tiêu chí hoàn thành và giao thức mỗi task nằm trong docs/ROADMAP.md. Chỉ đọc mục Giao thức chung và mục của task hiện tại.

## 5. Quy tắc cứng về nội dung (QUAN TRỌNG NHẤT)

Đây là website của một tổ chức tín dụng. Thông tin sai gây hậu quả thật.

1. **Tuyệt đối không bịa** số liệu, lãi suất, tên người, chức danh, địa chỉ, số điện thoại, năm thành lập, điều khoản pháp lý, trích dẫn văn bản. Thiếu dữ liệu thì ghi `[CẦN BỔ SUNG]` và liệt kê trong báo cáo cuối task.
2. Mọi **số liệu quy mô** phải kèm trường `as_of` (ngày số liệu) và hiển thị "tính đến dd/mm/yyyy".
3. **Lãi suất** nằm trong `src/data/rates.yaml` với `effective_from`, luôn kèm dòng lưu ý: *"Lãi suất mang tính tham khảo, vui lòng liên hệ quỹ để biết chi tiết."* Không hard-code lãi suất ở bất kỳ component hay trang nào.
4. Không viết nội dung "marketing" mang tính cam kết, so sánh với tổ chức khác, hay hứa hẹn lợi nhuận. Văn phong trung tính, chính xác, dễ hiểu.
5. Không đưa vào dữ liệu cá nhân của thành viên hay khách hàng. Ảnh người thật chỉ dùng khi đã có chỗ đánh dấu `[CẦN XÁC NHẬN QUYỀN SỬ DỤNG ẢNH]`.
6. Văn bản tiếng Việt do agent soạn chỉ là **bản nháp**, người của quỹ phải duyệt trước khi publish.
7. Định dạng chuẩn Việt Nam: ngày `dd/mm/yyyy`, số thập phân dùng dấu phẩy (`5,2%/năm`), tiền `1.000.000 đồng`. Dùng `Intl` với locale `vi-VN` trong `src/lib/`, không format tay rải rác.

Nếu lãi suất, số liệu hay văn bản pháp lý không có trong nguồn người dùng đưa, **không tự suy diễn**, hỏi lại.

## 6. Responsive: một codebase, desktop là bản chuẩn

- Chỉ **một** codebase. Không tạo trang hay component riêng cho mobile/desktop trừ khi thật sự cần.
- **Thiết kế desktop (1280px+) được chốt trước**, sau đó **mỗi trang/component phải có bản mobile hoàn chỉnh trong cùng task**, không để lại sau.
- CSS viết theo kiểu **mobile-first** (style mặc định cho màn nhỏ, thêm `md:`/`lg:`/`xl:` cho màn lớn). Đây là kỹ thuật viết code, không đổi việc desktop là bản thiết kế chuẩn.
- Breakpoint dùng mặc định của Tailwind (sm 640, md 768, lg 1024, xl 1280, 2xl 1536). Container nội dung tối đa ~1200px.
- Mẫu chuyển đổi bắt buộc:
  - Menu: thanh ngang trên desktop, hamburger trên mobile (bấm được bằng bàn phím, có `aria-expanded`)
  - Bảng lãi suất: bảng đầy đủ trên desktop, dạng thẻ hoặc cuộn ngang có chỉ báo trên mobile
  - Lưới số liệu: 4 cột trên desktop, 2 cột trên mobile
- Dùng đơn vị tương đối (`rem`, `%`, `clamp()`), tránh pixel cố định cho layout và cỡ chữ.
- Kiểm tra ở **360px, 768px, 1280px, 1920px** trước khi báo hoàn thành. Không có cuộn ngang ở cấp trang.

## 7. Thiết kế và khả năng truy cập

- Cỡ chữ gốc **16px** (mặc định trình duyệt), line-height ~1.6, độ tương phản đạt **WCAG AA** trở lên.
- Vùng bấm tối thiểu **44×44px** trên mobile. Trạng thái focus nhìn thấy rõ.
- Font tự host, subset có tiếng Việt (ví dụ Be Vietnam Pro hoặc Noto Sans). Không tải font từ Google Fonts hay CDN.
- Màu và logo lấy từ bộ nhận diện của quỹ. Nếu chưa có, dùng bảng màu tạm trung tính và ghi `[CẦN BỔ SUNG: logo/màu]`.
- Hiệu ứng tối giản, tôn trọng `prefers-reduced-motion`. Không autoplay video/âm thanh.
- Ảnh: WebP/AVIF, luôn có `width`/`height` và `alt` tiếng Việt có ý nghĩa, lazy-load ảnh dưới màn hình đầu.
- HTML ngữ nghĩa: một `<h1>` mỗi trang, thứ tự heading hợp lý, landmark (`header`, `nav`, `main`, `footer`), `lang="vi"`.

## 8. Bảo mật

- Không tải script, font, CSS, ảnh từ bên thứ ba. Mọi tài nguyên cùng origin (ngoại lệ phải được người dùng đồng ý).
- `public/_headers` duy trì: CSP chặt, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors 'none'`, `Permissions-Policy`. Nếu cần inline script thì dùng hash, không dùng `unsafe-inline`.
- Link ra ngoài: `rel="noopener noreferrer"`.
- Không commit secret, token, `.env`. Không đặt thông tin nhạy cảm vào repo.
- `/admin` do Cloudflare Access bảo vệ. Agent **không** sửa cấu hình xác thực.
- Không tự thêm tracking/analytics ngoài Cloudflare Web Analytics.

## 9. SEO

- Mỗi trang có `<title>` và meta description tiếng Việt riêng, canonical URL, Open Graph, `sitemap.xml`, `robots.txt`.
- Structured data schema.org (`FinancialService` hoặc `LocalBusiness`) với dữ liệu lấy từ `src/data/contact.yaml`.
- Có trang 404 thân thiện.

## 10. Quy trình làm việc của agent

**Trước khi code:**
- Task lớn (scaffold, layout, CMS, thay đổi nhiều file): **lập plan trước**, nêu danh sách file sẽ tạo/sửa, chờ người dùng duyệt rồi mới làm.
- Không rõ yêu cầu hoặc thiếu dữ liệu: hỏi, không đoán.

**Khi code:**
- Một task = một mục tiêu nhỏ, rõ. Không "tiện tay" làm thêm việc ngoài yêu cầu.
- Commit **local** theo Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…). **Không `git push`, không force, không merge.** Người dùng sẽ push và tạo PR.
- Các file sau **chỉ được sửa khi task yêu cầu rõ**: `.github/workflows/*`, `public/_headers`, `public/admin/*`, `astro.config.mjs`, `AGENTS.md`, lockfile.
- Không chạy lệnh phá hủy (`rm -rf`, ghi đè hàng loạt, `curl | sh`). Không cài gói toàn cục.
- Khi dùng trình duyệt để kiểm tra giao diện, tối đa **3 vòng** chụp và sửa cho mỗi vấn đề, sau đó báo cáo thay vì lặp vô hạn.

**Trước khi báo hoàn thành (Definition of Done):**
- [ ] `npm run lint`, `npm run check`, `npm run build`, `npm test` đều pass
- [ ] Đã kiểm tra desktop và mobile ở 360 / 768 / 1280 / 1920px
- [ ] Không có số liệu/lãi suất/văn bản hard-code ngoài `src/data/` hoặc content collections
- [ ] Không có tài nguyên bên thứ ba mới
- [ ] Không có link hỏng, ảnh thiếu `alt`
- [ ] Mọi chỗ thiếu dữ liệu được đánh dấu `[CẦN BỔ SUNG]`

**Định dạng báo cáo cuối task (ngắn gọn):**
1. Đã làm gì (1–3 câu)
2. Danh sách file đã tạo/sửa
3. Kết quả các lệnh kiểm tra
4. Các chỗ `[CẦN BỔ SUNG]` và giả định đã dùng
5. Việc người dùng cần làm tiếp (nếu có)

## 11. Lộ trình các phase (tham khảo)

| Phase | Nội dung | Checkpoint |
|---|---|---|
| 0 | Thu thập content pack từ quỹ | Có đủ nội dung và người duyệt |
| 1 | Scaffold, CI, deploy preview | PR có preview URL |
| 2 | Design system, layout, menu | Layout đẹp từ 360px đến 1920px |
| 3 | Các trang nội dung | Đủ trang, không link chết |
| 4 | Dữ liệu + CMS | Sửa lãi suất qua CMS lên web < 5 phút |
| 5 | SEO + bảo mật | Qua checklist mục 8 và 9 |
| 6 | QA + người của quỹ duyệt | Có xác nhận duyệt nội dung |
| 7 | Go-live domain .vn | HTTPS ổn, có kế hoạch rollback |
| 8 | Vận hành | Có runbook |

Mỗi phase kết thúc bằng một git tag (`v0.1`, `v0.2`…).

## 12. Khi nào phải dừng và hỏi

- Yêu cầu mâu thuẫn với phạm vi ở mục 1 hoặc quy tắc ở mục 5
- Cần thêm dependency, dịch vụ ngoài, hoặc thay đổi stack
- Cần dữ liệu thật mà người dùng chưa cung cấp
- Kết quả kiểm tra thất bại mà không rõ nguyên nhân sau 3 lần thử
