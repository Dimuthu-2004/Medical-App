import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

/* ─── Animated heartbeat SVG line ─────────────────────────── */
const HeartbeatLine = () => (
    <svg viewBox="0 0 600 80" style={{ width: '100%', maxWidth: 600, opacity: 0.7 }}>
        <motion.polyline
            points="0,40 80,40 110,10 130,70 160,5 190,75 220,40 600,40"
            fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
        />
    </svg>
);


/* ─── Floating orb ─────────────────────────────────────────── */


/* ─── Floating orb ─────────────────────────────────────────── */
const Orb = ({ style }) => (
    <motion.div
        style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none', ...style }}
        animate={{ scale: [1, 1.3, 1], opacity: [style.opacity || 0.3, (style.opacity || 0.3) + 0.15, style.opacity || 0.3] }}
        transition={{ duration: style.dur || 8, repeat: Infinity, ease: 'easeInOut', delay: style.delay || 0 }}
    />
);

/* ─── Animated counter ─────────────────────────────────────── */
const Counter = ({ to, suffix = '' }) => {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                let start = 0;
                const step = Math.ceil(to / 60);
                const t = setInterval(() => {
                    start += step;
                    if (start >= to) { setVal(to); clearInterval(t); }
                    else setVal(start);
                }, 20);
            }
        }, { threshold: 0.5 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [to]);
    return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

/* ─── Feature card ─────────────────────────────────────────── */
const FeatureCard = ({ icon, title, desc, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay, ease: 'easeOut' }}
        whileHover={{ y: -8, boxShadow: '0 24px 50px rgba(0,0,0,0.18)' }}
        style={styles.card}
    >
        <motion.div style={styles.cardIcon} whileHover={{ scale: 1.15, rotate: 5, background: '#2563eb' }}>
            <span style={{ fontSize: '1.8rem' }}>{icon}</span>
        </motion.div>
        <h3 style={styles.cardTitle}>{title}</h3>
        <p style={styles.cardDesc}>{desc}</p>
    </motion.div>
);

/* ─── Step ─────────────────────────────────────────────────── */
const Step = ({ num, title, desc, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        style={{ textAlign: 'center', flex: 1, minWidth: 220 }}
    >
        <motion.div
            style={styles.stepNum}
            animate={{ boxShadow: ['0 0 0 0 rgba(37,99,235,0.4)', '0 0 0 14px rgba(37,99,235,0)', '0 0 0 0 rgba(37,99,235,0)'] }}
            transition={{ duration: 2.5, repeat: Infinity, delay }}
        >
            {num}
        </motion.div>
        <h4 style={{ fontWeight: 700, margin: '1rem 0 0.4rem', color: '#1e293b' }}>{title}</h4>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{desc}</p>
    </motion.div>
);

/* ─── DNA helix SVG animated ───────────────────────────────── */
const DNAHelix = () => (
    <svg width="60" height="200" viewBox="0 0 60 200" style={{ position: 'absolute', right: 40, top: '20%', opacity: 0.25 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <g key={i}>
                <motion.circle
                    cx={30 + 22 * Math.sin((i / 10) * Math.PI * 2)}
                    cy={i * 20 + 10}
                    r="5" fill="#3b82f6"
                    animate={{ cx: [30 + 22 * Math.sin((i / 10) * Math.PI * 2), 30 - 22 * Math.sin((i / 10) * Math.PI * 2), 30 + 22 * Math.sin((i / 10) * Math.PI * 2)] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
                />
                <motion.circle
                    cx={30 - 22 * Math.sin((i / 10) * Math.PI * 2)}
                    cy={i * 20 + 10}
                    r="5" fill="#a855f7"
                    animate={{ cx: [30 - 22 * Math.sin((i / 10) * Math.PI * 2), 30 + 22 * Math.sin((i / 10) * Math.PI * 2), 30 - 22 * Math.sin((i / 10) * Math.PI * 2)] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
                />
                <motion.line
                    x1={30 + 22 * Math.sin((i / 10) * Math.PI * 2)}
                    y1={i * 20 + 10}
                    x2={30 - 22 * Math.sin((i / 10) * Math.PI * 2)}
                    y2={i * 20 + 10}
                    stroke="#93c5fd" strokeWidth="1.5"
                    animate={{
                        x1: [30 + 22 * Math.sin((i / 10) * Math.PI * 2), 30 - 22 * Math.sin((i / 10) * Math.PI * 2), 30 + 22 * Math.sin((i / 10) * Math.PI * 2)],
                        x2: [30 - 22 * Math.sin((i / 10) * Math.PI * 2), 30 + 22 * Math.sin((i / 10) * Math.PI * 2), 30 - 22 * Math.sin((i / 10) * Math.PI * 2)],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
                />
            </g>
        ))}
    </svg>
);

/* ─── Main LandingPage ─────────────────────────────────────── */
export default function LandingPage() {
    const features = [
        { icon: '🤖', title: 'AI Symptom Check', desc: 'Get instant preliminary analysis with our advanced AI before visiting the clinic.', delay: 0.1 },
        { icon: '📅', title: 'Fast Booking', desc: 'Book appointments in seconds — no hold music, no paperwork, no stress.', delay: 0.2 },
        { icon: '📋', title: 'Digital Health Records', desc: 'Access prescriptions, lab results, and your entire medical history in one place.', delay: 0.3 },
        { icon: '💊', title: 'Medication Tracking', desc: 'Never miss a dose with smart reminders and prescription management.', delay: 0.4 },
        { icon: '❤️', title: 'Vitals Monitoring', desc: 'Track your blood pressure, glucose levels, and other vitals over time.', delay: 0.5 },
        { icon: '🔒', title: 'Secure & Private', desc: 'Your data is encrypted and protected with hospital-grade security.', delay: 0.6 },
    ];

    const stats = [
        { value: 5000, suffix: '+', label: 'Patients Served' },
        { value: 120, suffix: '+', label: 'Specialists' },
        { value: 98, suffix: '%', label: 'Satisfaction Rate' },
        { value: 24, suffix: '/7', label: 'Support' },
    ];

    return (
        <div style={styles.page}>
            {/* ── HERO ── */}
            <section style={styles.hero}>
                {/* Background image */}
                <div style={styles.heroBg} />
                <div style={styles.heroOverlay} />

                {/* Floating orbs */}
                <Orb style={{ width: 500, height: 500, top: -150, left: -150, background: 'rgba(37,99,235,0.35)', dur: 10, opacity: 0.35 }} />
                <Orb style={{ width: 400, height: 400, bottom: -100, right: -100, background: 'rgba(124,58,237,0.3)', dur: 12, delay: 2, opacity: 0.3 }} />
                <Orb style={{ width: 250, height: 250, top: '30%', right: '20%', background: 'rgba(16,185,129,0.2)', dur: 7, delay: 1, opacity: 0.2 }} />

                {/* DNA helix decoration */}
                <DNAHelix />

                {/* Navbar */}
                <nav style={styles.nav}>
                    <div style={styles.navLogo}>
                        <motion.div
                            style={styles.navIcon}
                            animate={{ boxShadow: ['0 0 10px rgba(37,99,235,0.5)', '0 0 25px rgba(37,99,235,0.8)', '0 0 10px rgba(37,99,235,0.5)'] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </motion.div>
                        <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'white', letterSpacing: '-0.5px' }}>SmartClinic</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <motion.a href="/login" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={styles.navBtnOutline}>Sign In</motion.a>
                    </div>
                </nav>

                {/* Hero content */}
                <div style={styles.heroContent}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <motion.span
                            style={styles.badge}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            ✦ AI-Powered Healthcare Platform
                        </motion.span>

                        <motion.h1
                            style={styles.heroTitle}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                        >
                            Your Health,{' '}
                            <motion.span
                                style={{ color: '#60a5fa' }}
                                animate={{ color: ['#60a5fa', '#a78bfa', '#34d399', '#60a5fa'] }}
                                transition={{ duration: 5, repeat: Infinity }}
                            >
                                Simplified
                            </motion.span>
                        </motion.h1>

                        <motion.p
                            style={styles.heroSub}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            Empowering you with AI-driven insights and effortless scheduling.<br />
                            Experience healthcare that's tailored to your life.
                        </motion.p>

                        <motion.div
                            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65 }}
                        >
                            <motion.a href="/login" whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(255,255,255,0.3)' }} whileTap={{ scale: 0.97 }} style={styles.btnWhite}>
                                🚀 Start Your Journey
                            </motion.a>
                            <motion.a href="/register/patient" whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(37,99,235,0.4)' }} whileTap={{ scale: 0.97 }} style={styles.btnBlue}>
                                Create Patient Account
                            </motion.a>
                        </motion.div>

                        {/* Heartbeat line */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                            <HeartbeatLine />
                        </motion.div>

                        {/* Enhanced Booking CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.1, duration: 0.8 }}
                            style={{
                                marginTop: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <motion.p
                                style={{
                                    color: 'rgba(255,255,255,0.85)',
                                    fontSize: '1.25rem',
                                    marginBottom: '1.8rem',
                                    fontWeight: '500',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                    maxWidth: '600px'
                                }}
                            >
                                Take the first step towards better health today.
                            </motion.p>

                            <motion.a
                                href="/register/patient?redirectTo=/appointments/add"
                                whileHover={{
                                    scale: 1.08,
                                    boxShadow: '0 0 40px rgba(79, 70, 229, 0.6), 0 0 100px rgba(79, 70, 229, 0.2)',
                                    background: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)'
                                }}
                                whileTap={{ scale: 0.94 }}
                                style={{
                                    padding: '22px 56px',
                                    fontSize: '1.4rem',
                                    fontWeight: '800',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '100px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                                    boxShadow: '0 15px 45px rgba(79, 70, 229, 0.4)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Glowing pulse effect */}
                                <motion.div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                                    }}
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 0.6, 0.3]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />

                                <span style={{ position: 'relative', zIndex: 1 }}>📅</span>
                                <span style={{ position: 'relative', zIndex: 1 }}>Book an Appointment</span>
                            </motion.a>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section style={styles.statsSection}>
                {stats.map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        style={styles.statItem}
                    >
                        <div style={styles.statValue}><Counter to={s.value} suffix={s.suffix} /></div>
                        <div style={styles.statLabel}>{s.label}</div>
                    </motion.div>
                ))}
            </section>

            {/* ── FEATURES ── */}
            <section style={styles.section}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '3rem' }}
                >
                    <h2 style={styles.sectionTitle}>Designed for <span style={{ color: '#2563eb' }}>You</span></h2>
                    <p style={styles.sectionSub}>Everything you need for a healthier tomorrow, at your fingertips.</p>
                </motion.div>
                <div style={styles.grid3}>
                    {features.map((f, i) => <FeatureCard key={i} {...f} />)}
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section style={{ ...styles.section, background: '#f8faff' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '3rem' }}
                >
                    <h2 style={styles.sectionTitle}>Simple <span style={{ color: '#2563eb' }}>3-Step</span> Care</h2>
                    <p style={styles.sectionSub}>Getting the best care has never been this easy.</p>
                </motion.div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
                    <Step num="1" title="Register" desc="Create your patient profile in minutes and secure your medical history." delay={0.1} />
                    <motion.div
                        style={{ width: 2, background: 'linear-gradient(180deg,transparent,#2563eb,transparent)', alignSelf: 'stretch', minHeight: 80 }}
                        initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                    />
                    <Step num="2" title="Book AI-Smartly" desc="Check your symptoms and find the right specialist immediately." delay={0.2} />
                    <motion.div
                        style={{ width: 2, background: 'linear-gradient(180deg,transparent,#2563eb,transparent)', alignSelf: 'stretch', minHeight: 80 }}
                        initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }}
                    />
                    <Step num="3" title="Get Treated" desc="Visit the clinic or consult online and receive digital prescriptions instantly." delay={0.3} />
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={styles.cta}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    style={{ textAlign: 'center' }}
                >
                    <motion.div
                        style={{ fontSize: '3rem', marginBottom: '1rem' }}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >❤️</motion.div>
                    <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'white', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
                        Ready to Prioritize Your Health?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        Join thousands of patients who trust SmartClinic for their daily wellness.
                    </p>
                    <motion.a
                        href="/register/patient"
                        whileHover={{ scale: 1.06, boxShadow: '0 20px 50px rgba(255,255,255,0.3)' }}
                        whileTap={{ scale: 0.97 }}
                        style={styles.ctaBtn}
                    >
                        Register for Free →
                    </motion.a>
                </motion.div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={styles.footer}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ ...styles.navIcon, width: 32, height: 32 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>SmartClinic</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>© 2025 SmartClinic. All rights reserved.</p>
            </footer>
        </div>
    );
}

const styles = {
    page: { fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", overflowX: 'hidden' },
    hero: { position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    heroBg: {
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/images/hero_bg.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
    },
    heroOverlay: {
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,58,138,0.75) 100%)',
    },
    nav: {
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.2rem 2rem',
    },
    navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
    navIcon: {
        width: 38, height: 38,
        background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    navBtnOutline: {
        padding: '8px 20px', borderRadius: '100px',
        border: '1px solid rgba(255,255,255,0.4)', color: 'white',
        textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem',
        backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.08)',
        transition: 'all 0.3s',
    },
    navBtnFill: {
        padding: '8px 22px', borderRadius: '100px',
        background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: 'white',
        textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem',
        boxShadow: '0 4px 15px rgba(37,99,235,0.4)', transition: 'all 0.3s',
    },
    heroContent: {
        position: 'relative', zIndex: 5, flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '6rem 2rem',
    },
    badge: {
        display: 'inline-block', padding: '6px 18px',
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '100px', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem',
        marginBottom: '1.5rem', backdropFilter: 'blur(8px)',
    },
    heroTitle: {
        fontSize: 'clamp(2.8rem,6vw,4.5rem)', fontWeight: 800,
        color: 'white', letterSpacing: '-2px', lineHeight: 1.1,
        margin: '0 auto 1.2rem', maxWidth: 800,
    },
    heroSub: {
        fontSize: '1.15rem', color: 'rgba(255,255,255,0.72)',
        maxWidth: 580, margin: '0 auto 2rem', lineHeight: 1.7,
    },
    btnWhite: {
        padding: '14px 32px', borderRadius: '100px',
        background: 'white', color: '#2563eb',
        textDecoration: 'none', fontWeight: '700', fontSize: '1rem',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)', transition: 'all 0.3s',
    },
    btnBlue: {
        padding: '14px 32px', borderRadius: '100px',
        background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white',
        textDecoration: 'none', fontWeight: '700', fontSize: '1rem',
        border: '2px solid rgba(255,255,255,0.25)', transition: 'all 0.3s',
    },
    statsSection: {
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        gap: '1px', background: '#e2e8f0',
        borderTop: '1px solid #e2e8f0',
    },
    statItem: {
        flex: '1 1 150px', textAlign: 'center',
        padding: '2rem 1.5rem', background: 'white',
    },
    statValue: { fontSize: '2.4rem', fontWeight: 800, color: '#2563eb', lineHeight: 1 },
    statLabel: { fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
    section: { padding: '5rem 2rem', background: 'white' },
    sectionTitle: { fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' },
    sectionSub: { color: '#64748b', fontSize: '1rem', maxWidth: 500, margin: '0 auto' },
    grid3: { display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', maxWidth: 1100, margin: '0 auto' },
    card: {
        flex: '1 1 280px', maxWidth: 340, padding: '2rem',
        borderRadius: '1.2rem', background: 'white',
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        transition: 'all 0.4s',
    },
    cardIcon: {
        width: 60, height: 60, borderRadius: '14px',
        background: 'rgba(37,99,235,0.08)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '1rem', transition: 'all 0.3s',
    },
    cardTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' },
    cardDesc: { fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 },
    stepNum: {
        width: 60, height: 60,
        background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white',
        fontSize: '1.4rem', fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%', margin: '0 auto',
        boxShadow: '0 10px 25px rgba(37,99,235,0.3)',
    },
    cta: {
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#7c3aed 100%)',
        position: 'relative', overflow: 'hidden',
    },
    ctaBtn: {
        display: 'inline-block',
        padding: '16px 44px', borderRadius: '100px',
        background: 'white', color: '#2563eb',
        textDecoration: 'none', fontWeight: 800, fontSize: '1.05rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)', transition: 'all 0.3s',
    },
    footer: {
        padding: '2rem', textAlign: 'center',
        borderTop: '1px solid #f1f5f9', background: '#f8faff',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
};
