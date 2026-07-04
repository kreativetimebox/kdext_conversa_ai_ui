import React, { useState, useEffect } from 'react';
import { Check, Mail, Lock, User, Sparkles, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { signup as apiSignup, login as apiLogin, verifyOtp } from '../../services/api';

export default function SignUp({ navigate, login, showToast }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // OTP State
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Password Strength (0 to 3)
  const [pwdStrength, setPwdStrength] = useState(0);

  useEffect(() => {
    // Simple password strength calculator
    let strength = 0;
    if (formData.password.length >= 8) strength++;
    if (/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password)) strength++;
    if (/[0-9!@#$%^&*]/.test(formData.password)) strength++;
    setPwdStrength(strength);
  }, [formData.password]);

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
      showToast('Account created! Please verify your email.', 'success');
      
      // Move to OTP step instead of immediate login
      setShowOTP(true);
    } catch (err) {
      const msg = err.message || 'Failed to create account. Please try again.';
      setError(msg);
      showToast(msg, 'error');
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
      await verifyOtp(formData.email, otpCode);
      showToast('Email verified successfully! Logging you in...', 'success');

      // Auto sign-in after signup & verification
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
      const msg = err.message || 'OTP verification failed. Please try again.';
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
  
  const getStrengthColor = () => {
    if (pwdStrength === 0) return 'transparent';
    if (pwdStrength === 1) return '#ef4444';
    if (pwdStrength === 2) return '#f59e0b';
    return '#059669';
  };

  return (
    <div className="auth-page-container animate-fade-in">
      <div className="signup-layout-container">
        {/* Left Side: Form */}
        <div className="glass-card auth-card">
          <h2 className="hero-glow-title" style={styles.title}>{showOTP ? 'Verify Email' : 'Create Account'}</h2>
          <p style={styles.sub}>
            {showOTP 
              ? `We sent a verification code to ${formData.email}`
              : 'Start integrating neural speech tools with AI'}
          </p>

          {!showOTP ? (
            <form onSubmit={handleSubmit} style={styles.form} className="animate-fade-in">
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
                <label className="form-label">Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={16} color="var(--text-muted)" style={styles.inputIcon} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
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
                
                {/* Password Strength Indicator */}
                {formData.password.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px', height: '4px' }}>
                    <div style={{ flex: 1, borderRadius: '2px', background: pwdStrength >= 1 ? getStrengthColor() : 'rgba(15,23,42,0.1)', transition: 'all 0.3s' }}></div>
                    <div style={{ flex: 1, borderRadius: '2px', background: pwdStrength >= 2 ? getStrengthColor() : 'rgba(15,23,42,0.1)', transition: 'all 0.3s' }}></div>
                    <div style={{ flex: 1, borderRadius: '2px', background: pwdStrength >= 3 ? getStrengthColor() : 'rgba(15,23,42,0.1)', transition: 'all 0.3s' }}></div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={16} color="var(--text-muted)" style={styles.inputIcon} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="form-input"
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                    className="auth-eye-btn"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                {isSubmitting ? 'Creating Account...' : 'Continue'}
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

              <button
                type="submit"
                disabled={isSubmitting || otpCode.length < 4}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '12px' }}
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
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
              Already have an account?{' '}
              <button onClick={() => navigate('/signin')} style={styles.linkBtn} className="auth-link-btn">
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Benefits Panel */}
        <div className="auth-benefits-col">
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
  page: {},
  container: {},
  card: {},
  title: {
    fontSize: '2rem',
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
    color: '#dc2626',
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
  benefitsCol: {},
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
