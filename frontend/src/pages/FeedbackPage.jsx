import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, MessageSquare, ArrowLeft, CheckCircle,
    Edit3, Trash2, ChevronDown, ChevronUp, Send, LogOut
} from 'lucide-react';
import api from '../services/api';

const StarRating = ({ value, onChange, readonly = false }) => (
    <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(i => (
            <motion.button
                key={i}
                whileHover={!readonly ? { scale: 1.2 } : {}}
                whileTap={!readonly ? { scale: 0.9 } : {}}
                onClick={() => !readonly && onChange?.(i)}
                style={{
                    background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer',
                    padding: 2, color: i <= value ? '#f59e0b' : '#334155', fontSize: '1.4rem'
                }}
            >★</motion.button>
        ))}
    </div>
);

export default function FeedbackPage() {
    const { appointmentId: urlAppointmentId } = useParams();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openForm, setOpenForm] = useState(null); // appointmentId
    const [formData, setFormData] = useState({ rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null); // feedbackId
    const [expandedAdminReply, setExpandedAdminReply] = useState(null);
    const [animatingId, setAnimatingId] = useState(null);

    useEffect(() => {
        if (urlAppointmentId) {
            setOpenForm(parseInt(urlAppointmentId));
        }
        fetchFeedbacks();
    }, [urlAppointmentId]);

    const fetchFeedbacks = () => {
        api.get('/api/feedback/my-feedbacks')
            .then(r => setFeedbacks(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleSubmit = async (appointmentId) => {
        setSubmitting(true);
        try {
            const params = new URLSearchParams({ rating: formData.rating, comment: formData.comment });
            await api.post(`/api/feedback/add/${appointmentId}?${params}`);
            setOpenForm(null);
            setFormData({ rating: 5, comment: '' });
            setAnimatingId(appointmentId);
            setTimeout(() => {
                setAnimatingId(null);
                fetchFeedbacks();
            }, 2500);
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to submit feedback.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (feedbackId) => {
        setSubmitting(true);
        try {
            const params = new URLSearchParams({ rating: formData.rating, comment: formData.comment });
            await api.put(`/api/feedback/update/${feedbackId}?${params}`);
            setEditingId(null);
            setFormData({ rating: 5, comment: '' });
            fetchFeedbacks();
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to update feedback.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (feedbackId) => {
        if (!window.confirm('Delete this feedback?')) return;
        try {
            await api.delete(`/api/feedback/delete/${feedbackId}`);
            fetchFeedbacks();
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to delete feedback.');
        }
    };

    const startEdit = (fb) => {
        setEditingId(fb.feedbackId);
        setFormData({ rating: fb.rating, comment: fb.comment });
    };

    if (loading) return <LoadingScreen />;

    return (
        <div style={S.container}>
            <div style={S.wrapper}>
                {/* Header */}
                <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={S.header}>
                    <a href="/patients/dashboard" style={S.backBtn}><ArrowLeft size={18} /> Dashboard</a>
                    <div>
                        <h1 style={S.title}>Reviews & Feedback</h1>
                        <p style={S.subtitle}>Rate your appointments and help us improve</p>
                    </div>
                    <a href="/logout" style={S.logoutBtn}><LogOut size={16} /> Logout</a>
                </motion.header>

                {feedbacks.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.emptyState}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⭐</div>
                        <h2 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>No Completed Appointments</h2>
                        <p style={{ color: '#64748b' }}>Submit feedback after your appointment is completed.</p>
                        <a href="/appointments/add" style={S.bookBtn}>Book an Appointment</a>
                    </motion.div>
                ) : (
                    <div style={S.list}>
                        {feedbacks.map((fb, i) => (
                            <motion.div
                                key={fb.appointmentId}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                style={S.card}
                            >
                                {/* Appointment Summary */}
                                <div style={S.cardTop}>
                                    <div style={S.tokenBadge}>#{fb.tokenNumber ?? '?'}</div>
                                    <div style={S.apptInfo}>
                                        <div style={S.docName}>{fb.doctorName}</div>
                                        <div style={S.apptDate}>{fb.date}</div>
                                    </div>
                                    <div style={{ ...S.statusTag, background: fb.hasFeedback ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)', color: fb.hasFeedback ? '#10b981' : '#fbbf24' }}>
                                        {fb.hasFeedback ? '✓ Reviewed' : '○ Pending Review'}
                                    </div>
                                </div>

                                {/* Existing Feedback Display */}
                                {fb.hasFeedback && editingId !== fb.feedbackId && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.feedbackDisplay}>
                                        <StarRating value={fb.rating} readonly />
                                        <p style={S.feedComment}>{fb.comment}</p>
                                        <div style={S.feedActions}>
                                            <button onClick={() => startEdit(fb)} style={S.editBtn}>
                                                <Edit3 size={14} /> Edit
                                            </button>
                                            <button onClick={() => handleDelete(fb.feedbackId)} style={S.deleteBtn}>
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>

                                        {/* Admin Reply */}
                                        {fb.adminReply && (
                                            <div style={S.adminReplyBox}>
                                                <button
                                                    onClick={() => setExpandedAdminReply(expandedAdminReply === fb.feedbackId ? null : fb.feedbackId)}
                                                    style={S.adminReplyToggle}
                                                >
                                                    💬 Admin Reply
                                                    {expandedAdminReply === fb.feedbackId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                                <AnimatePresence>
                                                    {expandedAdminReply === fb.feedbackId && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            style={S.adminReplyText}
                                                        >
                                                            {fb.adminReply}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Add / Edit Form */}
                                {(!fb.hasFeedback && openForm === fb.appointmentId) || (fb.hasFeedback && editingId === fb.feedbackId) ? (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={S.feedForm}
                                    >
                                        <div style={S.formRow}>
                                            <label style={S.label}>Your Rating</label>
                                            <StarRating value={formData.rating} onChange={r => setFormData(f => ({ ...f, rating: r }))} />
                                        </div>
                                        <div style={S.formRow}>
                                            <label style={S.label}>Comment</label>
                                            <textarea
                                                value={formData.comment}
                                                onChange={e => setFormData(f => ({ ...f, comment: e.target.value }))}
                                                placeholder="Share your experience..."
                                                style={S.textarea}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <motion.button
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => editingId ? handleUpdate(editingId) : handleSubmit(fb.appointmentId)}
                                                disabled={!formData.comment || submitting}
                                                style={{ ...S.submitBtn, opacity: (!formData.comment || submitting) ? 0.6 : 1 }}
                                            >
                                                <Send size={15} /> {submitting ? 'Submitting...' : editingId ? 'Update' : 'Submit'}
                                            </motion.button>
                                            <button onClick={() => { setOpenForm(null); setEditingId(null); setFormData({ rating: 5, comment: '' }); }} style={S.cancelBtn}>
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : !fb.hasFeedback ? (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { setOpenForm(fb.appointmentId); setFormData({ rating: 5, comment: '' }); }}
                                        style={S.addFeedbackBtn}
                                    >
                                        <Star size={16} /> Leave a Review
                                    </motion.button>
                                ) : null}
                                {/* Success Animation Overlay */}
                                <AnimatePresence>
                                    {animatingId === fb.appointmentId && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={S.successOverlay}
                                        >
                                            <motion.div
                                                initial={{ y: 20, scale: 0.5 }}
                                                animate={{ y: -20, scale: 1 }}
                                                exit={{ y: -100, opacity: 0 }}
                                                style={S.successContent}
                                            >
                                                <div style={S.successIcon}><Send size={32} /></div>
                                                <div style={S.successTitle}>Review Sent!</div>
                                                <div style={S.successSubtitle}>Thank you for your feedback</div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const LoadingScreen = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#64748b' }}>
        Loading feedback...
    </div>
);

const S = {
    container: { minHeight: '100vh', background: 'radial-gradient(circle at bottom right, #312e81, #0f172a)', padding: '2rem 1.5rem', fontFamily: 'Inter,system-ui,sans-serif' },
    wrapper: { maxWidth: '860px', margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' },
    backBtn: { display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', textDecoration: 'none', fontWeight: 700, padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
    title: { margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },
    logoutBtn: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '8px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.15)' },

    emptyState: { textAlign: 'center', padding: '5rem 2rem', background: 'rgba(255,255,255,0.03)', borderRadius: 28, border: '1px solid rgba(255,255,255,0.06)' },
    bookBtn: { display: 'inline-block', marginTop: '1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', padding: '12px 28px', borderRadius: 14, textDecoration: 'none', fontWeight: 800 },

    list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    card: { background: 'rgba(255,255,255,0.04)', borderRadius: 22, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' },
    cardTop: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' },
    tokenBadge: { width: 46, height: 46, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, flexShrink: 0 },
    apptInfo: { flex: 1 },
    docName: { color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' },
    apptDate: { color: '#64748b', fontSize: '0.82rem', marginTop: 3 },
    statusTag: { padding: '4px 14px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 },

    feedbackDisplay: { padding: '1rem 1.5rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' },
    feedComment: { color: '#cbd5e1', fontSize: '0.95rem', margin: '0.75rem 0', lineHeight: 1.6 },
    feedActions: { display: 'flex', gap: '0.5rem' },
    editBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' },
    deleteBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' },

    adminReplyBox: { marginTop: '0.75rem' },
    adminReplyToggle: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.08)', color: '#10b981', border: 'none', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' },
    adminReplyText: { padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 10px 10px', overflow: 'hidden' },

    feedForm: { padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' },
    formRow: { marginBottom: '1rem' },
    label: { display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
    textarea: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#f8fafc', fontSize: '0.95rem', outline: 'none', resize: 'vertical', minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box' },
    submitBtn: { display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 22px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem' },
    cancelBtn: { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' },

    addFeedbackBtn: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'rgba(251,191,36,0.06)', border: '1px dashed rgba(251,191,36,0.25)', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#fbbf24', padding: '1rem 1.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' },

    successOverlay: { position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 22 },
    successContent: { textAlign: 'center', color: '#fff' },
    successIcon: { width: 64, height: 64, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' },
    successTitle: { fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' },
    successSubtitle: { color: '#94a3b8', fontSize: '0.9rem' }
};
