import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../hooks/useDevice';

export default function DashboardLayout() {
    const { currentUser } = useAuth();
    const { isMobile, isTablet } = useDevice();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50 transition-all duration-300 flex flex-col">
            <Navbar />

            <main className={`flex-1 ${isMobile ? 'p-2' : isTablet ? 'p-4' : 'p-6 lg:p-8'}`}>
                <div className={`${isMobile ? 'w-full' : 'max-w-7xl mx-auto'}`}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
