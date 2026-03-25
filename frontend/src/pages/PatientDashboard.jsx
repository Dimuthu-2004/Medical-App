import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Calendar, Activity, Bell, Plus, Stethoscope,
    User, History, CreditCard, Phone, LogOut, ChevronRight,
    CheckCircle, AlertCircle, Clock, Star, FileText, Upload
} from 'lucide-react';
import api from '../services/api';

const playNotificationTone = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.22);
        setTimeout(() => {
            try { ctx.close(); } catch (_) { /* noop */ }
        }, 300);
    } catch (_) {
        // Some browsers block autoplay audio contexts; ignore silently.
    }
};

const formatRelativeTime = (isoTs) => {
    if (!isoTs) return 'Just now';
    const dt = new Date(isoTs);
    if (Number.isNaN(dt.getTime())) return 'Just now';
    const diffSec = Math.max(1, Math.floor((Date.now() - dt.getTime()) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    return dt.toLocaleDateString();
};

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const prevUnreadRef = useRef(0);
    const initializedNotificationsRef = useRef(false);

    useEffect(() => {
        let mounted = true;

        const fetchDashboard = async () => {
            try {
                const response = await api.get('/api/patients/dashboard');
                // If Spring Security redirected an unauthenticated XHR to /login, Axios will
                // happily hand us HTML. Treat that as "not logged in" and bounce to /login.
                if (typeof response.data !== 'object' || response.data === null) {
                    navigate('/login?error');
                    return;
                }
                if (mounted) {
                    setData(response.data);
                }
            } catch (err) {
                if (err?.response?.status === 401) {
                    navigate('/login?error');
                    return;
                }
                if (err?.response?.status === 403) {
                    try {
                        const authResp = await api.get('/api/auth/user');
                        const role = authResp?.data?.role || 'UNKNOWN';
                        setError(`Access denied for role ${role}. Google login is patient-only in this flow.`);
                    } catch (_) {
                        setError('Access denied (403) while loading patient dashboard.');
                    }
                } else if (err?.response?.status >= 500) {
                    setError('Server error while loading dashboard. Please try again.');
                } else {
                    setError('Failed to load dashboard data. Please try again.');
                }
                console.error(err);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        const fetchNotifications = async ({ silent = false } = {}) => {
            if (!silent && mounted) {
                setNotificationLoading(true);
            }
            try {
                const res = await api.get('/api/patients/notifications?limit=25');
                const items = Array.isArray(res?.data?.items) ? res.data.items : [];
                const unread = Number.isFinite(res?.data?.unreadCount) ? res.data.unreadCount : 0;

                if (!mounted) return;

                if (initializedNotificationsRef.current && unread > prevUnreadRef.current) {
                    playNotificationTone();
                }
                initializedNotificationsRef.current = true;
                prevUnreadRef.current = unread;
                setNotifications(items);
                setUnreadCount(unread);
            } catch (err) {
                if (!silent) {
                    console.error('Failed to load notifications', err);
                }
            } finally {
                if (!silent && mounted) {
                    setNotificationLoading(false);
                }
            }
        };

        fetchDashboard();
        fetchNotifications();

        const poll = setInterval(() => {
            fetchNotifications({ silent: true });
        }, 20000);

        return () => {
            mounted = false;
            clearInterval(poll);
        };
    }, []);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorMessage message={error} />;

    const { patient, appointments, announcements, stats } = data || {};

    if (!patient || !stats) {
        return (
            <ErrorMessage
                message={`Profile incomplete or missing for account: ${data?.username || 'Unknown'}`}
                secondary={`Hint: You might be logged in as a non-patient (e.g., Admin). Try registering a fresh face account!`}
            />
        );
    }

    const markNotificationAsRead = async (notificationId) => {
        try {
            await api.post(`/api/patients/notifications/${notificationId}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const markAllNotificationsAsRead = async () => {
        try {
            await api.post('/api/patients/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() })));
            setUnreadCount(0);
            prevUnreadRef.current = 0;
        } catch (err) {
            console.error('Failed to mark all notifications as read', err);
        }
    };

    const quickActions = [
        { icon: <Stethoscope size={20} />, label: 'Check Symptoms', color: '#6366f1', link: '/ai/symptoms' },
        { icon: <Plus size={20} />, label: 'Book Appointment', color: '#10b981', link: '/appointments/add' },
        { icon: <User size={20} />, label: 'Update Profile', color: '#3b82f6', link: '/patients/profile' },
        { icon: <History size={20} />, label: 'Medical Records', color: '#10b981', link: `/medical-records/patient/${patient?.id}` },
        { icon: <Activity size={20} />, label: 'Vital Trends', color: '#f43f5e', link: `/vitals/patient/${patient?.id}` },
        { icon: <Upload size={20} />, label: 'Prescription OCR', color: '#0ea5e9', link: '/patients/prescription-ocr' },
        { icon: <FileText size={20} />, label: 'My Prescriptions', color: '#0f766e', link: '/patients/prescriptions' },
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
                        <div style={styles.notificationBellWrap}>
                            <button
                                type="button"
                                onClick={() => setNotificationOpen((open) => !open)}
                                style={styles.notificationBellBtn}
                            >
                                <Bell size={18} />
                                <span>Notifications</span>
                                {unreadCount > 0 && <span style={styles.unreadBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
                            </button>

                            <AnimatePresence>
                                {notificationOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        style={styles.notificationDropdown}
                                    >
                                        <div style={styles.notificationDropdownHeader}>
                                            <h4 style={styles.notificationDropdownTitle}>Notification Center</h4>
                                            {unreadCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={markAllNotificationsAsRead}
                                                    style={styles.markAllBtn}
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        {notificationLoading ? (
                                            <p style={styles.notificationHint}>Loading...</p>
                                        ) : notifications.length === 0 ? (
                                            <p style={styles.notificationHint}>No notifications yet.</p>
                                        ) : (
                                            <div style={styles.notificationDropdownList}>
                                                {notifications.slice(0, 6).map((n) => (
                                                    <button
                                                        key={n.id}
                                                        type="button"
                                                        onClick={() => markNotificationAsRead(n.id)}
                                                        style={{
                                                            ...styles.notificationDropdownItem,
                                                            ...(n.isRead ? styles.notificationRead : styles.notificationUnread)
                                                        }}
                                                    >
                                                        <div style={styles.notificationItemTop}>
                                                            <span style={styles.notificationItemTitle}>{n.title}</span>
                                                            <span style={styles.notificationItemTime}>{formatRelativeTime(n.createdAt)}</span>
                                                        </div>
                                                        <p style={styles.notificationItemMessage}>{n.message}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

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
                            <div style={styles.notificationSectionHeader}>
                                <h3 style={styles.cardTitleSpaced}>
                                    <Bell color="#f59e0b" /> Notifications
                                </h3>
                                {unreadCount > 0 && <span style={styles.inlineUnreadBadge}>{unreadCount} unread</span>}
                            </div>
                            <div style={styles.notificationSectionList}>
                                {notifications.length === 0 ? (
                                    <p style={styles.notificationHint}>No notifications yet.</p>
                                ) : (
                                    notifications.slice(0, 5).map((n) => (
                                        <button
                                            key={n.id}
                                            type="button"
                                            onClick={() => markNotificationAsRead(n.id)}
                                            style={{
                                                ...styles.notificationCardItem,
                                                ...(n.isRead ? styles.notificationRead : styles.notificationUnread)
                                            }}
                                        >
                                            <div style={styles.notificationItemTop}>
                                                <span style={styles.notificationItemTitle}>{n.title}</span>
                                                <span style={styles.notificationItemTime}>{formatRelativeTime(n.createdAt)}</span>
                                            </div>
                                            <p style={styles.notificationItemMessage}>{n.message}</p>
                                        </button>
                                    ))
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button type="button" onClick={markAllNotificationsAsRead} style={styles.markAllWideBtn}>
                                    Mark All As Read
                                </button>
                            )}
                        </motion.div>

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
    const paymentAmountLkr = Number(appt?.paymentAmount ?? 0);
    const amountLabel = `LKR ${paymentAmountLkr.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

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
                        <span style={styles.apptAmountText}>{amountLabel}</span>
                    </div>

                    <div style={styles.actionBtnRow}>
                        {appt.status === 'COMPLETED' && !appt.hasFeedback && (
                            <ActionLink href={`/feedback/add/${appt.id}`} icon={<Star size={16} />} label="Rate" color="blue" />
                        )}
                        <ActionLink href={`/finance/bill/${appt.id}`} icon={<FileText size={16} />} label="Bill" color="slate" />
                        {!appt.paid && (
                            <ActionLink
                                href={`/payment/checkout?appointmentId=${appt.id}`}
                                icon={<CreditCard size={16} />}
                                label="Pay Now"
                                color="emerald"
                                primary
                            />
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
    const isInternal = href.startsWith('/feedback') ||
        href.startsWith('/patients') ||
        href.startsWith('/appointments') ||
        href.startsWith('/finance') ||
        href.startsWith('/payment');
    const colors = {
        blue: { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.2)', hover: '#3b82f6' },
        emerald: { background: 'rgba(16,185,129,0.1)', color: '#34d399', borderColor: 'rgba(16,185,129,0.2)', hover: '#10b981' },
        slate: { background: 'rgba(2,132,199,0.12)', color: '#0369a1', borderColor: 'rgba(2,132,199,0.28)', hover: '#0284c7' },
    };

    const c = colors[color] || colors.slate;
    const style = { ...styles.actionLink, ...c, ...(primary ? styles.actionLinkPrimary : {}), cursor: 'pointer' };
    const internalStyle = primary
        ? { ...style, background: c.hover, border: `1px solid ${c.hover}`, color: '#ffffff' }
        : { ...style, background: c.background, border: `1px solid ${c.borderColor}` };
    const externalStyle = primary
        ? { ...style, background: c.hover, border: `1px solid ${c.hover}`, color: '#ffffff' }
        : style;

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
                style={internalStyle}
            >
                {icon}
                <span>{label}</span>
            </motion.button>
        );
    }

    return (
        <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={href} style={externalStyle}>
            {icon}
            <span>{label}</span>
        </motion.a>
    );
};

const LoadingSkeleton = () => (
    <div style={{ ...styles.container, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        <div style={styles.content}>
        <div style={{ height: 40, backgroundColor: 'var(--app-skeleton)', borderRadius: 12, width: 250, marginBottom: 32 }} />
            <div style={styles.statsGrid}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 120, backgroundColor: 'var(--app-skeleton)', borderRadius: 24 }} />)}
            </div>
            <div style={styles.mainGrid}>
            <div style={{ ...styles.appointmentsCol, height: 400, backgroundColor: 'var(--app-skeleton)', borderRadius: 24 }} />
            <div style={{ ...styles.sidebarCol, height: 400, backgroundColor: 'var(--app-skeleton)', borderRadius: 24 }} />
            </div>
        </div>
    </div>
);

const ErrorMessage = ({ message, secondary }) => (
    <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={styles.errorCard}>
            <AlertCircle color="#ef4444" size={48} style={{ marginBottom: 16 }} />
            <h3 style={styles.errorTitle}>Oops!</h3>
            <p style={styles.errorText}>{message}</p>
            {secondary && <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>{secondary}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => window.location.reload()} style={styles.errorBtn}>Retry</button>
                <button onClick={() => window.location.href = '/logout'} style={{ ...styles.errorBtn, background: '#64748b' }}>Logout</button>
            </div>
        </div>
    </div>
);

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eaf3ff 0%, #f3f8ff 52%, #f8fbff 100%)',
        color: '#1e293b',
        padding: '32px 24px',
        fontFamily: "'Inter', sans-serif"
    },
    content: { maxWidth: '1280px', margin: '0 auto' },
    header: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: 16 },
    title: { fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: 0 },
    subtitle: { color: '#64748b', marginTop: 4, fontSize: '1rem' },
    headerActions: { display: 'flex', gap: 12, position: 'relative' },
    notificationBellWrap: { position: 'relative' },
    notificationBellBtn: { position: 'relative', display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', color: '#0f172a', padding: '8px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600 },
    unreadBadge: { position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', borderRadius: 999, minWidth: 20, height: 20, padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, border: '2px solid #fff' },
    notificationDropdown: { position: 'absolute', right: 0, top: 46, width: 360, maxWidth: '86vw', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 20px 35px rgba(15,23,42,0.16)', zIndex: 20, padding: 12 },
    notificationDropdownHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' },
    notificationDropdownTitle: { margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' },
    notificationDropdownList: { maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10 },
    notificationDropdownItem: { width: '100%', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 12, padding: 10, textAlign: 'left', cursor: 'pointer' },
    notificationCardItem: { width: '100%', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 12, padding: 10, textAlign: 'left', cursor: 'pointer' },
    notificationRead: { background: '#f8fafc', borderColor: '#e2e8f0' },
    notificationUnread: { background: 'rgba(14,165,233,0.08)', borderColor: 'rgba(14,165,233,0.24)' },
    notificationItemTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
    notificationItemTitle: { fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' },
    notificationItemTime: { color: '#64748b', fontSize: '0.74rem', whiteSpace: 'nowrap' },
    notificationItemMessage: { margin: 0, color: '#334155', fontSize: '0.8rem', lineHeight: 1.45 },
    notificationHint: { margin: 0, color: '#64748b', fontSize: '0.84rem', padding: '12px 4px' },
    markAllBtn: { border: 'none', background: 'transparent', color: '#2563eb', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },
    markAllWideBtn: { marginTop: 10, width: '100%', border: '1px solid #bfdbfe', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, padding: '8px 12px', cursor: 'pointer' },
    notificationSectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    inlineUnreadBadge: { background: '#fee2e2', color: '#b91c1c', borderRadius: 999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 },
    notificationSectionList: { display: 'flex', flexDirection: 'column', gap: 10 },
    logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', color: '#ef4444', padding: '8px 16px', borderRadius: '12px', textDecoration: 'none', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.3s' },
    announcementsGrid: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 },
    annItem: { display: 'flex', alignItems: 'start', gap: 16, padding: 16, borderRadius: 16, border: '1px solid', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    annIcon: { flexShrink: 0, marginTop: 4 },
    annTitle: { fontWeight: '700', color: '#1e293b', margin: 0, fontSize: '1rem' },
    annContent: { color: '#64748b', margin: 0, fontSize: '0.875rem' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 },
    statCard: { padding: 24, borderRadius: 24, border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', transition: 'transform 0.3s' },
    statIconWrap: { padding: 8, background: '#f1f5f9', borderRadius: 8, display: 'inline-block', marginBottom: 8 },
    statValue: { fontSize: '1.875rem', fontWeight: '800', color: '#0f172a' },
    statLabel: { color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
    mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 },
    appointmentsCol: { gridColumn: 'span 2' },
    sidebarCol: { display: 'flex', flexDirection: 'column', gap: 24 },
    card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' },
    cardPadded: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 24, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' },
    cardHeader: { padding: '24px', borderBottom: '1px solid #e2e8f0' },
    cardTitle: { fontSize: '1.25rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
    cardTitleSpaced: { fontSize: '1.25rem', fontWeight: '700', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 },
    list: { display: 'flex', flexDirection: 'column' },
    apptRow: { padding: 24, borderBottom: '1px solid #f1f5f9', transition: 'background 0.3s' },
    apptDetails: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 },
    apptMain: { display: 'flex', alignItems: 'start', gap: 16 },
    apptDoctor: { fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: 0, textTransform: 'uppercase' },
    apptMeta: { display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.875rem', color: '#64748b', marginTop: 4 },
    apptMetaItem: { display: 'flex', alignItems: 'center', gap: 4 },
    apptToken: { background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
    apptNotes: { marginTop: 8, color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' },
    apptActionsWrap: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12 },
    apptStatusWrap: { display: 'flex', flexDirection: 'column', alignItems: 'end', marginRight: 16 },
    badge: { fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px' },
    apptStatusText: { color: '#64748b', fontSize: '0.75rem', marginTop: 4 },
    apptAmountText: { color: '#475569', fontSize: '0.75rem', fontWeight: '700', marginTop: 4 },
    actionBtnRow: { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
    actionLink: { display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none', transition: 'all 0.2s', background: '#f1f5f9', color: '#3b82f6', border: '1px solid #e2e8f0' },
    actionLinkPrimary: { background: '#10b981', color: '#ffffff', border: '1px solid #10b981', boxShadow: '0 4px 6px rgba(16,185,129,0.2)' },
    quickActionsGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
    actionBtn: { display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#1e293b', transition: 'all 0.3s' },
    actionIcon: { padding: 12, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: 'white' },
    actionLabel: { fontWeight: '600', transition: 'color 0.2s' },
    promoCard: { position: 'relative', overflow: 'hidden', padding: 24, borderRadius: 24, background: 'linear-gradient(to bottom right, #4f46e5, #7c3aed)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
    promoIconBg: { position: 'absolute', right: -16, bottom: -16 },
    promoTitle: { fontSize: '1.25rem', fontWeight: '700', marginBottom: 8, color: '#fff' },
    promoDesc: { color: 'rgba(238,242,255,0.8)', fontSize: '0.875rem', marginBottom: 16 },
    promoBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ffffff', color: '#4338ca', padding: '8px 20px', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', transition: 'background 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    emptyState: { padding: '48px 0', textAlign: 'center' },
    emptyIconWrap: { width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
    emptyText: { color: '#64748b', margin: 0 },
    emptyLink: { color: '#3b82f6', fontWeight: '600', textDecoration: 'none', marginTop: 8, display: 'inline-block' },
    errorCard: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: 32, borderRadius: 24, textAlign: 'center', maxWidth: 400 },
    errorTitle: { fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9', marginBottom: 8 },
    errorText: { color: '#94a3b8', marginBottom: 24 },
    errorBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' },
};

export default PatientDashboard;
