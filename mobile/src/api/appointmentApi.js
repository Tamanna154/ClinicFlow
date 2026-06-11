import { ensureApiConnected } from './patientApi';
import { authFetch } from './client';

const getApiBase = async () => {
  const apiBase = await ensureApiConnected();
  return apiBase;
};

export const appointmentApi = {
  async getAll() {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async getById(id) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments/${id}`);
    if (!res.ok) throw new Error('Appointment not found');
    return res.json();
  },

  async getByDoctor(doctorId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments/by-doctor/${doctorId}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async getByPatient(patientId) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments/by-patient/${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async getByDate(date) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments/by-date?date=${date}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async getByDoctorAndDate(doctorId, date) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments/by-doctor-date?doctorId=${doctorId}&date=${date}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async create(appointment) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    });
    if (!res.ok) {
      let errMsg = 'Failed to create appointment';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.error || err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async update(id, appointment) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    });
    if (!res.ok) {
      let errMsg = 'Failed to update appointment';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.error || err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async updateStatus(id, status) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      let errMsg = 'Failed to update status';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.error || err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async addVisitNotes(id, notes) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments/${id}/visit-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes),
    });
    if (!res.ok) throw new Error('Failed to save visit notes');
    return res.json();
  },

  async delete(id) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete appointment');
  },

  async patientBook(doctorId, date, startTime, endTime, reason, appointmentType) {
    const apiBase = await getApiBase();
    const res = await authFetch(`${apiBase}/appointments/patient-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId,
        appointmentDate: date,
        startTime,
        endTime,
        reason: reason || null,
        appointmentType: appointmentType || 'IN_PERSON',
      }),
    });
    if (!res.ok) {
      let errMsg = 'Failed to book appointment';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.error || err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  },
};
