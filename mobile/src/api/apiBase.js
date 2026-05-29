// Single source of truth for API base URL
// Uses localhost:8080 for local dev — change this if your backend runs elsewhere
const API_BASE = 'http://10.107.128.83:8080/api';

export const getApiBase = () => API_BASE;
