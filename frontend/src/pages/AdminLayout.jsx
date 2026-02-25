import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
    const [sideOpen, setSideOpen] = useState(true);
    const location = useLocation();

    const navItems = [
        { icon: '🏠', label: 'Dashboard', to: '/admin/dashboard' },
        { icon: '💳', label: 'Payments', to: '/finance/dashboard' },
        { icon: '📢', label: 'Alerts', to: '/admin/announcements' },
        { icon: '⭐', label: 'Reviews', to: '/admin/feedback' },
        { icon: '📊', label: 'Reports', to: '#' },
        { icon: '⚙️', label: 'Settings', to: '#' },
    ];

    return (
        <div style={S.layout}>
            <motion.aside
                animate={{ width: sideOpen ? 240 : 68 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={S.sidebar}
            >
                <div style={S.sideTop}>
                    <motion.div style={S.sideIcon} animate={{ boxShadow: ['0 0 10px rgba(37,99,235,0.4)', '0 0 22px rgba(37,99,235,0.7)', '0 0 10px rgba(37,99,235,0.4)'] }} transition={{ duration: 2, repeat: Infinity }}>
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
                                        <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                                        {sideOpen && <span style={{ fontSize: '0.9rem', fontWeight: active ? 700 : 500 }}>{item.label}</span>}
                                    </Link>
                                )}
                            </motion.div>
                        );
                    })}
                </nav>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setSideOpen(o => !o)}
                    style={S.sideToggle}
                >
                    {sideOpen ? '〈 Collapse' : '〉'}
                </motion.button>
            </motion.aside>

            <main style={S.main}>
                {children}
            </main>
        </div>
    );
};

const S = {
    layout: { display: 'flex', height: '100vh', background: 'radial-gradient(circle at top right, #1e293b, #0f172a)', overflow: 'hidden' },
    sidebar: {
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex', flexDirection: 'column', padding: '1.5rem 0.8rem',
        boxShadow: '4px 0 24px rgba(0,0,0,0.1)', zIndex: 10
    },
    sideTop: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px', marginBottom: '2.5rem' },
    sideIcon: { width: 36, height: 36, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sideTitle: { fontWeight: 800, color: 'white', fontSize: '1rem', whiteSpace: 'nowrap' },
    navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: 'rgba(255,255,255,0.6)', marginBottom: 2, transition: 'all 0.2s' },
    navItemActive: { background: 'rgba(37,99,235,0.25)', color: 'white', border: '1px solid rgba(37,99,235,0.3)' },
    sideToggle: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', marginTop: 8 },
    main: { flex: 1, overflowY: 'auto', background: 'transparent' },
};

export default AdminLayout;
