import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, User, Stethoscope, ChevronRight, CheckCircle,
    AlertCircle, Clock, ArrowLeft, Star, LogOut
} from 'lucide-react';
import api from '../services/api';

const SESSION_TYPES = [
    { value: 'MORNING', label: '☀️ Morning', desc: 'Early consultations' },
    { value: 'EVENING', label: '🌙 Evening', desc: 'End of day visits' },
];

export default function BookAppointmentPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        doctorId: '',
        appointmentDate: '',
        sessionType: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1); // 1=doctor, 2=details, 3=confirm
    const [result, setResult] = useState(null); // { success, message, tokenNumber }

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        api.get('/api/appointments/doctors')
            .then(r => setDoctors(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));

        if (id) {
            api.get(`/api/appointments/${id}`)
                .then(r => {
                    const appt = r.data;
                    setForm({
                        doctorId: appt.doctorId || '',
                        appointmentDate: appt.appointmentDate || '',
                        sessionType: appt.sessionType || '',
                        notes: appt.notes || ''
                    });
                    setStep(2); // Jump to details section
                })
                .catch(err => {
                    console.error('Failed to fetch appointment:', err);
                });
        }
    }, [id]);

    const selectedDoctor = doctors.find(d => String(d.id) === String(form.doctorId));

    const handleDoctorSelect = (doctor) => {
        if (!doctor.available) return;
        setForm(f => ({ ...f, doctorId: doctor.id }));
        setStep(2);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                doctorId: form.doctorId || null,
                appointmentDate: form.appointmentDate,
                sessionType: form.sessionType,
                notes: form.notes
            };

            let res;
            if (id) {
                res = await api.post('/api/appointments/book', { ...payload, id });
            } else {
                res = await api.post('/api/appointments/book', payload);
            }

            setResult({ success: true, message: id ? 'Appointment updated successfully' : res.data.message, tokenNumber: res.data.tokenNumber });
            setStep(3);
        } catch (e) {
            const errMsg = e.response?.data?.error || 'Operation failed. Please try again.';
            setResult({ success: false, message: errMsg });
            setStep(3);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) return;

        setSubmitting(true);
        try {
            await api.delete(`/api/appointments/${id}`);
            setResult({ success: true, message: 'Appointment cancelled successfully' });
            setStep(3);
        } catch (e) {
            const errMsg = e.response?.data?.error || 'Cancellation failed. Please try again.';
            setResult({ success: false, message: errMsg });
            setStep(3);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div style={S.container}>
            <div style={S.wrapper}>
                {/* Header */}
                <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={S.header}>
                    <a href="/patients/dashboard" style={S.backBtn}><ArrowLeft size={18} /> Back</a>
                    <div>
                        <h1 style={S.title}>{id ? 'Edit Appointment' : 'Book an Appointment'}</h1>
                        <p style={S.subtitle}>{id ? 'Update your consultation details' : 'Select a doctor and time slot'}</p>
                    </div>
                    <a href="/logout" style={S.logoutBtn}><LogOut size={16} /> Logout</a>
                </motion.header>

                {/* Step Indicator */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.steps}>
                    {['Choose Doctor', 'Date & Session', 'Confirmed'].map((label, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                ...S.stepDot,
                                background: step > i ? '#10b981' : step === i + 1 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                                color: step > i ? '#fff' : step === i + 1 ? '#10b981' : '#64748b',
                                boxShadow: step === i + 1 ? '0 0 0 3px rgba(16,185,129,0.25)' : 'none'
                            }}>
                                {step > i ? <CheckCircle size={16} /> : i + 1}
                            </div>
                            <span style={{ ...S.stepLabel, color: step === i + 1 ? '#f8fafc' : '#64748b' }}>{label}</span>
                            {i < 2 && <div style={S.stepLine} />}
                        </div>
                    ))}
                </motion.div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Select Doctor */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <h2 style={S.sectionTitle}>Select Your Doctor</h2>
                            <p style={S.sectionHint}>Doctors marked as unavailable cannot be selected for today.</p>
                            <div style={S.doctorGrid}>
                                {doctors.map((doc, i) => (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        whileHover={doc.available ? { y: -6, scale: 1.02 } : {}}
                                        onClick={() => handleDoctorSelect(doc)}
                                        style={{
                                            ...S.doctorCard,
                                            opacity: doc.available ? 1 : 0.5,
                                            cursor: doc.available ? 'pointer' : 'not-allowed',
                                            border: `1px solid ${doc.available ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.2)'}`,
                                        }}
                                    >
                                        <div style={S.docAvatar}>{doc.fullName?.[0] ?? 'D'}</div>
                                        <div style={S.docInfo}>
                                            <span style={S.docName}>Dr. {doc.fullName}</span>
                                            <span style={S.docSpec}>{doc.specialization}</span>
                                            <span style={S.docFee}>LKR {doc.consultationFee ?? 'N/A'}</span>
                                        </div>
                                        <div style={{
                                            ...S.availBadge,
                                            background: doc.available ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                            color: doc.available ? '#10b981' : '#f87171',
                                        }}>
                                            {doc.available ? '● Available' : '● Unavailable'}
                                        </div>
                                        {doc.available && <ChevronRight size={18} color="#64748b" />}
                                    </motion.div>
                                ))}
                                {/* Option: No specific doctor */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: doctors.length * 0.06 }}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    onClick={() => { setForm(f => ({ ...f, doctorId: '' })); setStep(2); }}
                                    style={{ ...S.doctorCard, cursor: 'pointer', borderStyle: 'dashed' }}
                                >
                                    <div style={{ ...S.docAvatar, background: 'rgba(99,102,241,0.2)' }}>🩺</div>
                                    <div style={S.docInfo}>
                                        <span style={S.docName}>General Consultation</span>
                                        <span style={S.docSpec}>No specific doctor</span>
                                    </div>
                                    <ChevronRight size={18} color="#64748b" />
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Date & Session */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <button onClick={() => setStep(1)} style={S.backStep}><ArrowLeft size={16} /> Back to Doctor Selection</button>
                            {selectedDoctor && (
                                <div style={S.selectedDocBanner}>
                                    <div style={S.docAvatar}>{selectedDoctor.fullName[0]}</div>
                                    <div>
                                        <div style={{ color: '#f8fafc', fontWeight: 700 }}>Dr. {selectedDoctor.fullName}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{selectedDoctor.specialization}</div>
                                    </div>
                                </div>
                            )}
                            <div style={S.formCard}>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Appointment Date *</label>
                                    <input
                                        type="date"
                                        min={today}
                                        value={form.appointmentDate}
                                        onChange={e => setForm(f => ({ ...f, appointmentDate: e.target.value }))}
                                        style={S.input}
                                    />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Session Type *</label>
                                    <div style={S.sessionGrid}>
                                        {SESSION_TYPES.map(st => (
                                            <motion.button
                                                key={st.value}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => setForm(f => ({ ...f, sessionType: st.value }))}
                                                style={{
                                                    ...S.sessionCard,
                                                    ...(form.sessionType === st.value ? S.sessionCardActive : {})
                                                }}
                                            >
                                                <div style={{ fontSize: '1.3rem' }}>{st.label.split(' ')[0]}</div>
                                                <div style={{ fontWeight: 700 }}>{st.label.split(' ')[1]}</div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{st.desc}</div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Additional Notes (optional)</label>
                                    <textarea
                                        value={form.notes}
                                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="Any symptoms or concerns to share with the doctor..."
                                        style={{ ...S.input, minHeight: 90, resize: 'vertical' }}
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSubmit}
                                    disabled={!form.appointmentDate || !form.sessionType || submitting}
                                    style={{
                                        ...S.submitBtn,
                                        opacity: (!form.appointmentDate || !form.sessionType || submitting) ? 0.6 : 1
                                    }}
                                >
                                    {submitting ? 'Saving...' : (id ? 'Update Appointment' : 'Confirm Appointment')} {!submitting && <CheckCircle size={18} />}
                                </motion.button>

                                {id && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleDelete}
                                        disabled={submitting}
                                        style={{
                                            ...S.cancelApptBtn,
                                            marginTop: '1rem',
                                            opacity: submitting ? 0.6 : 1
                                        }}
                                    >
                                        Cancel Appointment
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Result */}
                    {step === 3 && result && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={S.resultCard}
                        >
                            {result.success ? (
                                <>
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} style={S.resultIcon}>
                                        <CheckCircle size={48} color="#10b981" />
                                    </motion.div>
                                    <h2 style={{ color: '#f8fafc', margin: '1rem 0 0.5rem' }}>Appointment Confirmed!</h2>
                                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>A confirmation email has been sent to you.</p>
                                    {result.tokenNumber && (
                                        <div style={S.tokenDisplay}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your Token Number</div>
                                            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#10b981' }}>#{result.tokenNumber}</div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <a href="/patients/dashboard" style={S.dashBtn}>Go to Dashboard</a>
                                        <button onClick={() => { setStep(1); setForm({ doctorId: '', appointmentDate: '', sessionType: '', notes: '' }); setResult(null); }} style={S.bookAnotherBtn}>Book Another</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ ...S.resultIcon, background: 'rgba(239,68,68,0.1)' }}>
                                        <AlertCircle size={48} color="#ef4444" />
                                    </div>
                                    <h2 style={{ color: '#f8fafc', margin: '1rem 0 0.5rem' }}>Booking Failed</h2>
                                    <p style={{ color: '#f87171', marginBottom: '1.5rem' }}>{result.message}</p>
                                    <button onClick={() => { setStep(1); setResult(null); }} style={S.dashBtn}>Try Again</button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

const LoadingScreen = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#64748b' }}>
        Loading doctors...
    </div>
);

const S = {
    container: { minHeight: '100vh', background: 'radial-gradient(circle at top left, #1e3a5f, #0f172a)', padding: '2rem 1.5rem', fontFamily: 'Inter,system-ui,sans-serif' },
    wrapper: { maxWidth: '900px', margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' },
    backBtn: { display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', textDecoration: 'none', fontWeight: 700, padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' },
    title: { margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },
    logoutBtn: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '8px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.15)' },

    steps: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem', flexWrap: 'wrap' },
    stepDot: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 },
    stepLabel: { fontSize: '0.85rem', fontWeight: 700, marginLeft: 8, marginRight: 8, whiteSpace: 'nowrap' },
    stepLine: { flex: 1, height: 2, background: 'rgba(255,255,255,0.08)', minWidth: 30, marginRight: 8 },

    sectionTitle: { fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem' },
    sectionHint: { color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' },

    doctorGrid: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    doctorCard: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 18, transition: 'all 0.2s' },
    docAvatar: { width: 50, height: 50, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.2rem', flexShrink: 0 },
    docInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
    docName: { color: '#f1f5f9', fontWeight: 700 },
    docSpec: { color: '#94a3b8', fontSize: '0.85rem' },
    docFee: { color: '#10b981', fontSize: '0.8rem', fontWeight: 700 },
    availBadge: { padding: '4px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 },

    selectedDocBanner: { display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: '1rem 1.5rem', marginBottom: '1.5rem' },

    formCard: { background: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: '2rem', border: '1px solid rgba(255,255,255,0.07)' },
    formGroup: { marginBottom: '1.75rem' },
    label: { display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 16px', color: '#f8fafc', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    sessionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' },
    sessionCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1rem', textAlign: 'center', cursor: 'pointer', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.2s' },
    sessionCardActive: { background: 'rgba(16,185,129,0.1)', border: '2px solid #10b981', color: '#f8fafc' },

    submitBtn: { width: '100%', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 14, padding: '1rem', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
    backStep: { display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, marginBottom: '1.5rem', padding: 0, fontSize: '0.9rem' },

    resultCard: { background: 'rgba(255,255,255,0.04)', borderRadius: 32, padding: '3rem 2rem', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', maxWidth: 500, margin: '0 auto' },
    resultIcon: { width: 90, height: 90, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
    tokenDisplay: { background: 'rgba(16,185,129,0.08)', border: '2px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '1.5rem 2rem', display: 'inline-block' },

    dashBtn: { background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.95rem' },
    bookAnotherBtn: { background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' },
    cancelApptBtn: { width: '100%', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '1rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' },
};
