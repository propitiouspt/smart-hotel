import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    BedDouble,
    CalendarDays,
    ArrowRightLeft,
    SprayCan,
    FileBarChart,
    Users,
    Database
} from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
    const { currentUser } = useAuth();
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

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-50">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white tracking-tight">Smart Hotel</h2>
                <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{role} View</div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                    {visibleLinks.map((link) => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-6 py-3 transition-colors",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <link.icon className="w-5 h-5" />
                                <span className="font-medium">{link.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {currentUser?.userName.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{currentUser?.userName}</p>
                        <p className="text-xs text-slate-500 truncate">{currentUser?.userId}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
