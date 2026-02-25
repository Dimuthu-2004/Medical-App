import axios from 'axios';
import api from './api';

const authService = {
    login: async (username, password) => {
        // Spring Security default form login expects x-www-form-urlencoded
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        // We hit the standard /login endpoint
        return axios.post('/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    },

    getCurrentUser: async () => {
        return api.get('/auth/user');
    },

    registerPatient: async (data) => {
        return api.post('/auth/register/patient', data);
    },

    registerDoctor: async (data) => {
        return api.post('/auth/register/doctor', data);
    },

    logout: async () => {
        return axios.post('/logout');
    }
};

export default authService;
