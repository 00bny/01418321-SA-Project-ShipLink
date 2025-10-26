import { ApiClient } from './modules/apiClient.js';
import { Popup } from './modules/Popup.js';

function fmt(n){
  return '฿' + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}
function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }

class BranchTransactionsUI {
  constructor(){
    this.branchId = Number(getQuery('branchId') || 1);
    this.employeeId = Number(getQuery('employeeId') || 2);

    this.txnRows = document.getElementById('txnRows');
    this.noData = document.getElementById('noData');
    this.searchInput = document.getElementById('searchInput');
    this.typeFilter = document.getElementById('typeFilter');

    this.searchInput.addEventListener('input', ()=>this.render());
    this.typeFilter.addEventListener('change', ()=>this.render());

    this.data = [];
    this.load();
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
    addParams('a[href$="dashboard-staff.html"]', 'dashboard-staff.html');
    addParams('a[href$="create-order.html"]', 'create-order.html');
    addParams('a[href$="all-order.html"]', 'all-order.html');
    addParams('a[href$="pickup.html"]', 'pickup.html');
  }

  async load(){
    try {
      const rows = await ApiClient.getBranchTransactions(this.branchId);
      this.data = Array.isArray(rows) ? rows : [];
      this.render();
    } catch (e) { Popup.error('ไม่สามารถโหลดประวัติธุรกรรมได้'); }
  }

  render(){
    const keyword = this.searchInput.value.trim().toLowerCase();
    const type = this.typeFilter.value;
    const filtered = this.data.filter(t=>{
      const matchType = !type || t.type === type;
      const matchKeyword = !keyword ||
        t.txnId.toLowerCase().includes(keyword) ||
        (t.employee && t.employee.toLowerCase().includes(keyword));
      return matchType && matchKeyword;
    });

    this.txnRows.innerHTML = filtered.map(t=>`
      <tr class="border-t border-gray-200">
        <td class="py-2">${t.txnId}</td>
        <td class="py-2">${fmt(t.amount)}</td>
        <td class="py-2">
          <span class="px-2 py-1 text-xs rounded-full ${t.type==='TOPUP' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
            ${t.type==='TOPUP' ? 'เติมเงิน' : 'ถอนเงิน'}
          </span>
        </td>
        <td class="py-2">${t.date}</td>
        <td class="py-2">${t.employee}</td>
      </tr>
    `).join('');

    this.noData.classList.toggle('hidden', filtered.length>0);
  }

      // ------- logout -------
  logout(){
    const ok = confirm('คุณต้องการออกจากระบบหรือไม่?');
    if (!ok) return;
    window.location.href = '../pages/login.html';
  }
}

new BranchTransactionsUI();