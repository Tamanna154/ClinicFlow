import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamic API Base URL with automated network probing
let activeApiBase = 'http://10.65.55.83:8080/api'; // Smart default fallback
const PROBE_TIMEOUT = 1200; // Fast 1.2s timeout for local ping

const probeUrl = async (url) => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
    const res = await fetch(`${url}/patients`, { signal: controller.signal });
    clearTimeout(id);
    // 200 OK or other successful status means server is reachable
    return res.ok || res.status === 200;
  } catch (e) {
    return false;
  }
};

let probePromise = null;

export const ensureApiConnected = () => {
  if (probePromise) return probePromise;

  probePromise = (async () => {
    const candidates = [];

    // 1. Expo Dev Server LAN IP (Metro Bundler host)
    const hostUri = Constants?.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        candidates.push(`http://${ip}:8080/api`);
      }
    }

    // 2. Loopback, adb reverse, and emulator candidates (applicable for both Android and iOS)
    candidates.push('http://localhost:8080/api');
    candidates.push('http://127.0.0.1:8080/api');
    if (Platform.OS === 'android') {
      candidates.push('http://10.0.2.2:8080/api'); // Android Emulator Host Alias
    }

    // 3. Fallbacks
    candidates.push('http://10.65.55.83:8080/api');

    // Filter duplicates
    const uniqueCandidates = [...new Set(candidates)];
    console.log('[ClinicFlow API] Probing local network candidates:', uniqueCandidates);

    // Try each candidate in order. First one to respond becomes our base URL.
    for (const url of uniqueCandidates) {
      const works = await probeUrl(url);
      if (works) {
        console.log('[ClinicFlow API] Connected successfully to backend at:', url);
        activeApiBase = url;
        return url;
      }
    }

    console.warn('[ClinicFlow API] Probes exhausted. Falling back to default LAN IP:', activeApiBase);
    return activeApiBase;
  })();

  return probePromise;
};

// Helper to resolve the correct URL on demand
const getApiBase = async () => {
  return await ensureApiConnected();
};

export const patientApi = {
  async getAll() {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/patients`);
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  async getById(id) {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/patients/${id}`);
    if (!res.ok) throw new Error('Patient not found');
    return res.json();
  },

  async create(patient) {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (!res.ok) {
      let errMsg = 'Failed to create patient';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.message || errMsg;
      } catch (e) {
        // Fallback if response isn't JSON
      }
      throw new Error(errMsg);
    }
    return res.json();
  },

  async update(id, patient) {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (!res.ok) {
      let errMsg = 'Failed to update patient';
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        errMsg = err.errors?.join(', ') || err.message || errMsg;
      } catch (e) {
        // Fallback if response isn't JSON
      }
      throw new Error(errMsg);
    }
    return res.json();
  },

  async delete(id) {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/patients/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete patient');
  },
};

