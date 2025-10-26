import { Popup } from './modules/Popup.js';
import { ApiClient } from './modules/apiClient.js';

class LoginUI {
  constructor(){
    const btn = document.querySelector('#btnLogin');
    btn.onclick = () => this.login();

    // กด Enter แล้ว login
    ['role','phone','password'].forEach(id=>{
      const el = document.querySelector('#'+id);
      el.addEventListener('keydown', (e)=>{
        if (e.key === 'Enter') this.login();
      });
    });
  }

  async login(){
    const btn = document.querySelector('#btnLogin');
    const role = document.querySelector('#role').value;
    const phone = document.querySelector('#phone').value.trim();
    const password = document.querySelector('#password').value;

    if (!role || !phone || !password) {
      return Popup.error('กรุณากรอกข้อมูลให้ครบ');
    }

    if (!/^\d+$/.test(phone)) {
      return Popup.error('เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น');
    }

    try {
      btn.disabled = true;

      const res = await ApiClient.login({ role, phone, password });

      if (res.message && res.message.toLowerCase().includes('invalid')) {
        return Popup.error('เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง');
      }
      if (res.message && res.message.toLowerCase().includes('required')) {
        return Popup.error('ข้อมูลไม่ครบ');
      }
      if (res.message && res.message.toLowerCase().includes('not')) {
        return Popup.error('ไม่พบบัญชีผู้ใช้');
      }

      if (role == 'employee' && res.employee) {
        const empId = res.employee.EmployeeID;
        const branchId = res.employee.BranchID;
        const pos = (res.employee.EmployeePosition || '').toLowerCase();
        const base = '/frontend/public/pages/';
        if (pos === 'manager') {
            window.location.href = `${base}dashboard-manager.html?employeeId=${empId}&branchId=${branchId}`;
            return;
        }

        window.location.href = `${base}dashboard-staff.html?employeeId=${empId}&branchId=${branchId}`;
        return
      }

      if (role === 'company' && res.company) {
        const companyId = res.company.CompanyID;
        const base = '/frontend/public/pages/';

        window.location.href = `${base}company-dashboard.html?companyId=${companyId}`;
        return;
      }

      Popup.error('เข้าสู่ระบบไม่สำเร็จ');

    } catch (e) {
      console.error('Login error:', e);
      Popup.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      btn.disabled = false;
    }
  }
}

new LoginUI();