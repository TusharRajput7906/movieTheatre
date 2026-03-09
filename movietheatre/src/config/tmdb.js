// TMDB API Configuration
// Get your free API key at: https://www.themoviedb.org/settings/api

export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
export const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

// Image helpers
export const POSTER_PLACEHOLDER   = '/img/poster-placeholder.svg';
export const BACKDROP_PLACEHOLDER = '/img/backdrop-placeholder.svg';
export const PERSON_PLACEHOLDER   = '/img/person-placeholder.svg';

export const posterUrl = (path, size = 'w500') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : POSTER_PLACEHOLDER;

export const backdropUrl = (path, size = 'original') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : BACKDROP_PLACEHOLDER;

export const profileUrl = (path, size = 'w185') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : PERSON_PLACEHOLDER;

export const youtubeEmbedUrl = (key) =>
  `https://www.youtube.com/embed/${key}?autoplay=1&rel=0&modestbranding=1`;

// Genre maps (saves one API call)
export const MOVIE_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

export const TV_GENRES = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  10762: 'Kids', 9648: 'Mystery', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk',
  10768: 'War & Politics', 37: 'Western',
};
