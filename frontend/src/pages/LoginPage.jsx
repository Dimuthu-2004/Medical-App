import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Floating particle component
const Particle = ({ style }) => (
    <motion.div
        style={{
            position: 'absolute',
            borderRadius: '50%',
            background: style.color || 'rgba(59, 130, 246, 0.4)',
            boxShadow: `0 0 15px ${style.color || 'rgba(59, 130, 246, 0.2)'}`,
            ...style,
        }}
        animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.1, 1],
        }}
        transition={{
            duration: style.duration || 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: style.delay || 0,
        }}
    />
);

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState('');

    const params = new URLSearchParams(window.location.search);
    const hasError = params.has('error');
    const hasLogout = params.has('logout');
    const hasRegistered = params.has('registered');
    const hasResetSuccess = params.has('resetSuccess');

    const particles = [
        { width: 80, height: 80, top: '10%', left: '5%', duration: 5, delay: 0, color: 'rgba(37, 99, 235, 0.35)' },
        { width: 50, height: 50, top: '70%', left: '10%', duration: 7, delay: 1, color: 'rgba(124, 58, 237, 0.3)' },
        { width: 120, height: 120, top: '20%', right: '8%', duration: 6, delay: 2, color: 'rgba(59, 130, 246, 0.25)' },
        { width: 40, height: 40, top: '80%', right: '15%', duration: 4, delay: 0.5, color: 'rgba(139, 92, 246, 0.4)' },
        { width: 60, height: 60, top: '50%', left: '3%', duration: 8, delay: 1.5, color: 'rgba(37, 99, 235, 0.2)' },
        { width: 90, height: 90, top: '5%', left: '40%', duration: 5.5, delay: 3, color: 'rgba(124, 58, 237, 0.25)' },
        { width: 30, height: 30, bottom: '10%', left: '30%', duration: 6, delay: 2, color: 'rgba(59, 130, 246, 0.4)' },
        { width: 70, height: 70, bottom: '20%', right: '5%', duration: 4.5, delay: 1, color: 'rgba(139, 92, 246, 0.3)' },
    ];

    const fieldVariants = {
        hidden: { opacity: 0, x: -30 },
        visible: (i) => ({
            opacity: 1,
            x: 0,
            transition: { delay: 0.3 + i * 0.12, duration: 0.5, ease: 'easeOut' },
        }),
    };

    return (
        <div style={styles.body}>
            {/* Animated particles */}
            {particles.map((p, i) => <Particle key={i} style={p} />)}

            {/* Glowing orbs */}
            <motion.div
                style={styles.orb1}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                style={styles.orb2}
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={styles.card}
            >
                {/* Animated logo */}
                <motion.div style={styles.iconWrap}
                    animate={{ boxShadow: ['0 8px 20px rgba(37,99,235,0.4)', '0 8px 35px rgba(37,99,235,0.7)', '0 8px 20px rgba(37,99,235,0.4)'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <motion.svg
                        width="36" height="36" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </motion.svg>
                </motion.div>

                <motion.h3
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={styles.title}
                >SmartClinic</motion.h3>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    style={styles.subtitle}
                >Access your healthcare portal</motion.p>

                {/* Alerts with animation */}
                <AnimatePresence>
                    {hasError && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ ...styles.alert, ...styles.alertDanger }}
                        >
                            ⚠️ Invalid username or password.
                        </motion.div>
                    )}
                    {hasLogout && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ ...styles.alert, ...styles.alertSuccess }}
                        >✅ You have been logged out.</motion.div>
                    )}
                    {hasRegistered && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ ...styles.alert, ...styles.alertSuccess }}
                        >🎉 Registration successful! Please login.</motion.div>
                    )}
                    {hasResetSuccess && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ ...styles.alert, ...styles.alertSuccess }}
                        >🔐 Password updated! You can now login.</motion.div>
                    )}
                </AnimatePresence>

                <form action="/login" method="post" onSubmit={() => setLoading(true)} style={styles.form}>
                    {/* Hidden field for redirect flow */}
                    <input type="hidden" name="redirectTo" value={params.get('redirectTo') || ''} />

                    {/* Username field */}
                    <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" style={styles.inputGroup}>
                        <motion.span style={styles.inputIcon} animate={{ color: focused === 'username' ? '#60a5fa' : 'rgba(255,255,255,0.5)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                        </motion.span>
                        <input
                            type="text" name="username" placeholder="Username" required autoFocus
                            onFocus={() => setFocused('username')} onBlur={() => setFocused('')}
                            style={{ ...styles.input, ...(focused === 'username' ? styles.inputFocused : {}) }}
                        />
                    </motion.div>

                    {/* Password field */}
                    <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" style={styles.inputGroup}>
                        <motion.span style={styles.inputIcon} animate={{ color: focused === 'password' ? '#60a5fa' : 'rgba(255,255,255,0.5)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </motion.span>
                        <input
                            type="password" name="password" placeholder="Password" required
                            onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                            style={{ ...styles.input, ...(focused === 'password' ? styles.inputFocused : {}) }}
                        />
                    </motion.div>

                    {/* Submit button */}
                    <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 12px 35px rgba(37,99,235,0.6)' }}
                            whileTap={{ scale: 0.97 }}
                            type="submit" disabled={loading}
                            style={styles.button}
                        >
                            {loading ? (
                                <motion.div
                                    style={styles.spinner}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                    Sign In
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                </form>

                {/* Footer links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    style={styles.footer}
                >
                    <a href="/forgot-password" style={styles.linkMuted}>Forgot Password?</a>
                    <a href="/register/patient" style={styles.linkBold}>Create Account →</a>
                </motion.div>
            </motion.div>
        </div>
    );
};

const styles = {
    body: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(/images/login_bg.webp)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden',
    },
    orb1: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
        top: '-100px',
        left: '-100px',
        pointerEvents: 'none',
    },
    orb2: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
        bottom: '-80px',
        right: '-80px',
        pointerEvents: 'none',
    },
    card: {
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '440px',
        margin: '0 16px',
        padding: '2.5rem',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
        textAlign: 'center',
    },
    iconWrap: {
        width: 72,
        height: 72,
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.2rem',
        boxShadow: '0 8px 20px rgba(37,99,235,0.4)',
    },
    title: {
        fontSize: '2rem',
        fontWeight: '700',
        color: 'white',
        margin: '0 0 0.3rem',
        letterSpacing: '-0.5px',
        textShadow: '0 2px 10px rgba(0,0,0,0.3)',
    },
    subtitle: {
        fontSize: '0.95rem',
        color: 'rgba(255,255,255,0.65)',
        marginBottom: '1.5rem',
        margin: '0 0 1.5rem',
    },
    alert: {
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '0.88rem',
        marginBottom: '1rem',
        textAlign: 'left',
        overflow: 'hidden',
    },
    alertDanger: {
        background: 'rgba(220,38,38,0.2)',
        border: '1px solid rgba(220,38,38,0.35)',
        color: '#fca5a5',
    },
    alertSuccess: {
        background: 'rgba(16,185,129,0.2)',
        border: '1px solid rgba(16,185,129,0.35)',
        color: '#6ee7b7',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        textAlign: 'left',
    },
    inputGroup: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: '14px',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 1,
        color: 'rgba(255,255,255,0.5)',
        transition: 'color 0.3s',
    },
    input: {
        width: '100%',
        padding: '14px 14px 14px 46px',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
    },
    inputFocused: {
        background: 'rgba(255,255,255,0.13)',
        border: '1px solid rgba(96,165,250,0.6)',
        boxShadow: '0 0 0 3px rgba(37,99,235,0.2)',
    },
    button: {
        width: '100%',
        marginTop: '6px',
        padding: '14px',
        background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
        border: 'none',
        borderRadius: '12px',
        color: 'white',
        fontSize: '1.05rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
        transition: 'all 0.3s',
    },
    spinner: {
        width: 22,
        height: 22,
        border: '3px solid rgba(255,255,255,0.3)',
        borderTop: '3px solid white',
        borderRadius: '50%',
    },
    footer: {
        marginTop: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.88rem',
    },
    linkMuted: {
        color: 'rgba(255,255,255,0.55)',
        textDecoration: 'none',
        transition: 'color 0.2s',
    },
    linkBold: {
        color: '#60a5fa',
        fontWeight: '700',
        textDecoration: 'none',
        transition: 'color 0.2s',
    },
};

export default LoginPage;
