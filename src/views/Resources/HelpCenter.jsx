import React, { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  CreditCard, 
  Lock, 
  AlertTriangle, 
  User, 
  Plus, 
  Minus
} from 'lucide-react';

export default function HelpCenter({ navigate, showToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  const categories = [
    { title: 'Getting Started', desc: 'Learn the basics and set up your account', icon: PlayIcon, action: '/signup' },
    { title: 'API Documentation', desc: 'Explore reference endpoints and SDKs', icon: BookOpen, action: '/documentation' },
    { title: 'Billing & Plans', desc: 'Pricing plans, usage metrics, and subscriptions', icon: CreditCard, action: '/' },
    { title: 'Security & Privacy', desc: 'SOC 2, GDPR, data retention policies', icon: Lock, action: '/about-us' },
    { title: 'Troubleshooting', desc: 'Common issues, audio format errors, and transcribing timeouts', icon: AlertTriangle, action: '/contact' },
    { title: 'Account Management', desc: 'Profiles, billing details, and API keys', icon: User, action: '/dashboard' }
  ];

  const faqs = [
    { q: "How do I generate a new API key?", a: "Login to your dashboard, navigate to the API Keys section, and click on '+ New Key'. Make sure to copy the key and keep it secure; it will only be shown once." },
    { q: "What is the maximum audio file upload size?", a: "The maximum audio upload size is 25MB. We recommend using compressed audio formats like MP3 or OGG, and limiting audio clip durations to under 5 minutes for direct sandbox testing." },
    { q: "Is there a limit on concurrent API requests?", a: "Yes, rate limits depend on your plan. The Free tier is limited to 5 requests per minute, while Pro handles up to 50 requests per minute. Contact us for custom enterprise rate limits." },
    { q: "Do you offer a sandbox environment?", a: "Yes, you can use our interactive API reference console page to test syntheses and transcribing requests without burning through your subscription audio seconds limits." }
  ];

  // Helper helper to dynamically map icon references
  function PlayIcon(props) {
    return <span style={{ fontSize: '1.25rem' }}>🚀</span>;
  }

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
         f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (action) => {
    navigate(action);
  };

  return (
    <div style={styles.page} className="animate-fade-in">
      {/* Search Header Banner */}
      <section style={styles.banner}>
        <h1 style={styles.title} className="hero-page-title">How can we help you?</h1>
        <p style={styles.sub}>Search our knowledge base or browse categories below.</p>
        
        <div style={styles.searchBox}>
          <Search size={20} color="var(--text-muted)" style={{ marginLeft: '16px' }} />
          <input 
            type="text" 
            placeholder="Search for articles, APIs, billing..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </section>

      {/* Categories Grid */}
      <section style={styles.section}>
        <h2 style={styles.secTitle}>Browse by Category</h2>
        <div style={styles.categoriesGrid}>
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div 
                key={idx} 
                onClick={() => handleCategoryClick(cat.action)}
                className="glass-card glass-card-hover" 
                style={styles.catCard}
              >
                <div style={styles.iconWrapper}>
                  {typeof Icon === 'function' && Icon.name === 'PlayIcon' ? <Icon /> : <Icon size={22} color="var(--primary-light)" />}
                </div>
                <div>
                  <h3 style={styles.catTitle}>{cat.title}</h3>
                  <p style={styles.catDesc}>{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive FAQ Filter results */}
      <section style={{ ...styles.section, borderTop: '1px solid var(--border-color)', paddingTop: '64px' }}>
        <h2 style={styles.secTitle}>
          {searchQuery ? `Search Results (${filteredFaqs.length})` : 'Frequently Asked Questions'}
        </h2>
        
        {filteredFaqs.length === 0 ? (
          <div style={styles.noResults}>
            No articles found matching "{searchQuery}". Try searching for "API key" or "audio file".
          </div>
        ) : (
          <div style={styles.faqList}>
            {filteredFaqs.map((faq, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                style={{
                  ...styles.faqItem,
                  borderColor: activeFaq === idx ? 'var(--primary)' : 'var(--border-color)',
                  background: activeFaq === idx ? 'rgba(124, 58, 237, 0.02)' : 'transparent'
                }}
              >
                <div style={styles.faqQuestionRow}>
                  <span style={styles.faqQuestion}>{faq.q}</span>
                  {activeFaq === idx ? <Minus size={16} color="var(--primary)" /> : <Plus size={16} color="var(--text-secondary)" />}
                </div>
                {activeFaq === idx && (
                  <div style={styles.faqAnswer} className="animate-fade-in">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Still need help callout */}
      <section style={styles.ctaSection}>
        <div className="glass-card" style={styles.ctaCard}>
          <h3 style={styles.ctaTitle}>Still need help?</h3>
          <p style={styles.ctaDesc}>Can't find what you're looking for? Our developer support team is here to help you succeed.</p>
          <div style={styles.ctaBtns}>
            <button onClick={() => navigate('/contact')} className="btn btn-primary">
              Contact Support
            </button>
            <button onClick={() => navigate('/documentation')} className="btn btn-outline">
              View Documentation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    width: '100%',
    paddingBottom: '80px',
  },
  banner: {
    background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
    padding: '80px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
  },
  title: {
    fontSize: '2.5rem',
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  sub: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    marginBottom: '32px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(15,23,42,0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '40px',
    width: '100%',
    maxWidth: '560px',
    height: '52px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  searchInput: {
    flex: '1',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    padding: '0 16px',
    fontSize: '0.98rem',
  },
  section: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '64px 24px 0 24px',
  },
  secTitle: {
    fontSize: '1.6rem',
    color: 'var(--text-primary)',
    marginBottom: '32px',
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  catCard: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    cursor: 'pointer',
  },
  iconWrapper: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: 'rgba(124, 58, 237, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catTitle: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  catDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    maxWidth: '800px',
  },
  faqItem: {
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    padding: '18px 20px',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  faqQuestionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontWeight: '600',
    fontSize: '0.98rem',
    color: 'var(--text-primary)',
  },
  faqAnswer: {
    marginTop: '12px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '12px',
  },
  noResults: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
  },
  ctaSection: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '80px 24px 0 24px',
  },
  ctaCard: {
    textAlign: 'center',
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, rgba(15,23,42,0.01) 100%)',
  },
  ctaTitle: {
    fontSize: '1.5rem',
    color: 'var(--text-primary)',
  },
  ctaDesc: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    maxWidth: '500px',
  },
  ctaBtns: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  }
};
