/**
 * Quản lý tương tác menu điều hướng (Mobile Navigation Drawer & Accessibility)
 */
function initMenu(): void {
  const toggleBtn = document.getElementById(
    'menu-toggle-btn'
  ) as HTMLButtonElement | null;
  const panel = document.getElementById(
    'mobile-nav-panel'
  ) as HTMLElement | null;

  if (!toggleBtn || !panel) {
    return;
  }

  const iconOpen = toggleBtn.querySelector('.icon-open');
  const iconClose = toggleBtn.querySelector('.icon-close');
  const links = panel.querySelectorAll('a');

  // Progressive enhancement: JS sẵn sàng, hiện nút toggle và đóng panel
  toggleBtn.classList.remove('hidden');
  panel.classList.add('hidden');
  toggleBtn.setAttribute('aria-expanded', 'false');

  function openMenu(): void {
    if (!toggleBtn || !panel) return;
    toggleBtn.setAttribute('aria-expanded', 'true');
    panel.classList.remove('hidden');
    iconOpen?.classList.add('hidden');
    iconClose?.classList.remove('hidden');
  }

  function closeMenu(restoreFocus = false): void {
    if (!toggleBtn || !panel) return;
    toggleBtn.setAttribute('aria-expanded', 'false');
    panel.classList.add('hidden');
    iconOpen?.classList.remove('hidden');
    iconClose?.classList.add('hidden');

    if (restoreFocus) {
      toggleBtn.focus();
    }
  }

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      closeMenu(false);
    } else {
      openMenu();
    }
  });

  // Tự động đóng panel khi chọn một liên kết
  links.forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu(false);
    });
  });

  // Đóng panel khi bấm phím Escape và trả focus về nút
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMenu(true);
      }
    }
  });

  // Đóng panel khi mở rộng kích thước màn hình lên breakpoint lg (>= 1024px)
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      closeMenu(false);
    }
  });

  // Thông báo khi bấm chọn tiếng Anh (chưa có bản dịch đầy đủ)
  const enButtons = document.querySelectorAll(
    '#lang-en-btn, #lang-en-btn-mobile'
  );
  enButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      alert(
        'Phiên bản tiếng Anh đang được cập nhật. Website Quỹ tín dụng nhân dân Vạn Trạch hiện phục vụ thông tin bằng tiếng Việt.'
      );
    });
  });

  // Hiệu ứng Header trong suốt trên đỉnh trang chủ (kiểu Vietcombank) và chuyển sang nền trắng khi cuộn xuống
  const siteHeader = document.getElementById('site-header');
  if (siteHeader?.getAttribute('data-transparent-header') === 'true') {
    const syncHeaderScroll = () => {
      if (window.scrollY > 20) {
        siteHeader.classList.remove('bg-transparent');
        siteHeader.classList.add('bg-white/95', 'shadow-xs');
      } else {
        siteHeader.classList.add('bg-transparent');
        siteHeader.classList.remove('bg-white/95', 'shadow-xs');
      }
    };
    syncHeaderScroll();
    window.addEventListener('scroll', syncHeaderScroll, { passive: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMenu);
} else {
  initMenu();
}
