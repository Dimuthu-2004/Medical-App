import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const ChatbotIcon = () => {
    const [isHovered, setIsHovered] = useState(false);
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

    if (!isPatientPath && !isPublicPath) {
        return null;
    }

    return (
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
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.8 }}
                        style={{
                            background: 'white',
                            padding: '10px 20px',
                            borderRadius: '16px',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: '#15803d',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.12)',
                            border: '1px solid #f0fdf4',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Message us
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
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
                whileHover={{ scale: 1.1, rotate: 8, borderRadius: '28px' }}
                whileTap={{ scale: 0.9 }}
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
    );
};

export default ChatbotIcon;
