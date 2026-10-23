/**
 * Kiểm tra hostname có phải là tên miền xem trước (workers.dev hoặc pages.dev) hay không.
 */
export function isPreviewHost(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  const h = hostname.trim().toLowerCase();
  return (
    h.endsWith('.workers.dev') ||
    h === 'workers.dev' ||
    h.endsWith('.pages.dev') ||
    h === 'pages.dev'
  );
}

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

  // iii) Xác định biến nhánh và giá trị BUILD_MODE nếu có
  let explicitMode = null;
  if (env.BUILD_MODE) {
    const bm = env.BUILD_MODE.trim().toLowerCase();
    if (bm === 'production' || bm === 'preview') {
      explicitMode = bm;
    } else {
      errors.push(
        `Biến BUILD_MODE không hợp lệ: "${env.BUILD_MODE}". Chỉ chấp nhận "production" hoặc "preview".`
      );
    }
  }

  const rawBranch = env.WORKERS_CI_BRANCH || env.CF_PAGES_BRANCH;
  let branch = null;
  if (rawBranch && rawBranch.trim()) {
    branch = rawBranch.trim();
  }

  const isRealDomain = host ? !isPreviewHost(host) : false;

  // Cảnh báo nếu không đọc được biến nhánh khi host là preview (workers.dev / pages.dev)
  if (!rawBranch && !explicitMode && !isRealDomain) {
    warnings.push(
      'Không tìm thấy biến môi trường nhánh (WORKERS_CI_BRANCH hoặc biến dự phòng, chưa xác minh CF_PAGES_BRANCH). Mặc định coi là chế độ preview.'
    );
  }

  // Mâu thuẫn: BUILD_MODE=preview kết hợp SITE_URL tên miền thật: TỪ CHỐI
  if (explicitMode === 'preview' && isRealDomain) {
    errors.push(
      `Mâu thuẫn cấu hình: BUILD_MODE được đặt là "preview" nhưng SITE_URL sử dụng tên miền thật ("${host}"). Chế độ preview chỉ cho phép tên miền workers.dev hoặc pages.dev.`
    );
  }

  // iv) Quyết định chế độ build:
  // - Nếu có BUILD_MODE:
  //     + BUILD_MODE=preview: mode = 'preview' (nếu host là tên miền thật thì đã báo lỗi mâu thuẫn ở trên).
  //     + BUILD_MODE=production: mode = 'production'.
  // - Nếu không có BUILD_MODE:
  //     + production nếu nhánh = "production" HOẶC host là tên miền thật (không phải workers.dev / pages.dev),
  //       bất kể nhánh và kể cả khi không đọc được biến nhánh.
  //     + preview nếu host là workers.dev hoặc pages.dev.
  let mode = 'preview';
  if (explicitMode === 'production') {
    mode = 'production';
  } else if (explicitMode === 'preview') {
    mode = 'preview';
  } else if (branch === 'production' || isRealDomain) {
    mode = 'production';
  } else {
    mode = 'preview';
  }

  // v) Kiểm tra an toàn cho chế độ production:
  // - host không được là workers.dev hoặc pages.dev
  // - nếu site.official_domain khác null thì host SITE_URL phải bằng official_domain
  if (mode === 'production') {
    if (host) {
      if (isPreviewHost(host)) {
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
    isRealDomain,
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
