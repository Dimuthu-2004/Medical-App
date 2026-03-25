import { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Trash2, Activity, Shield, User, Users, Clipboard,
    Syringe, Landmark, Search, LogOut, AlertTriangle, UserCheck
} from 'lucide-react';
import api from '../services/api';
import AdminLayout from './AdminLayout';

/* ── Role helpers ─────────────────────────────────────────── */
const roleColor = (role) => ({
    ADMIN: { bg: '#fee2e2', color: '#ef4444', border: '#fecaca' },
    DOCTOR: { bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe' },
    PATIENT: { bg: '#d1fae5', color: '#059669', border: '#a7f3d0' },
    RECEPTIONIST: { bg: '#ede9fe', color: '#7c3aed', border: '#ddd6fe' },
    NURSE: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
    FINANCE_MANAGER: { bg: '#ffedd5', color: '#ea580c', border: '#fed7aa' },
    PHARMACIST: { bg: '#ecfeff', color: '#0891b2', border: '#a5f3fc' },
    LAB: { bg: '#ccfbf1', color: '#0d9488', border: '#99f6e4' },
    'LAB TECH': { bg: '#ccfbf1', color: '#0d9488', border: '#99f6e4' },
}[(role || '').toUpperCase()] || { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' });

const roleIcon = (role) => ({
    ADMIN: <Shield size={16} />,
    DOCTOR: <Activity size={16} />,
    PATIENT: <Landmark size={16} />,
    NURSE: <Syringe size={16} />,
    FINANCE_MANAGER: <Landmark size={16} />,
    PHARMACIST: <Clipboard size={16} />,
    LAB: <Activity size={16} />,
    'LAB TECH': <Activity size={16} />,
}[(role || '').toUpperCase()] || <User size={16} />);

const initials = (name) =>
    name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

const STAFF_ROLES = ['DOCTOR', 'NURSE', 'FINANCE_MANAGER', 'PHARMACIST', 'STAFF'];

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

/* ── Stat Card ───────────────────────────────────────────── */
function StatCard({ icon, label, value, color, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
            whileHover={{ y: -5, background: '#f8fafc' }}
            style={{ ...S.statCard, borderTop: `4px solid ${color}` }}
        >
            <motion.div
                style={{ ...S.statIcon, background: `${color}18`, color }}
            >
                <span style={{ fontSize: '1.6rem' }}>{icon}</span>
            </motion.div>
            <div>
                <div style={{ ...S.statValue, color: '#0f172a' }}>
                    <AnimatedCounter value={value} delay={delay + 0.3} />
                </div>
                <div style={S.statLabel}>{label}</div>
            </div>
        </motion.div>
    );
}

/* ── Availability Toggle Switch ──────────────────────────── */
function AvailabilitySwitch({ available, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={available ? 'Mark Unavailable' : 'Mark Available'}
            style={{
                width: 52, height: 28, borderRadius: 100, border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: available ? '#10b981' : '#e2e8f0',
                position: 'relative', transition: 'background 0.25s',
                flexShrink: 0, opacity: disabled ? 0.6 : 1,
                outline: 'none',
            }}
        >
            <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 4,
                left: available ? 28 : 4,
                transition: 'left 0.25s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }} />
        </button>
    );
}

/* ── Admin Dashboard ─────────────────────────────────────── */
export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async (q = '') => {
        setLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                api.get('/api/admin/stats'),
                api.get('/api/admin/users', { params: q ? { search: q } : {} }),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData(search);
    };

    const handleToggleAvailability = async (user) => {
        setToggling(true);
        const roleUpper = (user.role || '').toUpperCase();
        const endpoint = roleUpper.includes('DOCTOR')
            ? `/api/admin/doctors/${user.id}/availability`
            : `/api/admin/staff/${user.id}/availability`;
        try {
            await api.patch(endpoint, { available: !user.available });
            fetchData(search);
            showToast(`Status updated for ${user.name || user.username}`);
        } catch {
            showToast('Error toggling availability', 'error');
        } finally {
            setToggling(false);
        }
    };

    const handleDelete = async () => {
        if (!toDelete) return;
        setDeleting(true);
        try {
            await api.delete(`/api/admin/users/${toDelete.id}`);
            setUsers(prev => prev.filter(u => u.id !== toDelete.id));
            showToast(`✅ ${toDelete.username} deleted successfully`);
        } catch (err) {
            const msg = err?.response?.data?.error || err?.message || 'Delete failed';
            showToast(`❌ ${msg}`, 'error');
            console.error('Delete error:', err?.response?.data || err);
        } finally {
            setDeleting(false);
            setToDelete(null);
        }
    };

    const statCards = [
        { icon: <Users />, label: 'Total Users', color: '#3b82f6', key: 'totalUsers' },
        { icon: <Landmark />, label: 'Patients', color: '#10b981', key: 'totalPatients' },
        { icon: <Activity />, label: 'Doctors', color: '#8b5cf6', key: 'totalDoctors' },
        { icon: <Clipboard />, label: 'Staff Members', color: '#f59e0b', key: 'totalStaff' },
    ];

    const medicalUsers = users.filter(u => {
        const r = (u.role || '').toUpperCase();
        return STAFF_ROLES.some(role => r.includes(role));
    });

    return (
        <AdminLayout>
            <div style={S.main}>
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    style={S.header}
                >
                    <div>
                        <h1 style={S.pageTitle}>Admin Dashboard</h1>
                        <p style={S.pageSubtitle}>Manage users, roles and system settings</p>
                    </div>
                    <a href="/logout" style={S.btnPrimaryLogout}>
                        <LogOut size={16} /> Logout
                    </a>
                </motion.header>

                {/* Stat Cards */}
                <div style={S.statsGrid}>
                    {statCards.map((c, i) => (
                        <StatCard key={c.key} icon={c.icon} label={c.label} color={c.color} value={stats?.[c.key]} delay={i * 0.1} />
                    ))}
                </div>

                {/* ── Availability Management ── */}
                {medicalUsers.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        style={{ ...S.section, marginBottom: '2.5rem' }}
                    >
                        <div style={S.sectionHeader}>
                            <div>
                                <h2 style={S.sectionTitle}>
                                    <UserCheck size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: '#10b981' }} />
                                    Staff & Doctor Availability
                                </h2>
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0' }}>
                                    Live status of medical personnel
                                </p>
                            </div>
                            <span style={{ background: '#dbeafe', color: '#2563eb', padding: '6px 16px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 700, border: '1px solid #bfdbfe' }}>
                                {medicalUsers.filter(u => u.available).length} / {medicalUsers.length} Available
                            </span>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            {medicalUsers.map((u, i) => {
                                const rc = roleColor(u.role);
                                return (
                                    <motion.div
                                        key={u.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{
                                            background: '#ffffff',
                                            border: `1px solid ${u.available ? '#a7f3d0' : '#e2e8f0'}`,
                                            borderRadius: 20, padding: '1.25rem',
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <div style={{ ...S.avatar, width: 48, height: 48, background: `${rc.color}18`, color: rc.color, border: `2px solid ${rc.border}`, fontSize: '1.1rem' }}>
                                            {initials(u.name || u.username)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {u.name || u.username}
                                            </div>
                                            <span style={{ ...S.rolePill, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, fontSize: '0.65rem', marginTop: 6, display: 'inline-flex', whiteSpace: 'nowrap' }}>
                                                {roleIcon(u.role)} {u.role}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 64 }}>
                                            <AvailabilitySwitch
                                                available={!!u.available}
                                                disabled={toggling}
                                                onClick={() => handleToggleAvailability(u)}
                                            />
                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: u.available ? '#10b981' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {u.available ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.section>
                )}

                {/* ── User Management ── */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={S.section}
                >
                    <div style={S.sectionHeader}>
                        <div>
                            <h2 style={S.sectionTitle}>User Management</h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0' }}>
                                Total {users.length} active users
                            </p>
                        </div>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by name, role..."
                                    style={S.searchInput}
                                />
                            </div>
                            <motion.button whileTap={{ scale: 0.96 }} type="submit" style={S.btnPrimary}>
                                <Search size={16} /> Search
                            </motion.button>
                        </form>
                    </div>

                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={S.spinner}
                            />
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        <th style={S.th}>ID</th>
                                        <th style={S.th}>User Details</th>
                                        <th style={S.th}>Role Permission</th>
                                        <th style={S.th}>Live Status</th>
                                        <th style={S.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {users.map(user => {
                                            const rc = roleColor(user.role);
                                            return (
                                                <motion.tr
                                                    key={user.id}
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    style={S.tr}
                                                >
                                                    <td style={S.td}>
                                                        <span style={S.idBadge}>#{user.id}</span>
                                                    </td>
                                                    <td style={S.td}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                            <div style={{ ...S.avatar, background: `${rc.color}18`, color: rc.color, border: `2px solid ${rc.border}` }}>
                                                                {initials(user.name || user.username)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{user.name || user.username}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>@{user.username}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={S.td}>
                                                        <span style={{ ...S.rolePill, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                                                            {roleIcon(user.role)} {user.role}
                                                        </span>
                                                    </td>
                                                    <td style={S.td}>
                                                        {STAFF_ROLES.includes((user.role || '').toUpperCase()) ? (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                                disabled={toggling}
                                                                onClick={() => handleToggleAvailability(user)}
                                                                style={{
                                                                    ...S.statusPill,
                                                                    background: user.available ? '#d1fae5' : '#fee2e2',
                                                                    color: user.available ? '#059669' : '#ef4444',
                                                                    border: `1px solid ${user.available ? '#a7f3d0' : '#fecaca'}`,
                                                                }}
                                                            >
                                                                {user.available ? '● Available' : '○ Unavailable'}
                                                            </motion.button>
                                                        ) : (
                                                            <span style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>Not Applicable</span>
                                                        )}
                                                    </td>
                                                    <td style={S.td}>
                                                        <div style={{ display: 'flex', gap: 10 }}>
                                                            {user.role?.toUpperCase() === 'PATIENT' && (
                                                                <Link to={`/admin/patient/${user.id}`}>
                                                                    <motion.button whileHover={{ scale: 1.05 }} style={S.btnView}>
                                                                        Open Profile
                                                                    </motion.button>
                                                                </Link>
                                                            )}
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, background: '#ef4444', color: '#fff' }}
                                                                onClick={() => setToDelete(user)}
                                                                style={S.btnDelete}
                                                            >
                                                                <Trash2 size={16} />
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.section>
            </div>

            {/* Delete Confirmation Modal */}
            {ReactDOM.createPortal(
                <AnimatePresence>
                    {toDelete && (
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={S.modalBackdrop}
                            onClick={() => setToDelete(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                                style={S.modal}
                                onClick={e => e.stopPropagation()}
                            >
                                <div style={S.warningBadge}>
                                    <AlertTriangle size={32} color="#ef4444" />
                                </div>
                                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '1.4rem', fontWeight: 800 }}>Delete User?</h3>
                                <p style={{ color: '#94a3b8', margin: '0 0 28px', lineHeight: 1.6 }}>
                                    Are you sure you want to delete <b>{toDelete.username}</b>?<br />
                                    This action is permanent and cannot be reversed.
                                </p>
                                <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                                    <button onClick={() => setToDelete(null)} style={S.btnCancel}>
                                        No, Keep User
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        style={S.btnConfirmDelete}
                                    >
                                        {deleting ? 'Processing...' : 'Yes, Delete'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Toast */}
            {ReactDOM.createPortal(
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            key="toast"
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 60, opacity: 0 }}
                            style={{
                                ...S.toast,
                                background: toast.type === 'success' ? '#10b981' : '#ef4444',
                            }}
                        >
                            {toast.msg}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </AdminLayout>
    );
}

/* ── Styles ──────────────────────────────────────────────── */
const S = {
    main: {
        flex: 1,
        padding: '2rem',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eaf3ff 0%, #f3f8ff 52%, #f8fbff 100%)',
        color: '#1e293b',
        fontFamily: 'Inter,system-ui,sans-serif'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' },
    pageTitle: { margin: 0, fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' },
    pageSubtitle: { margin: '6px 0 0', color: '#64748b', fontSize: '1rem', fontWeight: 500 },
    btnPrimaryLogout: { padding: '0.75rem 1.5rem', background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', transition: 'all 0.2s' },

    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' },
    statCard: { background: '#ffffff', borderRadius: 24, padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' },
    statIcon: { width: 60, height: 60, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: '2rem', fontWeight: 900, lineHeight: 1 },
    statLabel: { fontSize: '0.85rem', color: '#64748b', fontWeight: 700, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },

    section: { background: '#ffffff', borderRadius: 28, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    sectionHeader: { padding: '1.75rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
    sectionTitle: { margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center' },

    searchInput: { padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', width: 300, fontSize: '0.95rem', color: '#1e293b', outline: 'none', transition: 'border-color 0.2s' },
    btnPrimary: { padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' },

    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#f8fafc' },
    tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' },
    td: { padding: '1.25rem 2rem', verticalAlign: 'middle' },
    idBadge: { background: '#f1f5f9', color: '#475569', padding: '5px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800, fontFamily: 'monospace' },
    avatar: { width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 },
    rolePill: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 800 },
    statusPill: { padding: '6px 16px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', border: 'none', transition: 'all 0.2s' },

    btnView: { padding: '8px 16px', background: '#dbeafe', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
    btnDelete: { width: 36, height: 36, background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },

    spinner: { width: 48, height: 48, border: '4px solid #f1f5f9', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto' },
    modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
    modal: { background: '#ffffff', padding: '3rem 2.5rem', borderRadius: 32, maxWidth: 460, width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' },
    warningBadge: { width: 72, height: 72, background: '#fee2e2', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' },
    btnCancel: { padding: '0.85rem 1.75rem', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' },
    btnConfirmDelete: { padding: '0.85rem 1.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)' },
    toast: { position: 'fixed', bottom: 32, right: 32, color: 'white', padding: '1.25rem 2rem', borderRadius: 20, fontWeight: 700, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', zIndex: 9999 },
};
