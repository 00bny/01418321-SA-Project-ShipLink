import { ApiClient } from './apiClient.js';
import { Popup } from './Popup.js';

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
function fmtDT(d){
  if (!d) return '-';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2,'0');
  const mm = String(dt.getMonth()+1).padStart(2,'0');
  const yy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2,'0');
  const mi = String(dt.getMinutes()).padStart(2,'0');
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

export default class StaffDashboardUI {
  constructor(){
    this.branchId = Number(getQuery('branchId') || 1);

    this.elToday = document.getElementById('cntToday');
    this.elMonth = document.getElementById('cntMonth');
    this.elTotal = document.getElementById('cntTotal');
    this.statusWrap = document.getElementById('statusWrap');
    this.returnRows = document.getElementById('returnRows');
    this.returnEmpty = document.getElementById('returnEmpty');

    this.initWalletDropdown();
    this.loadWallet();

    this.loadSummary();
    this.loadReturns();
  }

  async loadSummary(){
    const d = await ApiClient.getStaffDashboard(this.branchId);
    console.log('DEBUG dashboard data:', d);
    const counts = d?.counts || {};
    const sc = d?.statusCounts || {};

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
  }

  async loadReturns(){
    const rows = await ApiClient.getReturnFollowups(this.branchId);
    this.returnRows.innerHTML = rows.map(r=>`
        <tr class="border-t border-slate-200">
        <td class="py-2">#${r.orderId}</td>
        <td class="py-2">${r.senderName || '-'}</td>
        <td class="py-2">${r.senderPhone || '-'}</td>
        <td class="py-2">${fmtDT(r.updatedAt)}</td>
        <td class="py-2">
            <button data-id="${r.orderId}" 
                    class="btnContact bg-green-600 hover:bg-green-700 text-white rounded-md px-3 py-1">
            ติดต่อลูกค้าแล้ว
            </button>
        </td>
        </tr>
    `).join('');
    this.returnEmpty.classList.toggle('hidden', (rows||[]).length>0);

    this.returnRows.querySelectorAll('.btnContact').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
        const id = Number(btn.dataset.id);
        const ok = confirm(`ยืนยันว่าคุณได้ติดต่อกับลูกค้าในออร์เดอร์ #${id} แล้วใช่หรือไม่?`);
        if (!ok) return;

        const res = await ApiClient.markReturnContacted(id);
        if (res?.updated){
            btn.closest('tr')?.remove();
            if (!this.returnRows.querySelector('tr')) this.returnEmpty.classList.remove('hidden');
            alert('อัปเดตสถานะเรียบร้อยแล้ว');
        } else {
            alert(res?.message || 'อัปเดตไม่สำเร็จ');
        }
        });
    });
  }

  // ------- wallet dropdown -------
  async loadWallet(){
    try{
      const r = await ApiClient.getBranchBalance(this.branchId);
      document.getElementById('walletBalance').textContent = baht(r?.balance||0);
    }catch{}
  }
  initWalletDropdown(){
    const btn = document.getElementById('walletBtn');
    const menu = document.getElementById('walletMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e)=>{ e.stopPropagation(); menu.classList.toggle('hidden'); });
    document.addEventListener('click', ()=>{ if (!menu.classList.contains('hidden')) menu.classList.add('hidden'); });

    const nav = (file)=>{
      const url = new URL(`../pages/${file}`, window.location.href);
      url.searchParams.set('branchId', String(this.branchId));
      window.location.href = url.toString();
    };
    document.getElementById('actTopup')?.addEventListener('click', ()=>nav('branch-topup.html'));
    document.getElementById('actWithdraw')?.addEventListener('click', ()=>nav('branch-withdraw.html'));
    document.getElementById('actHist')?.addEventListener('click', ()=>nav('branch-transactions.html'));
  }
}
