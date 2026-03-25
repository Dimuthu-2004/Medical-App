import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Users, ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle,
    Search, Activity, LogOut, PlusCircle, AlertCircle, User, Stethoscope, FileText, ShieldAlert, X, Pill, Loader2,
    Plus, Edit2, Trash2, Download, ShieldCheck, Eye
} from 'lucide-react';
import api from '../services/api';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const toLocalISODate = (d = new Date()) => {
    // YYYY-MM-DD in local time (avoids UTC off-by-one around midnight).
    const tzOffsetMs = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
};

const isBeforeLocalToday = (dateStr) => {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return false;

    const date = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date < today;
};

const STATUS_COLORS = {
    PENDING: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', label: 'Pending' },
    CONFIRMED: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Confirmed' },
    COMPLETED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Completed' },
    CANCELLED: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Cancelled' },
};
const HISTORY_MODAL_Z_INDEX = 1300;

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

export default function DoctorDashboard() {
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(toLocalISODate());
    const [calendarView, setCalendarView] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth()
    });
    // Unavailability calendar: { 'YYYY-MM-DD': { MORNING: true, EVENING: true } }
    const [unavailabilityByDate, setUnavailabilityByDate] = useState({});
    const [unavailabilityLoading, setUnavailabilityLoading] = useState(false);
    const [unavailabilitySaving, setUnavailabilitySaving] = useState(false);
    const [tokensForDate, setTokensForDate] = useState([]);
    const [loadingTokens, setLoadingTokens] = useState(false);
    const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'prescriptions'
    const [available, setAvailable] = useState(true);
    const [toggling, setToggling] = useState(false);

    // Prescription states
    const [prescriptions, setPrescriptions] = useState([]);
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
    const [currentPrescription, setCurrentPrescription] = useState(null);
    const [prescriptionSearch, setPrescriptionSearch] = useState('');
    const [prescriptionForm, setPrescriptionForm] = useState({
        patientId: '',
        items: [{ drugName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        notes: ''
    });
    const [searchQ, setSearchQ] = useState('');

    // Drug Interaction Modal state
    const [drugModal, setDrugModal] = useState({ open: false });
    const [drugForm, setDrugForm] = useState({ drug1: '', drug2: '' });
    const [drugResult, setDrugResult] = useState(null);
    const [checkingDrug, setCheckingDrug] = useState(false);
    const [suggestions, setSuggestions] = useState({ drug1: [], drug2: [] });
    const [suggestionLoading, setSuggestionLoading] = useState({ drug1: false, drug2: false });
    const [showSuggestions, setShowSuggestions] = useState({ drug1: false, drug2: false });
    const suggestTimers = useRef({});
    const suggestRefs = useRef({});

    // Treatment Modal state
    const [treatmentModal, setTreatmentModal] = useState({ open: false, appt: null });
    const [savingTreatment, setSavingTreatment] = useState(false);
    const [treatmentForm, setTreatmentForm] = useState({
        diagnosis: '', notes: '',
        weight: '', systolicBP: '', diastolicBP: '', temperature: '', heartRate: ''
    });
    const [includeVitals, setIncludeVitals] = useState(false);

    // Patient history modal (opened by clicking an appointment in the queue)
    const [historyModal, setHistoryModal] = useState({
        open: false,
        token: null,
        loading: false,
        error: null,
        data: null,
        prescriptions: [],
    });

    useEffect(() => {
        console.log("DEBUG: DoctorDashboard v2.1 (Prescription CRUD) Loaded");
        fetchDashboard();
    }, []);

    useEffect(() => {
        fetchTokensForDate(selectedDate);
    }, [selectedDate]);

    const fetchDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("DEBUG: Fetching doctor dashboard...");
            const res = await api.get('/api/doctor/dashboard');
            console.log("DEBUG: Dashboard response data:", res.data);

            if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE html>')) {
                throw new Error("Received HTML instead of JSON. Possible session timeout or redirect.");
            }

            setDashData(res.data);
            if (res.data.doctorProfile) {
                setAvailable(res.data.doctorProfile.available);
            }
            // preload today's tokens
            setTokensForDate(res.data.todayTokens || []);

            // Fetch prescriptions
            const presRes = await api.get('/api/prescriptions');
            setPrescriptions(presRes.data || []);
        } catch (e) {
            console.error("DEBUG: Dashboard fetch error:", e);
            setError(e.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const openPatientHistory = async (token) => {
        if (!token?.patientId) {
            alert('Patient profile is missing for this appointment.');
            return;
        }

        setHistoryModal({ open: true, token, loading: true, error: null, data: null, prescriptions: [] });
        try {
            const [recordsRes, prescRes] = await Promise.all([
                api.get(`/api/medical-records/patient/${token.patientId}`),
                api.get(`/api/prescriptions/patient/${token.patientId}`),
            ]);
            setHistoryModal(m => ({ ...m, loading: false, data: recordsRes.data, prescriptions: prescRes.data || [] }));
        } catch (e) {
            const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to load patient history';
            setHistoryModal(m => ({ ...m, loading: false, error: msg }));
        }
    };

    const handleToggleAvailability = async () => {
        setToggling(true);
        try {
            const res = await api.patch('/api/doctor/availability', { available: !available });
            setAvailable(res.data.available);
        } catch (e) {
            const msg = e.response?.data?.error || 'Error updating availability';
            alert(msg);
        } finally {
            setToggling(false);
        }
    };

    const fetchTokensForDate = async (date) => {
        setLoadingTokens(true);
        try {
            const res = await api.get(`/api/doctor/tokens?date=${date}`);
            setTokensForDate(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingTokens(false);
        }
    };

    const fetchUnavailabilityForMonth = async (view) => {
        const year = view.year;
        const month = view.month;
        const mm = String(month + 1).padStart(2, '0');
        const lastDay = new Date(year, month + 1, 0).getDate();
        const fromStr = `${year}-${mm}-01`;
        const toStr = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;

        setUnavailabilityLoading(true);
        try {
            const res = await api.get('/api/doctor/unavailability', { params: { from: fromStr, to: toStr } });
            const list = Array.isArray(res.data) ? res.data : [];
            const map = {};
            for (const item of list) {
                const d = item?.date;
                const st = (item?.sessionType || '').toString().toUpperCase();
                if (!d || !st) continue;
                if (!map[d]) map[d] = {};
                map[d][st] = true;
            }
            setUnavailabilityByDate(map);
        } catch (e) {
            console.error(e);
        } finally {
            setUnavailabilityLoading(false);
        }
    };

    useEffect(() => {
        fetchUnavailabilityForMonth(calendarView);
    }, [calendarView.year, calendarView.month]);

    const setSessionUnavailable = async (dateStr, sessionType, shouldBeUnavailable) => {
        if (!dateStr || !sessionType) return;
        if (isBeforeLocalToday(dateStr)) {
            alert('You can only edit availability for today or future dates.');
            return;
        }

        setUnavailabilitySaving(true);
        try {
            if (shouldBeUnavailable) {
                await api.post('/api/doctor/unavailability', { date: dateStr, sessionType });
            } else {
                await api.delete('/api/doctor/unavailability', { params: { date: dateStr, sessionType } });
            }
            // Refresh month map (keeps UI consistent even if server dedupes).
            await fetchUnavailabilityForMonth(calendarView);
        } catch (e) {
            const msg = e?.response?.data?.error || 'Failed to update unavailability.';
            alert(msg);
        } finally {
            setUnavailabilitySaving(false);
        }
    };

    const handleStartTreatment = (appt) => {
        setTreatmentForm({
            diagnosis: '', notes: '',
            weight: '', systolicBP: '', diastolicBP: '', temperature: '', heartRate: ''
        });
        setIncludeVitals(false);
        setTreatmentModal({ open: true, appt });
    };

    const handleSaveAndComplete = async () => {
        setSavingTreatment(true);
        const { appt } = treatmentModal;
        try {
            if (!treatmentForm.diagnosis || !treatmentForm.diagnosis.trim()) {
                alert('Diagnosis is required.');
                return;
            }
            // 1. Save Medical Record
            await api.post('/api/medical-records/save', {
                patientId: appt.patientId,
                diagnosis: treatmentForm.diagnosis,
                notes: treatmentForm.notes
            });

            // 2. Save Vitals
            if (includeVitals) {
                const payload = {
                    patientId: appt.patientId,
                    weight: treatmentForm.weight ? parseFloat(treatmentForm.weight) : null,
                    systolicBP: treatmentForm.systolicBP ? parseInt(treatmentForm.systolicBP) : null,
                    diastolicBP: treatmentForm.diastolicBP ? parseInt(treatmentForm.diastolicBP) : null,
                    temperature: treatmentForm.temperature ? parseFloat(treatmentForm.temperature) : null,
                    heartRate: treatmentForm.heartRate ? parseInt(treatmentForm.heartRate) : null
                };
                const allEmpty = Object.entries(payload).every(([k, v]) => k === 'patientId' || v == null);
                if (!allEmpty) {
                    await api.post('/api/vitals/save', payload);
                }
            }

            // 3. Mark Appointment as Completed
            await api.post(`/api/doctor/complete/${appt.id}`);

            setTreatmentModal({ open: false, appt: null });
            fetchTokensForDate(selectedDate);
            alert('Treatment saved and appointment completed!');
        } catch (e) {
            console.error(e);
            alert('Error saving treatment. Please check fields.');
        } finally {
            setSavingTreatment(false);
        }
    };

    const handlePrescriptionSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!prescriptionForm.patientId) {
            alert('Please select a patient.');
            return;
        }

        const cleanedItems = (prescriptionForm.items || [])
            .map(it => ({
                drugName: (it.drugName || '').trim(),
                dosage: (it.dosage || '').trim(),
                frequency: (it.frequency || '').trim(),
                duration: (it.duration || '').trim(),
                instructions: (it.instructions || '').trim(),
            }))
            .filter(it => it.drugName);

        if (cleanedItems.length === 0) {
            alert('Please add at least one drug.');
            return;
        }

        try {
            const payload = { ...prescriptionForm, items: cleanedItems };
            if (currentPrescription) {
                await api.put(`/api/prescriptions/${currentPrescription.id}`, payload);
                alert("Prescription updated successfully!");
            } else {
                await api.post('/api/prescriptions/save', payload);
                alert("Prescription saved successfully!");
            }
            setIsPrescriptionModalOpen(false);
            fetchDashboard();
        } catch (err) {
            console.error(err);
            alert("Error saving prescription.");
        }
    };

    const updatePrescriptionItem = (index, field, value) => {
        setPrescriptionForm(f => ({
            ...f,
            items: (f.items || []).map((it, i) => (i === index ? { ...it, [field]: value } : it)),
        }));
    };

    const addPrescriptionItem = () => {
        setPrescriptionForm(f => ({
            ...f,
            items: [...(f.items || []), { drugName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        }));
    };

    const removePrescriptionItem = (index) => {
        setPrescriptionForm(f => {
            const items = (f.items || []).filter((_, i) => i !== index);
            return { ...f, items: items.length ? items : [{ drugName: '', dosage: '', frequency: '', duration: '', instructions: '' }] };
        });
    };

    const handleDeletePrescription = async (id) => {
        if (!window.confirm("Delete this prescription?")) return;
        try {
            await api.delete(`/api/prescriptions/${id}`);
            fetchDashboard();
        } catch (err) {
            console.error(err);
        }
    };

    const downloadPrescription = (id) => {
        // Fix protocol-relative URL issue (baseURL is '/' so it becomes '//api')
        const url = api.defaults.baseURL === '/' ? `/api/prescriptions/${id}/pdf` : `${api.defaults.baseURL}/api/prescriptions/${id}/pdf`;
        window.open(url, '_blank');
    };

    const fetchSuggestions = useCallback((field, value) => {
        clearTimeout(suggestTimers.current[field]);
        if (!value || value.trim().length < 2) {
            setSuggestions(s => ({ ...s, [field]: [] }));
            setShowSuggestions(s => ({ ...s, [field]: false }));
            return;
        }
        setSuggestionLoading(s => ({ ...s, [field]: true }));
        suggestTimers.current[field] = setTimeout(async () => {
            try {
                const res = await api.get('/api/drugs/suggest', { params: { q: value.trim() } });
                setSuggestions(s => ({ ...s, [field]: res.data || [] }));
                setShowSuggestions(s => ({ ...s, [field]: (res.data || []).length > 0 }));
            } catch { setSuggestions(s => ({ ...s, [field]: [] })); }
            finally { setSuggestionLoading(s => ({ ...s, [field]: false })); }
        }, 280);
    }, []);

    const handleDrugInput = (field, value) => {
        setDrugForm(f => ({ ...f, [field]: value }));
        fetchSuggestions(field, value);
    };

    const handleSuggestionSelect = (field, name) => {
        setDrugForm(f => ({ ...f, [field]: name }));
        setShowSuggestions(s => ({ ...s, [field]: false }));
        setSuggestions(s => ({ ...s, [field]: [] }));
    };

    const handleCheckInteraction = async () => {
        if (!drugForm.drug1.trim() || !drugForm.drug2.trim()) return;
        setShowSuggestions({ drug1: false, drug2: false });
        setCheckingDrug(true);
        setDrugResult(null);
        try {
            const res = await api.get('/api/prescriptions/check-interaction', {
                params: { drug1: drugForm.drug1.trim(), drug2: drugForm.drug2.trim() }
            });
            setDrugResult(res.data);
        } catch (e) {
            setDrugResult({
                drug1: drugForm.drug1, drug2: drugForm.drug2,
                severity: 'UNKNOWN', status: 'ERROR',
                description: e.response?.data?.description || 'Failed to reach interaction API. Check server.'
            });
        } finally {
            setCheckingDrug(false);
        }
    };

    const handleComplete = async (id) => {
        try {
            await api.post(`/api/doctor/complete/${id}`);
            fetchTokensForDate(selectedDate);
        } catch (e) { alert('Error completing appointment'); }
    };

    const filteredPatients = useMemo(() => {
        if (!dashData?.patients) return [];
        if (!searchQ.trim()) return dashData.patients;
        return dashData.patients.filter(p =>
            p.name.toLowerCase().includes(searchQ.toLowerCase())
        );
    }, [dashData, searchQ]);

    // Calendar helpers
    const tokenDateSet = useMemo(() => {
        if (!dashData?.tokensByDate) return new Set();
        return new Set(Object.keys(dashData.tokensByDate));
    }, [dashData]);

    const daysInMonth = useMemo(() => {
        const { year, month } = calendarView;
        const firstDay = new Date(year, month, 1).getDay();
        const daysCount = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysCount; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({ day: d, dateStr });
        }
        return cells;
    }, [calendarView]);

    const prevMonth = () => setCalendarView(v => {
        const d = new Date(v.year, v.month - 1, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
    });
    const nextMonth = () => setCalendarView(v => {
        const d = new Date(v.year, v.month + 1, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    if (loading) return <LoadingSkeleton />;
    if (error) return (
        <div style={{ ...S.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', background: '#fef2f2', padding: '2rem', borderRadius: 24, border: '1px solid #fecaca' }}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
                <h2 style={{ color: '#0f172a', margin: '0 0 8px' }}>Dashboard Error</h2>
                <p style={{ color: '#64748b', margin: '0 0 24px' }}>{error}</p>
                <button onClick={fetchDashboard} style={S.tabActive}>Try Again</button>
            </div>
        </div>
    );

    const today = toLocalISODate();

    return (
        <div style={S.container}>
            <div style={S.wrapper}>
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={S.header}
                >
                    <div>
                        <h1 style={S.title}>Doctor Dashboard</h1>
                        <p style={S.subtitle}>Manage your queue and patient records</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* Drug Interaction Check Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setDrugResult(null); setDrugForm({ drug1: '', drug2: '' }); setDrugModal({ open: true }); }}
                            style={S.drugBtn}
                            title="AI Drug Interaction Check"
                        >
                            <ShieldAlert size={18} />
                            Drug Interaction
                        </motion.button>
                        <a href="/logout" style={S.logoutBtn}><LogOut size={18} /> Logout</a>
                    </div>
                </motion.header>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={S.statsRow}
                >
                    <StatCard icon={<Users size={22} />} label="Total Patients" value={dashData?.patients?.length ?? 0} color="#3b82f6" delay={0.1} />
                    <StatCard icon={<Calendar size={22} />} label="Today's Tokens" value={dashData?.todayTokens?.length ?? 0} color="#10b981" delay={0.2} />
                    <StatCard
                        icon={<CheckCircle size={22} />}
                        label="Completed Today"
                        value={dashData?.todayTokens?.filter(t => t.status === 'COMPLETED').length ?? 0}
                        color="#8b5cf6"
                        delay={0.3}
                    />
                </motion.div>

                {/* Tabs */}
                <div style={S.tabs}>
                    {[['calendar', 'Queue Calendar'], ['prescriptions', 'Digital Prescriptions'], ['medical-records', 'Medical Records']].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            style={{ ...S.tab, ...(activeTab === key ? S.tabActive : {}) }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'calendar' && (
                        <motion.div key="cal" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={S.twoCol}>
                            {/* Calendar */}
                            <div style={S.calendarCard}>
                                <div style={S.calHeader}>
                                    <button onClick={prevMonth} style={S.calNavBtn}><ChevronLeft size={20} /></button>
                                    <span style={S.calMonthTitle}>{MONTHS[calendarView.month]} {calendarView.year}</span>
                                    <button onClick={nextMonth} style={S.calNavBtn}><ChevronRight size={20} /></button>
                                </div>
                                <div style={S.calGrid}>
                                    {DAYS.map(d => <div key={d} style={S.calDayLabel}>{d}</div>)}
                                    {daysInMonth.map((cell, idx) => {
                                        if (!cell) return <div key={`e-${idx}`} />;
                                        const isToday = cell.dateStr === today;
                                        const isSelected = cell.dateStr === selectedDate;
                                        const hasTokens = tokenDateSet.has(cell.dateStr);
                                        const unavail = unavailabilityByDate[cell.dateStr] || null;
                                        const unavailCount = unavail ? (unavail.MORNING ? 1 : 0) + (unavail.EVENING ? 1 : 0) : 0;
                                        return (
                                            <motion.button
                                                key={cell.dateStr}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedDate(cell.dateStr)}
                                                style={{
                                                    ...S.calCell,
                                                    ...(isSelected ? S.calCellSelected : {}),
                                                    ...(isToday && !isSelected ? S.calCellToday : {}),
                                                }}
                                            >
                                                {cell.day}
                                                {(hasTokens || unavailCount > 0) && (
                                                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 2 }}>
                                                        {hasTokens && (
                                                            <div style={{
                                                                ...S.dotIndicator,
                                                                background: isSelected ? '#fff' : '#10b981'
                                                            }} />
                                                        )}
                                                        {unavailCount > 0 && (
                                                            <div style={{
                                                                ...S.dotIndicator,
                                                                background: unavailCount === 2 ? '#ef4444' : '#f97316'
                                                            }} />
                                                        )}
                                                    </div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tokens for selected date */}
                            <div style={S.tokensCard}>
                                <div style={S.tokensHeader}>
                                    <Clock size={20} color="#10b981" />
                                    <span style={S.tokensTitle}>
                                        Queue: {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>

                                {/* Unavailability controls for the selected day */}
                                <div style={S.unavailBox}>
                                    <div style={S.unavailHeader}>
                                        <div style={{ fontWeight: 900, color: '#0f172a' }}>Session blocks</div>
                                    </div>
                                    {unavailabilityLoading ? (
                                        <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.85rem' }}>Loading schedule...</div>
                                    ) : (
                                        <div style={S.unavailRow}>
                                            {(() => {
                                                const u = unavailabilityByDate[selectedDate] || {};
                                                const morningBlocked = !!u.MORNING;
                                                const eveningBlocked = !!u.EVENING;
                                                const isPast = isBeforeLocalToday(selectedDate);
                                                return (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={isPast || unavailabilitySaving}
                                                            onClick={() => setSessionUnavailable(selectedDate, 'MORNING', !morningBlocked)}
                                                            style={{
                                                                ...S.unavailBtn,
                                                                ...(morningBlocked ? S.unavailBtnBlocked : S.unavailBtnFree)
                                                            }}
                                                            title={isPast ? 'Cannot edit past dates' : (morningBlocked ? 'Unblock Morning' : 'Block Morning')}
                                                        >
                                                            Morning
                                                            <span style={{ fontWeight: 900 }}>{morningBlocked ? 'Unavailable' : 'Available'}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isPast || unavailabilitySaving}
                                                            onClick={() => setSessionUnavailable(selectedDate, 'EVENING', !eveningBlocked)}
                                                            style={{
                                                                ...S.unavailBtn,
                                                                ...(eveningBlocked ? S.unavailBtnBlocked : S.unavailBtnFree)
                                                            }}
                                                            title={isPast ? 'Cannot edit past dates' : (eveningBlocked ? 'Unblock Evening' : 'Block Evening')}
                                                        >
                                                            Evening
                                                            <span style={{ fontWeight: 900 }}>{eveningBlocked ? 'Unavailable' : 'Available'}</span>
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 10, fontWeight: 700 }}>
                                        Blocks apply only to the selected date.
                                    </div>
                                </div>

                                {loadingTokens ? (
                                    <div style={S.loadingRow}>Loading...</div>
                                ) : tokensForDate.length === 0 ? (
                                    <div style={S.emptyTokens}>
                                        <Calendar size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                                        <p style={{ color: '#64748b', margin: 0 }}>No appointments on this date</p>
                                    </div>
                                ) : (
                                    <div style={S.tokenList}>
                                        <AnimatePresence>
                                            {tokensForDate.map((t, i) => {
                                                const sc = STATUS_COLORS[t.status] || STATUS_COLORS.PENDING;
                                                return (
                                                    <motion.div
                                                        key={t.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        onClick={() => openPatientHistory(t)}
                                                        style={{ ...S.tokenRow, cursor: 'pointer' }}
                                                    >
                                                        <div style={S.tokenNum}>#{t.tokenNumber ?? '?'}</div>
                                                        <div style={S.tokenInfo}>
                                                            <div style={S.tokenPatient}>{t.patientName}</div>
                                                            <div style={S.tokenSession}>{t.sessionType ?? 'N/A'}</div>
                                                        </div>
                                                        <div style={{ ...S.statusBadge, background: sc.bg, color: sc.color }}>
                                                            {sc.label}
                                                        </div>
                                                        {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={(e) => { e.stopPropagation(); handleStartTreatment(t); }}
                                                                style={S.completeBtn}
                                                            >
                                                                <Stethoscope size={14} /> Start
                                                            </motion.button>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'prescriptions' && (
                        <motion.div key="prescriptions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={S.patientsCard}>
                            <div style={{ ...S.headerRow, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={S.sectionTitle}>Digital Prescriptions</h2>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={S.searchWrap}>
                                        <Search size={18} style={{ ...S.searchIcon, position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input
                                            type="text"
                                            placeholder="Search prescriptions..."
                                            style={S.searchInput}
                                            value={prescriptionSearch}
                                            onChange={(e) => setPrescriptionSearch(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCurrentPrescription(null);
                                            setPrescriptionForm({
                                                patientId: '',
                                                items: [{ drugName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
                                                notes: ''
                                            });
                                            setSearchQ('');
                                            setIsPrescriptionModalOpen(true);
                                        }}
                                        style={S.saveBtn}
                                    >
                                        <Plus size={18} /> New Prescription
                                    </button>
                                </div>
                            </div>

                            <div style={S.patientTable}>
                                {prescriptions
                                    .filter(p => {
                                        const q = (prescriptionSearch || '').toLowerCase();
                                        const meds = ((p.items && p.items.length) ? p.items.map(it => it?.drugName || '').join(' ') : (p.medication || ''));
                                        const patient = p.patient?.name || '';
                                        return meds.toLowerCase().includes(q) || patient.toLowerCase().includes(q);
                                    }).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No prescriptions found</div>
                                ) : prescriptions
                                    .filter(p => {
                                        const q = (prescriptionSearch || '').toLowerCase();
                                        const meds = ((p.items && p.items.length) ? p.items.map(it => it?.drugName || '').join(' ') : (p.medication || ''));
                                        const patient = p.patient?.name || '';
                                        return meds.toLowerCase().includes(q) || patient.toLowerCase().includes(q);
                                    })
                                    .map((p, i) => (
                                        <motion.div
                                            key={p.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            style={{ ...S.patientRow, display: 'flex', justifyContent: 'space-between' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                <div style={{ ...S.patientAvatar, background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                                                    <FileText size={18} />
                                                </div>
                                                <div style={S.patientInfo}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={S.patientName}>{(p.items && p.items.length ? (p.items[0]?.drugName || p.medication) : p.medication) || 'Prescription'}</span>
                                                        <span style={{ fontSize: '0.7rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 6 }}>
                                                            {p.items && p.items.length ? (p.items[0]?.dosage || ' ') : (p.dosage || ' ')}
                                                        </span>
                                                        {p.items && p.items.length > 1 && (
                                                            <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
                                                                +{p.items.length - 1} more
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={S.patientMeta}>
                                                        Patient: {p.patient?.name || 'Unknown'} - {p.items && p.items.length ? `${p.items.length} drugs` : (p.frequency || 'N/A')} - {p.date || 'N/A'}
                                                      </span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button onClick={() => downloadPrescription(p.id)} style={{ ...S.completeBtn, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }} title="Download PDF">
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCurrentPrescription(p);
                                                        setPrescriptionForm({
                                                            patientId: p.patient.id,
                                                            items: (p.items && p.items.length)
                                                                ? p.items.map(it => ({
                                                                    drugName: it.drugName || '',
                                                                    dosage: it.dosage || '',
                                                                    frequency: it.frequency || '',
                                                                    duration: it.duration || '',
                                                                    instructions: it.instructions || ''
                                                                }))
                                                                : [{ drugName: p.medication || '', dosage: p.dosage || '', frequency: p.frequency || '', duration: p.duration || '', instructions: p.instructions || '' }],
                                                            notes: p.notes || ''
                                                        });
                                                        setIsPrescriptionModalOpen(true);
                                                    }}
                                                    style={{ ...S.completeBtn, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeletePrescription(p.id)} style={{ ...S.completeBtn, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }} title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'medical-records' && (
                        <motion.div key="medical-records" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={S.patientsCard}>
                            <div style={{ ...S.headerRow, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={S.sectionTitle}>Medical Records</h2>
                                <div style={S.searchWrap}>
                                    <Search size={18} style={{ ...S.searchIcon, position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                    <input
                                        type="text"
                                        placeholder="Search patients..."
                                        style={S.searchInput}
                                        value={searchQ}
                                        onChange={(e) => setSearchQ(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div style={S.patientTable}>
                                {filteredPatients.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No patients found</div>
                                ) : filteredPatients.map((p, i) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        style={{ ...S.patientRow, cursor: 'pointer' }}
                                        onClick={() => openPatientHistory({ patientId: p.id, patientName: p.name })}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                            <div style={{ ...S.patientAvatar, background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                                                <User size={18} />
                                            </div>
                                            <div style={S.patientInfo}>
                                                <div style={S.patientName}>{p.name}</div>
                                                <div style={S.patientMeta}>ID: {p.id}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Patient History Modal */}
                <AnimatePresence>
                    {historyModal.open && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ ...S.modalOverlay, zIndex: HISTORY_MODAL_Z_INDEX }}
                            onClick={() => setHistoryModal({ open: false, token: null, loading: false, error: null, data: null, prescriptions: [] })}
                        >
                            <motion.div
                                initial={{ scale: 0.92, y: 24 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.92, y: 24 }}
                                style={{ ...S.modalBox, maxWidth: 980, position: 'relative', zIndex: HISTORY_MODAL_Z_INDEX + 1 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 900 }}>Patient History</h3>
                                        <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 6 }}>
                                            {historyModal.token?.patientName || 'Unknown'} {historyModal.token?.tokenNumber != null ? `- Token #${historyModal.token.tokenNumber}` : ''}
                                          </div>
                                    </div>
                                    <button
                                        onClick={() => setHistoryModal({ open: false, token: null, loading: false, error: null, data: null, prescriptions: [] })}
                                        style={{ ...S.completeBtn, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                                        title="Close"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {historyModal.loading ? (
                                    <div style={{ padding: '1.25rem', color: '#64748b' }}>Loading history...</div>
                                ) : historyModal.error ? (
                                    <div style={{ padding: '1.25rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16, color: '#9a3412', fontWeight: 700 }}>
                                        {historyModal.error}
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.25rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                    <div style={{ fontWeight: 900, color: '#0f172a' }}>Profile</div>
                                                    {historyModal.data?.patient?.id && (
                                                        <Link to={`/medical-records/patient/${historyModal.data.patient.id}`} style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>
                                                            Open full record
                                                        </Link>
                                                    )}
                                                </div>
                                                <div style={{ color: '#334155', fontWeight: 700 }}>{historyModal.data?.patient?.name || historyModal.token?.patientName}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 6 }}>
                                                    Allergies: {historyModal.data?.patient?.allergies || 'N/A'}<br />
                                                    Chronic: {historyModal.data?.patient?.chronicConditions || 'N/A'}
                                                </div>
                                            </div>

                                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1rem' }}>
                                                <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Recent Consultations</div>
                                                {(historyModal.data?.consultations || []).slice(0, 4).map((c) => (
                                                    <div key={c.id || c.appointmentId} style={{ padding: '10px 12px', border: '1px solid #f1f5f9', borderRadius: 14, background: '#f8fafc', marginBottom: 10 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                                            <div style={{ color: '#0f172a', fontWeight: 800 }}>{c.chiefComplaint || 'Consultation'}</div>
                                                            <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>{c.date || 'N/A'}</div>
                                                        </div>
                                                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 6 }}>
                                                            Diagnosis: {c.diagnosis || 'N/A'}
                                                        </div>
                                                    </div>
                                                ))}
                                                {(historyModal.data?.consultations || []).length === 0 && (
                                                    <div style={{ color: '#64748b' }}>No consultations yet.</div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1rem' }}>
                                                <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Vitals (Latest)</div>
                                                {(() => {
                                                    const latest = (historyModal.data?.vitals || [])[0];
                                                    if (!latest) return <div style={{ color: '#64748b' }}>No vitals recorded.</div>;
                                                    return (
                                                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                            Recorded: {latest.recordedAt || 'N/A'}<br />
                                                            Weight: {latest.weight ?? 'N/A'}<br />
                                                            BP: {latest.systolicBP ?? 'N/A'}/{latest.diastolicBP ?? 'N/A'}<br />
                                                            Temp: {latest.temperature ?? 'N/A'}<br />
                                                            HR: {latest.heartRate ?? 'N/A'}
                                                        </div>
                                                    );
                                                })()}
                                                {historyModal.data?.patient?.id && (
                                                    <div style={{ marginTop: 12 }}>
                                                        <Link to={`/vitals/patient/${historyModal.data.patient.id}`} style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>
                                                            View trends
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1rem' }}>
                                                <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Recent Prescriptions</div>
                                                {(historyModal.prescriptions || []).slice(0, 4).map((p) => (
                                                    <div key={p.id} style={{ padding: '10px 12px', border: '1px solid #f1f5f9', borderRadius: 14, background: '#f8fafc', marginBottom: 10 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                                            <div style={{ color: '#0f172a', fontWeight: 800 }}>{p.medication || 'Prescription'}</div>
                                                            <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>{p.date || 'N/A'}</div>
                                                        </div>
                                                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 6 }}>
                                                            {p.dosage ? `${p.dosage} - ` : ''}{p.frequency || ''}{p.duration ? ` - ${p.duration}` : ''}
                                                          </div>
                                                    </div>
                                                ))}
                                                {(historyModal.prescriptions || []).length === 0 && (
                                                    <div style={{ color: '#64748b' }}>No prescriptions yet.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Drug Interaction Modal */}
                <AnimatePresence>
                    {drugModal.open && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={S.modalOverlay}
                        >
                            <motion.div
                                initial={{ scale: 0.92, y: 24 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.92, y: 24 }}
                                style={{ ...S.modalBox, maxWidth: 520 }}
                            >
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <ShieldAlert size={22} color="#f59e0b" />
                                        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.15rem', fontWeight: 800 }}>AI Drug Interaction Check</h3>
                                    </div>
                                    <button onClick={() => setDrugModal({ open: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Inputs */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                                    {['drug1', 'drug2'].map((field, i) => (
                                        <div key={field} style={{ position: 'relative' }} ref={el => suggestRefs.current[field] = el}>
                                            <div style={{ position: 'relative' }}>
                                                {suggestionLoading[field]
                                                    ? <Loader2 size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', animation: 'spin 0.8s linear infinite' }} />
                                                    : <Pill size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: drugForm[field] ? '#f59e0b' : '#475569' }} />}
                                                <input
                                                    placeholder={`Drug ${i + 1} name (e.g. ${i === 0 ? 'Aspirin' : 'Warfarin'})`}
                                                    value={drugForm[field]}
                                                    onChange={e => handleDrugInput(field, e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleCheckInteraction(); } }}
                                                    onFocus={() => suggestions[field].length > 0 && setShowSuggestions(s => ({ ...s, [field]: true }))}
                                                    onBlur={() => setTimeout(() => setShowSuggestions(s => ({ ...s, [field]: false })), 160)}
                                                    autoComplete="off"
                                                    style={{ width: '100%', background: '#f8fafc', border: `1px solid ${showSuggestions[field] ? '#f59e0b' : '#e2e8f0'}`, borderRadius: showSuggestions[field] ? '10px 10px 0 0' : 10, padding: '12px 14px 12px 40px', color: '#1e293b', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, border-radius 0.15s' }}
                                                />
                                            </div>
                                            <AnimatePresence>
                                                {showSuggestions[field] && suggestions[field].length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        transition={{ duration: 0.14 }}
                                                        style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 10px 10px', zIndex: 50, overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                                    >
                                                        {suggestions[field].map((name, idx) => (
                                                            <motion.div
                                                                key={name + idx}
                                                                whileHover={{ background: '#f8fafc' }}
                                                                onMouseDown={() => handleSuggestionSelect(field, name)}
                                                                style={{ padding: '10px 14px 10px 40px', color: '#1e293b', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, borderBottom: idx < suggestions[field].length - 1 ? '1px solid #f1f5f9' : 'none', position: 'relative' }}
                                                            >
                                                                <Pill size={13} style={{ position: 'absolute', left: 14, color: '#475569' }} />
                                                                {name}
                                                            </motion.div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCheckInteraction}
                                        disabled={checkingDrug || !drugForm.drug1.trim() || !drugForm.drug2.trim()}
                                        style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: checkingDrug ? 0.7 : 1 }}
                                    >
                                        {checkingDrug ? <><div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Checking...</> : <><ShieldAlert size={16} /> Check Interaction</>}
                                    </motion.button>
                                </div>

                                {/* Results */}
                                <AnimatePresence>
                                    {drugResult && (() => {
                                        const sevColor = {
                                            SEVERE: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#f87171', badge: '#ef4444' },
                                            MODERATE: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24', badge: '#f59e0b' },
                                            MILD: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399', badge: '#10b981' },
                                            NONE: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#34d399', badge: '#10b981' },
                                        }[drugResult.severity] || { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8', badge: '#64748b' };
                                        return (
                                            <motion.div
                                                key="result"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                style={{ background: sevColor.bg, border: `1px solid ${sevColor.border}`, borderRadius: 12, padding: 20 }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{drugResult.drug1} &lt;-&gt; {drugResult.drug2}</span>
                                                    <span style={{ background: sevColor.badge, color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        {drugResult.severity}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, color: sevColor.text, fontSize: '0.88rem', lineHeight: 1.55 }}>{drugResult.description}</p>
                                                {drugResult.status === 'NO_INTERACTION' && (
                                                    <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '0.78rem', fontStyle: 'italic' }}>Source: NLM RxNav API - always verify with clinical guidelines.</p>
                                                )}
                                            </motion.div>
                                        );
                                    })()}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Treatment Modal */}
                <AnimatePresence>
                    {treatmentModal.open && (
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
                                style={S.modalContent}
                            >
                                <div style={S.modalHeader}>
                                    <div style={S.tokenNum}>#{treatmentModal.appt?.tokenNumber}</div>
                                    <div style={{ flex: 1, marginLeft: 16 }}>
                                        <h2 style={{ margin: 0, color: '#0f172a' }}>
                                            Treat:{' '}
                                            {treatmentModal.appt?.patientId ? (
                                                <button
                                                    type="button"
                                                    onClick={() => openPatientHistory(treatmentModal.appt)}
                                                    style={S.patientNameLink}
                                                    title="Open full patient history"
                                                >
                                                    {treatmentModal.appt?.patientName}
                                                </button>
                                            ) : (
                                                treatmentModal.appt?.patientName
                                            )}
                                        </h2>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Record session details and vitals</p>
                                    </div>
                                    <button onClick={() => setTreatmentModal({ open: false, appt: null })} style={S.closeBtn}>X</button>
                                </div>

                                <div style={S.modalBody}>
                                    <div style={S.modalCol}>
                                        <h3 style={S.sectionTitle}><FileText size={18} /> Medical Record</h3>
                                        <div style={S.fieldGrid}>
                                            <InputField label="Diagnosis" value={treatmentForm.diagnosis} onChange={v => setTreatmentForm({ ...treatmentForm, diagnosis: v })} placeholder="e.g. Common Cold" />
                                            <InputField label="Notes" value={treatmentForm.notes} onChange={v => setTreatmentForm({ ...treatmentForm, notes: v })} placeholder="Internal clinical notes" textarea />
                                        </div>
                                    </div>
                                    <div style={S.modalCol}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={S.sectionTitle}><Activity size={18} /> Patient Vitals</h3>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#475569', fontSize: '0.85rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={includeVitals}
                                                    onChange={(e) => setIncludeVitals(e.target.checked)}
                                                />
                                                <span>Include</span>
                                            </label>
                                        </div>
                                        <div style={S.vitalInputGrid}>
                                            <InputField label="Weight (kg)" value={treatmentForm.weight} onChange={v => setTreatmentForm({ ...treatmentForm, weight: v })} type="number" disabled={!includeVitals} />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <InputField label="Systolic BP" value={treatmentForm.systolicBP} onChange={v => setTreatmentForm({ ...treatmentForm, systolicBP: v })} type="number" disabled={!includeVitals} />
                                                <InputField label="Diastolic BP" value={treatmentForm.diastolicBP} onChange={v => setTreatmentForm({ ...treatmentForm, diastolicBP: v })} type="number" disabled={!includeVitals} />
                                            </div>
                                            <InputField label="Temp (C)" value={treatmentForm.temperature} onChange={v => setTreatmentForm({ ...treatmentForm, temperature: v })} type="number" disabled={!includeVitals} />
                                            <InputField label="Heart Rate" value={treatmentForm.heartRate} onChange={v => setTreatmentForm({ ...treatmentForm, heartRate: v })} type="number" disabled={!includeVitals} />
                                        </div>
                                        {!includeVitals && (
                                            <div style={{ marginTop: 10, fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                                                Vitals are optional. Toggle Include to enter them.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={S.modalFooter}>
                                    <button
                                        onClick={() => setTreatmentModal({ open: false, appt: null })}
                                        style={S.cancelBtn}
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSaveAndComplete}
                                        disabled={savingTreatment}
                                        style={S.saveBtn}
                                    >
                                        {savingTreatment ? 'Saving...' : 'Save & Mark Complete'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Prescription CRUD Modal */}
                <AnimatePresence>
                    {isPrescriptionModalOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={S.modalOverlay}>
                            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={S.modalContent}>
                                <div style={S.modalHeader}>
                                    <div style={{ flex: 1 }}>
                                        <h2 style={{ margin: 0, color: '#1e293b' }}>{currentPrescription ? 'Edit Prescription' : 'New Digital Prescription'}</h2>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Fill in the medication details below</p>
                                    </div>
                                    <button onClick={() => setIsPrescriptionModalOpen(false)} style={S.closeBtn}><X size={22} /></button>
                                </div>
                                <div style={S.modalBody}>
                                    <div style={S.modalCol}>
                                        <h3 style={S.sectionTitle}><FileText size={18} /> Medication Details</h3>
                                        <div style={S.fieldGrid}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Search Patient</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                                    <input
                                                        placeholder="Search patient name..."
                                                        value={currentPrescription ? (dashData?.patients?.find(p => p.id === prescriptionForm.patientId)?.name || 'Patient') : (searchQ || '')}
                                                        onChange={e => {
                                                            if (!currentPrescription) {
                                                                setSearchQ(e.target.value);
                                                                setPrescriptionForm({ ...prescriptionForm, patientId: '' });
                                                            }
                                                        }}
                                                        disabled={!!currentPrescription}
                                                        style={{ ...S.modalInput, paddingLeft: 40 }}
                                                    />
                                                    {!currentPrescription && searchQ.length > 0 && !prescriptionForm.patientId && (
                                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0 0 10px 10px', zIndex: 100, maxHeight: 180, overflowY: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                                                            {dashData?.patients?.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase())).map(p => (
                                                                <div
                                                                    key={p.id}
                                                                    onClick={() => {
                                                                        setPrescriptionForm({ ...prescriptionForm, patientId: p.id });
                                                                        setSearchQ(p.name);
                                                                    }}
                                                                    style={{ padding: '10px 14px', color: '#1e293b', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                                                                    onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                                                                    onMouseLeave={e => e.target.style.background = 'transparent'}
                                                                >
                                                                    {p.name}
                                                                </div>
                                                            ))}
                                                            {dashData?.patients?.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase())).length === 0 && (
                                                                <div style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.9rem' }}>No patients found</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <div style={{ color: '#0f172a', fontWeight: 900 }}>Drugs</div>
                                                <button
                                                    type="button"
                                                    onClick={addPrescriptionItem}
                                                    style={{ ...S.completeBtn, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }}
                                                >
                                                    <Plus size={14} /> Add drug
                                                </button>
                                            </div>

                                            {(prescriptionForm.items || []).map((it, idx) => (
                                                <div key={idx} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 16, background: '#ffffff', marginBottom: 12 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                        <div style={{ color: '#0f172a', fontWeight: 900 }}>Drug #{idx + 1}</div>
                                                        {(prescriptionForm.items || []).length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removePrescriptionItem(idx)}
                                                                style={{ ...S.completeBtn, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                                                            >
                                                                <Trash2 size={14} /> Remove
                                                            </button>
                                                        )}
                                                    </div>

                                                    <InputField
                                                        label="Drug name"
                                                        value={it.drugName}
                                                        onChange={v => updatePrescriptionItem(idx, 'drugName', v)}
                                                        placeholder="e.g. Amoxicillin"
                                                    />
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                        <InputField label="Dosage" value={it.dosage} onChange={v => updatePrescriptionItem(idx, 'dosage', v)} placeholder="e.g. 500mg" />
                                                        <InputField label="Frequency" value={it.frequency} onChange={v => updatePrescriptionItem(idx, 'frequency', v)} placeholder="e.g. 2x Daily" />
                                                    </div>
                                                    <InputField label="Duration" value={it.duration} onChange={v => updatePrescriptionItem(idx, 'duration', v)} placeholder="e.g. 7 Days" />
                                                    <InputField label="Instructions" value={it.instructions} onChange={v => updatePrescriptionItem(idx, 'instructions', v)} placeholder="e.g. After food" textarea />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={S.modalCol}>
                                        <h3 style={S.sectionTitle}><ShieldCheck size={18} /> Additional Info</h3>
                                        <div style={S.fieldGrid}>
                                            <InputField label="Clinical Notes" value={prescriptionForm.notes} onChange={v => setPrescriptionForm({ ...prescriptionForm, notes: v })} placeholder="Internal notes (optional)" textarea />
                                        </div>
                                    </div>
                                </div>
                                <div style={S.modalFooter}>
                                    <button onClick={() => setIsPrescriptionModalOpen(false)} style={S.cancelBtn}>Cancel</button>
                                    <button onClick={handlePrescriptionSubmit} style={S.saveBtn}>Save Prescription</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

const InputField = ({ label, value, onChange, placeholder, textarea = false, type = "text", disabled = false }) => (
    <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>{label}</label>
        {textarea ? (
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    ...S.modalInput,
                    minHeight: 80,
                    resize: 'vertical',
                    opacity: disabled ? 0.55 : 1,
                    cursor: disabled ? 'not-allowed' : 'text'
                }}
            />
        ) : (
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    ...S.modalInput,
                    opacity: disabled ? 0.55 : 1,
                    cursor: disabled ? 'not-allowed' : 'text'
                }}
            />
        )}
    </div>
);

const StatCard = ({ icon, label, value, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ y: -4 }}
        style={{ ...S.statCard, borderLeft: `4px solid ${color}` }}
    >
        <div style={{ ...S.statIcon, background: `${color}22`, color }}>{icon}</div>
        <div>
            <div style={S.statLabel}>{label}</div>
            <div style={{ ...S.statValue, color }}>
                <AnimatedCounter value={value} delay={delay + 0.3} />
            </div>
        </div>
    </motion.div>
);

const LoadingSkeleton = () => (
    <div style={S.container}>
        <div style={S.wrapper}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 80, background: 'rgba(0,0,0,0.05)', borderRadius: 16, marginBottom: 16, animation: 'pulse 1.5s infinite' }} />
            ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.3} }`}</style>
    </div>
);

const S = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eaf3ff 0%, #f3f8ff 52%, #f8fbff 100%)',
        padding: '2rem 1.5rem',
        fontFamily: 'Inter,system-ui,sans-serif',
        color: '#1e293b'
    },
    wrapper: { maxWidth: '1280px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
    title: { margin: 0, fontSize: '2rem', fontWeight: 900, color: '#0f172a' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.95rem' },
    logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', color: '#ef4444', padding: '10px 20px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', border: '1px solid #fecaca' },
    availabilityBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' },
    drugBtn: { display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer', outline: 'none', fontFamily: 'inherit', boxShadow: '0 4px 10px rgba(245,158,11,0.3)' },

    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem', marginBottom: '2rem' },
    statCard: { background: '#ffffff', borderRadius: 20, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'default' },
    statIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    statLabel: { color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
    statValue: { fontSize: '1.75rem', fontWeight: 900, marginTop: 2 },

    tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#e2e8f0', padding: '6px', borderRadius: 14, width: 'fit-content' },
    tab: { padding: '10px 24px', borderRadius: 10, border: 'none', background: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s', fontFamily: 'inherit' },
    tabActive: { background: '#ffffff', color: '#3b82f6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontFamily: 'inherit' },

    twoCol: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' },

    calendarCard: { background: '#ffffff', borderRadius: 24, padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    calHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' },
    calMonthTitle: { color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' },
    calNavBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center' },
    calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px', textAlign: 'center' },
    calDayLabel: { color: '#64748b', fontSize: '0.75rem', fontWeight: 700, padding: '6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' },
    calCell: { position: 'relative', width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', flexDirection: 'column', gap: 2, fontFamily: 'inherit' },
    calCellSelected: { background: '#3b82f6', color: '#fff', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' },
    calCellToday: { border: '2px solid #3b82f6', color: '#3b82f6' },
    dotIndicator: { width: 5, height: 5, borderRadius: '50%', marginTop: 1 },

    tokensCard: { background: '#ffffff', borderRadius: 24, padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: 400 },
    tokensHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' },
    tokensTitle: { color: '#0f172a', fontWeight: 800, fontSize: '1.05rem' },
    unavailBox: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1rem', marginBottom: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' },
    unavailHeader: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 },
    unavailRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    unavailBtn: { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', justifyContent: 'center', padding: '12px 14px', borderRadius: 14, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },
    unavailBtnFree: { background: 'rgba(16,185,129,0.08)', color: '#065f46', borderColor: 'rgba(16,185,129,0.25)' },
    unavailBtnBlocked: { background: 'rgba(239,68,68,0.10)', color: '#991b1b', borderColor: 'rgba(239,68,68,0.25)' },
    tokenList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    tokenRow: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: 16, border: '1px solid #f1f5f9' },
    tokenNum: { width: 44, height: 44, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.95rem', flexShrink: 0 },
    tokenInfo: { flex: 1 },
    tokenPatient: { color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' },
    tokenSession: { color: '#64748b', fontSize: '0.8rem', marginTop: 2 },
    statusBadge: { padding: '4px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 },
    completeBtn: { display: 'flex', alignItems: 'center', gap: 6, background: '#d1fae5', color: '#059669', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, fontFamily: 'inherit' },
    emptyTokens: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#64748b' },
    loadingRow: { textAlign: 'center', padding: '3rem', color: '#64748b' },

    patientsCard: { background: '#ffffff', borderRadius: 24, padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    searchRow: { marginBottom: '1.5rem' },
    searchWrap: { position: 'relative' },
    searchInput: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 16px 12px 48px', color: '#1e293b', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' },
    patientTable: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    patientRow: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: 16, border: '1px solid #f1f5f9', background: '#ffffff', textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer' },
    patientAvatar: { width: 42, height: 42, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem', flexShrink: 0 },
    patientInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
    patientName: { color: '#0f172a', fontWeight: 700 },
    patientMeta: { color: '#64748b', fontSize: '0.8rem' },
    prescCount: { display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' },
    headerRow: {},
    searchIcon: {},
    sectionTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 10 },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
    modalBox: { background: '#ffffff', borderRadius: 28, width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', padding: '2rem' },
    modalContent: { background: '#ffffff', borderRadius: 28, width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    modalHeader: { padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' },
    closeBtn: { background: 'transparent', border: 'none', color: '#64748b', fontSize: '2rem', cursor: 'pointer', padding: 0, lineHeight: 1 },
    modalBody: { padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' },
    modalCol: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    fieldGrid: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    vitalInputGrid: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    modalInput: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#1e293b', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' },
    patientNameLink: { background: 'none', border: 'none', padding: 0, margin: 0, color: '#2563eb', fontWeight: 900, fontSize: '1.35rem', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: 'inherit' },
    modalFooter: { padding: '1.5rem 2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' },
    cancelBtn: { background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, cursor: 'pointer', padding: '10px 20px', borderRadius: 12, fontFamily: 'inherit' },
    saveBtn: { background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' },
};
