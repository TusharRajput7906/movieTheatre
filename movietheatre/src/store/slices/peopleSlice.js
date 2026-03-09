import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import tmdbApi from '../../services/tmdbApi.js';

const STALE_MS = 5 * 60 * 1000;

// ---- Async Thunks ----

export const fetchTrendingPeople = createAsyncThunk(
  'people/fetchTrending',
  async (_, { rejectWithValue }) => {
    try {
      const res = await tmdbApi.get('/trending/person/week');
      return res.data.results;
    } catch (e) { return rejectWithValue(e.message); }
  },
  {
    condition: (_, { getState }) => {
      const { trendingFetchedAt } = getState().people;
      return !trendingFetchedAt || Date.now() - trendingFetchedAt > STALE_MS;
    },
  }
);

export const fetchPopularPeople = createAsyncThunk(
  'people/fetchPopular',
  async (page = 1, { rejectWithValue }) => {
    try {
      const res = await tmdbApi.get('/person/popular', { params: { page } });
      return res.data;
    } catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchPersonDetails = createAsyncThunk(
  'people/fetchDetails',
  async (id, { rejectWithValue, getState }) => {
    const cached = getState().people.detailsCache[String(id)];
    if (cached) return cached;
    try {
      const [person, movieCredits, tvCredits, images] = await Promise.all([
        tmdbApi.get(`/person/${id}`),
        tmdbApi.get(`/person/${id}/movie_credits`),
        tmdbApi.get(`/person/${id}/tv_credits`),
        tmdbApi.get(`/person/${id}/images`),
      ]);
      return {
        ...person.data,
        movieCredits: movieCredits.data,
        tvCredits:    tvCredits.data,
        images:       images.data.profiles,
      };
    } catch (e) { return rejectWithValue(e.message); }
  }
);

// ---- Slice ----

const peopleSlice = createSlice({
  name: 'people',
  initialState: {
    trending:          [],
    trendingFetchedAt: null,
    popular:           { results: [], page: 1, totalPages: 0 },
    details:           null,
    detailsCache:      {},
    loading:           false,
    error:             null,
  },
  reducers: {
    clearPersonDetails(state) { state.details = null; },
  },
  extraReducers: (builder) => {
    const pending = (state)         => { state.loading = true;  state.error = null; };
    const failed  = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchTrendingPeople.pending,   pending)
      .addCase(fetchTrendingPeople.rejected,  failed)
      .addCase(fetchTrendingPeople.fulfilled, (state, action) => {
        state.loading  = false;
        state.trending = action.payload;
        state.trendingFetchedAt = Date.now();
      })

      .addCase(fetchPopularPeople.pending,   pending)
      .addCase(fetchPopularPeople.rejected,  failed)
      .addCase(fetchPopularPeople.fulfilled, (state, action) => {
        state.loading = false;
        state.popular = {
          results:    action.payload.results,
          page:       action.payload.page,
          totalPages: action.payload.total_pages,
        };
      })

      .addCase(fetchPersonDetails.pending, (state, action) => {
        if (!state.detailsCache[String(action.meta.arg)]) {
          state.loading = true; state.error = null;
        }
      })
      .addCase(fetchPersonDetails.rejected,  failed)
      .addCase(fetchPersonDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.details = action.payload;
        if (action.payload?.id) state.detailsCache[String(action.payload.id)] = action.payload;
      });
  },
});

export const { clearPersonDetails } = peopleSlice.actions;
export default peopleSlice.reducer;

// ---- Selectors ----
export const selectTrendingPeople = (s) => s.people.trending;
export const selectPopularPeople  = (s) => s.people.popular;
export const selectPersonDetails  = (s) => s.people.details;
export const selectPeopleLoading  = (s) => s.people.loading;
export const selectPeopleError    = (s) => s.people.error;

// Memoized selectors
export const selectPopularPeopleResults = createSelector(
  selectPopularPeople,
  (popular) => popular.results
);
export const selectTrendingPeopleIds = createSelector(
  selectTrendingPeople,
  (trending) => trending.map((p) => p.id)
);
