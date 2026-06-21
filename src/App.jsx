import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Views
import LandingPage from './views/LandingPage';
import Documentation from './views/Documentation';
import ApiReference from './views/ApiReference';
import HelpCenter from './views/Resources/HelpCenter';
import SystemStatus from './views/Resources/SystemStatus';
import AboutUs from './views/Resources/AboutUs';
import Contact from './views/Resources/Contact';
import SignIn from './views/Auth/SignIn';
import SignUp from './views/Auth/SignUp';
import Dashboard from './views/Dashboard';
import History from './views/History';
import VoiceTools from './views/VoiceTools';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Sync state with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Centralized navigation helper
  const navigate = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Centralized API keys state
  const [apiKeys, setApiKeys] = useState([
    { 
      id: 'prod_key_1', 
      name: 'Production Key', 
      key: 'fl_live_AX45K89DB32P01Z9', 
      status: 'Active', 
      created: 'Jan 13, 2026', 
      visible: false 
    }
  ]);

  // Centralized History Log matching video data
  const [historyData, setHistoryData] = useState([
    { id: 1, name: 'welcome_prompt.wav', type: 'Text to Speech', submitted: '6/13/2026, 6:34:45 PM', time: '4.5s', status: 'Completed' },
    { id: 2, name: 'meeting_minutes.mp3', type: 'Speech to Text', submitted: '6/13/2026, 10:48:38 AM', time: '120.2s', status: 'Completed' },
    { id: 3, name: 'interactive_ivr.wav', type: 'Text to Speech', submitted: '6/13/2026, 10:40:34 AM', time: '12.8s', status: 'Completed' },
    { id: 4, name: 'call_center_log_04.mp3', type: 'Speech to Text', submitted: '6/13/2026, 10:43:02 AM', time: '345.1s', status: 'Completed' },
    { id: 5, name: 'podcast_episode_12.mp3', type: 'Speech to Text', submitted: '6/13/2026, 10:41:20 AM', time: '1800.5s', status: 'Completed' },
    { id: 6, name: 'checkout_confirm.wav', type: 'Text to Speech', submitted: '6/13/2026, 10:40:02 AM', time: '3.1s', status: 'Completed' }
  ]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('api_key');
    navigate('/');
  };

  // Toast notifications manager
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Route resolver helper
  const renderView = () => {
    // Normalise pathname
    let path = currentPath.toLowerCase().trim();
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Protected Route Redirect to Sign In
    const protectedPaths = ['/dashboard', '/history', '/services', '/services/hub', '/services/tts', '/services/stt'];
    if (protectedPaths.includes(path) && !user) {
      return <SignIn navigate={navigate} login={login} showToast={showToast} redirectPath={path} />;
    }

    switch (path) {
      case '/':
      case '/home':
        return <LandingPage navigate={navigate} showToast={showToast} />;
      case '/documentation':
        return <Documentation navigate={navigate} showToast={showToast} />;
      case '/api-reference':
        return <ApiReference navigate={navigate} showToast={showToast} />;
      case '/help-center':
        return <HelpCenter navigate={navigate} showToast={showToast} />;
      case '/system-status':
        return <SystemStatus showToast={showToast} />;
      case '/about-us':
        return <AboutUs navigate={navigate} />;
      case '/contact':
        return <Contact showToast={showToast} />;
      case '/signin':
        return <SignIn navigate={navigate} login={login} showToast={showToast} />;
      case '/signup':
        return <SignUp navigate={navigate} login={login} showToast={showToast} />;
      case '/dashboard':
        return (
          <Dashboard 
            navigate={navigate} 
            user={user}
            apiKeys={apiKeys} 
            setApiKeys={setApiKeys}
            historyData={historyData}
            setHistoryData={setHistoryData}
            showToast={showToast}
          />
        );
      case '/history':
        return <History historyData={historyData} showToast={showToast} />;
      case '/services':
      case '/services/hub':
        return <VoiceTools showToast={showToast} defaultSubView="hub" user={user} setHistoryData={setHistoryData} />;
      case '/services/tts':
        return <VoiceTools showToast={showToast} defaultSubView="tts" user={user} setHistoryData={setHistoryData} />;
      case '/services/stt':
        return <VoiceTools showToast={showToast} defaultSubView="stt" user={user} setHistoryData={setHistoryData} />;
      default:
        // 404/Fallback
        return <LandingPage navigate={navigate} showToast={showToast} />;
    }
  };

  return (
    <div style={styles.appWrapper}>
      {/* Background decoration elements */}
      <div className="bg-glow-wrapper">
        <div className="bg-glow-purple"></div>
        <div className="bg-glow-pink"></div>
      </div>
      <div className="bg-grid-overlay"></div>

      {/* Global Navbar */}
      <Navbar 
        currentPath={currentPath} 
        navigate={navigate} 
        user={user} 
        logout={logout}
        showToast={showToast}
      />

      {/* Core Dynamic Content */}
      <div style={styles.mainContent}>
        {renderView()}
      </div>

      {/* Global Footer */}
      <Footer navigate={navigate} />

      {/* Toast Notification Container */}
      <div style={styles.toastContainer}>
        {toasts.map((t) => (
          <div 
            key={t.id} 
            onClick={() => removeToast(t.id)}
            style={{
              ...styles.toast,
              borderLeftColor: t.type === 'success' ? 'var(--success)' : t.type === 'error' ? 'var(--error)' : 'var(--info)'
            }}
            className="glass-card animate-fade-in"
          >
            <div style={styles.toastText}>{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  appWrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    position: 'relative',
  },
  mainContent: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
  },
  toastContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '320px',
    width: '100%',
  },
  toast: {
    padding: '16px 20px',
    cursor: 'pointer',
    borderLeft: '4px solid transparent',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(15, 14, 28, 0.95)',
    backdropFilter: 'blur(10px)',
  },
  toastText: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    fontWeight: '500',
  }
};
