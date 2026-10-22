import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { parse as parseYaml } from 'yaml';
import { decideBuildMode } from './lib/build-mode.mjs';

console.log('=== TIẾN TRÌNH BUILD CHO CLOUDFLARE WORKERS BUILDS ===\n');

// Đọc site.yaml để lấy site.official_domain
let siteData = {};
const siteYamlPath = path.resolve('src/data/site.yaml');
if (fs.existsSync(siteYamlPath)) {
  try {
    siteData = parseYaml(fs.readFileSync(siteYamlPath, 'utf-8')) || {};
  } catch (err) {
    console.error(
      `[LỖI BUILD CLOUDFLARE] Không đọc được file src/data/site.yaml: ${err.message}`
    );
    process.exit(1);
  }
}

// Quyết định chế độ build qua hàm thuần
const decision = decideBuildMode(process.env, siteData);

// In cảnh báo nếu có
for (const warn of decision.warnings) {
  console.warn(`[CẢNH BÁO BUILD CLOUDFLARE] ${warn}`);
}

// Nếu có lỗi sơ bộ từ tham số/môi trường (QTD_FIXTURES, SITE_URL, host...)
if (!decision.isValid) {
  for (const err of decision.errors) {
    console.error(`[LỖI BUILD CLOUDFLARE] ${err}`);
  }
  process.exit(1);
}

// Thông báo chế độ build
if (decision.mode === 'production') {
  console.log(
    `[BUILD CLOUDFLARE] Chế độ: PRODUCTION (Nhánh: ${decision.branch || 'production'}, SITE_URL: ${decision.siteUrl})`
  );
  console.log(
    '[BUILD CLOUDFLARE] Đang chạy kiểm tra placeholder nghiêm ngặt (--strict)...'
  );

  const checkStrictRes = spawnSync(
    'node',
    ['./scripts/check-placeholders.mjs', '--strict'],
    {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    }
  );

  if (checkStrictRes.status !== 0) {
    console.error(
      '\n[LỖI BUILD CLOUDFLARE] Bản build production bị từ chối do còn placeholder hoặc trường dữ liệu bắt buộc chưa điền.'
    );
    process.exit(checkStrictRes.status || 1);
  }
} else {
  console.log(
    `[BUILD CLOUDFLARE] Chế độ: PREVIEW (Nhánh: ${decision.branch || 'preview/không xác định'}, SITE_URL: ${decision.siteUrl})`
  );
  console.log('[BUILD CLOUDFLARE] Kiểm tra placeholder ở chế độ cảnh báo:');
  spawnSync('node', ['./scripts/check-placeholders.mjs'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
}

// vi) Chạy astro build rồi check:dist, thoát theo mã của chúng
console.log('\n[BUILD CLOUDFLARE] Bắt đầu build tĩnh Astro...');
const astroBuildRes = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

if (astroBuildRes.status !== 0) {
  console.error('\n[LỖI BUILD CLOUDFLARE] Quá trình astro build thất bại.');
  process.exit(astroBuildRes.status || 1);
}

console.log(
  '\n[BUILD CLOUDFLARE] Kiểm tra toàn vẹn thư mục dist (check:dist)...'
);
const checkDistRes = spawnSync('node', ['./scripts/check-dist.mjs'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

if (checkDistRes.status !== 0) {
  console.error(
    '\n[LỖI BUILD CLOUDFLARE] Kiểm tra check:dist thất bại. Vui lòng kiểm tra lại xuất xưởng.'
  );
  process.exit(checkDistRes.status || 1);
}

console.log(
  '\n[THÀNH CÔNG] Build Cloudflare thành công và đạt chuẩn xuất xưởng!'
);
process.exit(0);
