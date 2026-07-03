import React, { useState, useEffect } from 'react';
import { getConversations, deleteConversation } from '../services/api';

const getGroup = (updatedAtStr) => {
  if (!updatedAtStr) return 'Older';
  const updatedDate = new Date(updatedAtStr);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const compareDate = new Date(updatedDate.getFullYear(), updatedDate.getMonth(), updatedDate.getDate());
  
  const diffTime = today.getTime() - compareDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return 'Previous 7 Days';
  } else {
    return 'Older';
  }
};

function Sidebar({ isCollapsed, toggleSidebar, onSignOut, navigate, currentPath, user }) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const apiKey = sessionStorage.getItem('api_key') || user?.api_key;
      if (apiKey) {
        try {
          const res = await getConversations(apiKey);
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
  }, [currentPath, user]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    const apiKey = sessionStorage.getItem('api_key') || user?.api_key;
    if (apiKey) {
      try {
        await deleteConversation(apiKey, id);
        if (currentPath === `/chat/${id}`) {
          navigate('/chat');
        } else {
          const res = await getConversations(apiKey);
          if (res && Array.isArray(res)) {
            setConversations(res);
          } else if (res && res.conversations) {
            setConversations(res.conversations);
          }
        }
      } catch (err) {
        console.error("Failed to delete conversation:", err);
      }
    }
  };

  const navItems = [
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/translate', label: 'Translate', icon: '🌐' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/services/hub', label: 'Voice Tools', icon: '🎙️' },
    { path: '/history', label: 'History Logs', icon: '🕰️' }
  ];

  // Group conversations by time period
  const grouped = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': []
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
  });

  sortedConversations.slice(0, 20).forEach(c => {
    const group = getGroup(c.updated_at || c.created_at);
    grouped[group].push(c);
  });

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-header">
        {!isCollapsed && <div className="navbar-brand">Conversa AI</div>}
        <button className="btn btn-text" onClick={toggleSidebar}>
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>
      
      <div className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
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

        {!isCollapsed && Object.keys(grouped).map(groupName => {
          const groupItems = grouped[groupName];
          if (groupItems.length === 0) return null;

          return (
            <div key={groupName} style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 16px', marginBottom: '8px', fontWeight: 'bold' }}>
                {groupName}
              </div>
              {groupItems.map(c => {
                const cid = c.conversation_id || c.id;
                return (
                  <a
                    key={cid}
                    onClick={(e) => { e.preventDefault(); navigate(`/chat/${cid}`); }}
                    href={`/chat/${cid}`}
                    className={`nav-item ${currentPath === `/chat/${cid}` ? 'active' : ''}`}
                    style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      <span className="nav-icon" style={{ fontSize: '0.9rem' }}>📝</span>
                      <span className="nav-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || 'Untitled'}</span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, cid)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s',
                      }}
                      title="Delete Chat"
                      onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                    >
                      ✕
                    </button>
                  </a>
                );
              })}
            </div>
          );
        })}
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
