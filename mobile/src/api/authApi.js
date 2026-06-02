import { getApiBase } from './apiBase';

const getBase = () => getApiBase();

const TIMEOUT_MS = 30000;

const fetchWithTimeout = (url, options) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId),
  );
};

const handleResponse = async (res, defaultMsg) => {
  if (!res.ok) {
    const serverMsg = defaultMsg;
    try {
      const err = await res.json();
      throw new Error(`${err.error || serverMsg}\n${hints}`);
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(`${serverMsg}\n${hints}`);
      }
      throw e;
    }
  }
  try {
    return await res.json();
  } catch (_) {
    throw new Error(`Invalid response from server.\n${hints}`);
  }
};

const hints =
  `Check: server running, correct URL (emulator: 10.0.2.2, device: LAN IP), firewall port 8080.`;

const networkErrorMsg = (base, timeout = false) => {
  const header = timeout
    ? `Server at ${base} not responding (timeout ${TIMEOUT_MS / 1000}s).`
    : `Cannot reach server at ${base}.`;
  return `${header}\n${hints}`;
};

export const login = async (username, password) => {
  const BASE = getBase();
  let res;
  try {
    res = await fetchWithTimeout(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(networkErrorMsg(BASE, true));
    }
    throw new Error(networkErrorMsg(BASE));
  }
  return handleResponse(res, 'Login failed');
};

export const register = async (name, username, password, phone, email) => {
  const BASE = getBase();
  let res;
  try {
    res = await fetchWithTimeout(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password, phone, email }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(networkErrorMsg(BASE, true));
    }
    throw new Error(networkErrorMsg(BASE));
  }
  return handleResponse(res, 'Registration failed');
};
