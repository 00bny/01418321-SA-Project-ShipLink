import { ApiClient } from './apiClient.js';
import { Popup } from './Popup.js';

function fmt(n){ return '฿' + Number(n||0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }

export default class BranchTopupUI {
  constructor(){
    this.branchId = Number(getQuery('branchId') || 1);
    this.employeeId = 1; // TODO: ดึงจาก session/login ในอนาคต

    this.balEl = document.getElementById('bal');
    this.amountEl = document.getElementById('amount');
    this.btnConfirm = document.getElementById('btnConfirm');

    document.querySelectorAll('.quick').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = btn.textContent.replace(/[^\d.]/g,'');
        this.amountEl.value = amt;
      });
    });

    this.btnConfirm.onclick = () => this.topup();
    this.refreshBalance();
  }

  async refreshBalance(){
    const r = await ApiClient.getBranchBalance(this.branchId);
    this.balEl.textContent = fmt(r?.balance || 0);
  }

  async topup(){
    const raw = String(this.amountEl.value).replace(',','.');
    const amt = parseFloat(raw);
    if (!Number.isFinite(amt) || amt <= 0) return Popup.error('กรุณาระบุจำนวนเงินให้ถูกต้อง (> 0)');
    const res = await ApiClient.topupBranch({ branchId: this.branchId, amount: amt, employeeId: this.employeeId });
    if (res?.message === 'TOPUP_OK'){
      Popup.info('เติมเงินสำเร็จ');
      this.amountEl.value = '';
      this.refreshBalance();
    } else Popup.error(res?.message || 'ไม่สามารถเติมเงินได้');
  }
}
