import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { performance } from 'node:perf_hooks';

const logFileDir = path.resolve('reports');
const logFilePath = path.join(logFileDir, 'verify-latest.log');

if (!fs.existsSync(logFileDir)) {
  fs.mkdirSync(logFileDir, { recursive: true });
}

let fullLog = `=== VERIFY LOG - ${new Date().toISOString()} ===\n\n`;
let hasFailed = false;

function logAndAppend(text) {
  process.stdout.write(text + '\n');
}

function runStep(name, command, options = {}) {
  const { allowFailure = false, isTest = false, isEol = false } = options;
  const start = performance.now();

  fullLog += `\n>>> RUNNING STEP: ${name} [${command}]\n`;

  let stepSuccess = false;
  let testSummary = '';
  let durationStr = '';
  let combinedOutput = '';

  if (isEol) {
    const res = spawnSync('git', ['ls-files', '--eol'], {
      shell: true,
      encoding: 'utf8',
    });
    combinedOutput = (res.stdout || '') + (res.stderr || '');
    fullLog += combinedOutput + '\n';
    const lines = combinedOutput.split('\n');
    const crlfFiles = lines.filter((l) => l.includes('i/crlf'));
    if (res.status === 0 && crlfFiles.length === 0) {
      stepSuccess = true;
    } else {
      stepSuccess = false;
      if (crlfFiles.length > 0) {
        fullLog += `[LỖI EOL] Tìm thấy file có i/crlf:\n${crlfFiles.join('\n')}\n`;
      }
    }
  } else {
    const res = spawnSync(command, {
      shell: true,
      encoding: 'utf8',
      env: process.env,
    });
    combinedOutput = (res.stdout || '') + (res.stderr || '');
    fullLog += combinedOutput + '\n';

    if (isTest) {
      const passedMatch = combinedOutput.match(/(\d+)\s+passed/);
      const skippedMatch = combinedOutput.match(/(\d+)\s+skipped/);
      const failedMatch = combinedOutput.match(/(\d+)\s+failed/);

      const passed = passedMatch ? passedMatch[1] : '0';
      const skipped = skippedMatch ? skippedMatch[1] : '0';
      const failed = failedMatch ? failedMatch[1] : '0';

      testSummary = ` (${passed} passed, ${skipped} skipped, ${failed} failed)`;
      stepSuccess = res.status === 0 && failed === '0';
    } else {
      stepSuccess = res.status === 0;
    }
  }

  const end = performance.now();
  durationStr = ((end - start) / 1000).toFixed(2) + 's';

  if (stepSuccess) {
    logAndAppend(`[PASS] ${name}${testSummary} (${durationStr})`);
  } else if (allowFailure) {
    logAndAppend(
      `[WARN] ${name}${testSummary} (${durationStr}) - Bỏ qua lỗi theo quy định`
    );
  } else {
    logAndAppend(`[FAIL] ${name}${testSummary} (${durationStr})`);
    hasFailed = true;
  }

  return stepSuccess || allowFailure;
}

const steps = [
  { name: 'lint', cmd: 'npm run lint' },
  { name: 'check', cmd: 'npm run check' },
  { name: 'build', cmd: 'npm run build' },
  { name: 'test', cmd: 'npm run test', isTest: true },
  { name: 'fixtures', cmd: 'npm run test:fixtures', isTest: true },
  { name: 'check:dist', cmd: 'npm run check:dist' },
  { name: 'lhci', cmd: 'npm run lhci' },
  { name: 'check:contrast', cmd: 'npm run check:contrast' },
  {
    name: 'check:placeholders',
    cmd: 'npm run check:placeholders',
    allowFailure: true,
  },
  { name: 'eol', cmd: 'git ls-files --eol', isEol: true },
];

for (const step of steps) {
  const success = runStep(step.name, step.cmd, {
    allowFailure: step.allowFailure,
    isTest: step.isTest,
    isEol: step.isEol,
  });

  if (!success && !step.allowFailure) {
    break;
  }
}

fullLog += `\n=== KẾT QUẢ TỔNG QUAN: ${hasFailed ? 'FAIL' : 'PASS'} ===\n`;
fs.writeFileSync(logFilePath, fullLog, 'utf8');

if (hasFailed) {
  process.exit(1);
} else {
  process.exit(0);
}
