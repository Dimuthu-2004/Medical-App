import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Activity, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const PatientProfile = () => {
    const [profile, setProfile] = useState({
        name: '',
        phone: '',
        alternatePhone: '',
        address: '',
        allergies: '',
        chronicConditions: '',
        email: '',
        nic: '',
        dob: '',
        bloodGroup: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [account, setAccount] = useState(null); // { authProvider, role, username }
    const isFaceAccount = account?.authProvider === 'FACE';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const [profileRes, acctRes] = await Promise.all([
                api.get('/api/patients/profile'),
                api.get('/api/auth/user').catch(() => ({ data: null }))
            ]);
            setProfile(profileRes.data);
            setAccount(acctRes?.data || null);
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const payload = {
                name: profile.name || '',
                nic: profile.nic || '',
                dob: profile.dob || null,
                bloodGroup: profile.bloodGroup || '',
                phone: profile.phone || '',
                alternatePhone: profile.alternatePhone || '',
                address: profile.address || '',
                allergies: profile.allergies || '',
                chronicConditions: profile.chronicConditions || ''
            };
            await api.post('/api/patients/profile/update', payload);
            await fetchProfile();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setMessage({
                type: 'error',
                text: err?.response?.data?.error || 'Failed to update profile. Please try again.'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={styles.loadingContainer}><div style={styles.spinner}></div></div>;

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={styles.header}>
                    <a href="/patients/dashboard" style={styles.backBtn}>
                        <ArrowLeft size={24} />
                    </a>
                    <div>
                        <h1 style={styles.title}>Edit Profile</h1>
                        <p style={styles.subtitle}>Keep your information up to date.</p>
                    </div>
                </motion.div>

                {message && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ ...styles.msg, ...(message.type === 'success' ? styles.msgSuccess : styles.msgError) }}>
                        {message.type === 'success' ? <Activity size={20} /> : <AlertCircle size={20} />}
                        <span style={{ fontWeight: '600' }}>{message.text}</span>
                    </motion.div>
                )}

                {account?.authProvider === 'FACE' && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={styles.faceNote}>
                        <AlertCircle size={18} />
                        <div>
                            <div style={{ fontWeight: 800 }}>Face ID account</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 650 }}>
                                Username and password changes are disabled. Update contact details below, or re-register Face ID if you need a new username.
                            </div>
                        </div>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Personal Information (Read Only) */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>
                            <User size={20} color="#3b82f6" /> General Information
                        </h3>
                        <div style={styles.grid2}>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>Full Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    value={profile.name || ''}
                                    onChange={handleChange}
                                    disabled={!isFaceAccount}
                                    style={isFaceAccount ? styles.input : styles.inputDisabled}
                                />
                            </div>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>NIC Number</label>
                                <input
                                    name="nic"
                                    type="text"
                                    value={profile.nic || ''}
                                    onChange={handleChange}
                                    disabled={!isFaceAccount}
                                    style={isFaceAccount ? styles.input : styles.inputDisabled}
                                />
                            </div>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>Date of Birth</label>
                                <input
                                    name="dob"
                                    type={isFaceAccount ? 'date' : 'text'}
                                    value={profile.dob || ''}
                                    onChange={handleChange}
                                    disabled={!isFaceAccount}
                                    style={isFaceAccount ? styles.input : styles.inputDisabled}
                                />
                            </div>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>Blood Group</label>
                                <input
                                    name="bloodGroup"
                                    type="text"
                                    value={profile.bloodGroup || ''}
                                    onChange={handleChange}
                                    disabled={!isFaceAccount}
                                    style={isFaceAccount ? styles.input : styles.inputDisabled}
                                />
                            </div>
                        </div>
                        {!isFaceAccount && (
                            <p style={styles.infoText}>* For security, please contact admin to change core identity information.</p>
                        )}
                        {isFaceAccount && (
                            <p style={styles.infoText}>* Face ID accounts can complete/update identity details here.</p>
                        )}
                    </div>

                    {/* Contact Details */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>
                            <Phone size={20} color="#10b981" /> Contact Details
                        </h3>
                        <div style={styles.grid2}>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>Primary Phone</label>
                                <div style={styles.rel}>
                                    <Phone size={18} style={styles.inputIcon} />
                                    <input name="phone" type="tel" value={profile.phone || ''} onChange={handleChange} style={styles.input} placeholder="+94 7X XXX XXXX" />
                                </div>
                            </div>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>Alternate Phone</label>
                                <div style={styles.rel}>
                                    <Phone size={18} style={styles.inputIcon} />
                                    <input name="alternatePhone" type="tel" value={profile.alternatePhone || ''} onChange={handleChange} style={styles.input} placeholder="Emergency Contact" />
                                </div>
                            </div>
                            <div style={{ ...styles.fieldWrap, gridColumn: 'span 2' }}>
                                <label style={styles.label}>Home Address</label>
                                <div style={styles.rel}>
                                    <MapPin size={18} style={{ ...styles.inputIcon, top: 16, transform: 'none' }} />
                                    <textarea name="address" rows="3" value={profile.address} onChange={handleChange} style={{ ...styles.input, paddingLeft: 48 }} placeholder="Local Address" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medical History */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>
                            <Activity size={20} color="#f43f5e" /> Medical Information
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>Allergies (if any)</label>
                                <textarea name="allergies" rows="2" value={profile.allergies || ''} onChange={handleChange} style={styles.input} placeholder="e.g., Penicillin, Peanuts" />
                            </div>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>Chronic Conditions</label>
                                <textarea name="chronicConditions" rows="2" value={profile.chronicConditions || ''} onChange={handleChange} style={styles.input} placeholder="e.g., Hypertension, Diabetes" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={styles.actions}>
                        <a href="/patients/dashboard" style={styles.discardBtn}>Discard Changes</a>
                        <button type="submit" disabled={saving} style={styles.saveBtn}>
                            {saving ? <div style={styles.btnSpinner} /> : <Save size={18} />}
                            <span>Save Changes</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: 'var(--app-bg)', color: 'var(--app-text)', padding: '32px 24px', fontFamily: "'Inter', sans-serif" },
    content: { maxWidth: '896px', margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 },
    backBtn: { padding: 8, color: '#334155', background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' },
    title: { fontSize: '1.875rem', fontWeight: '700', margin: 0 },
    subtitle: { color: '#94a3b8', margin: 0 },
    msg: { padding: 16, borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid' },
    msgSuccess: { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: '#34d399' },
    msgError: { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' },
    faceNote: { padding: 16, borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12, border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(245,158,11,0.08)', color: '#92400e' },
    card: { background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 24, padding: 32, boxShadow: '0 10px 15px -3px rgba(2,6,23,0.06)' },
    cardTitle: { fontSize: '1.25rem', fontWeight: '700', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 },
    fieldWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
    label: { fontSize: '0.875rem', fontWeight: '500', color: 'var(--app-muted)', marginLeft: 4 },
    input: { width: '100%', background: 'var(--app-bg)', border: '1px solid var(--app-border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--app-text)', fontSize: '1rem', transition: 'all 0.3s', outline: 'none' },
    inputDisabled: { width: '100%', background: 'var(--app-bg-muted)', border: '1px solid var(--app-border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--app-muted)', cursor: 'not-allowed' },
    rel: { position: 'relative' },
    inputIcon: { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' },
    infoText: { color: '#64748b', fontSize: '0.75rem', marginTop: 16, fontStyle: 'italic' },
    actions: { display: 'flex', justifyContent: 'end', gap: 12, paddingTop: 16 },
    discardBtn: { padding: '12px 32px', background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: '#334155', fontWeight: '700', borderRadius: '12px', textDecoration: 'none', transition: 'background 0.3s' },
    saveBtn: { padding: '12px 32px', background: 'linear-gradient(to right, #2563eb, #4f46e5)', color: '#fff', fontWeight: '700', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)' },
    loadingContainer: { minHeight: '100vh', background: 'var(--app-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    spinner: { width: 48, height: 48, border: '4px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    btnSpinner: { width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }
};

export default PatientProfile;
