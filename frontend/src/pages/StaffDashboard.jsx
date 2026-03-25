import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, LogOut, User, Clock, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function StaffDashboard() {
    const [staffData, setStaffData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [available, setAvailable] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        fetchStaffData();
    }, []);

    const fetchStaffData = async () => {
        try {
            // Reusing a logic that fetches the current user's staff profile
            // If there's no specific endpoint, we can use the self-availability one to check status
            const res = await api.get('/api/admin/users'); // Generic check or we could add a dedicated one
            // Fetching profile via a hidden endpoint or just assuming from current user
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAvailability = async () => {
        setToggling(true);
        try {
            const res = await api.patch('/api/staff/availability', { available: !available });
            setAvailable(res.data.available);
        } catch (e) {
            alert('Error updating availability: ' + (e.response?.data?.error || e.message));
        } finally {
            setToggling(false);
        }
    };

    if (loading) return <div style={S.container}><p style={{ color: '#64748b', textAlign: 'center' }}>Loading...</p></div>;

    return (
        <div style={S.container}>
            <div style={S.wrapper}>
                <motion.header
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    style={S.header}
                >
                    <div>
                        <h1 style={S.title}>Staff Dashboard</h1>
                        <p style={S.subtitle}>Manage your profile and availability</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <a href="/logout" style={S.logoutBtn}><LogOut size={18} /> Logout</a>
                    </div>
                </motion.header>

                <div style={S.grid}>
                    {/* Availability Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={S.card}
                    >
                        <div style={S.cardHeader}>
                            <div style={{ ...S.iconBox, background: available ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: available ? '#10b981' : '#ef4444' }}>
                                <Activity size={24} />
                            </div>
                            <h2 style={S.cardTitle}>My Availability</h2>
                        </div>

                        <p style={S.cardText}>
                            Toggle your availability status. When unavailable, you will not be assigned to new tasks or clinic sessions.
                        </p>

                        <div style={S.toggleWrapper}>
                            <span style={{ ...S.statusLabel, color: available ? '#10b981' : '#ef4444' }}>
                                {available ? 'Status: Available' : 'Status: Unavailable'}
                            </span>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={toggling}
                                onClick={handleToggleAvailability}
                                style={{
                                    ...S.toggleBtn,
                                    background: available ? '#10b981' : '#cbd5e1',
                                    justifyContent: available ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <motion.div layout style={S.toggleCircle} />
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Duty Info Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        style={S.card}
                    >
                        <div style={S.cardHeader}>
                            <div style={{ ...S.iconBox, background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                <ShieldCheck size={24} />
                            </div>
                            <h2 style={S.cardTitle}>Staff Privileges</h2>
                        </div>
                        <ul style={S.list}>
                            <li style={S.listItem}><Clock size={16} /> Update self availability</li>
                            <li style={S.listItem}><User size={16} /> Manage patient records (via central system)</li>
                            <li style={S.listItem}><ShieldCheck size={16} /> Secure access to clinic tools</li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

const S = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eaf3ff 0%, #f3f8ff 52%, #f8fbff 100%)',
        padding: '2rem 1.5rem',
        fontFamily: 'Inter, system-ui, sans-serif'
    },
    wrapper: { maxWidth: '1000px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' },
    title: { margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '1rem' },
    logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', color: '#ef4444', padding: '10px 20px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', border: '1px solid #fecaca', transition: '0.2s' },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' },
    card: { background: '#ffffff', borderRadius: 24, padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
    iconBox: { width: 50, height: 50, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 },
    cardText: { color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' },

    toggleWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f1f5f9', borderRadius: 16, border: '1px solid #e2e8f0' },
    statusLabel: { fontWeight: 700, fontSize: '0.9rem' },
    toggleBtn: { width: 56, height: 30, borderRadius: 100, border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.3s' },
    toggleCircle: { width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },

    list: { listStyle: 'none', padding: 0, margin: 0 },
    listItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569', padding: '12px 0', borderBottom: '1px solid #e2e8f0', fontWeight: 500 },
};
