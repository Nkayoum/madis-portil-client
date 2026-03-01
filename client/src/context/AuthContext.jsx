import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('madis_user');
        const token = localStorage.getItem('madis_token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login/', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('madis_token', token);
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

    const logout = () => {
        localStorage.removeItem('madis_token');
        localStorage.removeItem('madis_user');
        setUser(null);
        try {
            api.post('/auth/logout/');
        } catch (e) {
            // Ignore error on logout
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
                const fetchRes = await fetch('http://localhost:8000/api/v1/auth/profile/', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Token ${token}`,
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

export const useAuth = () => useContext(AuthContext);
