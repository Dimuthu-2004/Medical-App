import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { Heart, ArrowLeft, FileText, Activity, Clock, Trash2, ChevronDown, Plus, ChevronRight, TrendingUp, Edit3, X, Loader2 } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import api from '../services/api';

const TAB_OPTIONS = ['records', 'vitals', 'trends'];
const TAB_LABELS = {
    records: '📋 History',
    vitals: '🩹 Vitals',
    trends: '📈 Trends'
};

/* ── Trend Charts ────────────────────────────────────────── */
function VitalTrends({ vitals }) {
    const chartData = useMemo(() => {
        if (!vitals || vitals.length === 0) return [];
        return [...vitals]
            .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
            .map(v => ({
                date: v.recordedAt ? v.recordedAt.split('T')[0] : 'N/A',
                weight: v.weight,
                temp: v.temperature,
                hr: v.heartRate,
                bpSystems: v.systolicBP,
                bpDiastolic: v.diastolicBP,
                bp: v.systolicBP && v.diastolicBP ? `${v.systolicBP}/${v.diastolicBP}` : 'N/A'
            }));
    }, [vitals]);

    if (chartData.length === 0) return <EmptyState icon="📈" text="No trend data available" />;

    return (
        <div style={S.trendsGrid}>
            <ChartCard title="Blood Pressure Trend" unit="mmHg">
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                            contentStyle={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 12 }}
                            itemStyle={{ color: 'var(--app-text)' }}
                        />
                        <Area type="monotone" dataKey="bpSystems" name="Systolic" stroke="#ef4444" fillOpacity={1} fill="url(#colorSys)" strokeWidth={3} />
                        <Area type="monotone" dataKey="bpDiastolic" name="Diastolic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDia)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Heart Rate & Temp" unit="bpm / °C">
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip contentStyle={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 12, boxShadow: '0 10px 15px rgba(2, 6, 23, 0.12)' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                        <Line type="monotone" dataKey="hr" name="Heart Rate" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="temp" name="Temperature" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Weight Evolution" unit="kg">
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} hide />
                        <YAxis stroke="#64748b" fontSize={12} unit="kg" />
                        <Tooltip contentStyle={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 12 }} />
                        <Area type="monotone" dataKey="weight" name="Weight" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}

function ChartCard({ title, unit, children }) {
    return (
        <div style={S.chartSection}>
            <div style={S.chartHeader}>
                <h3 style={S.chartTitle}>{title}</h3>
                <span style={S.chartUnit}>{unit}</span>
            </div>
            {children}
        </div>
    );
}

export default function MedicalRecordsPage({ initialTab = 'records' }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState(initialTab);
    const [expandedId, setExpandedId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Edit States
    const [editingRecord, setEditingRecord] = useState(null);
    const [editingVitals, setEditingVitals] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialTab) setTab(initialTab);
    }, [initialTab]);

    const { id: patientId } = useParams();

    const fetchRecords = () => {
        setLoading(true);
        api.get(`/api/medical-records/patient/${patientId}`)
            .then(r => setData(r.data))
            .catch(e => setError(e.response?.data?.error || 'Could not load medical records.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRecords();
    }, [patientId]);

    const handleDeleteRecord = async (id) => {
        if (!window.confirm('Are you sure you want to delete this medical record?')) return;
        setDeleting(true);
        try {
            await api.delete(`/api/medical-records/${id}`);
            fetchRecords();
        } catch (e) {
            alert('Error deleting record');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteVital = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vital record?')) return;
        setDeleting(true);
        try {
            await api.delete(`/api/vitals/${id}`);
            fetchRecords();
        } catch (e) {
            console.error('Delete vital error:', e);
            alert(`Error deleting vital record: ${e.response?.status === 403 ? 'Permission Denied' : (e.message || 'Unknown error')}`);
        } finally {
            setDeleting(false);
        }
    };

    const handleSaveRecord = async (record) => {
        setSaving(true);
        try {
            await api.post('/api/medical-records/save', {
                ...record,
                patientId: Number(patientId)
            });
            setEditingRecord(null);
            fetchRecords();
        } catch (e) {
            alert('Error saving record');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveVitals = async (vitalsData) => {
        setSaving(true);
        try {
            await api.post('/api/vitals/save', {
                ...vitalsData,
                patientId: Number(patientId)
            });
            setEditingVitals(null);
            fetchRecords();
        } catch (e) {
            alert('Error saving vitals');
        } finally {
            setSaving(false);
        }
    };

    if (loading && !data) return <LoadingScreen />;
    if (error) return (
        <div style={S.container}>
            <div style={{ textAlign: 'center', paddingTop: '6rem', color: '#f87171' }}>
                <AlertIcon />
                <p>{error}</p>
                <Link to="/patients/dashboard" style={S.backLink}>← Back to Dashboard</Link>
            </div>
        </div>
    );

    const { patient, records, vitals, consultations } = data;

    return (
        <div style={S.container}>
            <div style={S.wrapper}>
                {/* Header */}
                <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={S.header}>
                    <Link
                        to={data?.currentUserRole?.includes('PATIENT') ? '/patients/dashboard' :
                            data?.currentUserRole?.includes('STAFF') ? '/staff/dashboard' : '/doctor/dashboard'}
                        style={S.backBtn}
                    >
                        <ArrowLeft size={18} /> Dashboard
                    </Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h1 style={S.title}>Medical History</h1>
                            <span style={{ fontSize: '0.7rem', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: 6, fontWeight: 900 }}>v2.0</span>
                        </div>
                        <p style={S.subtitle}>{patient?.name ?? 'Patient Profile'}</p>
                    </div>
                </motion.header>

                {/* Patient Info Strip */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={S.patientStrip}>
                    <div style={S.patientAvatar}>{patient?.name?.[0] ?? 'P'}</div>
                    <div style={S.patientDetails}>
                        <div style={S.patientName}>{patient?.name}</div>
                        <div style={S.patientMeta}>
                            {patient?.dob && <span>DOB: {patient.dob}</span>}
                            {patient?.gender && <span> · {patient.gender}</span>}
                            {patient?.bloodGroup && (
                                <span style={S.bloodGroup}>🩸 {patient.bloodGroup}</span>
                            )}
                        </div>
                    </div>
                    <div style={S.summaryStats}>
                        <StatPill label="Total Records" value={records?.length ?? 0} color="#3b82f6" />
                        <StatPill label="Vitals Log" value={vitals?.length ?? 0} color="#10b981" />
                    </div>
                </motion.div>

                {/* Tabs */}
                <div style={S.tabs}>
                    {TAB_OPTIONS.map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }}>
                            {TAB_LABELS[t]}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {/* Medical Records */}
                    {tab === 'records' && (
                        <motion.div key="records" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {records?.length === 0 ? <EmptyState icon="📋" text="No medical records found" /> : (
                                <div style={S.cardList}>
                                    {records.map((r, i) => (
                                        <motion.div
                                            key={r.id}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            style={S.recordCard}
                                        >
                                            <div style={S.recordHeader}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                                                    <div style={S.recordIcon}><FileText size={18} /></div>
                                                    <div>
                                                        <div style={S.recordDate}>{r.recordDate ?? 'Date N/A'}</div>
                                                        <div style={S.recordDiagnosis}>{r.diagnosis ?? 'No diagnosis'}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>by {r.createdBy ?? 'Unknown'}</span>
                                                    {!data?.currentUserRole?.includes('PATIENT') && (
                                                        <div style={{ display: 'flex', gap: 12 }}>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, color: '#3b82f6' }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={(e) => { e.stopPropagation(); setEditingRecord(r); }}
                                                                style={S.deleteBtn}
                                                            >
                                                                <Edit3 size={16} />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, color: '#ef4444' }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteRecord(r.id); }}
                                                                style={S.deleteBtn}
                                                            >
                                                                <Trash2 size={16} />
                                                            </motion.button>
                                                        </div>
                                                    )}
                                                    <ChevronDown size={18} color="#64748b" style={{ transform: expandedId === r.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === r.id ? null : r.id); }} />
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {expandedId === r.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={S.recordBody}
                                                    >
                                                        {r.medications && <FieldRow label="Medications" value={r.medications} />}
                                                        {r.medicalHistory && <FieldRow label="Medical History" value={r.medicalHistory} />}
                                                        {r.allergies && <FieldRow label="Allergies" value={r.allergies} />}
                                                        {r.notes && <FieldRow label="Notes" value={r.notes} />}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Vitals */}
                    {tab === 'vitals' && (
                        <motion.div key="vitals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {vitals?.length === 0 ? <EmptyState icon="🩹" text="No vitals recorded yet" /> : (
                                <div style={S.vitalsGrid}>
                                    {vitals.map((v, i) => (
                                        <motion.div
                                            key={v.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.06 }}
                                            whileHover={{ y: -4 }}
                                            style={S.vitalCard}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <div style={{ ...S.vitalDate, marginBottom: 0 }}>{v.recordedAt ? v.recordedAt.split('T')[0] : 'N/A'}</div>
                                                {!data?.currentUserRole?.includes('PATIENT') && (
                                                    <div style={{ display: 'flex', gap: 10 }}>
                                                        <motion.button
                                                            whileHover={{ scale: 1.03 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setEditingVitals(v)}
                                                            style={S.editVitalsBtn}
                                                        >
                                                            <Edit3 size={16} />
                                                            Update
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, color: '#ef4444' }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleDeleteVital(v.id)}
                                                            style={S.deleteBtn}
                                                        >
                                                            <Trash2 size={14} />
                                                        </motion.button>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={S.vitalGrid}>
                                                <VitalItem label="Weight" value={v.weight} unit="kg" color="#3b82f6" />
                                                <VitalItem label="BP" value={v.systolicBP && v.diastolicBP ? `${v.systolicBP}/${v.diastolicBP}` : null} unit="mmHg" color="#ef4444" />
                                                <VitalItem label="Temp" value={v.temperature} unit="°C" color="#f59e0b" />
                                                <VitalItem label="Heart Rate" value={v.heartRate} unit="bpm" color="#10b981" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Trends */}
                    {tab === 'trends' && (
                        <motion.div key="trends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <VitalTrends vitals={vitals} />
                        </motion.div>
                    )}


                </AnimatePresence>

                {/* Edit Record Modal */}
                <EditModal
                    open={!!editingRecord}
                    onClose={() => setEditingRecord(null)}
                    title="Edit Medical Record"
                    onSave={handleSaveRecord}
                    initialData={editingRecord}
                    fields={[
                        { name: 'diagnosis', label: 'Diagnosis', placeholder: 'e.g. Hypertension' },
                        { name: 'medications', label: 'Medications', textarea: true },
                        { name: 'medicalHistory', label: 'Medical History', textarea: true },
                        { name: 'allergies', label: 'Allergies' },
                        { name: 'notes', label: 'Notes', textarea: true }
                    ]}
                    saving={saving}
                />

                {/* Edit Vitals Modal */}
                <EditModal
                    open={!!editingVitals}
                    onClose={() => setEditingVitals(null)}
                    title="Edit Patient Vitals"
                    onSave={handleSaveVitals}
                    initialData={editingVitals}
                    fields={[
                        { name: 'weight', label: 'Weight (kg)', type: 'number' },
                        { name: 'systolicBP', label: 'Systolic BP', type: 'number' },
                        { name: 'diastolicBP', label: 'Diastolic BP', type: 'number' },
                        { name: 'temperature', label: 'Temp (°C)', type: 'number' },
                        { name: 'heartRate', label: 'Heart Rate (bpm)', type: 'number' }
                    ]}
                    saving={saving}
                />
            </div>
        </div>
    );
}

function EditModal({ open, onClose, title, onSave, initialData, fields, saving }) {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (initialData) setFormData(initialData);
    }, [initialData]);

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={S.modalOverlay}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    style={S.modalCard}
                >
                    <div style={S.modalHeader}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{title}</h2>
                        <button onClick={onClose} style={S.closeBtn}><X size={20} /></button>
                    </div>
                    <div style={S.modalBody}>
                        {fields.map(f => (
                            <div key={f.name} style={{ marginBottom: '1.25rem' }}>
                                <label style={S.inputLabel}>{f.label}</label>
                                {f.textarea ? (
                                    <textarea
                                        value={formData[f.name] || ''}
                                        onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                                        placeholder={f.placeholder}
                                        style={S.textarea}
                                    />
                                ) : (
                                    <input
                                        type={f.type || 'text'}
                                        value={formData[f.name] || ''}
                                        onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                                        placeholder={f.placeholder}
                                        style={S.input}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={S.modalFooter}>
                        <button onClick={onClose} style={S.cancelBtn} disabled={saving}>Cancel</button>
                        <button
                            onClick={() => onSave(formData)}
                            style={S.saveBtn}
                            disabled={saving}
                        >
                            {saving ? <Loader2 size={18} className="spin" /> : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

const StatPill = ({ label, value, color }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color }}>{value}</div>
        <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{label}</div>
    </div>
);

const VitalItem = ({ label, value, unit, color }) => value != null ? (
    <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
        <div style={{ color, fontWeight: 900, fontSize: '1.1rem' }}>{value}</div>
        <div style={{ color: '#475569', fontSize: '0.7rem' }}>{unit}</div>
    </div>
) : null;

const FieldRow = ({ label, value, color }) => (
    <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
        <div style={{ color: color || '#334155', fontSize: '0.95rem', lineHeight: 1.6 }}>{value}</div>
    </div>
);

const EmptyState = ({ icon, text }) => (
    <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#64748b', background: 'var(--app-surface)', borderRadius: 24, border: '1px dashed var(--app-border)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.25rem' }}>{icon}</div>
        <p style={{ margin: 0, fontWeight: 600 }}>{text}</p>
    </div>
);

const AlertIcon = () => <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>;

const LoadingScreen = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--app-bg)', color: 'var(--app-muted)', flexDirection: 'column', gap: 16 }}>
        <Heart size={40} color="#3b82f6" style={{ animation: 'pulse 1s infinite alternate' }} />
        Loading clinical data...
        <style>{`@keyframes pulse { from{opacity:.4} to{opacity:1} }`}</style>
    </div>
);

const S = {
    container: { minHeight: '100vh', background: 'var(--app-bg)', padding: '2.5rem 1.5rem', fontFamily: 'Inter,system-ui,sans-serif', color: 'var(--app-text)' },
    wrapper: { maxWidth: '1100px', margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' },
    backBtn: { display: 'flex', alignItems: 'center', gap: 8, color: '#334155', textDecoration: 'none', fontWeight: 700, padding: '10px 18px', borderRadius: 12, background: 'var(--app-surface)', border: '1px solid var(--app-border)', flexShrink: 0, transition: 'all 0.2s' },
    title: { margin: 0, fontSize: '2.2rem', fontWeight: 900, color: 'var(--app-text)', letterSpacing: '-0.02em' },
    subtitle: { margin: '6px 0 0', color: 'var(--app-muted)', fontSize: '1.1rem' },
    backLink: { color: '#3b82f6', textDecoration: 'none', fontWeight: 700 },

    patientStrip: { display: 'flex', alignItems: 'center', gap: '2rem', background: 'var(--app-surface)', borderRadius: 24, padding: '1.75rem 2rem', marginBottom: '2rem', border: '1px solid var(--app-border)', flexWrap: 'wrap', boxShadow: '0 10px 15px -3px rgba(2,6,23,0.06)' },
    patientAvatar: { width: 64, height: 64, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.6rem', flexShrink: 0, boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)' },
    patientDetails: { flex: 1 },
    patientName: { color: 'var(--app-text)', fontWeight: 900, fontSize: '1.3rem' },
    patientMeta: { color: 'var(--app-muted)', fontSize: '0.9rem', marginTop: 6, fontWeight: 500 },
    bloodGroup: { marginLeft: 10, background: 'rgba(244,63,94,0.1)', color: '#f43f5e', padding: '3px 12px', borderRadius: 100, fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' },
    summaryStats: { display: 'flex', gap: '2.5rem', paddingLeft: '2rem', borderLeft: '1px solid var(--app-border)' },

    tabs: { display: 'flex', gap: '0.75rem', marginBottom: '2rem', background: 'var(--app-surface)', padding: 8, borderRadius: 18, border: '1px solid var(--app-border)', flexWrap: 'wrap' },
    tab: { padding: '12px 24px', borderRadius: 14, border: 'none', background: 'transparent', color: 'var(--app-muted)', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s' },
    tabActive: { background: '#3b82f6', color: '#fff', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' },

    cardList: { display: 'flex', flexDirection: 'column', gap: '1rem' },

    recordCard: { background: 'var(--app-surface)', borderRadius: 22, border: '1px solid var(--app-border)', overflow: 'hidden' },
    recordHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.75rem', cursor: 'pointer' },
    recordIcon: { width: 44, height: 44, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    recordDate: { color: 'var(--app-muted)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' },
    recordDiagnosis: { color: 'var(--app-text)', fontWeight: 800, fontSize: '1.1rem', marginTop: 4 },
    recordBody: { padding: '0 1.75rem 1.75rem', borderTop: '1px solid var(--app-border)', overflow: 'hidden', paddingTop: '1.5rem' },

    vitalsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' },
    vitalCard: { background: 'var(--app-surface)', borderRadius: 22, padding: '1.5rem', border: '1px solid var(--app-border)', cursor: 'default' },
    vitalDate: { color: 'var(--app-muted)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1.25rem' },
    vitalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },

    trendsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' },
    chartSection: { background: 'var(--app-surface)', borderRadius: 24, padding: '1.75rem', border: '1px solid var(--app-border)' },
    chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    chartTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--app-text)' },
    chartUnit: { fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' },


    deleteBtn: { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, transition: 'all 0.2s' },
    editVitalsBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)', color: '#2563eb', cursor: 'pointer', padding: '7px 12px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 800, fontFamily: 'inherit', transition: 'all 0.2s' },

    // Modal Styles
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
    modalCard: { background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 28, width: '100%', maxWidth: 550, boxShadow: '0 25px 50px -12px rgba(2,6,23,0.18)', overflow: 'hidden' },
    modalHeader: { padding: '1.5rem 2rem', borderBottom: '1px solid var(--app-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalBody: { padding: '2rem', maxHeight: '70vh', overflowY: 'auto' },
    modalFooter: { padding: '1.5rem 2rem', background: 'var(--app-bg-muted)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' },
    closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 },
    inputLabel: { display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: 8, letterSpacing: '0.05em' },
    input: { width: '100%', background: 'var(--app-bg)', border: '1px solid var(--app-border)', borderRadius: 12, padding: '12px 16px', color: 'var(--app-text)', fontSize: '1rem', outline: 'none' },
    textarea: { width: '100%', background: 'var(--app-bg)', border: '1px solid var(--app-border)', borderRadius: 12, padding: '12px 16px', color: 'var(--app-text)', fontSize: '1rem', outline: 'none', minHeight: 100, resize: 'vertical' },
    cancelBtn: { padding: '12px 24px', borderRadius: 12, border: 'none', background: 'transparent', color: '#334155', fontWeight: 700, cursor: 'pointer' },
    saveBtn: { padding: '12px 28px', borderRadius: 12, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
};
