import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTrending, fetchNowPlaying, fetchTopRated, fetchUpcoming,
  selectTrending, selectNowPlaying, selectTopRated, selectUpcoming,
} from '../store/slices/moviesSlice.js';
import { fetchTrendingTV, fetchPopularTV, selectTrendingTV, selectPopularTV } from '../store/slices/tvSlice.js';
import { toggleFavorite, isFavorited, addToHistory, addToHistoryDB } from '../store/slices/favoritesSlice.js';
import { openTrailer, showToast } from '../store/slices/uiSlice.js';
import { selectIsAuth } from '../store/slices/authSlice.js';
import { openAuthModal } from '../store/slices/authSlice.js';
import { backdropUrl, posterUrl } from '../config/tmdb.js';
import MovieRow from '../components/ui/MovieRow.jsx';
import tmdbApi from '../services/tmdbApi.js';

export default function Home() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const trending   = useSelector(selectTrending);
  const nowPlaying = useSelector(selectNowPlaying);
  const topRated   = useSelector(selectTopRated);
  const upcoming   = useSelector(selectUpcoming);
  const trendingTV = useSelector(selectTrendingTV);
  const popularTV  = useSelector(selectPopularTV);

  const [heroIndex, setHeroIndex] = useState(0);
  const heroItems = trending.slice(0, 6);
  const current   = heroItems[heroIndex];
  const autoRef   = useRef(null);

  useEffect(() => {
    dispatch(fetchTrending());
    dispatch(fetchNowPlaying(1));
    dispatch(fetchTopRated(1));
    dispatch(fetchUpcoming(1));
    dispatch(fetchTrendingTV());
    dispatch(fetchPopularTV(1));
  }, [dispatch]);

  // Auto-advance hero
  useEffect(() => {
    if (!heroItems.length) return;
    autoRef.current = setInterval(() => setHeroIndex((p) => (p + 1) % heroItems.length), 6000);
    return () => clearInterval(autoRef.current);
  }, [heroItems.length]);

  const goHero = (idx) => { setHeroIndex(idx); clearInterval(autoRef.current); };

  const handleHeroTrailer = async () => {
    if (!current) return;
    if (!isAuth) {
      dispatch(showToast('Please log in to watch trailers', 'warning'));
      dispatch(openAuthModal('login'));
      return;
    }
    try {
      const res = await tmdbApi.get(`/movie/${current.id}/videos`);
      const t   = res.data.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube') || res.data.results[0];
      if (t) {
        dispatch(openTrailer({ key: t.key, title: current.title }));
        dispatch(addToHistory({ ...current, media_type: 'movie' }));
        dispatch(addToHistoryDB({ ...current, media_type: 'movie' }));
      } else dispatch(showToast('No trailer available', 'warning'));
    } catch { dispatch(showToast('Could not load trailer', 'error')); }
  };

  const faved = useSelector((s) => current ? isFavorited(s, current.id, 'movie') : false);
  const isAuth = useSelector(selectIsAuth);

  return (
    <div className="home-page">

      {/* ===== HERO BANNER ===== */}
      {!current ? (
        <div className="hero-skeleton" />
      ) : (
        <div
          className="hero-banner"
          style={{ backgroundImage: `url(${backdropUrl(current.backdrop_path)})` }}
        >
          <div className="hero-gradient" />
          <div className="hero-content">
            <span className="hero-badge"><i className="fas fa-fire"></i> Trending Today</span>
            <h1 className="hero-title">{current.title}</h1>
            <p className="hero-overview">{current.overview?.slice(0, 180)}…</p>
            <div className="hero-meta">
              <span className="hero-rating">
                <i className="fas fa-star"></i> {current.vote_average?.toFixed(1)}
              </span>
              <span>{current.release_date?.slice(0, 4)}</span>
              {current.original_language && (
                <span className="lang-badge">{current.original_language.toUpperCase()}</span>
              )}
            </div>
            <div className="hero-actions">
              <button className="hero-btn play" onClick={handleHeroTrailer}>
                <i className="fas fa-play"></i> Watch Trailer
              </button>
              <Link to={`/movie/${current.id}`} className="hero-btn info">
                <i className="fas fa-info-circle"></i> More Info
              </Link>
              <button
                className={`hero-btn fav${faved ? ' active' : ''}`}
                onClick={() => {
                  if (!isAuth) {
                    dispatch(showToast('Please log in to add favorites', 'warning'));
                    dispatch(openAuthModal('login'));
                    return;
                  }
                  dispatch(toggleFavorite({ item: current, mediaType: 'movie' }));
                  dispatch(showToast(faved ? 'Removed from favorites' : 'Added to favorites', faved ? 'info' : 'success'));
                }}
              >
                <i className={`fa${faved ? 's' : 'r'} fa-heart`}></i>
              </button>
            </div>
          </div>

          {/* Hero Dots */}
          <div className="hero-nav">
            <button className="hero-arrow" onClick={() => goHero((heroIndex - 1 + heroItems.length) % heroItems.length)}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="hero-dots">
              {heroItems.map((_, i) => (
                <button
                  key={i}
                  className={`hero-dot${i === heroIndex ? ' active' : ''}`}
                  onClick={() => goHero(i)}
                />
              ))}
            </div>
            <button className="hero-arrow" onClick={() => goHero((heroIndex + 1) % heroItems.length)}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="hero-strip">
            {heroItems.map((item, i) => (
              <div
                key={item.id}
                className={`hero-thumb${i === heroIndex ? ' active' : ''}`}
                onClick={() => goHero(i)}
              >
                <img src={posterUrl(item.poster_path, 'w92')} alt={item.title} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CONTENT ROWS ===== */}
      <div className="home-rows">
        <MovieRow loading={!trending.length}               title="Trending Movies"  icon="fas fa-fire"         items={trending}              mediaType="movie"  seeAllPath="/movies" />
        <MovieRow loading={!popularTV?.results?.length}    title="Popular TV Shows" icon="fas fa-tv"           items={popularTV.results}     mediaType="tv"     seeAllPath="/tv" />
        <MovieRow loading={!nowPlaying?.results?.length}   title="Now Playing"      icon="fas fa-ticket-alt"   items={nowPlaying.results}    mediaType="movie" />
        <MovieRow loading={!topRated?.results?.length}     title="Top Rated"        icon="fas fa-star"         items={topRated.results}      mediaType="movie" />
        <MovieRow loading={!trendingTV.length}             title="Trending TV"      icon="fas fa-bolt"         items={trendingTV}            mediaType="tv"     seeAllPath="/tv" />
        <MovieRow loading={!upcoming?.results?.length}     title="Upcoming Movies"  icon="fas fa-calendar-alt" items={upcoming.results}      mediaType="movie" />
      </div>
    </div>
  );
}
