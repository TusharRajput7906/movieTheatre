import { useRef } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from './MovieCard.jsx';

export default function MovieRow({ title, icon, items = [], mediaType = 'movie', seeAllPath, loading = false }) {
  const rowRef = useRef(null);

  const scroll = (dir) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className="movie-row-section">
        <div className="section-header">
          <h2>{icon && <i className={icon}></i>} {title}</h2>
        </div>
        <div className="row-wrapper">
          <div className="movie-row">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="row-item">
                <div className="sk-card">
                  <div className="sk-poster" />
                  <div className="sk-body">
                    <div className="sk-line" />
                    <div className="sk-line short" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="movie-row-section">
      <div className="section-header">
        <h2>
          {icon && <i className={icon}></i>} {title}
        </h2>
        {seeAllPath && (
          <Link to={seeAllPath} className="see-all">
            See All <i className="fas fa-arrow-right"></i>
          </Link>
        )}
      </div>

      <div className="row-wrapper">
        <button className="row-arrow left"  onClick={() => scroll(-1)}><i className="fas fa-chevron-left"></i></button>
        <div className="movie-row" ref={rowRef}>
          {items.map((item) => (
            <div key={item.id} className="row-item">
              <MovieCard item={item} mediaType={mediaType} />
            </div>
          ))}
        </div>
        <button className="row-arrow right" onClick={() => scroll(1)}><i className="fas fa-chevron-right"></i></button>
      </div>
    </section>
  );
}
