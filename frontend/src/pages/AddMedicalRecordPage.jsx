import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Save, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function AddMedicalRecordPage() {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        diagnosis: '', medications: '', medicalHistory: '', allergies: '', notes: ''
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
            await api.post('/api/medical-records/save', {
                patientId: patientId,
                ...form
            });
            alert('Medical record saved successfully!');
            window.location.href = `/medical-records/patient/${patientId}`;
        } catch (err) {
            console.error(err);
            alert('Error saving record. Please try again.');
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
                        <h1 style={S.title}>Add Medical Record</h1>
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
                            <FileText size={20} color="#3b82f6" />
                            <h3 style={S.sectionTitle}>Clinical Details</h3>
                        </div>

                        <div style={S.formGrid}>
                            <InputField
                                label="Diagnosis"
                                value={form.diagnosis}
                                onChange={v => setForm({ ...form, diagnosis: v })}
                                placeholder="e.g. Hypertension, Type 2 Diabetes"
                                required
                            />
                            <InputField
                                label="Medications"
                                value={form.medications}
                                onChange={v => setForm({ ...form, medications: v })}
                                placeholder="Enter prescribed medications and dosages"
                                textarea
                            />
                            <InputField
                                label="Medical History"
                                value={form.medicalHistory}
                                onChange={v => setForm({ ...form, medicalHistory: v })}
                                placeholder="Relevant past medical conditions"
                                textarea
                            />
                            <InputField
                                label="Allergies"
                                value={form.allergies}
                                onChange={v => setForm({ ...form, allergies: v })}
                                placeholder="e.g. Penicillin, Peanuts"
                            />
                            <InputField
                                label="Internal Notes"
                                value={form.notes}
                                onChange={v => setForm({ ...form, notes: v })}
                                placeholder="Private clinical observations"
                                textarea
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
                                {saving ? 'Saving...' : <><Save size={18} /> Save Medical Record</>}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}

const InputField = ({ label, value, onChange, placeholder, textarea = false, required = false }) => (
    <div style={{ marginBottom: '1.5rem' }}>
        <label style={S.label}>{label} {required && <span style={{ color: '#f43f5e' }}>*</span>}</label>
        {textarea ? (
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                style={{ ...S.input, minHeight: 100, resize: 'vertical' }}
            />
        ) : (
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                style={S.input}
            />
        )}
    </div>
);

const LoadingScreen = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#64748b' }}>
        Loading patient details...
    </div>
);

const S = {
    container: { minHeight: '100vh', background: 'radial-gradient(circle at top right, #1a2744, #0f172a)', padding: '2rem 1.5rem', fontFamily: 'Inter,system-ui,sans-serif' },
    wrapper: { maxWidth: '800px', margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' },
    backBtn: { display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
    title: { margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '1rem' },

    card: { background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: '2rem', backdropFilter: 'blur(10px)' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' },
    sectionTitle: { margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' },

    formGrid: { display: 'flex', flexDirection: 'column' },
    label: { display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#f8fafc', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },

    footer: { marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' },
    saveBtn: { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }
};
