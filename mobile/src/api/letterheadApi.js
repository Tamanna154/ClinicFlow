import { authFetch } from './client';
import { getApiBase } from './apiBase';

function requireDoctorId(id) {
  if (!id) throw new Error('Doctor ID is missing. Please log in with a valid doctor account.');
}

export const letterheadApi = {
  async get(doctorId) {
    requireDoctorId(doctorId);
    const base = getApiBase();
    const res = await authFetch(`${base}/doctors/${doctorId}/letterhead`);
    if (!res.ok) throw new Error('Failed to fetch letterhead');
    return res.json();
  },

  async save(doctorId, data) {
    requireDoctorId(doctorId);
    const base = getApiBase();
    const res = await authFetch(`${base}/doctors/${doctorId}/letterhead`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let msg = 'Failed to save letterhead';
      try { const e = await res.json(); msg = e.error || msg; } catch (ex) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async uploadImage(doctorId, field, uri) {
    requireDoctorId(doctorId);
    const base = getApiBase();
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: `${field}.jpg` });
    const res = await authFetch(`${base}/doctors/${doctorId}/letterhead/upload/${field}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let msg = 'Failed to upload image';
      try { const e = await res.json(); msg = e.error || msg; } catch (ex) {}
      throw new Error(msg);
    }
    return res.json();
  },
};
