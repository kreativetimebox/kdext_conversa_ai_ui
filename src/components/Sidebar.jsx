import React, { useState, useEffect } from 'react';
import { getConversations, deleteConversation } from '../services/api';

function Sidebar({ isCollapsed, toggleSidebar, onSignOut, navigate, currentPath }) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = sessionStorage.getItem('access_token');
      if (token) {
        try {
          const res = await getConversations(token);
          if (res && Array.isArray(res)) {
            setConversations(res);
          } else if (res && res.conversations) {
            setConversations(res.conversations);
          }
        } catch (e) {
          console.error("Error fetching conversations:", e);
        }
      }
    };
    fetchHistory();
  }, [currentPath]);

  const navItems = [
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/translate', label: 'Translate', icon: '🌐' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/services/hub', label: 'Voice Tools', icon: '🎙️' },
    { path: '/history', label: 'History Logs', icon: '🕰️' }
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <div className="navbar-brand">Conversa AI</div>}
        <button className="btn btn-text" onClick={toggleSidebar}>
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>
      
      <div className="sidebar-nav">
        {navItems.map(item => (
          <a
            key={item.path}
            onClick={(e) => { e.preventDefault(); navigate(item.path); }}
            href={item.path}
            className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </a>
        ))}

        {!isCollapsed && conversations.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 16px', marginBottom: '8px', fontWeight: 'bold' }}>
              Recent Chats
            </div>
            {conversations.slice(0, 5).map(c => (
              <a
                key={c.conversation_id || c.id}
                onClick={(e) => { e.preventDefault(); navigate(`/chat/${c.conversation_id || c.id}`); }}
                href={`/chat/${c.conversation_id || c.id}`}
                className={`nav-item ${currentPath === `/chat/${c.conversation_id || c.id}` ? 'active' : ''}`}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                <span className="nav-icon" style={{ fontSize: '0.9rem' }}>📝</span>
                <span className="nav-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || 'Untitled'}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-footer" style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
         <a
            onClick={(e) => { e.preventDefault(); navigate('/profile'); }}
            href="/profile"
            className="nav-item"
            style={{ padding: '8px 12px' }}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </a>
          <a
            onClick={(e) => { e.preventDefault(); navigate('/settings'); }}
            href="/settings"
            className="nav-item"
            style={{ padding: '8px 12px' }}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </a>
          <button className="btn btn-outline" style={{ width: '100%', marginTop: '8px' }} onClick={onSignOut}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Sign Out</span>
          </button>
      </div>
    </aside>
  );
}

export default Sidebar;
