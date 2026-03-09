import { NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAdmin, selectIsAuth } from '../../store/slices/authSlice.js';

export default function AdminLayout() {
  const isAuth  = useSelector(selectIsAuth);
  const isAdmin = useSelector(selectIsAdmin);

  if (!isAuth || !isAdmin) {
    return (
      <div className="admin-access-denied">
        <i className="fas fa-lock"></i>
        <h2>Access Denied</h2>
        <p>You must be an administrator to view this page.</p>
        <a href="/" className="btn-primary-admin" style={{ marginTop: '0.5rem', textDecoration: 'none' }}>
          <i className="fas fa-home"></i> Go Home
        </a>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">Admin Panel</div>
        <NavLink to="/admin"          end className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
          <i className="fas fa-chart-bar"></i> Dashboard
        </NavLink>
        <NavLink to="/admin/movies"   className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
          <i className="fas fa-film"></i> Movies
        </NavLink>
        <NavLink to="/admin/users"    className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
          <i className="fas fa-users"></i> Users
        </NavLink>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
