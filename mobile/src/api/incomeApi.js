import { authFetch } from './client';
import { getApiBase } from './apiBase';

export const incomeApi = {
  async getAll() {
    const base = getApiBase();
    const res = await authFetch(`${base}/income`);
    if (!res.ok) throw new Error('Failed to fetch income');
    return res.json();
  },

  async getSummary() {
    const base = getApiBase();
    const res = await authFetch(`${base}/income/summary`);
    if (!res.ok) throw new Error('Failed to fetch income summary');
    return res.json();
  },
};
