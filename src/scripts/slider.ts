/**
 * Quản lý Carousel / Slider ảnh chuyển động trên trang chủ
 * Đạt chuẩn WCAG AA: Hỗ trợ bàn phím, nút dừng/phát, tôn trọng prefers-reduced-motion,
 * tự động tạm dừng khi cuộn ra khỏi vùng nhìn (IntersectionObserver) để tránh giật lag khi cuộn.
 */
function initHomeSlider(): void {
  const slider = document.querySelector(
    '[data-home-slider]'
  ) as HTMLElement | null;
  if (!slider) return;

  const slides = Array.from(
    slider.querySelectorAll('[data-slide]')
  ) as HTMLElement[];
  const prevBtn = slider.querySelector(
    '[data-slider-prev]'
  ) as HTMLButtonElement | null;
  const nextBtn = slider.querySelector(
    '[data-slider-next]'
  ) as HTMLButtonElement | null;
  const dots = Array.from(
    slider.querySelectorAll('[data-slider-dot]')
  ) as HTMLButtonElement[];

  if (slides.length <= 1) return;

  let currentIndex = 0;
  let timer: number | null = null;
  let isPaused = false;
  let isInViewport = false;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  function loadSlideImage(slide: HTMLElement | undefined): void {
    if (!slide) return;
    const img = slide.querySelector('img[data-src]') as HTMLImageElement | null;
    if (img && img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
  }

  function showSlide(index: number, shouldLoadImage = true): void {
    if (index < 0) {
      currentIndex = slides.length - 1;
    } else if (index >= slides.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    slides.forEach((slide, i) => {
      const isActive = i === currentIndex;
      if (isActive) {
        if (shouldLoadImage) {
          loadSlideImage(slide);
        }
        slide.classList.remove('opacity-0', 'pointer-events-none');
        slide.classList.add('opacity-100', 'pointer-events-auto');
        slide.setAttribute('aria-hidden', 'false');
      } else {
        slide.classList.remove('opacity-100', 'pointer-events-auto');
        slide.classList.add('opacity-0', 'pointer-events-none');
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    dots.forEach((dot, i) => {
      const isActive = i === currentIndex;
      const bar = dot.querySelector(
        '[data-slider-dot-bar]'
      ) as HTMLElement | null;
      if (isActive) {
        if (bar) {
          bar.classList.remove('bg-white/55', 'w-2.5');
          bar.classList.add('bg-white', 'w-7');
        }
        dot.setAttribute('aria-selected', 'true');
        dot.setAttribute('aria-current', 'true');
      } else {
        if (bar) {
          bar.classList.remove('bg-white', 'w-7');
          bar.classList.add('bg-white/55', 'w-2.5');
        }
        dot.setAttribute('aria-selected', 'false');
        dot.removeAttribute('aria-current');
      }
    });
  }

  function nextSlide(): void {
    showSlide(currentIndex + 1);
  }

  function prevSlide(): void {
    showSlide(currentIndex - 1);
  }

  function startAutoplay(): void {
    if (prefersReducedMotion || isPaused || !isInViewport) return;
    stopAutoplay();
    timer = window.setInterval(nextSlide, 5000);
  }

  function stopAutoplay(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Tạm dừng chuyển cảnh khi slider nằm ngoài khung nhìn và chỉ tải ảnh khi cuộn tới gần
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isInViewport = entry.isIntersecting;
          if (isInViewport) {
            loadSlideImage(slides[currentIndex]);
            startAutoplay();
          } else {
            stopAutoplay();
          }
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(slider);
  } else {
    isInViewport = true;
    loadSlideImage(slides[0]);
  }

  // Event Listeners
  prevBtn?.addEventListener('click', () => {
    prevSlide();
    startAutoplay();
  });

  nextBtn?.addEventListener('click', () => {
    nextSlide();
    startAutoplay();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      showSlide(i);
      startAutoplay();
    });
  });

  // Tạm dừng khi di chuột hoặc focus
  slider.addEventListener('mouseenter', () => {
    isPaused = true;
    stopAutoplay();
  });

  slider.addEventListener('mouseleave', () => {
    isPaused = false;
    startAutoplay();
  });

  slider.addEventListener('focusin', () => {
    isPaused = true;
    stopAutoplay();
  });

  slider.addEventListener('focusout', () => {
    isPaused = false;
    startAutoplay();
  });

  // Hỗ trợ phím mũi tên trái/phải
  slider.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
      startAutoplay();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      startAutoplay();
    }
  });

  // Khởi động trạng thái ban đầu (chỉ tải ảnh khi vào vùng nhìn)
  showSlide(0, isInViewport);
  startAutoplay();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomeSlider);
} else {
  initHomeSlider();
}
