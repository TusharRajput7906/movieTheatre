import { useEffect, useState } from 'react';
import {
  getCustomMovies,
  addCustomMovie,
  updateCustomMovie,
  deleteCustomMovie,
} from '../../services/adminApi.js';

const CATEGORIES = ['Trending', 'Popular', 'Now Playing', 'Top Rated', 'Upcoming', 'Featured', 'Classic', 'Other'];

const EMPTY_FORM = {
  movieId: '', title: '', overview: '', posterUrl: '',
  releaseDate: '', trailerUrl: '', genresStr: '', category: '',
};

/** Extract YouTube video ID from any common YouTube URL format */
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function MovieFormModal({ initial, onClose, onSaved }) {
  const [form,   setForm]   = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const isEdit = Boolean(initial?._id);
  const ytId   = getYouTubeId(form.trailerUrl);
  const set    = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        movieId:     form.movieId.trim(),
        title:       form.title.trim(),
        overview:    form.overview,
        posterUrl:   form.posterUrl.trim(),
        releaseDate: form.releaseDate,
        trailerUrl:  form.trailerUrl.trim(),
        genres:      form.genresStr.split(',').map((g) => g.trim()).filter(Boolean),
        category:    form.category,
      };
      const res = isEdit
        ? await updateCustomMovie(initial._id, payload)
        : await addCustomMovie(payload);
      onSaved(res.data.movie, isEdit);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" style={{ maxWidth: '620px' }}>
        <div className="admin-modal-header">
          <h2><i className={`fas fa-${isEdit ? 'pen' : 'plus'}`}></i> {isEdit ? 'Edit Movie' : 'Add Movie'}</h2>
          <button className="btn-modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>

          {/* Movie ID + Title */}
          <div className="admin-form-row">
            <div className="admin-field">
              <label>Movie ID</label>
              <input value={form.movieId} onChange={(e) => set('movieId', e.target.value)} placeholder="e.g. MOV-001" />
            </div>
            <div className="admin-field">
              <label>Title *</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Movie title" required />
            </div>
          </div>

          {/* Description */}
          <div className="admin-field">
            <label>Description</label>
            <textarea value={form.overview} onChange={(e) => set('overview', e.target.value)} placeholder="Short description of the movie…" />
          </div>

          {/* Poster URL + live preview */}
          <div className="admin-field">
            <label>Poster Image URL</label>
            <input value={form.posterUrl} onChange={(e) => set('posterUrl', e.target.value)} placeholder="https://example.com/poster.jpg" />
            {form.posterUrl && (
              <img
                src={form.posterUrl}
                alt="Poster preview"
                style={{ marginTop: '0.5rem', height: '120px', borderRadius: '6px', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </div>

          {/* Release Date + Category */}
          <div className="admin-form-row">
            <div className="admin-field">
              <label>Release Date</label>
              <input type="date" value={form.releaseDate} onChange={(e) => set('releaseDate', e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">— Select category —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Genre */}
          <div className="admin-field">
            <label>Genre (comma-separated)</label>
            <input value={form.genresStr} onChange={(e) => set('genresStr', e.target.value)} placeholder="Action, Drama, Sci-Fi" />
          </div>

          {/* Trailer YouTube Link + live embed preview */}
          <div className="admin-field">
            <label>Trailer YouTube Link</label>
            <input
              value={form.trailerUrl}
              onChange={(e) => set('trailerUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…  or  https://youtu.be/…"
            />
            {ytId && (
              <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/9' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="Trailer preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                />
              </div>
            )}
          </div>

          {error && <div className="admin-form-error">{error}</div>}

          <div className="admin-form-actions">
            <button type="button" className="btn-cancel-admin" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary-admin" disabled={saving}>
              {saving
                ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
                : <><i className="fas fa-save"></i> {isEdit ? 'Update Movie' : 'Add Movie'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminMovies() {
  const [movies,   setMovies]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [modal,    setModal]    = useState(null); // null | 'add' | movie object
  const [search,   setSearch]   = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    getCustomMovies()
      .then((res) => setMovies(res.data.movies))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (movie, isEdit) => {
    setMovies((prev) =>
      isEdit ? prev.map((m) => (m._id === movie._id ? movie : m)) : [movie, ...prev]
    );
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this movie? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteCustomMovie(id);
      setMovies((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (movie) =>
    setModal({ ...movie, genresStr: movie.genres?.join(', ') || '' });

  const filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.movieId   || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.category  || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="admin-header">
        <h1><i className="fas fa-film"></i> Movies</h1>
        <button className="btn-primary-admin" onClick={() => setModal('add')}>
          <i className="fas fa-plus"></i> Add Movie
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          placeholder="Search by title, ID or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          {filtered.length} movie{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && (
        <div className="admin-loading">
          {[1,2,3,4,5].map((n) => <div key={n} className="admin-sk-row" />)}
        </div>
      )}

      {error && <p className="admin-form-error">{error}</p>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Poster</th>
                <th>ID</th>
                <th>Title</th>
                <th>Release</th>
                <th>Genre</th>
                <th>Category</th>
                <th>Trailer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty">
                      <i className="fas fa-film"></i>
                      <p>No custom movies yet. Click "Add Movie" to create one.</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((movie) => {
                const ytId = getYouTubeId(movie.trailerUrl);
                return (
                  <tr key={movie._id}>
                    <td>
                      {movie.posterUrl
                        ? <img src={movie.posterUrl} alt={movie.title} className="admin-poster" onError={(e) => { e.target.onerror = null; e.target.src = '/img/poster-placeholder.svg'; }} />
                        : <div className="admin-poster-placeholder"><i className="fas fa-image"></i></div>}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {movie.movieId || '—'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '180px' }}>
                      {movie.title}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{movie.releaseDate || '—'}</td>
                    <td style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {movie.genres?.join(', ') || '—'}
                    </td>
                    <td>
                      {movie.category
                        ? <span className="badge-active" style={{ background: 'rgba(74,158,255,0.12)', color: '#4a9eff', borderColor: 'rgba(74,158,255,0.3)' }}>{movie.category}</span>
                        : '—'}
                    </td>
                    <td>
                      {ytId ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${ytId}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#e50914', fontSize: '1.1rem' }}
                          title="Watch trailer"
                        >
                          <i className="fab fa-youtube"></i>
                        </a>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="btn-admin btn-edit" onClick={() => openEdit(movie)}>
                          <i className="fas fa-pen"></i> Edit
                        </button>
                        <button
                          className="btn-admin btn-delete"
                          onClick={() => handleDelete(movie._id)}
                          disabled={deleting === movie._id}
                        >
                          {deleting === movie._id
                            ? <i className="fas fa-spinner fa-spin"></i>
                            : <i className="fas fa-trash"></i>}
                          {' '}Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <MovieFormModal
          initial={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
