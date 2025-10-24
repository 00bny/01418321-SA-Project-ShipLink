import { ApiClient } from './modules/apiClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCompanies();
  await loadHistory();
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
        await loadHistory();
      } catch (err) {
        alert('❌ ' + (err.message || 'เกิดข้อผิดพลาด'));
      }
    });
  });
}

async function loadHistory() {
  const branchId = localStorage.getItem('branchId') || 1;
  const rows = await ApiClient.getPickupHistory(branchId);
  const tbody = document.querySelector('#pickup-history-body');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-gray-400">ยังไม่มีประวัติการเข้ารับ</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="border py-3">${r.RequestID}</td>
      <td class="border py-3">${r.CompanyName || '-'}</td>
      <td class="border py-3">${new Date(r.CreatedDate).toLocaleString()}</td>
      <td class="border py-3">
        <span class="px-2 py-1 text-xs rounded ${
          r.RequestStatus === 'Completed'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }">${r.RequestStatus}</span>
      </td>
      <td class="border py-3">${r.EmployeeName || '-'}</td>
    </tr>
  `).join('');
}
