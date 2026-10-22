// @ts-check
import { existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const isFixtures = process.argv.includes('--fixtures');
const SCREENSHOTS_DIR = isFixtures
  ? resolve('screenshots/fixtures')
  : resolve('screenshots');

if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const VIEWPORTS = isFixtures
  ? [
      { name: '360px', width: 360, height: 640, isMobile: true },
      { name: '1280px', width: 1280, height: 800, isMobile: false },
    ]
  : [
      { name: '360px', width: 360, height: 640, isMobile: true },
      { name: '768px', width: 768, height: 1024, isMobile: true },
      { name: '1024px', width: 1024, height: 768, isMobile: false },
      { name: '1280px', width: 1280, height: 800, isMobile: false },
      { name: '1920px', width: 1920, height: 1080, isMobile: false },
    ];

const PAGES = isFixtures
  ? [
      { path: '/tin-tuc/', slug: 'tin-tuc' },
      { path: '/tin-tuc/trang/2/', slug: 'tin-tuc-trang-2' },
      {
        path: '/tin-tuc/bai-viet-markdown/',
        slug: 'tin-tuc-bai-viet-markdown',
      },
      { path: '/thong-bao/', slug: 'thong-bao' },
      { path: '/quy-che/', slug: 'quy-che' },
      { path: '/lien-he/', slug: 'lien-he' },
      { path: '/kenh-chinh-thuc/', slug: 'kenh-chinh-thuc' },
    ]
  : [
      { path: '/', slug: 'index' },
      { path: '/gioi-thieu', slug: 'gioi-thieu' },
      { path: '/lich-su', slug: 'lich-su' },
      { path: '/ban-lanh-dao', slug: 'ban-lanh-dao' },
      { path: '/quy-mo', slug: 'quy-mo' },
      { path: '/san-pham', slug: 'san-pham' },
      { path: '/lai-suat', slug: 'lai-suat' },
      { path: '/quy-che', slug: 'quy-che' },
      { path: '/404', slug: '404' },
    ];

const PORT = isFixtures ? 4322 : 4321;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Kiểm tra xem port đã mở hay chưa
 * @param {number} port
 * @returns {Promise<boolean>}
 */
async function isPortOpen(port) {
  try {
    const res = await fetch(`http://localhost:${port}`);
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
}

/**
 * Đợi server sẵn sàng
 * @param {number} timeoutMs
 */
async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(PORT)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function run() {
  console.log(
    `--- BẮT ĐẦU CHỤP ẢNH GIAO DIỆN (${isFixtures ? 'FIXTURES' : 'SCREENSHOTS'}) ---`
  );
  let previewProc = null;

  if (isFixtures) {
    const { spawnSync } = await import('node:child_process');
    console.log('[shots] Đang build fixtures...');
    const buildRes = spawnSync(
      process.execPath,
      [resolve('scripts/fixtures.mjs'), 'build'],
      {
        stdio: 'inherit',
      }
    );
    if (buildRes.status !== 0) {
      throw new Error('Build fixtures thất bại!');
    }
  }

  const alreadyRunning = await isPortOpen(PORT);
  if (!alreadyRunning) {
    console.log(`Khởi động server astro preview tại cổng ${PORT}...`);
    const astroCli = resolve('node_modules/astro/bin/astro.mjs');
    const previewArgs = [astroCli, 'preview', '--port', String(PORT)];
    if (isFixtures) {
      previewArgs.push('--outDir', 'dist-fixtures');
    }
    previewProc = spawn(process.execPath, previewArgs, {
      stdio: 'pipe',
      env: {
        ...process.env,
        ...(isFixtures ? { QTD_FIXTURES: '1' } : {}),
      },
    });

    const ready = await waitForServer(15000);
    if (!ready) {
      if (previewProc) previewProc.kill();
      throw new Error('Server preview không khởi động kịp sau 15 giây.');
    }
  }

  const browser = await chromium.launch();

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\nViewport: ${vp.name} (${vp.width}x${vp.height})`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
      });
      const page = await context.newPage();

      for (const p of PAGES) {
        const url = `${BASE_URL}${p.path}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        const filePath = resolve(SCREENSHOTS_DIR, `${p.slug}-${vp.name}.png`);
        await page.screenshot({ path: filePath, fullPage: true });
        console.log(`  ✓ Đã chụp: ${p.path} -> ${filePath}`);
      }

      await context.close();
    }
    console.log(
      `\n[THÀNH CÔNG] Đã lưu ${VIEWPORTS.length * PAGES.length} ảnh chụp màn hình vào thư mục: ${SCREENSHOTS_DIR}`
    );
  } finally {
    await browser.close();
    if (previewProc) {
      previewProc.kill();
    }
  }
  process.exit(0);
}

run().catch((err) => {
  console.error('[LỖI CHỤP ẢNH]', err);
  process.exit(1);
});
