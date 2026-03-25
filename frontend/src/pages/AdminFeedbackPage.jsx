import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Star, ArrowLeft, Send, User, MessageCircle, Filter } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../services/api';
import AdminLayout from './AdminLayout';

const AdminFeedbackPage = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('all');
    const [sentimentFilter, setSentimentFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [query, setQuery] = useState('');

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
    }).filter(fb => {
        if (sentimentFilter === 'all') return true;
        return (fb.sentiment || 'NEUTRAL').toUpperCase() === sentimentFilter.toUpperCase();
    }).filter(fb => {
        if (ratingFilter === 'all') return true;
        return Number(fb.rating || 0) === Number(ratingFilter);
    }).filter(fb => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (fb.patientName || '').toLowerCase().includes(q)
            || (fb.doctorName || '').toLowerCase().includes(q)
            || (fb.comment || '').toLowerCase().includes(q);
    });

    const stats = useMemo(() => {
        const all = feedbacks || [];
        const total = all.length;
        const avgRating = total ? (all.reduce((s, x) => s + Number(x.rating || 0), 0) / total) : 0;
        const positive = all.filter((x) => (x.sentiment || 'NEUTRAL') === 'POSITIVE').length;
        const negative = all.filter((x) => (x.sentiment || 'NEUTRAL') === 'NEGATIVE').length;
        const neutral = all.filter((x) => (x.sentiment || 'NEUTRAL') === 'NEUTRAL').length;
        return { total, avgRating: Number(avgRating.toFixed(2)), positive, negative, neutral };
    }, [feedbacks]);

    const pieData = [
        { name: 'Positive', value: stats.positive },
        { name: 'Negative', value: stats.negative },
        { name: 'Neutral', value: stats.neutral },
    ];
    const barData = [1, 2, 3, 4, 5].map((r) => ({
        rating: `${r}★`,
        count: feedbacks.filter((f) => Number(f.rating || 0) === r).length
    }));

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
                        <select value={sentimentFilter} onChange={e => setSentimentFilter(e.target.value)} style={S.select}>
                            <option value="all">All Sentiments</option>
                            <option value="POSITIVE">Positive</option>
                            <option value="NEGATIVE">Negative</option>
                            <option value="NEUTRAL">Neutral</option>
                        </select>
                        <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={S.select}>
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                </header>

                <div style={S.statsGrid}>
                    <div style={S.statCard}><div style={S.statLabel}>Total Reviews</div><div style={S.statValue}>{stats.total}</div></div>
                    <div style={S.statCard}><div style={S.statLabel}>Average Rating</div><div style={S.statValue}>{stats.avgRating}</div></div>
                    <div style={S.statCard}><div style={S.statLabel}>Positive</div><div style={S.statValue}>{stats.positive}</div></div>
                    <div style={S.statCard}><div style={S.statLabel}>Negative</div><div style={S.statValue}>{stats.negative}</div></div>
                    <div style={S.statCard}><div style={S.statLabel}>Neutral</div><div style={S.statValue}>{stats.neutral}</div></div>
                </div>

                <div style={S.chartsGrid}>
                    <div style={S.chartCard}>
                        <div style={S.chartTitle}>Sentiment Distribution</div>
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ef4444" />
                                        <Cell fill="#94a3b8" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div style={S.chartCard}>
                        <div style={S.chartTitle}>Ratings Distribution</div>
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="rating" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search patient, doctor or text..."
                        style={S.searchInput}
                    />
                </div>

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
                                        <div style={{ marginTop: 8, display: 'inline-flex', padding: '5px 10px', borderRadius: 999, fontWeight: 800, fontSize: '0.75rem', background: fb.sentiment === 'POSITIVE' ? 'rgba(16,185,129,0.12)' : fb.sentiment === 'NEGATIVE' ? 'rgba(239,68,68,0.12)' : 'rgba(148,163,184,0.12)', color: fb.sentiment === 'POSITIVE' ? '#059669' : fb.sentiment === 'NEGATIVE' ? '#b91c1c' : '#475569' }}>
                                            {fb.sentiment || 'NEUTRAL'}
                                        </div>
                                    </div>

                                    {fb.adminReply ? (
                                        <div style={S.replyBox}>
                                            <div style={S.replyHeader}>Admin Response</div>
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
    wrapper: { maxWidth: '1000px', margin: '0 auto', padding: '1rem 0', fontFamily: 'Inter, system-ui, sans-serif' },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' },
    header: { marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    backBtn: { display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600, transition: 'color 0.2s' },
    title: { fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' },
    subtitle: { color: '#64748b', margin: '0.5rem 0 0' },
    filterBar: { display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '8px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' },
    select: { background: 'transparent', border: 'none', color: '#0f172a', fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer' },
    searchInput: { width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '11px 14px', color: '#0f172a', outline: 'none' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px', marginBottom: '14px' },
    statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 14px' },
    statLabel: { color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
    statValue: { color: '#0f172a', fontSize: '1.3rem', fontWeight: 900, marginTop: 4 },
    chartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' },
    chartCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '12px 12px 6px' },
    chartTitle: { fontWeight: 800, color: '#0f172a', marginBottom: 6 },
    grid: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    card: { background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2rem', transition: 'all 0.3s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
    userInfo: { display: 'flex', gap: '1rem', alignItems: 'center' },
    avatar: { width: '44px', height: '44px', background: '#dbeafe', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' },
    patientName: { color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' },
    doctorTag: { color: '#64748b', fontSize: '0.85rem' },
    rating: { display: 'flex', gap: 4 },
    content: { marginBottom: '1.5rem' },
    comment: { color: '#334155', fontSize: '1.1rem', margin: 0, fontStyle: 'italic', lineHeight: 1.6 },
    replyBox: { background: '#d1fae5', borderRadius: '16px', padding: '1.25rem', border: '1px solid #a7f3d0' },
    replyHeader: { color: '#059669', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
    replyText: { color: '#0f172a', fontSize: '0.95rem', margin: 0, fontWeight: 500 },
    actionRow: { marginTop: '1rem' },
    btnReply: { display: 'flex', alignItems: 'center', gap: 8, background: '#dbeafe', color: '#2563eb', border: '1px solid #bfdbfe', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' },
    replyForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    textarea: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', color: '#0f172a', fontSize: '1rem', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box', outlineColor: '#3b82f6' },
    formActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    btnSubmit: { display: 'flex', alignItems: 'center', gap: 8, background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, transition: 'all 0.2s' },
    btnCancel: { background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontWeight: 700 },
    emptyState: { textAlign: 'center', padding: '5rem 0', color: '#94a3b8' }
};

export default AdminFeedbackPage;
