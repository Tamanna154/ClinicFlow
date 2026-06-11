import { authFetch } from './client';

const getApiBase = async () => {
  const { getApiBase } = await import('./apiBase');
  return getApiBase();
};

export const compensationApi = {
  async getDoctorCompensation(doctorId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/compensation/doctors/${doctorId}`);
    if (!res.ok) throw new Error('Failed to fetch compensation');
    return res.json();
  },

  async saveDoctorCompensation(doctorId, data) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/compensation/doctors/${doctorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to save compensation');
    }
    return res.json();
  },

  async getDoctorEarnings(doctorId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/compensation/doctors/${doctorId}/earnings`);
    if (!res.ok) throw new Error('Failed to fetch earnings');
    return res.json();
  },

  async getDoctorPayouts(doctorId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/compensation/doctors/${doctorId}/payouts`);
    if (!res.ok) throw new Error('Failed to fetch payouts');
    return res.json();
  },

  async getStaffCompensation(staffId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/compensation/staff/${staffId}`);
    if (!res.ok) throw new Error('Failed to fetch staff compensation');
    return res.json();
  },

  async saveStaffCompensation(staffId, data) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/compensation/staff/${staffId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to save staff compensation');
    }
    return res.json();
  },
};
