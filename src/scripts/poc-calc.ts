/**
 * Logic tính toán lãi suất ước tính, lời chào theo giờ & chuyển tab phân khúc trên trang POC.
 * Tuân thủ CSP: không inline script, hoàn toàn xử lý qua DOM events.
 */

function setupDynamicGreeting(): void {
  const greetingEl = document.querySelector<HTMLElement>(
    '[data-dynamic-greeting]'
  );
  if (!greetingEl) return;

  const hour = new Date().getHours();
  let greeting = 'Chào buổi sáng';
  let subGreeting = 'Bạn đang tìm kiếm gì hôm nay?';
  const isNight = hour >= 18 || hour < 5;

  if (hour >= 5 && hour < 12) {
    greeting = 'Chào buổi sáng';
    subGreeting = 'Chúc quý khách hàng và thành viên một ngày mới an lành!';
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Chào buổi chiều';
    subGreeting = 'Quý khách hàng đang tìm kiếm gì hôm nay?';
  } else {
    greeting = 'Chào buổi tối';
    subGreeting = 'Quý khách hàng đang tìm kiếm gì hôm nay?';
  }

  const titleSpan = greetingEl.querySelector<HTMLElement>(
    '[data-greeting-title]'
  );
  const subSpan = greetingEl.querySelector<HTMLElement>(
    '[data-greeting-subtitle]'
  );
  const dayIcon = greetingEl.querySelector<HTMLElement>(
    '[data-greeting-icon-day]'
  );
  const nightIcon = greetingEl.querySelector<HTMLElement>(
    '[data-greeting-icon-night]'
  );

  if (titleSpan) titleSpan.textContent = greeting;
  if (subSpan) subSpan.textContent = subGreeting;
  if (dayIcon && nightIcon) {
    if (isNight) {
      dayIcon.classList.add('hidden');
      nightIcon.classList.remove('hidden');
    } else {
      dayIcon.classList.remove('hidden');
      nightIcon.classList.add('hidden');
    }
  }
}

function setupPocCalculator(): void {
  const calcContainer = document.querySelector('[data-poc-calculator]');
  if (!calcContainer) return;

  const amountInput =
    calcContainer.querySelector<HTMLInputElement>('#calc-amount-input');
  const amountSlider = calcContainer.querySelector<HTMLInputElement>(
    '#calc-amount-slider'
  );
  const amountDisplay = calcContainer.querySelector<HTMLElement>(
    '#calc-amount-display'
  );
  const termSelect =
    calcContainer.querySelector<HTMLSelectElement>('#calc-term-select');
  const interestRateDisplay = calcContainer.querySelector<HTMLElement>(
    '#calc-interest-rate'
  );
  const estimatedProfitDisplay = calcContainer.querySelector<HTMLElement>(
    '#calc-estimated-profit'
  );
  const totalReceivedDisplay = calcContainer.querySelector<HTMLElement>(
    '#calc-total-received'
  );

  if (!amountInput || !termSelect || !estimatedProfitDisplay) return;

  function formatVnd(val: number): string {
    return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + ' đ';
  }

  function calculate(): void {
    const rawVal = parseFloat(amountInput?.value || '50000000') || 50000000;
    const selectedOption = termSelect?.selectedOptions[0];
    const rate = parseFloat(selectedOption?.getAttribute('data-rate') || '5.8');
    const months = parseInt(termSelect?.value || '12', 10);

    // Công thức tính lãi tiền gửi có kỳ hạn: Số tiền * (Lãi suất / 100) * (Số tháng / 12)
    const profit = rawVal * (rate / 100) * (months / 12);
    const total = rawVal + profit;

    if (amountDisplay) {
      amountDisplay.textContent = formatVnd(rawVal);
    }
    if (interestRateDisplay) {
      interestRateDisplay.textContent = `${rate.toString().replace('.', ',')}%/năm`;
    }
    if (estimatedProfitDisplay) {
      estimatedProfitDisplay.textContent = formatVnd(profit);
    }
    if (totalReceivedDisplay) {
      totalReceivedDisplay.textContent = formatVnd(total);
    }
  }

  // Đồng bộ slider và input
  if (amountSlider) {
    amountSlider.addEventListener('input', () => {
      if (amountInput) amountInput.value = amountSlider.value;
      calculate();
    });
  }

  if (amountInput) {
    amountInput.addEventListener('input', () => {
      if (amountSlider) amountSlider.value = amountInput.value;
      calculate();
    });
  }

  if (termSelect) {
    termSelect.addEventListener('change', calculate);
  }

  // Preset quick buttons (10tr, 50tr, 100tr, 200tr, 500tr)
  const presetBtns = calcContainer.querySelectorAll<HTMLButtonElement>(
    '[data-preset-amount]'
  );
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset-amount');
      if (preset && amountInput && amountSlider) {
        amountInput.value = preset;
        amountSlider.value = preset;
        calculate();
      }
    });
  });

  // Chạy tính toán ban đầu
  calculate();
}

function setupSegmentTabs(): void {
  const tabs =
    document.querySelectorAll<HTMLButtonElement>('[data-segment-tab]');
  const panels = document.querySelectorAll<HTMLElement>('[data-segment-panel]');
  if (tabs.length === 0 || panels.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-segment-tab');

      // Update tab styles
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive) {
          t.classList.remove(
            'bg-surface-page',
            'text-ink-muted',
            'hover:text-brand-primary'
          );
          t.classList.add(
            'bg-brand-primary',
            'text-white',
            'shadow-xs',
            'font-semibold'
          );
        } else {
          t.classList.remove(
            'bg-brand-primary',
            'text-white',
            'shadow-xs',
            'font-semibold'
          );
          t.classList.add(
            'bg-surface-page',
            'text-ink-muted',
            'hover:text-brand-primary'
          );
        }
      });

      // Update panels
      panels.forEach((panel) => {
        if (panel.id === targetId) {
          panel.classList.remove('hidden');
          panel.classList.add('block');
        } else {
          panel.classList.remove('block');
          panel.classList.add('hidden');
        }
      });
    });
  });
}

function setupPocBgOptions(): void {
  const container = document.querySelector<HTMLElement>(
    '[data-active-bg-option]'
  );
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    '[data-bg-option-btn]'
  );
  const layers = document.querySelectorAll<HTMLElement>(
    '[data-bg-option-layer]'
  );
  if (layers.length === 0) return;

  function activateOption(optionId: string): void {
    layers.forEach((layer) => {
      const id = layer.getAttribute('data-bg-option-layer');
      if (id === optionId) {
        layer.classList.remove('opacity-0', 'pointer-events-none');
        layer.classList.add('opacity-100');
      } else {
        layer.classList.remove('opacity-100');
        layer.classList.add('opacity-0', 'pointer-events-none');
      }
    });

    buttons.forEach((btn) => {
      const id = btn.getAttribute('data-bg-option-btn');
      const isActive = id === optionId;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      if (isActive) {
        btn.classList.remove('bg-white/80', 'text-ink-base', 'hover:bg-white');
        btn.classList.add('bg-brand-primary', 'text-white', 'shadow-xs');
      } else {
        btn.classList.remove('bg-brand-primary', 'text-white', 'shadow-xs');
        btn.classList.add('bg-white/80', 'text-ink-base', 'hover:bg-white');
      }
    });
  }

  // Hỗ trợ chọn sẵn qua thuộc tính data-active-bg-option="1..4" hoặc query ?bg=1..4
  const attrBg = container?.getAttribute('data-active-bg-option');
  const params = new URLSearchParams(window.location.search);
  const initialBg = params.get('bg') || attrBg;
  if (initialBg && ['1', '2', '3', '4'].includes(initialBg)) {
    activateOption(initialBg);
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const optionId = btn.getAttribute('data-bg-option-btn');
      if (optionId) {
        activateOption(optionId);
      }
    });
  });
}

// Chạy khởi tạo khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupDynamicGreeting();
    setupPocCalculator();
    setupSegmentTabs();
    setupPocBgOptions();
  });
} else {
  setupDynamicGreeting();
  setupPocCalculator();
  setupSegmentTabs();
  setupPocBgOptions();
}
