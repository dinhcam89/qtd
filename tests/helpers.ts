import fs from 'node:fs';
import type { Page } from '@playwright/test';

/**
 * Đọc cấu hình headers từ khối /* của public/_headers
 */
export function getSecurityHeaders(): Record<string, string> {
  const headersPath = 'public/_headers';
  if (!fs.existsSync(headersPath)) return {};

  const content = fs.readFileSync(headersPath, 'utf-8');
  const headers: Record<string, string> = {};

  const lines = content.split('\n');
  let inRootBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed === '/*') {
      inRootBlock = true;
      continue;
    } else if (trimmed.startsWith('/') || trimmed.startsWith('http')) {
      inRootBlock = false;
      continue;
    }

    if (inRootBlock) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex !== -1) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();
        headers[key] = value;
      }
    }
  }

  return headers;
}

/**
 * Áp dụng headers từ public/_headers vào mọi response qua page.route
 * Thu thập lỗi console.error và cảnh báo vi phạm CSP
 */
export async function setupPageGuards(page: Page) {
  const securityHeaders = getSecurityHeaders();
  const consoleErrors: string[] = [];
  const cspViolations: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
    if (
      /content security policy/i.test(text) ||
      /violates the following Content Security Policy/i.test(text) ||
      /blocked by Content Security Policy/i.test(text)
    ) {
      cspViolations.push(text);
    }
  });

  await page.route('**/*', async (route) => {
    try {
      const response = await route.fetch();
      const originalHeaders = response.headers();
      await route.fulfill({
        response,
        headers: {
          ...originalHeaders,
          ...securityHeaders,
        },
      });
    } catch {
      // Bỏ qua lỗi khi request hoàn tất sau khi test context đã đóng
    }
  });

  return { consoleErrors, cspViolations };
}
