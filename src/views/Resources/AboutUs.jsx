import React from 'react';
import { Shield, Heart, Award } from 'lucide-react';

export default function AboutUs({ navigate }) {

  const values = [
    { title: 'Security First', desc: 'Your audio recordings are sacred. We employ enterprise-grade security and encryption measures, ensuring no voice clip or log is stored longer than necessary.', icon: Shield },
    { title: 'Excellence', desc: 'We are obsessed with speech clarity and transcribing accuracy. Every neural model update undergoes rigorous test protocols.', icon: Award },
    { title: 'Customer-Centric', desc: 'Your success is our success. We listen to user feedback, iterate on vocal training pipelines, and provide responsive expert support.', icon: Heart }
  ];

  const team = [
    { initials: 'SM', name: 'Sarah Mitchell', role: 'CEO & Co-Founder', bio: 'Former AI Architect at SpeechWorks with 15+ years in neural networks. PhD in Computational Linguistics.' },
    { initials: 'DK', name: 'David Kim', role: 'CTO & Co-Founder', bio: 'AI Research Scientist from Google Brain. Specialized in deep neural text-to-speech synthesis (TTS) and transformer speech processing.' },
    { initials: 'AR', name: 'Alex Rodriguez', role: 'VP of Product', bio: 'Product management expert from voice-tech unicorns. Passionate about user-friendly developer integrations and SDK portals.' }
  ];

  return (
    <div style={styles.page} className="animate-fade-in">
      {/* Intro */}
      <section style={styles.hero}>
        <span className="badge badge-purple">Our Story</span>
        <h1 style={styles.title} className="hero-page-title">About Conversa AI</h1>
        <p style={styles.sub}>
          We're revolutionizing developer voice integration with cutting-edge Speech-to-Text and Text-to-Speech models, helping businesses automate customer service and content production.
        </p>
      </section>

      {/* Stats */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <div style={styles.statVal}>50M+</div>
            <div style={styles.statLabel}>Audio Seconds Processed</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statVal}>99.5%</div>
            <div style={styles.statLabel}>Word Accuracy Rate</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statVal}>5,000+</div>
            <div style={styles.statLabel}>Happy Developers</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statVal}>24/7</div>
            <div style={styles.statLabel}>API Availability</div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section style={styles.section}>
        <div className="about-mission-grid-row" style={styles.missionGrid}>
          <div className="glass-card" style={styles.missionCard}>
            <h3 style={styles.cardTitle}>Our Mission</h3>
            <p style={styles.cardText}>
              To empower developers with enterprise-grade speech synthesis and recognition tools that remove complex model training hurdles. We believe that voice tech should be simple, natural, and accessible to any codebase.
            </p>
          </div>
          <div className="glass-card" style={styles.missionCard}>
            <h3 style={styles.cardTitle}>Our Vision</h3>
            <p style={styles.cardText}>
              To become the global infrastructure layer for conversational voice processing, enabling human-like verbal interactions in applications, games, and devices worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story text */}
      <section style={{...styles.section, borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'rgba(15,23,42,0.005)'}}>
        <div style={styles.storyContent}>
          <h2 style={styles.sectionTitle}>Our Story</h2>
          <p style={styles.storyText}>
            Founded in 2023 by a team of speech recognition researchers and NLP developers, Conversa AI was born from a simple observation: developers were spending too much time configuring fragmented open-source speech models that lacked speed and multi-language reliability.
          </p>
          <p style={styles.storyText}>
            Our founders, having worked in major research labs, understood the complexities of training custom vocal weights and setting up scalable transcribing API pipelines. They set out to build a unified developer hub that solves these bottlenecks.
          </p>
          <p style={styles.storyText}>
            Today, Conversa AI processes millions of audio clips monthly for developers and enterprise customers worldwide. Our custom speech engines deliver industry-leading accuracy while maintaining the highest standard of data privacy.
          </p>
        </div>
      </section>

      {/* Our Values */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Our Values</h2>
          <p style={styles.sectionDesc}>These core principles guide everything we do, from product development to customer support.</p>
        </div>
        <div style={styles.valuesGrid}>
          {values.map((v, idx) => {
            const Icon = v.icon;
            return (
              <div key={idx} className="glass-card" style={styles.valueCard}>
                <div style={styles.valueIconBox}>
                  <Icon size={20} color="var(--primary-light)" />
                </div>
                <h4 style={styles.valueTitle}>{v.title}</h4>
                <p style={styles.valueDesc}>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team */}
      <section style={{...styles.section, borderTop: '1px solid var(--border-color)', background: 'rgba(124, 58, 237, 0.01)'}}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Leadership Team</h2>
          <p style={styles.sectionDesc}>Meet the experts behind Conversa AI's innovative technology and customer success.</p>
        </div>
        <div style={styles.teamGrid}>
          {team.map((member, idx) => (
            <div key={idx} className="glass-card" style={styles.teamCard}>
              <div style={styles.avatarCircle}>{member.initials}</div>
              <h4 style={styles.teamName}>{member.name}</h4>
              <div style={styles.teamRole}>{member.role}</div>
              <p style={styles.teamBio}>{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recognition */}
      <section style={{...styles.section, borderTop: '1px solid var(--border-color)'}}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recognition & Achievements</h2>
          <p style={styles.sectionDesc}>We're proud of the recognition we've received from industry leaders and customers.</p>
        </div>
        <div style={styles.achievementGrid}>
          <div className="glass-card" style={styles.achCard}>
            <div style={styles.achTitle}>Best AI Startup 2024</div>
            <div style={styles.achDesc}>TechCrunch Awards</div>
          </div>
          <div className="glass-card" style={styles.achCard}>
            <div style={styles.achTitle}>4.9/5 Rating</div>
            <div style={styles.achDesc}>G2 Customer Reviews</div>
          </div>
          <div className="glass-card" style={styles.achCard}>
            <div style={styles.achTitle}>SOC 2 Certified</div>
            <div style={styles.achDesc}>Enterprise Security</div>
          </div>
          <div className="glass-card" style={styles.achCard}>
            <div style={styles.achTitle}>$10M Series A</div>
            <div style={styles.achDesc}>Funded by Top VCs</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>Ready to Transform Your Workflow?</h2>
          <p style={styles.ctaDesc}>Join thousands of developers who trust Conversa AI to power their voice-enabled integrations.</p>
          <div style={styles.ctaActions}>
            <button onClick={() => navigate('/signup')} className="btn btn-primary">Start Free Trial</button>
            <button onClick={() => navigate('/contact')} className="btn btn-outline">Contact Sales</button>
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
  hero: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '80px 24px 48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '2.5rem',
    color: 'var(--text-primary)',
  },
  sub: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  statsSection: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto 40px auto',
    padding: '0 24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '24px',
    background: 'rgba(15,23,42,0.015)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statVal: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  section: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '64px 24px',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto 48px auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '1.8rem',
    color: 'var(--text-primary)',
  },
  sectionDesc: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  missionGrid: {
    // Defined dynamically in index.css (.about-mission-grid-row)
  },
  missionCard: {
    padding: '32px',
  },
  cardTitle: {
    fontSize: '1.3rem',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  cardText: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  storyContent: {
    maxWidth: '700px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  storyText: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  valueCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'flex-start',
  },
  valueIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'rgba(124, 58, 237, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
  },
  valueDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
  },
  teamCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
    padding: '32px 24px',
  },
  avatarCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    color: '#ffffff',
    fontSize: '1.4rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    boxShadow: '0 4px 12px rgba(124, 58, 237,0.3)',
  },
  teamName: {
    fontSize: '1.15rem',
    color: 'var(--text-primary)',
  },
  teamRole: {
    fontSize: '0.82rem',
    color: 'var(--primary-light)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  teamBio: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  achievementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    textAlign: 'center',
  },
  achCard: {
    padding: '24px 16px',
  },
  achTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  achDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  ctaSection: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '0 24px',
  },
  ctaCard: {
    background: 'radial-gradient(circle at top right, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.02) 70%), rgba(15,23,42,0.015)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  ctaTitle: {
    fontSize: '1.8rem',
  },
  ctaDesc: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    maxWidth: '500px',
  },
  ctaActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  }
};
