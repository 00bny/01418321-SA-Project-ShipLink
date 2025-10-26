// frontend/js/pickup.js
import { ApiClient } from './modules/apiClient.js';

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }

// ------------------------------
// 🧭 Config (ดึงจาก query + default Staff)
// ------------------------------
const BRANCH_ID = Number(getQuery('branchId') || 1);
const EMPLOYEE_ID = Number(getQuery('employeeId') || 2);
// ------------------------------
// 🚀 เมื่อโหลดหน้า
// ------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await loadCompanies();
  await loadPickupHistory();
});

// ------------------------------
// 📦 โหลดตารางบริษัทขนส่ง + จำนวนออร์เดอร์ชำระแล้ว
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

  // ------------------------------
  // 🧭 เมื่อกดปุ่ม "เรียกขนส่ง"
  // ------------------------------
  document.querySelectorAll('.btn-call').forEach(btn => {
    btn.addEventListener('click', async () => {
      const companyId = btn.dataset.company;
      const employeeId = localStorage.getItem('employeeId') || EMPLOYEE_ID;
      const company = companies.find(c => c.CompanyID == companyId);

      // ✅ ตรวจสอบจำนวนออร์เดอร์ที่ชำระเงินแล้ว
      const totalPaid = company.TotalOrdersPaid ?? 0;
      if (totalPaid === 0) {
        alert(`⚠️ ไม่มีออร์เดอร์สำหรับบริษัทขนส่ง ${company.CompanyName} ที่ชำระเงินแล้วในขณะนี้`);
        return;
      }

      // ✅ Popup ยืนยันก่อนสร้างคำร้อง
      const confirmMsg = `ต้องการเรียกขนส่ง "${company.CompanyName}" เข้ารับพัสดุหรือไม่?\n\nจำนวนออร์เดอร์ที่ชำระแล้ว: ${totalPaid}`;
      if (!confirm(confirmMsg)) return;

      try {
        // ✅ เรียก API เพื่อสร้างคำร้อง pickup
        const res = await ApiClient.createPickupRequest(companyId, employeeId);

        // ✅ แจ้งผลลัพธ์
        alert(`✅ ${res.message}\n`);

        // ✅ โหลดข้อมูลใหม่ (โดยไม่ต้อง refresh หน้า)
        await loadPickupHistory();
        await loadCompanies();

      } catch (err) {
        console.error('❌ Error calling pickup:', err);
        alert('❌ ' + (err.message || 'เกิดข้อผิดพลาดขณะเรียกขนส่ง'));
      }
    });
  });
}

// เพิ่ม helper ด้านบนไฟล์ หรือเหนือ loadPickupHistory()
function formatDateTimeLocal(value) {
  if (!value) return '-';
  let s = String(value).trim();

  // รองรับทั้ง 'YYYY-MM-DD HH:mm:ss' และ 'YYYY-MM-DDTHH:mm:ss.sssZ'
  s = s.replace('T', ' ').replace('Z', '');
  if (s.includes('.')) s = s.split('.')[0];

  const [datePart, timePart] = s.split(' ');
  if (!datePart || !timePart) return s;

  const [y, m, d] = datePart.split('-');
  const [hh, mm] = timePart.split(':');

  // ใช้ปีคริสต์ศักราชตามที่ต้องการ
  return `${d}/${m}/${y} ${hh}:${mm}`;
}

// ------------------------------
// 🕓 โหลดประวัติการเรียกรับพัสดุ
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
      <tr class="border-b border-border-light">
        <td class="py-2">${item.RequestNo}</td>
        <td class="py-2">${item.ShippingCompany}</td>
        <td class="py-2">${formatDateTimeLocal(item.DateTime)}</td>
        <td class="py-2">${item.Status}</td>
        <td class="py-2">${item.Staff || '-'}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('❌ Error loading pickup history:', err);
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-red-500">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
  }
}
function patchSidebarLinks(){
  const addParams = (sel, file) => {
    const a = document.querySelector(sel);
    if (!a) return;
    const url = new URL(`../pages/${file}`, window.location.href);
    url.searchParams.set('employeeId', String(this.EMPLOYEE_ID));
    url.searchParams.set('branchId', String(this.BRANCH_ID));
    a.href = url.toString();
  };
  addParams('a[href$="dashboard-staff.html"]', 'dashboard-staff.html');
  addParams('a[href$="create-order.html"]', 'create-order.html');
  addParams('a[href$="all-order.html"]', 'all-order.html');
  addParams('a[href$="pickup.html"]', 'pickup.html');
}
