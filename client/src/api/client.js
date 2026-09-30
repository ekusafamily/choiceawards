import axios from 'axios';

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return 'https://demo.balktraders.site/api';
  }
  return 'http://localhost:5000/api';
}

const API_BASE = getApiBaseUrl();

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
