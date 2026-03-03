import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('madis_user');
        const token = localStorage.getItem('madis_token');
        const refreshToken = localStorage.getItem('madis_refresh_token');
        if (storedUser && token && refreshToken) {
            try {
                return JSON.parse(storedUser);
            } catch (err) {
                console.error(err);
                return null;
            }
        }
        return null;
    });
    const [loading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('madis_user');
        const token = localStorage.getItem('madis_token');
        const refreshToken = localStorage.getItem('madis_refresh_token');

        if (!(storedUser && token && refreshToken)) {
            // Clean up if incomplete Auth State
            localStorage.removeItem('madis_token');
            localStorage.removeItem('madis_refresh_token');
            localStorage.removeItem('madis_user');
        }
    }, []);

    const login = async (email, password, otp = null) => {
        try {
            const payload = { email, password };
            if (otp) {
                payload.otp = otp;
            }
            const response = await api.post('/auth/login/', payload);

            if (response.data.require_otp) {
                return { success: true, require_otp: true, email: response.data.email };
            }

            const { token, refresh, user } = response.data;

            localStorage.setItem('madis_token', token);
            localStorage.setItem('madis_refresh_token', refresh);
            localStorage.setItem('madis_user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.non_field_errors?.[0] || 'Login failed',
            };
        }
    };

    const logout = async () => {
        const refresh = localStorage.getItem('madis_refresh_token');
        localStorage.removeItem('madis_token');
        localStorage.removeItem('madis_refresh_token');
        localStorage.removeItem('madis_user');
        setUser(null);
        try {
            if (refresh) {
                await api.post('/auth/logout/', { refresh });
            }
        } catch (e) {
            console.error('Logout error', e);
        }
    };

    const updateUser = async (data) => {
        try {
            const isFormData = data instanceof FormData;
            let responseData;

            if (isFormData) {
                // Use native fetch for file uploads — axios default headers
                // interfere with multipart boundary required by Django
                const token = localStorage.getItem('madis_token');
                const fetchRes = await fetch('http://172.20.10.2:8000/api/v1/auth/profile/', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        // Do NOT set Content-Type — browser auto-adds multipart boundary
                    },
                    body: data,
                });
                if (!fetchRes.ok) {
                    const errBody = await fetchRes.json().catch(() => ({}));
                    return { success: false, error: errBody };
                }
                responseData = await fetchRes.json();
            } else {
                const response = await api.patch('/auth/profile/', data);
                responseData = response.data;
            }

            setUser(responseData);
            localStorage.setItem('madis_user', JSON.stringify(responseData));
            return { success: true, user: responseData };
        } catch (error) {
            console.error('updateUser error:', error);
            return {
                success: false,
                error: error.response?.data || 'Mise à jour échouée',
            };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

/* eslint-disable react-refresh/only-export-components */
export const useAuth = () => useContext(AuthContext);
/* eslint-enable react-refresh/only-export-components */
