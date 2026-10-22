/**
 * Hàm thuần quyết định chế độ build cho Cloudflare Workers Builds.
 * Không phụ thuộc vào I/O để dễ dàng kiểm thử đơn vị.
 */
export function decideBuildMode(env, siteData = {}) {
  const errors = [];
  const warnings = [];

  // i) Nếu biến QTD_FIXTURES được đặt (khác rỗng và khác "0"): TỪ CHỐI build.
  if (
    env.QTD_FIXTURES !== undefined &&
    env.QTD_FIXTURES !== '' &&
    env.QTD_FIXTURES !== '0'
  ) {
    errors.push(
      'Biến môi trường QTD_FIXTURES đang được đặt. Không được phép build môi trường Cloudflare với dữ liệu fixture.'
    );
  }

  // ii) SITE_URL bắt buộc: https://<hostname> không đường dẫn, không dấu "/" cuối cùng quá một ký tự, không query, không cổng.
  const rawSiteUrl = env.SITE_URL;
  let host = '';

  if (!rawSiteUrl || typeof rawSiteUrl !== 'string' || !rawSiteUrl.trim()) {
    errors.push(
      'Thiếu biến môi trường SITE_URL bắt buộc (ví dụ: https://qtd.dinhcam1512.workers.dev).'
    );
  } else {
    const trimmedUrl = rawSiteUrl.trim();
    if (!trimmedUrl.startsWith('https://')) {
      errors.push(
        `SITE_URL phải bắt đầu bằng https:// (nhận được: "${trimmedUrl}").`
      );
    } else if (trimmedUrl.includes('?')) {
      errors.push('SITE_URL không được chứa query string (?query).');
    } else if (trimmedUrl.endsWith('//')) {
      errors.push('SITE_URL không được chứa dấu "/" cuối cùng quá một ký tự.');
    } else {
      try {
        const parsedUrl = new URL(trimmedUrl);
        if (parsedUrl.port) {
          errors.push('SITE_URL không được chứa cổng (:port).');
        }
        if (parsedUrl.pathname !== '/' && parsedUrl.pathname !== '') {
          errors.push(
            `SITE_URL không được chứa đường dẫn path (nhận được path: "${parsedUrl.pathname}").`
          );
        }
        host = parsedUrl.hostname.toLowerCase();
        if (!host || host.includes(' ')) {
          errors.push(`Tên miền trong SITE_URL không hợp lệ: "${host}".`);
        }
      } catch {
        errors.push(`SITE_URL không phải là URL hợp lệ: "${trimmedUrl}".`);
      }
    }
  }

  // iii) Nhánh hiện tại đọc từ biến môi trường của Cloudflare Workers Builds (WORKERS_CI_BRANCH hoặc fallback CF_PAGES_BRANCH).
  // Cho phép ghi đè bằng BUILD_MODE=production hoặc preview.
  let mode = 'preview';
  let branch = null;

  if (env.BUILD_MODE) {
    const bm = env.BUILD_MODE.trim().toLowerCase();
    if (bm === 'production' || bm === 'preview') {
      mode = bm;
    } else {
      errors.push(
        `Biến BUILD_MODE không hợp lệ: "${env.BUILD_MODE}". Chỉ chấp nhận "production" hoặc "preview".`
      );
    }
  } else {
    const rawBranch = env.WORKERS_CI_BRANCH || env.CF_PAGES_BRANCH;
    if (rawBranch && rawBranch.trim()) {
      branch = rawBranch.trim();
      if (branch === 'production') {
        mode = 'production';
      } else {
        mode = 'preview';
      }
    } else {
      // v) Biến nhánh không có: in cảnh báo rõ ràng và coi là preview.
      warnings.push(
        'Không tìm thấy biến môi trường nhánh (WORKERS_CI_BRANCH hoặc CF_PAGES_BRANCH). Mặc định coi là chế độ preview.'
      );
      mode = 'preview';
    }
  }

  // iv) Nhánh có tên đúng "production" (hoặc BUILD_MODE=production):
  // SITE_URL không được có host kết thúc bằng workers.dev hoặc pages.dev,
  // và nếu site.official_domain khác null thì host của SITE_URL phải bằng official_domain.
  if (mode === 'production') {
    if (host) {
      if (
        host.endsWith('.workers.dev') ||
        host === 'workers.dev' ||
        host.endsWith('.pages.dev') ||
        host === 'pages.dev'
      ) {
        errors.push(
          `Ở chế độ production, host của SITE_URL không được kết thúc bằng workers.dev hoặc pages.dev (nhận được: "${host}").`
        );
      }

      const officialDomain = siteData?.official_domain;
      if (
        officialDomain !== null &&
        officialDomain !== undefined &&
        String(officialDomain).trim() !== '' &&
        String(officialDomain).trim() !== 'null'
      ) {
        const expectedHost = String(officialDomain).trim().toLowerCase();
        if (host !== expectedHost) {
          errors.push(
            `Host của SITE_URL ("${host}") không khớp với site.official_domain ("${expectedHost}").`
          );
        }
      }
    }
  }

  return {
    mode,
    branch,
    siteUrl: rawSiteUrl ? rawSiteUrl.trim() : '',
    host,
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
