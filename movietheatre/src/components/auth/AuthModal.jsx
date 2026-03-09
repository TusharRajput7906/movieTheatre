import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectAuthModalOpen, selectAuthTab, selectAuthLoading, selectAuthError,
  closeAuthModal, setAuthTab, loginSuccess, setAuthLoading, setAuthError,
} from '../../store/slices/authSlice.js';
import { showToast } from '../../store/slices/uiSlice.js';
import { loginUser, registerUser } from '../../services/authApi.js';

export default function AuthModal() {
  const dispatch = useDispatch();
  const open     = useSelector(selectAuthModalOpen);
  const tab      = useSelector(selectAuthTab);
  const loading  = useSelector(selectAuthLoading);
  const error    = useSelector(selectAuthError);

  const [loginData, setLoginData]   = useState({ email: '', password: '' });
  const [regData,   setRegData]     = useState({ name: '', email: '', password: '' });

  if (!open) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(setAuthLoading(true));
    try {
      const res = await loginUser(loginData);
      dispatch(loginSuccess(res.data));
      dispatch(showToast(`Welcome back, ${res.data.user.name}!`, 'success'));
      setLoginData({ email: '', password: '' });
    } catch (err) {
      dispatch(setAuthError(err.message));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regData.password.length < 8) {
      dispatch(setAuthError('Password must be at least 8 characters'));
      return;
    }
    dispatch(setAuthLoading(true));
    try {
      const res = await registerUser(regData);
      dispatch(loginSuccess(res.data));
      dispatch(showToast(`Account created! Welcome, ${res.data.user.name}!`, 'success'));
      setRegData({ name: '', email: '', password: '' });
    } catch (err) {
      dispatch(setAuthError(err.message));
    }
  };

  return (
    <div className="auth-modal" role="dialog" aria-label="Authentication">
      <div className="auth-backdrop" onClick={() => dispatch(closeAuthModal())} />
      <div className="auth-box">
        <button className="auth-close" onClick={() => dispatch(closeAuthModal())} aria-label="Close">
          <i className="fas fa-times"></i>
        </button>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => dispatch(setAuthTab('login'))}>
            Login
          </button>
          <button className={tab === 'register' ? 'active' : ''} onClick={() => dispatch(setAuthTab('register'))}>
            Register
          </button>
        </div>

        {error && <div className="auth-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

        {/* Login Form */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-logo"><i className="fas fa-film"></i> MovieTheatre</div>
            <h2>Welcome Back</h2>
            <p className="auth-sub">Sign in to access your watchlist &amp; favorites</p>

            <div className="form-group">
              <label><i className="fas fa-envelope"></i> Email</label>
              <input
                type="email" required placeholder="you@example.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label><i className="fas fa-lock"></i> Password</label>
              <input
                type="password" required placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Signing in…</> : 'Sign In'}
            </button>
            <p className="auth-switch">
              No account?{' '}
              <button type="button" onClick={() => dispatch(setAuthTab('register'))}>Register here</button>
            </p>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-logo"><i className="fas fa-film"></i> MovieTheatre</div>
            <h2>Create Account</h2>
            <p className="auth-sub">Join MovieTheatre and never miss a movie</p>

            <div className="form-group">
              <label><i className="fas fa-user"></i> Full Name</label>
              <input
                type="text" required placeholder="John Doe"
                value={regData.name}
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label><i className="fas fa-envelope"></i> Email</label>
              <input
                type="email" required placeholder="you@example.com"
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label><i className="fas fa-lock"></i> Password</label>
              <input
                type="password" required placeholder="Min. 8 characters" minLength={8}
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Creating…</> : 'Create Account'}
            </button>
            <p className="auth-switch">
              Have an account?{' '}
              <button type="button" onClick={() => dispatch(setAuthTab('login'))}>Login here</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
