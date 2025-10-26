import { ApiClient } from "./modules/apiClient.js";
import { initCompanyWalletDropdown, loadCompanyWalletBalance } from "./companyWalletUI.js";

const COMPANY_ID = 1;
let tbody;
let allOrders = [];
let currentFilter = "all";
let currentFailOrderId = null;

document.addEventListener("DOMContentLoaded", async () => {
  tbody = document.getElementById("delivery-body");

  await loadPickupOrders();
  setupFilters();
  setupSearch();
  setupFailModal();

  initCompanyWalletDropdown();
  await loadCompanyWalletBalance();

});

// ✅ โหลดข้อมูลทั้งหมด
async function loadPickupOrders() {
  tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-gray-400 text-center">กำลังโหลด...</td></tr>`;

  try {
    allOrders = await ApiClient.getCompanyPickedOrders(COMPANY_ID);
    renderOrders();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-red-500 text-center">โหลดข้อมูลล้มเหลว</td></tr>`;
  }
}

// ✅ แสดงข้อมูล + filter + search
function renderOrders() {
  let list = [...allOrders];

  if (currentFilter !== "all") {
    list = list.filter(o => o.OrderStatus === currentFilter);
  }

  const keyword = document.getElementById("deliverySearchInput").value.trim().toLowerCase();
  if (keyword) {
    list = list.filter(o =>
      String(o.OrderID).includes(keyword) ||
      o.ReceiverName.toLowerCase().includes(keyword) ||
      o.ReceiverAddress.toLowerCase().includes(keyword) ||
      o.ReceiverPhone.includes(keyword)
    );
  }

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-gray-400 text-center">ไม่มีข้อมูล</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(o => `
    <tr class="border-b">
        <td class="py-2 border text-center">${o.OrderID}</td>
        <td class="py-2 border">${o.ReceiverName}</td>
        <td class="py-2 border">${o.ReceiverAddress}</td>
        <td class="py-2 border text-center">${o.ReceiverPhone}</td>
        <td class="py-2 border text-center">${o.OrderStatus}</td>
        <td class="py-2 border text-center">${renderActionButtons(o)}</td>
    </tr>
  `).join("");

  attachButtonEvents();
}

// ✅ แสดงปุ่มการทำงานตามสถานะ
function renderActionButtons(order) {
  const { OrderID, OrderStatus } = order;

  if (OrderStatus === "Pickup") {
    return `
      <button data-id="${OrderID}" data-status="In Transit"
        class="text-blue-600 underline hover:text-blue-800 transition action-btn">
        จัดส่งพัสดุ
      </button>
    `;
  }

  if (OrderStatus === "In Transit") {
    return `
      <div class="flex flex-col items-center gap-1">
        <button data-id="${OrderID}" data-status="Success"
          class="text-green-600 underline hover:text-green-800 transition action-btn">
          จัดส่งสำเร็จ
        </button>
        <button data-id="${OrderID}" data-status="Fail"
          class="text-red-600 underline hover:text-red-800 transition action-btn">
          จัดส่งล้มเหลว
        </button>
      </div>
    `;
  }

  if (OrderStatus === "Fail")
    return `<span class="text-red-600 font-medium">การจัดส่งล้มเหลว</span>`;

  if (OrderStatus === "Success")
    return `<span class="text-green-600 font-medium">จัดส่งสำเร็จแล้ว</span>`;

  return `<span class="text-gray-500">-</span>`;
}

// ✅ Event ปุ่ม
function attachButtonEvents() {
  document.querySelectorAll(".action-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const status = btn.dataset.status;

      if (status === "Fail") {
        currentFailOrderId = id;
        document.getElementById("failReasonModal").classList.remove("hidden");
        return;
      }

      const confirmText = {
        "In Transit": "คุณต้องการเริ่มจัดส่งพัสดุใช่ไหม?",
        "Success": "ยืนยันว่าจัดส่งพัสดุสำเร็จแล้วใช่ไหม?"
      }[status];

      if (!confirm(confirmText)) return;

      try {
        await ApiClient.updateOrderStatus(id, { status });
        loadPickupOrders();
      } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ ❌");
      }
    });
  });
}

// ✅ Modal - กรณีล้มเหลว
function setupFailModal() {
  const modal = document.getElementById("failReasonModal");
  const reasonInput = document.getElementById("failReasonInput");

  document.getElementById("failCancelBtn").addEventListener("click", () => {
    modal.classList.add("hidden");
    reasonInput.value = "";
    currentFailOrderId = null;
  });

  document.getElementById("failSubmitBtn").addEventListener("click", async () => {
    const reason = reasonInput.value.trim();
    if (!reason) return alert("กรุณากรอกสาเหตุ");

    try {
      await ApiClient.updateOrderStatus(currentFailOrderId, {
        status: "Fail",
        failReason: reason
      });

      modal.classList.add("hidden");
      reasonInput.value = "";
      currentFailOrderId = null;
      loadPickupOrders();

    } catch (err) {
      console.error(err);
      alert("บันทึกไม่สำเร็จ ❌");
    }
  });
}

// ✅ Filter Dropdown
function setupFilters() {
  const btn = document.getElementById("deliveryStatusDropdownBtn");
  const menu = document.getElementById("deliveryStatusMenu");
  const label = document.getElementById("deliveryStatusLabel");

  btn.addEventListener("click", () => menu.classList.toggle("hidden"));

  menu.querySelectorAll("a").forEach(item => {
    item.addEventListener("click", () => {
      currentFilter = item.dataset.status;
      label.textContent = item.textContent;
      menu.classList.add("hidden");
      renderOrders();
    });
  });
}

// ✅ Search
function setupSearch() {
  document.getElementById("deliverySearchInput")
    .addEventListener("input", renderOrders);
}
