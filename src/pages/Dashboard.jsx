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

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({
        arrivals: 0,
        departures: 0,
        inHouse: 0,
        availableRooms: 0,
        newBookings: 0,
        monthlyRevenue: 0,
        occupancyRate: 0,
        dirtyRooms: 0,
        outOfService: 0,
        maintenanceOpen: 0,
        expectedTomorrow: 0,
        vipArrivals: 0,
        cancelledToday: 0,
        adr: 0,
        revpar: 0,
        inspectionsNeeded: 0
    });

    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
        const hotelId = currentUser.hotelId;

        // Fetch Data
        const bookings = db.bookings.find(b => b.hotelId === hotelId);
        const rooms = db.rooms.find(r => r.hotelId === hotelId);
        const tasks = db.tasks.find(t => t.hotelId === hotelId);

        // Basic Counts
        const arrivals = bookings.filter(b => b.checkInDate === today && !b.checkedIn).length;
        const departures = bookings.filter(b => b.checkOutDate === today && b.checkedIn).length;
        const newBookingsToday = bookings.filter(b => b.bookingDate === today).length;
        const availableRooms = rooms.filter(r => r.statusOfRoom === 'Available').length;
        const inHouse = rooms.filter(r => r.statusOfRoom === 'Occupied').length;
        const totalRooms = rooms.length || 1;

        // Revenue & Rates
        const currentMonth = today.substring(0, 7);
        const monthlyBookings = bookings.filter(b => b.checkInDate.startsWith(currentMonth));
        const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (Number(b.totalBookingAmount) || 0), 0);

        const roomsSoldMonth = monthlyBookings.length || 1;
        const adr = monthlyRevenue / roomsSoldMonth;
        const revpar = monthlyRevenue / (totalRooms * 30); // Simple 30-day approximation

        // Housekeeping & Maintenance
        const dirtyRooms = rooms.filter(r => r.cleaningStatus === 'Dirty').length;
        const outOfService = rooms.filter(r => r.statusOfRoom === 'Maintenance' || r.statusOfRoom === 'Out Of Order').length;
        const inspectionsNeeded = rooms.filter(r => r.cleaningStatus === 'Inspected' || r.cleaningStatus === 'Ready').length; // Mock logic
        const maintenanceOpen = tasks.filter(t => t.type === 'Maintenance' && t.status !== 'Completed').length;

        // Future & Special
        const expectedTomorrow = bookings.filter(b => b.checkInDate === tomorrow).length;
        const vipArrivals = bookings.filter(b => b.checkInDate === today && b.isVip).length;
        const cancelledToday = bookings.filter(b => b.status === 'Cancelled' && b.modifiedDate === today).length;

        const occupancyRate = (inHouse / totalRooms) * 100;

        setStats({
            arrivals,
            departures,
            inHouse,
            availableRooms,
            newBookings: newBookingsToday,
            monthlyRevenue,
            occupancyRate,
            dirtyRooms,
            outOfService,
            maintenanceOpen,
            expectedTomorrow,
            vipArrivals,
            cancelledToday,
            adr,
            revpar,
            inspectionsNeeded
        });
    }, [currentUser]);

    const cards = [
        { label: 'Arrivals Today', value: stats.arrivals, icon: DoorOpen, color: 'bg-blue-500' },
        { label: 'Departures Today', value: stats.departures, icon: LogOut, color: 'bg-orange-500' },
        { label: 'In House Guests', value: stats.inHouse, icon: Users, color: 'bg-purple-500' },
        { label: 'Available Rooms', value: stats.availableRooms, icon: Bed, color: 'bg-green-500' },
        { label: 'Occupancy Rate', value: `${stats.occupancyRate.toFixed(1)}%`, icon: Percent, color: 'bg-cyan-500' },
        { label: 'Dirty Rooms', value: stats.dirtyRooms, icon: Trash2, color: 'bg-red-400' },
        { label: 'Out of Service', value: stats.outOfService, icon: Ban, color: 'bg-slate-500' },
        { label: 'Open Tasks', value: stats.maintenanceOpen, icon: Wrench, color: 'bg-amber-500' },
        { label: 'New Bookings', value: stats.newBookings, icon: CalendarCheck, color: 'bg-indigo-500' },
        { label: 'Revenue (Month)', value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: Wallet, color: 'bg-emerald-600' },
        { label: 'Avg Daily Rate', value: `$${stats.adr.toFixed(0)}`, icon: TrendingUp, color: 'bg-lime-600' },
        { label: 'RevPAR', value: `$${stats.revpar.toFixed(0)}`, icon: ClipboardCheck, color: 'bg-teal-600' },
        { label: 'Arrivals Tomorrow', value: stats.expectedTomorrow, icon: Clock, color: 'bg-blue-400' },
        { label: 'VIP Guests', value: stats.vipArrivals, icon: Star, color: 'bg-yellow-500' },
        { label: 'Cancelled Today', value: stats.cancelledToday, icon: XCircle, color: 'bg-rose-500' },
        { label: 'Alerts', value: stats.inspectionsNeeded > 5 ? 'High' : 'Normal', icon: AlertTriangle, color: 'bg-orange-600' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Hotel Overview</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <p className="text-slate-500 text-sm font-medium">Live Dashboard • {format(new Date(), 'MMMM dd, yyyy')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 flex items-center justify-between hover:translate-y-[-2px] transition-all duration-300">
                        <div>
                            <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
                            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                        </div>
                        <div className={`w-11 h-11 rounded-1.5xl ${card.color} flex items-center justify-center text-white shadow-lg opacity-90`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

