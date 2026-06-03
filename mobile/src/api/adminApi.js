import { authFetch } from './client';
import { getApiBase } from './apiBase';

export const adminApi = {
  async getDashboard() {
    const base = getApiBase();
    const res = await authFetch(`${base}/admin/dashboard`);
    if (!res.ok) throw new Error('Failed to load admin dashboard');
    return res.json();
  },

  async getTodayAppointments() {
    const base = getApiBase();
    const res = await authFetch(`${base}/admin/appointments/today`);
    if (!res.ok) throw new Error('Failed to load today appointments');
    return res.json();
  },

  async getRecentPatients(limit = 10) {
    const base = getApiBase();
    const res = await authFetch(`${base}/admin/patients/recent?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load recent patients');
    return res.json();
  },

  async getRevenueTrend(months = 6) {
    const base = getApiBase();
    const res = await authFetch(`${base}/admin/revenue/trend?months=${months}`);
    if (!res.ok) throw new Error('Failed to load revenue trend');
    return res.json();
  },
};
