import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice.js';
import {
  getAllUsers,
  banUser,
  unbanUser,
  deleteUser,
} from '../../services/adminApi.js';

export default function AdminUsers() {
  const currentUser = useSelector(selectUser);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [working,  setWorking]  = useState(null); // id currently being acted on

  useEffect(() => {
    getAllUsers()
      .then((res) => setUsers(res.data.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleBan = async (id) => {
    setWorking(id);
    try {
      const res = await banUser(id);
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data.user : u)));
    } catch (err) {
      alert(err.message || 'Failed to ban user');
    } finally {
      setWorking(null);
    }
  };

  const handleUnban = async (id) => {
    setWorking(id);
    try {
      const res = await unbanUser(id);
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data.user : u)));
    } catch (err) {
      alert(err.message || 'Failed to unban user');
    } finally {
      setWorking(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setWorking(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setWorking(null);
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="admin-header">
        <h1><i className="fas fa-users"></i> Users</h1>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          {filtered.length} user{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && (
        <div className="admin-loading">
          {[1,2,3,4,5,6].map((n) => <div key={n} className="admin-sk-row" />)}
        </div>
      )}

      {error && <p className="admin-form-error">{error}</p>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty">
                      <i className="fas fa-users"></i>
                      <p>No users found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const isSelf = user._id === currentUser?._id;
                  const isBusy = working === user._id;

                  return (
                    <tr key={user._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <i className="fas fa-user-circle" style={{ marginRight: '0.45rem', color: 'var(--text-muted)' }}></i>
                        {user.name}
                        {isSelf && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>(you)</span>}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {user.isAdmin
                          ? <span className="badge-admin"><i className="fas fa-shield-alt"></i> Admin</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>User</span>}
                      </td>
                      <td>
                        {user.isBanned
                          ? <span className="badge-banned"><i className="fas fa-ban"></i> Banned</span>
                          : <span className="badge-active"><i className="fas fa-check-circle"></i> Active</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="admin-actions">
                          {!isSelf && !user.isAdmin && (
                            user.isBanned ? (
                              <button
                                className="btn-admin btn-unban"
                                onClick={() => handleUnban(user._id)}
                                disabled={isBusy}
                              >
                                {isBusy ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-unlock"></i>}
                                {' '}Unban
                              </button>
                            ) : (
                              <button
                                className="btn-admin btn-ban"
                                onClick={() => handleBan(user._id)}
                                disabled={isBusy}
                              >
                                {isBusy ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-ban"></i>}
                                {' '}Ban
                              </button>
                            )
                          )}
                          {!isSelf && !user.isAdmin && (
                            <button
                              className="btn-admin btn-delete"
                              onClick={() => handleDelete(user._id, user.name)}
                              disabled={isBusy}
                            >
                              {isBusy ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                              {' '}Delete
                            </button>
                          )}
                          {(isSelf || user.isAdmin) && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
