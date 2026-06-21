import React, { useState } from 'react';
import { Check, Mail, Lock, User, Sparkles, AlertCircle } from 'lucide-react';
import { signup as apiSignup, login as apiLogin } from '../../services/api';

export default function SignUp({ navigate, login, showToast }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      showToast('Passwords do not match!', 'error');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      showToast('Password too short (min 8 characters).', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // POST /signup
      await apiSignup(formData.email, formData.password);
      showToast('Account created! Signing you in...', 'success');

      // Auto sign-in after signup
      const loginData = await apiLogin(formData.email, formData.password);

      sessionStorage.setItem('access_token', loginData.access_token);
      sessionStorage.setItem('api_key', loginData.api_key);

      login({
        name: formData.email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' '),
        email: formData.email,
        api_key: loginData.api_key,
        access_token: loginData.access_token,
      });
      navigate('/dashboard');

    } catch (err) {
      const msg = err.message || 'Failed to create account. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    'Free API key issued on signup',
    'Access to TTS synthesis & STT transcribing models',
    'Complete interactive API sandbox documentation',
    '24/7 developer email & chat support'
  ];

  return (
    <div style={styles.page} className="animate-fade-in">
      <div style={styles.container}>
        {/* Left Side: Form */}
        <div style={styles.card} className="glass-card">
          <h2 style={styles.title}>Create Your Account</h2>
          <p style={styles.sub}>Start integrating neural speech tools with AI</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} color="var(--text-muted)" style={styles.inputIcon} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="form-input"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(min 8 chars)</span></label>
              <div style={styles.inputWrapper}>
                <Lock size={16} color="var(--text-muted)" style={styles.inputIcon} />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  className="form-input"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} color="var(--text-muted)" style={styles.inputIcon} />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="form-input"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div style={styles.errorBanner} className="animate-fade-in">
                <AlertCircle size={16} color="#ef4444" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '12px' }}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={styles.footer}>
            Already have an account?{' '}
            <button onClick={() => navigate('/signin')} style={styles.linkBtn} className="auth-link-btn">
              Sign In
            </button>
          </div>
        </div>

        {/* Right Side: Benefits Panel */}
        <div style={styles.benefitsCol}>
          <div style={styles.benefitsHeader}>
            <Sparkles size={20} color="var(--primary-light)" />
            <h3 style={styles.benefitsTitle}>What you'll get:</h3>
          </div>

          <ul style={styles.benefitsList}>
            {benefits.map((benefit, idx) => (
              <li key={idx} style={styles.benefitItem}>
                <div style={styles.checkCircle}>
                  <Check size={12} color="var(--success)" />
                </div>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    width: '100%',
    minHeight: 'calc(100vh - var(--navbar-height))',
  },
  container: {
    display: 'flex',
    gap: '48px',
    width: '100%',
    maxWidth: '820px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
    marginBottom: '28px',
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
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    color: '#fca5a5',
    textAlign: 'left',
  },
  footer: {
    marginTop: '24px',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
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
  benefitsCol: {
    flex: '1',
    minWidth: '260px',
    maxWidth: '320px',
    textAlign: 'left',
  },
  benefitsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  benefitsTitle: {
    fontSize: '1.2rem',
    color: 'var(--text-primary)',
    fontWeight: '700',
  },
  benefitsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  checkCircle: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }
};
