import { authFetch } from './client';
import { getApiBase } from './apiBase';

export const billingApi = {
  async create(request) {
    const base = getApiBase();
    const res = await authFetch(`${base}/billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      let msg = 'Failed to create bill';
      try { const err = await res.json(); msg = err.error || err.errors?.join(', ') || msg; } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async getAll() {
    const base = getApiBase();
    const res = await authFetch(`${base}/billing`);
    if (!res.ok) throw new Error('Failed to fetch bills');
    return res.json();
  },

  async getById(id) {
    const base = getApiBase();
    const res = await authFetch(`${base}/billing/${id}`);
    if (!res.ok) throw new Error('Bill not found');
    return res.json();
  },

  async getSummary() {
    const base = getApiBase();
    const res = await authFetch(`${base}/billing/summary`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },
};
