const API = 'http://localhost:5002';

async function j(res){
 const txt = await res.text();
  try { return JSON.parse(txt); } catch { return []; }
}

export const ApiClient = {
  // --- customers ---
  async searchCustomer(phone){
    const r = await fetch(`${API}/api/customers/search?phone=${encodeURIComponent(phone)}`);
    if (r.status === 404) return null; return j(r);
  },
  async getCustomerById(id){
    const r = await fetch(`${API}/api/customers/${id}`);
    if (r.status === 404) return null; return j(r);
  },
  async createCustomer({name, phone, address}){
    const r = await fetch(`${API}/api/customers`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, phone, address}) });
    return j(r);
  },
  async updateCustomer(phone, {name, address}){
    const r = await fetch(`${API}/api/customers/${encodeURIComponent(phone)}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, address}) });
    return j(r);
  },
  // --- quotes ---
  async getCompanies(){ const r = await fetch(`${API}/api/companies`); return j(r); },
  async getQuotes(payload){
    const r = await fetch(`${API}/api/quotes`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    return j(r);
  },
  // --- orders ---
  async createOrderDraft(payload){
    const r = await fetch(`${API}/api/orders`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    return j(r);
  },
  async getOrder(orderId){
    const r = await fetch(`${API}/api/orders/${orderId}`);
    return j(r);
  },
  async updateOrder(orderId, payload){
    const r = await fetch(`${API}/api/orders/${orderId}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    return j(r);
  },
  async deleteOrder(orderId){
    const r = await fetch(`${API}/api/orders/${orderId}`, { method:'DELETE' });
    return j(r);
  },
  async listUnpaid(branchId){
    const r = await fetch(`${API}/api/orders/unpaid?branchId=${encodeURIComponent(branchId)}`);
    return j(r);
  },
  // --- checkout ---
  async payAll(employeeId){
    const r = await fetch(`${API}/api/checkout/pay-all`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ employeeId })
    });
    return j(r);
  },
  // --- auth ---
  async registerEmployee({ name, phone, password, position, branchId }) {
    const r = await fetch(`${API}/api/auth/register/employee`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, phone, password, position, branchId })
    });
    return j(r);
  },
  async registerCompany({ name, phone, password, shippingRate, sharePercent, walletId }) {
    const r = await fetch(`${API}/api/auth/register/company`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, phone, password, shippingRate, sharePercent, walletId })
    });
    return j(r);
  },
  async login({ role, phone, password }) {
    const r = await fetch(`${API}/api/auth/login`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ role, phone, password })
    });
    return j(r);
  },

  async createPickupRequest(companyId, employeeId) {
    const r = await fetch(`${API}/api/pickup/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, employeeId }),
    });
    if (!r.ok) throw new Error('Failed to create pickup request');
    return r.json();
  },


  async getPickupHistory(branchId) {
    const r = await fetch(`${API}/api/pickup/history?branchId=${branchId}`);
    if (!r.ok) throw new Error('Failed to fetch pickup history');
    return r.json();
  },



  // --- branch wallet ---
  async getBranchBalance(branchId){
    const r = await fetch(`${API}/api/branch-wallet/balance?branchId=${encodeURIComponent(branchId)}`);
    return j(r);
  },
  async topupBranch({ branchId, amount, employeeId }){
    const r = await fetch(`${API}/api/branch-wallet/topup`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ branchId, amount, employeeId })
    });
    return j(r);
  },

  async withdrawBranch({ branchId, amount, employeeId }){
    const r = await fetch(`${API}/api/branch-wallet/withdraw`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ branchId, amount, employeeId })
    });
    return j(r);
  },

  async getBranchTransactions(branchId) {
    const r = await fetch(`${API}/api/branch-wallet/transactions?branchId=${encodeURIComponent(branchId)}`);
    return j(r);
  },

  // ดึงรายการคำขอเข้ารับพัสดุของบริษัท
  async getCompanyPickups(companyId) {
    const res = await fetch(`${API}/api/pickup/company/${companyId}`);
    if (!res.ok) throw new Error('Failed to load pickup requests');
    return await res.json();
  },

  // ยืนยันคำเรียกเข้ารับพัสดุ
  async confirmPickup({ requestId, time, name, phone }) {
    const res = await fetch(`${API}/api/pickup/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, time, name, phone })
    });
    if (!res.ok) throw new Error('Failed to confirm pickup');
    return await res.json();
  },

};

// ✅ Company Wallet API
export const ApiCompanyWallet = {
  async getBalance(companyId) {
    const res = await fetch(`${API}/api/company-wallet/${companyId}`);
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async withdraw(companyId, amount) {
    const res = await fetch(`${API}/api/company-wallet/${companyId}/withdraw`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async getHistory(companyId) {
    const res = await fetch(`${API}/api/company-wallet/${companyId}/history`);
    if (!res.ok) throw await res.json();
    return res.json();
  }
};

