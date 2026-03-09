import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import tmdbApi from '../../services/tmdbApi.js';

const STALE_MS = 5 * 60 * 1000;

export const fetchTrendingTV = createAsyncThunk(
  'tv/fetchTrending',
  async (_, { rejectWithValue }) => {
    try { const res = await tmdbApi.get('/trending/tv/week'); return res.data.results; }
    catch (e) { return rejectWithValue(e.message); }
  },
  {
    condition: (_, { getState }) => {
      const { trendingFetchedAt } = getState().tv;
      return !trendingFetchedAt || Date.now() - trendingFetchedAt > STALE_MS;
    },
  }
);

export const fetchPopularTV = createAsyncThunk('tv/fetchPopular', async (page = 1, { rejectWithValue }) => {
  try { const res = await tmdbApi.get('/tv/popular', { params: { page } }); return res.data; }
  catch (e) { return rejectWithValue(e.message); }
});

export const fetchTopRatedTV = createAsyncThunk('tv/fetchTopRated', async (page = 1, { rejectWithValue }) => {
  try { const res = await tmdbApi.get('/tv/top_rated', { params: { page } }); return res.data; }
  catch (e) { return rejectWithValue(e.message); }
});

export const fetchDiscoverTV = createAsyncThunk('tv/fetchDiscover', async (params, { rejectWithValue }) => {
  try { const res = await tmdbApi.get('/discover/tv', { params }); return res.data; }
  catch (e) { return rejectWithValue(e.message); }
});

export const fetchTVDetails = createAsyncThunk('tv/fetchDetails', async (id, { rejectWithValue, getState }) => {
  const cached = getState().tv.detailsCache[String(id)];
  if (cached) return cached;
  try {
    const [details, credits, videos, similar, images] = await Promise.all([
      tmdbApi.get(`/tv/${id}`),
      tmdbApi.get(`/tv/${id}/credits`),
      tmdbApi.get(`/tv/${id}/videos`),
      tmdbApi.get(`/tv/${id}/similar`),
      tmdbApi.get(`/tv/${id}/images`),
    ]);
    return {
      ...details.data,
      credits: credits.data,
      videos:  videos.data.results,
      similar: similar.data.results,
      images:  [
        ...(images.data.backdrops || []),
        ...(images.data.posters   || []),
      ].slice(0, 16),
    };
  } catch (e) { return rejectWithValue(e.message); }
});

const tvSlice = createSlice({
  name: 'tv',
  initialState: {
    trending:          [],
    trendingFetchedAt: null,
    popular:           { results: [], page: 1, totalPages: 0 },
    topRated:          { results: [], page: 1, totalPages: 0 },
    discover:          { results: [], page: 1, totalPages: 0 },
    details:           null,
    detailsCache:      {},
    loading:           false,
    error:             null,
  },
  reducers: {
    clearTVDetails(state) { state.details = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const failed  = (state, action) => { state.loading = false; state.error = action.payload; };
    builder
      .addCase(fetchTrendingTV.pending, pending)
      .addCase(fetchTrendingTV.rejected, failed)
      .addCase(fetchTrendingTV.fulfilled, (state, a) => {
        state.loading = false;
        state.trending = a.payload;
        state.trendingFetchedAt = Date.now();
      })
      .addCase(fetchPopularTV.fulfilled,  (state, a) => {
        state.loading = false;
        state.popular = { results: a.payload.results, page: a.payload.page, totalPages: a.payload.total_pages };
      })
      .addCase(fetchTopRatedTV.fulfilled, (state, a) => {
        state.loading = false;
        state.topRated = { results: a.payload.results, page: a.payload.page, totalPages: a.payload.total_pages };
      })
      .addCase(fetchDiscoverTV.pending, pending)
      .addCase(fetchDiscoverTV.rejected, failed)
      .addCase(fetchDiscoverTV.fulfilled, (state, a) => {
        state.loading = false;
        state.discover = { results: a.payload.results, page: a.payload.page, totalPages: a.payload.total_pages };
      })
      .addCase(fetchTVDetails.pending, (state, action) => {
        if (!state.detailsCache[String(action.meta.arg)]) {
          state.loading = true; state.error = null;
        }
      })
      .addCase(fetchTVDetails.rejected, failed)
      .addCase(fetchTVDetails.fulfilled, (state, a) => {
        state.loading = false;
        state.details = a.payload;
        if (a.payload?.id) state.detailsCache[String(a.payload.id)] = a.payload;
      });
  },
});

export const { clearTVDetails } = tvSlice.actions;

export const selectTrendingTV  = (s) => s.tv.trending;
export const selectPopularTV   = (s) => s.tv.popular;
export const selectTopRatedTV  = (s) => s.tv.topRated;
export const selectDiscoverTV  = (s) => s.tv.discover;
export const selectTVDetails   = (s) => s.tv.details;
export const selectTVLoading   = (s) => s.tv.loading;
export const selectTVError     = (s) => s.tv.error;

// Memoized selectors
export const selectPopularTVResults  = createSelector(selectPopularTV,  (d) => d.results);
export const selectTopRatedTVResults = createSelector(selectTopRatedTV, (d) => d.results);
export const selectDiscoverTVResults = createSelector(selectDiscoverTV, (d) => d.results);

export default tvSlice.reducer;
