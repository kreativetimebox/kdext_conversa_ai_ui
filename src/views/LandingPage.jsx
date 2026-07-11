import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroScene3D from '../components/HeroScene3D';
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

const AnimatedStat = ({ target, suffix = '', decimals = 0, useComma = false, style }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
          
          let startTimestamp = null;
          const duration = 1500;

          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            setCount(easeProgress * target);
            
            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setCount(target);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }

    return () => observer.disconnect();
  }, [target, hasAnimated]);

  const formattedValue = useComma
    ? Number(count.toFixed(decimals)).toLocaleString()
    : count.toFixed(decimals);

  return (
    <div ref={nodeRef} style={style}>
      {formattedValue}{suffix}
    </div>
  );
};

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
      <section style={{ ...styles.heroSection, position: 'relative', overflow: 'hidden' }} className="animate-fade-in">
        <div className="hero-net-overlay" />
        <div className="hero-vertical-lines">
          <div className="hero-v-line hero-v-line-left" />
          <div className="hero-v-line hero-v-line-center-left" />
          <div className="hero-v-line hero-v-line-center" />
          <div className="hero-v-line hero-v-line-center-right" />
          <div className="hero-v-line hero-v-line-right" />
          <div className="hero-h-line hero-h-line-1" />
          <div className="hero-h-line hero-h-line-2" />
          <div className="hero-h-line hero-h-line-3" />
          <div className="hero-h-line hero-h-line-4" />
          {/* Grid intersections */}
          <div className="grid-intersection" style={{ left: '25%', top: '15%' }}>+</div>
          <div className="grid-intersection" style={{ left: '25%', top: '40%' }}>+</div>
          <div className="grid-intersection" style={{ left: '25%', top: '65%' }}>+</div>
          <div className="grid-intersection" style={{ left: '25%', top: '90%' }}>+</div>
          <div className="grid-intersection" style={{ left: '50%', top: '15%' }}>+</div>
          <div className="grid-intersection" style={{ left: '50%', top: '40%' }}>+</div>
          <div className="grid-intersection" style={{ left: '50%', top: '65%' }}>+</div>
          <div className="grid-intersection" style={{ left: '50%', top: '90%' }}>+</div>
          <div className="grid-intersection" style={{ left: '75%', top: '15%' }}>+</div>
          <div className="grid-intersection" style={{ left: '75%', top: '40%' }}>+</div>
          <div className="grid-intersection" style={{ left: '75%', top: '65%' }}>+</div>
          <div className="grid-intersection" style={{ left: '75%', top: '90%' }}>+</div>
        </div>

        <HeroScene3D />

        <motion.div
          style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '850px', margin: '0 auto' }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.div
            style={styles.heroBadge}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5 }}
          >
            <div style={styles.heroBadgeDot}></div>
            <span style={styles.heroBadgeText}>Trusted by 10,000+ Developers &amp; Creators</span>
          </motion.div>

          <motion.h1
            className="hero-glow-title"
            style={styles.heroTitle}
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6 }}
          >
            The Future of AI Voice <br />
            Starts Here
          </motion.h1>

          <motion.p
            style={styles.heroSub}
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6 }}
          >
            Transform text into lifelike speech, convert speech into accurate text, and build powerful voice experiences with state-of-the-art AI. Fast, natural, multilingual, and built for creators, businesses, and developers.
          </motion.p>

          <motion.div
            style={styles.heroActions}
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6 }}
          >
            <motion.button
              onClick={startTrial}
              className="btn btn-primary"
              style={styles.ctaBtn}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Free Trial <ArrowRight size={16} />
            </motion.button>
            <motion.button
              onClick={viewApiDocs}
              className="btn btn-outline"
              style={styles.docsBtn}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              View API Docs
            </motion.button>
          </motion.div>

          <motion.div
            style={styles.heroBenefits}
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6 }}
          >
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
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <motion.section
        style={styles.section}
        id="features"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div style={styles.sectionHeader}>
          <span className="badge badge-purple">Powerful Features</span>
          <h2 style={styles.sectionTitle}>Advanced Voice Processing</h2>
          <p style={styles.sectionDesc}>
            Convert between text and speech with state-of-the-art neural audio models.
          </p>
        </div>

        <div style={styles.featuresGrid}>
          {/* Card 1 */}
          <motion.div
            className="glass-card glass-card-hover"
            style={styles.featureCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0 }}
            whileHover={{ y: -6 }}
          >
            <div style={{ ...styles.cardIconBox, background: 'rgba(124, 58, 237, 0.14)' }}>
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
          </motion.div>

          {/* Card 2 */}
          <motion.div
            className="glass-card glass-card-hover"
            style={styles.featureCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            whileHover={{ y: -6 }}
          >
            <div style={{ ...styles.cardIconBox, background: 'rgba(6, 182, 212, 0.14)' }}>
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
          </motion.div>

          {/* Card 3 */}
          <motion.div
            className="glass-card glass-card-hover"
            style={styles.featureCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            whileHover={{ y: -6 }}
          >
            <div style={{ ...styles.cardIconBox, background: 'rgba(236, 72, 153, 0.14)' }}>
              <Sparkles size={24} color="#ec4899" />
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
          </motion.div>
        </div>
      </motion.section>

      {/* Built For Every Workflow */}
      <motion.section
        style={{ ...styles.section, background: 'rgba(15,23,42,0.01)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Built for Every Speech Workflow</h2>
          <p style={styles.sectionDesc}>
            Whether you're a content creator, developer, or enterprise support team, Conversa AI streams your audio operations.
          </p>
        </div>

        <div style={styles.workflowsGrid}>
          {[
            { icon: Briefcase, title: 'Content Creators', text: 'Generate realistic voiceovers for videos, narrate articles, and translate podcasts instantly.' },
            { icon: Building, title: 'Customer Support', text: 'Power smart IVR voice responders and read client chats aloud to operators automatically.' },
            { icon: Lock, title: 'Enterprise Teams', text: 'Deploy secure voice synthesis backed by compliance SLAs, SSO, and private storage networks.' },
            { icon: Code, title: 'Developers API', text: "Power your own software with our developer-friendly voice generation endpoints and SDKs." },
          ].map(({ icon: Icon, title, text }, idx) => (
            <motion.div
              key={title}
              style={styles.workflowItem}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div style={styles.workflowHeader}>
                <Icon size={18} color="var(--primary-light)" />
                <h4 style={styles.workflowTitle}>{title}</h4>
              </div>
              <p style={styles.workflowText}>{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Statistics */}
      <motion.section
        style={styles.section}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Trusted by Thousands Worldwide</h2>
          <p style={styles.sectionDesc}>Numbers that speak for themselves.</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <AnimatedStat target={50} suffix="M+" style={styles.statNum} />
            <div style={styles.statLabel}>Audio Seconds Processed</div>
          </div>
          <div style={styles.statCard}>
            <AnimatedStat target={99.5} decimals={1} suffix="%" style={styles.statNum} />
            <div style={styles.statLabel}>Word Accuracy Rate</div>
          </div>
          <div style={styles.statCard}>
            <AnimatedStat target={10000} useComma={true} suffix="+" style={styles.statNum} />
            <div style={styles.statLabel}>Active Accounts</div>
          </div>
          <div style={styles.statCard}>
            <AnimatedStat target={50} suffix="+" style={styles.statNum} />
            <div style={styles.statLabel}>Languages Supported</div>
          </div>
        </div>

        <div style={{ ...styles.statsGrid, marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '30px' }}>
          <div style={styles.secondaryStatCard}>
            <AnimatedStat target={85} suffix="%" style={styles.secondaryStatNum} />
            <div style={styles.secondaryStatLabel}>Reduction in Dubbing Cost</div>
          </div>
          <div style={styles.secondaryStatCard}>
            <AnimatedStat target={50} suffix="ms" style={styles.secondaryStatNum} />
            <div style={styles.secondaryStatLabel}>Synthesis Average Latency</div>
          </div>
          <div style={styles.secondaryStatCard}>
            <AnimatedStat target={24} suffix="/7" style={styles.secondaryStatNum} />
            <div style={styles.secondaryStatLabel}>API Availability</div>
          </div>
        </div>
      </motion.section>

      {/* Why Choose Our API */}
      <motion.section
        style={{ ...styles.section, borderTop: '1px solid var(--border-color)' }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div style={styles.sectionHeader}>
          <span className="badge badge-purple">Why Choose Our API?</span>
          <h2 style={styles.sectionTitle}>Built for High-Scale Applications</h2>
          <p style={styles.sectionDesc}>Fast, reliable voice infrastructure designed for developers and enterprise scale.</p>
        </div>

        <div style={styles.whyGrid}>
          {[
            { title: 'Lightning Fast', text: 'Deploy state-of-the-art neural speech synthesis that responds in milliseconds to support real-time interactions.' },
            { title: 'Secure & Compliant', text: 'Full end-to-end data encryption, private key auth, and strict voice data privacy compliance guarantees.' },
            { title: '99.5% Accurate', text: 'Intelligent contextual speech processors that correctly parse names, accents, and punctuation marks.' },
          ].map(({ title, text }, idx) => (
            <motion.div
              key={title}
              className="glass-card"
              style={styles.whyCard}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <h4 style={styles.whyTitle}>{title}</h4>
              <p style={styles.whyDesc}>{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Customer Stories / Testimonials */}
      <motion.section
        style={{ ...styles.section, background: 'rgba(124, 58, 237, 0.02)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Trusted by Modern Content Teams</h2>
          <p style={styles.sectionDesc}>See what our partners say about the speed and vocal quality of Conversa AI.</p>
        </div>

        <div style={styles.testimonialsGrid}>
          <motion.div
            className="glass-card"
            style={styles.testimonialCard}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
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
          </motion.div>

          <motion.div
            className="glass-card"
            style={styles.testimonialCard}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
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
          </motion.div>
        </div>
      </motion.section>

      {/* Frequently Asked Questions */}
      <motion.section
        style={styles.section}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
          <p style={styles.sectionDesc}>Everything you need to know about Conversa AI.</p>
        </div>

        <div style={styles.faqWrapper}>
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              style={{
                ...styles.faqItem,
                borderColor: activeFaq === idx ? 'var(--primary)' : 'var(--border-color)',
                background: activeFaq === idx ? 'rgba(124, 58, 237, 0.02)' : 'transparent'
              }}
              onClick={() => toggleFaq(idx)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <div style={styles.faqQuestionRow}>
                <span style={styles.faqQuestion}>{faq.q}</span>
                {activeFaq === idx ? (
                  <Minus size={18} color="var(--primary)" />
                ) : (
                  <Plus size={18} color="var(--text-secondary)" />
                )}
              </div>
              <AnimatePresence initial={false}>
                {activeFaq === idx && (
                  <motion.div
                    style={styles.faqAnswer}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA final banner */}
      <motion.section
        style={styles.ctaSection}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>Ready to Transform Your Voice Workflows?</h2>
          <p style={styles.ctaDesc}>
            Join thousands of developers and creators who trust our AI to synthesize and transcribe voice streams.
          </p>
          <div style={styles.ctaActions}>
            <motion.button
              onClick={startTrial}
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1.05rem' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Your Free Trial
            </motion.button>
            <motion.button
              onClick={() => navigate('/contact')}
              className="btn btn-outline"
              style={{ padding: '14px 28px', fontSize: '1.05rem' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Contact Sales
            </motion.button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

const styles = {
  page: {
    width: '100%',
    paddingBottom: '80px',
  },
  heroSection: {
    width: '100%',
    padding: '100px 24px 64px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'radial-gradient(circle at 50% 0%, rgba(124, 58, 237,0.10) 0%, rgba(139,92,246,0.05) 45%, transparent 75%)',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(124, 58, 237, 0.1)',
    border: '1px solid rgba(124, 58, 237, 0.25)',
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
    background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 55%, #ec4899 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
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
    color: 'var(--text-secondary)',
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
    border: '1px solid rgba(124, 58, 237, 0.3)',
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
    overflow: 'hidden',
  },
  ctaSection: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto 80px auto',
    padding: '0 24px',
  },
  ctaCard: {
    background: 'radial-gradient(circle at top right, rgba(124, 58, 237, 0.22) 0%, transparent 60%), radial-gradient(circle at bottom left, rgba(236,72,153, 0.14) 0%, transparent 60%), rgba(15,23,42,0.02)',
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
