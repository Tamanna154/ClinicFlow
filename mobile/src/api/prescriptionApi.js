import { authFetch } from './client';
import { getApiBase } from './apiBase';

export const prescriptionApi = {
  async create(consultationId, data) {
    const base = getApiBase();
    const res = await authFetch(`${base}/prescriptions/consultation/${consultationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let msg = 'Failed to save prescription';
      try { const e = await res.json(); msg = e.error || msg; } catch (ex) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async getByConsultation(consultationId) {
    const base = getApiBase();
    const res = await authFetch(`${base}/prescriptions/consultation/${consultationId}`);
    if (!res.ok) throw new Error('Failed to fetch prescription');
    return res.json();
  },

  async getById(id) {
    const base = getApiBase();
    const res = await authFetch(`${base}/prescriptions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch prescription');
    return res.json();
  },

  async getByPatient(patientId) {
    const base = getApiBase();
    const res = await authFetch(`${base}/prescriptions/patient/${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch prescriptions');
    return res.json();
  },
};
