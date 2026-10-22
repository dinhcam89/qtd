import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const isStrict = process.argv.includes('--strict');
const searchDirs = ['src', 'public'];
const placeholderRegex =
  /(\[CẦN BỔ SUNG[^\]]*\]|\[TÊN QUỸ\]|\[CẦN XÁC NHẬN[^\]]*\])/g;

let placeholderCount = 0;
let nullFieldCount = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== 'node_modules' &&
        entry.name !== '.astro' &&
        entry.name !== 'fixtures'
      ) {
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
            placeholderCount++;
            const label = isStrict
              ? '[LỖI PLACEHOLDER (--strict)]'
              : '[CẢNH BÁO PLACEHOLDER]';
            console.warn(`${label} ${fullPath}:${index + 1} -> ${m}`);
          });
        }
      });
    }
  }
}

function checkRequiredYamlFields() {
  const dataDir = path.join('src', 'data');
  if (!fs.existsSync(dataDir)) return;

  const requiredSpecs = [
    {
      file: 'site.yaml',
      checks: [
        { path: 'name', label: 'Tên quỹ' },
        { path: 'short_name', label: 'Tên viết tắt' },
        { path: 'license_number', label: 'Số giấy phép' },
        { path: 'established_year', label: 'Năm thành lập' },
        { path: 'operating_area', label: 'Địa bàn hoạt động' },
        { path: 'stats.as_of', label: 'Ngày số liệu quy mô (as_of)' },
        { path: 'stats.members_count', label: 'Số thành viên' },
        { path: 'stats.charter_capital', label: 'Vốn điều lệ' },
        { path: 'stats.total_assets', label: 'Tổng tài sản' },
      ],
    },
    {
      file: 'rates.yaml',
      checks: [{ path: 'effective_from', label: 'Ngày áp dụng lãi suất' }],
      custom: (data, filePath) => {
        if (Array.isArray(data?.deposit_rates)) {
          data.deposit_rates.forEach((item, idx) => {
            if (item.rate === null || item.rate === undefined) {
              nullFieldCount++;
              console.error(
                `[LỖI DỮ LIỆU THIẾU (--strict)] ${filePath} -> deposit_rates[${idx}].rate còn null`
              );
            }
          });
        }
        if (Array.isArray(data?.loan_rates)) {
          data.loan_rates.forEach((item, idx) => {
            if (item.rate === null || item.rate === undefined) {
              nullFieldCount++;
              console.error(
                `[LỖI DỮ LIỆU THIẾU (--strict)] ${filePath} -> loan_rates[${idx}].rate còn null`
              );
            }
          });
        }
      },
    },
    {
      file: 'contact.yaml',
      checks: [
        { path: 'phone', label: 'Số điện thoại' },
        { path: 'email', label: 'Email' },
        { path: 'address.full', label: 'Địa chỉ đầy đủ' },
      ],
    },
    {
      file: 'schedule.yaml',
      checks: [
        { path: 'working_days', label: 'Ngày làm việc' },
        { path: 'morning_hours', label: 'Giờ làm việc buổi sáng' },
        { path: 'afternoon_hours', label: 'Giờ làm việc buổi chiều' },
      ],
    },
    {
      file: 'leadership.yaml',
      custom: (data, filePath) => {
        ['board_of_directors', 'supervisory_board', 'executive_board'].forEach(
          (group) => {
            if (Array.isArray(data?.[group])) {
              data[group].forEach((m, idx) => {
                if (m.name === null || m.name === undefined) {
                  nullFieldCount++;
                  console.error(
                    `[LỖI DỮ LIỆU THIẾU (--strict)] ${filePath} -> ${group}[${idx}].name còn null`
                  );
                }
              });
            }
          }
        );
      },
    },
  ];

  for (const spec of requiredSpecs) {
    const fullPath = path.join(dataDir, spec.file);
    if (!fs.existsSync(fullPath)) continue;

    const raw = fs.readFileSync(fullPath, 'utf-8');
    let parsed;
    try {
      parsed = YAML.parse(raw);
    } catch (err) {
      console.error(`[LỖI PARSE YAML] ${fullPath}: ${err.message}`);
      nullFieldCount++;
      continue;
    }

    if (spec.checks) {
      for (const check of spec.checks) {
        const segments = check.path.split('.');
        let current = parsed;
        for (const seg of segments) {
          current = current?.[seg];
        }
        if (current === null || current === undefined) {
          nullFieldCount++;
          console.error(
            `[LỖI DỮ LIỆU THIẾU (--strict)] ${fullPath} -> Trường '${check.path}' (${check.label}) có giá trị null`
          );
        }
      }
    }

    if (spec.custom) {
      spec.custom(parsed, fullPath);
    }
  }
}

console.log(
  `--- Kiểm tra placeholder & tính đầy đủ dữ liệu (Chế độ: ${isStrict ? 'STRICT' : 'CẢNH BÁO'}) ---`
);

for (const dir of searchDirs) {
  scanDir(dir);
}

if (isStrict) {
  checkRequiredYamlFields();
}

console.log('\n--- TỔNG KẾT KIỂM TRA DỮ LIỆU ---');
console.log(`Số placeholder phát hiện: ${placeholderCount}`);

if (isStrict) {
  console.log(`Số trường bắt buộc còn null: ${nullFieldCount}`);
  const totalIssues = placeholderCount + nullFieldCount;
  if (totalIssues > 0) {
    console.error(
      `\n[THẤT BẠI] Chế độ --strict phát hiện ${totalIssues} vấn đề (placeholder / trường null). Thoát với mã 1.\n`
    );
    process.exit(1);
  }
  console.log(
    '\n[THÀNH CÔNG] Toàn bộ dữ liệu đầy đủ, không còn placeholder hay giá trị null.\n'
  );
  process.exit(0);
} else {
  console.log(
    '--- Kết thúc (Chế độ cảnh báo, thoát mã 0. Dùng --strict để kích hoạt kiểm tra nghiêm ngặt) ---\n'
  );
  process.exit(0);
}
