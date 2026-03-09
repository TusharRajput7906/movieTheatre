import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFavorites as getFavoritesApi, toggleFavoriteApi, toggleWatchlistApi, getWatchHistory, addToWatchHistoryApi } from '../../services/authApi.js';

// ── Data mappers back-end ↔ front-end ────────────────────────────────────────
// Backend stores: { tmdbId, mediaType, title, poster, rating }
// Frontend uses : { id, title, name, poster_path, vote_average, media_type }
const fromDB = (f) => ({
  id:           f.tmdbId,
  title:        f.title,
  name:         f.title,
  poster_path:  f.poster,
  vote_average: f.rating,
  media_type:   f.mediaType,
});

const toDB = (item, mediaType) => ({
  tmdbId:    item.id,
  mediaType: mediaType || item.media_type || 'movie',
  title:     item.title || item.name || '',
  poster:    item.poster_path || '',
  rating:    item.vote_average || 0,
});

// ── Async thunks ──────────────────────────────────────────────────────────────
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const [favsRes, histRes] = await Promise.all([getFavoritesApi(), getWatchHistory()]);
      return { ...favsRes.data, history: histRes.data.history };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleFavoriteDB = createAsyncThunk(
  'favorites/toggleFavoriteDB',
  async ({ item, mediaType }, { rejectWithValue }) => {
    try {
      const res = await toggleFavoriteApi(toDB(item, mediaType));
      return res.data.favorites; // full updated array from DB
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleWatchlistDB = createAsyncThunk(
  'favorites/toggleWatchlistDB',
  async (item, { rejectWithValue }) => {
    try {
      const res = await toggleWatchlistApi(toDB(item, item.media_type || 'movie'));
      return res.data.watchlist; // full updated array from DB
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addToHistoryDB = createAsyncThunk(
  'favorites/addToHistoryDB',
  async (item, { rejectWithValue }) => {
    try {
      const res = await addToWatchHistoryApi(toDB(item, item.media_type || 'movie'));
      return res.data.history;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── localStorage helpers ──────────────────────────────────────────────────────
const emptyFavs = () => ({ movies: [], tv: [], watchlist: [], history: [] });
const storageKey = (uid) => `mt-favorites-${uid}`;

const load = (uid) => {
  if (!uid) return emptyFavs();
  try { return JSON.parse(localStorage.getItem(storageKey(uid))) || emptyFavs(); }
  catch { return emptyFavs(); }
};

const save = (state) => {
  if (!state.userId) return;
  localStorage.setItem(storageKey(state.userId), JSON.stringify({
    movies: state.movies, tv: state.tv,
    watchlist: state.watchlist, history: state.history,
  }));
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { userId: null, movies: [], tv: [], watchlist: [], history: [], activeTab: 'movies' },
  reducers: {
    loadFavoritesFromStorage(state, action) {
      const uid   = action.payload;  // userId string
      state.userId = uid;
      const saved  = load(uid);
      state.movies    = saved.movies;
      state.tv        = saved.tv;
      state.watchlist = saved.watchlist;
      state.history   = saved.history;
    },
    clearFavorites(state) {
      state.userId    = null;
      state.movies    = [];
      state.tv        = [];
      state.watchlist = [];
      state.history   = [];
    },
    toggleFavorite(state, action) {
      const { item, mediaType } = action.payload;
      const list = mediaType === 'tv' ? 'tv' : 'movies';
      const idx  = state[list].findIndex((i) => i.id === item.id);
      if (idx === -1) state[list].unshift({ ...item, savedAt: Date.now() });
      else            state[list].splice(idx, 1);
      save(state);
    },
    toggleWatchlist(state, action) {
      const item = action.payload;
      const idx  = state.watchlist.findIndex((i) => i.id === item.id);
      if (idx === -1) state.watchlist.unshift({ ...item, savedAt: Date.now() });
      else            state.watchlist.splice(idx, 1);
      save(state);
    },
    addToHistory(state, action) {
      const item = action.payload;
      // Remove duplicate then prepend
      state.history = state.history.filter((i) => i.id !== item.id);
      state.history.unshift({ ...item, watchedAt: Date.now() });
      // Cap history at 50 items
      if (state.history.length > 50) state.history = state.history.slice(0, 50);
      save(state);
    },
    removeFromHistory(state, action) {
      state.history = state.history.filter((i) => i.id !== action.payload);
      save(state);
    },
    clearHistory(state) { state.history = []; save(state); },
    setFavoritesTab(state, action) { state.activeTab = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all favorites, watchlist + history from DB
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        const { favorites = [], watchlist = [], history = [] } = action.payload;
        state.movies    = favorites.filter((f) => f.mediaType === 'movie').map(fromDB);
        state.tv        = favorites.filter((f) => f.mediaType === 'tv').map(fromDB);
        state.watchlist = watchlist.map(fromDB);
        state.history   = history.map((h) => ({ ...fromDB(h), watchedAt: h.savedAt ? new Date(h.savedAt).getTime() : Date.now() }));
        save(state);
      })
      // Toggle favorite — backend returns full updated favorites array
      .addCase(toggleFavoriteDB.fulfilled, (state, action) => {
        const favorites = action.payload;
        state.movies = favorites.filter((f) => f.mediaType === 'movie').map(fromDB);
        state.tv     = favorites.filter((f) => f.mediaType === 'tv').map(fromDB);
        save(state);
      })
      // Toggle watchlist — backend returns full updated watchlist array
      .addCase(toggleWatchlistDB.fulfilled, (state, action) => {
        state.watchlist = action.payload.map(fromDB);
        save(state);
      })
      // Add to history — backend returns full updated history array
      .addCase(addToHistoryDB.fulfilled, (state, action) => {
        state.history = action.payload.map((h) => ({ ...fromDB(h), watchedAt: h.savedAt ? new Date(h.savedAt).getTime() : Date.now() }));
        save(state);
      });
  },
});

export const {
  loadFavoritesFromStorage, clearFavorites, toggleFavorite, toggleWatchlist,
  addToHistory, removeFromHistory, clearHistory, setFavoritesTab,
} = favoritesSlice.actions;

export const selectFavoriteMovies = (s) => s.favorites.movies;
export const selectFavoriteTV     = (s) => s.favorites.tv;
export const selectWatchlist      = (s) => s.favorites.watchlist;
export const selectHistory        = (s) => s.favorites.history;
export const selectFavTab         = (s) => s.favorites.activeTab;

export const isFavorited  = (s, id, type) =>
  (type === 'tv' ? s.favorites.tv : s.favorites.movies).some((i) => i.id === id);
export const isWatchlisted = (s, id) =>
  s.favorites.watchlist.some((i) => i.id === id);

export default favoritesSlice.reducer;
