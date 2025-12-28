// frontend/js/CompanyTransactionsUI.js
import { ApiCompanyWallet } from './modules/apiClient.js';
import { initCompanyWalletDropdown, loadCompanyWalletBalance } from './companyWalletUI.js';

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
const COMPANY_ID = Number(getQuery('companyId') || 1);

let allRows = [];

function baht(n){
  return '฿' + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits:2, maximumFractionDigits:2
  });
}

function render(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const typeFilter = document.getElementById('typeFilter').value; // "", "รับเงินค่าขนส่ง", "ถอนเงิน"

  const filtered = allRows.filter(r=>{
    const displayType = r.type; // คาดว่า DB เก็บ "รับเงินค่าขนส่ง" หรือ "ถอนเงิน" อยู่แล้ว
    const matchQ = !q || String(r.txnId).includes(q);
    const matchType = !typeFilter || displayType === typeFilter;
    return matchQ && matchType;
  });

  const tbody = document.getElementById('txnRows');
  const empty = document.getElementById('noData');

  if (!filtered.length){
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  tbody.innerHTML = filtered.map(x => {
    const isIncome = x.type === 'รับเงินค่าขนส่ง';
    const badge = isIncome
      ? `<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">รับเงินค่าขนส่ง</span>`
      : `<span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">ถอนเงิน</span>`;

    return `
      <tr class="border-t">
        <td class="py-2">${x.txnId}</td>
        <td class="py-2">${baht(x.amount)}</td>
        <td class="py-2 text-center">${badge}</td>
        <td class="py-2">${x.date}</td>
      </tr>
    `;
  }).join('');

}

async function loadTransactions(){
  try{
    allRows = await ApiCompanyWallet.getHistory(COMPANY_ID) || [];
    render();
  } catch(e){
    console.error("Load history error:", e);
  }
}

function bindLogout(){
  document.getElementById('btnLogout')
    ?.addEventListener('click', ()=>{
      if (confirm('ออกจากระบบ?')){
        window.location.href = '../pages/login.html';
      }
    });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  patchSidebarLinks();

  initCompanyWalletDropdown();
  await loadCompanyWalletBalance();
  await loadTransactions();

  document.getElementById('searchInput')?.addEventListener('input', render);
  document.getElementById('typeFilter')?.addEventListener('change', render);

  bindLogout();
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
