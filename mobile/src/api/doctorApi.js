import { ensureApiConnected } from './patientApi';
import { authFetch } from './client';

const getApiBase = async () => {
  const apiBase = await ensureApiConnected();
  return apiBase;
};

export const doctorApi = {
  async getAll() {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/doctors`);
    if (!res.ok) throw new Error('Failed to fetch doctors');
    return res.json();
  },

  async getActive() {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/doctors/active`);
    if (!res.ok) throw new Error('Failed to fetch active doctors');
    return res.json();
  },

  async getById(id) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/doctors/${id}`);
    if (!res.ok) throw new Error('Doctor not found');
    return res.json();
  },

  async create(doctor) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctor),
    });
    if (!res.ok) {
      let errMsg = 'Failed to create doctor';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async update(id, doctor) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctor),
    });
    if (!res.ok) {
      let errMsg = 'Failed to update doctor';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async delete(id) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/doctors/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete doctor');
  },

  async search(query) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/doctors/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getAvailability(doctorId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/doctors/${doctorId}/availability`);
    if (!res.ok) throw new Error('Failed to fetch availability');
    return res.json();
  },

  async createAvailability(availability) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/doctors/${availability.doctorId}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(availability),
    });
    if (!res.ok) {
      let errMsg = 'Failed to save availability';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async deleteAvailability(doctorId, availabilityId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/doctors/${doctorId}/availability/${availabilityId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete availability');
  },
};
