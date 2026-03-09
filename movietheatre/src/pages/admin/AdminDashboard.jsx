import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../services/adminApi.js';

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getAdminStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="admin-header">
        <h1><i className="fas fa-chart-bar"></i> Dashboard</h1>
      </div>

      {loading && (
        <div className="admin-loading">
          {[1, 2, 3].map((n) => <div key={n} className="admin-sk-row" style={{ height: '110px', borderRadius: '12px' }} />)}
        </div>
      )}

      {error && <p className="admin-form-error">{error}</p>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card blue">
            <i className="fas fa-users stat-icon"></i>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card orange">
            <i className="fas fa-ban stat-icon"></i>
            <div className="stat-value">{stats.bannedUsers}</div>
            <div className="stat-label">Banned Users</div>
          </div>
          <div className="stat-card red">
            <i className="fas fa-film stat-icon"></i>
            <div className="stat-value">{stats.totalMovies}</div>
            <div className="stat-label">Custom Movies</div>
          </div>
          <div className="stat-card green">
            <i className="fas fa-user-shield stat-icon"></i>
            <div className="stat-value">{stats.totalUsers - stats.bannedUsers}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
      )}

      {/* Quick-links */}
      <div className="admin-header" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.1rem' }}><i className="fas fa-bolt"></i> Quick Actions</h1>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link to="/admin/movies" className="btn-primary-admin">
          <i className="fas fa-plus"></i> Add Movie
        </Link>
        <Link to="/admin/users" className="btn-primary-admin" style={{ background: '#4a9eff' }}>
          <i className="fas fa-users"></i> Manage Users
        </Link>
      </div>
    </>
  );
}
