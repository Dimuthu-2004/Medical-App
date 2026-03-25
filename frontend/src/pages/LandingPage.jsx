import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
    CalendarCheck2,
    CreditCard,
    FileText,
    MessageSquareText,
    Phone,
    ShieldCheck,
    Star,
    Stethoscope
} from 'lucide-react';
import SymptomAnalyzerWidget from '../components/SymptomAnalyzerWidget';
import api from '../services/api';

const Section = ({ id, eyebrow, title, subtitle, children, sectionStyle = {}, containerStyle = {} }) => (
    <section id={id} style={{ padding: '84px 0', ...sectionStyle }}>
        <div className="app-container">
            <div style={{ maxWidth: 920, ...containerStyle }}>
                {eyebrow && <div className="app-kicker">{eyebrow}</div>}
                <h2 className="app-display" style={{ margin: '16px 0 10px', fontSize: '2.25rem', color: 'var(--app-text)' }}>
                    {title}
                </h2>
                {subtitle && <p style={{ margin: 0, color: 'var(--app-muted)', fontWeight: 650, lineHeight: 1.55, fontSize: '1.05rem' }}>{subtitle}</p>}
            </div>
            <div style={{ marginTop: 26 }}>{children}</div>
        </div>
    </section>
);

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const EcgWave = ({ width = 110, height = 24, color = 'rgba(15,23,42,0.62)' }) => {
    const reduceMotion = useReducedMotion();
    const d = 'M0 12 H14 L20 12 L24 4 L29 20 L34 12 H46 L52 12 L56 2 L61 22 L66 12 H78 L84 12 L88 6 L93 18 L98 12 H110';

    return (
        <svg width={width} height={height} viewBox="0 0 110 24" fill="none" aria-hidden="true" style={{ display: 'block' }}>
            <path d={d} stroke="rgba(15,23,42,0.16)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <motion.path
                d={d}
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="120"
                initial={{ strokeDashoffset: 120 }}
                animate={reduceMotion ? { strokeDashoffset: 0 } : { strokeDashoffset: [120, 0] }}
                transition={reduceMotion ? { duration: 0 } : { duration: 1.6, repeat: Infinity, ease: 'linear' }}
            />
        </svg>
    );
};

const DnaMark = () => {
    const reduceMotion = useReducedMotion();

    const W = 220;
    const H = 360;
    const cx = 110;
    const amp = 42;
    const cycles = 3.15;
    const omega = (Math.PI * 2 * cycles) / H;

    const buildWavePoints = (phase) => {
        const pts = [];
        for (let y = 12; y <= H - 12; y += 10) {
            const x = cx + amp * Math.sin(omega * y + phase);
            pts.push({ x, y });
        }
        return pts;
    };

    const toSmoothPath = (pts) => {
        if (!pts.length) return '';
        let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
        for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1];
            const cur = pts[i];
            const mx = (prev.x + cur.x) / 2;
            const my = (prev.y + cur.y) / 2;
            d += ` Q ${prev.x.toFixed(2)} ${prev.y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
        }
        const last = pts[pts.length - 1];
        d += ` T ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
        return d;
    };

    const red = '#ef4444';
    const blue = '#3b82f6';

    const leftPts = useMemo(() => buildWavePoints(0), []);
    const rightPts = useMemo(() => buildWavePoints(Math.PI), []);
    const leftPath = useMemo(() => toSmoothPath(leftPts), [leftPts]);
    const rightPath = useMemo(() => toSmoothPath(rightPts), [rightPts]);

    const rungs = useMemo(() => {
        const out = [];
        const count = 14;
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const y = 26 + t * (H - 52);
            const xL = cx + amp * Math.sin(omega * y + 0);
            const xR = cx + amp * Math.sin(omega * y + Math.PI);
            const s = Math.sin(omega * y);
            const front = s > 0;
            out.push({ i, y, xL, xR, front, depth: Math.abs(s) });
        }
        return out;
    }, [H, cx, amp, omega]);

    return (
        <motion.div
            className="landing-dna"
            aria-hidden="true"
            style={{ position: 'absolute', left: 26, bottom: 28, zIndex: 1, pointerEvents: 'none', opacity: 0.65 }}
            animate={reduceMotion ? {} : { y: [0, -10, 0], rotate: [0, -1.2, 0] }}
            transition={reduceMotion ? {} : { duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
        >
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
                <defs>
                    <linearGradient id="dnaRung" x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor={red} stopOpacity="0.95" />
                        <stop offset="1" stopColor={blue} stopOpacity="0.95" />
                    </linearGradient>
                    <filter id="dnaGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.25 0"
                            result="glow"
                        />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <motion.g
                    filter="url(#dnaGlow)"
                    animate={reduceMotion ? {} : { y: [0, -6, 0] }}
                    transition={reduceMotion ? {} : { duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <motion.path
                        d={leftPath}
                        stroke={red}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="12 10"
                        animate={reduceMotion ? {} : { strokeDashoffset: [0, -64] }}
                        transition={reduceMotion ? {} : { duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.path
                        d={rightPath}
                        stroke={blue}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="12 10"
                        animate={reduceMotion ? {} : { strokeDashoffset: [0, 64] }}
                        transition={reduceMotion ? {} : { duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    />

                    {rungs.map((r) => {
                        const op = r.front ? 0.55 + 0.25 * r.depth : 0.22 + 0.10 * r.depth;
                        const sw = r.front ? 2.7 : 2.0;
                        const nodeR = r.front ? 3.4 : 2.6;
                        return (
                            <g key={r.i} opacity={op}>
                                <line
                                    x1={r.xL}
                                    y1={r.y}
                                    x2={r.xR}
                                    y2={r.y}
                                    stroke="url(#dnaRung)"
                                    strokeWidth={sw}
                                    strokeLinecap="round"
                                />
                                <circle cx={r.xL} cy={r.y} r={nodeR} fill={red} />
                                <circle cx={r.xR} cy={r.y} r={nodeR} fill={blue} />
                            </g>
                        );
                    })}
                </motion.g>
            </svg>
        </motion.div>
    );
};

const MotionIcon = ({ icon: Icon, label }) => (
    <motion.span
        aria-hidden="true"
        title={label}
        initial={{ opacity: 0, y: 8, rotate: -6 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true, margin: '-120px' }}
        whileHover={{ rotate: 6, scale: 1.05 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'inline-flex' }}
    >
        <Icon size={20} />
    </motion.span>
);

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <motion.div
        className="app-card app-card-hover"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-120px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ padding: 20, borderRadius: 22 }}
    >
        <motion.div
            whileHover={{ y: -2, rotate: 3 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(37,99,235,0.10))',
            border: '1px solid rgba(14,165,233,0.18)',
            color: 'rgba(15,23,42,0.82)',
            marginBottom: 14
        }}>
            <MotionIcon icon={Icon} label={title} />
        </motion.div>
        <div style={{ fontWeight: 900, color: 'var(--app-text)', letterSpacing: '-0.02em' }}>{title}</div>
        <p style={{ margin: '8px 0 0', color: 'var(--app-muted)', lineHeight: 1.5, fontWeight: 650 }}>{desc}</p>
    </motion.div>
);

const AnimatedStat = ({ to, suffix = '', label }) => {
    const ref = useRef(null);
    const [value, setValue] = useState(0);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (started) return;
        const el = ref.current;
        if (!el) return;

        const obs = new IntersectionObserver((entries) => {
            if (!entries[0]?.isIntersecting) return;
            setStarted(true);
        }, { threshold: 0.35 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;
        const durationMs = 1100;
        const start = performance.now();
        let raf = 0;

        const tick = (now) => {
            const t = Math.min(1, (now - start) / durationMs);
            setValue(Math.round(to * easeOutCubic(t)));
            if (t < 1) raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [started, to]);

    return (
        <div ref={ref} className="app-glass" style={{ padding: 16, borderRadius: 22 }}>
            <div className="app-display" style={{ fontSize: '1.55rem', fontWeight: 700, color: 'var(--app-text)' }}>
                {value.toLocaleString()}{suffix}
            </div>
            <div style={{ color: 'var(--app-muted)', fontWeight: 750, marginTop: 2 }}>{label}</div>
        </div>
    );
};

const Stat = ({ value, label }) => (
    <div className="app-glass" style={{ padding: 16, borderRadius: 22 }}>
        <div className="app-display" style={{ fontSize: '1.55rem', fontWeight: 700, color: 'var(--app-text)' }}>{value}</div>
        <div style={{ color: 'var(--app-muted)', fontWeight: 750, marginTop: 2 }}>{label}</div>
    </div>
);

const AIFeatureBanner = () => {
    const slides = useMemo(() => ([
        {
            title: 'SmartClinic chatbot support 24X7',
            desc: 'It will help and support users 24X7 for bookings, payments, OCR, and feedback.',
            tag: 'Assistant',
            image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1600&q=80'
        },
        {
            title: 'Symptom analyzer before the visit',
            desc: 'Pick your symptoms to see likely conditions and decide next steps.',
            tag: 'Symptom tool',
            image: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?auto=format&fit=crop&w=1600&q=80'
        },
        {
            title: 'Real prescription OCR checking',
            desc: 'Upload a clear prescription image and extract text quickly with OCR checking.',
            tag: 'OCR',
            image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80'
        },
        {
            title: 'AI skin risk screening in one upload',
            desc: 'Drag and drop a skin photo to estimate risk level, confidence, and recommended next step.',
            tag: 'Skin scan',
            image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1600&q=80'
        },
    ]), []);

    const [active, setActive] = useState(0);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (reduceMotion) return;
        const t = setInterval(() => setActive((v) => (v + 1) % slides.length), 5200);
        return () => clearInterval(t);
    }, [slides.length, reduceMotion]);

    const current = slides[active];

    return (
        <div
            className="app-card"
            style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 28,
                padding: '26px 26px 26px 26px',
                background: 'var(--app-surface)',
                boxShadow: '0 28px 72px rgba(15,23,42,0.18)',
                marginBottom: 28,
            }}
        >
            <motion.div
                key={current.image}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `linear-gradient(120deg, rgba(15,23,42,0.86) 0%, rgba(15,23,42,0.55) 45%, rgba(15,23,42,0.35) 60%, rgba(255,255,255,0) 100%), url(${current.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'saturate(1.05)',
                    transform: 'scale(1.02)',
                    zIndex: 0
                }}
            />

            <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 22, alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', color: '#e0f2fe', fontWeight: 800, letterSpacing: '0.01em' }}>
                        <span style={{ width: 9, height: 9, borderRadius: 999, background: 'linear-gradient(135deg, #22c55e, #14b8a6)', boxShadow: '0 0 0 6px rgba(34,197,94,0.15)' }} />
                        {current.tag}
                    </div>
                    <h3 className="app-display" style={{ margin: '14px 0 6px', color: 'white', fontSize: '2.45rem', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
                        {current.title}
                    </h3>
                    <p style={{ margin: 0, color: 'rgba(226,232,240,0.9)', fontWeight: 700, lineHeight: 1.55, maxWidth: 560 }}>
                        {current.desc}
                    </p>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={current.title}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="app-glass"
                        style={{
                            borderRadius: 24,
                            padding: 18,
                            backdropFilter: 'blur(14px)',
                            background: 'rgba(255,255,255,0.24)',
                            color: 'var(--app-text)'
                        }}
                    >
                        <div style={{ display: 'grid', gap: 12 }}>
                            {slides.map((s, idx) => (
                                <button
                                    key={s.title}
                                    type="button"
                                    onClick={() => setActive(idx)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '12px 14px',
                                        borderRadius: 18,
                                        border: '1px solid rgba(255,255,255,0.35)',
                                        background: idx === active ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.16)',
                                        color: idx === active ? 'var(--app-text)' : 'rgba(255,255,255,0.9)',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        letterSpacing: '-0.01em',
                                        boxShadow: idx === active ? '0 18px 40px rgba(15,23,42,0.18)' : 'none',
                                        transition: 'all 160ms ease'
                                    }}
                                >
                                    {s.title}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-start' }}>
                            {slides.map((_, idx) => (
                                <span
                                    key={idx}
                                    aria-hidden="true"
                                    style={{
                                        width: idx === active ? 22 : 10,
                                        height: 10,
                                        borderRadius: 999,
                                        background: idx === active ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.55)',
                                        transition: 'all 160ms ease'
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

const HeroBackgroundSlideshow = () => {
    const slides = useMemo(() => ([
        { src: '/images/hero_bg.png' },
        { src: '/images/login_bg.webp' },
    ]), []);

    const [active, setActive] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setActive((v) => (v + 1) % slides.length), 6500);
        return () => clearInterval(t);
    }, [slides.length]);

    const current = slides[active];

    return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <AnimatePresence mode="wait">
                <motion.img
                    key={`${current.src}-${active}`}
                    src={current.src}
                    alt=""
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1.0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </AnimatePresence>

            {/* Scrim: keep text readable without killing the image. */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background:
                    'linear-gradient(90deg, rgba(246,251,255,0.94) 0%, rgba(246,251,255,0.86) 46%, rgba(246,251,255,0.58) 74%, rgba(246,251,255,0.25) 100%)'
            }} />

            {/* Slight vignette so the edges feel intentional. */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(1200px 680px at 20% 30%, rgba(255,255,255,0.00) 0%, rgba(15,23,42,0.08) 100%)'
            }} />

            {/* Dots */}
            <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.18,
                backgroundImage:
                    'radial-gradient(rgba(15,23,42,0.16) 1px, rgba(255,255,255,0) 1px)',
                backgroundSize: '18px 18px',
                mixBlendMode: 'multiply'
            }} />

            <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10 }}>
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => setActive(idx)}
                        aria-label={`Show slide ${idx + 1}`}
                        style={{
                            width: idx === active ? 26 : 10,
                            height: 10,
                            borderRadius: 999,
                            border: '0',
                            cursor: 'pointer',
                            background: idx === active ? 'rgba(15,23,42,0.65)' : 'rgba(15,23,42,0.22)',
                            transition: 'width 180ms ease, background 180ms ease'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const HeroStethoscope3D = ({ scrollYProgress }) => {
    const reduceMotion = useReducedMotion();

    const y = useTransform(scrollYProgress, [0, 1], [0, 165]);
    const rotateX = useTransform(scrollYProgress, [0, 1], [8, -14]);
    const rotateY = useTransform(scrollYProgress, [0, 1], [-14, 20]);
    const rotateZ = useTransform(scrollYProgress, [0, 1], [-2, 8]);
    const scale = useTransform(scrollYProgress, [0, 0.55, 1], [0.88, 1.14, 1.34]);
    const rotate = useTransform(scrollYProgress, [0, 0.55, 1], [0, 18, 44]);
    const opacity = useTransform(scrollYProgress, [0, 0.25, 1], [0.58, 0.85, 0.95]);

    if (reduceMotion) {
        return (
            <div className="landing-stetho" aria-hidden="true" style={{ position: 'absolute', right: '2%', top: 'clamp(420px, 58vh, 620px)', zIndex: 4, pointerEvents: 'none', opacity: 0.72 }}>
                <Stethoscope size={330} strokeWidth={1.2} color="rgba(15,23,42,0.62)" />
            </div>
        );
    }

    return (
        <motion.div
            className="landing-stetho"
            aria-hidden="true"
            style={{
                position: 'absolute',
                right: '1.2%',
                top: 'clamp(420px, 58vh, 640px)',
                zIndex: 4,
                pointerEvents: 'none',
                opacity,
                y,
                scale,
                rotate
            }}
        >
            <div style={{ position: 'relative', width: 420, height: 520, perspective: 1100 }}>
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: -70,
                        borderRadius: 999,
                        background:
                            'radial-gradient(closest-side at 40% 40%, rgba(14,165,233,0.25), rgba(37,99,235,0.12), rgba(20,184,166,0.10), rgba(255,255,255,0))',
                        filter: 'blur(34px)',
                        opacity: 0.9
                    }}
                    animate={{ scale: [1, 1.08, 1], rotate: [0, 10, 0] }}
                    transition={{ duration: 8.4, repeat: Infinity, ease: 'easeInOut' }}
                />

                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        transformStyle: 'preserve-3d',
                        rotateX,
                        rotateY,
                        rotateZ
                    }}
                >
                    {/* Depth layer */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 26,
                            top: 26,
                            transform: 'translateZ(-18px)',
                            opacity: 0.32,
                            filter: 'blur(0.4px) drop-shadow(0 40px 70px rgba(15,23,42,0.18))',
                            color: 'rgba(15,23,42,0.45)'
                        }}
                    >
                        <Stethoscope size={380} strokeWidth={1.25} />
                    </div>

                    {/* Main layer */}
                    <motion.div
                        animate={{ y: [0, -14, 0], scale: [1, 1.03, 1] }}
                        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            transform: 'translateZ(18px)',
                            filter: 'drop-shadow(0 35px 85px rgba(15,23,42,0.22))',
                            color: 'rgba(15,23,42,0.66)'
                        }}
                    >
                        <Stethoscope size={420} strokeWidth={1.15} />
                    </motion.div>

                    {/* Highlight stroke */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 2,
                            top: 2,
                            transform: 'translateZ(26px)',
                            opacity: 0.22,
                            color: 'rgba(255,255,255,0.92)',
                            filter: 'blur(0.2px)'
                        }}
                    >
                        <Stethoscope size={420} strokeWidth={0.9} />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const bgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
    const bgOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);
    const [ocrGuideOpen, setOcrGuideOpen] = useState(false);
    const ocrModalRef = useRef(null);
    const [publicFeedbacks, setPublicFeedbacks] = useState([]);
    const [feedbackActive, setFeedbackActive] = useState(0);

    useEffect(() => {
        if (!ocrGuideOpen) return;

        // Keep the modal fully visible and prevent background scroll.
        const prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        ocrModalRef.current?.scrollTo?.({ top: 0 });

        return () => {
            document.body.style.overflow = prevBodyOverflow;
        };
    }, [ocrGuideOpen]);

    const features = useMemo(() => ([
        { icon: Stethoscope, title: 'Symptom analyzer', desc: 'Select symptoms and get likely conditions from the trained model (guidance only).' },
        { icon: CalendarCheck2, title: 'Book by session', desc: 'Morning and evening sessions with clear appointment status and token flow.' },
        { icon: FileText, title: 'Records and vitals', desc: 'View your history and keep everything in one place without losing context.' },
        { icon: CreditCard, title: 'Payments and bills', desc: 'Track your bills and upload slips using a simple checkout flow.' },
        { icon: MessageSquareText, title: 'Feedback', desc: 'Submit feedback after completed appointments so the clinic can improve.' },
        { icon: ShieldCheck, title: 'Secure sign-in', desc: 'Session-based access with clear separation between patient and clinic workflows.' },
    ]), []);

    useEffect(() => {
        // If user arrives with hash, keep native behavior but smooth it a bit.
        if (window.location.hash) {
            const el = document.querySelector(window.location.hash);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    useEffect(() => {
        api.get('/api/feedback/public')
            .then((res) => setPublicFeedbacks(Array.isArray(res.data) ? res.data : []))
            .catch(() => setPublicFeedbacks([]));
    }, []);

    const feedbackSlides = useMemo(() => {
        const slides = [];
        for (let i = 0; i < publicFeedbacks.length; i += 3) {
            slides.push(publicFeedbacks.slice(i, i + 3));
        }
        return slides;
    }, [publicFeedbacks]);

    useEffect(() => {
        if (feedbackSlides.length <= 1) return;
        const t = setInterval(() => setFeedbackActive((v) => (v + 1) % feedbackSlides.length), 6000);
        return () => clearInterval(t);
    }, [feedbackSlides.length]);

    return (
        <div style={{ minHeight: '100vh' }}>
            <header ref={heroRef} style={{ position: 'relative', padding: '22px 0 0', minHeight: '92vh' }}>
                <HeroBackgroundSlideshow />
                <HeroStethoscope3D scrollYProgress={scrollYProgress} />
                <DnaMark />
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        overflow: 'hidden',
                        pointerEvents: 'none'
                    }}
                >
                    <motion.div
                        style={{
                            position: 'absolute',
                            inset: -120,
                            opacity: bgOpacity,
                            y: bgY,
                            backgroundImage:
                                'radial-gradient(1100px 700px at 16% 10%, rgba(14,165,233,0.22) 0%, rgba(14,165,233,0) 60%),' +
                                'radial-gradient(900px 640px at 85% 0%, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 62%),' +
                                'radial-gradient(800px 620px at 70% 90%, rgba(20,184,166,0.12) 0%, rgba(20,184,166,0) 55%)'
                        }}
                    />
                    <motion.div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: 110,
                            width: 980,
                            height: 520,
                            transform: 'translateX(-50%)',
                            borderRadius: 999,
                            background: 'conic-gradient(from 180deg at 50% 50%, rgba(14,165,233,0.00), rgba(14,165,233,0.22), rgba(37,99,235,0.00), rgba(20,184,166,0.18), rgba(14,165,233,0.00))',
                            filter: 'blur(50px)',
                            opacity: 0.55
                        }}
                        animate={{ rotate: [0, 6, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </motion.div>

                <div className="app-container" style={{ position: 'relative', zIndex: 1, paddingBottom: 36 }}>
                    <nav
                        className="app-glass"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            flexWrap: 'wrap',
                            padding: '10px 14px',
                            borderRadius: 20,
                            position: 'sticky',
                            top: 14,
                            zIndex: 20,
                            overflow: 'hidden',
                            border: '1px solid rgba(148,163,184,0.34)',
                            background: 'linear-gradient(115deg, rgba(255,255,255,0.94) 0%, rgba(240,249,255,0.92) 45%, rgba(236,253,245,0.88) 100%)',
                            boxShadow: '0 16px 42px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.82)',
                            backdropFilter: 'blur(14px) saturate(140%)',
                            WebkitBackdropFilter: 'blur(14px) saturate(140%)'
                        }}
                    >
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                background: 'radial-gradient(650px 200px at 0% 0%, rgba(59,130,246,0.14), rgba(59,130,246,0) 65%), radial-gradient(560px 180px at 100% 0%, rgba(20,184,166,0.14), rgba(20,184,166,0) 64%)'
                            }}
                        />
                        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: 42,
                                height: 42,
                                borderRadius: 14,
                                background: 'linear-gradient(135deg, rgba(14,165,233,0.95), rgba(37,99,235,0.95))',
                                display: 'grid',
                                placeItems: 'center',
                                boxShadow: '0 18px 45px rgba(37,99,235,0.22)'
                            }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            <div style={{ opacity: 0.85 }}>
                                <EcgWave width={84} height={22} color="rgba(37,99,235,0.72)" />
                            </div>
                            <div>
                                <div className="app-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--app-text)' }}>SmartClinic</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'rgba(15,23,42,0.55)' }}>Digital Care Portal</div>
                            </div>
                        </Link>

                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                            <a
                                className="app-btn"
                                href="tel:0332233027"
                                style={{
                                    background: 'rgba(14,165,233,0.08)',
                                    borderColor: 'rgba(14,165,233,0.25)',
                                    color: '#0c4a6e',
                                    fontWeight: 850,
                                    gap: 8
                                }}
                            >
                                <Phone size={16} />
                                0332233027
                            </a>
                            <a className="app-btn" href="#symptoms">Symptom analyzer</a>
                            <Link className="app-btn" to="/ocr">OCR</Link>
                            <a className="app-btn" href="#feedbacks">Patient feedback</a>
                            <Link className="app-btn" to="/login">Sign in</Link>
                            <Link className="app-btn app-btn-primary" to="/register/patient">Create account</Link>
                        </div>
                    </nav>

                    <div style={{ padding: '82px 0 34px' }}>
                        <AIFeatureBanner />
                        <div style={{ maxWidth: 900 }}>
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                className="app-kicker"
                            >
                                Book appointments, check symptoms, analyze skin, upload prescriptions
                            </motion.div>

                            <h1 className="app-display" style={{ margin: '18px 0 10px', fontSize: '3.55rem', lineHeight: 1.02, color: 'var(--app-text)' }}>
                                SmartClinic keeps the day{' '}
                                <span style={{
                                    background: 'linear-gradient(135deg, rgba(14,165,233,1), rgba(37,99,235,1))',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent'
                                }}>
                                    moving
                                </span>
                                .
                            </h1>
                            <p style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.65, color: 'var(--app-muted)', fontWeight: 700, maxWidth: 760 }}>
                                A patient-first portal to book a session, use the symptom analyzer before visiting the doctor, and keep your care history organized.
                            </p>

                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 22, flexWrap: 'wrap' }}>
                                <Link className="app-btn app-btn-primary" to="/appointments/add">Book an appointment</Link>
                                <Link className="app-btn" to="/ai/symptoms">Check symptoms</Link>
                                <Link className="app-btn" to="/ocr">OCR</Link>
                            </div>

                            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginTop: 34 }}>
                                <AnimatedStat to={2} suffix="/day" label="Clinic sessions" />
                                <AnimatedStat to={4} label="Appointment states" />
                                <AnimatedStat to={2} label="Session types" />
                                <Stat value="OCR + uploads" label="Prescription and slips" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <Section
                id="symptoms"
                eyebrow="Before You Visit"
                title="Check symptoms in seconds"
                subtitle="Patients can use the symptom analyzer before visiting the doctor, then book a session with better context."
                sectionStyle={{ position: 'relative', overflow: 'hidden' }}
            >
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        zIndex: 0,
                        backgroundImage: "linear-gradient(110deg, rgba(2,6,23,0.84) 8%, rgba(2,6,23,0.58) 42%, rgba(2,6,23,0.24) 100%), url('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1600&q=80')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                    animate={{ scale: [1, 1.03, 1], x: [0, -8, 0] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(900px 420px at 18% 10%, rgba(14,165,233,0.18), rgba(14,165,233,0.00) 60%)'
                        }}
                    />
                </motion.div>
                <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start', position: 'relative', zIndex: 1 }}>
                    <SymptomAnalyzerWidget compact title="Symptom Analyzer" />
                    <div className="app-card" style={{ padding: 22, borderRadius: 26 }}>
                        <div className="app-kicker">AI Skin Analysis</div>
                        <div style={{ fontWeight: 950, marginTop: 12, letterSpacing: '-0.02em' }}>Skin Disease Risk Assessment</div>
                        <p style={{ margin: '10px 0 0', color: 'var(--app-muted)', fontWeight: 650, lineHeight: 1.6 }}>
                            Upload a photo of your skin condition for instant AI-powered risk analysis.
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                            <Link className="app-btn app-btn-primary" to="/skin-scan">Analyze Skin</Link>
                        </div>
                    </div>
                    <div className="app-card" style={{ padding: 22, borderRadius: 26 }}>
                        <div className="app-kicker">Next steps</div>
                        <div style={{ fontWeight: 950, marginTop: 12, letterSpacing: '-0.02em' }}>If you are unsure, book a session</div>
                        <p style={{ margin: '10px 0 0', color: 'var(--app-muted)', fontWeight: 650, lineHeight: 1.6 }}>
                            The analyzer is a guide, not a diagnosis. If symptoms are severe or getting worse, seek urgent care.
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                            <Link className="app-btn app-btn-primary" to="/appointments/add">Book an appointment</Link>
                            <Link className="app-btn" to="/ocr">OCR</Link>
                        </div>
                    </div>
                </div>
            </Section>

            <Section
                id="feedbacks"
                eyebrow="Patient Voices"
                title="Recent feedback from patients"
                subtitle="Ratings and comments shared after appointments."
                sectionStyle={{
                    position: 'relative',
                    backgroundImage: "linear-gradient(110deg, rgba(248,250,252,0.92) 8%, rgba(248,250,252,0.82) 42%, rgba(248,250,252,0.68) 100%), url('https://images.unsplash.com/photo-1571772996211-2f02c9727629?auto=format&fit=crop&w=1800&q=80')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
                containerStyle={{
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {publicFeedbacks.length === 0 ? (
                    <div className="app-card" style={{ padding: 20, borderRadius: 20 }}>
                        <div style={{ color: 'var(--app-muted)', fontWeight: 700 }}>No feedback available yet.</div>
                    </div>
                ) : (
                    <>
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={feedbackActive}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="app-grid"
                                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
                            >
                                {feedbackSlides[feedbackActive]?.map((fb) => (
                                    <div key={fb.id} className="app-card" style={{ padding: 20, borderRadius: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                            <div style={{ fontWeight: 900, color: 'var(--app-text)' }}>{fb.patientName || 'Anonymous'}</div>
                                            <div style={{ display: 'inline-flex', gap: 2 }}>
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <Star key={n} size={14} fill={n <= (fb.rating || 0) ? '#f59e0b' : 'transparent'} color={n <= (fb.rating || 0) ? '#f59e0b' : '#94a3b8'} />
                                                ))}
                                            </div>
                                        </div>
                                        <p style={{ margin: '10px 0 0', color: 'var(--app-muted)', lineHeight: 1.6, fontWeight: 650 }}>
                                            "{fb.comment || 'Great experience.'}"
                                        </p>
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
                            {feedbackSlides.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setFeedbackActive(idx)}
                                    aria-label={`Show feedback slide ${idx + 1}`}
                                    style={{
                                        width: idx === feedbackActive ? 22 : 10,
                                        height: 10,
                                        borderRadius: 999,
                                        border: '0',
                                        cursor: 'pointer',
                                        background: idx === feedbackActive ? 'rgba(15,23,42,0.65)' : 'rgba(15,23,42,0.22)',
                                        transition: 'width 180ms ease, background 180ms ease'
                                    }}
                                />
                            ))}
                        </div>
                    </>
                )}
            </Section>

            <Section
                id="features"
                eyebrow="Features"
                title="Core clinic flows, end to end"
                subtitle="Book sessions, track records and payments, upload prescriptions, and share feedback. Clear screens for busy days."
                sectionStyle={{
                    position: 'relative',
                    backgroundImage: "linear-gradient(110deg, rgba(248,250,252,0.80) 10%, rgba(248,250,252,0.62) 48%, rgba(248,250,252,0.46) 100%), url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1800&q=80')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
                containerStyle={{ position: 'relative', zIndex: 1 }}
            >
                <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {features.map((f) => <FeatureCard key={f.title} {...f} />)}
                </div>
            </Section>

            <Section
                id="how"
                eyebrow="How It Works"
                title="Built around sessions and rules"
                subtitle="Less confusion. Fewer invalid actions. Clear outcomes."
                sectionStyle={{
                    position: 'relative',
                    backgroundImage: "linear-gradient(110deg, rgba(248,250,252,0.78) 10%, rgba(248,250,252,0.58) 48%, rgba(248,250,252,0.42) 100%), url('https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&w=1800&q=80')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
                containerStyle={{ position: 'relative', zIndex: 1 }}
            >
                <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                    <div className="app-card app-card-hover" style={{ padding: 22 }}>
                        <div className="app-kicker">Patients</div>
                        <div style={{ fontWeight: 950, marginTop: 12, letterSpacing: '-0.02em' }}>Book a session</div>
                        <p style={{ margin: '10px 0 0', color: 'var(--app-muted)', fontWeight: 650, lineHeight: 1.55 }}>
                            Available sessions are fetched from the server. Clinic schedule rules are enforced automatically.
                        </p>
                    </div>
                    <div className="app-card app-card-hover" style={{ padding: 22 }}>
                        <div className="app-kicker">Before you visit</div>
                        <div style={{ fontWeight: 950, marginTop: 12, letterSpacing: '-0.02em' }}>Check symptoms</div>
                        <p style={{ margin: '10px 0 0', color: 'var(--app-muted)', fontWeight: 650, lineHeight: 1.55 }}>
                            Use the symptom analyzer for quick guidance, then book a session to speak with a doctor.
                        </p>
                    </div>
                    <div className="app-card app-card-hover" style={{ padding: 22 }}>
                        <div className="app-kicker">After your visit</div>
                        <div style={{ fontWeight: 950, marginTop: 12, letterSpacing: '-0.02em' }}>Track records</div>
                        <p style={{ margin: '10px 0 0', color: 'var(--app-muted)', fontWeight: 650, lineHeight: 1.55 }}>
                            Review your appointment status, keep notes and vitals in one place, and leave feedback when done.
                        </p>
                    </div>
                </div>
            </Section>

            <Section
                id="contact"
                eyebrow="Contact"
                title="Need help or have a question?"
                subtitle="For appointment or payment questions, sign in to review your booking details or call us at 0332233027."
                sectionStyle={{
                    position: 'relative',
                    backgroundImage: "linear-gradient(110deg, rgba(248,250,252,0.80) 10%, rgba(248,250,252,0.62) 48%, rgba(248,250,252,0.44) 100%), url('https://images.unsplash.com/photo-1484981138541-b1f2ea2e2c3f?auto=format&fit=crop&w=1800&q=80')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
                containerStyle={{ position: 'relative', zIndex: 1 }}
            >
                <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                    <div className="app-card app-card-hover" style={{ padding: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 950, letterSpacing: '-0.02em' }}>
                            <MessageSquareText size={18} /> In-app support
                        </div>
                        <p style={{ margin: '10px 0 0', color: 'var(--app-muted)', fontWeight: 650, lineHeight: 1.55 }}>
                            Use Feedback after a completed appointment, or sign in to review booking and payment status.
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                            <Link className="app-btn app-btn-primary" to="/login">Sign in</Link>
                            <Link className="app-btn" to="/register/patient">Create account</Link>
                        </div>
                    </div>
                    <div className="app-card app-card-hover" style={{ padding: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 950, letterSpacing: '-0.02em' }}>
                            <Phone size={18} /> Clinic front desk
                        </div>
                        <p style={{ margin: '10px 0 0', color: 'var(--app-muted)', fontWeight: 650, lineHeight: 1.55 }}>
                            For rescheduling and other help, call us directly on 0332233027.
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                            <a className="app-btn app-btn-primary" href="tel:0332233027">Call 0332233027</a>
                        </div>
                    </div>
                </div>
            </Section>

            <section
                style={{
                    padding: '70px 0 90px',
                    backgroundImage: "linear-gradient(110deg, rgba(248,250,252,0.74) 10%, rgba(248,250,252,0.56) 48%, rgba(248,250,252,0.40) 100%), url('https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1800&q=80')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="app-container">
                    <div className="app-glass" style={{ padding: 28, borderRadius: 26, display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ maxWidth: 680 }}>
                            <div className="app-kicker">Ready</div>
                            <div className="app-display" style={{ fontSize: '2.1rem', marginTop: 12, color: 'var(--app-text)' }}>
                                Feel prepared before your visit.
                            </div>
                            <div style={{ marginTop: 10, color: 'var(--app-muted)', fontWeight: 700, lineHeight: 1.55 }}>
                                Check symptoms, book a session, and keep your care history in one place.
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <Link className="app-btn app-btn-primary" to="/appointments/add">Book an appointment</Link>
                            <Link className="app-btn" to="/ai/symptoms">Check symptoms</Link>
                        </div>
                    </div>

                    <footer style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', color: 'rgba(15,23,42,0.55)', fontWeight: 750 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                            <span>SmartClinic</span>
                            <span style={{ opacity: 0.9 }}><EcgWave width={120} height={24} color="rgba(37,99,235,0.65)" /></span>
                            <a href="tel:0332233027" className="hover-blue">0332233027</a>
                        </div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            <a href="#features" className="hover-blue">Features</a>
                            <a href="#symptoms" className="hover-blue">Symptom analyzer</a>
                            <a href="#how" className="hover-blue">How it works</a>
                            <a href="#contact" className="hover-blue">Contact</a>
                            <Link to="/login" className="hover-blue">Sign in</Link>
                        </div>
                    </footer>

                    <div style={{ marginTop: 18, opacity: 0.6 }}>
                        <EcgWave width="100%" height={34} color="rgba(14,165,233,0.55)" />
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {ocrGuideOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1000,
                            background: 'rgba(2,6,23,0.45)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            overflowY: 'auto',
                            padding: '22px 18px'
                        }}
                        onClick={() => setOcrGuideOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="app-card"
                            style={{
                                width: 'min(720px, 100%)',
                                borderRadius: 26,
                                padding: 20,
                                boxShadow: '0 40px 120px rgba(2,6,23,0.35)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            ref={ocrModalRef}
                        >
                            <div style={{ maxHeight: 'calc(100vh - 56px)', overflow: 'auto', paddingRight: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                <div>
                                    <div className="app-kicker">OCR</div>
                                    <div className="app-display" style={{ fontSize: '1.9rem', marginTop: 10, color: 'var(--app-text)' }}>
                                        Upload tips for best results
                                    </div>
                                    <div style={{ marginTop: 10, color: 'var(--app-muted)', fontWeight: 750, lineHeight: 1.6 }}>
                                        A clear photo makes a big difference. Take 10 seconds to get the shot right.
                                    </div>
                                </div>
                                <button className="app-btn" type="button" onClick={() => setOcrGuideOpen(false)}>
                                    Close
                                </button>
                            </div>

                            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 16 }}>
                                <div className="app-glass" style={{ padding: 14, borderRadius: 20 }}>
                                    <div style={{ fontWeight: 950, color: 'var(--app-text)' }}>Lighting</div>
                                    <div style={{ marginTop: 8, color: 'var(--app-muted)', fontWeight: 750, lineHeight: 1.6 }}>
                                        Use bright, even light. Avoid harsh shadows and shiny glare.
                                    </div>
                                </div>
                                <div className="app-glass" style={{ padding: 14, borderRadius: 20 }}>
                                    <div style={{ fontWeight: 950, color: 'var(--app-text)' }}>Sharpness</div>
                                    <div style={{ marginTop: 8, color: 'var(--app-muted)', fontWeight: 750, lineHeight: 1.6 }}>
                                        Keep the paper flat, fill the frame, and tap to focus. No blur.
                                    </div>
                                </div>
                                <div className="app-glass" style={{ padding: 14, borderRadius: 20 }}>
                                    <div style={{ fontWeight: 950, color: 'var(--app-text)' }}>Framing</div>
                                    <div style={{ marginTop: 8, color: 'var(--app-muted)', fontWeight: 750, lineHeight: 1.6 }}>
                                        Keep text upright. Crop extra background if possible.
                                    </div>
                                </div>
                                <div className="app-glass" style={{ padding: 14, borderRadius: 20 }}>
                                    <div style={{ fontWeight: 950, color: 'var(--app-text)' }}>Privacy</div>
                                    <div style={{ marginTop: 8, color: 'var(--app-muted)', fontWeight: 750, lineHeight: 1.6 }}>
                                        Upload only what’s needed for reading medicine names and instructions.
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ color: 'rgba(15,23,42,0.55)', fontWeight: 800 }}>
                                    You can try OCR without creating an account.
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="app-btn" type="button" onClick={() => setOcrGuideOpen(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        className="app-btn app-btn-primary"
                                        type="button"
                                        onClick={() => {
                                            setOcrGuideOpen(false);
                                            navigate('/ocr');
                                        }}
                                    >
                                        Continue to OCR
                                    </button>
                                </div>
                            </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
