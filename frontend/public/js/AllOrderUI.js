import { ApiClient } from './modules/apiClient.js';

const STATUS_CLASS = {
  Pending:    'bg-amber-100 text-amber-700',
  Paid:       'bg-blue-100 text-blue-700',
  Pickup:     'bg-purple-100 text-purple-700',
  RequestedPickup : 'bg-orange-100 text-orange-700',
  'In Transit':'bg-sky-100 text-sky-700',
  Success:    'bg-green-100 text-green-700',
  Fail:       'bg-red-100 text-red-700',
  Return:     'bg-gray-200 text-gray-700'
};

function fmtDT(d) {
  if (!d) return '-';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2,'0');
  const mm = String(dt.getMonth()+1).padStart(2,'0');
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2,'0');
  const mi = String(dt.getMinutes()).padStart(2,'0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
function baht(n){ return '฿' + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }

class AllOrderUI {
  constructor(){
    this.branchId = Number(getQuery('branchId') || 1);
    this.rowsEl = document.getElementById('rows');
    this.emptyEl = document.getElementById('empty');
    this.searchEl = document.getElementById('search');
    this.statusEl = document.getElementById('status');

    this.initWalletDropdown();
    this.loadBranchBalance();

    this.data = [];
    this.bindFilters();
    this.load();

    document.getElementById('btnLogout')?.addEventListener('click', ()=>this.logout());

  }

  bindFilters(){
    this.searchEl.addEventListener('input', ()=> this.render());
    this.statusEl.addEventListener('change', ()=> this.render());
  }

  async load(){
    const rows = await ApiClient.listOrdersByBranch(this.branchId);
    this.data = Array.isArray(rows) ? rows : [];
    this.render();
  }

  render(){
    const q = (this.searchEl.value||'').trim().toLowerCase();
    const st = this.statusEl.value;

    const filtered = this.data.filter(o=>{
      const okSt = !st || o.status === st;
      const okQ = !q || String(o.orderId).toLowerCase().includes(q)
                  || (o.senderName||'').toLowerCase().includes(q);
      return okSt && okQ;
    });

    this.rowsEl.innerHTML = filtered.map(o=>`
      <tr class="border-t border-slate-200">
        <td class="py-2">${o.orderId}</td>
        <td class="py-2">${o.senderName || '-'}</td>
        <td class="py-2">${fmtDT(o.orderDate)}</td>
        <td class="py-2">${fmtDT(o.updatedAt)}</td>
        <td class="py-2">${o.employeeName || '-'}</td>
        <td class="py-2">${o.companyName || '-'}</td>
        <td class="py-2">
          <span class="px-2 py-1 text-xs rounded-full ${STATUS_CLASS[o.status] || 'bg-slate-100 text-slate-700'}">
            ${o.statusTH || o.status}
          </span>
        </td>
      </tr>
    `).join('');

    this.emptyEl.classList.toggle('hidden', filtered.length>0);
  }

  // -------- Wallet header (เหมือน create-order) --------
  async loadBranchBalance(){
    try {
      const r = await ApiClient.getBranchBalance(this.branchId);
      const el = document.getElementById('walletBalance');
      if (el) el.textContent = baht(r?.balance || 0);
    } catch {}
  }

  initWalletDropdown(){
    const btn = document.getElementById('walletBtn');
    const menu = document.getElementById('walletMenu');
    const topup = document.getElementById('actTopup');
    const withdraw = document.getElementById('actWithdraw');
    const hist = document.getElementById('actHist');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e)=>{ e.stopPropagation(); menu.classList.toggle('hidden'); });
    document.addEventListener('click', ()=>{ if (!menu.classList.contains('hidden')) menu.classList.add('hidden'); });

    const nav = (file)=> {
      const url = new URL(`../pages/${file}`, window.location.href);
      url.searchParams.set('branchId', String(this.branchId));
      window.location.href = url.toString();
    };
    if (topup)   topup.addEventListener('click', ()=> nav('branch-topup.html'));
    if (withdraw) withdraw.addEventListener('click', ()=> nav('branch-withdraw.html'));
    if (hist)    hist.addEventListener('click', ()=> nav('branch-transactions.html'));
  }

      // ------- logout -------
  logout(){
    const ok = confirm('คุณต้องการออกจากระบบหรือไม่?');
    if (!ok) return;
    // ล้างข้อมูล session/localStorage ถ้ามี
    // localStorage.clear();
    // sessionStorage.clear();
    // กลับไปหน้า login
    window.location.href = '../pages/login.html';
  }
}

new AllOrderUI();