import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import tmdbApi from '../../services/tmdbApi.js';

export const searchContent = createAsyncThunk('search/searchContent',
  async ({ query, type = 'multi', page = 1 }, { rejectWithValue }) => {
    try {
      const endpoint = type === 'multi' ? '/search/multi'
        : type === 'movie'  ? '/search/movie'
        : type === 'tv'     ? '/search/tv'
        : '/search/person';
      const res = await tmdbApi.get(endpoint, { params: { query, page, include_adult: false } });
      return { ...res.data, query, type };
    } catch (e) { return rejectWithValue(e.message); }
  },
  {
    // Prevent duplicate dispatches when the same search is already in flight
    condition: ({ query, type = 'multi', page = 1 }, { getState }) => {
      const s = getState().search;
      if (s.loading && s.query === query && s.type === type && s.page === page) return false;
      return true;
    },
  }
);

export const fetchTrendingKeywords = createAsyncThunk('search/fetchKeywords',
  async (_, { rejectWithValue }) => {
    try {
      const res = await tmdbApi.get('/trending/all/day');
      return res.data.results.slice(0, 8).map((i) => i.title || i.name);
    } catch (e) { return rejectWithValue(e.message); }
  },
  {
    // Only fetch keywords once per session — they don't change often
    condition: (_, { getState }) => getState().search.keywords.length === 0,
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query:       '',
    results:     [],
    type:        'multi',
    page:        1,
    totalPages:  0,
    totalResults: 0,
    loading:     false,
    error:       null,
    keywords:    [],
    suggestions: [],
  },
  reducers: {
    setQuery(state, action)       { state.query = action.payload; },
    setSearchType(state, action)  { state.type  = action.payload; },
    clearResults(state)           { state.results = []; state.query = ''; state.totalResults = 0; },
    setSuggestions(state, action) { state.suggestions = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchContent.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(searchContent.rejected, (state, a) => { state.loading = false; state.error = a.payload; })
      .addCase(searchContent.fulfilled, (state, a) => {
        state.loading      = false;
        state.query        = a.payload.query;
        state.type         = a.payload.type;
        state.page         = a.payload.page;
        state.totalPages   = a.payload.total_pages;
        state.totalResults = a.payload.total_results;
        // Append on page > 1 (infinite scroll), replace on new search
        state.results = a.payload.page === 1 ? a.payload.results
          : [...state.results, ...a.payload.results];
      })
      .addCase(fetchTrendingKeywords.fulfilled, (state, a) => { state.keywords = a.payload; });
  },
});

export const { setQuery, setSearchType, clearResults, setSuggestions } = searchSlice.actions;

// Base selectors
export const selectSearchResults  = (s) => s.search.results;
export const selectSearchQuery    = (s) => s.search.query;
export const selectSearchLoading  = (s) => s.search.loading;
export const selectSearchTotal    = (s) => s.search.totalResults;
export const selectSearchPage     = (s) => s.search.page;
export const selectSearchPages    = (s) => s.search.totalPages;
export const selectKeywords       = (s) => s.search.keywords;
export const selectSuggestions    = (s) => s.search.suggestions;
export const selectSearchError    = (s) => s.search.error;

// Memoized selectors
export const selectSearchResultCount = createSelector(
  selectSearchResults,
  (results) => results.length
);
export const selectHasMorePages = createSelector(
  (s) => s.search.page,
  (s) => s.search.totalPages,
  (page, totalPages) => page < totalPages
);

export default searchSlice.reducer;
