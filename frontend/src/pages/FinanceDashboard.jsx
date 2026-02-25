import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    CheckCircle,
    Clock,
    TrendingUp,
    Download,
    Eye,
    Check,
    ArrowLeft,
    Search,
    Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from './AdminLayout';

const AnimatedCounter = ({ value, prefix = "", delay = 0 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            let start = 0;
            const end = parseInt(value) || 0;
            if (start === end) {
                setDisplayValue(end);
                return;
            }

            let totalMiliseconds = 1500;
            let incrementTime = (totalMiliseconds / end) * 5;

            let timerCounter = setInterval(() => {
                start += Math.ceil(end / 100);
                if (start >= end) {
                    setDisplayValue(end);
                    clearInterval(timerCounter);
                } else {
                    setDisplayValue(start);
                }
            }, 20);

            return () => clearInterval(timerCounter);
        }, delay * 1000);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5 }}
        >
            {prefix}{displayValue.toLocaleString()}
        </motion.div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, delay, isCurrency }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ y: -5, scale: 1.02 }}
        style={{ ...S.statCard, borderTop: `4px solid ${color}` }}
    >
        <div style={{ ...S.statIcon, backgroundColor: `${color}15`, color }}>
            <Icon size={24} />
        </div>
        <div>
            <div style={S.statLabel}>{label}</div>
            <div style={S.statValue}>
                {typeof value === 'number' ? (
                    <AnimatedCounter value={value} prefix={isCurrency ? "LKR " : ""} delay={delay + 0.3} />
                ) : (
                    value
                )}
            </div>
        </div>
    </motion.div>
);

const FinanceDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [apptRes, statsRes] = await Promise.all([
                api.get('/api/finance/appointments'),
                api.get('/api/finance/stats')
            ]);
            setAppointments(apptRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySlip = async (id) => {
        try {
            await api.post(`/api/finance/verify-slip?appointmentId=${id}`);
            fetchData();
        } catch (error) {
            alert('Error verifying slip');
        }
    };

    const handleUpdatePayment = async (id, amount, paid) => {
        try {
            await api.post('/api/finance/update-payment', { appointmentId: id, amount, paid });
            fetchData();
        } catch (error) {
            alert('Error updating payment');
        }
    };

    const filteredAppointments = appointments.filter(a => {
        const matchesSearch = a.patient.name.toLowerCase().includes(search.toLowerCase()) ||
            a.id.toString().includes(search);
        const matchesFilter = filter === 'ALL' ||
            (filter === 'PAID' && a.paid) ||
            (filter === 'PENDING' && !a.paid);
        return matchesSearch && matchesFilter;
    });

    if (loading) return (
        <AdminLayout>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                Loading Finance Data...
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div style={S.wrapper}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={S.header}
                >
                    <h1 style={S.title}>Finance Dashboard</h1>
                    <p style={S.subtitle}>Revenue oversight and payment verification</p>
                </motion.div>

                {/* Stats Grid */}
                <div style={S.statsGrid}>
                    <StatCard
                        icon={TrendingUp}
                        label="Total Revenue"
                        value={stats?.totalRevenue || 0}
                        color="#10b981"
                        delay={0.1}
                        isCurrency={true}
                    />
                    <StatCard
                        icon={Clock}
                        label="Pending Payments"
                        value={stats?.pendingPayments || 0}
                        color="#f59e0b"
                        delay={0.2}
                    />
                    <StatCard
                        icon={CreditCard}
                        label="Unverified Slips"
                        value={stats?.unverifiedSlips || 0}
                        color="#3b82f6"
                        delay={0.3}
                    />
                </div>

                {/* Main Content Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={S.mainCard}
                >
                    {/* Toolbar */}
                    <div style={S.toolbar}>
                        <div style={S.searchWrapper}>
                            <Search size={18} style={S.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search by patient or ID..."
                                style={S.searchInput}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div style={S.filterGroup}>
                            {['ALL', 'PENDING', 'PAID'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        ...S.filterTab,
                                        ...(filter === f ? S.filterTabActive : {})
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div style={S.tableWrapper}>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={S.th}>INV #</th>
                                    <th style={S.th}>PATIENT</th>
                                    <th style={S.th}>DATE</th>
                                    <th style={S.th}>AMOUNT (LKR)</th>
                                    <th style={S.th}>STATUS</th>
                                    <th style={S.th}>SLIP</th>
                                    <th style={S.th}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode='popLayout'>
                                    {filteredAppointments.map((appt, idx) => (
                                        <motion.tr
                                            key={appt.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={S.tr}
                                        >
                                            <td style={S.td}><span style={S.idBadge}>#{appt.id}</span></td>
                                            <td style={S.td}>
                                                <div style={S.patientCell}>
                                                    <div style={S.avatar}>{appt.patient.name[0]}</div>
                                                    {appt.patient.name}
                                                </div>
                                            </td>
                                            <td style={S.td}>
                                                <div style={S.dateCell}>{appt.appointmentDate || 'N/A'}</div>
                                            </td>
                                            <td style={S.td}>
                                                <input
                                                    type="number"
                                                    value={appt.paymentAmount || 0}
                                                    onChange={(e) => handleUpdatePayment(appt.id, e.target.value, appt.paid)}
                                                    style={S.amountInput}
                                                />
                                            </td>
                                            <td style={S.td}>
                                                <div
                                                    onClick={() => handleUpdatePayment(appt.id, appt.paymentAmount, !appt.paid)}
                                                    style={{
                                                        ...S.statusBadge,
                                                        backgroundColor: appt.paid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                        color: appt.paid ? '#10b981' : '#ef4444'
                                                    }}
                                                >
                                                    {appt.paid ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                    {appt.paid ? 'PAID' : 'PENDING'}
                                                </div>
                                            </td>
                                            <td style={S.td}>
                                                {appt.paymentSlipPath ? (
                                                    <div style={S.slipActions}>
                                                        <a
                                                            href={`/api/finance/slips/${appt.paymentSlipPath}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={S.iconBtn}
                                                            title="View Slip"
                                                        >
                                                            <Eye size={16} />
                                                        </a>
                                                        {!appt.paid && (
                                                            <button
                                                                onClick={() => handleVerifySlip(appt.id)}
                                                                style={{ ...S.iconBtn, color: '#10b981' }}
                                                                title="Verify Slip"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={S.noneText}>None</span>
                                                )}
                                            </td>
                                            <td style={S.td}>
                                                <a
                                                    href={`/finance/bill/download/${appt.id}`}
                                                    style={S.downloadBtn}
                                                >
                                                    <Download size={14} /> Bill
                                                </a>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
};

const LoadingSkeleton = () => (
    <div style={S.container}>
        <div style={S.wrapper}>
            <div style={{ height: 100, background: 'rgba(255,255,255,0.05)', borderRadius: 24, marginBottom: 30 }} className="skeleton-pulse" />
            <div style={S.statsGrid}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: 24 }} className="skeleton-pulse" />)}
            </div>
            <div style={{ height: 500, background: 'rgba(255,255,255,0.05)', borderRadius: 32 }} className="skeleton-pulse" />
        </div>
        <style>{`
            @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
            .skeleton-pulse { animation: pulse 1.5s infinite ease-in-out; }
        `}</style>
    </div>
);

const S = {
    layout: { minHeight: '100vh', background: 'radial-gradient(circle at top right, #1e293b, #0f172a)', padding: '1.5rem 2rem', fontFamily: 'Inter, system-ui, sans-serif', color: '#f8fafc' },
    wrapper: { maxWidth: '1200px', margin: '0 auto', padding: '1rem 0' },
    header: { marginBottom: '2rem' },
    title: { margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' },
    subtitle: { color: '#94a3b8', fontSize: '1.1rem', margin: '0.25rem 0 0' },

    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' },
    statCard: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'all 0.3s' },
    statIcon: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    statLabel: { color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
    statValue: { fontSize: '1.75rem', fontWeight: 800, marginTop: '2px', color: '#fff' },

    mainCard: { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', padding: '2rem' },

    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem', flexWrap: 'wrap' },
    searchWrapper: { position: 'relative', flex: 1, minWidth: '300px' },
    searchIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
    searchInput: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px 16px 12px 48px', color: '#fff', fontSize: '1rem', outline: 'none', transition: 'all 0.2s' },

    filterGroup: { display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' },
    filterTab: { padding: '8px 20px', borderRadius: '10px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' },
    filterTabActive: { background: 'rgba(37,99,235,0.2)', color: '#3b82f6', border: '1px solid rgba(37,99,235,0.3)' },

    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' },
    th: { textAlign: 'left', padding: '12px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' },
    tr: { background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' },
    td: { padding: '16px 20px', color: '#cbd5e1', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.03)' },

    idBadge: { background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' },
    patientCell: { display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, color: '#f1f5f9' },
    avatar: { width: '32px', height: '32px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'white', fontWeight: 800 },
    dateCell: { color: '#64748b', fontSize: '0.9rem' },

    amountInput: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 12px', color: '#fff', width: '120px', outline: 'none', textAlign: 'right', fontWeight: 700 },

    statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid currentColor' },

    slipActions: { display: 'flex', gap: '8px' },
    iconBtn: { width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' },

    downloadBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(16,185,129,0.2)' },
    noneText: { color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }
};

export default FinanceDashboard;
