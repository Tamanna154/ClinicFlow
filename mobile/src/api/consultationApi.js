import { authFetch } from './client';
import { getApiBase } from './apiBase';

export const consultationApi = {
  async startConsultation(appointmentId) {
    const base = getApiBase();
    const res = await authFetch(`${base}/consultations/appointment/${appointmentId}/start`, { method: 'POST' });
    if (!res.ok) { let msg = 'Failed to start consultation'; try { const e = await res.json(); msg = e.error || msg; } catch (ex) {} throw new Error(msg); }
    return res.json();
  },

  async updateConsultation(id, data) {
    const base = getApiBase();
    const res = await authFetch(`${base}/consultations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { let msg = 'Failed to update consultation'; try { const e = await res.json(); msg = e.error || msg; } catch (ex) {} throw new Error(msg); }
    return res.json();
  },

  async completeConsultation(id) {
    const base = getApiBase();
    const res = await authFetch(`${base}/consultations/${id}/complete`, { method: 'POST' });
    if (!res.ok) { let msg = 'Failed to complete consultation'; try { const e = await res.json(); msg = e.error || msg; } catch (ex) {} throw new Error(msg); }
    return res.json();
  },

  async getById(id) {
    const base = getApiBase();
    const res = await authFetch(`${base}/consultations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch consultation');
    return res.json();
  },

  async getByAppointment(appointmentId) {
    const base = getApiBase();
    const res = await authFetch(`${base}/consultations/by-appointment/${appointmentId}`);
    if (!res.ok) throw new Error('Failed to fetch consultation');
    return res.json();
  },

  async getPatientHistory(patientId) {
    const base = getApiBase();
    const res = await authFetch(`${base}/consultations/patient/${patientId}/history`);
    if (!res.ok) throw new Error('Failed to fetch consultation history');
    return res.json();
  },

  async generateBill(consultationId, data) {
    const base = getApiBase();
    const res = await authFetch(`${base}/consultations/${consultationId}/bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { let msg = 'Failed to generate bill'; try { const e = await res.json(); msg = e.error || msg; } catch (ex) {} throw new Error(msg); }
    return res.json();
  },

  async recordPayment(consultationId, data) {
    const base = getApiBase();
    const res = await authFetch(`${base}/consultations/${consultationId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { let msg = 'Failed to record payment'; try { const e = await res.json(); msg = e.error || msg; } catch (ex) {} throw new Error(msg); }
    return res.json();
  },

  async getBill(consultationId) {
    const base = getApiBase();
    const res = await authFetch(`${base}/consultations/${consultationId}/bill`);
    if (!res.ok) throw new Error('Failed to fetch bill');
    return res.json();
  },

  async getDoctorDashboard() {
    const base = getApiBase();
    const res = await authFetch(`${base}/consultations/dashboard/doctor`);
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return res.json();
  },
};
