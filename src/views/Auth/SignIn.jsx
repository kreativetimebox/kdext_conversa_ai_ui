import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { login as apiLogin } from '../../services/api';

export default function SignIn({ navigate, login, showToast, redirectPath }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setIsSubmitting(true);

    try {
      // POST /login → { access_token, token_type, api_key, expires_in }
      const data = await apiLogin(email, password);

      setLoginSuccess(true);
      showToast('Login successful!', 'success');

      // Store token + api_key in session for use across app
      sessionStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem('api_key', data.api_key);

      setTimeout(() => {
        login({
          name: email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' '),
          email: email,
          api_key: data.api_key,
          access_token: data.access_token,
        });
        navigate(redirectPath || '/dashboard');
      }, 1200);

    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page} className="animate-fade-in">
      <div style={styles.card} className="glass-card">
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.sub}>Sign in to access your Conversa API dashboard</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="form-input"
                style={styles.input}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input"
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                className="auth-eye-btn"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Options */}
          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" style={styles.checkbox} />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => showToast('Password reset coming soon.', 'info')}
              style={styles.linkBtn}
              className="auth-link-btn"
            >
              Forgot password?
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={styles.errorBanner} className="animate-fade-in">
              <AlertCircle size={16} color="#ef4444" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {loginSuccess && (
            <div style={styles.successBanner} className="animate-fade-in">
              <CheckCircle2 size={16} color="var(--success)" />
              <span>Login successful! Redirecting to dashboard...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || loginSuccess}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {isSubmitting ? 'Signing In...' : loginSuccess ? 'Redirecting...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} style={styles.linkBtn} className="auth-link-btn">
            Create one
          </button>
        </div>
      </div>

      {/* Stats Bottom Strip */}
      <div style={styles.statsStrip}>
        <div style={styles.stripItem}>
          <span style={styles.stripNum}>99.5%</span>
          <span style={styles.stripText}>Accuracy</span>
        </div>
        <div style={styles.stripDivider}></div>
        <div style={styles.stripItem}>
          <span style={styles.stripNum}>10K+</span>
          <span style={styles.stripText}>Users</span>
        </div>
        <div style={styles.stripDivider}></div>
        <div style={styles.stripItem}>
          <span style={styles.stripNum}>24/7</span>
          <span style={styles.stripText}>Support</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    width: '100%',
    minHeight: 'calc(100vh - var(--navbar-height))',
    position: 'relative',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
  },
  title: {
    fontSize: '1.8rem',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  sub: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    marginBottom: '32px',
  },
  form: {
    textAlign: 'left',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    pointerEvents: 'none',
  },
  input: {
    paddingLeft: '44px',
    paddingRight: '44px',
  },
  eyeBtn: {
    position: 'absolute',
    right: '16px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    margin: '16px 0 24px 0',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: 'var(--primary)',
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--primary-light)',
    cursor: 'pointer',
    fontSize: 'inherit',
    fontWeight: '600',
    transition: 'var(--transition)',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    color: '#fca5a5',
  },
  successBanner: {
    background: 'var(--success-glow)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
  },
  footer: {
    marginTop: '24px',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  statsStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '40px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-color)',
    borderRadius: '30px',
    padding: '8px 24px',
  },
  stripItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stripNum: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--primary-light)',
  },
  stripText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  stripDivider: {
    width: '1px',
    height: '14px',
    background: 'var(--border-color)',
  }
};
