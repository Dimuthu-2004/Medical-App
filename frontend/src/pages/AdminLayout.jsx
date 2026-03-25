import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const AdminLayout = ({ children }) => {
    const [sideOpen, setSideOpen] = useState(true);
    const location = useLocation();

    const navItems = [
        { icon: 'grid', label: 'Dashboard', to: '/admin/dashboard' },
        { icon: 'bell', label: 'Alerts', to: '/admin/announcements' },
        { icon: 'star', label: 'Reviews', to: '/admin/feedback' },
        { icon: 'chart', label: 'Reports', to: '/admin/reports' },
    ];

    const NavIcon = ({ name }) => {
        const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
        if (name === 'grid') return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>;
        if (name === 'bell') return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
        if (name === 'star') return <svg {...common}><path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7L12 18l-6.4 3.2 1.7-7L2 9.6 9 9l3-7z" /></svg>;
        if (name === 'chart') return <svg {...common}><path d="M3 3v18h18" /><path d="M7 14l4-4 4 3 5-6" /></svg>;
        if (name === 'gear') return <svg {...common}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" /><path d="M19.4 15a7.8 7.8 0 0 0 .1-2l2-1.2-2-3.5-2.3.6a7.9 7.9 0 0 0-1.7-1l-.3-2.4H10l-.3 2.4a7.9 7.9 0 0 0-1.7 1l-2.3-.6-2 3.5 2 1.2a7.8 7.8 0 0 0 .1 2L3.7 16.2l2 3.5 2.3-.6a7.9 7.9 0 0 0 1.7 1l.3 2.4h4l.3-2.4a7.9 7.9 0 0 0 1.7-1l2.3.6 2-3.5-2.1-1.2z" /></svg>;
        return null;
    };

    return (
        <div style={S.layout}>
            <motion.aside
                animate={{ width: sideOpen ? 240 : 68 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={S.sidebar}
            >
                <div style={S.sideTop}>
                    <motion.div style={S.sideIcon} animate={{ boxShadow: ['0 4px 10px rgba(59,130,246,0.3)', '0 4px 20px rgba(59,130,246,0.5)', '0 4px 10px rgba(59,130,246,0.3)'] }} transition={{ duration: 2, repeat: Infinity }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </motion.div>
                    {sideOpen && <span style={S.sideTitle}>SmartClinic</span>}
                </div>

                <nav style={{ flex: 1 }}>
                    {navItems.map((item, i) => {
                        const active = location.pathname === item.to;
                        return (
                            <motion.div key={i} whileHover={{ x: 4 }}>
                                {item.external ? (
                                    <a href={item.to} style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }}>
                                        <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                                        {sideOpen && <span style={{ fontSize: '0.9rem', fontWeight: active ? 700 : 500 }}>{item.label}</span>}
                                    </a>
                                ) : (
                                    <Link to={item.to} style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }}>
                                        <span style={{ width: 22, display: 'inline-flex', justifyContent: 'center' }}><NavIcon name={item.icon} /></span>
                                        {sideOpen && <span style={{ fontSize: '0.9rem', fontWeight: active ? 700 : 500 }}>{item.label}</span>}
                                    </Link>
                                )}
                            </motion.div>
                        );
                    })}
                </nav>

                <a href="/logout" style={S.logoutBtn}>
                    <LogOut size={18} />
                    {sideOpen && <span>Logout</span>}
                </a>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setSideOpen(o => !o)}
                    style={S.sideToggle}
                >
                    {sideOpen ? 'Collapse' : 'Expand'}
                </motion.button>
            </motion.aside>

            <main style={S.main}>
                {children}
            </main>
        </div>
    );
};

const S = {
    layout: { display: 'flex', height: '100vh', background: 'var(--app-bg)', overflow: 'hidden' },
    sidebar: {
        background: '#ffffff',
        display: 'flex', flexDirection: 'column', padding: '1.5rem 0.8rem',
        boxShadow: '4px 0 40px rgba(15,23,42,0.06)', borderRight: '1px solid rgba(15,23,42,0.10)', zIndex: 10
    },
    sideTop: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px', marginBottom: '2.5rem' },
    sideIcon: { width: 36, height: 36, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sideTitle: { fontWeight: 900, color: '#0f172a', fontSize: '1.1rem', whiteSpace: 'nowrap', letterSpacing: '-0.02em' },
    navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', color: 'var(--app-muted)', marginBottom: 6, transition: 'all 0.2s', fontWeight: 800 },
    navItemActive: { background: 'rgba(14,165,233,0.12)', color: 'rgba(14,165,233,1)', border: '1px solid rgba(14,165,233,0.18)' },
    logoutBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', color: '#ef4444', marginBottom: 8, transition: 'all 0.2s', fontWeight: 700, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer' },
    sideToggle: { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', marginTop: 'auto', fontWeight: 700 },
    main: { flex: 1, overflowY: 'auto', background: 'transparent' },
};

export default AdminLayout;
