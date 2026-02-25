import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Calendar, Activity, Bell, Plus, Stethoscope,
    User, History, CreditCard, Phone, LogOut, ChevronRight,
    CheckCircle, AlertCircle, Clock, Star, FileText
} from 'lucide-react';
import api from '../services/api';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await api.get('/api/patients/dashboard');
                setData(response.data);
            } catch (err) {
                setError('Failed to load dashboard data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorMessage message={error} />;

    const { patient, appointments, announcements, stats } = data;

    const quickActions = [
        { icon: <Stethoscope size={20} />, label: 'Check Symptoms', color: '#6366f1', link: '/ai/symptoms' },
        { icon: <Plus size={20} />, label: 'Book Appointment', color: '#10b981', link: '/appointments/add' },
        { icon: <User size={20} />, label: 'Update Profile', color: '#3b82f6', link: '/patients/profile' },
        { icon: <History size={20} />, label: 'Medical Records', color: '#10b981', link: `/medical-records/patient/${patient?.id}` },
        { icon: <Activity size={20} />, label: 'Vital Trends', color: '#f43f5e', link: `/vitals/patient/${patient?.id}` },
        { icon: <Star size={20} />, label: 'My Feedback', color: '#8b5cf6', link: '/feedback/my-feedbacks' },
        { icon: <Phone size={20} />, label: 'Emergency Contact', color: '#ef4444', link: '#' },
    ];

    return (
        <div style={styles.container}>
            <div style={styles.content}>

                {/* Header */}
                <header style={styles.header}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 style={styles.title}>
                            Welcome Back, {patient?.name || 'Patient'}
                        </h1>
                        <p style={styles.subtitle}>Your health journey at a glance.</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={styles.headerActions}>
                        <a href="/logout" style={styles.logoutBtn}>
                            <LogOut size={18} />
                            <span>Logout</span>
                        </a>
                    </motion.div>
                </header>

                {/* Announcements */}
                <AnimatePresence>
                    {announcements && announcements.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={styles.announcementsGrid}>
                            {announcements.map((ann, idx) => (
                                <AnnouncementItem key={ann.id} announcement={ann} index={idx} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats Grid */}
                <motion.div style={styles.statsGrid} layout>
                    <StatCard title="Total Visits" value={stats.totalAppointments} icon={<Calendar color="#3b82f6" />} color="blue" delay={0.1} />
                    <StatCard title="Pending Payments" value={stats.pendingPayments} icon={<CreditCard color="#f59e0b" />} color="amber" delay={0.2} />
                    <StatCard title="Active Alerts" value={stats.activeAnnouncements} icon={<Bell color="#ef4444" />} color="red" delay={0.3} />
                </motion.div>

                <div style={styles.mainGrid}>
                    {/* Main Dashboard - Appointments */}
                    <div style={styles.appointmentsCol}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h3 style={styles.cardTitle}>
                                    <Clock color="#10b981" /> My Appointments
                                </h3>
                            </div>
                            <div style={styles.list}>
                                {appointments && appointments.length > 0 ? (
                                    appointments.map((appt, idx) => (
                                        <AppointmentRow key={appt.id} appt={appt} index={idx} />
                                    ))
                                ) : (
                                    <div style={styles.emptyState}>
                                        <div style={styles.emptyIconWrap}>
                                            <Calendar color="#475569" />
                                        </div>
                                        <p style={styles.emptyText}>No scheduled appointments found.</p>
                                        <a href="/appointments/add" style={styles.emptyLink}>Book one today →</a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick Actions Sidebar */}
                    <div style={styles.sidebarCol}>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={styles.cardPadded}>
                            <h3 style={styles.cardTitleSpaced}>
                                <ChevronRight color="#3b82f6" /> Quick Actions
                            </h3>
                            <div style={styles.quickActionsGrid}>
                                {quickActions.map((action, idx) => (
                                    <motion.div key={idx} onClick={() => action.link.startsWith('/') ? navigate(action.link) : window.location.href = action.link} whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }} style={{ ...styles.actionBtn, cursor: 'pointer' }}>
                                        <div style={{ ...styles.actionIcon, backgroundColor: action.color }}>
                                            {action.icon}
                                        </div>
                                        <span style={styles.actionLabel}>{action.label}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* AI Assistant Promo */}
                        <motion.div whileHover={{ scale: 1.02 }} style={styles.promoCard}>
                            <div style={styles.promoIconBg}>
                                <Stethoscope size={160} color="rgba(255,255,255,0.1)" />
                            </div>
                            <h4 style={styles.promoTitle}>AI Symptom Checker</h4>
                            <p style={styles.promoDesc}>Unsure about your symptoms? Our AI can guide you to the right care.</p>
                            <a href="/ai/symptoms" style={styles.promoBtn}>
                                Try Now <ChevronRight size={18} />
                            </a>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, delay }) => {
    const styleMap = {
        blue: { background: 'linear-gradient(to bottom, rgba(59,130,246,0.1), transparent)', borderColor: 'rgba(59,130,246,0.2)' },
        amber: { background: 'linear-gradient(to bottom, rgba(245,158,11,0.1), transparent)', borderColor: 'rgba(245,158,11,0.2)' },
        red: { background: 'linear-gradient(to bottom, rgba(239,68,68,0.1), transparent)', borderColor: 'rgba(239,68,68,0.2)' },
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ y: -5 }} style={{ ...styles.statCard, ...styleMap[color] }}>
            <div style={styles.statIconWrap}>{icon}</div>
            <div style={styles.statValue}>{value}</div>
            <div style={styles.statLabel}>{title}</div>
        </motion.div>
    );
};

const AnnouncementItem = ({ announcement, index }) => {
    const typeMap = {
        ALERT: { icon: <AlertCircle color="#f87171" />, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
        EVENT: { icon: <Calendar color="#34d399" />, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
        INFO: { icon: <Bell color="#60a5fa" />, bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    };

    const style = typeMap[announcement.type] || typeMap.INFO;

    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} style={{ ...styles.annItem, backgroundColor: style.bg, borderColor: style.border }}>
            <div style={styles.annIcon}>{style.icon}</div>
            <div style={{ flex: 1 }}>
                <h5 style={styles.annTitle}>{announcement.title}</h5>
                <p style={styles.annContent}>{announcement.content}</p>
            </div>
        </motion.div>
    );
};

const AppointmentRow = ({ appt, index }) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + (index * 0.05) }} style={styles.apptRow}>
            <div style={styles.apptDetails}>
                <div style={styles.apptMain}>
                    <div style={{ marginTop: 4 }}>
                        {appt.status === 'COMPLETED' ? <CheckCircle color="#10b981" size={24} /> : <Clock color="#3b82f6" size={24} />}
                    </div>
                    <div>
                        <h4 style={styles.apptDoctor}>{appt.doctorName}</h4>
                        <div style={styles.apptMeta}>
                            <span style={styles.apptMetaItem}><Calendar size={14} /> {appt.dateTime}</span>
                            <span style={styles.apptToken}>TOKEN #{appt.tokenNumber}</span>
                        </div>
                        {appt.notes && <p style={styles.apptNotes}>&quot;{appt.notes}&quot;</p>}
                    </div>
                </div>

                <div style={styles.apptActionsWrap}>
                    <div style={styles.apptStatusWrap}>
                        <span style={{ ...styles.badge, backgroundColor: appt.paid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: appt.paid ? '#34d399' : '#f59e0b' }}>
                            {appt.paid ? 'PAID' : 'UNPAID'}
                        </span>
                        <span style={styles.apptStatusText}>{appt.status}</span>
                    </div>

                    <div style={styles.actionBtnRow}>
                        {appt.status === 'COMPLETED' && !appt.hasFeedback && (
                            <ActionLink href={`/feedback/add/${appt.id}`} icon={<Star size={16} />} label="Rate" color="blue" />
                        )}
                        <ActionLink href={`/finance/bill/${appt.id}`} icon={<FileText size={16} />} label="Bill" color="slate" />
                        {!appt.paid && (
                            <ActionLink href={`/payment/checkout?appointmentId=${appt.id}`} icon={<CreditCard size={16} />} label="Pay Now" color="emerald" primary />
                        )}
                        {(appt.status === 'PENDING' || appt.status === 'SCHEDULED') && (
                            <ActionLink href={`/appointments/patient/edit/${appt.id}`} icon={<FileText size={16} />} label="Edit" color="blue" />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ActionLink = ({ href, icon, label, color, primary }) => {
    const navigate = useNavigate();
    const isInternal = href.startsWith('/feedback') || href.startsWith('/patients') || href.startsWith('/appointments/add');
    const colors = {
        blue: { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.2)', hover: '#3b82f6' },
        emerald: { background: 'rgba(16,185,129,0.1)', color: '#34d399', borderColor: 'rgba(16,185,129,0.2)', hover: '#10b981' },
        slate: { background: 'rgba(71,85,105,0.5)', color: '#cbd5e1', borderColor: 'rgba(71,85,105,0.5)', hover: '#475569' },
    };

    const c = colors[color] || colors.slate;
    const style = { ...styles.actionLink, ...c, ...(primary ? styles.actionLinkPrimary : {}), cursor: 'pointer' };

    const handleClick = (e) => {
        if (isInternal) {
            e.preventDefault();
            navigate(href);
        }
    };

    if (isInternal) {
        return (
            <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClick}
                style={{ ...style, background: c.background, border: `1px solid ${c.borderColor}` }}
            >
                {icon}
                <span>{label}</span>
            </motion.button>
        );
    }

    return (
        <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={href} style={style}>
            {icon}
            <span>{label}</span>
        </motion.a>
    );
};

const LoadingSkeleton = () => (
    <div style={{ ...styles.container, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        <div style={styles.content}>
            <div style={{ height: 40, backgroundColor: '#0f172a', borderRadius: 12, width: 250, marginBottom: 32 }} />
            <div style={styles.statsGrid}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 120, backgroundColor: '#0f172a', borderRadius: 24 }} />)}
            </div>
            <div style={styles.mainGrid}>
                <div style={{ ...styles.appointmentsCol, height: 400, backgroundColor: '#0f172a', borderRadius: 24 }} />
                <div style={{ ...styles.sidebarCol, height: 400, backgroundColor: '#0f172a', borderRadius: 24 }} />
            </div>
        </div>
    </div>
);

const ErrorMessage = ({ message }) => (
    <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={styles.errorCard}>
            <AlertCircle color="#ef4444" size={48} style={{ marginBottom: 16 }} />
            <h3 style={styles.errorTitle}>Oops!</h3>
            <p style={styles.errorText}>{message}</p>
            <button onClick={() => window.location.reload()} style={styles.errorBtn}>Retry</button>
        </div>
    </div>
);

const styles = {
    container: { minHeight: '100vh', background: 'radial-gradient(circle at top right, #1e293b, #0f172a)', color: '#f1f5f9', padding: '32px 24px', fontFamily: "'Inter', sans-serif" },
    content: { maxWidth: '1280px', margin: '0 auto' },
    header: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: 16 },
    title: { fontSize: '1.875rem', fontWeight: '700', background: 'linear-gradient(to right, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
    subtitle: { color: '#94a3b8', marginTop: 4, fontSize: '1rem' },
    headerActions: { display: 'flex', gap: 12 },
    logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(30,41,59,0.5)', color: '#cbd5e1', padding: '8px 16px', borderRadius: '12px', textDecoration: 'none', border: '1px solid rgba(51,65,85,0.5)', transition: 'all 0.3s' },
    announcementsGrid: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 },
    annItem: { display: 'flex', alignItems: 'start', gap: 16, padding: 16, borderRadius: 16, border: '1px solid', backdropFilter: 'blur(8px)' },
    annIcon: { flexShrink: 0, marginTop: 4 },
    annTitle: { fontWeight: '700', color: '#f1f5f9', margin: 0, fontSize: '1rem' },
    annContent: { color: '#94a3b8', margin: 0, fontSize: '0.875rem' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 },
    statCard: { padding: 24, borderRadius: 24, border: '1px solid', backdropFilter: 'blur(4px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', transition: 'transform 0.3s' },
    statIconWrap: { padding: 8, background: 'rgba(30,41,59,0.5)', borderRadius: 8, display: 'inline-block', marginBottom: 8 },
    statValue: { fontSize: '1.875rem', fontWeight: '800', color: '#f8fafc' },
    statLabel: { color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' },
    mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 },
    appointmentsCol: { gridColumn: 'span 2' },
    sidebarCol: { display: 'flex', flexDirection: 'column', gap: 24 },
    card: { background: 'rgba(15,23,42,0.5)', border: '1px solid #1e293b', borderRadius: 24, overflow: 'hidden', backdropFilter: 'blur(12px)' },
    cardPadded: { background: 'rgba(15,23,42,0.5)', border: '1px solid #1e293b', borderRadius: 24, padding: 24, backdropFilter: 'blur(12px)' },
    cardHeader: { padding: '24px', borderBottom: '1px solid #1e293b' },
    cardTitle: { fontSize: '1.25rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
    cardTitleSpaced: { fontSize: '1.25rem', fontWeight: '700', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 },
    list: { display: 'flex', flexDirection: 'column' },
    apptRow: { padding: 24, borderBottom: '1px solid #1e293b', transition: 'background 0.3s' },
    apptDetails: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 },
    apptMain: { display: 'flex', alignItems: 'start', gap: 16 },
    apptDoctor: { fontSize: '1.125rem', fontWeight: '700', color: '#f1f5f9', margin: 0, textTransform: 'uppercase' },
    apptMeta: { display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.875rem', color: '#94a3b8', marginTop: 4 },
    apptMetaItem: { display: 'flex', alignItems: 'center', gap: 4 },
    apptToken: { background: '#1e293b', color: '#cbd5e1', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
    apptNotes: { marginTop: 8, color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' },
    apptActionsWrap: { display: 'flex', alignItems: 'center', gap: 12 },
    apptStatusWrap: { display: 'flex', flexDirection: 'column', alignItems: 'end', marginRight: 16 },
    badge: { fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px' },
    apptStatusText: { color: '#64748b', fontSize: '0.75rem', marginTop: 4 },
    actionBtnRow: { display: 'flex', gap: 8 },
    actionLink: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none', border: '1px solid', transition: 'all 0.2s' },
    actionLinkPrimary: { boxShadow: '0 0 10px rgba(16,185,129,0.3)', border: '1px solid #10b981' },
    quickActionsGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
    actionBtn: { display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(51,65,85,0.5)', textDecoration: 'none', color: '#cbd5e1', transition: 'all 0.3s' },
    actionIcon: { padding: 12, borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
    actionLabel: { fontWeight: '500', transition: 'color 0.2s' },
    promoCard: { position: 'relative', overflow: 'hidden', padding: 24, borderRadius: 24, background: 'linear-gradient(to bottom right, #4f46e5, #7c3aed)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
    promoIconBg: { position: 'absolute', right: -16, bottom: -16 },
    promoTitle: { fontSize: '1.25rem', fontWeight: '700', marginBottom: 8, color: '#fff' },
    promoDesc: { color: 'rgba(238,242,255,0.8)', fontSize: '0.875rem', marginBottom: 16 },
    promoBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#4338ca', padding: '8px 20px', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', transition: 'background 0.2s' },
    emptyState: { padding: '48px 0', textAlign: 'center' },
    emptyIconWrap: { width: 64, height: 64, background: 'rgba(30,41,59,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
    emptyText: { color: '#64748b', margin: 0 },
    emptyLink: { color: '#60a5fa', fontWeight: '500', textDecoration: 'none', marginTop: 8, display: 'inline-block' },
    errorCard: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: 32, borderRadius: 24, textAlign: 'center', maxWidth: 400 },
    errorTitle: { fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9', marginBottom: 8 },
    errorText: { color: '#94a3b8', marginBottom: 24 },
    errorBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' },
};

export default PatientDashboard;
