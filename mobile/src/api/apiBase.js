import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const STORAGE_KEY = 'clinic_api_base_v8';

const PROBE_TIMEOUT = 2000;
const QUICK_PROBE_TIMEOUT = 5000;

const PRIORITY_IPS = [
  '127.0.0.1',
  '10.0.2.2',
  'localhost',
  '10.151.137.83',
  '10.151.137.1',
];

const HOSTS = [100, 101, 102, 103, 104, 105, 1, 200, 250];

const SUBNETS = [
  '192.168.1', '192.168.0', '192.168.29', '192.168.100', '192.168.137',
  '10.0.2', '10.0.0', '10.151.137',
  '172.16.0',
];

function getHostIp() {
  try {
    const hostUri = Constants.expoConfig?.hostUri || 
                    Constants.manifest?.debuggerHost || 
                    Constants.manifest2?.extra?.expoGo?.debuggerHost || 
                    '';
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        return ip;
      }
    }
  } catch (e) {
    console.warn('Error detecting Expo host IP:', e);
  }
  return null;
}

function buildScanUrls() {
  const seen = new Set();
  const urls = [];
  const add = (ip) => {
    if (!seen.has(ip)) { seen.add(ip); urls.push(`http://${ip}:8080/api`); }
  };
  
  // 1. Dynamic host IP from Metro (highest priority for physical devices)
  const hostIp = getHostIp();
  if (hostIp) {
    add(hostIp);
  }

  // 2. Platform-specific emulator defaults (high priority)
  if (Platform.OS === 'android') {
    add('10.0.2.2');
  } else {
    add('127.0.0.1');
    add('localhost');
  }

  // 3. Other known priority IPs
  PRIORITY_IPS.forEach(add);

  // 4. Subnet scans
  for (const subnet of SUBNETS) {
    for (const host of HOSTS) {
      add(`${subnet}.${host}`);
    }
  }
  return urls;
}

function sanitizeUrl(url) {
  if (!url) return url;
  let clean = url.trim();
  if (!/^https?:\/\//i.test(clean)) {
    clean = 'http://' + clean;
  }
  clean = clean.replace(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d+)/, '$1:$2');
  clean = clean.replace(/(localhost)\.(\d+)/i, '$1:$2');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

function isLoopback(url) {
  if (!url) return false;
  return /127\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url) || url.includes('localhost');
}

let cachedBase = null;
let scanPromise = null;

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
    return r.status === 401 || (r.status >= 200 && r.status < 300);
  } catch {
    return false;
  }
}

async function scanUrls(urls) {
  if (urls.length === 0) return null;
  const CONCURRENCY = 20;
  return new Promise((resolve) => {
    let idx = 0;
    let active = 0;
    let done = false;
    let settled = 0;

    function tryNext() {
      if (done || settled === urls.length) return;
      while (active < CONCURRENCY && idx < urls.length) {
        const url = urls[idx++];
        active++;
        probe(url).then((ok) => {
          active--;
          settled++;
          if (done) return;
          if (ok) { done = true; resolve(url); return; }
          if (settled === urls.length) { resolve(null); return; }
          tryNext();
        });
      }
      if (active === 0 && settled === urls.length) {
        resolve(null);
      }
    }
    tryNext();
  });
}

async function scanAndSaveFallbacks() {
  if (scanPromise) return scanPromise;
  scanPromise = (async () => {
    try {
      const urls = buildScanUrls();
      const found = await scanUrls(urls);
      cachedBase = found || urls[0];
      await AsyncStorage.setItem(STORAGE_KEY, cachedBase).catch(() => {});
    } finally {
      scanPromise = null;
    }
  })();
  return scanPromise;
}

export async function initializeApiBase(forceFullScan = false) {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const clean = sanitizeUrl(stored);
      // Probe the cached URL first to avoid scanning if it is already reachable
      const ok = await probe(clean);
      if (ok) {
        cachedBase = clean;
        return;
      }
    }
  } catch (_) {}

  if (forceFullScan) {
    await scanAndSaveFallbacks();
    return;
  }

  // Fast startup path (probe only the most likely default/host URLs in parallel)
  try {
    const hostIp = getHostIp();
    const defaults = [];
    if (hostIp) defaults.push(`http://${hostIp}:8080/api`);
    if (Platform.OS === 'android') {
      defaults.push('http://10.0.2.2:8080/api');
      defaults.push('http://127.0.0.1:8080/api');
      defaults.push('http://localhost:8080/api');
    } else {
      defaults.push('http://127.0.0.1:8080/api');
      defaults.push('http://localhost:8080/api');
      defaults.push('http://10.0.2.2:8080/api');
    }
    
    // Probe these defaults in parallel
    const results = await Promise.all(
      defaults.map(async (url) => {
        const ok = await probe(url);
        return ok ? url : null;
      })
    );
    const working = results.find((r) => r !== null);
    if (working) {
      cachedBase = working;
      await AsyncStorage.setItem(STORAGE_KEY, cachedBase).catch(() => {});
      return;
    }
  } catch (_) {}

  // If everything fails, set the fallback to the first fallback URL immediately without scanning
  const fallback = getHostIp() 
    ? `http://${getHostIp()}:8080/api` 
    : (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://127.0.0.1:8080/api');
  cachedBase = fallback;
}

export function getApiBase() {
  if (cachedBase) return cachedBase;
  cachedBase = buildScanUrls()[0];
  return cachedBase;
}

export async function setApiBase(url) {
  const clean = sanitizeUrl(url);
  cachedBase = clean;
  await AsyncStorage.setItem(STORAGE_KEY, clean).catch(() => {});
}

export async function resetApiBase() {
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  cachedBase = null;
}

export function getDefaultApiBase() {
  return buildScanUrls()[0];
}

export async function verifyBackend(url = null) {
  const target = sanitizeUrl(url || cachedBase || buildScanUrls()[0]);
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), PROBE_TIMEOUT);
    const r = await fetch(`${target}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'probe', password: 'probe' }),
      signal: c.signal,
    });
    clearTimeout(t);
    return { ok: r.status === 401 || (r.status >= 200 && r.status < 300), status: r.status, url: target };
  } catch (e) {
    return { ok: false, status: 0, url: target, error: e.message };
  }
}

export async function quickProbe(url) {
  const clean = sanitizeUrl(url);
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), QUICK_PROBE_TIMEOUT);
    const r = await fetch(`${clean}/auth/login`, {
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
