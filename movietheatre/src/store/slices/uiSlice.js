import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toasts:       [],
    trailerKey:   null,
    trailerTitle: '',
    trailerOpen:  false,
    watchOpen:    false,
    watchId:      null,
    watchTitle:   '',
    watchType:    'movie',
  },
  reducers: {
    addToast(state, action) {
      state.toasts.push({ ...action.payload });
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    openTrailer(state, action) {
      state.trailerKey   = action.payload.key;
      state.trailerTitle = action.payload.title || '';
      state.trailerOpen  = true;
    },
    closeTrailer(state) {
      state.trailerOpen = false;
      state.trailerKey  = null;
    },
    openWatch(state, action) {
      state.watchId    = action.payload.id;
      state.watchTitle = action.payload.title || '';
      state.watchType  = action.payload.mediaType || 'movie';
      state.watchOpen  = true;
    },
    closeWatch(state) {
      state.watchOpen = false;
      state.watchId   = null;
    },
  },
});

export const { addToast, removeToast, openTrailer, closeTrailer, openWatch, closeWatch } = uiSlice.actions;

// Thunk helper: auto-dismiss toast after delay
export const showToast = (message, type = 'info', duration = 3500) => (dispatch) => {
  const id = Date.now();
  dispatch(addToast({ id, message, type }));
  setTimeout(() => dispatch(removeToast(id)), duration);
};

export const selectToasts      = (s) => s.ui.toasts;
export const selectTrailerOpen = (s) => s.ui.trailerOpen;
export const selectTrailerKey  = (s) => s.ui.trailerKey;
export const selectTrailerTitle= (s) => s.ui.trailerTitle;
export const selectWatchOpen   = (s) => s.ui.watchOpen;
export const selectWatchId     = (s) => s.ui.watchId;
export const selectWatchTitle  = (s) => s.ui.watchTitle;
export const selectWatchType   = (s) => s.ui.watchType;

export default uiSlice.reducer;
