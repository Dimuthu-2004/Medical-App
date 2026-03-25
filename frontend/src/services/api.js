import axios from 'axios';

const resolveBackendOrigin = () => {
    const envOrigin = import.meta.env.VITE_BACKEND_ORIGIN;
    if (envOrigin && envOrigin.trim()) return envOrigin.trim().replace(/\/$/, '');
    const origin = window.location.origin;
    if (origin.includes('5173')) return origin.replace('5173', '8088');
    return origin;
};

const api = axios.create({
    baseURL: resolveBackendOrigin(),
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Handle cookies for session-based auth
});

export default api;
