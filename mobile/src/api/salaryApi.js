import { ensureApiConnected } from './patientApi';
import { authFetch } from './client';

const getApiBase = async () => {
  const apiBase = await ensureApiConnected();
  return apiBase;
};

export const salaryApi = {
  async paySalary(payment) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/salary/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });
    if (!res.ok) {
      let msg = 'Failed to process salary payment';
      try { const err = await res.json(); msg = err.error || msg; } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async getAllPayments() {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/salary`);
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  },

  async getStaffPayments(staffId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/salary/staff/${staffId}`);
    if (!res.ok) throw new Error('Failed to fetch staff payments');
    return res.json();
  },
};
