import { authFetch } from './client';
import { getApiBase } from './apiBase';

export const patientMedicationApi = {
  async getMealTimings() {
    const base = getApiBase();
    const res = await authFetch(`${base}/patient-medications/timings`);
    if (!res.ok) throw new Error('Failed to fetch meal timings');
    return res.json();
  },

  async saveMealTimings(timings) {
    const base = getApiBase();
    const res = await authFetch(`${base}/patient-medications/timings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timings),
    });
    if (!res.ok) throw new Error('Failed to save meal timings');
    return res.json();
  },

  async getMedications() {
    const base = getApiBase();
    const res = await authFetch(`${base}/patient-medications`);
    if (!res.ok) throw new Error('Failed to fetch medications');
    return res.json();
  },

  async addMedication(medication) {
    const base = getApiBase();
    const res = await authFetch(`${base}/patient-medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medication),
    });
    if (!res.ok) throw new Error('Failed to add medication');
    return res.json();
  },

  async confirmIntake(medicationId) {
    const base = getApiBase();
    const res = await authFetch(`${base}/patient-medications/${medicationId}/confirm`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to confirm intake');
    return res.json();
  },

  async addStock(medicationId, amount) {
    const base = getApiBase();
    const res = await authFetch(`${base}/patient-medications/${medicationId}/add-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to add stock');
    return res.json();
  },

  async deleteMedication(medicationId) {
    const base = getApiBase();
    const res = await authFetch(`${base}/patient-medications/${medicationId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete medication');
  },
};
