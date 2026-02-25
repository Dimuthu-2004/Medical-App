import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, User, Phone, Mail, MapPin,
    Calendar, Activity, Shield, Hash, Droplets
} from 'lucide-react';
import api from '../services/api';
import AdminLayout from './AdminLayout';

const AdminPatientProfile = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                console.log('Fetching patient profile for ID:', id);
                const response = await api.get(`/api/admin/patients/${id}`);
                console.log('Patient API Response DATA:', response.data);
                // Ensure ID is present, fallback to the URL ID if missing in the payload
                const data = response.data;
                if (data && !data.id && id) data.id = id;
                setPatient(data);
            } catch (err) {
                console.error('Error fetching patient details:', err);
                setError('Could not load patient details. They might not exist.');
            } finally {
                // Add a small delay for the skeleton "wow" effect
                setTimeout(() => setLoading(false), 800);
            }
        };
        fetchPatient();
    }, [id]);

    if (loading) return <AdminLayout><LoadingSkeleton /></AdminLayout>;
    if (error) return <AdminLayout><ErrorMessage message={error} /></AdminLayout>;

    const staggerContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const itemAnim = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', damping: 20, stiffness: 300 }
        }
    };

    return (
        <AdminLayout>
            <div style={S.wrapper}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={S.header}
                >
                    <Link to="/admin/dashboard" style={S.backBtn}>
                        <ArrowLeft size={18} /> Back to Administration
                    </Link>
                    <h1 style={S.title}>Patient Health Record</h1>
                </motion.div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    style={S.grid}
                >
                    {/* Left Panel: Basic Identity */}
                    <motion.div variants={itemAnim} style={S.panel}>
                        <div style={S.profileHeader}>
                            <motion.div
                                whileHover={{ rotate: [0, -5, 5, -5, 0], scale: 1.05 }}
                                style={S.avatar}
                            >
                                {patient?.name?.charAt(0).toUpperCase() || 'P'}
                            </motion.div>
                            <h2 style={S.patientName}>{patient?.name || 'Unknown Patient'}</h2>
                            <p style={S.usernameTag}>@{patient?.username || 'anonymous'}</p>
                            <div style={S.badge}>PATIENT RECORD</div>
                        </div>

                        <div style={S.infoList}>
                            <InfoItem icon={<Hash size={18} />} label="Patient ID" value={`#${patient?.id || 'N/A'}`} />
                            <InfoItem icon={<Shield size={18} />} label="Identification" value={patient?.nic || 'None'} />
                            <InfoItem icon={<Calendar size={18} />} label="Date of Birth" value={patient?.dob || 'Not Provided'} />
                            <InfoItem icon={<Droplets size={18} />} label="Blood Group" value={patient?.bloodGroup || 'Not Specified'} color="#ef4444" />
                        </div>
                    </motion.div>

                    {/* Right Panel: Details */}
                    <div style={S.mainContent}>
                        {/* Contact Info Card */}
                        <motion.div variants={itemAnim} style={S.card}>
                            <h3 style={S.cardTitle}>
                                <div style={S.cardTitleIcon}><Phone size={20} /></div>
                                Contact & Communication
                            </h3>
                            <div style={S.cardGrid}>
                                <DetailBox icon={<Phone size={16} />} label="Primary Phone" value={patient?.phone || 'N/A'} />
                                <DetailBox icon={<Phone size={16} />} label="Alternate Phone" value={patient?.alternatePhone || 'None'} />
                                <div style={{ gridColumn: 'span 2' }}>
                                    <DetailBox icon={<Mail size={16} />} label="Email Address" value={patient?.email || 'N/A'} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <DetailBox icon={<MapPin size={16} />} label="Residential Address" value={patient?.address || 'Not Provided'} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Medical Info Card */}
                        <motion.div variants={itemAnim} style={S.card}>
                            <h3 style={S.cardTitle}>
                                <div style={{ ...S.cardTitleIcon, background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}><Activity size={20} /></div>
                                Clinical Profile
                            </h3>
                            <div style={S.medicalGrid}>
                                <div style={S.medicalBox}>
                                    <h4 style={S.medTitle}>⚠️ Reported Allergies</h4>
                                    <p style={S.medContent}>{patient?.allergies || 'No specific allergies reported by the patient.'}</p>
                                </div>
                                <div style={S.medicalBox}>
                                    <h4 style={{ ...S.medTitle, color: '#f43f5e' }}>🩺 Chronic Conditions</h4>
                                    <p style={S.medContent}>{patient?.chronicConditions || 'No chronic conditions recorded in the history.'}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
};

/* ── Components ── */
const InfoItem = ({ icon, label, value, color }) => (
    <motion.div whileHover={{ x: 5 }} style={S.infoItem}>
        <div style={{ ...S.infoIcon, color: color || '#2563eb' }}>{icon}</div>
        <div style={S.infoText}>
            <span style={S.infoLabel}>{label}</span>
            <span style={S.infoValue}>{value}</span>
        </div>
    </motion.div>
);

const DetailBox = ({ icon, label, value }) => (
    <motion.div
        whileHover={{ y: -4, background: 'rgba(255,255,255,0.8)' }}
        style={S.detailBox}
    >
        <div style={S.detailHeader}>
            {icon} {label}
        </div>
        <div style={S.detailValue}>{value}</div>
    </motion.div>
);

const DetailBoxWithIcon = ({ icon, label, value }) => (
    <motion.div
        whileHover={{ y: -4, background: '#f8faff' }}
        style={S.detailBox}
    >
        <div style={S.detailHeader}>
            {icon} {label}
        </div>
        <div style={S.detailValue}>{value}</div>
    </motion.div>
);

const LoadingSkeleton = () => (
    <div style={S.container}>
        <div style={S.wrapper}>
            <div style={{ ...S.header, opacity: 0.3 }}>
                <div style={{ width: 120, height: 20, background: '#e2e8f0', borderRadius: 10, marginBottom: 10 }} className="skeleton-pulse" />
                <div style={{ width: 300, height: 40, background: '#e2e8f0', borderRadius: 10 }} className="skeleton-pulse" />
            </div>
            <div style={S.grid}>
                <div style={S.panel} className="skeleton-pulse">
                    <div style={{ width: 100, height: 100, borderRadius: 24, background: '#f1f5f9', margin: '0 auto 20px' }} />
                    <div style={{ width: '80%', height: 24, background: '#f1f5f9', margin: '0 auto 10px' }} />
                    <div style={{ width: '50%', height: 16, background: '#f1f5f9', margin: '0 auto 40px' }} />
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ height: 50, background: '#f1f5f9', borderRadius: 12, marginBottom: 15 }} />
                    ))}
                </div>
                <div style={S.mainContent}>
                    {[1, 2].map(i => (
                        <div key={i} style={{ height: 250, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 30 }} className="skeleton-pulse">
                            <div style={{ width: 200, height: 24, background: '#f1f5f9', marginBottom: 30 }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                {[1, 2, 3, 4].map(j => (
                                    <div key={j} style={{ height: 60, background: '#f8fafc', borderRadius: 16 }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <style>{`
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            .skeleton-pulse { animation: pulse 1.5s infinite ease-in-out; }
        `}</style>
    </div>
);

const ErrorMessage = ({ message }) => (
    <div style={S.container}>
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={S.errorCard}
        >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#0f172a', margin: '0 0 0.5rem' }}>Data Access Error</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>{message}</p>
            <Link to="/admin/dashboard" style={S.btnPrimary}>Return to Safety</Link>
        </motion.div>
    </div>
);

/* ── Styles with Glassmorphism ── */
const S = {
    container: { minHeight: '100vh', background: '#f8faff', padding: '1.5rem 2rem', fontFamily: 'Inter, system-ui, sans-serif' },
    wrapper: { maxWidth: '1100px', margin: '0 auto' },
    header: { marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    title: { margin: 0, fontSize: '2.4rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#64748b', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 700, transition: 'all 0.2s' },
    grid: { display: 'grid', gridTemplateColumns: 'minmax(320px, 350px) 1fr', gap: '2.5rem' },

    // Glassmorphism Panel (Updated for Light Theme)
    panel: {
        background: 'white',
        border: '1px solid #f1f5f9',
        borderRadius: '32px',
        padding: '2.5rem',
        height: 'fit-content',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        position: 'sticky',
        top: '2rem'
    },

    profileHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2.5rem' },
    avatar: {
        width: '100px',
        height: '100px',
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        borderRadius: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '3rem',
        fontWeight: 800,
        marginBottom: '1.25rem',
        boxShadow: '0 15px 30px -5px rgba(37, 99, 235, 0.3)',
        cursor: 'default'
    },
    patientName: { margin: '0 0 0.35rem', fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' },
    usernameTag: { margin: '0 0 1rem', fontSize: '1rem', color: '#64748b', fontWeight: 600 },
    badge: { background: '#eff6ff', color: '#2563eb', fontSize: '0.75rem', fontWeight: 800, padding: '6px 16px', borderRadius: '100px', border: '1px solid #dbeafe' },

    infoList: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    infoItem: { display: 'flex', gap: '15px', padding: '12px', borderRadius: '18px', transition: 'all 0.2s', cursor: 'default' },
    infoIcon: { width: '42px', height: '42px', background: '#f8faff', border: '1px solid #f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    infoText: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    infoLabel: { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
    infoValue: { fontSize: '1.05rem', color: '#1e293b', fontWeight: 800 },

    mainContent: { display: 'flex', flexDirection: 'column', gap: '2rem' },

    card: {
        background: 'white',
        border: '1px solid #f1f5f9',
        borderRadius: '32px',
        padding: '2.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease'
    },

    cardTitle: { margin: '0 0 2rem', fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '14px' },
    cardTitleIcon: { width: '40px', height: '40px', background: '#eff6ff', color: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

    cardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
    detailBox: { background: '#f8faff', padding: '1.25rem', borderRadius: '20px', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' },
    detailHeader: { fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' },
    detailValue: { fontSize: '1.1rem', color: '#1e293b', fontWeight: 700 },

    medicalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
    medicalBox: { padding: '1.75rem', borderRadius: '24px', border: '1px solid #f1f5f9', background: '#f8faff' },
    medTitle: { margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' },
    medContent: { margin: 0, fontSize: '1.1rem', color: '#475569', lineHeight: 1.7, fontWeight: 500 },

    spinner: { width: '50px', height: '50px', border: '5px solid #f1f5f9', borderTop: '5px solid #2563eb', borderRadius: '50%' },
    errorCard: { background: 'white', padding: '4rem 2rem', borderRadius: '40px', textAlign: 'center', maxWidth: '500px', margin: '6rem auto', border: '1px solid #fecaca', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' },
    btnPrimary: { display: 'inline-block', marginTop: '1.5rem', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', padding: '1rem 2.5rem', borderRadius: '16px', textDecoration: 'none', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)', transition: 'transform 0.2s' }
};

export default AdminPatientProfile;
