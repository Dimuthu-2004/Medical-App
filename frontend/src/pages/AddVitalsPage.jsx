import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Save, Thermometer, Droplets, Heart, Scale } from 'lucide-react';
import api from '../services/api';

export default function AddVitalsPage() {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        weight: '', systolicBP: '', diastolicBP: '', temperature: '', heartRate: ''
    });

    const pathParts = window.location.pathname.split('/');
    const patientId = pathParts[pathParts.length - 1];

    useEffect(() => {
        api.get(`/api/medical-records/patient/${patientId}`)
            .then(res => {
                setPatient(res.data.patient);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [patientId]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/api/vitals/save', {
                patientId: patientId,
                weight: form.weight ? parseFloat(form.weight) : null,
                systolicBP: form.systolicBP ? parseInt(form.systolicBP) : null,
                diastolicBP: form.diastolicBP ? parseInt(form.diastolicBP) : null,
                temperature: form.temperature ? parseFloat(form.temperature) : null,
                heartRate: form.heartRate ? parseInt(form.heartRate) : null
            });
            alert('Vitals saved successfully!');
            window.location.href = `/medical-records/patient/${patientId}`;
        } catch (err) {
            console.error(err);
            alert('Error saving vitals. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div style={S.container}>
            <div style={S.wrapper}>
                <header style={S.header}>
                    <button onClick={() => window.history.back()} style={S.backBtn}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div style={{ flex: 1 }}>
                        <h1 style={S.title}>Record Vitals</h1>
                        <p style={S.subtitle}>{patient?.name || 'Patient'}</p>
                    </div>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={S.card}
                >
                    <form onSubmit={handleSave}>
                        <div style={S.sectionHeader}>
                            <Activity size={20} color="#10b981" />
                            <h3 style={S.sectionTitle}>Patient Health Metrics</h3>
                        </div>

                        <div style={S.grid}>
                            <VitalInput
                                icon={<Scale size={18} />}
                                label="Weight (kg)"
                                value={form.weight}
                                onChange={v => setForm({ ...form, weight: v })}
                                placeholder="e.g. 70.5"
                                color="#3b82f6"
                            />
                            <div style={S.splitRow}>
                                <VitalInput
                                    icon={<Droplets size={18} />}
                                    label="Systolic BP"
                                    value={form.systolicBP}
                                    onChange={v => setForm({ ...form, systolicBP: v })}
                                    placeholder="Sys"
                                    color="#ef4444"
                                />
                                <VitalInput
                                    icon={<Droplets size={18} />}
                                    label="Diastolic BP"
                                    value={form.diastolicBP}
                                    onChange={v => setForm({ ...form, diastolicBP: v })}
                                    placeholder="Dia"
                                    color="#ef4444"
                                />
                            </div>
                            <VitalInput
                                icon={<Thermometer size={18} />}
                                label="Temperature (°C)"
                                value={form.temperature}
                                onChange={v => setForm({ ...form, temperature: v })}
                                placeholder="e.g. 36.6"
                                color="#f59e0b"
                            />
                            <VitalInput
                                icon={<Heart size={18} />}
                                label="Heart Rate (bpm)"
                                value={form.heartRate}
                                onChange={v => setForm({ ...form, heartRate: v })}
                                placeholder="e.g. 72"
                                color="#10b981"
                            />
                        </div>

                        <div style={S.footer}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={saving}
                                style={S.saveBtn}
                            >
                                {saving ? 'Saving...' : <><Save size={18} /> Save Vitals</>}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}

const VitalInput = ({ icon, label, value, onChange, placeholder, color }) => (
    <div style={S.inputGroup}>
        <div style={{ ...S.iconBadge, color, background: `${color}15` }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <label style={S.label}>{label}</label>
            <input
                type="number"
                step="any"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={S.input}
            />
        </div>
    </div>
);

const LoadingScreen = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#64748b' }}>
        Loading patient details...
    </div>
);

const S = {
    container: { minHeight: '100vh', background: 'radial-gradient(circle at top right, #1a2744, #0f172a)', padding: '2rem 1.5rem', fontFamily: 'Inter,system-ui,sans-serif' },
    wrapper: { maxWidth: '700px', margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' },
    backBtn: { display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
    title: { margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '1rem' },

    card: { background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: '2rem', backdropFilter: 'blur(10px)' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' },
    sectionTitle: { margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' },

    grid: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    splitRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
    inputGroup: { display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' },
    iconBadge: { width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    label: { display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' },
    input: { width: '100%', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700, outline: 'none', padding: 0 },

    footer: { marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' },
    saveBtn: { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }
};
