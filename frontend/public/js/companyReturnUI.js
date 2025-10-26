// frontend/js/company-return.js
import { ApiClient } from './modules/apiClient.js';

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
const COMPANY_ID = Number(getQuery('companyId') || 1);

let allOrders = [];
let currentStatus = 'all';
let currentCount = 'all';

function patchSidebarLinks(){
  const addParams = (sel, file) => {
    const a = document.querySelector(sel);
    if (!a) return;
    const url = new URL(`../pages/${file}`, window.location.href);
    url.searchParams.set('companyId', String(COMPANY_ID));
    a.href = url.toString();
  };
  addParams('a[href$="company-dashboard.html"]','company-dashboard.html');
  addParams('a[href$="company-pickup.html"]','company-pickup.html');
  addParams('a[href$="company-delivery.html"]','company-delivery.html');
  addParams('a[href$="company-return.html"]','company-return.html');
}

function logout(){
  if (!confirm('ออกจากระบบ?')) return;
  window.location.href = '../pages/login.html';
}

async function loadWallet(){
  const r = await ApiClient.getCompanyWallet(COMPANY_ID);
  document.getElementById('walletBalance').textContent =
    '฿' + Number(r?.balance||0).toLocaleString(undefined,{
      minimumFractionDigits:2, maximumFractionDigits:2
    });
}

const statusMap = {
  Fail: "จัดส่งไม่สำเร็จ",
  Pickup: "กำลังจัดส่งซ้ำ",
  "In Transit": "กำลังจัดส่งซ้ำ",
  Return: "ตีกลับแล้ว",
  Success: "จัดส่งสำเร็จ"
};

async function handleAction(orderId, mode){
  let msg = mode === 'retry'
    ? 'ยืนยันจัดส่งซ้ำใช่หรือไม่?'
    : 'ยืนยันตีกลับพัสดุไปยังผู้ส่ง?';

  if (!confirm(msg)) return;

  try {
    await ApiClient.updateReturnOrderStatus(orderId, mode);
    await loadReturnOrders();
  } catch (err){
    alert("อัปเดตสถานะล้มเหลว");
  }
}

function filterApply(){
  const searchValue = document.getElementById('searchInput').value.trim().toLowerCase();

  const filtered = allOrders.filter(o=>{
    // คำค้นหา
    const matchSearch =
      o.OrderID.toString().includes(searchValue) ||
      o.CustomerName?.toLowerCase().includes(searchValue) ||
      o.CustomerAddress?.toLowerCase().includes(searchValue) ||
      o.CustomerPhone?.toLowerCase().includes(searchValue) ||
      o.FailReason?.toLowerCase().includes(searchValue);

    // สถานะ
    let matchStatus = true;
    if (currentStatus === 'Fail') {
      matchStatus = o.OrderStatus === 'Fail';
    } else if (currentStatus === 'Return') {
      matchStatus = o.OrderStatus === 'Return';
    } else if (currentStatus === 'retrying') {
      matchStatus =
        o.OrderStatus !== 'Fail' &&
        o.OrderStatus !== 'Return' &&
        (o.ReturnCount || 0) > 0;
    } else if (currentStatus === 'successRetry') {
      matchStatus = o.OrderStatus === 'Success' && (o.ReturnCount || 0) > 0;
    }

    // จำนวนครั้งการจัดส่งซ้ำ
    let matchCount = true;
    const rc = Number(o.ReturnCount || 0);
    if (currentCount === '0') {
      matchCount = rc === 0;
    } else if (currentCount === '1plus') {
      matchCount = rc >= 1;
    }

    return matchSearch && matchStatus && matchCount;
  });

  renderTable(filtered);
}

function renderTable(list){
  const tbody = document.getElementById('return-body');

  if (!list.length){
    tbody.innerHTML = `<tr><td colspan="8" class="py-4 text-gray-400">ไม่พบข้อมูลพัสดุตีกลับ</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(o => {
    let actionHtml = `<span class="text-gray-400">-</span>`;

    if (o.OrderStatus === 'Fail' && o.ReturnCount === 0) {
      actionHtml = `<button class="text-blue-600 hover:underline"
                   onclick="handleAction(${o.OrderID}, 'retry')">จัดส่งซ้ำ</button>`;
    }
    else if (o.OrderStatus === 'Fail' && o.ReturnCount === 1) {
      actionHtml = `<button class="text-red-600 hover:underline"
                   onclick="handleAction(${o.OrderID}, 'return')">ตีกลับพัสดุไปยังผู้ส่ง</button>`;
    }
    else if (o.OrderStatus === 'Return'){
      actionHtml = `<span class="text-green-600 font-semibold">ตีกลับพัสดุไปยังผู้ส่งแล้วเรียบร้อย</span>`;
    }

    return `
    <tr class="border-b">
      <td class="py-2 border">${o.OrderID}</td>
      <td class="py-2 border">${o.CustomerName || '-'}</td>
      <td class="py-2 border">${o.CustomerAddress || '-'}</td>
      <td class="py-2 border">${o.CustomerPhone || '-'}</td>
      <td class="py-2 border">${o.FailReason || '-'}</td>
      <td class="py-2 border">${statusMap[o.OrderStatus] || o.OrderStatus}</td>
      <td class="py-2 border">${o.ReturnCount ?? 0}</td>
      <td class="py-2 border text-center">${actionHtml}</td>
    </tr>`;
  }).join('');
}

async function loadReturnOrders(){
  const tbody = document.getElementById('return-body');
  tbody.innerHTML = `<tr><td colspan="8" class="py-4 text-gray-400">กำลังโหลด...</td></tr>`;
  try{
    allOrders = await ApiClient.getCompanyReturnOrders(COMPANY_ID);
    filterApply();
  } catch(e){
    console.error("Return load error:", e);
    tbody.innerHTML = `<tr><td colspan="8" class="py-4 text-red-500">โหลดข้อมูลล้มเหลว</td></tr>`;
  }
}

function initFilters(){
  const searchInput = document.getElementById('searchInput');
  const dropdownBtn = document.getElementById('statusDropdownBtn');
  const dropdownMenu = document.getElementById('statusMenu');
  const statusLabel = document.getElementById('statusLabel');

  dropdownBtn.addEventListener('click', ()=> dropdownMenu.classList.toggle('hidden'));

  dropdownMenu.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      currentStatus = a.dataset.status;
      statusLabel.textContent = a.textContent;
      dropdownMenu.classList.add('hidden');
      filterApply();
    });
  });

  const countBtn   = document.getElementById('countDropdownBtn');
  const countMenu  = document.getElementById('countMenu');
  const countLabel = document.getElementById('countLabel');

  countBtn.addEventListener('click', ()=>{
    countMenu.classList.toggle('hidden');
  });

  countMenu.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      currentCount = a.dataset.count;               // all | 0 | 1plus
      countLabel.textContent = a.textContent;       // อัปเดตป้าย
      countMenu.classList.add('hidden');
      filterApply();                                 // re-render
    });
  });

  searchInput.addEventListener('input', filterApply);
}

function initWalletDropdown(){
  const btn = document.getElementById('walletBtn');
  const menu = document.getElementById('walletMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', e=>{
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  document.addEventListener('click', ()=>{
    if (!menu.classList.contains('hidden')) menu.classList.add('hidden');
  });

  const nav = file=>{
    const url = new URL(`../pages/${file}`, window.location.href);
    url.searchParams.set('companyId', String(COMPANY_ID));
    window.location.href = url.toString();
  };

  document.getElementById('actWithdraw')?.addEventListener('click', ()=>nav('company-withdraw.html'));
  document.getElementById('actHist')?.addEventListener('click', ()=>nav('company-transactions.html'));
}

window.handleAction = handleAction;

document.addEventListener('DOMContentLoaded', async ()=>{
  patchSidebarLinks();
  initFilters();
  initWalletDropdown();
  await loadWallet();
  await loadReturnOrders();
  document.getElementById('btnLogout')?.addEventListener('click', logout);
});
