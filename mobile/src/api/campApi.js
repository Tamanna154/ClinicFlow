import { authFetch } from './client';
import { getApiBase } from './apiBase';

export const campApi = {
  async getCamps() {
    const base = getApiBase();
    const res = await authFetch(`${base}/camps`);
    if (!res.ok) throw new Error('Failed to fetch camps');
    return res.json();
  },

  async createCamp(camp) {
    const base = getApiBase();
    const res = await authFetch(`${base}/camps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(camp),
    });
    if (!res.ok) throw new Error('Failed to create health camp');
    return res.json();
  },
};
