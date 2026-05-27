import { ensureApiConnected } from './patientApi';

const getBase = async () => await ensureApiConnected();

export const reminderApi = {
  async create(appointmentId, hoursBefore = 24) {
    const base = await getBase();
    const res = await fetch(`${base}/reminders/appointment/${appointmentId}?hoursBefore=${hoursBefore}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to create reminder');
    return res.json();
  },

  async getByAppointment(appointmentId) {
    const base = await getBase();
    const res = await fetch(`${base}/reminders/appointment/${appointmentId}`);
    if (!res.ok) throw new Error('Failed to fetch reminders');
    return res.json();
  },
};
