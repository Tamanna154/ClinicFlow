import { authFetch } from './client';
import { getApiBase } from './apiBase';

export const inventoryApi = {
  async getAll(stockType, archived) {
    const base = getApiBase();
    const params = new URLSearchParams();
    if (stockType) params.set('stockType', stockType);
    if (archived) params.set('archived', 'true');
    const qs = params.toString();
    const res = await authFetch(`${base}/inventory${qs ? '?' + qs : ''}`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async getById(id) {
    const base = getApiBase();
    const res = await authFetch(`${base}/inventory/${id}`);
    if (!res.ok) throw new Error('Item not found');
    return res.json();
  },

  async create(item) {
    const base = getApiBase();
    const res = await authFetch(`${base}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      let msg = 'Failed to create item';
      try { const err = await res.json(); msg = err.errors?.join(', ') || err.error || msg; } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async update(id, item) {
    const base = getApiBase();
    const res = await authFetch(`${base}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      let msg = 'Failed to update item';
      try { const err = await res.json(); msg = err.errors?.join(', ') || err.error || msg; } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async adjustStock(id, request) {
    const base = getApiBase();
    const res = await authFetch(`${base}/inventory/${id}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      let msg = 'Stock adjustment failed';
      try { const err = await res.json(); msg = err.error || msg; } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async archive(id) {
    const base = getApiBase();
    const res = await authFetch(`${base}/inventory/${id}/archive`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to archive item');
    return res.json();
  },

  async restore(id) {
    const base = getApiBase();
    const res = await authFetch(`${base}/inventory/${id}/restore`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to restore item');
    return res.json();
  },

  async getLowStock() {
    const base = getApiBase();
    const res = await authFetch(`${base}/inventory/low-stock`);
    if (!res.ok) throw new Error('Failed to fetch low stock');
    return res.json();
  },

  async getExpiryAlerts() {
    const base = getApiBase();
    const res = await authFetch(`${base}/inventory/expiry-alerts`);
    if (!res.ok) throw new Error('Failed to fetch expiry alerts');
    return res.json();
  },

  async search(query) {
    const base = getApiBase();
    const res = await authFetch(`${base}/inventory/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getTransactions(itemId) {
    const base = getApiBase();
    const params = itemId ? `?itemId=${itemId}` : '';
    const res = await authFetch(`${base}/inventory/transactions${params}`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async getAnalytics() {
    const base = getApiBase();
    const res = await authFetch(`${base}/inventory/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },
};
