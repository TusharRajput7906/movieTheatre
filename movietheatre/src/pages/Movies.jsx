import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDiscoverMovies, selectMoviesError } from '../store/slices/moviesSlice.js';
import { MOVIE_GENRES } from '../config/tmdb.js';
import MovieCard from '../components/ui/MovieCard.jsx';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';

const SORT_OPTIONS = [
  { value: 'popularity.desc',   label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Top Rated' },
  { value: 'release_date.desc', label: 'Newest First' },
  { value: 'release_date.asc',  label: 'Oldest First' },
  { value: 'revenue.desc',      label: 'Highest Revenue' },
];

const YEARS = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => 2000 + i).reverse();

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

export default function Movies() {
  const dispatch    = useDispatch();
  const reduxError  = useSelector(selectMoviesError);

  const [genre, setGenre]           = useState('');
  const [sort,  setSort]            = useState('popularity.desc');
  const [year,  setYear]            = useState('');
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
      const result = await dispatch(fetchDiscoverMovies({
        sort_by: sort,
        page: nextPage,
        'vote_count.gte': 50,
        ...(genre && { with_genres: genre }),
        ...(year  && { primary_release_year: year }),
      })).unwrap();
      setItems((prev) => nextPage === 1 ? result.results : [...prev, ...result.results]);
      setTotalPages(result.total_pages);
      setPage(nextPage);
    } catch (err) {
      setError(err?.message || 'Failed to load movies');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [dispatch, genre, sort, year]);

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
        <h1><i className="fas fa-film"></i> Movies</h1>
        <div className="filters">
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="filter-select">
            <option value="">All Genres</option>
            {Object.entries(MOVIE_GENRES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="filter-select">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="filter-select">
            <option value="">All Years</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
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
          <p className="results-count">Showing {items.length} movies</p>
          <div className="movies-grid">
            {items.map((movie) => (
              <MovieCard key={movie.id} item={movie} mediaType="movie" />
            ))}
          </div>
        </>
      )}

      {!loading && page > 0 && items.length === 0 && (
        <p className="results-count">No results found</p>
      )}

      {/* Sentinel — sits just below the grid */}
      <div ref={sentinelRef} style={{ height: '1px' }} />

      {/* Bottom skeleton while loading next page */}
      {loading && page > 0 && <Skeletons count={8} />}

      {/* End of results message */}
      {!loading && !hasMore && items.length > 0 && (
        <p className="end-of-results">
          <i className="fas fa-check-circle"></i> You&apos;ve seen all {items.length} movies
        </p>
      )}
    </div>
  );
}
