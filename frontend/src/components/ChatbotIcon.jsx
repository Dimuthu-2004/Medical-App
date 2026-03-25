import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const ChatbotIcon = () => {
    const SUPPORT_PHONE = '0332233027';
    const SUPPORT_TEL = `tel:${SUPPORT_PHONE}`;
    const [isHovered, setIsHovered] = useState(false);
    const [showGreeting, setShowGreeting] = useState(false);
    const [open, setOpen] = useState(false);
    const [maximized, setMaximized] = useState(false);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [typingHint, setTypingHint] = useState('Thinking...');
    const abortRef = useRef(null);
    const [sessionId] = useState(() => {
        const existing = localStorage.getItem('smartclinic_chat_session');
        if (existing) return existing;
        const sid = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        localStorage.setItem('smartclinic_chat_session', sid);
        return sid;
    });
    const [messages, setMessages] = useState(() => ([
        {
            role: 'assistant',
            text: `Hi. I'm the SmartClinic assistant. Ask about bookings, payments, OCR, or feedback. You can also call ${SUPPORT_PHONE}.`,
            quick: ['OCR', 'Book an appointment', 'Payment help', 'Call clinic']
        }
    ]));
    const listRef = useRef(null);
    const location = useLocation();
    const path = location.pathname;

    // Visibility Logic: Only show for Landing, Login, Registration, and Patient areas
    const isPatientPath = path.startsWith('/patients') ||
        path.startsWith('/appointments') ||
        path.startsWith('/vitals') ||
        path.startsWith('/medical-records/patient') ||
        (path.startsWith('/feedback') && !path.startsWith('/admin'));

    const isPublicPath = path === '/' ||
        path === '/login' ||
        path === '/forgot-password' ||
        path.startsWith('/register');
    const shouldShowGreetingPath = path === '/' || path === '/patients/dashboard';

    if (!isPatientPath && !isPublicPath) {
        return null;
    }

    const scrollToBottom = () => {
        const el = listRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    };

    useEffect(() => {
        scrollToBottom();
    }, [open, messages.length, sending]);

    useEffect(() => {
        if (!sending) {
            setTypingHint('Thinking...');
            return;
        }
        const hints = [
            'Reading your question...',
            'Checking app info...',
            'Looking for the right steps...',
            'Preparing a clear reply...'
        ];
        let idx = 0;
        const t = setInterval(() => {
            idx = (idx + 1) % hints.length;
            setTypingHint(hints[idx]);
        }, 1100);
        return () => clearInterval(t);
    }, [sending]);

    useEffect(() => {
        if (!open) {
            setMaximized(false);
            return;
        }
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                setMaximized(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open]);

    useEffect(() => {
        if (!shouldShowGreetingPath || open) {
            setShowGreeting(false);
            return;
        }
        const greetingKey = `smartclinic_chat_greeting_${path}`;
        if (sessionStorage.getItem(greetingKey) === '1') {
            return;
        }
        setShowGreeting(true);
        const timer = setTimeout(() => {
            setShowGreeting(false);
            sessionStorage.setItem(greetingKey, '1');
        }, 7000);
        return () => clearTimeout(timer);
    }, [open, path, shouldShowGreetingPath]);

    const waUrl = useMemo(() => {
        const last = [...messages].reverse().find(m => m.role === 'assistant' && m.whatsapp_number);
        const raw = last?.whatsapp_number || '';
        const digits = raw.toString().replace(/[^\d]/g, '');
        if (!digits) return null;
        return `https://wa.me/${digits}`;
    }, [messages]);

    const userInitial = useMemo(() => 'U', []);
    const [resolvedUserInitial, setResolvedUserInitial] = useState('U');

    useEffect(() => {
        if (!open) return;
        api.get('/api/auth/user')
            .then((res) => {
                const uname = (res?.data?.username || '').toString().trim();
                if (uname) setResolvedUserInitial(uname[0].toUpperCase());
            })
            .catch(() => {
                // public users: keep default initial
            });
    }, [open]);

    const send = async (text) => {
        const t = (text ?? input).trim();
        if (!t || sending) return;

        setMessages((m) => [...m, { role: 'user', text: t }]);
        setInput('');
        setSending(true);
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await api.post('/api/chat', { message: t, sessionId, currentPath: window.location.pathname, clientTime: new Date().toISOString() }, { signal: controller.signal });
            const data = res.data || {};
            setMessages((m) => [
                ...m,
                {
                    role: 'assistant',
                    text: data.reply || 'Sorry, I could not answer that.',
                    quick: Array.isArray(data.quick_replies) ? data.quick_replies : [],
                    fallback_whatsapp: !!data.fallback_whatsapp,
                    whatsapp_number: data.whatsapp_number || ''
                }
            ]);
        } catch (e) {
            if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') {
                setMessages((m) => [
                    ...m,
                    {
                        role: 'assistant',
                        text: 'Stopped. You can ask again anytime.',
                        quick: ['Book an appointment', 'OCR']
                    }
                ]);
                return;
            }
            const msg = e.response?.data?.error || e.message || 'Chat failed';
            setMessages((m) => [
                ...m,
                {
                    role: 'assistant',
                    text: `I hit an error: ${msg}. If you need help, call the clinic front desk on ${SUPPORT_PHONE}.`,
                    quick: ['Call clinic', 'Open WhatsApp', 'OCR', 'Book an appointment'],
                    fallback_whatsapp: true
                }
            ]);
        } finally {
            setSending(false);
            abortRef.current = null;
        }
    };

    const onQuick = (q) => {
        if (q === 'Open WhatsApp') {
            if (waUrl) window.open(waUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        if (q === 'OCR' || q === 'OCR Checker') {
            window.location.href = '/ocr';
            return;
        }
        if (q === 'Book an appointment') {
            window.location.href = '/appointments/add';
            return;
        }
        if (q === 'Sign in') {
            window.location.href = '/login';
            return;
        }
        if (q === 'Create account') {
            window.location.href = '/register';
            return;
        }
        if (q === 'Payment help') {
            send('How do I upload a payment slip?');
            return;
        }
        if (q === 'Call clinic') {
            window.location.href = SUPPORT_TEL;
            return;
        }
        if (q === 'Lighting tips') {
            send('Lighting tips for OCR');
            return;
        }
        if (q === 'How to book') {
            send('How do I book an appointment?');
            return;
        }
        if (q === 'Open Symptom Analyzer') {
            window.location.href = '/ai/symptoms';
            return;
        }
        send(q);
    };

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.22 }}
                        style={{
                            position: 'fixed',
                            ...(maximized
                                ? { inset: 18 }
                                : { bottom: 120, right: 40, width: 'min(380px, calc(100vw - 40px))', maxHeight: 'min(560px, calc(100vh - 180px))' }),
                            background: 'rgba(255,255,255,0.92)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(15,23,42,0.12)',
                            borderRadius: 22,
                            boxShadow: '0 35px 90px rgba(2,6,23,0.25)',
                            zIndex: 99999,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{
                            padding: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            borderBottom: '1px solid rgba(15,23,42,0.10)',
                            background: 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(14,165,233,0.10))'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <img
                                    src="/images/assistant-avatar.svg"
                                    alt="SmartClinic Assistant"
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 999,
                                        border: '2px solid rgba(255,255,255,0.85)',
                                        boxShadow: '0 12px 30px rgba(2,6,23,0.12)'
                                    }}
                                />
                                <div>
                                    <div style={{ fontWeight: 950, letterSpacing: '-0.02em', color: '#0f172a' }}>SmartClinic Assistant</div>
                                    <div style={{ fontWeight: 850, fontSize: '0.85rem', color: 'rgba(15,23,42,0.60)' }}>It will help and support users 24X7</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => setMaximized(v => !v)}
                                    style={{
                                        border: '1px solid rgba(15,23,42,0.16)',
                                        background: 'rgba(255,255,255,0.85)',
                                        borderRadius: 999,
                                        padding: '8px 12px',
                                        fontWeight: 900,
                                        cursor: 'pointer'
                                    }}
                                    title={maximized ? 'Restore' : 'Maximize'}
                                >
                                    {maximized ? 'Restore' : 'Maximize'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setOpen(false); setMaximized(false); }}
                                    style={{
                                        border: '1px solid rgba(15,23,42,0.16)',
                                        background: 'rgba(255,255,255,0.85)',
                                        borderRadius: 999,
                                        padding: '8px 12px',
                                        fontWeight: 900,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div ref={listRef} style={{ padding: 14, overflow: 'auto' }}>
                            {messages.map((m, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: 10,
                                    gap: 10,
                                    alignItems: 'flex-end'
                                }}>
                                    {m.role !== 'user' && (
                                        <img
                                            src="/images/assistant-avatar.svg"
                                            alt="Assistant"
                                            style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0, border: '1px solid rgba(15,23,42,0.10)' }}
                                        />
                                    )}
                                    <div style={{
                                        maxWidth: '86%',
                                        padding: '10px 12px',
                                        borderRadius: 16,
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1.45,
                                        fontWeight: 750,
                                        fontSize: '0.92rem',
                                        color: m.role === 'user' ? 'white' : '#0f172a',
                                        background: m.role === 'user'
                                            ? 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(22,163,74,0.95))'
                                            : 'rgba(255,255,255,0.85)',
                                        border: m.role === 'user' ? '0' : '1px solid rgba(15,23,42,0.10)',
                                        boxShadow: m.role === 'user' ? '0 14px 34px rgba(22,163,74,0.22)' : '0 10px 25px rgba(15,23,42,0.10)',
                                    }}>
                                        {m.text}
                                        {m.role === 'assistant' && Array.isArray(m.quick) && m.quick.length > 0 && (
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                                                {m.quick.slice(0, 6).map((q) => (
                                                    <button
                                                        key={q}
                                                        type="button"
                                                        onClick={() => onQuick(q)}
                                                        style={{
                                                            border: '1px solid rgba(15,23,42,0.14)',
                                                            background: 'rgba(255,255,255,0.9)',
                                                            borderRadius: 999,
                                                            padding: '7px 10px',
                                                            fontWeight: 900,
                                                            fontSize: '0.82rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {m.role === 'user' && (
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 999,
                                            flexShrink: 0,
                                            display: 'grid',
                                            placeItems: 'center',
                                            fontWeight: 950,
                                            color: 'white',
                                            background: 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(14,165,233,0.92))',
                                            boxShadow: '0 12px 30px rgba(34,197,94,0.18)'
                                        }}>
                                            {resolvedUserInitial || userInitial}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {sending && (
                                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10, gap: 10, alignItems: 'flex-end' }}>
                                    <img
                                        src="/images/assistant-avatar.svg"
                                        alt="Assistant"
                                        style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0, border: '1px solid rgba(15,23,42,0.10)' }}
                                    />
                                    <div style={{
                                        padding: '10px 12px',
                                        borderRadius: 16,
                                        background: 'rgba(255,255,255,0.85)',
                                        border: '1px solid rgba(15,23,42,0.10)',
                                        boxShadow: '0 10px 25px rgba(15,23,42,0.10)',
                                        fontWeight: 850,
                                        color: 'rgba(15,23,42,0.60)'
                                    }}>
                                        {typingHint}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: 12, borderTop: '1px solid rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.75)' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a question..."
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            send();
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        resize: 'none',
                                        padding: '10px 12px',
                                        borderRadius: 16,
                                        border: '1px solid rgba(15,23,42,0.14)',
                                        outline: 'none',
                                        fontWeight: 750,
                                        lineHeight: 1.4,
                                        fontFamily: 'inherit',
                                        background: 'rgba(255,255,255,0.9)'
                                    }}
                                />
                                <button
                                    type="button"
                                    disabled={!input.trim() || sending}
                                    onClick={() => send()}
                                    style={{
                                        border: 0,
                                        borderRadius: 16,
                                        padding: '10px 14px',
                                        fontWeight: 950,
                                        cursor: (!input.trim() || sending) ? 'not-allowed' : 'pointer',
                                        color: 'white',
                                        background: (!input.trim() || sending)
                                            ? 'rgba(34,197,94,0.45)'
                                            : 'linear-gradient(135deg, rgba(34,197,94,0.98), rgba(14,165,233,0.92))',
                                        boxShadow: (!input.trim() || sending) ? 'none' : '0 18px 45px rgba(34,197,94,0.22)'
                                    }}
                                >
                                    Send
                                </button>
                                {sending && (
                                    <button
                                        type="button"
                                        onClick={() => abortRef.current?.abort?.()}
                                        style={{
                                            border: '1px solid rgba(239,68,68,0.25)',
                                            borderRadius: 16,
                                            padding: '10px 12px',
                                            fontWeight: 900,
                                            cursor: 'pointer',
                                            color: '#b91c1c',
                                            background: 'rgba(239,68,68,0.08)'
                                        }}
                                    >
                                        Stop
                                    </button>
                                )}
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'rgba(15,23,42,0.60)' }}>
                                    Need staff help? Call {SUPPORT_PHONE}
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = SUPPORT_TEL; }}
                                        style={{
                                            border: '1px solid rgba(59,130,246,0.30)',
                                            background: 'rgba(59,130,246,0.10)',
                                            borderRadius: 999,
                                            padding: '7px 10px',
                                            fontWeight: 950,
                                            cursor: 'pointer',
                                            color: '#1d4ed8'
                                        }}
                                    >
                                        Call clinic
                                    </button>
                                    {waUrl && (
                                        <button
                                            type="button"
                                            onClick={() => window.open(waUrl, '_blank', 'noopener,noreferrer')}
                                            style={{
                                                border: '1px solid rgba(34,197,94,0.35)',
                                                background: 'rgba(34,197,94,0.10)',
                                                borderRadius: 999,
                                                padding: '7px 10px',
                                                fontWeight: 950,
                                                cursor: 'pointer',
                                                color: '#166534'
                                            }}
                                        >
                                            Open WhatsApp
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                style={{
                    position: 'fixed',
                    bottom: '40px',
                    right: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    zIndex: 99999,
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, type: 'spring', stiffness: 100 }}
            >
                <AnimatePresence>
                    {(isHovered || showGreeting) && !open && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10, scale: 0.8 }}
                            style={{
                                background: 'white',
                                padding: '10px 14px',
                                borderRadius: '16px',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                color: '#0f172a',
                                boxShadow: '0 15px 35px rgba(0,0,0,0.12)',
                                border: '1px solid #f0fdf4',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                maxWidth: 290
                            }}
                        >
                            <img
                                src="/images/assistant-avatar.svg"
                                alt="Assistant"
                                style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 999,
                                    border: '1px solid rgba(15,23,42,0.10)',
                                    flexShrink: 0
                                }}
                            />
                            <span style={{ lineHeight: 1.35 }}>
                                Hi, I&apos;m SmartClinic Assistant. I can help and support you 24X7.
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    onClick={() => setOpen((v) => !v)}
                    style={{
                        width: '68px',
                        height: '68px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 20px 50px rgba(22,163,74,0.3)',
                        border: '2px solid rgba(255,255,255,0.4)',
                        position: 'relative'
                    }}
                    whileHover={{ scale: 1.08, rotate: 6, borderRadius: '28px' }}
                    whileTap={{ scale: 0.92 }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            width: 16,
                            height: 16,
                            background: '#4ade80',
                            borderRadius: '50%',
                            border: '3px solid #fff',
                            boxShadow: '0 0 10px rgba(74,222,128,0.5)'
                        }}
                    />
                </motion.div>
            </motion.div>
        </>
    );
};

export default ChatbotIcon;
