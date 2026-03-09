import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import tmdbApi from '../../services/tmdbApi.js';

const STALE_MS = 5 * 60 * 1000; // data considered fresh for 5 minutes

// ---- Async Thunks ----
export const fetchTrending = createAsyncThunk(
  'movies/fetchTrending',
  async (_, { rejectWithValue }) => {
    try { const res = await tmdbApi.get('/trending/movie/week'); return res.data.results; }
    catch (e) { return rejectWithValue(e.message); }
  },
  {
    // Skip the network call if trending was fetched within the last 5 minutes
    condition: (_, { getState }) => {
      const { trendingFetchedAt } = getState().movies;
      return !trendingFetchedAt || Date.now() - trendingFetchedAt > STALE_MS;
    },
  }
);

export const fetchNowPlaying = createAsyncThunk('movies/fetchNowPlaying', async (page = 1, { rejectWithValue }) => {
  try { const res = await tmdbApi.get('/movie/now_playing', { params: { page } }); return res.data; }
  catch (e) { return rejectWithValue(e.message); }
});

export const fetchTopRated = createAsyncThunk('movies/fetchTopRated', async (page = 1, { rejectWithValue }) => {
  try { const res = await tmdbApi.get('/movie/top_rated', { params: { page } }); return res.data; }
  catch (e) { return rejectWithValue(e.message); }
});

export const fetchUpcoming = createAsyncThunk('movies/fetchUpcoming', async (page = 1, { rejectWithValue }) => {
  try { const res = await tmdbApi.get('/movie/upcoming', { params: { page } }); return res.data; }
  catch (e) { return rejectWithValue(e.message); }
});

export const fetchDiscoverMovies = createAsyncThunk('movies/fetchDiscover', async (params, { rejectWithValue }) => {
  try { const res = await tmdbApi.get('/discover/movie', { params }); return res.data; }
  catch (e) { return rejectWithValue(e.message); }
});

export const fetchMovieDetails = createAsyncThunk('movies/fetchDetails', async (id, { rejectWithValue, getState }) => {
  // Serve from in-memory cache — zero network calls on back-navigation
  const cached = getState().movies.detailsCache[String(id)];
  if (cached) return cached;
  try {
    const [details, credits, videos, similar, reviews, images] = await Promise.all([
      tmdbApi.get(`/movie/${id}`, { params: { append_to_response: 'external_ids' } }),
      tmdbApi.get(`/movie/${id}/credits`),
      tmdbApi.get(`/movie/${id}/videos`),
      tmdbApi.get(`/movie/${id}/similar`),
      tmdbApi.get(`/movie/${id}/reviews`),
      tmdbApi.get(`/movie/${id}/images`),
    ]);
    return {
      ...details.data,
      credits: credits.data,
      videos:  videos.data.results,
      similar: similar.data.results,
      reviews: reviews.data.results,
      images:  [
        ...(images.data.backdrops || []),
        ...(images.data.posters   || []),
      ].slice(0, 16),
    };
  } catch (e) { return rejectWithValue(e.message); }
});

// ---- Slice ----
const moviesSlice = createSlice({
  name: 'movies',
  initialState: {
    trending:          [],
    trendingFetchedAt: null,
    nowPlaying:        { results: [], page: 1, totalPages: 0 },
    topRated:          { results: [], page: 1, totalPages: 0 },
    upcoming:          { results: [], page: 1, totalPages: 0 },
    discover:          { results: [], page: 1, totalPages: 0 },
    details:           null,
    detailsCache:      {}, // keyed by movie id — avoids re-fetching on back-nav
    loading:           false,
    error:             null,
  },
  reducers: {
    clearDetails(state) { state.details = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const failed  = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchTrending.pending, pending)
      .addCase(fetchTrending.rejected, failed)
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.loading = false;
        state.trending = action.payload;
        state.trendingFetchedAt = Date.now();
      })
      .addCase(fetchNowPlaying.fulfilled, (state, action) => {
        state.loading = false;
        state.nowPlaying = { results: action.payload.results, page: action.payload.page, totalPages: action.payload.total_pages };
      })
      .addCase(fetchTopRated.fulfilled, (state, action) => {
        state.loading = false;
        state.topRated = { results: action.payload.results, page: action.payload.page, totalPages: action.payload.total_pages };
      })
      .addCase(fetchUpcoming.fulfilled, (state, action) => {
        state.loading = false;
        state.upcoming = { results: action.payload.results, page: action.payload.page, totalPages: action.payload.total_pages };
      })
      .addCase(fetchDiscoverMovies.pending, pending)
      .addCase(fetchDiscoverMovies.rejected, failed)
      .addCase(fetchDiscoverMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.discover = { results: action.payload.results, page: action.payload.page, totalPages: action.payload.total_pages };
      })
      // Only show loading spinner when data is NOT already cached
      .addCase(fetchMovieDetails.pending, (state, action) => {
        if (!state.detailsCache[String(action.meta.arg)]) {
          state.loading = true; state.error = null;
        }
      })
      .addCase(fetchMovieDetails.rejected, failed)
      .addCase(fetchMovieDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.details = action.payload;
        // Persist in cache so navigating back is instant
        if (action.payload?.id) {
          state.detailsCache[String(action.payload.id)] = action.payload;
        }
      });
  },
});

export const { clearDetails } = moviesSlice.actions;

// Base selectors
export const selectTrending     = (s) => s.movies.trending;
export const selectNowPlaying   = (s) => s.movies.nowPlaying;
export const selectTopRated     = (s) => s.movies.topRated;
export const selectUpcoming     = (s) => s.movies.upcoming;
export const selectDiscover     = (s) => s.movies.discover;
export const selectMovieDetails = (s) => s.movies.details;
export const selectMoviesLoading= (s) => s.movies.loading;
export const selectMoviesError  = (s) => s.movies.error;

// Memoized selectors — prevent unnecessary re-renders when parent slices update
export const selectDiscoverResults   = createSelector(selectDiscover,   (d) => d.results);
export const selectNowPlayingResults = createSelector(selectNowPlaying, (d) => d.results);
export const selectTopRatedResults   = createSelector(selectTopRated,   (d) => d.results);
export const selectUpcomingResults   = createSelector(selectUpcoming,   (d) => d.results);
export const selectTrendingIds       = createSelector(selectTrending,   (t) => t.map((m) => m.id));

export default moviesSlice.reducer;
