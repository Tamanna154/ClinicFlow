import { ensureApiConnected } from './patientApi';

const getBase = async () => await ensureApiConnected();

export const smsApi = {
  async sendBulk(phoneNumbers, message) {
    const base = await getBase();
    const res = await fetch(`${base}/sms/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumbers, message }),
    });
    if (!res.ok) throw new Error('Failed to send SMS');
    return res.json();
  },
};
