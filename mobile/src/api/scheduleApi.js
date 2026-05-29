import { ensureApiConnected } from './patientApi';
import { authFetch } from './client';

const getBase = async () => await ensureApiConnected();

export const scheduleApi = {
  async get(doctorId, date, view = 'daily') {
    const base = await getBase();
    const res = await authFetch(`${base}/schedule?doctorId=${doctorId}&date=${date}&view=${view}`);
    if (!res.ok) throw new Error('Failed to fetch schedule');
    return res.json();
  },

  async suggestSlot(doctorId, date, startTime, endTime) {
    const base = await getBase();
    const res = await authFetch(`${base}/schedule/suggest?doctorId=${doctorId}&date=${date}&startTime=${startTime}&endTime=${endTime}`);
    if (!res.ok) throw new Error('Failed to get suggestions');
    return res.json();
  },
};
