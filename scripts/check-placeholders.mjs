import fs from 'node:fs';
import path from 'node:path';

const searchDirs = ['src', 'public'];
const placeholderRegex =
  /(\[CẦN BỔ SUNG[^\]]*\]|\[TÊN QUỸ\]|\[CẦN XÁC NHẬN[^\]]*\])/g;
let foundCount = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.astro') {
        scanDir(fullPath);
      }
    } else if (
      entry.isFile() &&
      /\.(astro|ts|js|mjs|yaml|yml|md|html)$/.test(entry.name)
    ) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const matches = line.match(placeholderRegex);
        if (matches) {
          matches.forEach((m) => {
            foundCount++;
            console.warn(
              `[CẢNH BÁO PLACEHOLDER] ${fullPath}:${index + 1} -> ${m}`
            );
          });
        }
      });
    }
  }
}

console.log(
  '--- Kiểm tra placeholder trong dự án (Phase 1 - Chỉ cảnh báo) ---'
);
for (const dir of searchDirs) {
  scanDir(dir);
}
console.log(
  `--- Tổng số placeholder tìm thấy: ${foundCount} (Ghi nhận để theo dõi) ---\n`
);
