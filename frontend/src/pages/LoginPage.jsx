import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FaceAuthModal from '../components/FaceAuthModal';
import api from '../services/api';


// Floating particle component
const Particle = ({ style }) => (
    <motion.div
        style={{
            position: 'absolute',
            borderRadius: '50%',
            background: style.color || 'rgba(59, 130, 246, 0.1)',
            boxShadow: `0 0 15px ${style.color || 'rgba(59, 130, 246, 0.05)'}`,
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
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState('');
    const [showFaceLogin, setShowFaceLogin] = useState(false);
    const googleEnabled = ((import.meta.env.VITE_GOOGLE_AUTH_ENABLED ?? 'true') !== 'false') || Boolean(window.APP_GOOGLE_AUTH_ENABLED);
    const resolveBackendOrigin = () => {
        const envOrigin = import.meta.env.VITE_BACKEND_ORIGIN;
        if (envOrigin && envOrigin.trim()) return envOrigin.trim().replace(/\/$/, '');
        const origin = window.location.origin;
        if (origin.includes('5173')) return origin.replace('5173', '8088');
        return origin;
    };
    const backendOrigin = resolveBackendOrigin();
    const googleAuthUrl = `${backendOrigin}/auth/google?redirectTo=${encodeURIComponent('/patients/dashboard')}`;

    const params = new URLSearchParams(window.location.search);
    const hasError = params.has('error');
    const oauthErrorRaw = params.get('oauthError');
    const hasOauthError = Boolean(oauthErrorRaw);
    const oauthErrorMessage = (() => {
        if (!oauthErrorRaw) return '';
        const decoded = decodeURIComponent(oauthErrorRaw);
        const short = decoded.split(':')[0];
        if (short === 'NO_AUTH_IN_POST_LOGIN') return 'Google login finished but session was not established.';
        if (short === 'OAuth2AuthenticationException') return 'Google login failed in OAuth processing.';
        return 'Google sign-in failed. Please try again.';
    })();
    const hasLogout = params.has('logout');
    const hasRegistered = params.has('registered');
    const hasResetSuccess = params.has('resetSuccess');

    useEffect(() => {
        let active = true;

        const redirectIfAuthenticated = async () => {
            try {
                const response = await api.get('/api/auth/user');
                if (!active || !response?.data) return;

                const role = (response.data.role || '').toString().toUpperCase();
                if (role === 'PATIENT') {
                    navigate('/patients/dashboard', { replace: true });
                } else if (role === 'ADMIN') {
                    navigate('/admin/dashboard', { replace: true });
                } else if (role === 'DOCTOR') {
                    navigate('/doctor/dashboard', { replace: true });
                } else if (role === 'FINANCE_MANAGER' || role === 'PAYMENT_MANAGER') {
                    navigate('/finance/dashboard', { replace: true });
                } else if (role === 'PHARMACIST') {
                    navigate('/pharmacy/dashboard', { replace: true });
                } else if (role === 'NURSE' || role === 'STAFF' || role === 'LAB_TECH') {
                    navigate('/staff/dashboard', { replace: true });
                }
            } catch (_) {
                // Not authenticated. Stay on login page.
            }
        };

        redirectIfAuthenticated();
        return () => {
            active = false;
        };
    }, [navigate]);

    const particles = [
        { width: 80, height: 80, top: '10%', left: '5%', duration: 5, delay: 0, color: 'rgba(37, 99, 235, 0.15)' },
        { width: 50, height: 50, top: '70%', left: '10%', duration: 7, delay: 1, color: 'rgba(124, 58, 237, 0.1)' },
        { width: 120, height: 120, top: '20%', right: '8%', duration: 6, delay: 2, color: 'rgba(59, 130, 246, 0.1)' },
        { width: 40, height: 40, top: '80%', right: '15%', duration: 4, delay: 0.5, color: 'rgba(139, 92, 246, 0.15)' },
        { width: 60, height: 60, top: '50%', left: '3%', duration: 8, delay: 1.5, color: 'rgba(37, 99, 235, 0.1)' },
        { width: 90, height: 90, top: '5%', left: '40%', duration: 5.5, delay: 3, color: 'rgba(124, 58, 237, 0.1)' },
        { width: 30, height: 30, bottom: '10%', left: '30%', duration: 6, delay: 2, color: 'rgba(59, 130, 246, 0.15)' },
        { width: 70, height: 70, bottom: '20%', right: '5%', duration: 4.5, delay: 1, color: 'rgba(139, 92, 246, 0.1)' },
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
            <FaceAuthModal isOpen={showFaceLogin} onClose={() => setShowFaceLogin(false)} mode="login" />
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
                >Sign in to your medical centre portal</motion.p>

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
                            Invalid username or password.
                        </motion.div>
                    )}
                    {hasOauthError && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ ...styles.alert, ...styles.alertDanger }}
                        >
                            {oauthErrorMessage}
                        </motion.div>
                    )}
                    {hasLogout && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ ...styles.alert, ...styles.alertSuccess }}
                        >You have been logged out.</motion.div>
                    )}
                    {hasRegistered && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ ...styles.alert, ...styles.alertSuccess }}
                        >Registration successful. Please login.</motion.div>
                    )}
                    {hasResetSuccess && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ ...styles.alert, ...styles.alertSuccess }}
                        >Password updated. You can now login.</motion.div>
                    )}
                </AnimatePresence>

                <form
                    action="/login"
                    method="post"
                    onSubmit={(e) => {
                        setLoading(true);
                    }}
                    style={styles.form}
                >
                    {/* Hidden field for redirect flow */}
                    <input type="hidden" name="redirectTo" value={params.get('redirectTo') || ''} />

                    {/* Username field */}
                    <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" style={styles.inputGroup}>
                        <motion.span style={styles.inputIcon} animate={{ color: focused === 'username' ? '#3b82f6' : '#94a3b8' }}>
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
                        <motion.span style={styles.inputIcon} animate={{ color: focused === 'password' ? '#3b82f6' : '#94a3b8' }}>
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

                        <div style={{ textAlign: 'center', margin: '14px 0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Or</div>

                        {googleEnabled && (
                            <>
                                <motion.a
                                    whileHover={{ scale: 1.02, boxShadow: '0 12px 35px rgba(59,130,246,0.3)' }}
                                    whileTap={{ scale: 0.97 }}
                                    href={googleAuthUrl}
                                    style={{ ...styles.googleButton, textDecoration: 'none' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 533.5 544.3" aria-hidden="true" style={{ marginRight: 10 }}>
                                        <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.4H272v95.3h147.3c-6.4 34.7-25.8 64.1-55 83.9v69h88.7c52-47.9 80.5-118.5 80.5-195.1z" />
                                        <path fill="#34A853" d="M272 544.3c74.7 0 137.4-24.7 183.2-67.1l-88.7-69c-24.6 16.5-56.1 26.2-94.5 26.2-72.7 0-134.3-49-156.3-115.1H24v72.2C69.8 483.9 164.6 544.3 272 544.3z" />
                                        <path fill="#FBBC04" d="M115.7 319.3c-5.6-16.5-8.8-34.1-8.8-52.3s3.2-35.8 8.8-52.3V142.5H24C8.7 173.7 0 210.2 0 247c0 36.8 8.7 73.3 24 104.5l91.7-71.2z" />
                                        <path fill="#EA4335" d="M272 109.3c40.6 0 77 14 105.7 41.3l79.2-79.2C409.2 24.5 346.5 0 272 0 164.6 0 69.8 60.4 24 142.5l91.7 71.2C137.7 158.3 199.3 109.3 272 109.3z" />
                                    </svg>
                                    Continue with Google
                                </motion.a>

                                <div style={{ textAlign: 'center', margin: '14px 0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Or</div>
                            </>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: '#e2e8f0' }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={() => setShowFaceLogin(true)}
                            style={styles.faceIdButton}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                                <path d="M5 3q-2 0-2 2v4a1 1 0 002 0V5h4a1 1 0 000-2H5zM19 3q2 0 2 2v4a1 1 0 01-2 0V5h-4a1 1 0 010-2h4zM5 21q-2 0-2-2v-4a1 1 0 012 0v4h4a1 1 0 010 2H5zM19 21q2 0 2-2v-4a1 1 0 00-2 0v4h-4a1 1 0 000 2h4z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            Login with Face ID
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
                    <a href="/register/patient" style={styles.linkBold}>Create Account -&gt;</a>
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
        background: 'transparent',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "var(--app-font-sans)",
        position: 'relative',
        overflow: 'hidden',
    },
    orb1: {
        position: 'absolute',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
        top: '-150px',
        left: '-150px',
        pointerEvents: 'none',
    },
    orb2: {
        position: 'absolute',
        width: 450,
        height: 450,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        bottom: '-120px',
        right: '-120px',
        pointerEvents: 'none',
    },
    card: {
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '460px',
        margin: '0 16px',
        padding: '3rem',
        background: 'rgba(255,255,255,0.86)',
        borderRadius: '24px',
        border: '1px solid rgba(15,23,42,0.10)',
        boxShadow: '0 30px 90px rgba(15,23,42,0.12)',
        textAlign: 'center',
        backdropFilter: 'blur(14px)',
    },
    iconWrap: {
        width: 72,
        height: 72,
        background: 'linear-gradient(135deg, rgba(14,165,233,0.95), rgba(37,99,235,0.95))',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.2rem',
        boxShadow: '0 22px 55px rgba(37,99,235,0.22)',
    },
    title: {
        fontSize: '2.2rem',
        fontWeight: '800',
        fontFamily: 'var(--app-font-display)',
        color: 'var(--app-text)',
        margin: '0 0 0.5rem',
        letterSpacing: '-1px',
    },
    subtitle: {
        fontSize: '1rem',
        color: 'var(--app-muted)',
        marginBottom: '2rem',
        margin: '0 0 2rem',
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
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 1,
        color: '#94a3b8',
        transition: 'color 0.3s',
    },
    input: {
        width: '100%',
        padding: '16px 16px 16px 48px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        color: '#1e293b',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
    },
    inputFocused: {
        background: '#ffffff',
        border: '1px solid #3b82f6',
        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
    },
    button: {
        width: '100%',
        marginTop: '8px',
        padding: '16px',
        background: 'linear-gradient(135deg, rgba(14,165,233,0.98), rgba(37,99,235,0.98))',
        border: 'none',
        borderRadius: '14px',
        color: 'white',
        fontSize: '1.05rem',
        fontWeight: '800',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 22px 55px rgba(37,99,235,0.22)',
        transition: 'all 0.3s',
    },
    googleButton: {
        width: '100%',
        padding: '16px',
        background: '#ffffff',
        border: '1px solid rgba(59,130,246,0.35)',
        borderRadius: '14px',
        color: '#0f172a',
        fontSize: '1.05rem',
        fontWeight: '850',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s',
        boxShadow: '0 18px 45px rgba(59,130,246,0.12)',
    },
    faceIdButton: {
        width: '100%',
        padding: '16px',
        background: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(15,23,42,0.12)',
        borderRadius: '14px',
        color: 'rgba(15,23,42,0.82)',
        fontSize: '1.05rem',
        fontWeight: '850',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        color: '#64748b',
        textDecoration: 'none',
        transition: 'color 0.2s',
    },
    linkBold: {
        color: '#3b82f6',
        fontWeight: '600',
        textDecoration: 'none',
        transition: 'color 0.2s',
    },
};

export default LoginPage;
