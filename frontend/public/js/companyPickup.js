import { ApiClient } from './modules/apiClient.js';

const COMPANY_ID = 1; // จำลองบริษัทขนส่ง
let tbody, modal, form;
let allRequests = []; // เก็บข้อมูลทั้งหมด
let currentStatus = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  tbody = document.getElementById('company-pickup-body');
  modal = document.getElementById('confirmModal');
  form = document.getElementById('confirmForm');

  await loadPickupRequests();
  initFilters(); // ✅ เรียกใช้งานฟิลเตอร์

  // ปุ่มยกเลิกใน modal
  document.getElementById('btnCancel').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // ✅ ยืนยันคำเรียก
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('requestId').value;
    const time = document.getElementById('pickupTime').value;
    const name = document.getElementById('staffName').value.trim();
    const phone = document.getElementById('staffPhone').value.trim();

    if (!time || !name || !phone) {
      alert('⚠️ โปรดกรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // ✅ ตรวจสอบรูปแบบเบอร์โทร (ต้องเป็นตัวเลข 10 หลัก)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      alert('❌ เบอร์โทรไม่ถูกต้อง\nกรุณากรอกเฉพาะตัวเลข 10 หลัก');
      return;
    }

    try {
      const res = await ApiClient.confirmPickup({ requestId: id, time, name, phone });
      alert('✅ ' + res.message);
      modal.classList.add('hidden');
      await loadPickupRequests(); // โหลดใหม่หลังอัปเดต
    } catch (err) {
      alert('❌ ' + (err.message || 'ไม่สามารถบันทึกได้'));
    }
  });
});

async function loadPickupRequests() {
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-400">กำลังโหลด...</td></tr>`;

  try {
    const list = await ApiClient.getCompanyPickups(COMPANY_ID);
    allRequests = list; // ✅ เก็บไว้ทั้งหมด
    renderFilteredRequests();
  } catch (err) {
    console.error('❌ โหลดข้อมูลไม่สำเร็จ:', err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
  }
}

// ✅ ฟังก์ชันกรองข้อมูล
function initFilters() {
  const searchInput = document.getElementById('searchInput');
  const dropdownBtn = document.getElementById('statusDropdownBtn');
  const dropdownMenu = document.getElementById('statusMenu');
  const statusLabel = document.getElementById('statusLabel');

  // toggle dropdown
  dropdownBtn.addEventListener('click', () => {
    dropdownMenu.classList.toggle('hidden');
  });

  // click เลือกสถานะ
  dropdownMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      currentStatus = a.dataset.status;
      statusLabel.textContent = currentStatus === 'all' ? 'สถานะ' : a.textContent;
      dropdownMenu.classList.add('hidden');
      renderFilteredRequests();
    });
  });

  // search input
  searchInput.addEventListener('input', () => renderFilteredRequests());
}

// ✅ ฟังก์ชันแสดงผลหลังกรอง
function renderFilteredRequests() {
  const searchValue = document.getElementById('searchInput').value.trim().toLowerCase();
  let filtered = allRequests.filter(r => {
    const matchStatus = currentStatus === 'all' || r.RequestStatus === currentStatus;
    const matchSearch = !searchValue || String(r.RequestID).toLowerCase().includes(searchValue);
    return matchStatus && matchSearch;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-400">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr class="border-b">
      <td class="py-2 border">${r.RequestID}</td>
      <td class="py-2 border">${new Date(r.CreatedDate).toLocaleString('th-TH')}</td>
      <td class="py-2 border">${r.ParcelCount ?? 0}</td>
      <td class="py-2 border">${r.RequestStatus}</td>
      <td class="py-2 border">
        <button 
          class="bg-primary hover:bg-blue-700 text-white font-medium text-sm px-4 py-1.5 rounded btn-assign"
          data-id="${r.RequestID}" data-status="${r.RequestStatus}">
          รับคำเรียก
        </button>
      </td>
    </tr>
  `).join('');

  // ตรวจสอบสถานะก่อนเปิด modal
  document.querySelectorAll('.btn-assign').forEach(btn => {
    btn.addEventListener('click', () => {
      const requestId = btn.dataset.id;
      const status = btn.dataset.status;

      if (status !== 'รอเข้ารับ') {
        alert(`❌ ไม่สามารถรับคำเรียกนี้ได้\nสถานะปัจจุบัน: "${status}"`);
        return;
      }

      openModal(requestId);
    });
  });
}

function openModal(requestId) {
  document.getElementById('requestId').value = requestId;
  document.getElementById('pickupTime').value = '';
  document.getElementById('staffName').value = '';
  document.getElementById('staffPhone').value = '';
  modal.classList.remove('hidden');
}
