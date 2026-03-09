import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'mt-auth';

const loadFromStorage = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
  catch { return null; }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:          null,
    token:         null,
    isAuthenticated: false,
    loading:       false,
    error:         null,
    authModalOpen: false,
    authTab:       'login',  // 'login' | 'register'
  },
  reducers: {
    // Called on app boot to restore persisted session
    loadAuthFromStorage(state) {
      const saved = loadFromStorage();
      if (saved?.token) {
        state.user  = saved.user;
        state.token = saved.token;
        state.isAuthenticated = true;
      }
    },
    loginSuccess(state, action) {
      state.user  = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error   = null;
      state.authModalOpen = false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: action.payload.user, token: action.payload.token }));
    },
    logout(state) {
      state.user  = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem(STORAGE_KEY);
    },
    setAuthLoading(state, action) { state.loading = action.payload; },
    setAuthError(state, action)   { state.error   = action.payload; state.loading = false; },
    openAuthModal(state, action)  { state.authModalOpen = true;  state.authTab = action.payload || 'login'; },
    closeAuthModal(state)         { state.authModalOpen = false; state.error = null; },
    setAuthTab(state, action)     { state.authTab = action.payload; },
  },
});

export const {
  loadAuthFromStorage, loginSuccess, logout,
  setAuthLoading, setAuthError,
  openAuthModal, closeAuthModal, setAuthTab,
} = authSlice.actions;

export const selectUser          = (s) => s.auth.user;
export const selectIsAuth        = (s) => s.auth.isAuthenticated;
export const selectIsAdmin       = (s) => s.auth.user?.isAdmin === true;
export const selectAuthToken     = (s) => s.auth.token;
export const selectAuthLoading   = (s) => s.auth.loading;
export const selectAuthError     = (s) => s.auth.error;
export const selectAuthModalOpen = (s) => s.auth.authModalOpen;
export const selectAuthTab       = (s) => s.auth.authTab;

export default authSlice.reducer;
