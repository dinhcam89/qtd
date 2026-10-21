import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupPageGuards } from './helpers';
import { getNavRoutes } from '../src/lib/nav';

const testPages = getNavRoutes();

test.describe('Accessibility tests (Axe)', () => {
  for (const pageInfo of testPages) {
    test(`quét a11y trang ${pageInfo.path} không có lỗi serious hoặc critical`, async ({
      page,
    }) => {
      const { consoleErrors, cspViolations } = await setupPageGuards(page);

      await page.goto(pageInfo.path);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const seriousOrCriticalViolations =
        accessibilityScanResults.violations.filter(
          (violation) =>
            violation.impact === 'serious' || violation.impact === 'critical'
        );

      expect(seriousOrCriticalViolations).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(cspViolations).toEqual([]);
    });
  }
});
