// frontend/js/CompanyWalletUI.js
import { ApiCompanyWallet } from './modules/apiClient.js';

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
const COMPANY_ID = Number(getQuery('companyId') || 1);

export function initCompanyWalletDropdown() {
  const btn   = document.getElementById('walletBtn');
  const menu  = document.getElementById('walletMenu');
  const hist  = document.getElementById('actHist');
  const wd    = document.getElementById('actWithdraw');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });
  document.addEventListener('click', ()=>{
    if (!menu.classList.contains('hidden')) menu.classList.add('hidden');
  });

  const nav = (file)=>{
    const url = new URL(`../pages/${file}`, window.location.href);
    url.searchParams.set('companyId', String(COMPANY_ID));
    window.location.href = url.toString();
  };

  if (wd)   wd.addEventListener('click', ()=> nav('company-withdraw.html'));
  if (hist) hist.addEventListener('click', ()=> nav('company-transactions.html'));
}

export async function loadCompanyWalletBalance() {
  try {
    const w = await ApiCompanyWallet.getBalance(COMPANY_ID);
    const el = document.getElementById('walletBalance');
    if (el) {
      el.textContent = '฿' + Number(w?.balance || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      });
    }
  } catch {}
}
