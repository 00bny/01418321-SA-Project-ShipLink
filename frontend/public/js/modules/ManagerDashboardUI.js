import { ApiClient } from './apiClient.js';

const STATUS_LABEL = {
  Pending: 'รอชำระเงิน',
  Paid: 'ชำระเงินแล้ว',
  Pickup: 'เข้ารับพัสดุแล้ว',
  'In Transit': 'อยู่ระหว่างจัดส่ง',
  Success: 'จัดส่งเสร็จสิ้น',
  Fail: 'จัดส่งไม่สำเร็จ',
  Return: 'ตีกลับ'
};

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
function baht(n){ return '฿' + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }

export default class ManagerDashboardUI {
  constructor(){
    this.branchId = Number(getQuery('branchId') || 1);

    this.elToday = document.getElementById('cntToday');
    this.elMonth = document.getElementById('cntMonth');
    this.elTotal = document.getElementById('cntTotal');
    this.statusWrap = document.getElementById('statusWrap');
    this.companyRows = document.getElementById('companyRows');
    this.companyEmpty = document.getElementById('companyEmpty');
    this.empRows = document.getElementById('empRows');
    this.empEmpty = document.getElementById('empEmpty');

    this.loadSummary();
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

    const keys = ['Pending','Paid','Pickup','In Transit','Success','Fail','Return'];
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
}
