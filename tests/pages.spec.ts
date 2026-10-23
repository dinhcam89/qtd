import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { setupPageGuards } from './helpers';
import { toTelHref, toMailtoHref } from '../src/lib/contact';

const DISCLAIMER =
  'Lãi suất mang tính tham khảo, vui lòng liên hệ quỹ để biết chi tiết.';

test.describe('Trang Quy mô, Sản phẩm, Lãi suất', () => {
  test('/lai-suat: có RATE_DISCLAIMER ngay cạnh bảng, thời điểm áp dụng hợp lệ, không ghép "tính đến", lãi suất chuẩn định dạng', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/lai-suat');

    await expect(page.locator('h1')).toHaveText('Lãi suất');

    // Hai bảng (tiền gửi, cho vay), mỗi bảng một thẻ <table> duy nhất
    await expect(page.locator('table[data-responsive-table]')).toHaveCount(2);

    // Disclaimer nằm cùng khối với các bảng
    const block = page.locator('[data-rates-tables]');
    await expect(block.locator('table')).toHaveCount(2);
    await expect(block).toContainText(DISCLAIMER);

    // Thời điểm áp dụng: ngày dd/mm/yyyy hoặc "Đang cập nhật", không có "tính đến"
    const effective = page.locator('[data-rates-effective]');
    await expect(effective).toContainText('Thời điểm áp dụng:');
    const effText = (await effective.innerText()).trim();
    expect(
      /Thời điểm áp dụng:\s*(\d{2}\/\d{2}\/\d{4}|Đang cập nhật)/.test(effText)
    ).toBe(true);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/tính đến\s+đang cập nhật/i);
    expect(bodyText).not.toMatch(/áp dụng từ.*đang cập nhật/i);

    // Lãi suất hiển thị khớp /^\d+(,\d{1,2})?%(\/năm)?$/ hoặc "Đang cập nhật"
    const rateCells = page.locator('td[data-label*="Lãi suất"]');
    const rateCount = await rateCells.count();
    for (let i = 0; i < rateCount; i++) {
      const text = (await rateCells.nth(i).innerText()).trim();
      expect(
        /^\d+(,\d{1,2})?%(\/năm)?$/.test(text) || text === 'Đang cập nhật'
      ).toBe(true);
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('/quy-mo: dùng StatItem, các thẻ có giá trị hợp lệ hoặc "Đang cập nhật", thời điểm as_of đúng chuẩn', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/quy-mo');

    await expect(page.locator('h1')).toHaveText('Quy mô hoạt động');
    const cards = page.locator('[data-stat-card]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const hasFallback =
        (await card.locator('[data-stat-fallback]').count()) > 0;
      if (hasFallback) {
        await expect(card.locator('[data-stat-fallback]')).toHaveText(
          'Đang cập nhật'
        );
      } else {
        const val = await card.locator('[data-stat-value]').innerText();
        expect(val.trim().length).toBeGreaterThan(0);
      }
    }

    const asOfLocators = page.locator('[data-stat-asof]');
    const asOfCount = await asOfLocators.count();
    if (asOfCount > 0) {
      for (let i = 0; i < asOfCount; i++) {
        const txt = (await asOfLocators.nth(i).innerText()).trim();
        expect(/\d{2}\/\d{2}\/\d{4}/.test(txt)).toBe(true);
      }
    }

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/tính đến\s+đang cập nhật/i);

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('/san-pham: có nhóm cho vay và tiền gửi, các trường hiển thị rõ ràng hoặc "Đang cập nhật"', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/san-pham');

    await expect(page.locator('h1')).toHaveText('Sản phẩm');
    await expect(page.locator('#cho-vay h2')).toHaveText('Sản phẩm cho vay');
    await expect(page.locator('#tien-gui h2')).toHaveText('Sản phẩm tiền gửi');

    const cards = page.locator('[data-product-card]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const title = await card.locator('h3').innerText();
      expect(title.trim().length).toBeGreaterThan(0);
      const dds = card.locator('dd');
      const ddCount = await dds.count();
      for (let j = 0; j < ddCount; j++) {
        const text = (await dds.nth(j).innerText()).trim();
        expect(text.length).toBeGreaterThan(0);
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('trang Giới thiệu có thẻ liên kết tới các trang con (Lịch sử, Ban lãnh đạo, Quy mô, Quy chế)', async ({
    page,
  }) => {
    await page.goto('/gioi-thieu');
    for (const href of ['/quy-mo', '/quy-che']) {
      await expect(
        page.locator(`main a[href="${href}"]`).first()
      ).toBeVisible();
    }
    // /lich-su và /ban-lanh-dao tạm thời ẩn theo yêu cầu người dùng
    for (const href of ['/lich-su', '/ban-lanh-dao']) {
      await expect(page.locator(`main a[href="${href}"]`)).toHaveCount(0);
    }
  });

  test('/quy-che: có đúng 1 h1, liên kết tới file pdf tồn tại trong dist', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/quy-che');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Quy chế và văn bản');

    const emptyBox = page.locator('[data-documents-empty]');
    const docLinks = page.locator('main a[href^="/docs/"][href$=".pdf"]');
    const docLinkCount = await docLinks.count();

    if (docLinkCount === 0) {
      await expect(emptyBox).toBeVisible();
      await expect(emptyBox).toHaveText('Đang cập nhật');
    } else {
      await expect(emptyBox).toHaveCount(0);
      for (let i = 0; i < docLinkCount; i++) {
        const href = await docLinks.nth(i).getAttribute('href');
        expect(href).not.toBeNull();
        const localPath = path.resolve('dist', href!.replace(/^\//, ''));
        expect(fs.existsSync(localPath)).toBe(true);
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('/tin-tuc: hiển thị danh sách tin bài hợp lệ, không xuất hiện bài draft mẫu', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/tin-tuc/');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Tin tức');

    const emptyBox = page.locator('[data-news-empty]');
    const newsItems = page.locator('[data-news-item]');
    const newsCount = await newsItems.count();

    if (newsCount === 0) {
      await expect(emptyBox).toBeVisible();
      await expect(emptyBox).toHaveText('Đang cập nhật');
      await expect(
        page.locator('nav[aria-label="Phân trang tin tức"]')
      ).toHaveCount(0);
    } else {
      await expect(emptyBox).toHaveCount(0);
      for (let i = 0; i < newsCount; i++) {
        const item = newsItems.nth(i);
        const link = item.locator('a').first();
        const href = await link.getAttribute('href');
        expect(href).toMatch(/^\/tin-tuc\/.+/);
        const dateEl = item.locator('time');
        if ((await dateEl.count()) > 0) {
          const dateText = (await dateEl.innerText()).trim();
          expect(/\d{2}\/\d{2}\/\d{4}/.test(dateText)).toBe(true);
        }
      }
    }

    const content = await page.content();
    expect(content).not.toContain('thong-bao-mau');
    expect(content).not.toContain('Tiêu đề thông báo mẫu');

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('/thong-bao: hiển thị lịch làm việc, danh sách thông báo hợp lệ, không có draft', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/thong-bao');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Thông báo và lịch làm việc');

    await expect(page.locator('[data-regular-schedule]')).toBeVisible();

    const emptyNotices = page.locator('[data-notices-empty]');
    const noticeItems = page.locator('[data-notice-item]');
    const noticeCount = await noticeItems.count();

    if (noticeCount === 0) {
      await expect(emptyNotices).toBeVisible();
      await expect(emptyNotices).toHaveText('Đang cập nhật');
    } else {
      await expect(emptyNotices).toHaveCount(0);
      for (let i = 0; i < noticeCount; i++) {
        const item = noticeItems.nth(i);
        const link = item.locator('a').first();
        const href = await link.getAttribute('href');
        expect(href).toMatch(/^\/tin-tuc\/.+/);
      }
    }

    const content = await page.content();
    expect(content).not.toContain('thong-bao-mau');
    expect(content).not.toContain('Tiêu đề thông báo mẫu');

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('/lien-he: kiểm tra tính hợp lệ của số điện thoại, email, bản đồ và không có iframe', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/lien-he');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Thông tin liên hệ');

    // Không có iframe
    await expect(page.locator('iframe')).toHaveCount(0);

    // Mọi thẻ a[href^="tel:"] khớp toTelHref của chính chữ hiển thị
    const telLinks = page.locator('a[href^="tel:"]');
    const telCount = await telLinks.count();
    for (let i = 0; i < telCount; i++) {
      const link = telLinks.nth(i);
      const text = (await link.innerText()).trim();
      const href = await link.getAttribute('href');
      expect(href).toBe(toTelHref(text));
    }

    // Mọi thẻ a[href^="mailto:"] khớp toMailtoHref của chính chữ hiển thị
    const mailLinks = page.locator('a[href^="mailto:"]');
    const mailCount = await mailLinks.count();
    for (let i = 0; i < mailCount; i++) {
      const link = mailLinks.nth(i);
      const text = (await link.innerText()).trim();
      const href = await link.getAttribute('href');
      expect(href).toBe(toMailtoHref(text));
    }

    // Liên kết bản đồ nếu có có tiền tố Google Maps và target/rel đúng
    const mapLinks = page.locator(
      'a[data-map-link], a[href*="google.com/maps"]'
    );
    const mapCount = await mapLinks.count();
    for (let i = 0; i < mapCount; i++) {
      const link = mapLinks.nth(i);
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^https:\/\/(www\.)?google\.com\/maps/);
      expect(await link.getAttribute('target')).toBe('_blank');
      const rel = await link.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }

    // Trụ sở chính: nếu phone khác "Đang cập nhật", bắt buộc có a[href^="tel:"] khớp toTelHref
    const phoneDd = page.locator('[data-contact-phone] dd');
    const phoneText = (await phoneDd.innerText()).trim();
    if (phoneText !== 'Đang cập nhật') {
      const link = phoneDd.locator('a[href^="tel:"]');
      await expect(link).toBeVisible();
      const linkText = (await link.innerText()).trim();
      expect(toTelHref(linkText)).not.toBeNull();
      expect(await link.getAttribute('href')).toBe(toTelHref(linkText));
    }

    // Trụ sở chính: nếu email khác "Đang cập nhật", bắt buộc có a[href^="mailto:"] khớp toMailtoHref
    const emailDd = page.locator('[data-contact-email] dd');
    const emailText = (await emailDd.innerText()).trim();
    if (emailText !== 'Đang cập nhật') {
      const link = emailDd.locator('a[href^="mailto:"]');
      await expect(link).toBeVisible();
      const linkText = (await link.innerText()).trim();
      expect(toMailtoHref(linkText)).not.toBeNull();
      expect(await link.getAttribute('href')).toBe(toMailtoHref(linkText));
    }

    // Có banner dẫn tới /kenh-chinh-thuc
    const bannerLink = page.locator('[data-official-channels-banner] a');
    await expect(bannerLink).toBeVisible();
    await expect(bannerLink).toHaveAttribute('href', '/kenh-chinh-thuc');

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('/kenh-chinh-thuc: domain chính thức, các kênh liên hệ và không có iframe', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/kenh-chinh-thuc');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Kênh thông tin chính thức');

    // Không có iframe
    await expect(page.locator('iframe')).toHaveCount(0);

    // Mọi link tel/mailto nếu có phải chuẩn hóa đúng
    const telLinks = page.locator('a[href^="tel:"]');
    for (let i = 0; i < (await telLinks.count()); i++) {
      const link = telLinks.nth(i);
      const text = (await link.innerText()).trim();
      expect(await link.getAttribute('href')).toBe(toTelHref(text));
    }

    const mailLinks = page.locator('a[href^="mailto:"]');
    for (let i = 0; i < (await mailLinks.count()); i++) {
      const link = mailLinks.nth(i);
      const text = (await link.innerText()).trim();
      expect(await link.getAttribute('href')).toBe(toMailtoHref(text));
    }

    // Domain chính thức: nếu khác "Đang cập nhật", phải gắn link hợp lệ; nếu là "Đang cập nhật", không gắn link
    const domainDd = page.locator('[data-official-domain] dd');
    const domainText = (await domainDd.innerText()).trim();
    if (domainText === 'Đang cập nhật') {
      await expect(domainDd.locator('a')).toHaveCount(0);
    } else {
      const domainLink = domainDd.locator('a');
      await expect(domainLink).toBeVisible();
      const href = await domainLink.getAttribute('href');
      expect(href).toMatch(/^https:\/\//);
    }

    // Đề mục hướng dẫn an toàn
    const content = page.locator('.content-body');
    await expect(content).toBeVisible();

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('bài mẫu draft: true trong src/content/news tuyệt đối không xuất hiện trong dist', () => {
    const distPath = path.resolve('dist');
    if (!fs.existsSync(distPath)) return;

    function checkDir(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        expect(entry.name).not.toContain('thong-bao-mau');
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (
          ['.html', '.js', '.css', '.json', '.txt', '.xml'].includes(
            path.extname(entry.name).toLowerCase()
          )
        ) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content).not.toContain('Tiêu đề thông báo mẫu');
          expect(content).not.toContain('Nội dung chi tiết thông báo mẫu');
        }
      }
    }
    checkDir(distPath);
  });
});
