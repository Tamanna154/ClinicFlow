import { authFetch } from './client';
import { getApiBase } from './apiBase';

export const expenseApi = {
  async create(request) {
    const base = getApiBase();
    const res = await authFetch(`${base}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      let msg = 'Failed to record expense';
      try { const err = await res.json(); msg = err.error || msg; } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async getAll() {
    const base = getApiBase();
    const res = await authFetch(`${base}/expenses`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async getProfitReport() {
    const base = getApiBase();
    const res = await authFetch(`${base}/expenses/profit`);
    if (!res.ok) throw new Error('Failed to fetch profit report');
    return res.json();
  },

  async uploadBill(expenseId, fileUri) {
    const base = getApiBase();
    const formData = new FormData();
    const filename = fileUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image';
    formData.append('file', { uri: fileUri, name: filename, type });

    const res = await authFetch(`${base}/expenses/${expenseId}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let msg = 'Failed to upload bill image';
      try { const err = await res.json(); msg = err.error || msg; } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },
};
