import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'clinic_api_base_v2';

const LAN_IPS = ['http://10.151.137.83:8080/api', 'http://10.227.116.83:8080/api'];

const FALLBACKS = Platform.OS === 'android'
  ? ['http://10.0.2.2:8080/api', 'http://localhost:8080/api', ...LAN_IPS]
  : ['http://localhost:8080/api', ...LAN_IPS];

const PROBE_TIMEOUT = 8000;

let cachedBase = null;

async function probe(url) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), PROBE_TIMEOUT);
    const r = await fetch(`${url}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'probe', password: 'probe' }),
      signal: c.signal,
    });
    clearTimeout(t);
    return true;
  } catch {
    return false;
  }
}

export async function initializeApiBase() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedBase = stored;
      return;
    }
  } catch (_) {}
  const results = await Promise.allSettled(FALLBACKS.map(async (u) => {
    if (await probe(u)) return u;
    throw new Error();
  }));
  for (const r of results) {
    if (r.status === 'fulfilled') { cachedBase = r.value; break; }
  }
  if (!cachedBase) cachedBase = FALLBACKS[0];
  await AsyncStorage.setItem(STORAGE_KEY, cachedBase).catch(() => {});
}

export function getApiBase() {
  if (cachedBase) return cachedBase;
  cachedBase = FALLBACKS[0];
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
  return FALLBACKS[0];
}
