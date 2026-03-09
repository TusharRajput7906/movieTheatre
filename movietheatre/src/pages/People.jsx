import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTrendingPeople, fetchPopularPeople,
  selectTrendingPeople, selectPeopleLoading, selectPeopleError,
} from '../store/slices/peopleSlice.js';
import PersonCard from '../components/ui/PersonCard.jsx';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';

const DEPARTMENTS = ['Acting', 'Directing', 'Writing', 'Production', 'Sound', 'Art', 'Camera'];

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

export default function People() {
  const dispatch = useDispatch();
  const trending = useSelector(selectTrendingPeople);
  const error    = useSelector(selectPeopleError);

  const [dept, setDept]             = useState('');
  const [allItems, setAllItems]     = useState([]);
  const [page,  setPage]            = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const fetchingRef                 = useRef(false);

  // Fetch trending once on mount
  useEffect(() => { dispatch(fetchTrendingPeople()); }, [dispatch]);

  const loadPage = useCallback(async (nextPage) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const result = await dispatch(fetchPopularPeople(nextPage)).unwrap();
      setAllItems((prev) => nextPage === 1 ? result.results : [...prev, ...result.results]);
      setTotalPages(result.total_pages);
      setPage(nextPage);
    } catch { /* error shown via Redux error selector */ }
    finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [dispatch]);

  // Load page 1 once on mount
  useEffect(() => {
    fetchingRef.current = false;
    setAllItems([]);
    setPage(0);
    loadPage(1);
  }, [loadPage]);

  // Client-side dept filter — does not trigger a refetch
  const filtered = dept ? allItems.filter((p) => p.known_for_department === dept) : allItems;

  const loadMore    = useCallback(() => { loadPage(page + 1); }, [loadPage, page]);
  const hasMore     = page > 0 && page < Math.min(totalPages, 500);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading);

  return (
    <div className="people-page">
      <div className="page-header">
        <h1><i className="fas fa-users"></i> People</h1>
        <div className="filters">
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="filter-select"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}

      {/* Trending This Week */}
      {trending.length > 0 && (
        <section className="people-section">
          <h2 className="section-title">
            <i className="fas fa-fire"></i> Trending This Week
          </h2>
          <div className="people-trending-row">
            {trending.slice(0, 10).map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        </section>
      )}

      {/* Popular People */}
      <section className="people-section">
        <h2 className="section-title">
          <i className="fas fa-star"></i> Popular People
        </h2>

        {/* Initial skeleton */}
        {loading && page === 0 && <Skeletons count={20} />}

        {filtered.length > 0 && (
          <>
            <p className="results-count">Showing {filtered.length} people</p>
            <div className="people-grid">
              {filtered.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </>
        )}

        {!loading && page > 0 && filtered.length === 0 && (
          <p className="results-count">No results found for this department</p>
        )}

        {/* Sentinel (only active when no dept filter — dept is client-side) */}
        {!dept && <div ref={sentinelRef} style={{ height: '1px' }} />}

        {/* Bottom skeleton */}
        {loading && page > 0 && <Skeletons count={8} />}

        {/* End of results */}
        {!loading && !hasMore && allItems.length > 0 && (
          <p className="end-of-results">
            <i className="fas fa-check-circle"></i> You&apos;ve seen all {allItems.length} people
          </p>
        )}
      </section>
    </div>
  );
}
