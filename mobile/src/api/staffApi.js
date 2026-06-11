import { ensureApiConnected } from './patientApi';
import { authFetch } from './client';

const getApiBase = async () => {
  const apiBase = await ensureApiConnected();
  return apiBase;
};

export const staffApi = {
  async getMyStaff() {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/staff`);
    if (!res.ok) throw new Error('Failed to fetch staff');
    return res.json();
  },

  async createWithDetails(details) {
    const apiBase = await ensureApiConnected();
    const res = await authFetch(`${apiBase}/staff/create-with-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (!res.ok) {
      let msg = 'Failed to create staff';
      try { const err = await res.json(); msg = err.error || msg; } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async addStaff(staffUserId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffUserId }),
    });
    if (!res.ok) {
      let errMsg = 'Failed to add staff';
      try { const err = await res.json(); errMsg = err.error || errMsg; } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async removeStaff(staffId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/staff/${staffId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove staff');
  },

  async update(staffId, details) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/staff/${staffId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (!res.ok) {
      let msg = 'Failed to update staff';
      try { const err = await res.json(); msg = err.error || msg; } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async getPermissions(staffId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/staff/${staffId}/permissions`);
    if (!res.ok) throw new Error('Failed to fetch permissions');
    return res.json();
  },

  async updatePermissions(staffId, permissions) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/staff/${staffId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    });
    if (!res.ok) {
      let errMsg = 'Failed to update permissions';
      try { const err = await res.json(); errMsg = err.error || errMsg; } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getAllPermissionsList() {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/staff/permissions-list`);
    if (!res.ok) throw new Error('Failed to fetch permissions list');
    return res.json();
  },

  async getMyPermissions() {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/auth/me/permissions`);
    if (!res.ok) throw new Error('Failed to fetch permissions');
    return res.json();
  },
};
