import { Routes, Route } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import Toast from './components/ui/Toast.jsx';
import AuthModal from './components/auth/AuthModal.jsx';
import TrailerModal from './components/ui/TrailerModal.jsx';
import WatchModal from './components/ui/WatchModal.jsx';
import AppLoader from './components/ui/AppLoader.jsx';
import { loadFavoritesFromStorage, clearFavorites, fetchFavorites } from './store/slices/favoritesSlice.js';
import { loadAuthFromStorage, selectUser } from './store/slices/authSlice.js';

// Route-level code splitting — each page is a separate JS chunk loaded on demand
const Home           = lazy(() => import('./pages/Home.jsx'));
const Movies         = lazy(() => import('./pages/Movies.jsx'));
const TVShows        = lazy(() => import('./pages/TVShows.jsx'));
const Search         = lazy(() => import('./pages/Search.jsx'));
const Details        = lazy(() => import('./pages/Details.jsx'));
const Favorites      = lazy(() => import('./pages/Favorites.jsx'));
const People         = lazy(() => import('./pages/People.jsx'));
const PersonDetails  = lazy(() => import('./pages/PersonDetails.jsx'));
const AdminLayout    = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminMovies    = lazy(() => import('./pages/admin/AdminMovies.jsx'));
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers.jsx'));

function App() {
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);
  const [appLoading, setAppLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('mt-theme') !== 'light'
  );

  // Boot: restore auth session
  useEffect(() => {
    dispatch(loadAuthFromStorage());
    const timer = setTimeout(() => setAppLoading(false), 1600);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // Load this user's favorites on login; clear them on logout
  useEffect(() => {
    if (user?._id) {
      dispatch(loadFavoritesFromStorage(user._id)); // instant from cache
      dispatch(fetchFavorites());                    // then sync with DB
    } else {
      dispatch(clearFavorites());
    }
  }, [user, dispatch]);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
    localStorage.setItem('mt-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (appLoading) return <AppLoader />;

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="app-main">
        {/* Suspense boundary: shows a minimal spinner while a lazy page chunk loads */}
        <Suspense fallback={<div className="page-suspense-loader"><i className="fas fa-circle-notch fa-spin"></i></div>}>
          <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/movies"      element={<Movies />} />
          <Route path="/tv"          element={<TVShows />} />
          <Route path="/search"      element={<Search />} />
          <Route path="/movie/:id"   element={<Details type="movie" />} />
          <Route path="/tv/:id"      element={<Details type="tv" />} />
          <Route path="/favorites"   element={<Favorites />} />
          <Route path="/people"      element={<People />} />
          <Route path="/person/:id"  element={<PersonDetails />} />
          {/* Admin Panel */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index             element={<AdminDashboard />} />
            <Route path="movies"     element={<AdminMovies />} />
            <Route path="users"      element={<AdminUsers />} />
          </Route>
          {/* Catch-all → redirect home */}
          <Route path="*"            element={<Home />} />
        </Routes>
        </Suspense>
      </main>

      <Footer />
      <Toast />
      <AuthModal />
      <TrailerModal />
      <WatchModal />
    </>
  );
}

export default App;
