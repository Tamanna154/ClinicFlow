import { ensureApiConnected } from './patientApi';
import { authFetch } from './client';

const getApiBase = async () => {
  const apiBase = await ensureApiConnected();
  return apiBase;
};

export const clinicApi = {
  async getAll() {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/clinics`);
    if (!res.ok) throw new Error('Failed to fetch clinics');
    return res.json();
  },

  async getById(id) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/clinics/${id}`);
    if (!res.ok) throw new Error('Clinic not found');
    return res.json();
  },

  async create(clinic) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/clinics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clinic),
    });
    if (!res.ok) {
      let errMsg = 'Failed to create clinic';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.error || err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async update(id, clinic) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/clinics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clinic),
    });
    if (!res.ok) {
      let errMsg = 'Failed to update clinic';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.error || err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async delete(id) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/clinics/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete clinic');
  },

  async search(query) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/clinics/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getMyClinic() {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/clinics`);
    if (!res.ok) throw new Error('Failed to fetch clinics');
    const clinics = await res.json();
    return clinics.length > 0 ? clinics[0] : null;
  },
};
