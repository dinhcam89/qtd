/**
 * Logic tính toán lãi suất ước tính & chuyển tab phân khúc trên trang POC phong cách VCB.
 * Tuân thủ CSP: không inline script, hoàn toàn xử lý qua DOM events.
 */

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

  // Preset quick buttons (10tr, 50tr, 100tr, 500tr)
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
            'shadow-sm',
            'font-semibold'
          );
        } else {
          t.classList.remove(
            'bg-brand-primary',
            'text-white',
            'shadow-sm',
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

document.addEventListener('DOMContentLoaded', () => {
  setupPocCalculator();
  setupSegmentTabs();
});
