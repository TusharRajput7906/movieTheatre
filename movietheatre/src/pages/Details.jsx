import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovieDetails, selectMovieDetails, selectMoviesLoading, clearDetails } from '../store/slices/moviesSlice.js';
import { fetchTVDetails, selectTVDetails, selectTVLoading, clearTVDetails } from '../store/slices/tvSlice.js';
import { toggleFavorite, toggleWatchlist, addToHistory, addToHistoryDB, isFavorited, isWatchlisted } from '../store/slices/favoritesSlice.js';
import { openTrailer, openWatch, showToast } from '../store/slices/uiSlice.js';
import { selectIsAuth } from '../store/slices/authSlice.js';
import { openAuthModal } from '../store/slices/authSlice.js';
import { backdropUrl, posterUrl, profileUrl, MOVIE_GENRES, POSTER_PLACEHOLDER, PERSON_PLACEHOLDER } from '../config/tmdb.js';
import MovieCard from '../components/ui/MovieCard.jsx';

export default function Details({ type = 'movie' }) {
  const { id }    = useParams();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const isTV      = type === 'tv';
  const details   = useSelector(isTV ? selectTVDetails : selectMovieDetails);
  const loading   = useSelector(isTV ? selectTVLoading : selectMoviesLoading);
  const isAuth    = useSelector(selectIsAuth);
  const faved     = useSelector((s) => details ? isFavorited(s, details.id, type) : false);
  const listed    = useSelector((s) => details ? isWatchlisted(s, details.id) : false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isTV) dispatch(fetchTVDetails(id));
    else      dispatch(fetchMovieDetails(id));

    return () => {
      if (isTV) dispatch(clearTVDetails());
      else      dispatch(clearDetails());
    };
  }, [id, type, dispatch, isTV]);

  // Track watch history once details load (localStorage + DB)
  useEffect(() => {
    if (details) {
      dispatch(addToHistory({ ...details, media_type: type }));
      if (isAuth) dispatch(addToHistoryDB({ ...details, media_type: type }));
    }
  }, [details?.id]);

  const handleTrailer = () => {
    if (!isAuth) {
      dispatch(showToast('Please log in to watch trailers', 'warning'));
      dispatch(openAuthModal('login'));
      return;
    }
    const title   = details?.title || details?.name || '';
    const trailer = details?.videos?.find((v) => v.type === 'Trailer' && v.site === 'YouTube')
      || details?.videos?.find((v) => v.site === 'YouTube')
      || null;
    dispatch(openTrailer({ key: trailer?.key ?? null, title }));
  };

  const handleWatch = () => {
    if (!isAuth) {
      dispatch(showToast('Please log in to watch movies', 'warning'));
      dispatch(openAuthModal('login'));
      return;
    }
    const title = details?.title || details?.name || '';
    dispatch(openWatch({ id: details.id, title, mediaType: type }));
  };

  if (loading || !details) {
    return (
      <div className="details-skeleton">
        <div className="sk-details-backdrop" />
        <div className="sk-details-body">
          <div className="sk-details-poster" />
          <div className="sk-details-info">
            <div className="sk-line title" />
            <div className="sk-line mid" />
            <div className="sk-line wide" />
            <div className="sk-line wide" />
            <div className="sk-line" style={{ width: '65%' }} />
          </div>
        </div>
      </div>
    );
  }

  const title       = details.title || details.name;
  const year        = (details.release_date || details.first_air_date || '').slice(0, 4);
  const genres      = details.genres?.map((g) => g.name).join(', ') || '';
  const runtime     = details.runtime
    ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
    : details.episode_run_time?.[0]
    ? `~${details.episode_run_time[0]}m / ep`
    : '';
  const cast        = details.credits?.cast?.slice(0, 12) || [];
  const similar     = details.similar?.slice(0, 12) || [];
  const reviews     = details.reviews?.slice(0, 3) || [];
  const rating      = details.vote_average?.toFixed(1);

  return (
    <div className="details-page">
      {/* Backdrop */}
      <div
        className="details-backdrop"
        style={{ backgroundImage: `url(${backdropUrl(details.backdrop_path)})` }}
      >
        <div className="details-backdrop-overlay" />
      </div>

      <div className="details-body">
        {/* Poster + Info */}
        <div className="details-top">
          <div className="details-poster">
            <img
              src={posterUrl(details.poster_path)}
              alt={title}
              onError={(e) => { e.target.onerror = null; e.target.src = POSTER_PLACEHOLDER; }}
            />
          </div>

          <div className="details-info">
            <h1 className="details-title">{title} {year && <span className="details-year">({year})</span>}</h1>

            <div className="details-meta">
              <span className="details-rating"><i className="fas fa-star"></i> {rating}</span>
              {runtime && <span>{runtime}</span>}
              {genres && <span>{genres}</span>}
              {isTV && details.number_of_seasons && (
                <span>{details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}</span>
              )}
              {details.status && <span className="status-badge">{details.status}</span>}
            </div>

            {details.tagline && <p className="details-tagline">"{details.tagline}"</p>}
            <p className="details-overview">{details.overview || 'Description not available.'}</p>

            {/* Action Buttons */}
            <div className="details-actions">
              <button className="btn-detail watch-now" onClick={handleWatch}>
                <i className="fas fa-film"></i> Watch Now
              </button>
              <button className="btn-detail play" onClick={handleTrailer}>
                <i className="fas fa-play"></i> Watch Trailer
              </button>
              <button
                className={`btn-detail fav${faved ? ' active' : ''}`}
                onClick={() => {
                  if (!isAuth) {
                    dispatch(showToast('Please log in to add favorites', 'warning'));
                    dispatch(openAuthModal('login'));
                    return;
                  }
                  dispatch(toggleFavorite({ item: details, mediaType: type }));
                  dispatch(showToast(faved ? 'Removed from favorites' : 'Added to favorites', faved ? 'info' : 'success'));
                }}
              >
                <i className={`fa${faved ? 's' : 'r'} fa-heart`}></i>
                {faved ? 'Favorited' : 'Favorite'}
              </button>
              <button
                className={`btn-detail watch${listed ? ' active' : ''}`}
                onClick={() => {
                  if (!isAuth) {
                    dispatch(showToast('Please log in to add to watchlist', 'warning'));
                    dispatch(openAuthModal('login'));
                    return;
                  }
                  dispatch(toggleWatchlist({ ...details, media_type: type }));
                  dispatch(showToast(listed ? 'Removed from watchlist' : 'Added to watchlist', listed ? 'info' : 'success'));
                }}
              >
                <i className={`fa${listed ? 's' : 'r'} fa-bookmark`}></i>
                {listed ? 'Watchlisted' : 'Watchlist'}
              </button>
              <button className="btn-detail back" onClick={() => navigate(-1)}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
            </div>

            {/* Extra info grid */}
            <div className="details-extra-grid">
              {details.production_companies?.slice(0, 3).map((c) => c.name).join(', ') && (
                <div><strong>Studio:</strong> {details.production_companies.slice(0, 3).map((c) => c.name).join(', ')}</div>
              )}
              {details.original_language && (
                <div><strong>Language:</strong> {details.original_language.toUpperCase()}</div>
              )}
              {details.budget > 0 && (
                <div><strong>Budget:</strong> ${(details.budget / 1e6).toFixed(0)}M</div>
              )}
              {details.revenue > 0 && (
                <div><strong>Revenue:</strong> ${(details.revenue / 1e6).toFixed(0)}M</div>
              )}
            </div>
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <section className="details-section">
            <h2><i className="fas fa-users"></i> Top Cast</h2>
            <div className="cast-list">
              {cast.map((actor) => (
                <div key={actor.id} className="cast-card">
                  <img
                    src={profileUrl(actor.profile_path)}
                    alt={actor.name}
                    loading="lazy"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/100x150?text=N/A'; }}
                  />
                  <strong>{actor.name}</strong>
                  <span>{actor.character}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="details-section">
            <h2><i className="fas fa-comment-dots"></i> Reviews</h2>
            <div className="reviews-list">
              {reviews.map((r) => (
                <div key={r.id} className="review-card">
                  <div className="review-author">
                    <i className="fas fa-user-circle"></i>
                    <strong>{r.author}</strong>
                    {r.author_details?.rating && (
                      <span className="review-rating">
                        <i className="fas fa-star"></i> {r.author_details.rating}/10
                      </span>
                    )}
                  </div>
                  <p>{r.content.slice(0, 300)}{r.content.length > 300 ? '…' : ''}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <section className="details-section">
            <h2><i className="fas fa-layer-group"></i> Similar {isTV ? 'Shows' : 'Movies'}</h2>
            <div className="movies-grid similar-grid">
              {similar.map((item) => (
                <MovieCard key={item.id} item={item} mediaType={type} />
              ))}
            </div>
          </section>
        )}

        {details.images?.length > 0 && (
          <section className="details-section">
            <h2><i className="fas fa-images"></i> Media</h2>
            <div className="media-gallery">
              {details.images.map((img, i) => (
                <div key={i} className="media-thumb">
                  <img
                    src={`https://image.tmdb.org/t/p/w300${img.file_path}`}
                    alt={`${title} image ${i + 1}`}
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
