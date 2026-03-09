import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openAuthModal } from '../../store/slices/authSlice.js';

export default function Footer() {
  const dispatch = useDispatch();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <i className="fas fa-film"></i> Movie<strong>Theatre</strong>
          </Link>
          <p>Discover, watch trailers, and manage your movie universe. Powered by TMDB.</p>
          <div className="footer-socials">
            <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" aria-label="GitHub"><i className="fab fa-github"></i></a>
            <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/movies">Movies</Link></li>
            <li><Link to="/tv">TV Shows</Link></li>
            <li><Link to="/search">Search</Link></li>
            <li><Link to="/people">People</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Account</h4>
          <ul>
            <li><Link to="/favorites">My Favorites</Link></li>
            <li><button onClick={() => dispatch(openAuthModal('login'))}>Login / Register</button></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Info</h4>
          <ul>
            <li>
              <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
                TMDB API
              </a>
            </li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Use</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {year} MovieTheatre &mdash; Built with{' '}
          <i className="fas fa-heart" style={{ color: 'var(--accent)' }}></i>{' '}
          | Data provided by{' '}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>
        </p>
        <p className="footer-disclaimer">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}
