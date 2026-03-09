import { Link } from 'react-router-dom';
import { profileUrl, PERSON_PLACEHOLDER } from '../../config/tmdb.js';

export default function PersonCard({ person }) {
  const knownFor = person.known_for?.slice(0, 2) || [];

  return (
    <Link to={`/person/${person.id}`} className="person-card">
      <div className="person-card-img">
        <img
          src={profileUrl(person.profile_path)}
          alt={person.name}
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = PERSON_PLACEHOLDER; }}
        />
      </div>
      <div className="person-card-info">
        <h4 className="person-card-name">{person.name}</h4>
        <p className="person-card-dept">{person.known_for_department}</p>
        {knownFor.length > 0 && (
          <p className="person-card-known">
            {knownFor.map((k) => k.title || k.name).join(', ')}
          </p>
        )}
      </div>
    </Link>
  );
}
