import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { selectTrailerOpen, selectTrailerKey, selectTrailerTitle, closeTrailer } from '../../store/slices/uiSlice.js';
import { youtubeEmbedUrl } from '../../config/tmdb.js';

export default function TrailerModal() {
  const dispatch = useDispatch();
  const open  = useSelector(selectTrailerOpen);
  const key   = useSelector(selectTrailerKey);
  const title = useSelector(selectTrailerTitle);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') dispatch(closeTrailer()); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, dispatch]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="trailer-modal" role="dialog" aria-label={`Trailer: ${title}`}>
      <div className="trailer-backdrop" onClick={() => dispatch(closeTrailer())} />
      <div className="trailer-box">
        <div className="trailer-header">
          <span>{title}</span>
          <button onClick={() => dispatch(closeTrailer())} className="trailer-close" aria-label="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        {key ? (
          <div className="trailer-frame-wrap">
            <iframe
              src={youtubeEmbedUrl(key)}
              title={title}
              allowFullScreen
              allow="autoplay; encrypted-media"
              frameBorder="0"
            />
          </div>
        ) : (
          <div className="trailer-no-video">
            <i className="fas fa-video-slash"></i>
            <p>Trailer not available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
