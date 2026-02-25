import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Star, ArrowLeft, Send,
    CheckCircle, User, MessageCircle, Filter
} from 'lucide-react';
import api from '../services/api';
import AdminLayout from './AdminLayout';

const AdminFeedbackPage = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, replied

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const res = await api.get('/api/feedback/admin');
            setFeedbacks(res.data);
        } catch (e) {
            console.error('Error fetching feedbacks:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (id) => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            await api.post(`/api/feedback/admin/reply/${id}?reply=${encodeURIComponent(replyText)}`);
            setReplyingTo(null);
            setReplyText('');
            fetchFeedbacks();
        } catch (e) {
            alert('Failed to send reply');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredFeedbacks = feedbacks.filter(fb => {
        if (filter === 'pending') return !fb.adminReply;
        if (filter === 'replied') return !!fb.adminReply;
        return true;
    });

    if (loading) return (
        <AdminLayout>
            <div style={S.loading}>Loading Feedback...</div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div style={S.wrapper}>
                {/* Header */}
                <header style={S.header}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <a href="/admin/dashboard" style={S.backBtn}>
                            <ArrowLeft size={18} /> Back to Dashboard
                        </a>
                        <h1 style={S.title}>Feedback Management</h1>
                        <p style={S.subtitle}>Monitor and respond to patient satisfaction reviews</p>
                    </motion.div>

                    <div style={S.filterBar}>
                        <Filter size={18} color="#64748b" />
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            style={S.select}
                        >
                            <option value="all">All Reviews</option>
                            <option value="pending">Pending Reply</option>
                            <option value="replied">Replied</option>
                        </select>
                    </div>
                </header>

                <div style={S.grid}>
                    {filteredFeedbacks.length === 0 ? (
                        <div style={S.emptyState}>
                            <MessageSquare size={48} color="#475569" />
                            <p>No feedbacks found in this category.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredFeedbacks.map((fb, i) => (
                                <motion.div
                                    key={fb.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={S.card}
                                >
                                    <div style={S.cardHead}>
                                        <div style={S.userInfo}>
                                            <div style={S.avatar}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div style={S.patientName}>{fb.patientName}</div>
                                                <div style={S.doctorTag}>Consulted: {fb.doctorName}</div>
                                            </div>
                                        </div>
                                        <div style={S.rating}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    fill={i < fb.rating ? "#f59e0b" : "transparent"}
                                                    color={i < fb.rating ? "#f59e0b" : "#475569"}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div style={S.content}>
                                        <p style={S.comment}>"{fb.comment}"</p>
                                    </div>

                                    {fb.adminReply ? (
                                        <div style={S.replyBox}>
                                            <div style={S.replyHeader}>
                                                <CheckCircle size={14} color="#10b981" />
                                                Admin Response
                                            </div>
                                            <p style={S.replyText}>{fb.adminReply}</p>
                                        </div>
                                    ) : (
                                        <div style={S.actionRow}>
                                            {replyingTo === fb.id ? (
                                                <div style={S.replyForm}>
                                                    <textarea
                                                        value={replyText}
                                                        onChange={e => setReplyText(e.target.value)}
                                                        placeholder="Type your response..."
                                                        style={S.textarea}
                                                        autoFocus
                                                    />
                                                    <div style={S.formActions}>
                                                        <button
                                                            onClick={() => setReplyingTo(null)}
                                                            style={S.btnCancel}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleReply(fb.id)}
                                                            disabled={submitting || !replyText.trim()}
                                                            style={S.btnSubmit}
                                                        >
                                                            <Send size={14} /> {submitting ? 'Sending...' : 'Send Reply'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setReplyingTo(fb.id)}
                                                    style={S.btnReply}
                                                >
                                                    <MessageCircle size={16} /> Write a Response
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

const S = {
    wrapper: { maxWidth: '1000px', margin: '0 auto', padding: '1rem 0' },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' },
    header: { marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    backBtn: { display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600, transition: 'color 0.2s' },
    title: { fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.3)' },
    subtitle: { color: '#94a3b8', margin: '0.5rem 0 0' },
    filterBar: { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' },
    select: { background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer' },
    grid: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    card: { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', padding: '2rem', transition: 'all 0.3s' },
    cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
    userInfo: { display: 'flex', gap: '1rem', alignItems: 'center' },
    avatar: { width: '44px', height: '44px', background: 'rgba(59,130,246,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' },
    patientName: { color: '#f1f5f9', fontWeight: 800, fontSize: '1.1rem' },
    doctorTag: { color: '#64748b', fontSize: '0.85rem' },
    rating: { display: 'flex', gap: 4 },
    content: { marginBottom: '1.5rem' },
    comment: { color: '#cbd5e1', fontSize: '1.1rem', margin: 0, fontStyle: 'italic', lineHeight: 1.6 },
    replyBox: { background: 'rgba(16,185,129,0.05)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(16,185,129,0.1)' },
    replyHeader: { color: '#10b981', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
    replyText: { color: '#f1f5f9', fontSize: '0.95rem', margin: 0, fontWeight: 500 },
    actionRow: { marginTop: '1rem' },
    btnReply: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' },
    replyForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    textarea: { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', color: '#fff', fontSize: '1rem', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' },
    formActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    btnSubmit: { display: 'flex', alignItems: 'center', gap: 8, background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, transition: 'all 0.2s' },
    btnCancel: { background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontWeight: 700 },
    emptyState: { textAlign: 'center', padding: '5rem 0', color: '#64748b' }
};

export default AdminFeedbackPage;
