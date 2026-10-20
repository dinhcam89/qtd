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
    toggleBtn.setAttribute('aria-label', 'Đóng danh mục điều hướng');
    panel.classList.remove('hidden');
    iconOpen?.classList.add('hidden');
    iconClose?.classList.remove('hidden');
  }

  function closeMenu(restoreFocus = false): void {
    if (!toggleBtn || !panel) return;
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Mở danh mục điều hướng');
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMenu);
} else {
  initMenu();
}
