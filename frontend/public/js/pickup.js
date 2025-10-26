// frontend/js/pickup.js
import { ApiClient } from './modules/apiClient.js';

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }

// ------------------------------
// 🧭 Config (ดึงจาก query + default Staff)
// ------------------------------
const BRANCH_ID = Number(getQuery('branchId') || 1);
const EMPLOYEE_ID = Number(getQuery('employeeId') || 2);

// ------------------------------
// 💰 Wallet helper
// ------------------------------
function baht(n){
  return '฿' + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}

// ------------------------------
// ✅ Sidebar link params
// ------------------------------
function patchSidebarLinks(){
  const addParams = (sel, file) => {
    const a = document.querySelector(sel);
    if (!a) return;
    const url = new URL(`../pages/${file}`, window.location.href);
    url.searchParams.set('employeeId', String(EMPLOYEE_ID));
    url.searchParams.set('branchId', String(BRANCH_ID));
    a.href = url.toString();
  };
  addParams('a[href$="dashboard-staff.html"]', 'dashboard-staff.html');
  addParams('a[href$="create-order.html"]', 'create-order.html');
  addParams('a[href$="all-order.html"]', 'all-order.html');
  addParams('a[href$="pickup.html"]', 'pickup.html');
}

// ------------------------------
// 🚀 เมื่อโหลดหน้า
// ------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  patchSidebarLinks();
  initWalletDropdown();
  await loadWallet();

  await loadCompanies();
  await loadPickupHistory();

  document.getElementById('btnLogout')?.addEventListener('click', ()=>logout());
});

// ------------------------------
// 📦 โหลดตารางบริษัทขนส่ง
// ------------------------------
async function loadCompanies() {
  const companies = await ApiClient.getCompanies();
  const tbody = document.querySelector('#pickup-table-body');

  if (!companies.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="py-4 text-gray-400">ไม่มีข้อมูลบริษัทขนส่ง</td></tr>`;
    return;
  }

  tbody.innerHTML = companies.map(c => `
    <tr>
      <td class="border py-3">${c.CompanyName}</td>
      <td class="border py-3">${c.TotalOrdersPaid ?? 0}</td>
      <td class="border py-3">
        <button
          class="bg-primary hover:bg-blue-700 text-white font-medium text-sm px-4 py-1.5 rounded btn-call"
          data-company="${c.CompanyID}">
          เรียกขนส่ง
        </button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.btn-call').forEach(btn => {
    btn.addEventListener('click', async () => {
      const companyId = btn.dataset.company;
      const company = companies.find(c => c.CompanyID == companyId);
      const totalPaid = company.TotalOrdersPaid ?? 0;
      if (totalPaid === 0) return alert('⚠️ ไม่มีออร์เดอร์ที่ชำระเงินแล้ว');

      if (!confirm(`ต้องการเรียกขนส่ง "${company.CompanyName}" ?\nจำนวนออร์เดอร์ที่ชำระแล้ว: ${totalPaid}`)) return;
      try {
        const res = await ApiClient.createPickupRequest(companyId, EMPLOYEE_ID);
        alert(`✅ ${res.message}`);
        await loadPickupHistory();
        await loadCompanies();
      } catch (err) {
        alert('❌ เกิดข้อผิดพลาดขณะเรียกขนส่ง');
      }
    });
  });
}

// ------------------------------
// 🕓 Format Date (ไม่ timezone shift)
// ------------------------------
function formatDateTimeLocal(value) {
  if (!value) return '-';
  let s = String(value).replace('T',' ').replace('Z','');
  if (s.includes('.')) s = s.split('.')[0];
  const [d, t] = s.split(' ');
  if (!d || !t) return s;
  const [y, m, dd] = d.split('-');
  const [hh, mm] = t.split(':');
  return `${dd}/${m}/${y} ${hh}:${mm}`;
}

// ------------------------------
// 🕓 โหลดประวัติการรับพัสดุ
// ------------------------------
async function loadPickupHistory() {
  const tbody = document.getElementById('pickup-history-body');
  tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-gray-400">กำลังโหลด...</td></tr>`;

  try {
    const history = await ApiClient.getPickupHistory(BRANCH_ID);

    if (!history.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-gray-400">ยังไม่มีประวัติการเข้ารับ</td></tr>`;
      return;
    }

    tbody.innerHTML = history.map(item => `
      <tr class="border-b">
        <td class="py-2">${item.RequestNo}</td>
        <td class="py-2">${item.ShippingCompany}</td>
        <td class="py-2">${formatDateTimeLocal(item.DateTime)}</td>
        <td class="py-2">${item.Status}</td>
        <td class="py-2">${item.Staff || '-'}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-red-500">โหลดข้อมูลล้มเหลว</td></tr>`;
  }
}

// ------------------------------
// 💰 โหลดยอด Wallet ของสาขา
// ------------------------------
async function loadWallet(){
  try{
    const r = await ApiClient.getBranchBalance(BRANCH_ID);
    document.getElementById('walletBalance').textContent = baht(r?.balance||0);
  } catch {}
}

// ------------------------------
// 💼 Wallet Dropdown menu
// ------------------------------
function initWalletDropdown(){
  const btn = document.getElementById('walletBtn');
  const menu = document.getElementById('walletMenu');
  if (!btn || !menu) return;

  // Toggle open/close
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  // Prevent closing when clicking inside
  menu.addEventListener('click', (e)=> e.stopPropagation());

  // Click outside to close
  document.addEventListener('click', ()=>{
    if (!menu.classList.contains('hidden')) menu.classList.add('hidden');
  });

  const nav = (file)=>{
    const url = new URL(`../pages/${file}`, window.location.href);
    url.searchParams.set('employeeId', String(EMPLOYEE_ID));
    url.searchParams.set('branchId', String(BRANCH_ID));
    window.location.href = url.toString();
  };
  document.getElementById('actTopup')?.addEventListener('click',(e)=>{ e.preventDefault(); nav('branch-topup.html'); });
  document.getElementById('actWithdraw')?.addEventListener('click',(e)=>{ e.preventDefault(); nav('branch-withdraw.html'); });
  document.getElementById('actHist')?.addEventListener('click',(e)=>{ e.preventDefault(); nav('branch-transactions.html'); });
}

// ------------------------------
// 🚪 Logout
// ------------------------------
function logout(){
  if (!confirm('ออกจากระบบใช่หรือไม่?')) return;
  window.location.href = '../pages/login.html';
}
