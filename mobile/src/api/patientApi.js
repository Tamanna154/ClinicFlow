import { authFetch } from './client';
import { getApiBase as getSimpleBase } from './apiBase';

// Fast — returns localhost:8080/api immediately, no probing
export const ensureApiConnected = async () => {
  return getSimpleBase();
};

const getApiBase = async () => {
  return getSimpleBase();
};

export const patientApi = {
  async getAll(archived) {
    const apiBase = await getApiBase();
    const params = archived ? `?archived=${archived}` : '';
    const res = await authFetch(`${apiBase}/patients${params}`);
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  async getById(id) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/patients/${id}`);
    if (!res.ok) throw new Error('Patient not found');
    return res.json();
  },

  async create(patient) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (!res.ok) {
      let errMsg = 'Failed to create patient';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.message || errMsg;
      } catch (e) {
        // Fallback if response isn't JSON
      }
      throw new Error(errMsg);
    }
    return res.json();
  },

  async update(id, patient) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (!res.ok) {
      let errMsg = 'Failed to update patient';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.message || errMsg;
      } catch (e) {
        // Fallback if response isn't JSON
      }
      throw new Error(errMsg);
    }
    return res.json();
  },

  async delete(id) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/patients/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete patient');
  },

  async getVisits(patientId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/patients/${patientId}/visits`);
    if (!res.ok) throw new Error('Failed to fetch visits');
    return res.json();
  },

  async archive(id) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/patients/${id}/archive`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to archive patient');
    return res.json();
  },

  async restore(id) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/patients/${id}/restore`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to restore patient');
    return res.json();
  },
};

export const getActiveApiBase = () => activeApiBase;

