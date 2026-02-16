import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    DoorOpen,
    LogOut,
    Wallet,
    CalendarCheck,
    Bed,
    Percent,
    Trash2,
    Wrench,
    XCircle,
    TrendingUp,
    ClipboardCheck,
    Star,
    Clock,
    Ban,
    AlertTriangle
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import clsx from 'clsx';

export default function Dashboard() {
    const { currentUser, currency } = useAuth();
    const [stats, setStats] = useState({
        today: {
            newBookings: 0,
            newAmount: 0,
            checkoutDone: 0,
            checkoutPending: 0,
            checkinDone: 0,
            checkinPending: 0
        },
        tomorrow: {
            checkout: 0,
            checkin: 0
        },
        general: {
            occupied: 0,
            available: 0,
            dirtySemi: 0,
            clean: 0,
            pendingTasks: 0,
            laundryOutside: 0,
            laundryInhouse: 0
        }
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!currentUser) return;
            const today = format(new Date(), 'yyyy-MM-dd');
            const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
            const hotelId = currentUser.hotelId;

            // Fetch Data
            const bookings = await db.bookings.find(b => b.hotelId === hotelId);
            const rooms = await db.rooms.find(r => r.hotelId === hotelId);
            const tasks = await db.tasks.find(t => t.hotelId === hotelId);
            const laundryMaster = await db.laundry.master.getAll();

            // TODAY
            const newBookingsToday = bookings.filter(b => b.bookingDate === today);

            setStats({
                today: {
                    newBookings: newBookingsToday.length,
                    newAmount: newBookingsToday.reduce((sum, b) => sum + (Number(b.totalBookingAmount) || 0), 0),
                    checkoutDone: bookings.filter(b => b.checkOutDate === today && !b.checkedIn && b.checkedIn !== undefined).length, // assuming checkedIn is set false on CO
                    checkoutPending: bookings.filter(b => b.checkOutDate === today && b.checkedIn).length,
                    checkinDone: bookings.filter(b => b.checkInDate === today && b.checkedIn).length,
                    checkinPending: bookings.filter(b => b.checkInDate === today && !b.checkedIn).length
                },
                tomorrow: {
                    checkout: bookings.filter(b => b.checkOutDate === tomorrow).length,
                    checkin: bookings.filter(b => b.checkInDate === tomorrow).length
                },
                general: {
                    occupied: rooms.filter(r => r.statusOfRoom === 'Occupied').length,
                    available: rooms.filter(r => r.statusOfRoom === 'Available').length,
                    dirtySemi: rooms.filter(r => r.cleaningStatus === 'Dirty' || r.cleaningStatus === 'Semi-Cleaned').length,
                    clean: rooms.filter(r => r.cleaningStatus === 'Clean').length,
                    pendingTasks: tasks.filter(t => t.status !== 'Completed').length,
                    laundryOutside: laundryMaster.reduce((sum, i) => sum + (Number(i.pendingOutside) || 0), 0),
                    laundryInhouse: laundryMaster.reduce((sum, i) => sum + (Number(i.pendingInhouse) || 0), 0)
                }
            });
        };

        fetchStats();

        // Subscribe to all relevant tables
        const bSub = db.subscribe('bookings', fetchStats);
        const rSub = db.subscribe('rooms', fetchStats);
        const tSub = db.subscribe('tasks', fetchStats);
        const lSub = db.subscribe('laundry_mast', fetchStats);

        return () => {
            bSub.unsubscribe();
            rSub.unsubscribe();
            tSub.unsubscribe();
            lSub.unsubscribe();
        };
    }, [currentUser]);

    const SectionHeader = ({ title }) => (
        <div className="bg-[#d9e2f3] px-4 py-2 border-y border-slate-300">
            <h3 className="font-bold text-slate-800 underline decoration-slate-400 underline-offset-4">{title}</h3>
        </div>
    );

    const StatRow = ({ label, value, index }) => (
        <div
            className={clsx(
                "grid grid-cols-2 border-b border-slate-200 transition-colors",
                index % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                "hover:bg-blue-50/30"
            )}
        >
            <div className="px-4 py-2.5 text-slate-600 border-r border-slate-200 text-[13px] font-medium flex items-center">{label}</div>
            <div className="px-4 py-2.5 text-slate-800 font-bold text-right sm:text-left text-sm flex items-center justify-end sm:justify-start">{value}</div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-300 overflow-hidden">
                <SectionHeader title="Today :" />
                <div className="flex flex-col">
                    <StatRow label="New bookings , No's" value={stats.today.newBookings} index={0} />
                    <StatRow label="New Booking Amount" value={`${currency}${stats.today.newAmount.toLocaleString()}`} index={1} />
                    <StatRow label="Check out Done" value={stats.today.checkoutDone} index={2} />
                    <StatRow label="Check out pending" value={stats.today.checkoutPending} index={3} />
                    <StatRow label="Check in Done : no's" value={stats.today.checkinDone} index={4} />
                    <StatRow label="Check in Pending" value={stats.today.checkinPending} index={5} />
                </div>

                <SectionHeader title="Tomorrow :" />
                <div className="flex flex-col">
                    <StatRow label="Check out" value={stats.tomorrow.checkout} index={0} />
                    <StatRow label="Check in" value={stats.tomorrow.checkin} index={1} />
                </div>

                <SectionHeader title="In General :" />
                <div className="flex flex-col">
                    <StatRow label="Rooms occupied" value={stats.general.occupied} index={0} />
                    <StatRow label="Available rooms" value={stats.general.available} index={1} />
                    <StatRow label="Dirty/Semi cleaned rooms" value={stats.general.dirtySemi} index={2} />
                    <StatRow label="Cleaned Rooms" value={stats.general.clean} index={3} />
                    <StatRow label="Pending House keeping Task" value={stats.general.pendingTasks} index={4} />
                    <StatRow label="Laundry Pending with Outsourced" value={stats.general.laundryOutside} index={5} />
                    <StatRow label="Laundry Pending Inhouse" value={stats.general.laundryInhouse} index={6} />
                </div>
            </div>

            <div className="flex items-center gap-2 px-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Dashboard • Updated {format(new Date(), 'HH:mm')}</p>
            </div>
        </div>
    );
}

