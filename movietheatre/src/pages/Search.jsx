import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  searchContent, fetchTrendingKeywords,
  selectSearchResults, selectSearchQuery, selectSearchLoading,
  selectSearchTotal, selectSearchPage, selectSearchPages, selectKeywords,
  selectSearchError, clearResults,
} from '../store/slices/searchSlice.js';
import { useDebounce } from '../hooks/useDebounce.js';
import MovieCard from '../components/ui/MovieCard.jsx';
import PersonCard from '../components/ui/PersonCard.jsx';

const TYPES = [
  { value: 'multi',  label: 'All' },
  { value: 'movie',  label: 'Movies' },
  { value: 'tv',     label: 'TV Shows' },
  { value: 'person', label: 'People' },
];

export default function Search() {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();

  const results  = useSelector(selectSearchResults);
  const query    = useSelector(selectSearchQuery);
  const loading  = useSelector(selectSearchLoading);
  const total    = useSelector(selectSearchTotal);
  const page     = useSelector(selectSearchPage);
  const pages    = useSelector(selectSearchPages);
  const keywords = useSelector(selectKeywords);
  const error    = useSelector(selectSearchError);

  const [inputVal, setInputVal] = useState(params.get('q') || '');
  const [type,     setType]     = useState('multi');
  const debounced   = useDebounce(inputVal, 400);
  const sentinelRef = useRef(null);
  // Tracks the last search query we dispatched to avoid firing twice when
  // both the URL-param effect and the debounced effect run for the same value
  const lastSearchedRef = useRef('');

  useEffect(() => { dispatch(fetchTrendingKeywords()); }, [dispatch]);

  // Fire search when URL param changes (from navbar)
  useEffect(() => {
    const q = params.get('q');
    if (q && q !== lastSearchedRef.current) {
      setInputVal(q);
      doSearch(q, type, 1);
      lastSearchedRef.current = q;
    }
  }, [params]);

  // Real-time search as user types (debounced 400 ms)
  // Skip if the same query was already dispatched by the URL-param effect above
  useEffect(() => {
    if (debounced === lastSearchedRef.current) return;
    if (debounced.length >= 2) {
      doSearch(debounced, type, 1);
      lastSearchedRef.current = debounced;
    } else if (!debounced) {
      dispatch(clearResults());
      lastSearchedRef.current = '';
    }
  }, [debounced]);

  const doSearch = useCallback((q, t, p) => {
    dispatch(searchContent({ query: q, type: t, page: p }));
  }, [dispatch]);

  // ── Infinite Scroll ───────────────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && page < pages && query) {
          doSearch(query, type, page + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, page, pages, query, type, doSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setParams({ q: inputVal.trim() });
    doSearch(inputVal.trim(), type, 1);
  };

  const handleTypeChange = (t) => {
    setType(t);
    if (inputVal.trim()) doSearch(inputVal.trim(), t, 1);
  };

  // Split results for multi-mode
  const peopleResults = results.filter((r) => r.media_type === 'person');
  const mediaResults  = results.filter((r) => r.media_type !== 'person');

  return (
    <div className="search-page">
      {/* Search Hero */}
      <div className="search-hero">
        <h1>Discover Everything</h1>
        <p>Search millions of movies, TV shows &amp; people</p>

        <form className="search-form-big" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="e.g. Inception, Breaking Bad, Christopher Nolan…"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            autoFocus
            autoComplete="off"
          />
          <button type="submit"><i className="fas fa-search"></i> Search</button>
        </form>

        {/* Type filters */}
        <div className="search-type-filters">
          {TYPES.map((t) => (
            <button
              key={t.value}
              className={`type-chip${type === t.value ? ' active' : ''}`}
              onClick={() => handleTypeChange(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trending keywords — shown when no search active */}
      {!query && !loading && (
        <div className="trending-box">
          <h3><i className="fas fa-fire"></i> Trending Now</h3>
          <div className="keyword-chips">
            {keywords.map((kw, i) => (
              <button
                key={i}
                className="keyword-chip"
                onClick={() => { setInputVal(kw); doSearch(kw, 'multi', 1); }}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && results.length === 0 && (
        <div className="grid-skeleton">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="sk-card">
              <div className="sk-poster" />
              <div className="sk-body">
                <div className="sk-line" />
                <div className="sk-line short" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <div className="search-results-header">
            <h2>
              {total.toLocaleString()} results for &ldquo;<em>{query}</em>&rdquo;
            </h2>
            <span className="search-sort-note">
              <i className="fas fa-sort-amount-down"></i> Sorted by relevance
            </span>
          </div>

          {/* ── People section (multi mode or person-only mode) ── */}
          {(type === 'person' || (type === 'multi' && peopleResults.length > 0)) && (
            <section className="search-section">
              {type === 'multi' && (
                <h3 className="search-section-title">
                  <i className="fas fa-users"></i> People
                </h3>
              )}
              <div className="people-grid search-people-grid">
                {(type === 'person' ? results : peopleResults).map((person) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            </section>
          )}

          {/* ── Movies & TV section ── */}
          {type !== 'person' && (type === 'multi' ? mediaResults : results).length > 0 && (
            <section className="search-section">
              {type === 'multi' && mediaResults.length > 0 && (
                <h3 className="search-section-title">
                  <i className="fas fa-film"></i> Movies &amp; TV Shows
                </h3>
              )}
              <div className="movies-grid">
                {(type === 'multi' ? mediaResults : results).map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    mediaType={item.media_type === 'tv' || type === 'tv' ? 'tv' : 'movie'}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="infinite-loader">
            {loading && <i className="fas fa-spinner fa-spin"></i>}
            {!loading && page >= pages && (
              <span style={{ fontSize: '.8rem', color: 'var(--text3)' }}>You&apos;ve reached the end</span>
            )}
          </div>
        </>
      )}

      {/* No results */}
      {!loading && query && results.length === 0 && !error && (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <h3>No results for &ldquo;{query}&rdquo;</h3>
          <p>Try different keywords or switch the filter above</p>
        </div>
      )}
    </div>
  );
}
