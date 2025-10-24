import { ApiClient } from './modules/apiClient.js';

// กำหนดค่าจำลองพนักงาน / สาขา
// -------------------------------------------
const BRANCH_ID = 1;   // เปลี่ยนได้ถ้ามีระบบ login จริง
const EMPLOYEE_ID = 1; // จำลองพนักงานที่ล็อกอิน

document.addEventListener('DOMContentLoaded', async () => {
  await loadCompanies();
  await loadPickupHistory();
});

async function loadCompanies() {
  const companies = await ApiClient.getCompanies();
  const tbody = document.querySelector('#pickup-table-body');
  if (!companies.length) {
    tbody.innerHTML = `<tr><td colspan="2" class="py-4 text-gray-400">ไม่มีข้อมูลบริษัทขนส่ง</td></tr>`;
    return;
  }

  tbody.innerHTML = companies.map(c => `
    <tr>
      <td class="border py-3">${c.CompanyName}</td>
      <td class="border py-3">
        <button class="bg-primary hover:bg-blue-700 text-white font-medium text-sm px-4 py-1.5 rounded btn-call"
          data-company="${c.CompanyID}">
          เรียกขนส่ง
        </button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.btn-call').forEach(btn => {
    btn.addEventListener('click', async () => {
      const companyId = btn.dataset.company;
      const employeeId = localStorage.getItem('employeeId') || 1;
      try {
        const res = await ApiClient.createPickupRequest(companyId, employeeId);
        alert(`✅ ${res.message}\n\nสาขา: ${res.branchName}\nออเดอร์ที่รอเข้ารับ: ${res.totalOrders} รายการ`);
        await loadPickupHistory();
      } catch (err) {
        alert('❌ ' + (err.message || 'เกิดข้อผิดพลาด'));
      }
    });
  });
}

// --- โหลดประวัติการเรียกรับพัสดุ ---
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
        <td class="py-2">${
        item.DateTime
            ? (() => {
                const d = new Date(item.DateTime);
                d.setHours(d.getHours() + 5); // ✅ บวกเวลา 5 ชั่วโมง
                return d.toLocaleString();
            })()
            : '-'
        }</td>
        <td class="py-2">${item.Status}</td>
        <td class="py-2">${item.Staff || '-'}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('❌ Error loading pickup history:', err);
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-red-500">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
  }
}

// --- โหลดทั้งหมดตอนเปิดหน้า ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadCompanies();
  await loadPickupHistory();
});
