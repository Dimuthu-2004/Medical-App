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

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/patients/api/profile');
            setProfile(response.data);
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
            await api.post('/patients/api/profile/update', profile);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Personal Information (Read Only) */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>
                            <User size={20} color="#3b82f6" /> General Information
                        </h3>
                        <div style={styles.grid2}>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>Full Name</label>
                                <input type="text" value={profile.name} disabled style={styles.inputDisabled} />
                            </div>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>NIC Number</label>
                                <input type="text" value={profile.nic} disabled style={styles.inputDisabled} />
                            </div>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>Date of Birth</label>
                                <input type="text" value={profile.dob} disabled style={styles.inputDisabled} />
                            </div>
                            <div style={styles.fieldWrap}>
                                <label style={styles.label}>Blood Group</label>
                                <input type="text" value={profile.bloodGroup} disabled style={styles.inputDisabled} />
                            </div>
                        </div>
                        <p style={styles.infoText}>* For security, please contact admin to change core identity information.</p>
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
                                    <input name="phone" type="tel" value={profile.phone} onChange={handleChange} style={styles.input} placeholder="+94 7X XXX XXXX" />
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
    container: { minHeight: '100vh', background: '#020617', color: '#f1f5f9', padding: '32px 24px', fontFamily: "'Inter', sans-serif" },
    content: { maxWidth: '896px', margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 },
    backBtn: { padding: 8, color: '#f1f5f9', background: 'rgba(30,41,59,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' },
    title: { fontSize: '1.875rem', fontWeight: '700', margin: 0 },
    subtitle: { color: '#94a3b8', margin: 0 },
    msg: { padding: 16, borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid' },
    msgSuccess: { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: '#34d399' },
    msgError: { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' },
    card: { background: 'rgba(15,23,42,0.5)', border: '1px solid #1e293b', borderRadius: 24, padding: 32, backdropFilter: 'blur(12px)' },
    cardTitle: { fontSize: '1.25rem', fontWeight: '700', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 },
    fieldWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
    label: { fontSize: '0.875rem', fontWeight: '500', color: '#94a3b8', marginLeft: 4 },
    input: { width: '100%', background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '1rem', transition: 'all 0.3s', outline: 'none' },
    inputDisabled: { width: '100%', background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: '12px', padding: '12px 16px', color: '#64748b', cursor: 'not-allowed' },
    rel: { position: 'relative' },
    inputIcon: { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' },
    infoText: { color: '#64748b', fontSize: '0.75rem', marginTop: 16, fontStyle: 'italic' },
    actions: { display: 'flex', justifyContent: 'end', gap: 12, paddingTop: 16 },
    discardBtn: { padding: '12px 32px', background: '#1e293b', color: '#cbd5e1', fontWeight: '700', borderRadius: '12px', border: 'none', textDecoration: 'none', transition: 'background 0.3s' },
    saveBtn: { padding: '12px 32px', background: 'linear-gradient(to right, #2563eb, #4f46e5)', color: '#fff', fontWeight: '700', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)' },
    loadingContainer: { minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    spinner: { width: 48, height: 48, border: '4px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    btnSpinner: { width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }
};

export default PatientProfile;
