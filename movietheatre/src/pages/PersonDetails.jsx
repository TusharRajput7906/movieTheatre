import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPersonDetails, clearPersonDetails,
  selectPersonDetails, selectPeopleLoading, selectPeopleError,
} from '../store/slices/peopleSlice.js';
import { profileUrl, PERSON_PLACEHOLDER } from '../config/tmdb.js';
import MovieCard from '../components/ui/MovieCard.jsx';

export default function PersonDetails() {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const person   = useSelector(selectPersonDetails);
  const loading  = useSelector(selectPeopleLoading);
  const error    = useSelector(selectPeopleError);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    dispatch(fetchPersonDetails(id));
    return () => dispatch(clearPersonDetails());
  }, [id, dispatch]);

  if (loading || !person) {
    return (
      <div className="details-loading">
        <div className="spinner"><i className="fas fa-spinner fa-spin"></i></div>
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="details-loading">
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
        <button className="btn-detail back" style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
      </div>
    );
  }

  const knownMovies = (person.movieCredits?.cast
    ? [...person.movieCredits.cast]
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 12)
    : []);

  const knownTV = (person.tvCredits?.cast
    ? [...person.tvCredits.cast]
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 12)
    : []);
  const photos = person.images?.slice(0, 12) || [];

  const age = person.birthday && !person.deathday
    ? Math.floor((new Date() - new Date(person.birthday)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="person-details-page">
      <div className="person-details-hero">
        <div className="person-details-photo">
          <img
            src={profileUrl(person.profile_path, 'h632')}
            alt={person.name}
            onError={(e) => { e.target.onerror = null; e.target.src = PERSON_PLACEHOLDER; }}
          />
        </div>

        <div className="person-details-info">
          <h1>{person.name}</h1>
          {person.known_for_department && (
            <span className="person-dept-badge">{person.known_for_department}</span>
          )}

          <div className="person-meta-grid">
            {person.birthday && (
              <div>
                <strong>Born:</strong> {person.birthday}
                {age ? ` (age ${age})` : ''}
              </div>
            )}
            {person.deathday && <div><strong>Died:</strong> {person.deathday}</div>}
            {person.place_of_birth && (
              <div><strong>Birthplace:</strong> {person.place_of_birth}</div>
            )}
            {person.popularity > 0 && (
              <div><strong>Popularity:</strong> {person.popularity.toFixed(1)}</div>
            )}
          </div>

          {person.biography && (
            <div className="person-bio">
              <h3>Biography</h3>
              <p>{person.biography.slice(0, 800)}{person.biography.length > 800 ? '…' : ''}</p>
            </div>
          )}

          <button className="btn-detail back" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </div>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <section className="details-section">
          <h2><i className="fas fa-images"></i> Photos</h2>
          <div className="media-gallery">
            {photos.map((img, i) => (
              <div key={img.file_path || i} className="media-thumb">
                <img
                  src={`https://image.tmdb.org/t/p/w300${img.file_path}`}
                  alt={`${person.name} photo ${i + 1}`}
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Known For — Movies */}
      {knownMovies.length > 0 && (
        <section className="details-section">
          <h2><i className="fas fa-film"></i> Known For — Movies</h2>
          <div className="movies-grid similar-grid">
            {knownMovies.map((m) => (
              <MovieCard key={m.credit_id || m.id} item={m} mediaType="movie" />
            ))}
          </div>
        </section>
      )}

      {/* Known For — TV */}
      {knownTV.length > 0 && (
        <section className="details-section">
          <h2><i className="fas fa-tv"></i> Known For — TV Shows</h2>
          <div className="movies-grid similar-grid">
            {knownTV.map((show) => (
              <MovieCard key={show.credit_id || show.id} item={show} mediaType="tv" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
