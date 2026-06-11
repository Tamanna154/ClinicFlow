export const FETCH_TIMEOUT = 10000;

let authToken = null;
let unauthorizedCallback = null;

export function setToken(token) {
  authToken = token;
}

export function getToken() {
  return authToken;
}

export function clearToken() {
  authToken = null;
}

export function setUnauthorizedCallback(cb) {
  unauthorizedCallback = cb;
}

export async function authFetch(url, options = {}) {
  const headers = { ...options.headers };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.status === 401) {
      clearToken();
      if (unauthorizedCallback) {
        unauthorizedCallback();
      }
    }
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Server may be offline.');
    }
    throw new Error(`Unable to connect to server (${url}). Check your network connection.`);
  }
}
