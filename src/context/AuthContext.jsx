import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/db';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [currency, setCurrency] = useState('$'); // Default currency
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('sh_currentUser');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    // Validate session against Supabase
                    const user = await db.users.findOne(u => u.userId === parsedUser.userId && u.active);

                    if (user) {
                        const { password, ...safeUser } = user;
                        setCurrentUser(safeUser);
                        // Update local storage with fresh data
                        localStorage.setItem('sh_currentUser', JSON.stringify(safeUser));

                        // Fetch Settings for Currency
                        const settings = await db.settings.get(safeUser.hotelId);
                        if (settings && settings.currency) {
                            setCurrency(settings.currency);
                        }
                    } else {
                        // Invalid or inactive user, clear session
                        localStorage.removeItem('sh_currentUser');
                    }
                } catch (error) {
                    console.error('Session validation failed:', error);
                    localStorage.removeItem('sh_currentUser');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (userId, password) => {
        const user = await db.users.findOne(u => u.userId === userId && u.password === password && u.active);
        if (user) {
            // Don't store password in session
            const { password, ...safeUser } = user;
            setCurrentUser(safeUser);
            localStorage.setItem('sh_currentUser', JSON.stringify(safeUser));

            // Fetch Settings for Currency
            const settings = await db.settings.get(safeUser.hotelId);
            if (settings && settings.currency) {
                setCurrency(settings.currency);
            }
            return { success: true };
        }
        return { success: false, message: 'Invalid credentials or inactive account' };
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('sh_currentUser');
    };

    return (
        <AuthContext.Provider value={{ currentUser, currency, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
