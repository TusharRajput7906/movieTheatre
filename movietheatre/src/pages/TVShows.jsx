import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDiscoverTV, selectTVError } from '../store/slices/tvSlice.js';
import { TV_GENRES } from '../config/tmdb.js';
import MovieCard from '../components/ui/MovieCard.jsx';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';

const SORT_OPTIONS = [
  { value: 'popularity.desc',     label: 'Most Popular' },
  { value: 'vote_average.desc',   label: 'Top Rated' },
  { value: 'first_air_date.desc', label: 'Newest First' },
  { value: 'first_air_date.asc',  label: 'Oldest First' },
];

function Skeletons({ count = 20 }) {
  return (
    <div className="grid-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sk-card">
          <div className="sk-poster" />
          <div className="sk-body">
            <div className="sk-line" />
            <div className="sk-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TVShows() {
  const dispatch   = useDispatch();
  const reduxError = useSelector(selectTVError);

  const [genre, setGenre]           = useState('');
  const [sort,  setSort]            = useState('popularity.desc');
  const [items, setItems]           = useState([]);
  const [page,  setPage]            = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const fetchingRef                 = useRef(false);

  const loadPage = useCallback(async (nextPage) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError('');
    try {
      const result = await dispatch(fetchDiscoverTV({
        sort_by: sort,
        page: nextPage,
        'vote_count.gte': 20,
        ...(genre && { with_genres: genre }),
      })).unwrap();
      setItems((prev) => nextPage === 1 ? result.results : [...prev, ...result.results]);
      setTotalPages(result.total_pages);
      setPage(nextPage);
    } catch (err) {
      setError(err?.message || 'Failed to load TV shows');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [dispatch, genre, sort]);

  // Reset + load page 1 on filter changes
  useEffect(() => {
    fetchingRef.current = false;
    setItems([]);
    setPage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadPage(1);
  }, [loadPage]);

  const loadMore    = useCallback(() => { loadPage(page + 1); }, [loadPage, page]);
  const hasMore     = page > 0 && page < Math.min(totalPages, 500);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading);

  return (
    <div className="movies-page">
      <div className="page-header">
        <h1><i className="fas fa-tv"></i> TV Shows</h1>
        <div className="filters">
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="filter-select">
            <option value="">All Genres</option>
            {Object.entries(TV_GENRES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="filter-select">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {(error || reduxError) && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i> {error || reduxError}
        </div>
      )}

      {/* Initial full-page skeleton */}
      {loading && page === 0 && <Skeletons count={20} />}

      {/* Results */}
      {items.length > 0 && (
        <>
          <p className="results-count">Showing {items.length} TV shows</p>
          <div className="movies-grid">
            {items.map((show) => (
              <MovieCard key={show.id} item={show} mediaType="tv" />
            ))}
          </div>
        </>
      )}

      {!loading && page > 0 && items.length === 0 && (
        <p className="results-count">No results found</p>
      )}

      {/* Sentinel */}
      <div ref={sentinelRef} style={{ height: '1px' }} />

      {/* Bottom skeleton while loading next page */}
      {loading && page > 0 && <Skeletons count={8} />}

      {/* End of results */}
      {!loading && !hasMore && items.length > 0 && (
        <p className="end-of-results">
          <i className="fas fa-check-circle"></i> You&apos;ve seen all {items.length} TV shows
        </p>
      )}
    </div>
  );
}
