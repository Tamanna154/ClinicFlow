import { authFetch } from './client';
import { getApiBase } from './apiBase';

export const patientHealthLogApi = {
  async getHealthLogs(patientId) {
    const base = getApiBase();
    const res = await authFetch(`${base}/patients/${patientId}/health-logs`);
    if (!res.ok) throw new Error('Failed to fetch health logs');
    return res.json();
  },

  async addHealthLog(patientId, logEntry) {
    const base = getApiBase();
    const res = await authFetch(`${base}/patients/${patientId}/health-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
    });
    if (!res.ok) throw new Error('Failed to add health log');
    return res.json();
  },

  async deleteHealthLog(patientId, logId) {
    const base = getApiBase();
    const res = await authFetch(`${base}/patients/${patientId}/health-logs/${logId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete health log');
  },
};
