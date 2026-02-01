import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/db';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('sh_currentUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userId, password) => {
        const user = db.users.findOne(u => u.userId === userId && u.password === password && u.active);
        if (user) {
            // Don't store password in session
            const { password, ...safeUser } = user;
            setCurrentUser(safeUser);
            localStorage.setItem('sh_currentUser', JSON.stringify(safeUser));
            return { success: true };
        }
        return { success: false, message: 'Invalid credentials or inactive account' };
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('sh_currentUser');
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
