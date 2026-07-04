import React, { useState } from 'react';
import { 
  CheckCircle, 
  ArrowRight, 
  FileText, 
  Coins, 
  Receipt, 
  Briefcase, 
  Building, 
  Code, 
  Lock, 
  Check, 
  Plus, 
  Minus, 
  MessageSquare, 
  Star,
  Users,
  Volume2,
  Mic,
  Sparkles
} from 'lucide-react';

export default function LandingPage({ navigate, showToast }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const startTrial = () => {
    navigate('/signup');
    showToast('Starting your 14-day trial account setup!', 'info');
  };

  const viewApiDocs = () => {
    navigate('/documentation');
  };

  const faqs = [
    {
      q: "What audio formats does Conversa AI support?",
      a: "Conversa AI supports WAV, MP3, AAC, FLAC, M4A, and OGG formats for transcribing (Speech-to-Text). For voice synthesis (Text-to-Speech), we generate outputs in high-quality MP3 and WAV files."
    },
    {
      q: "How natural do the synthesized voices sound?",
      a: "Our voices are powered by state-of-the-art neural speech models that articulate human pitch, tone, and inflection. We offer multiple voice models with adjustable speeds and emotional profiles."
    },
    {
      q: "Can I clone my own voice?",
      a: "Yes. With a short 10-second vocal sample, Conversa AI can securely capture your voice signature to build a cloned model that you can use for text synthesis."
    },
    {
      q: "Is my vocal data protected and secure?",
      a: "Yes, we prioritize security. All audio recordings, transcripts, and voice clones are encrypted end-to-end. We never use your private voice samples to train public models."
    },
    {
      q: "What is the processing speed of transcribing?",
      a: "Speech-to-Text transcribing runs at about 10x real-time speed. A 10-minute meeting file compiles into text in under a minute."
    },
    {
      q: "What support options are available?",
      a: "We provide detailed API documentation and 24/7 developer forum access. Pro and Enterprise customers get dedicated support channels and custom model assistance."
    }
  ];

  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <section style={styles.heroSection} className="animate-fade-in">
        <div style={styles.heroBadge}>
          <div style={styles.heroBadgeDot}></div>
          <span style={styles.heroBadgeText}>Trusted by 10,000+ Developers &amp; Creators</span>
        </div>

        <h1 className="hero-glow-title" style={styles.heroTitle}>
          AI-Powered Speech <br />
          &amp; Voice Generation
        </h1>

        <p style={styles.heroSub}>
          Automatically synthesize text into natural-sounding speech and transcribe audio streams to text. Perfect for content creators, customer support, and developers who need high-fidelity voice automation.
        </p>

        <div style={styles.heroActions}>
          <button onClick={startTrial} className="btn btn-primary" style={styles.ctaBtn}>
            Start Free Trial <ArrowRight size={16} />
          </button>
          <button onClick={viewApiDocs} className="btn btn-outline" style={styles.docsBtn}>
            View API Docs
          </button>
        </div>

        <div style={styles.heroBenefits}>
          <div style={styles.benefitItem}>
            <CheckCircle size={14} color="var(--success)" />
            <span>No credit card required</span>
          </div>
          <div style={styles.benefitItem}>
            <CheckCircle size={14} color="var(--success)" />
            <span>14-day free trial</span>
          </div>
          <div style={styles.benefitItem}>
            <CheckCircle size={14} color="var(--success)" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.section} id="features">
        <div style={styles.sectionHeader}>
          <span className="badge badge-purple">Powerful Features</span>
          <h2 style={styles.sectionTitle}>Advanced Voice Processing</h2>
          <p style={styles.sectionDesc}>
            Convert between text and speech with state-of-the-art neural audio models.
          </p>
        </div>

        <div style={styles.featuresGrid}>
          {/* Card 1 */}
          <div className="glass-card glass-card-hover" style={styles.featureCard}>
            <div style={{ ...styles.cardIconBox, background: 'rgba(37,99,235, 0.1)' }}>
              <Volume2 size={24} color="var(--primary)" />
            </div>
            <h3 style={styles.cardTitle}>Text to Speech</h3>
            <p style={styles.cardDesc}>
              Automatically convert written text into natural, highly realistic audio outputs across multiple languages.
            </p>
            <ul style={styles.cardBulletList}>
              <li><Check size={14} color="var(--success)" /> 50+ languages &amp; accents</li>
              <li><Check size={14} color="var(--success)" /> Real-time vocal articulation</li>
              <li><Check size={14} color="var(--success)" /> Adjustable speed &amp; tone</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="glass-card glass-card-hover" style={styles.featureCard}>
            <div style={{ ...styles.cardIconBox, background: 'rgba(14,165,233, 0.1)' }}>
              <Mic size={24} color="var(--secondary)" />
            </div>
            <h3 style={styles.cardTitle}>Speech to Text</h3>
            <p style={styles.cardDesc}>
              Transcribe audio recordings or live speech streams into high-fidelity formatted text transcripts.
            </p>
            <ul style={styles.cardBulletList}>
              <li><Check size={14} color="var(--success)" /> Speaker identification</li>
              <li><Check size={14} color="var(--success)" /> Auto punctuation &amp; formatting</li>
              <li><Check size={14} color="var(--success)" /> Audio file upload support</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="glass-card glass-card-hover" style={styles.featureCard}>
            <div style={{ ...styles.cardIconBox, background: 'rgba(59, 130, 246, 0.1)' }}>
              <Sparkles size={24} color="var(--info)" />
            </div>
            <h3 style={styles.cardTitle}>Voice Cloning</h3>
            <p style={styles.cardDesc}>
              Clone vocal signatures from short audio samples to generate personalized responses and branded narrations.
            </p>
            <ul style={styles.cardBulletList}>
              <li><Check size={14} color="var(--success)" /> Fast 10-second sample clone</li>
              <li><Check size={14} color="var(--success)" /> Natural inflection match</li>
              <li><Check size={14} color="var(--success)" /> Secure voice ownership</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Built For Every Workflow */}
      <section style={{...styles.section, background: 'rgba(15,23,42,0.01)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)'}}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Built for Every Speech Workflow</h2>
          <p style={styles.sectionDesc}>
            Whether you're a content creator, developer, or enterprise support team, Conversa AI streams your audio operations.
          </p>
        </div>

        <div style={styles.workflowsGrid}>
          <div style={styles.workflowItem}>
            <div style={styles.workflowHeader}>
              <Briefcase size={18} color="var(--primary-light)" />
              <h4 style={styles.workflowTitle}>Content Creators</h4>
            </div>
            <p style={styles.workflowText}>Generate realistic voiceovers for videos, narrate articles, and translate podcasts instantly.</p>
          </div>
          <div style={styles.workflowItem}>
            <div style={styles.workflowHeader}>
              <Building size={18} color="var(--primary-light)" />
              <h4 style={styles.workflowTitle}>Customer Support</h4>
            </div>
            <p style={styles.workflowText}>Power smart IVR voice responders and read client chats aloud to operators automatically.</p>
          </div>
          <div style={styles.workflowItem}>
            <div style={styles.workflowHeader}>
              <Lock size={18} color="var(--primary-light)" />
              <h4 style={styles.workflowTitle}>Enterprise Teams</h4>
            </div>
            <p style={styles.workflowText}>Deploy secure voice synthesis backed by compliance SLAs, SSO, and private storage networks.</p>
          </div>
          <div style={styles.workflowItem}>
            <div style={styles.workflowHeader}>
              <Code size={18} color="var(--primary-light)" />
              <h4 style={styles.workflowTitle}>Developers API</h4>
            </div>
            <p style={styles.workflowText}>Power your own software with our developer-friendly voice generation endpoints and SDKs.</p>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Trusted by Thousands Worldwide</h2>
          <p style={styles.sectionDesc}>Numbers that speak for themselves.</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNum}>50M+</div>
            <div style={styles.statLabel}>Audio Seconds Processed</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNum}>99.5%</div>
            <div style={styles.statLabel}>Word Accuracy Rate</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNum}>10,000+</div>
            <div style={styles.statLabel}>Active Accounts</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNum}>50+</div>
            <div style={styles.statLabel}>Languages Supported</div>
          </div>
        </div>

        <div style={{ ...styles.statsGrid, marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '30px' }}>
          <div style={styles.secondaryStatCard}>
            <div style={styles.secondaryStatNum}>85%</div>
            <div style={styles.secondaryStatLabel}>Reduction in Dubbing Cost</div>
          </div>
          <div style={styles.secondaryStatCard}>
            <div style={styles.secondaryStatNum}>50ms</div>
            <div style={styles.secondaryStatLabel}>Synthesis Average Latency</div>
          </div>
          <div style={styles.secondaryStatCard}>
            <div style={styles.secondaryStatNum}>24/7</div>
            <div style={styles.secondaryStatLabel}>API Availability</div>
          </div>
        </div>
      </section>

      {/* Why Choose Our API */}
      <section style={{ ...styles.section, borderTop: '1px solid var(--border-color)' }}>
        <div style={styles.sectionHeader}>
          <span className="badge badge-purple">Why Choose Our API?</span>
          <h2 style={styles.sectionTitle}>Built for High-Scale Applications</h2>
          <p style={styles.sectionDesc}>Fast, reliable voice infrastructure designed for developers and enterprise scale.</p>
        </div>

        <div style={styles.whyGrid}>
          <div className="glass-card" style={styles.whyCard}>
            <h4 style={styles.whyTitle}>Lightning Fast</h4>
            <p style={styles.whyDesc}>Deploy state-of-the-art neural speech synthesis that responds in milliseconds to support real-time interactions.</p>
          </div>
          <div className="glass-card" style={styles.whyCard}>
            <h4 style={styles.whyTitle}>Secure &amp; Compliant</h4>
            <p style={styles.whyDesc}>Full end-to-end data encryption, private key auth, and strict voice data privacy compliance guarantees.</p>
          </div>
          <div className="glass-card" style={styles.whyCard}>
            <h4 style={styles.whyTitle}>99.5% Accurate</h4>
            <p style={styles.whyDesc}>Intelligent contextual speech processors that correctly parse names, accents, and punctuation marks.</p>
          </div>
        </div>
      </section>

      {/* Customer Stories / Testimonials */}
      <section style={{...styles.section, background: 'rgba(37,99,235, 0.02)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)'}}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Trusted by Modern Content Teams</h2>
          <p style={styles.sectionDesc}>See what our partners say about the speed and vocal quality of Conversa AI.</p>
        </div>

        <div style={styles.testimonialsGrid}>
          <div className="glass-card" style={styles.testimonialCard}>
            <div style={styles.testimonialStars}>
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
            </div>
            <p style={styles.testimonialText}>
              "Conversa AI has revolutionized our content workflows. We generate natural narrations for our audiobooks in seconds. The accents sound completely human."
            </p>
            <div style={styles.testimonialUser}>
              <div style={styles.userInitial}>SM</div>
              <div>
                <div style={styles.userName}>Sarah Mitchell</div>
                <div style={styles.userRole}>Creative Director, Mitchell Audiobooks</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={styles.testimonialCard}>
            <div style={styles.testimonialStars}>
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
            </div>
            <p style={styles.testimonialText}>
              "Integrating the Speech to Text API took us less than an hour. It transcribes hours of customer support logs with 99.5% accuracy."
            </p>
            <div style={styles.testimonialUser}>
              <div style={styles.userInitial}>DK</div>
              <div>
                <div style={styles.userName}>David Kim</div>
                <div style={styles.userRole}>CTO, VoiceFlow Solutions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
          <p style={styles.sectionDesc}>Everything you need to know about Conversa AI.</p>
        </div>

        <div style={styles.faqWrapper}>
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              style={{
                ...styles.faqItem,
                borderColor: activeFaq === idx ? 'var(--primary)' : 'var(--border-color)',
                background: activeFaq === idx ? 'rgba(37,99,235, 0.02)' : 'transparent'
              }}
              onClick={() => toggleFaq(idx)}
            >
              <div style={styles.faqQuestionRow}>
                <span style={styles.faqQuestion}>{faq.q}</span>
                {activeFaq === idx ? (
                  <Minus size={18} color="var(--primary)" />
                ) : (
                  <Plus size={18} color="var(--text-secondary)" />
                )}
              </div>
              {activeFaq === idx && (
                <div style={styles.faqAnswer} className="animate-fade-in">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA final banner */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>Ready to Transform Your Voice Workflows?</h2>
          <p style={styles.ctaDesc}>
            Join thousands of developers and creators who trust our AI to synthesize and transcribe voice streams.
          </p>
          <div style={styles.ctaActions}>
            <button onClick={startTrial} className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              Start Your Free Trial
            </button>
            <button onClick={() => navigate('/contact')} className="btn btn-outline" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              Contact Sales
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
  heroSection: {
    maxWidth: '850px',
    margin: '0 auto',
    padding: '100px 24px 64px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(37,99,235, 0.1)',
    border: '1px solid rgba(37,99,235, 0.25)',
    padding: '6px 14px',
    borderRadius: '40px',
    marginBottom: '28px',
  },
  heroBadgeDot: {
    width: '6px',
    height: '6px',
    background: 'var(--primary-light)',
    borderRadius: '50%',
    boxShadow: '0 0 6px var(--primary-light)',
  },
  heroBadgeText: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--primary-light)',
  },
  heroTitle: {
    marginBottom: '24px',
  },
  heroSub: {
    fontSize: '1.15rem',
    lineHeight: '1.7',
    color: 'var(--text-secondary)',
    marginBottom: '40px',
    maxWidth: '700px',
  },
  heroActions: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '48px',
  },
  ctaBtn: {
    padding: '12px 28px',
    fontSize: '1rem',
  },
  docsBtn: {
    padding: '12px 28px',
    fontSize: '1rem',
  },
  heroBenefits: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    flexWrap: 'wrap',
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  section: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '80px 24px',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto 56px auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  sectionTitle: {
    fontSize: '2.2rem',
    color: 'var(--text-primary)',
  },
  sectionDesc: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
  },
  cardIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  cardDesc: {
    fontSize: '0.92rem',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
  },
  cardBulletList: {
    listStyle: 'none',
    padding: 0,
    margin: '8px 0 0 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  workflowsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '32px',
  },
  workflowItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  workflowHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  workflowTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
  },
  workflowText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '24px',
    textAlign: 'center',
  },
  statCard: {
    padding: '16px',
  },
  statNum: {
    fontSize: '3rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #ffffff 0%, var(--primary-light) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  secondaryStatCard: {
    padding: '12px',
  },
  secondaryStatNum: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  secondaryStatLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  whyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  whyCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  whyTitle: {
    fontSize: '1.15rem',
    color: 'var(--text-primary)',
  },
  whyDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
  },
  testimonialCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    justifyContent: 'space-between',
  },
  testimonialStars: {
    display: 'flex',
    gap: '4px',
  },
  testimonialText: {
    fontSize: '0.95rem',
    fontStyle: 'italic',
    lineHeight: '1.6',
    color: 'var(--text-primary)',
  },
  testimonialUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInitial: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--primary-glow)',
    border: '1px solid rgba(37,99,235, 0.3)',
    color: 'var(--primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.9rem',
  },
  userRole: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  faqWrapper: {
    maxWidth: '750px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  faqItem: {
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    padding: '20px 24px',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  faqQuestionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  faqAnswer: {
    marginTop: '14px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '14px',
  },
  ctaSection: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto 80px auto',
    padding: '0 24px',
  },
  ctaCard: {
    background: 'radial-gradient(circle at top right, rgba(37,99,235, 0.15) 0%, rgba(14,165,233, 0.03) 70%), rgba(15,23,42,0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '64px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  ctaTitle: {
    fontSize: '2rem',
    maxWidth: '650px',
    lineHeight: '1.3',
  },
  ctaDesc: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '550px',
  },
  ctaActions: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '12px',
  }
};
