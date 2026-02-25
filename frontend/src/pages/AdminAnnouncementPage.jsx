import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone, Plus, Trash2, Calendar, AlertCircle,
    Bell, Mail, User, Shield, Info, ArrowRight, X, Loader2
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../services/api';

const AdminAnnouncementPage = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newAnn, setNewAnn] = useState({
        title: '',
        content: '',
        type: 'INFO',
        targetCondition: '',
        minAge: '',
        maxAge: '',
        sendEmail: false
    });

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

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...newAnn,
                minAge: newAnn.minAge ? parseInt(newAnn.minAge) : null,
                maxAge: newAnn.maxAge ? parseInt(newAnn.maxAge) : null,
            };
            await api.post('/api/admin/announcements', payload);
            setModalOpen(false);
            setNewAnn({
                title: '',
                content: '',
                type: 'INFO',
                targetCondition: '',
                minAge: '',
                maxAge: '',
                sendEmail: false
            });
            fetchAnnouncements();
        } catch (err) {
            alert('Failed to create announcement');
        } finally {
            setIsSubmitting(false);
        }
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
                                <AnnouncementCard key={ann.id} ann={ann} onDelete={() => handleDelete(ann.id)} delay={i * 0.1} />
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
                                <h3 style={S.modalTitle}>Publish Announcement</h3>
                                <button onClick={() => setModalOpen(false)} style={S.closeBtn}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleCreate} style={S.form}>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Title</label>
                                    <input
                                        required
                                        style={S.input}
                                        placeholder="Major Health Update..."
                                        value={newAnn.title}
                                        onChange={e => setNewAnn({ ...newAnn, title: e.target.value })}
                                    />
                                </div>

                                <div style={S.formRow}>
                                    <div style={{ ...S.formGroup, flex: 1 }}>
                                        <label style={S.label}>Type</label>
                                        <select
                                            style={S.select}
                                            value={newAnn.type}
                                            onChange={e => setNewAnn({ ...newAnn, type: e.target.value })}
                                        >
                                            <option style={{ background: '#0f172a', color: '#1e293b' }} value="INFO">Information</option>
                                            <option style={{ background: '#0f172a', color: '#1e293b' }} value="ALERT">Hazard/Alert</option>
                                            <option style={{ background: '#0f172a', color: '#1e293b' }} value="EVENT">Clinic Event</option>
                                        </select>
                                    </div>
                                    <div style={{ ...S.formGroup, flex: 1 }}>
                                        <label style={S.label}>Target Condition</label>
                                        <input
                                            style={S.input}
                                            placeholder="e.g. Diabetes (Optional)"
                                            value={newAnn.targetCondition}
                                            onChange={e => setNewAnn({ ...newAnn, targetCondition: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={S.formRow}>
                                    <div style={{ ...S.formGroup, flex: 1 }}>
                                        <label style={S.label}>Min Age</label>
                                        <input
                                            type="number"
                                            style={S.input}
                                            value={newAnn.minAge}
                                            onChange={e => setNewAnn({ ...newAnn, minAge: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ ...S.formGroup, flex: 1 }}>
                                        <label style={S.label}>Max Age</label>
                                        <input
                                            type="number"
                                            style={S.input}
                                            value={newAnn.maxAge}
                                            onChange={e => setNewAnn({ ...newAnn, maxAge: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={S.formGroup}>
                                    <label style={S.label}>Content</label>
                                    <textarea
                                        required
                                        style={{ ...S.input, minHeight: 120, resize: 'vertical' }}
                                        placeholder="Provide full details here..."
                                        value={newAnn.content}
                                        onChange={e => setNewAnn({ ...newAnn, content: e.target.value })}
                                    />
                                </div>

                                <div style={S.switchRow}>
                                    <div style={S.switchInfo}>
                                        <div style={S.switchLabel}>Email Notification</div>
                                        <div style={S.switchSub}>Send direct emails to matching patients.</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        style={S.checkbox}
                                        checked={newAnn.sendEmail}
                                        onChange={e => setNewAnn({ ...newAnn, sendEmail: e.target.checked })}
                                    />
                                </div>

                                <div style={S.modalFooter}>
                                    <button type="button" onClick={() => setModalOpen(false)} style={S.cancelBtn}>Cancel</button>
                                    <button disabled={isSubmitting} type="submit" style={S.submitBtn}>
                                        {isSubmitting ? 'Publishing...' : 'Confirm Publication'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

const AnnouncementCard = ({ ann, onDelete, delay }) => {
    const typeIcons = {
        ALERT: { icon: <AlertCircle color="#f87171" />, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', label: 'ALERT', color: '#f87171' },
        EVENT: { icon: <Calendar color="#34d399" />, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', label: 'EVENT', color: '#10b981' },
        INFO: { icon: <Info color="#60a5fa" />, bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', label: 'INFO', color: '#3b82f6' }
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
                <button onClick={onDelete} style={S.delBtn}><Trash2 size={16} /></button>
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

const S = {
    container: { padding: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' },
    title: { fontSize: '2rem', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' },
    subtitle: { color: '#64748b', margin: '4px 0 0', fontSize: '1rem' },
    addBtn: { display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(59,130,246,0.3)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' },
    card: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    typeBadge: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 },
    delBtn: { background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, transition: 'color 0.2s', ':hover': { color: '#ef4444' } },
    cardTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', margin: 0 },
    cardContent: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, flex: 1 },
    cardMeta: { display: 'flex', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' },
    metaGroup: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#64748b' },
    cardDate: { fontSize: '0.75rem', color: '#475569', textAlign: 'right' },
    empty: { gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', color: '#475569' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    modal: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 },
    closeBtn: { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' },
    form: { padding: '2rem' },
    formGroup: { marginBottom: '1.5rem' },
    formRow: { display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' },
    label: { display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, letterSpacing: '0.01em' },
    input: {
        width: '100%',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '12px 16px',
        color: '#f8fafc',
        fontSize: '0.95rem',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease'
    },
    select: {
        width: '100%',
        background: '#0f172a', // Solid background for select to ensure options are readable
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '12px 16px',
        color: '#f8fafc',
        fontSize: '0.95rem',
        cursor: 'pointer'
    },
    switchRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 16, marginBottom: '2rem' },
    switchLabel: { color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem' },
    switchSub: { color: '#64748b', fontSize: '0.8rem', marginTop: 2 },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' },
    cancelBtn: { padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer' },
    submitBtn: { padding: '12px 28px', borderRadius: 12, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 800, cursor: 'pointer' },
    checkbox: { width: 20, height: 20, cursor: 'pointer' },
    centerWrap: { display: 'flex', justifyContent: 'center', padding: '5rem' },
    spinner: { animation: 'spin 1s linear infinite', color: '#3b82f6' }
};

export default AdminAnnouncementPage;
