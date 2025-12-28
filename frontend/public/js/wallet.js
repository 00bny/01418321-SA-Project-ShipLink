// frontend/public/js/wallet.js
export function initWalletDropdown(branchId = 1) {
  const btn = document.getElementById('walletBtn');
  const menu = document.getElementById('walletMenu');
  const topup = document.getElementById('actTopup');
  const withdraw = document.getElementById('actWithdraw');
  const hist = document.getElementById('actHist');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    if (!menu.classList.contains('hidden')) menu.classList.add('hidden');
  });

  // ไปหน้าเติมเงิน / ถอนเงิน / ประวัติ
  if (topup) {
    topup.addEventListener('click', () => {
      const url = new URL('../pages/branch-topup.html', window.location.href);
      url.searchParams.set('branchId', String(branchId));
      window.location.href = url.toString();
    });
  }
  if (withdraw) {
    withdraw.addEventListener('click', () => {
      const url = new URL('../pages/branch-withdraw.html', window.location.href);
      url.searchParams.set('branchId', String(branchId));
      window.location.href = url.toString();
    });
  }
  if (hist) {
    hist.addEventListener('click', () => {
      const url = new URL('../pages/branch-transactions.html', window.location.href);
      url.searchParams.set('branchId', String(branchId));
      window.location.href = url.toString();
    });
  }
}
