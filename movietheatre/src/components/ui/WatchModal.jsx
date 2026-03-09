import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useRef, useCallback } from 'react';
import { selectWatchOpen, selectWatchId, selectWatchTitle, selectWatchType, closeWatch } from '../../store/slices/uiSlice.js';

const SOURCES = [
  { label: 'VidLink',    sublabel: 'HD · Fast',    icon: 'fas fa-play-circle',    key: 'vidlink'    },
  { label: 'VidSrc.me',  sublabel: 'HD · Backup',  icon: 'fas fa-satellite-dish', key: 'vidsrcme'   },
  { label: '2Embed',     sublabel: 'Multi-lang',   icon: 'fas fa-globe',          key: '2embed'     },
  { label: 'MoviesAPI',  sublabel: 'Alt Stream',   icon: 'fas fa-bolt',           key: 'moviesapi'  },
];

function buildUrl(sourceKey, type, id) {
  const isTV = type === 'tv';
  switch (sourceKey) {
    case 'vidlink':
      return isTV ? `https://vidlink.pro/tv/${id}/1/1` : `https://vidlink.pro/movie/${id}`;
    case 'vidsrcme':
      return isTV ? `https://vidsrc.me/embed/tv/${id}` : `https://vidsrc.me/embed/movie/${id}`;
    case '2embed':
      return isTV ? `https://www.2embed.cc/embedtv/${id}` : `https://www.2embed.cc/embed/${id}`;
    case 'moviesapi':
      return isTV ? `https://moviesapi.club/tv/${id}-1-1` : `https://moviesapi.club/movie/${id}`;
    default: return '';
  }
}

export default function WatchModal() {
  const dispatch = useDispatch();
  const open  = useSelector(selectWatchOpen);
  const id    = useSelector(selectWatchId);
  const title = useSelector(selectWatchTitle);
  const type  = useSelector(selectWatchType);

  const cinemaRef  = useRef(null);
  const seekTimer   = useRef(null);
  const [sourceIdx, setSourceIdx]     = useState(0);
  const [loading, setLoading]         = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seekFlash, setSeekFlash]     = useState(null); // 'fwd' | 'bwd' | null

  useEffect(() => { if (open) { setSourceIdx(0); setSeekFlash(null); } }, [open, id]);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
  }, [sourceIdx, id]);

  const flashSeek = useCallback((dir) => {
    setSeekFlash(dir);
    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => setSeekFlash(null), 750);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (e.key === 'Escape') { dispatch(closeWatch()); return; }
      if (e.key === 'ArrowLeft'  || e.key === 'j' || e.key === 'J') flashSeek('bwd');
      if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') flashSeek('fwd');
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, dispatch, flashSeek]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const toggleFullscreen = useCallback(() => {
    const el = cinemaRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  if (!open || !id) return null;

  const embedUrl = buildUrl(SOURCES[sourceIdx].key, type, id);
  const typeBadge = type === 'tv' ? 'TV SHOW' : 'MOVIE';

  return (
    <div className="watch-modal" role="dialog" aria-label={`Watch: ${title}`}>
      <div className="watch-backdrop" onClick={() => dispatch(closeWatch())} />

      <div className="watch-cinema" ref={cinemaRef}>

        {/* ── Top bar ── */}
        <div className="watch-topbar">
          <div className="watch-topbar-left">
            <span className="watch-now-playing">
              <span className="watch-dot" />
              NOW PLAYING
            </span>
            <span className="watch-type-badge">{typeBadge}</span>
            <span className="watch-movie-title">{title}</span>
          </div>
          <div className="watch-topbar-right">
            <span className="watch-esc-hint"><kbd>ESC</kbd> to close</span>
            <button className="watch-fullscreen-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              <i className={isFullscreen ? 'fas fa-compress' : 'fas fa-expand'}></i>
            </button>
            <button className="watch-close-btn" onClick={() => dispatch(closeWatch())} aria-label="Close">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* ── Player ── */}
        <div className="watch-player-wrap">
          {loading && (
            <div className="watch-loader">
              <div className="watch-spinner" />
              <p>Loading stream&hellip;</p>
              <span>If it takes too long, try a different server</span>
            </div>
          )}
          <iframe
            key={`${id}-${sourceIdx}`}
            src={embedUrl}
            title={title}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            frameBorder="0"
            onLoad={() => setLoading(false)}
            style={{ opacity: loading ? 0 : 1 }}
          />
          {/* Seek flash overlays */}
          {seekFlash === 'bwd' && (
            <div className="watch-seek-overlay watch-seek-bwd">
              <i className="fas fa-backward"></i>
              <span>-10s</span>
            </div>
          )}
          {seekFlash === 'fwd' && (
            <div className="watch-seek-overlay watch-seek-fwd">
              <i className="fas fa-forward"></i>
              <span>+10s</span>
            </div>
          )}
        </div>

        {/* ── Keyboard hint strip ── */}
        <div className="watch-shortcuts-strip">
          <span><kbd>←</kbd> / <kbd>J</kbd>&nbsp; -10s</span>
          <span className="watch-shortcuts-center"><i className="fas fa-mouse-pointer"></i> Click player first to enable shortcuts</span>
          <span>+10s &nbsp;<kbd>→</kbd> / <kbd>L</kbd></span>
        </div>

        {/* ── Server selector ── */}
        <div className="watch-server-bar">
          <div className="watch-server-label">
            <i className="fas fa-server"></i>
            Choose Server
          </div>
          <div className="watch-server-cards">
            {SOURCES.map((s, i) => (
              <button
                key={s.key}
                className={`watch-server-card${sourceIdx === i ? ' active' : ''}`}
                onClick={() => setSourceIdx(i)}
              >
                <i className={s.icon}></i>
                <div className="watch-server-info">
                  <span className="watch-server-name">{s.label}</span>
                  <span className="watch-server-sub">{s.sublabel}</span>
                </div>
                {sourceIdx === i && <span className="watch-server-check"><i className="fas fa-check"></i></span>}
              </button>
            ))}
          </div>
          <div className="watch-server-hint">
            <i className="fas fa-shield-alt"></i>
            Black screen? Switch server &mdash; availability varies by title & region.
          </div>
        </div>

      </div>
    </div>
  );
}
