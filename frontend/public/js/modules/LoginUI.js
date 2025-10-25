import { Popup } from './Popup.js';
import { ApiClient } from './apiClient.js';

export default class LoginUI {
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

    // --- Rule 1: ต้องกรอกให้ครบ ---
    if (!role || !phone || !password) {
      return Popup.error('กรุณากรอกข้อมูลให้ครบ');
    }

    // --- Rule 2: เบอร์โทรศัพท์ต้องเป็นตัวเลข ---
    if (!/^\d+$/.test(phone)) {
      return Popup.error('เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น');
    }

    try {
      btn.disabled = true;

      const res = await ApiClient.login({ role, phone, password });

      // จัดการข้อความผิดพลาดจากสถานะ HTTP
      if (!res.ok) {
        if (res.status === 404) {
          return Popup.error('ไม่พบบัญชีผู้ใช้');
        }
        if (res.status === 401) {
          return Popup.error('เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง');
        }
        return Popup.error(res.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      if (res.redirect) {
        window.location.href = res.redirect;  // ไปหน้า create-order ตามที่กำหนด
      } else {
        Popup.error('เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (e){
      Popup.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      btn.disabled = false;
    }
  }
}
