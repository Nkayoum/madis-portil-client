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
            config.headers.Authorization = `Bearer ${token}`;
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
    async (error) => {
        const originalRequest = error.config;

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

        // Prevent infinite loops on login/refresh endpoints
        if (originalRequest.url === '/auth/login/' || originalRequest.url === '/auth/token/refresh/') {
            return Promise.reject(error);
        }

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('madis_refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Call the refresh endpoint using standard axios to avoid interceptor loop
                const response = await axios.post('http://localhost:8000/api/v1/auth/token/refresh/', {
                    refresh: refreshToken
                });

                const { access } = response.data;
                localStorage.setItem('madis_token', access);

                // Update original request header and retry
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);

            } catch (refreshError) {
                // Auto logout if refresh fails
                localStorage.removeItem('madis_token');
                localStorage.removeItem('madis_refresh_token');
                localStorage.removeItem('madis_user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
