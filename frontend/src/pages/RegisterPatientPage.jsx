import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import FaceAuthModal from '../components/FaceAuthModal';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { getPasswordPolicyError } from '../utils/passwordPolicy';

const STEPS = [
    { label: 'Account', icon: '🔐' },
    { label: 'Health', icon: '📝' },
    { label: 'Security', icon: '🛡️' },
];

const Particle = ({ style }) => (
    <motion.div
        style={{
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            filter: 'blur(20px)',
            zIndex: 1,
            ...style,
        }}
        animate={{
            y: [0, -40, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
        }}
        transition={{
            duration: style.dur,
            repeat: Infinity,
            delay: style.del,
        }}
    />
);

const Label = ({ children, required }) => (
    <label style={styles.label}>
        {children}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
    </label>
);

const Input = ({ label, required, children, style }) => (
    <div style={{ ...styles.fieldWrap, ...style }}>
        {label && <Label required={required}>{label}</Label>}
        {children}
    </div>
);

const baseInput = (focused) => ({
    width: '100%',
    padding: '13px 16px',
    background: 'var(--app-surface)',
    border: focused ? '1px solid #3b82f6' : '1px solid var(--app-border)',
    borderRadius: '14px',
    color: 'var(--app-text)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 20px rgba(37,99,235,0.1)' : 'none',
});

const inputStyle = (focused) => baseInput(focused);
const textareaStyle = (focused) => ({ ...baseInput(focused), minHeight: '80px', resize: 'vertical' });
const selectStyle = (focused) => ({
    ...baseInput(focused),
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
});

const MeshGradient = () => (
    <div style={styles.meshContainer}>
        <motion.div
            style={styles.meshBall1}
            animate={{
                x: [0, 100, -50, 0],
                y: [0, -50, 100, 0],
                scale: [1, 1.2, 0.8, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
            style={styles.meshBall2}
            animate={{
                x: [0, -120, 80, 0],
                y: [0, 100, -80, 0],
                scale: [1, 0.9, 1.3, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
            style={styles.meshBall3}
            animate={{
                x: [0, 80, -100, 0],
                y: [0, -100, 50, 0],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
    </div>
);

export default function RegisterPage() {
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const [focused, setFocused] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showFaceRegister, setShowFaceRegister] = useState(false);
    const googleEnabled = ((import.meta.env.VITE_GOOGLE_AUTH_ENABLED ?? 'true') !== 'false') || Boolean(window.APP_GOOGLE_AUTH_ENABLED);
    const resolveBackendOrigin = () => {
        const envOrigin = import.meta.env.VITE_BACKEND_ORIGIN;
        if (envOrigin && envOrigin.trim()) return envOrigin.trim().replace(/\/$/, '');
        const origin = window.location.origin;
        if (origin.includes('5173')) return origin.replace('5173', '8088');
        return origin;
    };
    const backendOrigin = resolveBackendOrigin();
    const googleAuthUrl = `${backendOrigin}/auth/google`;

    const [form, setForm] = useState({
        username: '', password: '', confirmPassword: '',
        name: '', nic: '', dob: '', gender: '', bloodGroup: '',
        phone: '', alternatePhone: '', email: '', address: '',
        allergies: '', chronicConditions: '',
    });

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
    const fb = (f) => () => setFocused(f);
    const blur = () => setFocused('');
    const postLoginAndContinue = (username, password) => {
        const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') || '/patients/dashboard';
        const formEl = document.createElement('form');
        formEl.method = 'POST';
        formEl.action = '/login';

        const addField = (name, value) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            formEl.appendChild(input);
        };

        addField('username', username);
        addField('password', password);
        addField('redirectTo', redirectTo);
        document.body.appendChild(formEl);
        formEl.submit();
    };

    const validate = () => {
        const e = {};
        if (step === 0) {
            if (!form.username) e.username = 'Required';
            const passwordPolicyError = getPasswordPolicyError(form.password);
            if (passwordPolicyError) e.password = passwordPolicyError;
            if (!form.confirmPassword) e.confirmPassword = 'Confirm password is required';
            if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        }
        if (step === 1) {
            if (!form.name) e.name = 'Required';
            if (!form.nic) e.nic = 'Required';
            if (!form.dob) e.dob = 'Required';
            if (!form.gender) e.gender = 'Required';
            if (!form.phone) e.phone = 'Required';
            if (!form.email) e.email = 'Required';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => {
        if (!validate()) return;
        setDir(1);
        setStep(s => s + 1);
    };

    const back = () => {
        setDir(-1);
        setStep(s => s - 1);
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Guard to prevent accidental submission if not on the final step
        if (step !== STEPS.length - 1) return;

        if (!validate()) return;
        setLoading(true);
        setErrors({});

        const payload = {
            user: {
                username: form.username,
                password: form.password,
                role: 'PATIENT'
            },
            patient: {
                name: form.name,
                nic: form.nic,
                dob: form.dob,
                gender: form.gender,
                bloodGroup: form.bloodGroup,
                phone: form.phone,
                alternatePhone: form.alternatePhone,
                email: form.email,
                address: form.address,
                allergies: form.allergies,
                chronicConditions: form.chronicConditions
            },
            confirmPassword: form.confirmPassword
        };

        try {
            await api.post('/api/auth/register/patient', payload);
            postLoginAndContinue(form.username, form.password);
        } catch (err) {
            setLoading(false);
            const msg = err.response?.data?.error || 'Registration failed. Please try again.';
            setErrors({ submit: msg });
        }
    };

    const particles = Array.from({ length: 12 }).map((_, i) => ({
        width: Math.random() * 80 + 20,
        height: Math.random() * 80 + 20,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        dur: Math.random() * 10 + 5,
        del: Math.random() * 5,
    }));

    const slideVariants = {
        enter: (d) => ({ x: d > 0 ? 50 : -50, opacity: 0, filter: 'blur(10px)' }),
        center: { x: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
        exit: (d) => ({ x: d > 0 ? -50 : 50, opacity: 0, filter: 'blur(10px)', transition: { duration: 0.35 } }),
    };

    return (
        <div style={styles.body}>
            <FaceAuthModal isOpen={showFaceRegister} onClose={() => setShowFaceRegister(false)} mode="register" />
            <style>{`
                option {
                    background-color: #1a1c1e;
                    color: white;
                }
            `}</style>
            <MeshGradient />
            {particles.map((p, i) => <Particle key={i} style={p} />)}

            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={styles.card}
            >
                {/* Header */}
                <div style={styles.header}>
                    <motion.div
                        style={styles.iconWrap}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                            <path d="M19 8v6M22 11h-6" />
                        </svg>
                    </motion.div>
                    <h2 style={styles.title}>Patient Registration</h2>
                    <p style={styles.desc}>Create your personal health profile</p>

                    <div style={{ marginTop: '24px' }}>
                        <motion.button
                            type="button" onClick={() => setShowFaceRegister(true)}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            style={styles.btnFaceScan}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                                <path d="M5 3q-2 0-2 2v4a1 1 0 002 0V5h4a1 1 0 000-2H5zM19 3q2 0 2 2v4a1 1 0 01-2 0V5h-4a1 1 0 010-2h4zM5 21q-2 0-2-2v-4a1 1 0 012 0v4h4a1 1 0 010 2H5zM19 21q2 0 2-2v-4a1 1 0 00-2 0v4h-4a1 1 0 000 2h4z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        Quick Face Registration
                        </motion.button>

                        {googleEnabled && (
                            <motion.a
                                href={googleAuthUrl}
                                whileHover={{ scale: 1.02, boxShadow: '0 10px 28px rgba(59,130,246,0.25)' }}
                                whileTap={{ scale: 0.97 }}
                                style={{ ...styles.btnGoogle, textDecoration: 'none' }}
                            >
                                <svg width="18" height="18" viewBox="0 0 533.5 544.3" aria-hidden="true" style={{ marginRight: 10 }}>
                                    <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.4H272v95.3h147.3c-6.4 34.7-25.8 64.1-55 83.9v69h88.7c52-47.9 80.5-118.5 80.5-195.1z" />
                                    <path fill="#34A853" d="M272 544.3c74.7 0 137.4-24.7 183.2-67.1l-88.7-69c-24.6 16.5-56.1 26.2-94.5 26.2-72.7 0-134.3-49-156.3-115.1H24v72.2C69.8 483.9 164.6 544.3 272 544.3z" />
                                    <path fill="#FBBC04" d="M115.7 319.3c-5.6-16.5-8.8-34.1-8.8-52.3s3.2-35.8 8.8-52.3V142.5H24C8.7 173.7 0 210.2 0 247c0 36.8 8.7 73.3 24 104.5l91.7-71.2z" />
                                    <path fill="#EA4335" d="M272 109.3c40.6 0 77 14 105.7 41.3l79.2-79.2C409.2 24.5 346.5 0 272 0 164.6 0 69.8 60.4 24 142.5l91.7 71.2C137.7 158.3 199.3 109.3 272 109.3z" />
                                </svg>
                                Continue with Google
                            </motion.a>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 0', opacity: 0.4 }}>
                            <div style={{ height: 1, background: '#fff', flex: 1 }}></div>
                            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' }}>Or Manual Registration</span>
                            <div style={{ height: 1, background: '#fff', flex: 1 }}></div>
                        </div>
                    </div>
                </div>

                {/* Stepper */}
                <div style={styles.stepper}>
                    {STEPS.map((s, i) => (
                        <div key={i} style={styles.stepItem}>
                            <motion.div
                                animate={{
                                    background: i < step ? 'linear-gradient(135deg,#059669,#10b981)' : i === step ? 'linear-gradient(135deg,#2563eb,#60a5fa)' : 'rgba(255,255,255,0.05)',
                                    borderColor: i === step ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                                    scale: i === step ? 1.2 : 1,
                                }}
                                style={styles.stepCircle}
                            >
                                {i < step ? '✓' : s.icon}
                            </motion.div>
                            <span style={{ ...styles.stepLabel, color: i === step ? '#fff' : 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                        </div>
                    ))}
                    <div style={styles.stepperLine} />
                    <motion.div
                        style={styles.stepperProgress}
                        animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
                    />
                </div>

                <form onSubmit={handleSubmit} style={{ overflow: 'visible' }}>
                    {errors.submit && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ ...styles.err, textAlign: 'center', marginBottom: 20, padding: 12, background: 'rgba(248,113,113,0.1)', borderRadius: 12 }}>
                            {errors.submit}
                        </motion.div>
                    )}
                    <AnimatePresence custom={dir} mode="wait">
                        {step === 0 && (
                            <motion.div key="s0" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={styles.formSection}>
                                <div style={styles.grid2}>
                                    <Input label="Username" required style={{ gridColumn: '1 / -1' }}>
                                        <input name="username" value={form.username} onChange={set('username')} onFocus={fb('user')} onBlur={blur} style={inputStyle(focused === 'user')} placeholder="Choose a unique username" required />
                                        {errors.username && <span style={styles.err}>{errors.username}</span>}
                                    </Input>
                                    <Input label="Password" required>
                                        <input type="password" name="password" value={form.password} onChange={set('password')} onFocus={fb('pass')} onBlur={blur} style={inputStyle(focused === 'pass')} placeholder="••••••••" required />
                                        <PasswordStrengthMeter password={form.password} />
                                        {errors.password && <span style={styles.err}>{errors.password}</span>}
                                    </Input>
                                    <Input label="Confirm Password" required>
                                        <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={set('confirmPassword')} onFocus={fb('cp')} onBlur={blur} style={inputStyle(focused === 'cp')} placeholder="••••••••" required />
                                        {errors.confirmPassword && <span style={styles.err}>{errors.confirmPassword}</span>}
                                    </Input>
                                </div>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={styles.formSection}>
                                <div style={styles.grid2}>
                                    <Input label="Full Name" required style={{ gridColumn: '1 / -1' }}>
                                        <input name="name" value={form.name} onChange={set('name')} onFocus={fb('name')} onBlur={blur} style={inputStyle(focused === 'name')} placeholder="Enter your full name" required />
                                        {errors.name && <span style={styles.err}>{errors.name}</span>}
                                    </Input>
                                    <Input label="NIC Number" required>
                                        <input name="nic" value={form.nic} onChange={set('nic')} onFocus={fb('nic')} onBlur={blur} style={inputStyle(focused === 'nic')} placeholder="e.g. 199912345678" required />
                                        {errors.nic && <span style={styles.err}>{errors.nic}</span>}
                                    </Input>
                                    <Input label="Date of Birth" required>
                                        <input type="date" name="dob" value={form.dob} onChange={set('dob')} onFocus={fb('dob')} onBlur={blur} style={inputStyle(focused === 'dob')} required />
                                        {errors.dob && <span style={styles.err}>{errors.dob}</span>}
                                    </Input>
                                    <Input label="Gender" required>
                                        <select name="gender" value={form.gender} onChange={set('gender')} onFocus={fb('gender')} onBlur={blur} style={selectStyle(focused === 'gender')} required>
                                            <option value="">Select...</option>
                                            <option>Male</option><option>Female</option><option>Other</option>
                                        </select>
                                        {errors.gender && <span style={styles.err}>{errors.gender}</span>}
                                    </Input>
                                    <Input label="Blood Group">
                                        <select name="bloodGroup" value={form.bloodGroup} onChange={set('bloodGroup')} onFocus={fb('bg')} onBlur={blur} style={selectStyle(focused === 'bg')}>
                                            <option value="">None</option>
                                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => <option key={g}>{g}</option>)}
                                        </select>
                                    </Input>
                                    <Input label="Phone" required>
                                        <input name="phone" value={form.phone} onChange={set('phone')} onFocus={fb('phone')} onBlur={blur} style={inputStyle(focused === 'phone')} placeholder="+94 XX XXX XXXX" required />
                                        {errors.phone && <span style={styles.err}>{errors.phone}</span>}
                                    </Input>
                                    <Input label="Email" required>
                                        <input type="email" name="email" value={form.email} onChange={set('email')} onFocus={fb('email')} onBlur={blur} style={inputStyle(focused === 'email')} placeholder="email@example.com" required />
                                        {errors.email && <span style={styles.err}>{errors.email}</span>}
                                    </Input>
                                    <Input label="Address" style={{ gridColumn: '1 / -1' }}>
                                        <textarea name="address" value={form.address} onChange={set('address')} onFocus={fb('addr')} onBlur={blur} style={textareaStyle(focused === 'addr')} placeholder="Enter your residential address" />
                                    </Input>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={styles.formSection}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <Input label="Known Allergies">
                                        <textarea name="allergies" placeholder="e.g. Penicillin, Pollen, etc. (Optional)" value={form.allergies} onChange={set('allergies')} onFocus={fb('al')} onBlur={blur} style={textareaStyle(focused === 'al')} />
                                    </Input>
                                    <Input label="Chronic Conditions">
                                        <textarea name="chronicConditions" placeholder="e.g. Diabetes, Asthma, etc. (Optional)" value={form.chronicConditions} onChange={set('chronicConditions')} onFocus={fb('cc')} onBlur={blur} style={textareaStyle(focused === 'cc')} />
                                    </Input>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div style={styles.navRow}>
                        {step > 0 && (
                            <motion.button type="button" onClick={back} whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }} style={styles.btnSecondary}>
                                Previous
                            </motion.button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <motion.button type="button" onClick={next} whileHover={{ x: 3, boxShadow: '0 8px 30px rgba(37,99,235,0.4)' }} whileTap={{ scale: 0.96 }} style={{ ...styles.btnPrimary, marginLeft: 'auto' }}>
                                Continue <span style={{ marginLeft: 6 }}>→</span>
                            </motion.button>
                        ) : (
                            <motion.button type="button" onClick={handleSubmit} disabled={loading} whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(16,185,129,0.4)' }} whileTap={{ scale: 0.98 }} style={{ ...styles.btnSubmit, marginLeft: 'auto' }}>
                                {loading ? (
                                    <motion.div style={styles.spinner} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                                ) : 'Complete Registration'}
                            </motion.button>
                        )}
                    </div>
                </form>

                <div style={styles.footer}>
                    <div style={styles.roleHeader}>Not a patient?</div>
                    <div style={styles.roleLinks}>
                        <a href="/register/doctor" style={styles.roleLink}>Doctor Registration</a>
                        <div style={styles.dot} />
                        <a href="/register/staff" style={styles.roleLink}>Staff Portal</a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

const styles = {
    body: {
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--app-bg)', backgroundImage: `radial-gradient(at 0% 0%, rgba(37,99,235,0.08) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(124,58,237,0.07) 0px, transparent 55%)`,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", position: 'relative', overflow: 'hidden', padding: '40px 20px',
    },
    meshContainer: { position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, opacity: 0.6, filter: 'blur(80px)' },
    meshBall1: { position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(37,99,235,0.3)', top: '-10%', left: '-10%' },
    meshBall2: { position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(124,58,237,0.25)', bottom: '0%', right: '0%' },
    meshBall3: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', top: '40%', left: '50%' },
    card: {
        position: 'relative', zIndex: 10, width: '100%', maxWidth: '640px', padding: '3rem',
        background: 'var(--app-surface)', backdropFilter: 'blur(10px) saturate(120%)',
        borderRadius: '32px', border: '1px solid var(--app-border)',
        boxShadow: '0 25px 50px -12px rgba(2, 6, 23, 0.16)', overflow: 'visible',
    },
    header: { textAlign: 'center', marginBottom: '2.5rem' },
    iconWrap: {
        width: 72, height: 72, background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.2rem', boxShadow: '0 12px 30px rgba(37,99,235,0.35)',
    },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--app-text)', margin: 0, letterSpacing: '-0.5px' },
    desc: { color: 'var(--app-muted)', fontSize: '1rem', marginTop: 8 },
    stepper: { position: 'relative', display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', padding: '0 10px' },
    stepperLine: { position: 'absolute', top: 21, left: '10%', right: '10%', height: 2, background: 'var(--app-border)', zIndex: 0 },
    stepperProgress: { position: 'absolute', top: 21, left: '10%', height: 2, background: 'linear-gradient(90deg, #2563eb, #60a5fa)', zIndex: 0, transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' },
    stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 1 },
    stepCircle: {
        width: 42, height: 42, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', color: '#fff', border: '2px solid transparent', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    stepLabel: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
    formSection: { width: '100%' },
    grid2: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' },
    fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: '0.85rem', color: 'var(--app-muted)', fontWeight: '600', marginLeft: 4 },
    err: { fontSize: '0.75rem', color: '#f87171', marginTop: 4, fontWeight: '500' },
    navRow: { display: 'flex', marginTop: '2.5rem', gap: 12 },
    btnPrimary: {
        padding: '14px 28px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '14px',
        fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
    },
    btnSubmit: {
        padding: '14px 32px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff',
        border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
    },
    btnSecondary: {
        padding: '14px 24px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', fontWeight: '600', cursor: 'pointer',
    },
    btnFaceScan: {
        padding: '12px 24px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
        border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '14px', fontWeight: '600',
        fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.1)'
    },
    btnGoogle: {
        padding: '12px 24px', background: '#ffffff', color: '#0f172a',
        border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: '14px', fontWeight: '700',
        fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 10px 24px rgba(59, 130, 246, 0.15)',
        width: '100%', marginTop: 10,
    },
    footer: { marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' },
    roleHeader: { color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: 12 },
    roleLinks: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 },
    roleLink: { color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: 'color 0.2s' },
    dot: { width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' },
    spinner: { width: 22, height: 22, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #fff', borderRadius: '50%', margin: '0 auto' },
};
