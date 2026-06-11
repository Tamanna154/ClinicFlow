import { ensureApiConnected } from './patientApi';
import { authFetch } from './client';

const getBase = async () => await ensureApiConnected();

export const smsApi = {
  async sendBulk(phoneNumbers, message) {
    const base = await getBase();
    const res = await authFetch(`${base}/sms/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumbers, message }),
    });
    if (!res.ok) throw new Error('Failed to send SMS');
    return res.json();
  },

  async sendWhatsApp(phoneNumbers, message) {
    const base = await getBase();
    const res = await authFetch(`${base}/sms/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumbers, message }),
    });
    if (!res.ok) throw new Error('Failed to send WhatsApp message');
    return res.json();
  },
};
