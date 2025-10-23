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

    // step3/4
    $('#btnCalc').onclick           = () => this.calcQuotes();
    $('#nextToStep5').onclick       = () => { unmute($('#step5')); scrollToEl($('#step5')); this.refreshCheckout(); };

    // step5 + checkout
    $('#addon').addEventListener('input', () => this.updateFees());
    $('#btnAddOrder').onclick       = () => this.addOrder();
    $('#selectAll').onchange        = (e)=> this.toggleAll(e.target.checked);
    $('#btnPayAll').onclick         = () => this.payAll();

    // numeric guards (ทำให้ abc → 0 หรือ 0.00 อัตโนมัติเมื่อเปลี่ยนช่อง)
    this.attachNumericGuards();

    // initial locks
    mute($('#step3')); mute($('#step5'));
    this.updateNextBtn();
    this.setBtnState($('#nextToStep5'), false);

    // initial checkout
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

  attachNumericGuards(){
    // integer fields: w,l,h (>=0)
    ['w','l','h'].forEach(id=>{
      const el = $('#'+id); if (!el) return;
      if (el.value === '') el.value = '0';
      const fix = () => {
        const parsed = parseInt(String(el.value).replace(',', ''), 10);
        const v = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
        el.value = String(v);
      };
      el.addEventListener('change', fix);
      el.addEventListener('blur', fix);
    });
    // decimal fields: weight, addon (>=0, 2 decimals)
    const decFix = (el) => {
      let raw = String(el.value).replace(',', '.');
      let num = parseFloat(raw);
      if (!Number.isFinite(num) || num < 0) num = 0;
      el.value = num.toFixed(2);
      if (el.id === 'addon') this.updateFees();
    };
    const wEl = $('#weight'); if (wEl){ if (wEl.value==='') wEl.value='0.00'; wEl.addEventListener('change', ()=>decFix(wEl)); wEl.addEventListener('blur', ()=>decFix(wEl)); }
    const add = $('#addon');  if (add){ if (add.value==='') add.value='0.00'; add.addEventListener('change', ()=>decFix(add)); add.addEventListener('blur',  ()=>decFix(add)); }
  }

  setPreview(which, data){
    const box = $(`#${which}Preview`);
    if (!data) { box.innerHTML = `<span class="text-slate-500">ยังไม่มีข้อมูล</span>`; return; }
    const name = data.CustomerName || '';
    const phone = data.CustomerPhone || '';
    const addr = data.CustomerAddress || '';

    box.innerHTML = `
        <div class="text-slate-900 break-words whitespace-pre-wrap"><b>ชื่อ:</b> ${name}</div>
        <div class="text-slate-900 break-words whitespace-pre-wrap"><b>เบอร์โทรศัพท์:</b> ${phone}</div>
        <div class="text-slate-900 break-words whitespace-pre-wrap"><b>ที่อยู่:</b> ${addr}</div>
        <div class="mt-3">
        <button class="editBtn bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm px-3 py-1 rounded-md">แก้ไข</button>
        </div>
    `;
    box.querySelector('.editBtn').onclick = () => {
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

    // Rule: เบอร์โทรศัพท์ต้องเป็นตัวเลขล้วน
    if (!phone) return Popup.error('กรุณากรอกเบอร์โทรศัพท์');
    if (!/^\d+$/.test(phone)) {
      return Popup.error('กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขเท่านั้น');
    }

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

    // Rule: ความยาวชื่อ ≤ 60, ที่อยู่ ≤ 150
    if (!name || !addr) return Popup.error('กรอกชื่อ/ที่อยู่ให้ครบ');
    if (name.length > 60)  return Popup.error('ชื่อต้องไม่เกิน 60 ตัวอักษร');
    if (addr.length > 150)  return Popup.error('ที่อยู่ต้องไม่เกิน 150 ตัวอักษร');

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
  readParcelInputs(){
    const toPosInt = (v)=> {
      const n = parseInt(String(v).replace(',', ''), 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };
    const toPosDec2 = (v)=> {
      const n = parseFloat(String(v).replace(',', '.'));
      return Number.isFinite(n) && n >= 0 ? Number(n.toFixed(2)) : 0;
    };
    return {
      width:  toPosInt($('#w').value),
      length: toPosInt($('#l').value),
      height: toPosInt($('#h').value),
      weight: toPosDec2($('#weight').value)
    };
  }

  validateParcelRules(size){
    // Rule ขนาด: แต่ละด้าน ≤ 100, ผลรวม ≤ 180, น้ำหนัก ≤ 20
    const { width, length, height, weight } = size;

    if (width <= 0 || length <= 0 || height <= 0 || weight <= 0)
      return 'กรุณากรอก กว้าง/ยาว/สูง/น้ำหนัก ให้ถูกต้อง (> 0)';

    if (width > 100 || length > 100 || height > 100)
      return 'กว้าง ยาว สูง แต่ละด้านต้องไม่เกิน 100 ซม.';

    if ((width + length + height) > 180)
      return 'ผลรวมของกว้าง+ยาว+สูง ต้องไม่เกิน 180 ซม.';

    if (weight > 20)
      return 'น้ำหนักต้องไม่เกิน 20 กิโลกรัม';

    return null;
  }

  async calcQuotes(){
    if (!this.sender || !this.receiver) return Popup.error('ยังไม่ครบผู้ส่ง/ผู้รับ');

    // sanitize อีกครั้ง
    this.attachNumericGuards();

    const size = this.readParcelInputs();
    const msg = this.validateParcelRules(size);
    if (msg) return Popup.error(msg);

    const { quotes } = await ApiClient.getQuotes(size);
    const tbody = $('#quoteRows');

    if (!quotes?.length){
      tbody.innerHTML = `<tr><td class="py-3" colspan="3">ไม่มีตัวเลือก</td></tr>`;
      this.selectedQuote = null;
      this.setBtnState($('#nextToStep5'), false);
      this.updateFees();
      return;
    }

    // เรียงค่าขนส่งน้อย→มาก (คงพฤติกรรมที่เพิ่มไว้ก่อนหน้า)
    quotes.sort((a,b)=> Number(a.shipCostCustomer) - Number(b.shipCostCustomer));

    tbody.innerHTML = quotes.map(q=>`
      <tr class="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
          data-id="${q.companyId}" data-ship="${q.shipCostCustomer}" data-profit="${q.profit}">
        <td class="py-3">${q.companyName}</td>
        <td class="py-3">${fmtMoney(q.shipCostCustomer)}</td>
        <td class="py-3">${fmtMoney(q.profit)}</td>
      </tr>
    `).join('');

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
        this.setBtnState($('#nextToStep5'), true);
        this.updateFees();
      };
    });

    this.selectedQuote = null;
    this.setBtnState($('#nextToStep5'), false);
    scrollToEl($('#step3'));
  }

  // ---------- STEP5 ----------
  updateFees(){
    const toDec2 = (v)=> {
      const n = parseFloat(String(v).replace(',', '.'));
      return Number.isFinite(n) && n >= 0 ? Number(n.toFixed(2)) : 0;
    };
    const addOn = toDec2($('#addon').value);

    if (!this.selectedQuote){
      $('#feeShip').textContent   = '$0.00';
      $('#feeWallet').textContent = '$0.00';
      $('#feeCharge').textContent = fmtMoney(addOn);
      return;
    }
    const shipGross = this.selectedQuote.shipCost;
    const walletNet = shipGross - this.selectedQuote.profit;
    $('#feeShip').textContent   = fmtMoney(shipGross);
    $('#feeWallet').textContent = fmtMoney(walletNet);
    $('#feeCharge').textContent = fmtMoney(shipGross + addOn);
  }

  async addOrder(){
    if (!this.selectedQuote) return Popup.error('ยังไม่ได้เลือกบริษัทขนส่ง');

    const size = this.readParcelInputs();
    const msg = this.validateParcelRules(size);
    if (msg) return Popup.error(msg);

    // sanitize addon
    const addOn = parseFloat(String($('#addon').value).replace(',', '.'));
    const addOnCost = Number.isFinite(addOn) && addOn >= 0 ? Number(addOn.toFixed(2)) : 0;

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
      // ล้างค่าฟอร์มทั้งหมดก่อนรีเฟรช
      this.resetAllForms();
      setTimeout(()=> window.location.reload(), 100);
    } else Popup.error('สร้างออร์เดอร์ไม่สำเร็จ');
  }

  resetAllForms(){
    // clear sender/receiver state
    this.sender = null; this.receiver = null;
    $('#senderPhone').value = ''; $('#receiverPhone').value = '';
    $('#senderPreview').innerHTML = `<span class="text-slate-500">ยังไม่มีข้อมูล</span>`;
    $('#receiverPreview').innerHTML = `<span class="text-slate-500">ยังไม่มีข้อมูล</span>`;
    $('#senderForm').classList.add('hidden'); $('#receiverForm').classList.add('hidden');
    $('#senderName').value = ''; $('#senderAddr').value = '';
    $('#receiverName').value = ''; $('#receiverAddr').value = '';
    // parcel inputs
    $('#w').value = '0'; $('#l').value = '0'; $('#h').value = '0'; $('#weight').value = '0.00';
    $('#parcelType').selectedIndex = 0;
    // quotes table
    $('#quoteRows').innerHTML = `<tr><td class="py-3" colspan="3" id="quoteEmpty">– กดคำนวณราคาเพื่อแสดงตัวเลือก –</td></tr>`;
    this.selectedQuote = null;
    this.setBtnState($('#nextToStep3'), false);
    this.setBtnState($('#nextToStep5'), false);
    // fees
    $('#addon').value = '0.00';
    $('#feeShip').textContent = '$0.00';
    $('#feeWallet').textContent = '$0.00';
    $('#feeCharge').textContent = '$0.00';
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
