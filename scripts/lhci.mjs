import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { chromium } from '@playwright/test';

function resolveChromeExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  try {
    const pwPath = chromium.executablePath();
    if (pwPath && fs.existsSync(pwPath)) {
      return pwPath;
    }
  } catch {
    // Không tìm thấy qua Playwright
  }
  return null;
}

const chromePath = resolveChromeExecutable();
if (!chromePath) {
  console.error(
    '\n[LỖI LHCI] Không tìm thấy trình duyệt Chrome hoặc Chromium trên hệ thống.'
  );
  console.error(
    'Vui lòng cài đặt Google Chrome hoặc chạy lệnh sau để tải Chromium từ Playwright:'
  );
  console.error('  npx playwright install chromium\n');
  process.exit(1);
}

process.env.CHROME_PATH = chromePath;

const isQuick = process.argv.includes('--quick');

console.log(
  `[LHCI] Đang khởi chạy Lighthouse CI (${isQuick ? 'CHẾ ĐỘ NHANH: 1 lần chạy, 3 URL' : 'CHẾ ĐỘ ĐẦY ĐỦ: 3 lần chạy, toàn bộ trang'}) với trình duyệt: ${chromePath}`
);

// 1. Chạy lhci autorun trên dist
const distPath = path.resolve('dist');
if (!fs.existsSync(distPath)) {
  console.error(
    '[LỖI LHCI] Thư mục ./dist không tồn tại. Vui lòng chạy npm run build trước.'
  );
  process.exit(1);
}

console.log(
  `\n--- 1. KIỂM TRA LIGHTHOUSE CI TRÊN DIST (${isQuick ? 'QUICK: /, /lai-suat/, /tin-tuc/' : 'PRODUCTION FULL'}) ---`
);

const autorunArgs = isQuick
  ? [
      'lhci',
      'autorun',
      '--config=lighthouserc.cjs',
      '--collect.numberOfRuns=1',
      '--collect.url=http://localhost/',
      '--collect.url=http://localhost/lai-suat/',
      '--collect.url=http://localhost/tin-tuc/',
    ]
  : ['lhci', 'autorun', '--config=lighthouserc.cjs'];

const autorunRes = spawnSync('npx', autorunArgs, {
  shell: true,
  stdio: 'inherit',
  env: process.env,
});

const manifestPath = path.resolve('.lighthouseci/manifest.json');
let distManifest = [];
if (fs.existsSync(manifestPath)) {
  try {
    distManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    distManifest = [];
  }
}

// Bảng điểm cho dist
const repRuns = distManifest.filter((m) => m.isRepresentativeRun);
if (repRuns.length > 0) {
  console.log('\n=== BẢNG ĐIỂM LIGHTHOUSE CI (DIST PRODUCTION) ===');
  console.log('| URL | Performance | Accessibility | Best Practices | SEO |');
  console.log('|---|---|---|---|---|');
  for (const r of repRuns) {
    const p = new URL(r.url).pathname;
    const s = r.summary;
    console.log(
      `| ${p} | ${Math.round(s.performance * 100)}% | ${Math.round(s.accessibility * 100)}% | ${Math.round(s['best-practices'] * 100)}% | ${Math.round(s.seo * 100)}% |`
    );
  }
}

// Nếu autorun fail trên dist, tìm 3 audit kém nhất
if (autorunRes.status !== 0) {
  console.error(
    '\n[LHCI THẤT BẠI] Một hoặc nhiều trang trong dist không đạt ngưỡng yêu cầu!'
  );
  for (const r of repRuns) {
    const s = r.summary;
    const isUnderThreshold =
      s.performance < 0.9 ||
      s.accessibility < 0.9 ||
      s['best-practices'] < 0.95 ||
      s.seo < 0.95;
    if (isUnderThreshold && r.jsonPath && fs.existsSync(r.jsonPath)) {
      const p = new URL(r.url).pathname;
      console.log(`\nTrang dưới ngưỡng: ${p}`);
      try {
        const lhr = JSON.parse(fs.readFileSync(r.jsonPath, 'utf-8'));
        const audits = Object.values(lhr.audits)
          .filter((a) => typeof a.score === 'number' && a.score < 1)
          .sort((a, b) => a.score - b.score)
          .slice(0, 3);
        console.log('  Top 3 audit kém nhất:');
        for (const a of audits) {
          console.log(
            `  - [${a.id}] ${a.title}: ${Math.round(a.score * 100)}% (${a.displayValue || 'N/A'})`
          );
        }
      } catch (e) {
        console.error('  Không đọc được chi tiết audit:', e.message);
      }
    }
  }
  process.exit(autorunRes.status || 1);
}

// 2. Chạy bổ sung lhci trên dist-fixtures nếu tồn tại (hoặc khi có cờ --fixtures), chỉ trong chế độ đầy đủ
const distFixturesPath = path.resolve('dist-fixtures');
const shouldRunFixtures =
  !isQuick &&
  (fs.existsSync(distFixturesPath) || process.argv.includes('--fixtures'));

if (shouldRunFixtures && fs.existsSync(distFixturesPath)) {
  console.log('\n--- 2. KIỂM TRA BỔ SUNG LIGHTHOUSE TRÊN DIST-FIXTURES ---');

  // Tìm 1 bài viết chi tiết trong dist-fixtures/tin-tuc/
  let detailArticleSlug = 'bai-trung-ngay-a';
  const newsFixtureDir = path.join(distFixturesPath, 'tin-tuc');
  if (fs.existsSync(newsFixtureDir)) {
    const subdirs = fs
      .readdirSync(newsFixtureDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'trang')
      .map((d) => d.name);
    if (subdirs.length > 0) {
      detailArticleSlug = subdirs[0];
    }
  }

  const fixtureUrls = [
    'http://localhost/tin-tuc/',
    `http://localhost/tin-tuc/${detailArticleSlug}/`,
    'http://localhost/quy-che/',
    'http://localhost/lien-he/',
  ];

  const fixturesOutputDir = path.resolve('.lighthouseci/fixtures');
  if (fs.existsSync(fixturesOutputDir)) {
    fs.rmSync(fixturesOutputDir, { recursive: true, force: true });
  }

  const collectArgs = [
    'lhci',
    'collect',
    '--staticDistDir=./dist-fixtures',
    ...fixtureUrls.flatMap((u) => ['--url', u]),
    '--numberOfRuns=1',
    `--settings.chromeFlags=--headless=new --no-sandbox --disable-dev-shm-usage`,
  ];

  const fixCollectRes = spawnSync('npx', collectArgs, {
    shell: true,
    stdio: 'inherit',
    env: process.env,
  });

  if (fixCollectRes.status === 0) {
    // Thu thập kết quả báo cáo mới nhất trong .lighthouseci
    const files = fs
      .readdirSync('.lighthouseci')
      .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
      .map((f) => path.join('.lighthouseci', f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
      .slice(0, fixtureUrls.length);

    console.log('\n=== BẢNG ĐIỂM LIGHTHOUSE (DIST-FIXTURES) ===');
    console.log(
      '| URL (Fixtures) | Performance | Accessibility | Best Practices | SEO |'
    );
    console.log('|---|---|---|---|---|');

    for (const file of files) {
      try {
        const lhr = JSON.parse(fs.readFileSync(file, 'utf-8'));
        const p = new URL(lhr.finalUrl || lhr.requestedUrl).pathname;
        const cats = lhr.categories;
        const perf = Math.round(cats.performance.score * 100);
        const a11y = Math.round(cats.accessibility.score * 100);
        const bp = Math.round(cats['best-practices'].score * 100);
        const seo = Math.round(cats.seo.score * 100);

        console.log(`| ${p} | ${perf}% | ${a11y}% | ${bp}% | ${seo}% |`);

        const isUnder =
          cats.performance.score < 0.9 ||
          cats.accessibility.score < 0.9 ||
          cats['best-practices'].score < 0.95 ||
          cats.seo.score < 0.95;

        if (isUnder) {
          const worstAudits = Object.values(lhr.audits)
            .filter((a) => typeof a.score === 'number' && a.score < 1)
            .sort((a, b) => a.score - b.score)
            .slice(0, 3);
          console.log(
            `  (Cảnh báo dưới ngưỡng) Top 3 audit kém nhất của ${p}:`
          );
          for (const a of worstAudits) {
            console.log(
              `  - [${a.id}] ${a.title}: ${Math.round(a.score * 100)}% (${a.displayValue || 'N/A'})`
            );
          }
        }
      } catch (err) {
        console.error('Lỗi khi đọc file kết quả fixtures:', err.message);
      }
    }
  } else {
    console.warn(
      '[LHCI WARN] Không hoàn thành kiểm tra lhci trên dist-fixtures (không làm fail tiến trình).'
    );
  }
}

console.log('\n[PASS] Hoàn tất kiểm tra Lighthouse CI!');
process.exit(0);
