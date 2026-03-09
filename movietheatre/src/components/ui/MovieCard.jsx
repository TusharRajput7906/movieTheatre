import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFavoriteDB, toggleWatchlistDB, addToHistory, addToHistoryDB, isFavorited, isWatchlisted } from '../../store/slices/favoritesSlice.js';
import { openTrailer, openWatch, showToast } from '../../store/slices/uiSlice.js';
import { openAuthModal } from '../../store/slices/authSlice.js';
import { selectIsAuth } from '../../store/slices/authSlice.js';
import { posterUrl, POSTER_PLACEHOLDER } from '../../config/tmdb.js';
import tmdbApi from '../../services/tmdbApi.js';

export default function MovieCard({ item, mediaType = 'movie' }) {
  const dispatch = useDispatch();
  const isAuth   = useSelector(selectIsAuth);
  const faved    = useSelector((s) => isFavorited(s, item.id, mediaType));
  const listed   = useSelector((s) => isWatchlisted(s, item.id));

  const title    = item.title || item.name;
  const year     = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating   = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
  const detailPath = mediaType === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;

  const handleFav = (e) => {
    e.preventDefault();
    if (!isAuth) {
      dispatch(showToast('Please log in to add favorites', 'warning'));
      dispatch(openAuthModal('login'));
      return;
    }
    dispatch(toggleFavoriteDB({ item: { ...item, media_type: mediaType }, mediaType }));
    dispatch(showToast(faved ? 'Removed from favorites' : 'Added to favorites', faved ? 'info' : 'success'));
  };

  const handleWatchlist = (e) => {
    e.preventDefault();
    if (!isAuth) {
      dispatch(showToast('Please log in to add to watchlist', 'warning'));
      dispatch(openAuthModal('login'));
      return;
    }
    dispatch(toggleWatchlistDB({ ...item, media_type: mediaType }));
    dispatch(showToast(listed ? 'Removed from watchlist' : 'Added to watchlist', listed ? 'info' : 'success'));
  };

  const handleTrailer = async (e) => {
    e.preventDefault();
    if (!isAuth) {
      dispatch(showToast('Please log in to watch trailers', 'warning'));
      dispatch(openAuthModal('login'));
      return;
    }
    try {
      const endpoint = mediaType === 'tv' ? `/tv/${item.id}/videos` : `/movie/${item.id}/videos`;
      const res = await tmdbApi.get(endpoint);
      const trailer = res.data.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      ) || res.data.results.find((v) => v.site === 'YouTube') || null;
      dispatch(openTrailer({ key: trailer?.key ?? null, title }));
      dispatch(addToHistory({ ...item, media_type: mediaType }));
      dispatch(addToHistoryDB({ ...item, media_type: mediaType }));
    } catch {
      dispatch(openTrailer({ key: null, title }));
    }
  };

  const handleWatch = (e) => {
    e.preventDefault();
    if (!isAuth) {
      dispatch(showToast('Please log in to watch movies', 'warning'));
      dispatch(openAuthModal('login'));
      return;
    }
    dispatch(openWatch({ id: item.id, title, mediaType }));
  };

  const ratingColor = rating >= 7 ? 'good' : rating >= 5 ? 'avg' : 'poor';

  return (
    <div className="movie-card">
      <Link to={detailPath} className="card-poster-wrap">
        <img
          src={posterUrl(item.poster_path)}
          alt={title}
          loading="lazy"
          className="card-poster"
          onError={(e) => { e.target.onerror = null; e.target.src = POSTER_PLACEHOLDER; }}
        />
        {/* Overlay on hover */}
        <div className="card-overlay">
          <button className="overlay-btn play-btn" onClick={handleTrailer} title="Watch Trailer">
            <i className="fas fa-play"></i>
          </button>
          <button className="overlay-btn watch-now-btn" onClick={handleWatch} title="Watch Now">
            <i className="fas fa-film"></i>
          </button>
          <div className="overlay-actions">
            <button
              className={`overlay-btn fav-btn${faved ? ' active' : ''}`}
              onClick={handleFav}
              title={faved ? 'Remove Favorite' : 'Add Favorite'}
            >
              <i className={`fa${faved ? 's' : 'r'} fa-heart`}></i>
            </button>
            <button
              className={`overlay-btn watch-btn${listed ? ' active' : ''}`}
              onClick={handleWatchlist}
              title={listed ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <i className={`fa${listed ? 's' : 'r'} fa-bookmark`}></i>
            </button>
          </div>
        </div>
      </Link>

      <div className="card-body">
        <div className={`card-rating ${ratingColor}`}>
          <i className="fas fa-star"></i> {rating}
        </div>
        <h3 className="card-title">
          <Link to={detailPath}>{title}</Link>
        </h3>
        <div className="card-meta">
          <span className="card-year">{year}</span>
          <span className="card-type">{mediaType === 'tv' ? 'TV' : 'Movie'}</span>
        </div>
      </div>
    </div>
  );
}
