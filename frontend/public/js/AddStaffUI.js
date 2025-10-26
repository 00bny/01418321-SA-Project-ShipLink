import { ApiClient } from './modules/apiClient.js';
import { Popup } from './modules/Popup.js';

function getQuery(name){ return new URLSearchParams(window.location.search).get(name); }
function baht(n){ return '฿' + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }

class AddStaffUI {
  constructor(){
    this.branchId = Number(getQuery('branchId') || 1);
    document.getElementById('btnAdd').addEventListener('click', ()=>this.submit());
    document.getElementById('btnLogout')?.addEventListener('click', ()=>this.logout());
  }

  async submit(){
    const name  = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const pass  = document.getElementById('password').value;
    const conf  = document.getElementById('confirm').value;

    if (!name || !phone || !pass || !conf) return Popup.error('กรุณากรอกข้อมูลให้ครบ');
    if (!/^\d+$/.test(phone)) return Popup.error('เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น');
    if (pass !== conf) return Popup.error('รหัสผ่านไม่ตรงกัน');

    try {
      const res = await ApiClient.registerEmployee({ name, phone, password: pass, branchId: this.branchId });
      if (res?.EmployeeID){
        Popup.info(`เพิ่มพนักงาน ${res.EmployeeName} สำเร็จแล้ว!`);
        document.getElementById('name').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('password').value = '';
        document.getElementById('confirm').value = '';
      } else {
        Popup.error(res?.message || 'ไม่สามารถเพิ่มพนักงานได้');
      }
    } catch (e) {
      Popup.error(e.message || 'เกิดข้อผิดพลาด');
    }
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

new AddStaffUI();
