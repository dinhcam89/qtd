import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import process from 'node:process';

const TARGET_PORT = 4323;
const TARGET_URL = `http://localhost:${TARGET_PORT}`;

function killProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
    } else {
      proc.kill('SIGTERM');
    }
  } catch {
    // Bỏ qua lỗi khi process đã tắt
  }
}

function waitForServer(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      });

      req.on('error', () => {
        retry();
      });

      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    }

    function retry() {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout ${timeoutMs}ms chờ server ${url}`));
      } else {
        setTimeout(check, 250);
      }
    }

    check();
  });
}

export function buildEmpty() {
  console.log(
    '[empty] Đang build tĩnh với QTD_FIXTURES=empty vào dist-empty/...'
  );
  const res = spawnSync('npx', ['astro', 'build'], {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      QTD_FIXTURES: 'empty',
    },
  });

  if (res.status !== 0) {
    console.error('[empty] Lỗi khi build empty fixtures!');
    process.exit(res.status ?? 1);
  }
}

async function runPreview() {
  if (!fs.existsSync(path.resolve('dist-empty'))) {
    buildEmpty();
  }

  console.log(`[empty] Khởi động preview trên cổng ${TARGET_PORT}...`);
  const previewProc = spawn(
    'npx',
    ['astro', 'preview', '--port', String(TARGET_PORT), '--ignore-lock'],
    {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        QTD_FIXTURES: 'empty',
      },
    }
  );

  process.on('SIGINT', () => {
    killProcess(previewProc);
    process.exit(0);
  });

  process.on('exit', () => {
    killProcess(previewProc);
  });

  await waitForServer(`${TARGET_URL}/lien-he`);
  console.log(`[empty] Server đã sẵn sàng tại ${TARGET_URL}`);
}

async function runTests() {
  buildEmpty();

  console.log(`[empty] Khởi động preview server tại cổng ${TARGET_PORT}...`);
  const previewProc = spawn(
    'npx',
    ['astro', 'preview', '--port', String(TARGET_PORT), '--ignore-lock'],
    {
      shell: true,
      stdio: 'pipe',
      env: {
        ...process.env,
        QTD_FIXTURES: 'empty',
      },
    }
  );

  let hasExited = false;
  const cleanup = () => {
    if (!hasExited) {
      hasExited = true;
      killProcess(previewProc);
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
  });
  process.on('exit', cleanup);

  try {
    await waitForServer(`${TARGET_URL}/lien-he`);
    console.log(`[empty] Server đã sẵn sàng. Chạy Playwright project empty...`);

    const playwrightArgs = [
      'playwright',
      'test',
      '--project=empty',
      '--project=unit',
    ];
    const testRes = spawnSync('npx', playwrightArgs, {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        QTD_FIXTURES: 'empty',
      },
    });

    cleanup();

    if (testRes.status !== 0) {
      process.exit(testRes.status ?? 1);
    }

    console.log(
      '\n[empty] Kiểm tra chất lượng thư mục dist-empty bằng check-dist...'
    );
    const checkDistRes = spawnSync(
      'node',
      ['./scripts/check-dist.mjs', 'dist-empty'],
      {
        shell: true,
        stdio: 'inherit',
      }
    );
    process.exit(checkDistRes.status ?? 0);
  } catch (err) {
    console.error('[empty] Thất bại:', err.message);
    cleanup();
    process.exit(1);
  }
}

const action = process.argv[2];
if (action === 'build') {
  buildEmpty();
} else if (action === 'preview') {
  runPreview().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  runTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
