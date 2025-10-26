import { ApiClient } from "./modules/apiClient.js";
import { initCompanyWalletDropdown, loadCompanyWalletBalance } from "./companyWalletUI.js";

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
const COMPANY_ID = Number(getQuery("companyId") || 1);

document.addEventListener("DOMContentLoaded", async () => {
  initCompanyWalletDropdown();
  await loadCompanyWalletBalance();
  bindLogout();

  await loadSummary();
  await loadPickupStatus();
  await loadParcelStatus();
  await loadBranchBreakdown();
});

/* ✅ Logout */
function bindLogout(){
  document.getElementById("btnLogout")?.addEventListener("click", ()=>{
    if(confirm("ออกจากระบบ?")) window.location.href="../pages/login.html";
  });
}

/* ✅ Load Summary */
async function loadSummary(){
  try {
    const d = await ApiClient.getCompanyDashboardSummary(COMPANY_ID);
    document.getElementById("cntToday").textContent = d?.today || 0;
    document.getElementById("cntMonth").textContent = d?.month || 0;
    document.getElementById("cntTotal").textContent = d?.total || 0;
  } catch {
    console.error("loadSummary failed");
  }
}

/* ✅ Load Pickup Status Count */
async function loadPickupStatus(){
  const wrap = document.getElementById("pickupStat");
  wrap.innerHTML = `<div class="text-center text-gray-400 col-span-3">กำลังโหลด...</div>`;

  try {
    const data = await ApiClient.getCompanyPickupStats(COMPANY_ID);
    wrap.innerHTML = `
      ${box("รอเข้ารับ", data?.RequestedPickup || 0)}
      ${box("กำลังเข้ารับ", data?.PickingUp || 0)}
      ${box("เข้ารับสำเร็จ", data?.PickedUp || 0)}
    `;
  } catch(err){
    console.error(err);
    wrap.innerHTML = `<div class="col-span-3 text-center text-red-500">โหลดข้อมูลล้มเหลว</div>`;
  }
}

/* ✅ Load Parcel Status Count */
async function loadParcelStatus(){
  const wrap = document.getElementById("parcelStat");
  wrap.innerHTML = `<div class="text-center text-gray-400 col-span-3">กำลังโหลด...</div>`;

  try{
    const s = await ApiClient.getCompanyParcelStats(COMPANY_ID);

    wrap.innerHTML = `
      ${box("รอเข้ารับ", s?.RequestedPickup || 0)}
      ${box("เข้ารับสำเร็จ", s?.Pickup || 0)}
      ${box("อยู่ระหว่างจัดส่ง", s?.InTransit || 0)}
      ${box("จัดส่งเสร็จสิ้น", s?.Success || 0)}
      ${box("จัดส่งไม่สำเร็จ", s?.Fail || 0)}
      ${box("ตีกลับ", s?.Return || 0)}
    `;

  } catch(err){
    console.error(err);
    wrap.innerHTML = `<div class="col-span-3 text-center text-red-500">โหลดล้มเหลว</div>`;
  }
}

/* ✅ Load Branch Breakdown Table */
async function loadBranchBreakdown(){
  const tbody = document.getElementById("branchRows");
  const empty = document.getElementById("branchEmpty");
  tbody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-gray-400">กำลังโหลด...</td></tr>`;

  try {
    const list = await ApiClient.getBranchBreakdown(COMPANY_ID);
    if(!list?.length){
      empty.classList.remove("hidden");
      tbody.innerHTML = "";
      return;
    }
    empty.classList.add("hidden");
    tbody.innerHTML = list.map(r=>`
      <tr class="border-b">
        <td class="py-2">${r.BranchName}</td>
        <td class="py-2">${r.BranchAddress}</td>
        <td class="py-2">${r.ParcelCount}</td>
        <td class="py-2">${r.PickupCount}</td>
      </tr>
    `).join("");
  } catch(e){
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-red-500">โหลดล้มเหลว</td></tr>`;
  }
}

/* ✅ UI Box Generator */
function box(title, value){
  return `
    <div class="bg-white border border-border-light rounded-xl p-4 text-center shadow-sm">
      <div class="text-slate-500 text-sm mb-1">${title}</div>
      <div class="text-2xl font-bold text-primary">${value}</div>
    </div>
  `;
}
