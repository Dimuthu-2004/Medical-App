import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone, Plus, Trash2, Edit2, Calendar, AlertCircle,
    Bell, Mail, User, Shield, Info, ArrowRight, X, Loader2
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../services/api';


const AnnouncementCard = ({ ann, onDelete, onEdit, delay }) => {
    const typeIcons = {
        ALERT: { icon: <AlertCircle color="#ef4444" />, bg: '#fee2e2', border: '#fecaca', label: 'ALERT', color: '#ef4444' },
        EVENT: { icon: <Calendar color="#059669" />, bg: '#d1fae5', border: '#a7f3d0', label: 'EVENT', color: '#059669' },
        INFO: { icon: <Info color="#2563eb" />, bg: '#dbeafe', border: '#bfdbfe', label: 'INFO', color: '#2563eb' }
    };

    const style = typeIcons[ann.type] || typeIcons.INFO;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay }}
            style={S.card}
        >
            <div style={S.cardTop}>
                <div style={{ ...S.typeBadge, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                    {style.icon}
                    <span>{style.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onEdit} style={{ ...S.actionBtn, color: '#3b82f6' }} title="Edit"><Edit2 size={16} /></button>
                    <button onClick={onDelete} style={{ ...S.actionBtn, color: '#94a3b8' }} title="Delete"><Trash2 size={16} /></button>
                </div>
            </div>
            <h4 style={S.cardTitle}>{ann.title}</h4>
            <p style={S.cardContent}>{ann.content}</p>

            <div style={S.cardMeta}>
                <div style={S.metaGroup}>
                    <User size={14} color="#64748b" />
                    <span>
                        {ann.minAge || ann.maxAge ? (
                            `Ages ${ann.minAge || 0} - ${ann.maxAge || 'All'}`
                        ) : 'All Patients'}
                    </span>
                </div>
                {ann.targetCondition && (
                    <div style={S.metaGroup}>
                        <Shield size={14} color="#8b5cf6" />
                        <span style={{ color: '#a78bfa' }}>{ann.targetCondition}</span>
                    </div>
                )}
                {ann.sendEmail && (
                    <div style={S.metaGroup}>
                        <Mail size={14} color="#10b981" />
                        <span style={{ color: '#34d399' }}>Emailed</span>
                    </div>
                )}
            </div>

            <div style={S.cardDate}>Published on {new Date(ann.createdAt).toLocaleDateString()}</div>
        </motion.div>
    );
};

const AdminAnnouncementPage = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [step, setStep] = useState(1); // 1: criteria, 2: preview, 3: confirm
    const [matchingPatients, setMatchingPatients] = useState([]);
    const [selectedPatients, setSelectedPatients] = useState([]);
    const initialForm = {
        title: '',
        content: '',
        type: 'INFO',
        targetCondition: '',
        minAge: '',
        maxAge: '',
        sendEmail: false
    };
    const [form, setForm] = useState(initialForm);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/api/admin/announcements');
            setAnnouncements(res.data);
        } catch (err) {
            console.error('Failed to fetch announcements', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await api.delete(`/api/admin/announcements/${id}`);
            fetchAnnouncements();
        } catch (err) {
            alert('Failed to delete announcement');
        }
    };

    const handleEdit = (ann) => {
        setEditingId(ann.id);
        setForm({
            title: ann.title || '',
            content: ann.content || '',
            type: ann.type || 'INFO',
            targetCondition: ann.targetCondition || '',
            minAge: ann.minAge !== null ? ann.minAge : '',
            maxAge: ann.maxAge !== null ? ann.maxAge : '',
            sendEmail: false // Usually don't want to re-send email on every edit by default
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...form,
                minAge: form.minAge ? parseInt(form.minAge) : null,
                maxAge: form.maxAge ? parseInt(form.maxAge) : null,
            };

            if (editingId) {
                await api.put(`/api/admin/announcements/${editingId}`, payload);
            } else {
                await api.post('/api/admin/announcements', payload);
            }

            setModalOpen(false);
            setForm(initialForm);
            setEditingId(null);
            fetchAnnouncements();
        } catch (err) {
            alert(`Failed to ${editingId ? 'update' : 'create'} announcement`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreview = async () => {
        setIsSubmitting(true);
        try {
            const criteria = {

                targetCondition: form.targetCondition?.trim() || null,
                minAge: form.minAge ? parseInt(form.minAge) : null,
                maxAge: form.maxAge ? parseInt(form.maxAge) : null,
            };
            const res = await api.post('/api/admin/announcements/preview-patients', criteria);
            setMatchingPatients(res.data);
            setSelectedPatients(res.data.map(p => p.id)); // Select all by default
            setStep(2);
        } catch (err) {
            alert('Failed to preview patients');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePatientSelection = (patientId) => {
        setSelectedPatients(prev =>
            prev.includes(patientId)
                ? prev.filter(id => id !== patientId)
                : [...prev, patientId]
        );
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        try {
            // First create the announcement
            const payload = {
                ...form,
                minAge: form.minAge ? parseInt(form.minAge) : null,
                maxAge: form.maxAge ? parseInt(form.maxAge) : null,
            };
            const res = await api.post('/api/admin/announcements', payload);
            const announcementId = res.data.id;

            // Then send to selected patients if email is enabled
            if (form.sendEmail && selectedPatients.length > 0) {
                await api.post(`/api/admin/announcements/${announcementId}/send-to-patients`, selectedPatients);
            }

            setModalOpen(false);
            setForm(initialForm);
            setStep(1);
            setMatchingPatients([]);
            setSelectedPatients([]);
            fetchAnnouncements();
        } catch (err) {
            alert('Failed to publish announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetModal = () => {
        setModalOpen(false);
        setEditingId(null);
        setForm(initialForm);
        setStep(1);
        setMatchingPatients([]);
        setSelectedPatients([]);
    };

    return (
        <AdminLayout>
            <div style={S.container}>
                <div style={S.header}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 style={S.title}>Patient Awareness System</h1>
                        <p style={S.subtitle}>Manage announcements, alerts, and targeted health notifications.</p>
                    </motion.div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setModalOpen(true)}
                        style={S.addBtn}
                    >
                        <Plus size={20} />
                        Publish New
                    </motion.button>
                </div>

                {loading ? (
                    <div style={S.centerWrap}><Loader2 style={S.spinner} /></div>
                ) : (
                    <div style={S.grid}>
                        <AnimatePresence>
                            {announcements.map((ann, i) => (
                                <AnnouncementCard
                                    key={ann.id}
                                    ann={ann}
                                    onDelete={() => handleDelete(ann.id)}
                                    onEdit={() => handleEdit(ann)}
                                    delay={i * 0.1}
                                />
                            ))}
                        </AnimatePresence>
                        {announcements.length === 0 && (
                            <div style={S.empty}>
                                <Megaphone size={48} color="#475569" />
                                <p>No announcements found. Spread the word!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={S.modalOverlay}>
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={S.modal}
                        >
                            <div style={S.modalHeader}>
                                <h3 style={S.modalTitle}>{editingId ? 'Edit Announcement' : 'Publish Announcement'}</h3>
                                <button onClick={resetModal} style={S.closeBtn}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={S.form}>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Title</label>
                                    <input
                                        required
                                        style={S.input}
                                        placeholder="Major Health Update..."
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>

                                <div style={S.formRow}>
                                    <div style={{ ...S.formGroup, flex: 1 }}>
                                        <label style={S.label}>Type</label>
                                        <select
                                            style={S.select}
                                            value={form.type}
                                            onChange={e => setForm({ ...form, type: e.target.value })}
                                        >
                                            <option value="INFO">Information</option>
                                            <option value="ALERT">Hazard/Alert</option>
                                            <option value="EVENT">Clinic Event</option>
                                        </select>
                                    </div>
                                    <div style={{ ...S.formGroup, flex: 1 }}>
                                        <label style={S.label}>Target Condition</label>
                                        <input
                                            style={S.input}
                                            placeholder="e.g. Diabetes (Optional)"
                                            value={form.targetCondition}
                                            onChange={e => setForm({ ...form, targetCondition: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={S.formRow}>
                                    <div style={{ ...S.formGroup, flex: 1 }}>
                                        <label style={S.label}>Min Age</label>
                                        <input
                                            type="number"
                                            style={S.input}
                                            value={form.minAge}
                                            onChange={e => setForm({ ...form, minAge: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ ...S.formGroup, flex: 1 }}>
                                        <label style={S.label}>Max Age</label>
                                        <input
                                            type="number"
                                            style={S.input}
                                            value={form.maxAge}
                                            onChange={e => setForm({ ...form, maxAge: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={S.formGroup}>
                                    <label style={S.label}>Content</label>
                                    <textarea
                                        required
                                        style={{ ...S.input, minHeight: 120, resize: 'vertical' }}
                                        placeholder="Provide full details here..."
                                        value={form.content}
                                        onChange={e => setForm({ ...form, content: e.target.value })}
                                    />
                                </div>

                                <div style={S.switchRow}>
                                    <div style={S.switchInfo}>
                                        <div style={S.switchLabel}>Patient Notification Dispatch</div>
                                        <div style={S.switchSub}>Send emails and in-app notifications to selected patients.</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        style={S.checkbox}
                                        checked={form.sendEmail}
                                        onChange={e => setForm({ ...form, sendEmail: e.target.checked })}
                                    />
                                </div>

                                {step === 1 && (
                                    <div style={S.modalFooter}>
                                        <button type="button" onClick={resetModal} style={S.cancelBtn}>Cancel</button>
                                        <button disabled={isSubmitting} type="button" onClick={handlePreview} style={S.submitBtn}>
                                            {isSubmitting ? 'Loading...' : 'Preview Patients'}
                                        </button>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div style={S.previewSection}>
                                        <h4 style={S.previewTitle}>
                                            {form.targetCondition?.trim() 
                                                ? `Patients with "${form.targetCondition}"` 
                                                : 'All Patients'}
                                        </h4>
                                        <div style={S.patientList}>
                                            {matchingPatients.length === 0 ? (
                                                <p style={S.noPatients}>No patients match the selected criteria.</p>
                                            ) : (
                                                matchingPatients.map(patient => {
                                                    const age = patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'N/A';
                                                    return (
                                                        <div key={patient.id} style={S.patientCard(selectedPatients.includes(patient.id))} onClick={() => handlePatientSelection(patient.id)}>
                                                            <div style={S.patientInfo}>
                                                                <User size={16} color="#475569" />
                                                                <span style={S.patientName}>{patient.name}</span>
                                                            </div>
                                                            <div style={S.patientDetails}>
                                                                <span style={S.patientAge}>{age} years old</span>
                                                                {patient.chronicConditions && <span style={S.patientCondition}>{patient.chronicConditions}</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div style={S.modalFooter}>
                                            <button type="button" onClick={() => setStep(1)} style={S.backBtn}>Back</button>
                                            <button disabled={isSubmitting} type="button" onClick={handleFinalSubmit} style={S.submitBtn}>
                                                {isSubmitting ? 'Publishing...' : 'Confirm & Publish'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};


const S = {
    container: { padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' },
    title: { fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' },
    subtitle: { color: '#64748b', margin: '4px 0 0', fontSize: '1rem' },
    addBtn: { display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' },
    card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    typeBadge: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 },
    actionBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', transition: 'all 0.2s', opacity: 0.7 },
    cardTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 },
    cardContent: { color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, flex: 1 },
    cardMeta: { display: 'flex', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' },
    metaGroup: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#64748b' },
    cardDate: { fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' },
    empty: { gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', color: '#94a3b8' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    modal: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 28, width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    modalHeader: { padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 },
    closeBtn: { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' },
    form: { padding: '2rem' },
    formGroup: { marginBottom: '1.5rem' },
    formRow: { display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' },
    label: { display: 'block', color: '#475569', fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, letterSpacing: '0.01em' },
    input: {
        width: '100%',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px 16px',
        color: '#0f172a',
        fontSize: '0.95rem',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
        outlineColor: '#3b82f6'
    },
    select: {
        width: '100%',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px 16px',
        color: '#0f172a',
        fontSize: '0.95rem',
        cursor: 'pointer',
        outlineColor: '#3b82f6'
    },
    switchRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, marginBottom: '2rem' },
    switchLabel: { color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' },
    switchSub: { color: '#64748b', fontSize: '0.8rem', marginTop: 2 },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' },
    cancelBtn: { padding: '12px 24px', borderRadius: 12, border: '1px solid #cbd5e1', background: 'transparent', color: '#64748b', fontWeight: 700, cursor: 'pointer' },
    submitBtn: { padding: '12px 28px', borderRadius: 12, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 6px rgba(59,130,246,0.2)' },
    checkbox: { width: 20, height: 20, cursor: 'pointer' },
    centerWrap: { display: 'flex', justifyContent: 'center', padding: '5rem' },
    spinner: { animation: 'spin 1s linear infinite', color: '#3b82f6' },
    previewSection: { marginTop: '1.5rem' },
    previewTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: '1rem' },
    patientList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
    patientCard: (selected) => ({
        background: selected ? '#d1fae5' : '#f8fafc',
        border: `1px solid ${selected ? '#34d399' : '#e2e8f0'}`,
        borderRadius: 12,
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    }),
    patientInfo: { display: 'flex', alignItems: 'center', gap: 8 },
    patientName: { color: '#0f172a', fontWeight: 600 },
    patientDetails: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569' },
    patientAge: { background: '#eff6ff', borderRadius: 8, padding: '4px 8px' },
    patientCondition: { background: '#e0f2fe', borderRadius: 8, padding: '4px 8px' },
    noPatients: { gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '2rem' },
    backBtn: { padding: '12px 24px', borderRadius: 12, border: '1px solid #cbd5e1', background: 'transparent', color: '#64748b', fontWeight: 700, cursor: 'pointer' }
};

export default AdminAnnouncementPage;
