import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Plus, 
  Minus,
  Globe
} from 'lucide-react';

export default function Contact({ showToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'Sales Inquiry',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);

    setTimeout(() => {
      setIsSending(false);
      showToast('Thank you! Your message has been sent successfully.', 'success');
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: 'Sales Inquiry',
        message: ''
      });
    }, 1000);
  };

  const faqs = [
    { q: "How fast can I get access to the API?", a: "Instantly! Once you sign up for a free developer account, you can generate your API key immediately and start making test speech requests." },
    { q: "Do you offer custom pricing?", a: "Yes, for organizations processing more than 10,000,000 audio seconds per month, we offer custom volume discounts, SLA guarantees, and dedicated servers. Contact our sales team using this form." },
    { q: "Is there support for enterprise SSO?", a: "Yes, our Enterprise tier supports SAML-based single sign-on (SSO) with providers like Okta, Azure AD, and Google Workspace." }
  ];

  const offices = [
    { country: 'United States', address: '123 Innovation Drive, San Francisco, CA 94102', phone: '+1 (555) 123-4567' },
    { country: 'United Kingdom', address: '45 Finsbury Square, London EC2A 1PX', phone: '+44 20 7946 0192' },
    { country: 'Singapore', address: '1 Marina Boulevard, Singapore 018989', phone: '+65 6789 0123' }
  ];

  return (
    <div style={styles.page} className="animate-fade-in">
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title} className="hero-page-title">Get in Touch</h1>
          <p style={styles.sub}>
            Have questions about our AI-powered Speech-to-Text and Text-to-Speech API? We'd love to hear from you and help you find the right solution.
          </p>
        </div>

        <div className="contact-grid-row" style={styles.grid}>
          {/* Left Column: Contact info */}
          <div style={styles.infoCol}>
            <div className="glass-card" style={styles.infoCard}>
              <h3 style={styles.cardTitle}>Contact Information</h3>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <div style={styles.iconBox}>
                    <Mail size={18} color="var(--primary-light)" />
                  </div>
                  <div>
                    <div style={styles.infoLabel}>Email</div>
                    <a href="mailto:support@conversa.ai" style={styles.infoLink} className="contact-info-link">support@conversa.ai</a>
                    <a href="mailto:sales@conversa.ai" style={{...styles.infoLink, display: 'block', marginTop: '4px'}} className="contact-info-link">sales@conversa.ai</a>
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.iconBox}>
                    <Phone size={18} color="var(--primary-light)" />
                  </div>
                  <div>
                    <div style={styles.infoLabel}>Phone</div>
                    <div style={styles.infoVal}>+1 (555) 123-4567</div>
                    <div style={styles.infoSubText}>Mon-Fri 9AM-5PM EST</div>
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.iconBox}>
                    <MapPin size={18} color="var(--primary-light)" />
                  </div>
                  <div>
                    <div style={styles.infoLabel}>Office</div>
                    <div style={styles.infoVal}>
                      123 Innovation Drive,<br />
                      San Francisco, CA 94102
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Questions Accordion */}
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ ...styles.cardTitle, marginBottom: '16px', paddingLeft: '8px' }}>Quick Questions</h3>
              <div style={styles.faqList}>
                {faqs.map((faq, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    style={{
                      ...styles.faqItem,
                      borderColor: activeFaq === idx ? 'var(--primary)' : 'var(--border-color)',
                      background: activeFaq === idx ? 'rgba(124, 58, 237, 0.01)' : 'transparent'
                    }}
                  >
                    <div style={styles.faqQuestionRow}>
                      <span style={styles.faqQuestion}>{faq.q}</span>
                      {activeFaq === idx ? <Minus size={14} color="var(--primary)" /> : <Plus size={14} color="var(--text-secondary)" />}
                    </div>
                    {activeFaq === idx && (
                      <div style={styles.faqAnswer} className="animate-fade-in">
                        <p style={{ fontSize: '0.85rem' }}>{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Contact form */}
          <div className="glass-card" style={styles.formCard}>
            <h3 style={{ ...styles.cardTitle, marginBottom: '24px' }}>Send us a Message</h3>
            <form onSubmit={handleFormSubmit}>
              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className="form-input" 
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="form-input" 
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Company Name</label>
                  <input 
                    type="text" 
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Your company name"
                    className="form-input" 
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Subject *</label>
                  <select 
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ background: 'var(--bg-main)' }}
                  >
                    <option value="Sales Inquiry">Sales Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Billing Question">Billing Question</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea 
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us about your project, questions, or how we can help..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSending}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px 24px', marginTop: '8px' }}
              >
                {isSending ? 'Sending Message...' : 'Send Message'} <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Lower Offices Section */}
        <div style={styles.officesSection}>
          <h2 style={styles.secTitle}>Our Offices</h2>
          <div style={styles.officesGrid}>
            {offices.map((off, idx) => (
              <div key={idx} className="glass-card" style={styles.officeCard}>
                <div style={styles.officeHeader}>
                  <Globe size={18} color="var(--primary-light)" />
                  <h4 style={styles.officeCountry}>{off.country}</h4>
                </div>
                <p style={styles.officeAddress}>{off.address}</p>
                <div style={styles.officePhone}>{off.phone}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: '100%',
    paddingBottom: '80px',
  },
  container: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '64px 24px',
  },
  header: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 56px auto',
  },
  title: {
    fontSize: '2.5rem',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  sub: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  grid: {
    // Defined dynamically in index.css (.contact-grid-row)
  },
  infoCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  infoCard: {
    padding: '32px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
    fontWeight: '700',
    marginBottom: '24px',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  infoItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(124, 58, 237, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  infoLink: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    textDecoration: 'none',
    transition: 'var(--transition)',
  },
  infoVal: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    lineHeight: '1.5',
  },
  infoSubText: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  faqItem: {
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    padding: '14px 16px',
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
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  faqAnswer: {
    marginTop: '8px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '8px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  formCard: {
    padding: '32px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  officesSection: {
    marginTop: '80px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '64px',
  },
  secTitle: {
    fontSize: '1.6rem',
    color: 'var(--text-primary)',
    marginBottom: '32px',
  },
  officesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
  },
  officeCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  officeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  officeCountry: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
  },
  officeAddress: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  officePhone: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
  }
};
