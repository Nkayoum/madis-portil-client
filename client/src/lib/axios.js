import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('madis_token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle HTML error responses (common in Django debug mode or server errors)
        if (error.response?.headers?.['content-type']?.includes('text/html')) {
            const errorData = error.response.data;
            if (typeof errorData === 'string') {
                console.error('HTML Error Response detected (first 500 chars):', errorData.substring(0, 500));
            } else {
                console.error('HTML Error Response detected (Binary/Blob data). Status:', error.response.status);
            }
            const customError = new Error('Une erreur serveur est survenue (Format HTML non supporté).');
            customError.response = {
                ...error.response,
                status: error.response.status,
                data: { detail: 'Une erreur serveur interne est survenue. L\'application a reçu une page HTML au lieu de données JSON.' }
            };
            return Promise.reject(customError);
        }

        if (error.response && error.response.status === 401) {
            // Auto logout if 401 Unauthorized (token invalid/expired)
            localStorage.removeItem('madis_token');
            localStorage.removeItem('madis_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
