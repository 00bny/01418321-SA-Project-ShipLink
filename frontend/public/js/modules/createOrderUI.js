import { $, $$, mute, unmute, scrollToEl, fmtMoney } from './dom.js';
import { ApiClient } from './apiClient.js';
import { Popup } from './popup.js';

export default class CreateOrderUI {
  constructor(){
    // state
    this.sender = null; this.receiver = null;
    this.selectedQuote = null; this.employeeId = 1;

    // step1
    $('#btnSearchSender').onclick   = () => this.search('sender');
    $('#btnSearchReceiver').onclick = () => this.search('receiver');
    $('#btnSaveSender').onclick     = () => this.save('sender');
    $('#btnSaveReceiver').onclick   = () => this.save('receiver');
    $('#nextToStep3').onclick       = () => { unmute($('#step3')); scrollToEl($('#step3')); };

    // step3
    $('#btnCalc').onclick           = () => this.calcQuotes();
    $('#nextToStep5').onclick       = () => { unmute($('#step5')); scrollToEl($('#step5')); this.refreshCheckout(); };

    // checkout / step5
    $('#addon').addEventListener('input', () => this.updateFees());
    $('#btnAddOrder').onclick       = () => this.addOrder();
    $('#selectAll').onchange        = (e)=> this.toggleAll(e.target.checked);
    $('#btnPayAll').onclick         = () => this.payAll();

    // initial locks
    mute($('#step3')); mute($('#step5'));
    this.updateNextBtn();           // ปุ่ม step1
    this.setBtnState($('#nextToStep5'), false); // ปุ่ม step4

    // โหลด CHECK OUT ทันที (ใช้งานได้ตลอด)
    this.refreshCheckout();
  }

  // ---------- helpers ----------
  setBtnState(btn, enabled){
    btn.disabled = !enabled;
    if (enabled){
      btn.classList.remove('btn-gray');
      btn.classList.add('bg-primary','text-white');
    } else {
      btn.classList.add('btn-gray');
      btn.classList.remove('bg-primary','text-white');
    }
  }

  setPreview(which, data){
    const box = $(`#${which}Preview`);
    if (!data) {
      box.innerHTML = `<span class="text-slate-500">ยังไม่มีข้อมูล</span>`;
      return;
    }
    const name = data.CustomerName || '';
    const phone = data.CustomerPhone || '';
    const addr = data.CustomerAddress || '';

    box.innerHTML = `
      <div class="text-slate-900"><b>ชื่อ:</b> ${name}</div>
      <div class="text-slate-900"><b>เบอร์โทรศัพท์:</b> ${phone}</div>
      <div class="text-slate-900"><b>ที่อยู่:</b> ${addr}</div>
      <div class="mt-3">
        <button class="editBtn bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm px-3 py-1 rounded-md">แก้ไข</button>
      </div>
    `;
    const editBtn = box.querySelector('.editBtn');
    editBtn.onclick = () => {
      const form = $(`#${which}Form`);
      $(`#${which}Name`).value = name;
      $(`#${which}Addr`).value = addr;
      form.classList.remove('hidden');
      scrollToEl(form);
    };
  }

  updateNextBtn(){
    const ready = !!(this.sender && this.receiver);
    this.setBtnState($('#nextToStep3'), ready);
  }

  // ---------- STEP1 ----------
  async search(which){
    const phone = $(`#${which}Phone`).value.trim();
    if (!phone) return Popup.error('กรอกเบอร์โทรศัพท์ก่อน');

    const found = await ApiClient.searchCustomer(phone);
    const form = $(`#${which}Form`);

    if (!found){
      form.classList.remove('hidden');
      this[which] = null;
      this.setPreview(which, null);
      this.updateNextBtn();
      return;
    }

    this[which] = found;
    this.setPreview(which, found);
    form.classList.add('hidden');
    this.updateNextBtn();
  }

  async save(which){
    const phone = $(`#${which}Phone`).value.trim();
    const name  = $(`#${which}Name`).value.trim();
    const addr  = $(`#${which}Addr`).value.trim();
    if (!name || !addr) return Popup.error('กรอกชื่อ/ที่อยู่ให้ครบ');

    let result;
    if (this[which]) result = await ApiClient.updateCustomer(phone, { name, address: addr });
    else             result = await ApiClient.createCustomer({ name, phone, address: addr });

    this[which] = result;
    this.setPreview(which, result);
    $(`#${which}Form`).classList.add('hidden');
    Popup.info('บันทึกแล้ว');
    this.updateNextBtn();
  }

  // ---------- STEP3: quotes ----------
  // ไม่เขียนค่ากลับ input เพื่อป้องกัน "ค่าหาย"
  readParcelInputs(){
    const toNum = (v)=> {
      const n = Number(String(v).replace(',', '.'));
      return Number.isFinite(n) ? n : NaN;
    };
    return {
      width:  toNum($('#w').value),
      length: toNum($('#l').value),
      height: toNum($('#h').value),
      weight: toNum($('#weight').value)
    };
  }

  async calcQuotes(){
    if (!this.sender || !this.receiver) return Popup.error('ยังไม่ครบผู้ส่ง/ผู้รับ');

    const size = this.readParcelInputs();
    // ตรวจว่ากรอกครบและเป็นตัวเลข
    if ([size.width,size.length,size.height,size.weight].some(x=>!Number.isFinite(x) || x<=0)){
      return Popup.error('กรุณากรอก กว้าง/ยาว/สูง/น้ำหนัก ให้ถูกต้อง (> 0)');
    }

    const { quotes } = await ApiClient.getQuotes(size);
    const tbody = $('#quoteRows');

    if (!quotes?.length){
      tbody.innerHTML = `<tr><td class="py-3" colspan="4">ไม่มีตัวเลือก</td></tr>`;
      this.selectedQuote = null;
      this.setBtnState($('#nextToStep5'), false);
      this.updateFees();
      return;
    }

    tbody.innerHTML = quotes.map(q=>`
      <tr class="border-t border-slate-200 hover:bg-slate-50 cursor-pointer" data-id="${q.companyId}" data-ship="${q.shipCostCustomer}" data-profit="${q.profit}">
        <td class="py-3">${q.companyName}</td>
        <td class="py-3">${fmtMoney(q.shipCostCustomer)}</td>
        <td class="py-3">${fmtMoney(q.profit)}</td>
        <td class="py-3">${q.etaDays}</td>
      </tr>
    `).join('');

    // ต้อง "เลือก" ก่อนถึงจะไปต่อได้
    $$('#quoteRows tr').forEach(tr=>{
      tr.onclick = ()=>{
        $$('#quoteRows tr').forEach(x=>x.classList.remove('ring','ring-blue-400'));
        tr.classList.add('ring','ring-blue-400');
        this.selectedQuote = {
          companyId: Number(tr.dataset.id),
          shipCost: Number(tr.dataset.ship),
          profit: Number(tr.dataset.profit),
          companyName: tr.children[0].textContent.trim()
        };
        this.setBtnState($('#nextToStep5'), true); // ปุ่มเป็นสีน้ำเงิน
        this.updateFees();
      };
    });

    // ยังไม่ได้เลือก แสดงปุ่มเป็นสีเทา
    this.selectedQuote = null;
    this.setBtnState($('#nextToStep5'), false);
    scrollToEl($('#step3'));
  }

  // ---------- STEP5 ----------
  updateFees(){
    const addOnRaw = $('#addon').value;
    const addOn = Number(String(addOnRaw).replace(',', '.'));
    const validAddOn = Number.isFinite(addOn) ? addOn : 0;

    if (!this.selectedQuote){
      $('#feeShip').textContent   = '$0.00';
      $('#feeWallet').textContent = '$0.00';
      $('#feeCharge').textContent = fmtMoney(validAddOn);
      return;
    }
    const shipGross = this.selectedQuote.shipCost;           // ลูกค้าจ่าย
    const walletNet = shipGross - this.selectedQuote.profit; // ร้านจ่ายให้บริษัท
    $('#feeShip').textContent   = fmtMoney(shipGross);
    $('#feeWallet').textContent = fmtMoney(walletNet);
    $('#feeCharge').textContent = fmtMoney(shipGross + validAddOn);
  }

  async addOrder(){
    if (!this.selectedQuote) return Popup.error('ยังไม่ได้เลือกบริษัทขนส่ง');

    const size = this.readParcelInputs();
    if ([size.width,size.length,size.height,size.weight].some(x=>!Number.isFinite(x) || x<=0)){
      return Popup.error('ข้อมูลพัสดุไม่ถูกต้อง');
    }

    const addOnRaw = $('#addon').value;
    const addOn = Number(String(addOnRaw).replace(',', '.'));
    const addOnCost = Number.isFinite(addOn) ? addOn : 0;

    const payload = {
      senderId: this.sender.CustomerID,
      receiverId: this.receiver.CustomerID,
      employeeId: this.employeeId,
      companyId: this.selectedQuote.companyId,
      parcelType: $('#parcelType').value || 'อื่นๆ',
      width: size.width, height: size.height, length: size.length, weight: size.weight,
      addOnCost
    };

    const created = await ApiClient.createOrderDraft(payload);
    if (created?.OrderID){
      // รีเฟรชหน้าเว็บ (ตาม requirement)
      window.location.reload();
    } else Popup.error('สร้างออร์เดอร์ไม่สำเร็จ');
  }

  // ---------- CHECK OUT ----------
  async refreshCheckout(){
    const rows = await ApiClient.listUnpaid(this.employeeId);
    const tbody = $('#checkoutRows');
    tbody.innerHTML = rows.map(r=>`
      <tr class="border-t border-slate-200">
        <td class="py-2"><input type="checkbox" class="chk" data-amount="${Number(r.ShipCost) + Number(r.AddOnCost||0)}"></td>
        <td class="py-2">${r.OrderID}</td>
        <td class="py-2">${fmtMoney(Number(r.ShipCost) + Number(r.AddOnCost||0))}</td>
        <td class="py-2">${r.ParcelType}</td>
        <td class="py-2 text-red-500">แก้ไข / ยกเลิก</td>
      </tr>
    `).join('');

    $$('#checkoutRows .chk').forEach(chk => chk.onchange = ()=> this.updateSelectedSummary());
    this.updateSelectedSummary();
    $('#chosenCompany').textContent = this.selectedQuote?.companyName || '-';
    this.updateFees();
  }

  updateSelectedSummary(){
    const items = $$('#checkoutRows .chk').filter(c=>c.checked);
    const total = items.reduce((s,c)=> s + Number(c.dataset.amount), 0);
    $('#selectedCount').textContent = items.length;
    $('#selectedTotal').textContent = fmtMoney(total);
  }

  toggleAll(checked){
    $$('#checkoutRows .chk').forEach(c=> c.checked = checked);
    this.updateSelectedSummary();
  }

  async payAll(){
    const res = await ApiClient.payAll(this.employeeId);
    if (res?.message?.includes('ชำระเงิน')) {
      Popup.info(`ชำระแล้ว ${res.count} รายการ, รวม ${fmtMoney(res.total)}`);
      await this.refreshCheckout();
    } else Popup.error(res.message || 'ไม่สามารถชำระเงินได้');
  }
}
