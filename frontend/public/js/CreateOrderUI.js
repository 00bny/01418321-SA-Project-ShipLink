import { $, $$, mute, unmute, scrollToEl, fmtMoney } from './modules/Dom.js';
import { ApiClient } from './modules/apiClient.js';
import { Popup } from './modules/Popup.js';

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
function baht(n){ return '฿' + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }

class CreateOrderUI {
  constructor(){
    // state
    this.sender = null; this.receiver = null;
    this.selectedQuote = null;
    this.employeeId = Number(getQuery('employeeId') || 2);
    this.branchId  = Number(getQuery('branchId') || 1);
    this.editingOrderId = null;

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
    $('#btnAddOrder').onclick       = () => this.addOrUpdateOrder();
    $('#selectAll').onchange        = (e)=> this.toggleAll(e.target.checked);
    $('#btnPaySelected').onclick         = () => this.paySelected();

    // numeric guards
    this.attachNumericGuards();

    // initial locks
    mute($('#step3')); mute($('#step5'));
    this.updateNextBtn();
    this.setBtnState($('#nextToStep5'), false);

    // initial checkout
    this.refreshCheckout();
    this.initWalletDropdown();
    this.loadWallet();

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
    if (!phone) return Popup.error('กรุณากรอกเบอร์โทรศัพท์');
    if (!/^\d+$/.test(phone)) return Popup.error('กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขเท่านั้น');

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
    if (name.length > 60)  return Popup.error('ชื่อต้องไม่เกิน 60 ตัวอักษร');
    if (addr.length > 150) return Popup.error('ที่อยู่ต้องไม่เกิน 150 ตัวอักษร');

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

    // ถ้าอยู่ในโหมดแก้ไขและมี companyId เดิม → auto select แถวที่ตรง
    if (this.editingOrderId && this.__editingCompanyId){
      const tr = Array.from($$('#quoteRows tr')).find(t => Number(t.dataset.id) === Number(this.__editingCompanyId));
      if (tr) tr.click();
      this.__editingCompanyId = null; // เคลียร์
    } else {
      this.selectedQuote = null;
      this.setBtnState($('#nextToStep5'), false);
    }

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

  async addOrUpdateOrder(){
    if (!this.selectedQuote) return Popup.error('ยังไม่ได้เลือกบริษัทขนส่ง');
    const size = this.readParcelInputs();
    const msg = this.validateParcelRules(size);
    if (msg) return Popup.error(msg);

    const addOn = parseFloat(String($('#addon').value).replace(',', '.'));
    const addOnCost = Number.isFinite(addOn) && addOn >= 0 ? Number(addOn.toFixed(2)) : 0;

    const payload = {
      senderId: this.sender.CustomerID,
      receiverId: this.receiver.CustomerID,
      employeeId: this.employeeId,
      companyId: this.selectedQuote.companyId,
      parcelType: $('#parcelType').value || 'อื่นๆ',
      width: size.width, height: size.height, length: size.length, weight: size.weight,
      addOnCost,
      branchId: this.branchId
    };

    let result;
    if (this.editingOrderId) {
      result = await ApiClient.updateOrder(this.editingOrderId, payload);
    } else {
      result = await ApiClient.createOrderDraft(payload);
    }

    if (result?.OrderID){
      this.editingOrderId = null;
      this.resetAllForms();
      setTimeout(()=> window.location.reload(), 100);
    } else {
      Popup.error(result?.message || 'บันทึกออร์เดอร์ไม่สำเร็จ');
    }
  }

  resetAllForms(){
    this.sender = null; this.receiver = null;
    this.editingOrderId = null;
    $('#senderPhone').value = ''; $('#receiverPhone').value = '';
    $('#senderPreview').innerHTML = `<span class="text-slate-500">ยังไม่มีข้อมูล</span>`;
    $('#receiverPreview').innerHTML = `<span class="text-slate-500">ยังไม่มีข้อมูล</span>`;
    $('#senderForm').classList.add('hidden'); $('#receiverForm').classList.add('hidden');
    $('#senderName').value = ''; $('#senderAddr').value = '';
    $('#receiverName').value = ''; $('#receiverAddr').value = '';
    $('#w').value = '0'; $('#l').value = '0'; $('#h').value = '0'; $('#weight').value = '0.00';
    $('#parcelType').selectedIndex = 0;
    $('#quoteRows').innerHTML = `<tr><td class="py-3" colspan="3" id="quoteEmpty">– กดคำนวณราคาเพื่อแสดงตัวเลือก –</td></tr>`;
    this.selectedQuote = null;
    this.setBtnState($('#nextToStep3'), false);
    this.setBtnState($('#nextToStep5'), false);
    $('#addon').value = '0.00';
    $('#feeShip').textContent = '$0.00';
    $('#feeWallet').textContent = '$0.00';
    $('#feeCharge').textContent = '$0.00';
  }

  // ---------- CHECK OUT ----------
  async refreshCheckout(){
    const rows = await ApiClient.listUnpaid(this.branchId);
    const tbody = $('#checkoutRows');
    tbody.innerHTML = rows.map(r=>`
      <tr class="border-t border-slate-200" data-id="${r.OrderID}">
        <td class="py-2">
          <input type="checkbox" class="chk" data-amount="${Number(r.ShipCost) + Number(r.AddOnCost||0)}">
        </td>
        <td class="py-2">${r.OrderID}</td>
        <td class="py-2">${fmtMoney(Number(r.ShipCost) + Number(r.AddOnCost||0))}</td>
        <td class="py-2">${r.ParcelType}</td>
        <td class="py-2">
          <button class="btn-edit text-blue-600 hover:underline mr-3">แก้ไข</button>
          <button class="btn-cancel text-red-600 hover:underline">ยกเลิก</button>
        </td>
      </tr>
    `).join('');

    // bind checkbox summary
    $$('#checkoutRows .chk').forEach(chk => chk.onchange = ()=> this.updateSelectedSummary());
    this.updateSelectedSummary();
    $('#chosenCompany').textContent = this.selectedQuote?.companyName || '-';
    this.updateFees();

    // bind Edit/Cancel
    $$('#checkoutRows .btn-edit').forEach(btn=>{
      btn.onclick = (e)=>{
        const tr = e.target.closest('tr');
        const id = Number(tr.dataset.id);
        this.loadOrderToForm(id);
      };
    });
    $$('#checkoutRows .btn-cancel').forEach(btn=>{
      btn.onclick = async (e)=>{
        const tr = e.target.closest('tr');
        const id = Number(tr.dataset.id);
        if (confirm(`ยืนยันยกเลิกออร์เดอร์ #${id} ?`)) {
          const res = await ApiClient.deleteOrder(id);
          if (res?.deleted) {
            Popup.info('ลบออร์เดอร์แล้ว');
            await this.refreshCheckout();
          } else {
            Popup.error(res?.message || 'ลบไม่สำเร็จ');
          }
        }
      };
    });
  }

  async paySelected(){
    const items = $$('#checkoutRows .chk').filter(c=>c.checked);
    if (!items.length) return Popup.error('กรุณาเลือกออร์เดอร์ก่อน');

    const totalCustomer = items.reduce((s,c)=> s + Number(c.dataset.amount), 0);
    const ok = await Popup.confirm(
      `ยืนยันการชำระเงิน ${items.length} รายการหรือไม่?\n\nยอดเรียกเก็บลูกค้า: ${this.fmtMoneyTHB(totalCustomer)}`
    );
    if (!ok) return;

    const orderIds = items.map(c => Number(c.closest('tr').dataset.id));

    const res = await ApiClient.checkoutPay({
      branchId: this.branchId,
      employeeId: this.employeeId,
      orderIds
    });

    if (res.message === 'PAY_OK') {
      Popup.info(`ชำระเงินสำเร็จ ${res.paidOrders} รายการ\nยอดตัดเงินในระบบ: ${this.fmtMoneyTHB(res.totalCut)}`);
      await this.loadWallet();
      await this.refreshCheckout();
    } else {
      Popup.error(res.message || 'เกิดข้อผิดพลาด');
    }
  }

  async loadOrderToForm(orderId){
    const o = await ApiClient.getOrder(orderId);
    if (!o?.OrderID) return Popup.error('ไม่พบบันทึกออร์เดอร์');

    // โหลดลูกค้า
    const sender = await ApiClient.getCustomerById(o.SenderID);
    const receiver = await ApiClient.getCustomerById(o.ReceiverID);
    if (sender) { this.sender = sender; this.setPreview('sender', sender); $('#senderPhone').value = sender.CustomerPhone || ''; }
    if (receiver){ this.receiver = receiver; this.setPreview('receiver', receiver); $('#receiverPhone').value = receiver.CustomerPhone || ''; }
    this.updateNextBtn();
    unmute($('#step3')); scrollToEl($('#step3'));

    // ขนาด/ประเภท/ addon
    $('#w').value = String(Math.round(Number(o.Width||0)));
    $('#l').value = String(Math.round(Number(o.Length||0)));
    $('#h').value = String(Math.round(Number(o.Height||0)));
    $('#weight').value = Number(o.Weight||0).toFixed(2);
    $('#parcelType').value = o.ParcelType || 'อื่นๆ';
    $('#addon').value = Number(o.AddOnCost||0).toFixed(2);

    // จำ company เพื่อนำไป auto-select หลังคำนวณราคา
    this.__editingCompanyId = o.CompanyID;
    this.editingOrderId = o.OrderID;

    // คำนวณราคาตามขนาดปัจจุบันแล้วเลือกบริษัทเดิม
    await this.calcQuotes();

    // เปิด step5 พร้อม update fees
    unmute($('#step5')); this.updateFees();
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

  fmtMoneyTHB(n){
    return '฿' + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
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
      url.searchParams.set('employeeId', String(this.employeeId));
      url.searchParams.set('branchId', String(this.branchId));
      window.location.href = url.toString();
    };
    document.getElementById('actTopup')?.addEventListener('click', ()=>nav('branch-topup.html'));
    document.getElementById('actWithdraw')?.addEventListener('click', ()=>nav('branch-withdraw.html'));
    document.getElementById('actHist')?.addEventListener('click', ()=>nav('branch-transactions.html'));
  }

      // ------- logout -------
  logout(){
    const ok = confirm('คุณต้องการออกจากระบบหรือไม่?');
    if (!ok) return;
    window.location.href = '../pages/login.html';
  }
}

new CreateOrderUI();