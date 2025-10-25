import { ApiCompanyWallet } from './modules/apiClient.js';

export function initCompanyWalletDropdown(companyId = 1) {
  const btn = document.getElementById('walletBtn');
  const menu = document.getElementById('walletMenu');
  const withdraw = document.getElementById('actWithdraw');
  const history = document.getElementById('actHist');
  const balanceEl = document.getElementById('walletBalance');

  if (!btn || !menu) {
    console.warn("⚠️ WalletDropdown: Missing DOM elements");
    return;
  }

  // ✅ Toggle dropdown
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  // ✅ Click outside → close
  document.addEventListener('click', () => {
    menu.classList.add('hidden');
  });

  // ✅ โหลดยอดเงิน + ป้องกัน NaN
  async function refreshBalance() {
    try {
      const res = await ApiCompanyWallet.getBalance(companyId);
      const bal = Number(res?.balance ?? 0);
      if (balanceEl) balanceEl.textContent = `฿${bal.toFixed(2)}`;
    } catch (err) {
      console.error("❌ Failed to load company balance:", err);
      if (balanceEl) balanceEl.textContent = "฿0.00";
    }
  }

  refreshBalance();

  // ✅ ไปถอนเงิน
  if (withdraw) {
    withdraw.addEventListener('click', () => {
      const url = new URL('../pages/company-withdraw.html', window.location.href);
      url.searchParams.set('companyId', String(companyId));
      window.location.href = url.toString();
    });
  }

  // ✅ ไปประวัติธุรกรรม
  if (history) {
    history.addEventListener('click', () => {
      const url = new URL('../pages/company-transactions.html', window.location.href);
      url.searchParams.set('companyId', String(companyId));
      window.location.href = url.toString();
    });
  }

  // ✅ ให้ฟังก์ชันเรียก refresh ภายนอกได้ หยิบไปใช้ใน withdraw.js / transactions.js ได้เลย
  return { refreshBalance };
}
