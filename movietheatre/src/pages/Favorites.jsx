import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  selectFavoriteMovies, selectFavoriteTV, selectWatchlist, selectHistory,
  selectFavTab, setFavoritesTab,
  toggleFavoriteDB, toggleWatchlistDB, removeFromHistory, clearHistory,
} from '../store/slices/favoritesSlice.js';
import { showToast } from '../store/slices/uiSlice.js';
import { posterUrl } from '../config/tmdb.js';
import MovieCard from '../components/ui/MovieCard.jsx';

const TABS = [
  { key: 'movies',    label: 'Favorite Movies', icon: 'fas fa-film' },
  { key: 'tvshows',   label: 'Favorite TV Shows', icon: 'fas fa-tv' },
  { key: 'watchlist', label: 'Watchlist', icon: 'fas fa-bookmark' },
  { key: 'history',   label: 'Watch History', icon: 'fas fa-history' },
];

export default function Favorites() {
  const dispatch  = useDispatch();
  const activeTab = useSelector(selectFavTab);
  const movies    = useSelector(selectFavoriteMovies);
  const tvShows   = useSelector(selectFavoriteTV);
  const watchlist = useSelector(selectWatchlist);
  const history   = useSelector(selectHistory);

  const listMap = { movies, tvshows: tvShows, watchlist, history };
  const typeMap = { movies: 'movie', tvshows: 'tv', watchlist: 'movie', history: 'movie' };
  const currentList = listMap[activeTab] || [];

  const handleRemoveFav = (item) => {
    const mediaType = item.media_type || (activeTab === 'tvshows' ? 'tv' : 'movie');
    dispatch(toggleFavoriteDB({ item, mediaType }));
    dispatch(showToast('Removed from favorites', 'info'));
  };

  const handleRemoveWatchlist = (item) => {
    dispatch(toggleWatchlistDB(item));
    dispatch(showToast('Removed from watchlist', 'info'));
  };

  const handleRemoveHistory = (id) => {
    dispatch(removeFromHistory(id));
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all watch history?')) {
      dispatch(clearHistory());
      dispatch(showToast('Watch history cleared', 'info'));
    }
  };

  const counts = {
    movies:    movies.length,
    tvshows:   tvShows.length,
    watchlist: watchlist.length,
    history:   history.length,
  };

  return (
    <div className="favorites-page">
      <div className="page-header">
        <h1><i className="fas fa-heart"></i> My Collection</h1>

        <div className="fav-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`fav-tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => dispatch(setFavoritesTab(tab.key))}
            >
              <i className={tab.icon}></i>
              {tab.label}
              {counts[tab.key] > 0 && <span className="tab-count">{counts[tab.key]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Extra actions for history */}
      {activeTab === 'history' && history.length > 0 && (
        <div className="history-toolbar">
          <p>{history.length} items watched</p>
          <button className="btn-clear-history" onClick={handleClearHistory}>
            <i className="fas fa-trash-alt"></i> Clear All
          </button>
        </div>
      )}

      {currentList.length === 0 ? (
        <div className="empty-state">
          <i className={TABS.find((t) => t.key === activeTab)?.icon || 'fas fa-film'}></i>
          <h3>Nothing here yet</h3>
          <p>
            {activeTab === 'movies' && 'Start adding movies to your favorites!'}
            {activeTab === 'tvshows' && 'Add some TV shows you love!'}
            {activeTab === 'watchlist' && 'Save movies & shows to watch later!'}
            {activeTab === 'history' && 'Your watch history will appear here.'}
          </p>
          <Link to="/" className="btn-explore">
            <i className="fas fa-compass"></i> Explore Now
          </Link>
        </div>
      ) : (
        <div className="movies-grid">
          {currentList.map((item) => {
            const mediaType = item.media_type || typeMap[activeTab];
            return (
              <div key={item.id} className="fav-item-wrap">
                <MovieCard item={item} mediaType={mediaType} />
                <button
                  className="remove-btn"
                  onClick={() => {
                    if (activeTab === 'watchlist') handleRemoveWatchlist(item);
                    else if (activeTab === 'history') handleRemoveHistory(item.id);
                    else handleRemoveFav(item);
                  }}
                  title="Remove"
                >
                  <i className="fas fa-times"></i>
                </button>
                {/* Watched date for history */}
                {activeTab === 'history' && item.watchedAt && (
                  <span className="watched-date">
                    {new Date(item.watchedAt).toLocaleDateString()}
                  </span>
                )}
                {/* Saved date for favorites/watchlist */}
                {(activeTab === 'movies' || activeTab === 'tvshows' || activeTab === 'watchlist') && item.savedAt && (
                  <span className="watched-date">
                    Saved {new Date(item.savedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
