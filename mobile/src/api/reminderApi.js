import { ensureApiConnected } from './patientApi';
import { authFetch } from './client';

const getBase = async () => await ensureApiConnected();

export const reminderApi = {
  async create(appointmentId, hoursBefore = 24) {
    const base = await getBase();
    const res = await authFetch(`${base}/reminders/appointment/${appointmentId}?hoursBefore=${hoursBefore}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to create reminder');
    return res.json();
  },

  async getByAppointment(appointmentId) {
    const base = await getBase();
    const res = await authFetch(`${base}/reminders/appointment/${appointmentId}`);
    if (!res.ok) throw new Error('Failed to fetch reminders');
    return res.json();
  },
};
