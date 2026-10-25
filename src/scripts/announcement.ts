/**
 * Quản lý trạng thái đóng/mở của thanh thông báo nổi ở đỉnh trang (Top Announcement Bar)
 */
function initAnnouncementBar(): void {
  const bar = document.getElementById('top-announcement-bar');
  const closeBtn = document.getElementById('close-announcement-btn');

  if (!bar || !closeBtn) return;

  const noticeId = bar.getAttribute('data-notice-id');
  if (noticeId) {
    // Kiểm tra xem người dùng đã đóng thông báo này trong phiên hiện tại chưa
    const dismissedId = sessionStorage.getItem('qtd_dismissed_announcement');
    if (dismissedId === noticeId) {
      bar.classList.add('hidden');
      return;
    }
  }

  // Hiển thị thanh thông báo nếu chưa bị ẩn
  bar.classList.remove('hidden');

  closeBtn.addEventListener('click', () => {
    bar.classList.add('hidden');
    if (noticeId) {
      try {
        sessionStorage.setItem('qtd_dismissed_announcement', noticeId);
      } catch {
        // sessionStorage có thể bị chặn ở chế độ private
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnnouncementBar);
} else {
  initAnnouncementBar();
}
