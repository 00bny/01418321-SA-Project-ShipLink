import { ApiClient } from './modules/apiClient.js';

const STATUS_LABEL = {
  Pending: 'รอชำระเงิน',
  Paid: 'ชำระเงินแล้ว',
  Pickup: 'เข้ารับพัสดุแล้ว',
RequestedPickup : 'รอเข้ารับ',
  'In Transit': 'อยู่ระหว่างจัดส่ง',
  Success: 'จัดส่งเสร็จสิ้น',
  Fail: 'จัดส่งไม่สำเร็จ',
  Return: 'ตีกลับ'
};

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
function baht(n){ return '฿' + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }

class ManagerDashboardUI {
  constructor(){
    this.branchId = Number(getQuery('branchId') || 1);
    this.employeeId = Number(getQuery('employeeId') || 1);

    this.elToday = document.getElementById('cntToday');
    this.elMonth = document.getElementById('cntMonth');
    this.elTotal = document.getElementById('cntTotal');
    this.statusWrap = document.getElementById('statusWrap');
    this.companyRows = document.getElementById('companyRows');
    this.companyEmpty = document.getElementById('companyEmpty');
    this.empRows = document.getElementById('empRows');
    this.empEmpty = document.getElementById('empEmpty');

    this.loadSummary();

    document.getElementById('btnLogout')?.addEventListener('click', ()=>this.logout());
  
    this.patchSidebarLinks();
  }

  patchSidebarLinks(){
    const addParams = (sel, file) => {
      const a = document.querySelector(sel);
      if (!a) return;
      const url = new URL(`../pages/${file}`, window.location.href);
      url.searchParams.set('employeeId', String(this.employeeId));
      url.searchParams.set('branchId', String(this.branchId));
      a.href = url.toString();
    };
    addParams('a[href$="dashboard-manager.html"]', 'dashboard-manager.html');
    addParams('a[href$="add-staff.html"]', 'add-staff.html');
  }

  async loadSummary(){
    const d = await ApiClient.getManagerDashboard(this.branchId);
    const counts = d?.counts || {};
    const sc = d?.statusCounts || {};
    const companies = d?.companyCounts || [];
    const emps = d?.employees || [];

    this.elToday.textContent = counts.today ?? 0;
    this.elMonth.textContent = counts.month ?? 0;
    this.elTotal.textContent = counts.total ?? 0;

    const keys = ['Pending','Paid','Pickup','RequestedPickup','In Transit','Success','Fail','Return'];
    this.statusWrap.innerHTML = keys.map(k=>{
      const val = sc[k] || 0;
      return `
        <div class="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div class="text-sm text-slate-500">${STATUS_LABEL[k]}</div>
            <div class="text-2xl font-bold mt-1">${val}</div>
          </div>
        </div>
      `;
    }).join('');

    this.companyRows.innerHTML = companies.map(c=>`
      <tr class="border-t border-slate-200">
        <td class="py-2">${c.companyName}</td>
        <td class="py-2">${c.count}</td>
      </tr>
    `).join('');
    this.companyEmpty.classList.toggle('hidden', companies.length>0);

    this.empRows.innerHTML = emps.map(e=>`
      <tr class="border-t border-slate-200">
        <td class="py-2">#${e.id}</td>
        <td class="py-2">${e.name}</td>
        <td class="py-2">${e.phone}</td>
        <td class="py-2">${e.orderCount}</td>
      </tr>
    `).join('');
    this.empEmpty.classList.toggle('hidden', emps.length>0);
  }

      // ------- logout -------
  logout(){
    const ok = confirm('คุณต้องการออกจากระบบหรือไม่?');
    if (!ok) return;
    window.location.href = '../pages/login.html';
  }
}

new ManagerDashboardUI();