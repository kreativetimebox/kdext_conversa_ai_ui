import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { login as apiLogin, verifyOtp } from '../../services/api';

export default function SignIn({ navigate, login, showToast, redirectPath }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loadingDots, setLoadingDots] = useState('.');

  // Cycle the trailing dots (. / .. / ...) while a submit is in flight
  useEffect(() => {
    if (!isSubmitting) {
      setLoadingDots('.');
      return;
    }
    const interval = setInterval(() => {
      setLoadingDots((prev) => (prev.length >= 3 ? '.' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [isSubmitting]);
  
  // OTP State
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');

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

      // Brief pause so the success state is visible, then navigate. This was
      // 1200ms — a full extra second of artificial wait the user felt as
      // "login is slow"; 400ms still flashes the confirmation without dragging.
      setTimeout(() => {
        login({
          name: email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' '),
          email: email,
          api_key: data.api_key,
          access_token: data.access_token,
        });
        navigate(redirectPath || '/dashboard');
      }, 400);

    } catch (err) {
      const msg = err.message || 'Invalid email or password. Please try again.';
      setError(msg);
      showToast(msg, 'error');
      
      // If the error indicates email is not verified, show OTP screen
      if (msg.toLowerCase().includes('verified') || msg.toLowerCase().includes('otp')) {
        setShowOTP(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      setError('Please enter a 6-digit OTP code.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await verifyOtp(email, otpCode);
      showToast('Email verified successfully! Logging you in...', 'success');

      // Try logging in again now that they are verified
      const data = await apiLogin(email, password);

      setLoginSuccess(true);
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
      }, 400);

    } catch (err) {
      const msg = err.message || 'OTP verification failed. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container animate-fade-in">
      <div className="glass-card auth-card">
        <h2 style={styles.title}>{showOTP ? 'Verify Email' : 'Welcome Back'}</h2>
        <p style={styles.sub}>
          {showOTP 
            ? `Please enter the verification code sent to ${email}`
            : 'Sign in to access your Conversa API dashboard'}
        </p>

        {!showOTP ? (
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
                <span>Login successful! Redirecting...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || loginSuccess}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            >
              {isSubmitting ? `Signing In${loadingDots}` : loginSuccess ? 'Redirecting...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} style={styles.form} className="animate-fade-in">
            <div className="form-group" style={{ textAlign: 'center' }}>
              <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 16px auto' }} />
              <label className="form-label">Enter 6-digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0 0 0"
                className="form-input"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 'bold', padding: '16px' }}
              />
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
                <span>Verified & logged in! Redirecting...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || otpCode.length < 6 || loginSuccess}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '12px' }}
            >
              {isSubmitting ? `Verifying${loadingDots}` : 'Verify & Sign In'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button type="button" onClick={() => showToast('New code sent', 'info')} className="auth-link-btn" style={styles.linkBtn}>
                Resend Code
              </button>
            </div>
          </form>
        )}

        {!showOTP && (
          <div style={styles.footer}>
            Don't have an account?{' '}
            <button onClick={() => navigate('/signup')} style={styles.linkBtn} className="auth-link-btn">
              Create one
            </button>
          </div>
        )}
      </div>

      {/* Stats Bottom Strip */}
      <div className="auth-stats-strip">
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
  page: {},
  card: {},
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
    color: '#dc2626',
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
  statsStrip: {},
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
