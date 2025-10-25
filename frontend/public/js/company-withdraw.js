// frontend/public/js/company-withdraw.js
import { ApiCompanyWallet } from "./modules/apiClient.js";

const COMPANY_ID =
  Number(new URLSearchParams(location.search).get("companyId")) || 1;

document.addEventListener("DOMContentLoaded", () => {
  // elements
  const balEl = document.getElementById("bal");
  const amountEl = document.getElementById("amount");
  const quickBtns = document.querySelectorAll(".quick");
  const btnConfirm = document.getElementById("btnConfirm");

  if (!balEl || !amountEl || !btnConfirm) {
    console.error("❌ company-withdraw: missing elements");
    return;
  }

  // โหลดยอดคงเหลือ
  async function loadBalance() {
    try {
      const res = await ApiCompanyWallet.getBalance(COMPANY_ID);
      balEl.textContent = `฿${Number(res.balance ?? 0).toFixed(2)}`;
      // อัปเดต badge มุมขวาบนถ้ามี
      const badge = document.getElementById("walletBalance");
      if (badge) badge.textContent = `฿${Number(res.balance ?? 0).toFixed(2)}`;
    } catch (e) {
      console.error("โหลดยอดเงินไม่สำเร็จ", e);
    }
  }

  // จำกัด input ให้เป็นตัวเลขทศนิยมเท่านั้น
  amountEl.addEventListener("input", () => {
    const cleaned = amountEl.value.replace(/[^\d.]/g, "");
    // กันจุดหลายตัว
    const parts = cleaned.split(".");
    amountEl.value =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
  });

  // ปุ่มเลือกจำนวนเร็ว
  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.textContent.replace(/[^\d.]/g, "");
      amountEl.value = v;
      amountEl.focus();
    });
  });

  // กด "ยืนยันการถอนเงิน"
  btnConfirm.addEventListener("click", async () => {
    const amount = Number(amountEl.value);
    if (!amount || amount <= 0) {
      alert("⚠️ กรุณากรอกจำนวนเงินให้ถูกต้อง");
      return;
    }

    btnConfirm.disabled = true;
    btnConfirm.classList.add("opacity-60", "cursor-not-allowed");

    try {
      const res = await ApiCompanyWallet.withdraw(COMPANY_ID, amount);

      if (res?.message) alert(`✅ ${res.message}`);
      amountEl.value = "";
      await loadBalance();
    } catch (err) {
      // รองรับทั้งข้อความจาก backend และ generic error
      const msg =
        err?.message ||
        err?.error ||
        (typeof err === "string" ? err : "ถอนเงินไม่สำเร็จ");
      alert("❌ " + msg);
    } finally {
      btnConfirm.disabled = false;
      btnConfirm.classList.remove("opacity-60", "cursor-not-allowed");
    }
  });

  // เริ่มต้น
  loadBalance();
});
