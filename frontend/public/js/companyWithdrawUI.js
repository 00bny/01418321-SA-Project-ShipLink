// frontend/js/CompanyWithdrawUI.js
import { ApiCompanyWallet } from './modules/apiClient.js';
import { initCompanyWalletDropdown, loadCompanyWalletBalance } from './companyWalletUI.js';

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
const COMPANY_ID = Number(getQuery('companyId') || 1);

function baht(n){
  return '฿' + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}

function patchSidebarLinks(){
  const add = (sel, file)=>{
    const a = document.querySelector(sel);
    if (!a) return;
    const url = new URL(`../pages/${file}`, window.location.href);
    url.searchParams.set('companyId', String(COMPANY_ID));
    a.href = url.toString();
  };
  add('a[href$="company-dashboard.html"]', 'company-dashboard.html');
  add('a[href$="company-pickup.html"]', 'company-pickup.html');
  add('a[href$="company-delivery.html"]', 'company-delivery.html');
  add('a[href$="company-return.html"]', 'company-return.html');
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
    if (!amount || amount <= 0) {
      msg.textContent = 'กรุณาระบุจำนวนเงินที่ถูกต้อง';
      return;
    }
    msg.textContent = 'กำลังดำเนินการ...';
    try{
      const r = await ApiCompanyWallet.withdraw(COMPANY_ID, amount);
      msg.textContent = 'สำเร็จ ยอดคงเหลือ: ' + baht(r?.balance||0);
      await refreshBalance();
    }catch(e){
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
