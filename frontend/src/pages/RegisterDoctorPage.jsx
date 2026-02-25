import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const STEPS = [
    { label: 'Account', icon: '🔐' },
    { label: 'Professional', icon: '🩺' },
];

const MeshGradient = () => (
    <div style={styles.meshContainer}>
        <motion.div
            style={styles.meshBall1}
            animate={{
                x: [0, 80, -30, 0],
                y: [0, -40, 60, 0],
                rotate: [0, 180, 360],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
            style={styles.meshBall2}
            animate={{
                x: [0, -100, 50, 0],
                y: [0, 80, -60, 0],
                rotate: [360, 180, 0],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
    </div>
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

const inputStyle = (focused = false) => ({
    width: '100%',
    padding: '13px 16px',
    background: focused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
    border: focused ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: focused ? '0 0 20px rgba(59,130,246,0.15)' : 'none',
});

const selectStyle = (focused = false) => ({
    ...inputStyle(focused),
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
});

export default function RegisterDoctorPage() {
    const [step, setStep] = useState(0);
    const [focused, setFocused] = useState('');
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        username: '', password: '', confirmPassword: '',
        fullName: '', slmcNumber: '', specialization: '',
        clinicName: '', phone: '', email: '',
    });

    const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
    const fb = (f) => () => setFocused(f);
    const blur = () => setFocused('');

    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Guard to prevent accidental submission if not on the final step
        if (step !== STEPS.length - 1) return;

        setErrors({});

        if (form.password !== form.confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match' });
            return;
        }

        setLoading(true);

        const payload = {
            user: {
                username: form.username,
                password: form.password,
                role: 'DOCTOR'
            },
            doctorProfile: {
                fullName: form.fullName,
                slmcNumber: form.slmcNumber,
                specialization: form.specialization,
                clinicName: form.clinicName,
                phone: form.phone,
                email: form.email
            },
            confirmPassword: form.confirmPassword
        };

        try {
            await api.post('/register/doctor', payload);
            window.location.href = '/login?registered';
        } catch (err) {
            setLoading(false);
            const msg = err.response?.data?.error || 'Registration failed. Please try again.';
            setErrors({ submit: msg });
        }
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

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={styles.card}
            >
                <div style={styles.header}>
                    <motion.div
                        style={styles.iconWrap}
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </motion.div>
                    <h2 style={styles.title}>Doctor Registration</h2>
                    <p style={styles.desc}>Join our network of healthcare professionals</p>
                </div>

                <div style={styles.stepper}>
                    {STEPS.map((s, i) => (
                        <div key={i} style={styles.stepItem}>
                            <motion.div
                                animate={{
                                    background: i <= step ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                                    scale: i === step ? 1.15 : 1,
                                    boxShadow: i === step ? '0 0 25px rgba(59,130,246,0.3)' : 'none',
                                }}
                                style={styles.stepCircle}
                            >
                                {s.icon}
                            </motion.div>
                            <span style={{ ...styles.stepLabel, color: i === step ? '#fff' : 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                        </div>
                    ))}
                    <div style={styles.stepperLine} />
                </div>

                <form onSubmit={handleSubmit}>
                    {errors.submit && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#f87171', textAlign: 'center', marginBottom: 20, padding: 12, background: 'rgba(248,113,113,0.1)', borderRadius: 12, fontSize: '0.9rem', fontWeight: '600' }}>
                            {errors.submit}
                        </motion.div>
                    )}
                    <AnimatePresence mode="wait">
                        {step === 0 ? (
                            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                                <div style={styles.grid}>
                                    <Input label="Username" required style={{ gridColumn: '1 / -1' }}>
                                        <input name="username" value={form.username} onChange={set('username')} onFocus={fb('user')} onBlur={blur} style={inputStyle(focused === 'user')} placeholder="Doctor username" required />
                                    </Input>
                                    <Input label="Password" required>
                                        <input type="password" name="password" value={form.password} onChange={set('password')} onFocus={fb('pass')} onBlur={blur} style={inputStyle(focused === 'pass')} placeholder="••••••••" required />
                                    </Input>
                                    <Input label="Confirm Password" required>
                                        <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={set('confirmPassword')} onFocus={fb('cp')} onBlur={blur} style={inputStyle(focused === 'cp')} placeholder="••••••••" required />
                                        {errors.confirmPassword && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>{errors.confirmPassword}</span>}
                                    </Input>
                                </div>
                                <div style={styles.navRow}>
                                    <motion.button type="button" onClick={() => setStep(1)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={styles.btnPrimary}>
                                        Next Step →
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                                <div style={styles.grid}>
                                    <Input label="Full Name" required style={{ gridColumn: '1 / -1' }}>
                                        <input name="fullName" value={form.fullName} onChange={set('fullName')} onFocus={fb('name')} onBlur={blur} style={inputStyle(focused === 'name')} required />
                                        {errors.fullName && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>{errors.fullName}</span>}
                                    </Input>
                                    <Input label="SLMC Number" required>
                                        <input name="slmcNumber" value={form.slmcNumber} onChange={set('slmcNumber')} onFocus={fb('slmc')} onBlur={blur} style={inputStyle(focused === 'slmc')} required />
                                        {errors.slmcNumber && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>{errors.slmcNumber}</span>}
                                    </Input>
                                    <Input label="Specialization" required>
                                        <input name="specialization" value={form.specialization} onChange={set('specialization')} onFocus={fb('spec')} onBlur={blur} style={inputStyle(focused === 'spec')} required />
                                        {errors.specialization && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>{errors.specialization}</span>}
                                    </Input>
                                    <Input label="Clinic Name" required style={{ gridColumn: '1 / -1' }}>
                                        <input name="clinicName" value={form.clinicName} onChange={set('clinicName')} onFocus={fb('clinic')} onBlur={blur} style={inputStyle(focused === 'clinic')} required />
                                        {errors.clinicName && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>{errors.clinicName}</span>}
                                    </Input>
                                    <Input label="Phone Number" required>
                                        <input name="phone" value={form.phone} onChange={set('phone')} onFocus={fb('phone')} onBlur={blur} style={inputStyle(focused === 'phone')} required />
                                        {errors.phone && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>{errors.phone}</span>}
                                    </Input>
                                    <Input label="Email" required>
                                        <input type="email" name="email" value={form.email} onChange={set('email')} onFocus={fb('email')} onBlur={blur} style={inputStyle(focused === 'email')} required />
                                        {errors.email && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>{errors.email}</span>}
                                    </Input>
                                </div>
                                <div style={styles.navRow}>
                                    <button type="button" onClick={() => setStep(0)} style={styles.btnSecondary}>Back</button>
                                    <motion.button type="button" onClick={handleSubmit} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={styles.btnSubmit}>
                                        {loading ? 'Processing...' : 'Register Profile'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                <div style={styles.footerLink}>
                    Already have an account? <a href="/login" style={{ color: '#3b82f6', fontWeight: '700' }}>Login</a>
                </div>
            </motion.div>
        </div>
    );
}

const styles = {
    body: {
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050507', position: 'relative', overflow: 'hidden', padding: '40px 20px',
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    meshContainer: { position: 'absolute', inset: 0, opacity: 0.35, filter: 'blur(100px)', zIndex: 0 },
    meshBall1: { position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: '#3b82f6', top: '-20%', left: '-10%' },
    meshBall2: { position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: '#8b5cf6', bottom: '-10%', right: '-5%' },
    card: {
        position: 'relative', zIndex: 1, width: '100%', maxWidth: '600px', padding: '3.5rem',
        background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)',
        borderRadius: '35px', border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 50px 100px rgba(0,0,0,0.6)',
    },
    header: { textAlign: 'center', marginBottom: '3rem' },
    iconWrap: {
        width: 76, height: 76, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem', boxShadow: '0 15px 35px rgba(59,130,246,0.3)',
    },
    title: { fontSize: '2rem', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '-0.8px' },
    desc: { color: 'rgba(255,255,255,0.45)', marginTop: 10, fontSize: '1rem' },
    stepper: { position: 'relative', display: 'flex', justifyContent: 'space-around', marginBottom: '3.5rem' },
    stepperLine: { position: 'absolute', top: 21, left: '20%', right: '20%', height: 2, background: 'rgba(255,255,255,0.05)', zIndex: 0 },
    stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 1 },
    stepCircle: {
        width: 44, height: 44, borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', color: '#fff', transition: 'all 0.5s'
    },
    stepLabel: { fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    fieldWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
    label: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginLeft: 4 },
    navRow: { display: 'flex', gap: 15, marginTop: '3.5rem' },
    btnPrimary: {
        width: '100%', padding: '16px', background: '#3b82f6', color: '#fff', border: 'none',
        borderRadius: '16px', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer',
    },
    btnSubmit: {
        flex: 1, padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
        border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer',
    },
    btnSecondary: {
        padding: '16px 30px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.8)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontWeight: '700', cursor: 'pointer',
    },
    footerLink: { marginTop: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' },
};
