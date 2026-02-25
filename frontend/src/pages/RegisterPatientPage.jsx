import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

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
    background: focused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
    border: focused ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    color: '#fff',
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
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
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

    const [form, setForm] = useState({
        username: '', password: '', confirmPassword: '',
        name: '', nic: '', dob: '', gender: '', bloodGroup: '',
        phone: '', alternatePhone: '', email: '', address: '',
        allergies: '', chronicConditions: '',
    });

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
    const fb = (f) => () => setFocused(f);
    const blur = () => setFocused('');

    const validate = () => {
        const e = {};
        if (step === 0) {
            if (!form.username) e.username = 'Required';
            if (!form.password) e.password = 'Required';
            if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        }
        if (step === 1) {
            if (!form.name) e.name = 'Required';
            if (!form.nic) e.nic = 'Required';
            if (!form.dob) e.dob = 'Required';
            if (!form.gender) e.gender = 'Required';
            if (!form.phone) e.phone = 'Required';
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
            await api.post('/register/patient', payload);
            const redirectTo = new URLSearchParams(window.location.search).get('redirectTo');
            const loginUrl = redirectTo ? `/login?registered&redirectTo=${encodeURIComponent(redirectTo)}` : '/login?registered';
            window.location.href = loginUrl;
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
                                    <Input label="Email">
                                        <input type="email" name="email" value={form.email} onChange={set('email')} onFocus={fb('email')} onBlur={blur} style={inputStyle(focused === 'email')} placeholder="email@example.com" />
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
        background: '#0a0a0c', backgroundImage: `radial-gradient(at 0% 0%, rgba(37,99,235,0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(124,58,237,0.15) 0px, transparent 50%)`,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", position: 'relative', overflow: 'hidden', padding: '40px 20px',
    },
    meshContainer: { position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, opacity: 0.6, filter: 'blur(80px)' },
    meshBall1: { position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(37,99,235,0.3)', top: '-10%', left: '-10%' },
    meshBall2: { position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(124,58,237,0.25)', bottom: '0%', right: '0%' },
    meshBall3: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', top: '40%', left: '50%' },
    card: {
        position: 'relative', zIndex: 10, width: '100%', maxWidth: '640px', padding: '3rem',
        background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(30px) saturate(150%)',
        borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)', overflow: 'visible',
    },
    header: { textAlign: 'center', marginBottom: '2.5rem' },
    iconWrap: {
        width: 72, height: 72, background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.2rem', boxShadow: '0 12px 30px rgba(37,99,235,0.35)',
    },
    title: { fontSize: '2rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.5px' },
    desc: { color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginTop: 8 },
    stepper: { position: 'relative', display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', padding: '0 10px' },
    stepperLine: { position: 'absolute', top: 21, left: '10%', right: '10%', height: 2, background: 'rgba(255,255,255,0.08)', zIndex: 0 },
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
    label: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginLeft: 4 },
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
    footer: { marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' },
    roleHeader: { color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: 12 },
    roleLinks: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 },
    roleLink: { color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: 'color 0.2s' },
    dot: { width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' },
    spinner: { width: 22, height: 22, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #fff', borderRadius: '50%', margin: '0 auto' },
};
