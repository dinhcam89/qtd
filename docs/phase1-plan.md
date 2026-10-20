# Kế hoạch Phase 1 — Nền tảng (Scaffold, CI, Deploy Preview)

> Tài liệu này lưu trữ kế hoạch thực hiện Phase 1 đã được chuẩn hóa và duyệt theo hướng dẫn từ AGENTS.md, dùng để định hướng các task triển khai. File này nằm ngoài public/ và không deploy.

---

## 1. Stack kỹ thuật và phiên bản được chọn

| Thành phần               | Công nghệ / Phiên bản                                                                                  | Ghi chú cấu hình                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**              | Node.js `22.23.2` (LTS)                                                                                | Khai báo `.nvmrc` (`22`), `package.json` (`engines.node >= 22.0.0`)                                                                                           |
| **Framework**            | Astro `7.4.1`                                                                                          | Static Output (`output: "static"`), không SSR                                                                                                                 |
| **CSS Engine**           | Tailwind CSS `4.3.3` + `@tailwindcss/vite: 4.3.3`                                                      | Bỏ `@astrojs/tailwind` và `tailwind.config.mjs`. Tích hợp thẳng qua Vite plugin trong `astro.config.mjs`, nạp qua `@import "tailwindcss";` trong CSS toàn cục |
| **TypeScript**           | `typescript: ^5.8`                                                                                     | Chế độ `strict`, path alias `~/*` trỏ về `src/*`                                                                                                              |
| **Schema Validation**    | `zod: ^3.24`                                                                                           | Định nghĩa schema cho Content Collections (`news`) và dữ liệu tĩnh (`src/data/`)                                                                              |
| **Linting & Formatting** | `eslint: ^10.13.0`, `prettier: ^3.5.3`, `eslint-plugin-astro: ^3.2.1`, `prettier-plugin-astro: ^1.1.1` | Kiểm tra chuẩn mã nguồn, formatting tự động                                                                                                                   |
| **Testing**              | `@playwright/test`, `@axe-core/playwright`                                                             | Chạy trên `astro preview`, 3 viewport: Desktop (1280px), Tablet (768px), Mobile (360px), assert không cuộn ngang                                              |

---

## 2. Các quy định kỹ thuật & chuẩn hóa nghiệp vụ

### A. Bảo mật & Máy chủ (Cloudflare Pages)

- **Inline Styles & Scripts**:
  - Cấu hình `build.inlineStylesheets: "never"` trong `astro.config.mjs` để tách CSS ra file riêng.
  - Tuyệt đối không dùng inline script để tuân thủ Content Security Policy (CSP).
- **Security Headers (`public/_headers`)**:
  - Duy trì các header cơ bản không làm vỡ trang: CSP chặt chẽ, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`, `Permissions-Policy`.
  - Thêm header ngăn chặn index cho toàn bộ tên miền staging của Cloudflare Pages theo tài liệu Cloudflare:
    ```
    https://*.pages.dev/*
      X-Robots-Tag: noindex, nofollow
    ```
- **Biến môi trường cho Site URL**: Thuộc tính `site` trong `astro.config.mjs` nạp linh hoạt qua `process.env.SITE_URL || "https://qtd.pages.dev"`.

### B. Dữ liệu tĩnh (`src/data/`) & Content Collection

- **Không có dữ liệu giả**: Dữ liệu mẫu ban đầu hoàn toàn là placeholder (`null` hoặc `[CẦN BỔ SUNG]`). Tuyệt đối không bịa số liệu, tên người, lãi suất.
- **Định dạng dữ liệu chuẩn trong YAML**:
  - Số liệu quy mô: Bắt buộc có trường `as_of` (ngày lấy số liệu).
  - Lãi suất: Lưu dạng số (`number`, ví dụ: `5.2` thay vì chuỗi có ký tự %), ngày áp dụng dùng chuẩn ISO (`effective_from: "2026-01-01"`).
  - Câu lưu ý lãi suất: Được định nghĩa là hằng số tập trung trong code (`src/lib/constants.ts`), không duplicate trong file YAML.
- **Content Collection (`news`)**: Bài viết mẫu được gán `draft: true` và tự động lọc bỏ khỏi danh sách bài viết hiển thị công khai.
- **Script kiểm tra placeholder**: Bổ sung script `check:placeholders` (`scripts/check-placeholders.mjs`) để quét và cảnh báo các vị trí `[CẦN BỔ SUNG]` ở Phase 1 (chỉ in warning, chưa đưa vào CI).

### C. Quản trị nội dung (CMS)

- Không tạo thư mục `public/admin/*` trong Phase 1 (sẽ triển khai tại Phase 4 theo đúng lộ trình AGENTS.md).

### D. Kiểm thử giao diện (Playwright + Axe)

- Playwright chạy test với web server là `npm run preview` (build tĩnh trước khi preview).
- Thiết lập 3 projects viewport chuẩn:
  1. `desktop`: 1280 × 800
  2. `tablet`: 768 × 1024
  3. `mobile`: 360 × 640
- Assertion bắt buộc: Kiểm tra `document.documentElement.scrollWidth <= document.documentElement.clientWidth` để đảm bảo không bị lỗi cuộn ngang cấp trang ở mọi breakpoint.

---

## 3. Lộ trình triển khai Phase 1 theo từng Task nhỏ

### Task 1: Scaffold nền tảng (Đang thực hiện)

- Khởi tạo git repo và dọn dẹp workflow trùng ở thư mục gốc (chỉ giữ trong `.agent/workflows/`).
- Tạo cấu hình gốc: `.nvmrc`, `package.json` (kèm `engines`, scripts), `.gitignore`, `astro.config.mjs` (Tailwind v4 qua Vite, `inlineStylesheets: "never"`), `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `.prettierignore`.
- Tạo `src/styles/global.css` (cỡ chữ gốc 18px, import Tailwind v4).
- Tạo `src/layouts/BaseLayout.astro` (layout khung rỗng tối giản, semantic HTML, `lang="vi"`).
- Tạo `src/pages/index.astro` (trang chủ tối giản, thẻ h1 tiếng Việt, không bịa thông tin).
- Tạo script placeholder cơ bản `scripts/check-placeholders.mjs`.
- Xác thực: `npm run lint`, `npm run check`, `npm run build` pass 100%. Commit local.

### Task 2: Schema Zod, Data YAML & Helper Tiện ích

- Định nghĩa Zod schemas (`src/lib/schemas/`): `site`, `rates`, `contact`, `schedule`, `leadership`.
- Tạo 5 file YAML trong `src/data/` với placeholder chuẩn (`null`, `[CẦN BỔ SUNG]`, ISO date, rates dạng số).
- Tạo `src/lib/constants.ts` chứa câu lưu ý lãi suất chuẩn.
- Tạo `src/lib/format.ts` (format ngày, tiền tệ, phần trăm chuẩn `vi-VN`).
- Hoàn thiện logic kiểm tra placeholder trong `scripts/check-placeholders.mjs`.

### Task 3: Content Collection & Components

- Thiết lập `src/content.config.ts` với collection `news` (schema Zod, lọc `draft: true`).
- Thêm bài viết mẫu `src/content/news/2026-01-01-thong-bao-mau.md` (`draft: true`).
- Bổ sung các component cơ bản: `Header.astro`, `Footer.astro`, `SkipLink.astro`.
- Cập nhật `BaseLayout.astro` và `index.astro` hiển thị dữ liệu tĩnh đã validate.

### Task 4: Kiểm thử Playwright & Security Headers

- Cấu hình `playwright.config.ts` (webServer: `astro preview`, 3 viewports: 1280, 768, 360).
- Viết `tests/smoke.spec.ts` (kiểm tra load trang, tiêu đề, h1, assert không cuộn ngang).
- Viết `tests/a11y.spec.ts` (quét WCAG AA bằng axe-core).
- Tạo `public/_headers` và `public/robots.txt`.

### Task 5: CI GitHub Actions

- Tạo `.github/workflows/ci.yml` chạy tự động các bước: lint, check, build, test.
- Kiểm tra toàn bộ Definition of Done của Phase 1.
