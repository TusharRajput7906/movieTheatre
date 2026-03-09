import authApi from './authApi.js';

/* ── Stats ───────────────────────────────── */
export const getAdminStats = () =>
  authApi.get('/admin/stats');

/* ── Users ───────────────────────────────── */
export const getAllUsers = () =>
  authApi.get('/admin/users');

export const banUser = (id) =>
  authApi.put(`/admin/users/${id}/ban`);

export const unbanUser = (id) =>
  authApi.put(`/admin/users/${id}/unban`);

export const deleteUser = (id) =>
  authApi.delete(`/admin/users/${id}`);

/* ── Custom Movies ───────────────────────── */
export const getCustomMovies = () =>
  authApi.get('/admin/movies');

export const addCustomMovie = (data) =>
  authApi.post('/admin/movies', data);

export const updateCustomMovie = (id, data) =>
  authApi.put(`/admin/movies/${id}`, data);

export const deleteCustomMovie = (id) =>
  authApi.delete(`/admin/movies/${id}`);

/* ── Admin setup ─────────────────────────── */
export const promoteAdmin = (email, setupCode) =>
  authApi.post('/auth/promote-admin', { email, setupCode });
