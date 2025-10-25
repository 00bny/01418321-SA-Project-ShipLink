import { ApiClient } from './modules/apiClient.js';

const COMPANY_ID = 1; // จำลองบริษัทขนส่ง
let tbody, modal, form;
let allRequests = []; // เก็บข้อมูลทั้งหมด
let currentStatus = 'all';

// ✅ Map แสดงสถานะเป็นภาษาไทย
const statusMap = {
  RequestedPickup: 'รอเข้ารับ',
  PickingUp: 'กำลังเข้ารับ',
  PickedUp: 'เข้ารับสำเร็จ',
};

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
      currentStatus = a.dataset.status;  // ✅ filter ด้วย key ภาษาอังกฤษ
      statusLabel.textContent = a.textContent; // ✅ แสดงเป็นภาษาไทย
      dropdownMenu.classList.add('hidden');
      renderFilteredRequests();
    });
  });

  // search input
  searchInput.addEventListener('input', () => renderFilteredRequests());
}

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

  tbody.innerHTML = filtered.map(r => {
    let actionBtn = '';

    if (r.RequestStatus === 'RequestedPickup') {
      actionBtn = `
        <button 
          class="bg-primary hover:bg-blue-700 text-white font-medium text-sm px-4 py-1.5 rounded btn-assign"
          data-id="${r.RequestID}" data-status="${r.RequestStatus}">
          ยอมรับคำเรียก
        </button>`;
    } else if (r.RequestStatus === 'PickingUp') {
      actionBtn = `
        <button
          class="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-4 py-1.5 rounded btn-complete"
          data-id="${r.RequestID}">
          ยืนยันเข้ารับแล้ว
        </button>`;
    } else if (r.RequestStatus === 'PickedUp') {
    actionBtn = `<span class="text-green-600 font-semibold">ยืนยันการเข้ารับแล้วเรียบร้อย</span>`;
    } else {
      actionBtn = `<span class="text-gray-500">-</span>`;
    }

    return `
      <tr class="border-b">
        <td class="py-2 border">${r.RequestID}</td>
        <td class="py-2 border">${new Date(r.CreatedDate).toLocaleString('th-TH')}</td>
        <td class="py-2 border">${r.ParcelCount ?? 0}</td>
        <td class="py-2 border text-center">${statusMap[r.RequestStatus] || '-'}</td>
        <td class="py-2 border">${actionBtn}</td>
      </tr>`;
  }).join('');

  // ✅ ปุ่มยอมรับคำเรียก (เปิด modal)
  document.querySelectorAll('.btn-assign').forEach(btn => {
    btn.addEventListener('click', () => {
      const requestId = btn.dataset.id;
      openModal(requestId);
    });
  });

  document.querySelectorAll('.btn-complete').forEach(btn => {
    btn.addEventListener('click', async () => {
        const requestId = btn.dataset.id;
        if (!confirm('ยืนยันว่าพนักงานได้เข้ารับพัสดุแล้วใช่ไหม')) return;

        // ✅ Optimistic UI: ปรับใน allRequests ก่อนเพื่อให้ปุ่มหายทันที
        const idx = allRequests.findIndex(r => String(r.RequestID) === String(requestId));
        if (idx !== -1) {
        allRequests[idx].RequestStatus = 'PickedUp';
        renderFilteredRequests();
        }

        try {
        const res = await ApiClient.completePickup(requestId);
        alert('✅ ' + res.message);

        // ✅ sync กับข้อมูลจริงอีกที (กัน edge case)
        await loadPickupRequests();
        } catch (err) {
        alert('❌ ' + (err.message || 'ไม่สามารถอัปเดตได้'));
        // rollback ถ้า backend fail
        if (idx !== -1) {
            allRequests[idx].RequestStatus = 'PickingUp';
            renderFilteredRequests();
        }
        }
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
