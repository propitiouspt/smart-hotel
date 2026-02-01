import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    BedDouble,
    CalendarDays,
    ArrowRightLeft,
    SprayCan,
    FileBarChart,
    Users,
    Database,
    Menu,
    X,
    LogOut,
    User
} from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const role = currentUser?.userType;

    const links = [
        {
            to: '/',
            label: 'Dashboard',
            icon: LayoutDashboard,
            roles: ['Admin', 'Manager']
        },
        {
            to: '/rooms',
            label: 'Room Master',
            icon: BedDouble,
            roles: ['Admin', 'Manager']
        },
        {
            to: '/bookings',
            label: 'Bookings',
            icon: CalendarDays,
            roles: ['Admin', 'Manager']
        },
        {
            to: '/check-in-out',
            label: 'Check In/Out',
            icon: ArrowRightLeft,
            roles: ['Admin', 'Manager']
        },
        {
            to: '/housekeeping',
            label: 'Housekeeping',
            icon: SprayCan,
            roles: ['Admin', 'Manager', 'Staff']
        },
        {
            to: '/reports',
            label: 'Reports',
            icon: FileBarChart,
            roles: ['Admin', 'Manager']
        },
        {
            to: '/users',
            label: 'User Master',
            icon: Users,
            roles: ['Admin']
        },
        {
            to: '/backup',
            label: 'Backup',
            icon: Database,
            roles: ['Admin', 'Manager']
        },
    ];

    const visibleLinks = links.filter(link => link.roles.includes(role));

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Desktop Links */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <h1 className="text-xl font-bold text-white tracking-tight">Smart Hotel</h1>
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                {role}
                            </span>
                        </div>
                        <div className="hidden lg:block ml-10">
                            <div className="flex items-baseline space-x-4">
                                {visibleLinks.map((link) => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        className={({ isActive }) => clsx(
                                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-slate-800 text-white"
                                                : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                        )}
                                    >
                                        <link.icon className="w-4 h-4" />
                                        {link.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Profile & Logout */}
                    <div className="hidden lg:flex items-center gap-4">
                        <div className="flex items-center gap-3 text-slate-300">
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">{currentUser?.userName}</p>
                                <p className="text-[10px] text-slate-500">{currentUser?.userId}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                {currentUser?.userName.charAt(0)}
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="lg:hidden flex items-center gap-4">
                        <div className="flex items-center gap-2 mr-2">
                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                {currentUser?.userName.charAt(0)}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state. */}
            <div className={clsx("lg:hidden", isOpen ? "block" : "hidden")}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-800">
                    {visibleLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium",
                                isActive
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                            )}
                        >
                            <link.icon className="w-5 h-5" />
                            {link.label}
                        </NavLink>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-800 hover:text-red-500 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
                <div className="pt-4 pb-3 border-t border-slate-800 bg-slate-950/30 px-5 flex items-center">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {currentUser?.userName.charAt(0)}
                        </div>
                    </div>
                    <div className="ml-3">
                        <div className="text-base font-medium leading-none text-white">{currentUser?.userName}</div>
                        <div className="text-sm font-medium leading-none text-slate-500 mt-1">{currentUser?.userId} ({role})</div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
