import { getApiBase } from './apiBase';

const BASE = getApiBase();

const handleResponse = async (res, defaultMsg) => {
  if (!res.ok) {
    try {
      const err = await res.json();
      throw new Error(err.error || defaultMsg);
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('Server error. Please try again later.');
      }
      throw e;
    }
  }
  try {
    return await res.json();
  } catch (_) {
    throw new Error('Invalid response from server.');
  }
};

const handleNetworkError = (_) => {
  throw new Error('Unable to connect to server. Check your network connection.');
};

export const login = async (username, password) => {
  let res;
  try {
    res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch (_) {
    handleNetworkError();
  }
  return handleResponse(res, 'Login failed');
};

export const register = async (name, username, password, phone, email) => {
  let res;
  try {
    res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password, phone, email }),
    });
  } catch (_) {
    handleNetworkError();
  }
  return handleResponse(res, 'Registration failed');
};
