import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const authApi = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
authApi.interceptors.request.use((config) => {
  const stored = localStorage.getItem('mt-auth');
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authApi.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// ---- Auth API calls ----
export const loginUser = (credentials) =>
  authApi.post('/auth/login', credentials);

export const registerUser = (userData) =>
  authApi.post('/auth/register', userData);

export const getProfile = () =>
  authApi.get('/auth/profile');

// ---- Favorites API calls (syncs with backend) ----
export const syncFavorites = (data) =>
  authApi.post('/favorites/sync', data);

export const getFavorites = () =>
  authApi.get('/favorites');

export const toggleFavoriteApi = (item) =>
  authApi.post('/favorites/toggle', item);

export const toggleWatchlistApi = (item) =>
  authApi.post('/favorites/watchlist/toggle', item);

// ---- Watch History ----
export const getWatchHistory = () =>
  authApi.get('/history');

export const addToWatchHistoryApi = (item) =>
  authApi.post('/history', item);

export default authApi;
