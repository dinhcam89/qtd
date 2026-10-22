import fs from 'node:fs';
import path from 'node:path';

const distDir = process.argv[2] || 'dist';
const isFixturesDist =
  distDir === 'dist-fixtures' || distDir.includes('fixture');
let errors = [];

function checkDistHtmlFiles() {
  if (!fs.existsSync(distDir)) {
    console.error(
      `[LỖI] Thư mục '${distDir}' không tồn tại. Hãy chạy 'npm run build' trước.`
    );
    process.exit(1);
  }

  const htmlFiles = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    }
  }

  scanDir(distDir);

  if (htmlFiles.length === 0) {
    console.error(`[LỖI] Không tìm thấy file .html nào trong '${distDir}'.`);
    process.exit(1);
  }

  console.log(
    `--- Bắt đầu kiểm tra ${htmlFiles.length} file HTML trong '${distDir}' ---`
  );

  for (const filePath of htmlFiles) {
    const relativePath = path.relative(distDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Kiểm tra <style> inline
    const styleMatches = content.match(/<style\b[^>]*>/gi);
    if (styleMatches) {
      errors.push(
        `${relativePath}: Phát hiện ${styleMatches.length} thẻ <style> inline.`
      );
    }

    // 2. Kiểm tra <script> inline (ngoại trừ type="application/ld+json")
    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    while ((scriptMatch = scriptRegex.exec(content)) !== null) {
      const attrs = scriptMatch[1] || '';
      const body = (scriptMatch[2] || '').trim();
      const hasSrc = /\bsrc\s*=/i.test(attrs);
      const isLdJson = /\btype\s*=\s*["']application\/ld\+json["']/i.test(
        attrs
      );

      if (!hasSrc && !isLdJson && body.length > 0) {
        errors.push(
          `${relativePath}: Phát hiện thẻ <script> inline không phải application/ld+json.`
        );
      }
    }

    // 3. Kiểm tra lang trên <html>
    if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(content)) {
      errors.push(`${relativePath}: Thẻ <html> thiếu thuộc tính lang hợp lệ.`);
    }

    // 4. Kiểm tra <title>
    const titleMatch = content.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    if (!titleMatch || titleMatch[1].trim().length === 0) {
      errors.push(
        `${relativePath}: Thiếu thẻ <title> hoặc nội dung title rỗng.`
      );
    }

    // 5. Kiểm tra meta description
    const descMatch =
      content.match(
        /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["']/i
      ) ||
      content.match(
        /<meta\b[^>]*\bcontent=["']([^"']*)["'][^>]*\bname=["']description["']/i
      );
    if (!descMatch || descMatch[1].trim().length === 0) {
      errors.push(
        `${relativePath}: Thiếu thẻ meta description hoặc content rỗng.`
      );
    }

    // 6. Kiểm tra số lượng thẻ <h1> (phải có đúng 1)
    const h1Matches = content.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi);
    if (!h1Matches || h1Matches.length === 0) {
      errors.push(`${relativePath}: Trang thiếu thẻ <h1>.`);
    } else if (h1Matches.length > 1) {
      errors.push(
        `${relativePath}: Trang có ${h1Matches.length} thẻ <h1> (chỉ được phép đúng 1).`
      );
    }

    // 7. Kiểm tra <img> thiếu alt
    const imgRegex = /<img\b([^>]*)>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
      const attrs = imgMatch[1] || '';
      if (!/\balt\s*=\s*["'][^"']*["']/i.test(attrs)) {
        errors.push(`${relativePath}: Thẻ <img> thiếu thuộc tính alt.`);
      }
    }

    // 7.5. Kiểm tra <iframe> (không được phép trong dist)
    const iframeMatches = content.match(/<iframe\b[^>]*>/gi);
    if (iframeMatches) {
      errors.push(
        `${relativePath}: Phát hiện ${iframeMatches.length} thẻ <iframe> không được phép.`
      );
    }

    // 8. Kiểm tra src/href tới domain bên ngoài
    // Đối với src: không được trỏ domain bên ngoài
    const srcRegex = /\bsrc\s*=\s*["'](https?:\/\/|\/\/)([^"']+)["']/gi;
    let srcMatch;
    while ((srcMatch = srcRegex.exec(content)) !== null) {
      errors.push(
        `${relativePath}: Phát hiện src liên kết tới tài nguyên bên ngoài '${srcMatch[0]}'.`
      );
    }

    // Đối với href trên <a>: nếu ra ngoài, bắt buộc có rel="noopener noreferrer"
    const aRegex = /<a\b([^>]*)>/gi;
    let aMatch;
    while ((aMatch = aRegex.exec(content)) !== null) {
      const attrs = aMatch[1] || '';
      const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if (hrefMatch) {
        const href = hrefMatch[1];
        if (/^(https?:|\/\/)/i.test(href)) {
          const relMatch = attrs.match(/\brel\s*=\s*["']([^"']+)["']/i);
          const relValue = relMatch ? relMatch[1].toLowerCase() : '';
          if (
            !relValue.includes('noopener') ||
            !relValue.includes('noreferrer')
          ) {
            errors.push(
              `${relativePath}: Link ra ngoài '${href}' thiếu rel="noopener noreferrer".`
            );
          }
        } else if (href.startsWith('tel:')) {
          const telValue = href.slice(4);
          if (!/^(\+84|0)[0-9]{8,10}$/.test(telValue)) {
            errors.push(
              `${relativePath}: Link tel: '${href}' không đúng định dạng hợp lệ (phải bắt đầu bằng 0 hoặc +84, chỉ chứa chữ số, không khoảng trắng/chấm).`
            );
          }
        } else if (href.startsWith('mailto:')) {
          const mailtoValue = href.slice(7);
          if (
            !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
              mailtoValue
            )
          ) {
            errors.push(
              `${relativePath}: Link mailto: '${href}' không đúng định dạng email hợp lệ.`
            );
          }
        } else if (!href.startsWith('#') && !href.startsWith('javascript:')) {
          // Link nội bộ: kiểm tra xem file đích có tồn tại trong dist không
          let cleanHref = href.split('#')[0].split('?')[0];
          if (cleanHref.startsWith('/')) {
            cleanHref = cleanHref.slice(1);
          }
          if (cleanHref === '' || cleanHref.endsWith('/')) {
            cleanHref = path.join(cleanHref, 'index.html');
          } else if (!path.extname(cleanHref)) {
            // Trường hợp /404 -> dist/404.html hoặc dist/404/index.html
            const asHtml = `${cleanHref}.html`;
            const asIndex = path.join(cleanHref, 'index.html');
            if (fs.existsSync(path.join(distDir, asHtml))) {
              cleanHref = asHtml;
            } else {
              cleanHref = asIndex;
            }
          }
          const targetPath = path.join(distDir, cleanHref);
          if (!fs.existsSync(targetPath)) {
            errors.push(
              `${relativePath}: Link nội bộ trỏ tới file không tồn tại trong dist: '${href}'.`
            );
          }
        }
      }
    }
  }

  // 6. Kiểm tra file _headers trong dist (chỉ áp dụng cho bản production)
  if (!isFixturesDist) {
    const headersPath = path.join(distDir, '_headers');
    if (!fs.existsSync(headersPath)) {
      errors.push(`${distDir}: Thiếu file '_headers' trong thư mục đầu ra.`);
    } else {
      const headersContent = fs.readFileSync(headersPath, 'utf-8');
      const hasPagesDev =
        headersContent.includes('pages.dev/*') &&
        headersContent.includes('X-Robots-Tag: noindex');
      const hasWorkersDev =
        headersContent.includes('workers.dev/*') &&
        headersContent.includes('X-Robots-Tag: noindex');

      if (!hasPagesDev) {
        errors.push(
          `_headers: Thiếu rule chặn index (X-Robots-Tag: noindex) cho host pages.dev.`
        );
      }
      if (!hasWorkersDev) {
        errors.push(
          `_headers: Thiếu rule chặn index (X-Robots-Tag: noindex) cho host workers.dev.`
        );
      }
    }

    // 7. Hàng rào chống lọt fixture vào bản production
    const fixturesDir = path.resolve('src/fixtures');
    const fixtureFileNames = new Set();
    if (fs.existsSync(fixturesDir)) {
      function collectFixtureFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            collectFixtureFiles(full);
          } else if (entry.isFile()) {
            fixtureFileNames.add(entry.name);
          }
        }
      }
      collectFixtureFiles(fixturesDir);
    }

    function checkAllDistFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relative = path.relative(distDir, fullPath).replace(/\\/g, '/');

        if (entry.name === 'dist-fixtures') {
          errors.push(
            `${relative}: Phát hiện thư mục 'dist-fixtures' nằm trong dist.`
          );
        }

        if (entry.name.includes('[FIXTURE]')) {
          errors.push(`${relative}: Tên file/thư mục chứa chuỗi '[FIXTURE]'.`);
        }

        if (entry.isDirectory()) {
          checkAllDistFiles(fullPath);
        } else if (entry.isFile()) {
          if (fixtureFileNames.has(entry.name)) {
            errors.push(
              `${relative}: Phát hiện file '${entry.name}' bắt nguồn từ src/fixtures lọt vào dist.`
            );
          }

          const ext = path.extname(entry.name).toLowerCase();
          if (
            [
              '.html',
              '.js',
              '.css',
              '.json',
              '.txt',
              '.xml',
              '.svg',
              '.map',
            ].includes(ext)
          ) {
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            if (fileContent.includes('[FIXTURE]')) {
              errors.push(
                `${relative}: Nội dung file chứa chuỗi '[FIXTURE]' không được phép trong dist.`
              );
            }
          }
        }
      }
    }

    checkAllDistFiles(distDir);
  }

  if (errors.length > 0) {
    console.error(`\n[THẤT BẠI] Phát hiện ${errors.length} lỗi trong dist:`);
    errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
    process.exit(1);
  }

  console.log(
    '\n[THÀNH CÔNG] Toàn bộ file trong dist đạt tiêu chuẩn chất lượng (check:dist pass).'
  );
  process.exit(0);
}

checkDistHtmlFiles();
