import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuth, selectUser, selectIsAdmin, logout, openAuthModal } from '../../store/slices/authSlice.js';
import { selectWatchlist } from '../../store/slices/favoritesSlice.js';
import { searchContent } from '../../store/slices/searchSlice.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import tmdbApi from '../../services/tmdbApi.js';
import '../../styles/navbar.css';

export default function Navbar({ darkMode, setDarkMode }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isAuth    = useSelector(selectIsAuth);
  const user      = useSelector(selectUser);
  const isAdmin   = useSelector(selectIsAdmin);
  const watchlist = useSelector(selectWatchlist);

  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [searchVal,    setSearchVal]    = useState('');
  const [suggestions,  setSuggestions]  = useState([]);
  const [showSuggest,  setShowSuggest]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef  = useRef(null);
  const debounced  = useDebounce(searchVal, 350);

  // Shrink navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  // Live search suggestions
  useEffect(() => {
    if (debounced.length < 2) { setSuggestions([]); return; }
    tmdbApi.get('/search/multi', { params: { query: debounced, page: 1 } })
      .then((res) => setSuggestions(res.data.results.slice(0, 6)))
      .catch(() => setSuggestions([]));
  }, [debounced]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => { if (!searchRef.current?.contains(e.target)) setShowSuggest(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    dispatch(searchContent({ query: searchVal.trim(), type: 'multi', page: 1 }));
    navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    setShowSuggest(false);
    setSearchVal('');
  };

  const pickSuggestion = (item) => {
    const path = item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
    navigate(path);
    setShowSuggest(false);
    setSearchVal('');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="nav-container">

        {/* Logo */}
        <Link to="/" className="nav-logo">
          <i className="fas fa-film"></i>
          <span>Movie<strong>Theatre</strong></span>
        </Link>

        {/* Search Bar */}
        <div className="nav-search" ref={searchRef}>
          <form onSubmit={handleSearch}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search movies, TV shows…"
              value={searchVal}
              onChange={(e) => { setSearchVal(e.target.value); setShowSuggest(true); }}
              onFocus={() => setShowSuggest(true)}
              autoComplete="off"
            />
          </form>
          {/* Suggestions dropdown */}
          {showSuggest && suggestions.length > 0 && (
            <div className="search-dropdown">
              {suggestions.map((item) => (
                <button key={item.id} className="suggest-item" onClick={() => pickSuggestion(item)}>
                  <img
                    src={item.poster_path
                      ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                      : 'https://via.placeholder.com/40x60?text=N/A'}
                    alt={item.title || item.name}
                    loading="lazy"
                  />
                  <div>
                    <strong>{item.title || item.name}</strong>
                    <span>{item.media_type?.toUpperCase()} {item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Nav Links */}
        <ul className={`nav-links${mobileOpen ? ' open' : ''}`}>
          <li><Link to="/"         className={`nav-link ${isActive('/')}`}>Home</Link></li>
          <li><Link to="/movies"   className={`nav-link ${isActive('/movies')}`}>Movies</Link></li>
          <li><Link to="/tv"       className={`nav-link ${isActive('/tv')}`}>TV Shows</Link></li>
          <li><Link to="/search"   className={`nav-link ${isActive('/search')}`}>Search</Link></li>
          <li><Link to="/people"   className={`nav-link ${isActive('/people')}`}>People</Link></li>
          <li><Link to="/favorites" className={`nav-link ${isActive('/favorites')}`}>Favorites</Link></li>
        </ul>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Theme Toggle */}
          <button
            className="btn-icon"
            onClick={() => setDarkMode((p) => !p)}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            <i className={`fas fa-${darkMode ? 'sun' : 'moon'}`}></i>
          </button>

          {/* Watchlist Badge */}
          <Link to="/favorites" className="btn-icon watchlist-btn" title="Watchlist">
            <i className="fas fa-bookmark"></i>
            {watchlist.length > 0 && <span className="badge">{watchlist.length}</span>}
          </Link>

          {/* Auth */}
          {isAuth ? (
            <div className="user-menu-wrap">
              <button className="user-avatar-btn" onClick={() => setUserMenuOpen((p) => !p)}>
                <i className="fas fa-user-circle"></i>
                <span>{user?.name?.split(' ')[0]}</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <Link to="/favorites" onClick={() => setUserMenuOpen(false)}>
                    <i className="fas fa-heart"></i> My Favorites
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setUserMenuOpen(false)}>
                      <i className="fas fa-shield-alt"></i> Admin Panel
                    </Link>
                  )}
                  <button onClick={() => { dispatch(logout()); setUserMenuOpen(false); }}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-login" onClick={() => dispatch(openAuthModal('login'))}>
              <i className="fas fa-user"></i> Login
            </button>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`hamburger${mobileOpen ? ' open' : ''}`}
          onClick={() => setMobileOpen((p) => !p)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
