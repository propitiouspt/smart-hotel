import React from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function DashboardLayout() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 pl-64 transition-all duration-300 print:pl-0">
            <div className="print:hidden">
                <Sidebar />
            </div>

            <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 print:hidden">
                <h1 className="text-xl font-semibold text-slate-800">
                    {/* Breadcrumb or Page Title could go here */}
                    Dashboard
                </h1>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </header>

            <main className="p-8">
                <Outlet />
            </main>
        </div>
    );
}
