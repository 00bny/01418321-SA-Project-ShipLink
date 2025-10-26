// frontend/js/CompanyWithdrawUI.js
import { ApiCompanyWallet } from './modules/apiClient.js';
import { initCompanyWalletDropdown, loadCompanyWalletBalance } from './companyWalletUI.js';

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
const COMPANY_ID = Number(getQuery('companyId') || 1);

function baht(n){
  return '฿' + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}

async function refreshBalance(){
  try{
    const w = await ApiCompanyWallet.getBalance(COMPANY_ID);
    const el = document.getElementById('bal');
    if (el) el.textContent = baht(w?.balance||0);
    await loadCompanyWalletBalance();
  }catch{}
}

function bindQuickAmounts(){
  document.querySelectorAll('.quick').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const v = btn.textContent.replace(/[^\d.]/g,'');
      const input = document.getElementById('amount');
      input.value = v;
    });
  });
}

function bindWithdraw(){
  const btn = document.getElementById('btnConfirm');
  const msg = document.getElementById('msg');
  btn.addEventListener('click', async ()=>{
    const amount = Number(document.getElementById('amount').value || 0);

    if (!amount || amount <= 0){
    msg.textContent = 'กรุณาระบุจำนวนเงินที่ถูกต้อง';
    return;
    }
    msg.textContent = '';

    if (!confirm(`ยืนยันถอนเงิน ${baht(amount)} ?`)) return;

    try {
    const r = await ApiCompanyWallet.withdraw(COMPANY_ID, amount);
    await refreshBalance();

    // ✅ Popup แสดงข้อความตามจำนวนเงิน
    document.getElementById("withdrawSuccessText").textContent =
        `ถอนเงิน ${baht(amount)} เรียบร้อยแล้ว`;

    const popup = document.getElementById("withdrawSuccessModal");
    popup.classList.remove("hidden");

    // ✅ เคลียร์ input
    document.getElementById('amount').value = "";

    // ✅ ปิด popup
    document.getElementById("successOkBtn").onclick = ()=>{
        popup.classList.add("hidden");
    };

    } catch(e){
    msg.textContent = e?.message || 'ไม่สำเร็จ';
    }

  });
}

function bindLogout(){
  document.getElementById('btnLogout')?.addEventListener('click', ()=>{
    if (confirm('ออกจากระบบ?')) window.location.href = '../pages/login.html';
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  patchSidebarLinks();

  initCompanyWalletDropdown();
  bindQuickAmounts();
  bindWithdraw();
  bindLogout();
  await refreshBalance();
});

function patchSidebarLinks(){
  const addParams = (sel, file) => {
    const a = document.querySelector(sel);
    if (!a) return;
    const url = new URL(`../pages/${file}`, window.location.href);
    url.searchParams.set("companyId", String(COMPANY_ID));
    a.href = url.toString();
  };

  addParams('a[href$="company-dashboard.html"]', 'company-dashboard.html');
  addParams('a[href$="company-delivery.html"]', 'company-delivery.html');
  addParams('a[href$="company-pickup.html"]', 'company-pickup.html');
  addParams('a[href$="company-return.html"]', 'company-return.html');
  addParams('a[href$="company-transactions.html"]', 'company-transactions.html');
  addParams('a[href$="company-withdraw.html"]', 'company-withdraw.html');
}
