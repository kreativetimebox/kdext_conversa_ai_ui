import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import { getProfile } from './services/api';

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

// New Views
import Chat from './views/Chat';
import Translate from './views/Translate';
import Profile from './views/Resources/Profile';
import Settings from './views/Resources/Settings';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRestoring, setIsRestoring] = useState(!!sessionStorage.getItem('access_token'));

  // Sync state with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Session Recovery
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const storedApiKey = sessionStorage.getItem('api_key');
    if (token && !user) {
      getProfile(token)
        .then(profile => {
          setUser({ ...profile, api_key: storedApiKey || profile.api_key });
        })
        .catch(err => {
          console.error('Session recovery failed:', err);
          sessionStorage.removeItem('access_token');
        })
        .finally(() => {
          setIsRestoring(false);
        });
    } else {
      setIsRestoring(false);
    }
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

  // Initialize History Log from localStorage
  const [historyData, setHistoryData] = useState(() => {
    const local = localStorage.getItem('conversa_history');
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem('conversa_history', JSON.stringify(historyData));
  }, [historyData]);

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

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Route resolver helper
  const renderView = () => {
    if (isRestoring) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Restoring session...</div>;

    // Normalise pathname
    let path = currentPath.toLowerCase().trim();
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Protected Route Redirect to Sign In
    const protectedPaths = ['/dashboard', '/history', '/services', '/services/hub', '/services/tts', '/services/stt', '/chat', '/translate', '/profile', '/settings'];
    const isProtected = protectedPaths.some(p => path === p || path.startsWith('/chat/'));

    if (isProtected && !user) {
      return <SignIn navigate={navigate} login={login} showToast={showToast} redirectPath={path} />;
    }

    switch (true) {
      case path === '/':
      case path === '/home':
        return <LandingPage navigate={navigate} showToast={showToast} />;
      case path === '/documentation':
        return <Documentation navigate={navigate} showToast={showToast} />;
      case path === '/api-reference':
        return <ApiReference navigate={navigate} showToast={showToast} />;
      case path === '/help-center':
        return <HelpCenter navigate={navigate} showToast={showToast} />;
      case path === '/system-status':
        return <SystemStatus showToast={showToast} />;
      case path === '/about-us':
        return <AboutUs navigate={navigate} />;
      case path === '/contact':
        return <Contact showToast={showToast} />;
      case path === '/signin':
        return <SignIn navigate={navigate} login={login} showToast={showToast} />;
      case path === '/signup':
        return <SignUp navigate={navigate} login={login} showToast={showToast} />;
      
      // Protected Routes below
      case path === '/dashboard':
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
      case path === '/history':
        return <History historyData={historyData} showToast={showToast} />;
      case path === '/services':
      case path === '/services/hub':
        return <VoiceTools showToast={showToast} defaultSubView="hub" user={user} setHistoryData={setHistoryData} />;
      case path === '/services/tts':
        return <VoiceTools showToast={showToast} defaultSubView="tts" user={user} setHistoryData={setHistoryData} />;
      case path === '/services/stt':
        return <VoiceTools showToast={showToast} defaultSubView="stt" user={user} setHistoryData={setHistoryData} />;
      case path === '/chat' || path.startsWith('/chat/'):
        return <Chat navigate={navigate} user={user} showToast={showToast} currentPath={path} />;
      case path === '/translate':
        return <Translate user={user} showToast={showToast} />;
      case path === '/profile':
        return <Profile user={user} showToast={showToast} />;
      case path === '/settings':
        return <Settings user={user} showToast={showToast} />;
      default:
        // 404/Fallback
        return <LandingPage navigate={navigate} showToast={showToast} />;
    }
  };

  const path = currentPath.toLowerCase().trim();
  const protectedPaths = ['/dashboard', '/history', '/services', '/services/hub', '/services/tts', '/services/stt', '/chat', '/translate', '/profile', '/settings'];
  const isProtected = protectedPaths.some(p => path === p || path.startsWith('/chat/'));
  
  // Use new Sidebar Layout for logged-in protected routes
  const useAppLayout = isProtected && user && !isRestoring;

  return (
    <div style={useAppLayout ? {} : styles.appWrapper} className={useAppLayout ? "app-container" : ""}>
      {/* Background decoration elements */}
      <div className="bg-glow-wrapper">
        <div className="bg-glow-purple"></div>
        <div className="bg-glow-pink"></div>
      </div>
      <div className="bg-grid-overlay"></div>

      {useAppLayout ? (
        <>
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            toggleSidebar={toggleSidebar} 
            onSignOut={logout} 
            navigate={navigate}
            currentPath={currentPath}
            user={user}
          />
          <div className="main-content">
            {renderView()}
          </div>
        </>
      ) : (
        <>
          {/* Global Navbar for public pages */}
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

          {/* Global Footer for public pages */}
          <Footer navigate={navigate} />
        </>
      )}

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
    boxShadow: '0 10px 25px rgba(15,23,42,0.12)',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(10px)',
  },
  toastText: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    fontWeight: '500',
  }
};
