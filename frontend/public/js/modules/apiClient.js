const API = 'http://localhost:5001';

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
  }
};
