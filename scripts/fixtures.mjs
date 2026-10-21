import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import process from 'node:process';

const FIXTURES_DOCS_DIR = path.resolve('src/fixtures/public/docs');
const LARGE_PDF_PATH = path.join(FIXTURES_DOCS_DIR, 'fixture-large.pdf');
const TARGET_PORT = 4322;
const TARGET_URL = `http://localhost:${TARGET_PORT}`;

function createMinimalPdfBuffer() {
  return Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>> >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF
`,
    'utf-8'
  );
}

/**
 * Tạo PDF hợp lệ có dung lượng chính xác 1.572.864 byte (1,5 MB) bằng stream đệm.
 */
function createLargePdfBuffer() {
  const targetBytes = 1572864; // 1,5 MB
  const header = Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>> >>
endobj
4 0 obj
<< /Length `,
    'utf-8'
  );

  const streamHeader = Buffer.from(
    ` >>
stream
`,
    'utf-8'
  );

  const streamFooter = Buffer.from(
    `
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000190 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
0000000000
%%EOF
`,
    'utf-8'
  );

  // Tính toán dung lượng payload cần đệm để tổng buffer đạt đúng targetBytes
  const lengthPlaceholder = Buffer.from('1500000', 'utf-8');
  const baseSize =
    header.length +
    lengthPlaceholder.length +
    streamHeader.length +
    streamFooter.length;
  const paddingLength = targetBytes - baseSize;

  const lengthStr = String(paddingLength);
  const finalHeader = Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>> >>
endobj
4 0 obj
<< /Length ${lengthStr} >>
stream
`,
    'utf-8'
  );

  const padding = Buffer.alloc(paddingLength, 0x20); // Dùng khoảng trắng an toàn
  const fullWithoutXref = Buffer.concat([
    finalHeader,
    padding,
    Buffer.from('\nendstream\nendobj\n', 'utf-8'),
  ]);

  const startxrefOffset = fullWithoutXref.length;
  const xrefAndTrailer = Buffer.from(
    `xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000190 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${startxrefOffset}
%%EOF
`,
    'utf-8'
  );

  const result = Buffer.concat([fullWithoutXref, xrefAndTrailer]);
  if (result.length < targetBytes) {
    const diff = targetBytes - result.length;
    // Đệm thêm comment cuối file
    const commentPadding = Buffer.concat([
      result.slice(0, result.length - 7),
      Buffer.alloc(diff, 0x20),
      Buffer.from('\n%%EOF\n', 'utf-8'),
    ]);
    return commentPadding;
  }
  return result;
}

export function ensureFixtures() {
  if (!fs.existsSync(FIXTURES_DOCS_DIR)) {
    fs.mkdirSync(FIXTURES_DOCS_DIR, { recursive: true });
  }

  const smallFiles = [
    'fixture-dieu-le.pdf',
    'fixture-quy-che.pdf',
    'fixture-an-toan.pdf',
    'fixture-bieu-mau.pdf',
  ];

  for (const file of smallFiles) {
    const filePath = path.join(FIXTURES_DOCS_DIR, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, createMinimalPdfBuffer());
    }
  }

  if (
    !fs.existsSync(LARGE_PDF_PATH) ||
    fs.statSync(LARGE_PDF_PATH).size <= 1048576
  ) {
    fs.writeFileSync(LARGE_PDF_PATH, createLargePdfBuffer());
  }
}

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

export function buildFixtures() {
  ensureFixtures();
  console.log(
    '[fixtures] Đang build tĩnh với QTD_FIXTURES=1 vào dist-fixtures/...'
  );
  const res = spawnSync('npx', ['astro', 'build'], {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      QTD_FIXTURES: '1',
    },
  });

  if (res.status !== 0) {
    console.error('[fixtures] Lỗi khi build fixtures!');
    process.exit(res.status ?? 1);
  }
}

async function runPreview() {
  ensureFixtures();
  if (!fs.existsSync(path.resolve('dist-fixtures'))) {
    buildFixtures();
  }

  console.log(`[fixtures] Khởi động preview trên cổng ${TARGET_PORT}...`);
  const previewProc = spawn(
    'npx',
    [
      'astro',
      'preview',
      '--outDir',
      'dist-fixtures',
      '--port',
      String(TARGET_PORT),
    ],
    {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        QTD_FIXTURES: '1',
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

  await waitForServer(`${TARGET_URL}/quy-che`);
  console.log(`[fixtures] Server đã sẵn sàng tại ${TARGET_URL}`);
}

async function runTests() {
  ensureFixtures();
  buildFixtures();

  console.log(`[fixtures] Khởi động preview server tại cổng ${TARGET_PORT}...`);
  const previewProc = spawn(
    'npx',
    [
      'astro',
      'preview',
      '--outDir',
      'dist-fixtures',
      '--port',
      String(TARGET_PORT),
    ],
    {
      shell: true,
      stdio: 'pipe',
      env: {
        ...process.env,
        QTD_FIXTURES: '1',
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
    await waitForServer(`${TARGET_URL}/quy-che`);
    console.log(
      `[fixtures] Server đã sẵn sàng. Chạy Playwright project fixtures...`
    );

    const playwrightArgs = [
      'playwright',
      'test',
      '--project=fixtures',
      '--project=unit',
    ];
    const testRes = spawnSync('npx', playwrightArgs, {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        QTD_FIXTURES: '1',
      },
    });

    cleanup();
    process.exit(testRes.status ?? 0);
  } catch (err) {
    console.error('[fixtures] Thất bại:', err.message);
    cleanup();
    process.exit(1);
  }
}

const action = process.argv[2];
if (action === 'build') {
  buildFixtures();
} else if (action === 'preview') {
  runPreview().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else if (action === 'ensure') {
  ensureFixtures();
} else {
  runTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
