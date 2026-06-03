import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'clinic_api_base_v6';

const PROBE_TIMEOUT = 1200;

const COMMON_IPS = [
  '10.0.2.2',      // Android emulator -> host loopback
  '10.151.137.83', // Current Wi-Fi IP
  '192.168.0.101', // Common home network
  '192.168.1.101', // Common home network
  '192.168.1.100', // Common home network
  'localhost',
];

function buildFallbacks() {
  return COMMON_IPS.map(ip => `http://${ip}:8080/api`);
}

let cachedBase = null;

async function probe(url) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), PROBE_TIMEOUT);
    const r = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'probe', password: 'probe' }),
      signal: c.signal,
    });
    clearTimeout(t);
    if (r.status === 401) return true;
    if (r.status >= 200 && r.status < 300) return true;
    return false;
  } catch {
    return false;
  }
}

async function scanAndSaveFallbacks() {
  const fallbacks = buildFallbacks();
  const results = await Promise.allSettled(
    fallbacks.map(async (u) => {
      if (await probe(u)) return u;
      throw new Error();
    })
  );

  let found = null;
  for (const r of results) {
    if (r.status === 'fulfilled') {
      found = r.value;
      break;
    }
  }

  cachedBase = found || fallbacks[0];
  await AsyncStorage.setItem(STORAGE_KEY, cachedBase).catch(() => {});
}

export async function initializeApiBase(forceReProbe = false) {
  if (!forceReProbe) {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        cachedBase = stored;
        probe(stored).then(async (probeOk) => {
          if (!probeOk) {
            await scanAndSaveFallbacks();
          }
        }).catch(() => {});
        return;
      }
    } catch (_) {}
  }

  await scanAndSaveFallbacks();
}

export function getApiBase() {
  if (cachedBase) return cachedBase;
  cachedBase = buildFallbacks()[0];
  return cachedBase;
}

export async function setApiBase(url) {
  cachedBase = url;
  await AsyncStorage.setItem(STORAGE_KEY, url).catch(() => {});
}

export async function resetApiBase() {
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  cachedBase = null;
}

export function getDefaultApiBase() {
  return buildFallbacks()[0];
}

export async function quickProbe(url) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), PROBE_TIMEOUT);
    const r = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'probe', password: 'probe' }),
      signal: c.signal,
    });
    clearTimeout(t);
    if (r.status === 401) return { ok: true, status: r.status };
    if (r.status >= 200 && r.status < 300) return { ok: true, status: r.status };
    return { ok: false, status: r.status, error: 'Server responded but endpoint not found' };
  } catch (e) {
    return { ok: false, status: 0, error: e.message || 'Network error' };
  }
}
