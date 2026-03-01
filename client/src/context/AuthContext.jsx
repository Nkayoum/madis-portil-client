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
            // For FormData, delete Content-Type so browser sets multipart boundary automatically
            const response = await api.patch('/auth/profile/', data, {
                headers: isFormData ? { 'Content-Type': undefined } : {},
            });
            const updatedUser = response.data;
            setUser(updatedUser);
            localStorage.setItem('madis_user', JSON.stringify(updatedUser));
            return { success: true, user: updatedUser };
        } catch (error) {
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
