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

export const forgotPassword = async (email, phone) => {
  const BASE = getBase();
  let res;
  try {
    res = await fetchWithTimeout(`${BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email || null, phone: phone || null }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Server at ${BASE} not responding (timeout ${TIMEOUT_MS / 1000}s).\n${hints}`);
    }
    throw new Error(`Cannot reach server at ${BASE}.\n${hints}`);
  }
  return handleResponse(res, 'Failed to send reset request');
};

export const resetPassword = async (token, newPassword) => {
  const BASE = getBase();
  let res;
  try {
    res = await fetchWithTimeout(`${BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Server at ${BASE} not responding (timeout ${TIMEOUT_MS / 1000}s).\n${hints}`);
    }
    throw new Error(`Cannot reach server at ${BASE}.\n${hints}`);
  }
  return handleResponse(res, 'Failed to reset password');
};

export const changePassword = async (oldPassword, newPassword) => {
  const BASE = getBase();
  let res;
  try {
    res = await fetchWithTimeout(`${BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Server at ${BASE} not responding (timeout ${TIMEOUT_MS / 1000}s).\n${hints}`);
    }
    throw new Error(`Cannot reach server at ${BASE}.\n${hints}`);
  }
  return handleResponse(res, 'Failed to change password');
};

const networkErrorMsg = (base, timeout = false) => {
  const header = timeout
    ? `Server at ${base} not responding (timeout ${TIMEOUT_MS / 1000}s).`
    : `Cannot reach server at ${base}.`;
  return `${header}\n${hints}`;
};

export function generateUsername(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
}

export function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pwd = '';
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

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
