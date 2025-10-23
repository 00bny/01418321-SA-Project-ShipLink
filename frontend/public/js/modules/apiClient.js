const API = 'http://localhost:5000';

async function j(res){
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

export const ApiClient = {
  // customers
  async searchCustomer(phone){
    const r = await fetch(`${API}/api/customers/search?phone=${encodeURIComponent(phone)}`);
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

  // quotes & companies
  async getCompanies(){ const r = await fetch(`${API}/api/companies`); return j(r); },
  async getQuotes(payload){ const r = await fetch(`${API}/api/quotes`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); return j(r); },

  // orders
  async createOrderDraft(payload){
    const r = await fetch(`${API}/api/orders`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    return j(r);
  },
  async listUnpaid(employeeId){ const r = await fetch(`${API}/api/orders/unpaid?employeeId=${employeeId}`); return j(r); },
  async payAll(employeeId){ const r = await fetch(`${API}/api/checkout/pay-all`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ employeeId }) }); return j(r); }
};
