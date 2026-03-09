import axios from 'axios';
import { TMDB_API_KEY, TMDB_BASE_URL } from '../config/tmdb.js';

const CACHE_TTL = 5 * 60 * 1000; // 5-minute response cache

// response cache: cacheKey → { response, ts }
const responseCache = new Map();

function buildCacheKey(config) {
  // Exclude api_key from key (it's constant) to keep keys compact
  const { api_key, ...rest } = config.params ?? {};
  return `${config.url}|${JSON.stringify(rest)}`;
}

// Axios instance with TMDB defaults
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 10000,
  params: {
    api_key: TMDB_API_KEY,
    language: 'en-US',
  },
});

// Request interceptor — serve cache hits by overriding adapter per-request.
// Avoids touching tmdbApi.defaults.adapter which is an array in Axios 1.x.
tmdbApi.interceptors.request.use((config) => {
  if (config.method !== 'get') return config;

  const key = buildCacheKey(config);
  const hit = responseCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    if (import.meta.env.DEV) console.debug('[TMDB cache hit]', config.url);
    // Short-circuit the network request with the cached response
    config.adapter = () => Promise.resolve(hit.response);
    return config;
  }

  config._cacheKey = key;
  return config;
});

// Dev logging interceptor
tmdbApi.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.debug('[TMDB]', config.method?.toUpperCase(), config.url);
  }
  return config;
});

// Response interceptor — store successful GET responses + normalise errors
tmdbApi.interceptors.response.use(
  (res) => {
    const key = res.config?._cacheKey;
    if (key) responseCache.set(key, { response: res, ts: Date.now() });
    return res;
  },
  (err) => {
    const msg = err.response?.data?.status_message || err.message || 'TMDB request failed';
    return Promise.reject(new Error(msg));
  }
);

export default tmdbApi;
