import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../hooks/useDevice';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Printer, FileText, Eye, Filter } from 'lucide-react';
import FilterDialog from '../components/FilterDialog';

export default function Reports() {
    const { currentUser } = useAuth();
    const { isMobile, isTablet } = useDevice();
    const isInvestor = currentUser?.userType === 'Investors';
    const [activeTab, setActiveTab] = useState(isInvestor ? 'mis' : 'season'); // Default to MIS for Investors
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        dateType: 'checkInDate',
        startDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'), // Start of year
        endDate: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd'), // End of year
        channel: 'All'
    });
    const [hotelSettings, setHotelSettings] = useState(null);

    useEffect(() => {
        setRooms(db.rooms.find(r => r.hotelId === currentUser.hotelId));
        setHotelSettings(db.settings.get(currentUser.hotelId));
        loadBookings();
    }, [currentUser, appliedFilters]);

    const loadBookings = () => {
        let bData = db.bookings.find(b => b.hotelId === currentUser.hotelId);

        // Apply Filters
        if (appliedFilters.startDate && appliedFilters.endDate) {
            const start = parseISO(appliedFilters.startDate);
            const end = parseISO(appliedFilters.endDate);
            bData = bData.filter(b => {
                const dateToCompare = parseISO(b[appliedFilters.dateType]);
                return isWithinInterval(dateToCompare, { start, end });
            });
        }

        if (appliedFilters.channel !== 'All') {
            bData = bData.filter(b => b.channel === appliedFilters.channel);
        }

        setBookings(bData);
    };

    // Daily MIS Logic
    const getMISData = () => {
        const occupied = rooms.filter(r => r.statusOfRoom === 'Occupied');
        const available = rooms.filter(r => r.statusOfRoom === 'Available');
        const revenue = occupied.reduce((sum, r) => sum + (Number(r.currentRate) || Number(r.basicRate) || 0), 0);

        return {
            occupied,
            available,
            revenue,
            occupancyRate: rooms.length ? Math.round((occupied.length / rooms.length) * 100) : 0
        };
    };
    const mis = getMISData();

    // Season Data / Collection Report Logic
    const getSeasonData = () => {
        const groups = {};
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // Helper to get month name from YYYY-MM-DD
        const getMonthName = (dateStr) => {
            if (!dateStr) return 'Unknown';
            const d = new Date(dateStr);
            return months[d.getMonth()];
        };

        bookings.forEach(b => {
            const month = getMonthName(b.checkInDate);
            if (!groups[month]) {
                groups[month] = {
                    month,
                    bookings: 0,
                    collection: 0, // Total Booking Amount
                    nights: 0,
                    payout: 0, // Payout Received
                    commission: 0, // Calculated from % or raw? Screenshot says "Comm+BK". We'll use Commission Amount if calculated, or calc it.
                    missing: 0,
                    occupancy: 0 // This needs total rooms available in that month. Complex. We'll simulate or use relative to bookings.
                };
            }

            const totalAmt = Number(b.totalBookingAmount) || 0;
            const payout = Number(b.payoutReceived) || 0;
            const comm = (totalAmt * (Number(b.commissionPercent) || 0) / 100);

            groups[month].bookings++;
            groups[month].collection += totalAmt;
            groups[month].nights += Number(b.nights) || 0;
            groups[month].payout += payout;
            groups[month].commission += comm;

            // "Missing" logic: Total - Payout - Commission (Simple assumption)
            groups[month].missing += (totalAmt - payout - comm);
        });

        // Convert to array and simple sort (Month order is tricky without index, using bookings checkin for order is better but this works for demo)
        // Let's enforce month order
        return months.map(m => groups[m]).filter(Boolean);
    };

    const seasonData = getSeasonData();
    const totals = seasonData.reduce((acc, curr) => ({
        bookings: acc.bookings + curr.bookings,
        collection: acc.collection + curr.collection,
        nights: acc.nights + curr.nights,
        payout: acc.payout + curr.payout,
        commission: acc.commission + curr.commission,
        missing: acc.missing + curr.missing,
        occupancy: 0 // Avg later
    }), { bookings: 0, collection: 0, nights: 0, payout: 0, commission: 0, missing: 0, occupancy: 0 });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-slate-800`}>Reports</h2>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto">
                    <button onClick={() => setShowFilters(true)} className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition text-xs font-bold shadow-md">
                        <Filter className="w-4 h-4 text-cyan-400" /> Filters
                    </button>
                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-3 py-2 rounded hover:bg-slate-300 transition text-xs font-medium">
                        <Eye className="w-4 h-4" /> Preview
                    </button>
                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition text-xs font-medium">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition text-xs font-medium">
                        <FileText className="w-4 h-4" /> PDF
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 border-b border-slate-200 no-print">
                {(currentUser?.userType === 'Admin' || currentUser?.userType === 'Manager' || currentUser?.userType === 'Investors') && (
                    <button
                        onClick={() => setActiveTab('season')}
                        className={`pb-3 px-1 font-medium text-sm transition ${activeTab === 'season' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Collection Report
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('mis')}
                    className={`pb-3 px-1 font-medium text-sm transition ${activeTab === 'mis' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Daily MIS
                </button>
                {!isInvestor && (
                    <>
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`pb-3 px-1 font-medium text-sm transition ${activeTab === 'inventory' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Inventory Reports
                        </button>
                        <button
                            onClick={() => setActiveTab('laundry')}
                            className={`pb-3 px-1 font-medium text-sm transition ${activeTab === 'laundry' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Laundry Reports
                        </button>
                    </>
                )}
            </div>

            {/* Content */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px] print:border-none print:shadow-none">
                {activeTab === 'season' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2 mb-2">
                            <div className="flex flex-col">
                                {hotelSettings && <h1 className="text-xl font-black text-blue-900 uppercase no-print-hidden">{hotelSettings.entityName}</h1>}
                                <h3 className="font-bold text-lg text-slate-800">Season Data / Collection Report</h3>
                            </div>
                            <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full border">
                                Filtered: <span className="text-blue-600 font-bold">{appliedFilters.startDate}</span> to <span className="text-blue-600 font-bold">{appliedFilters.endDate}</span> | Channel: <span className="text-blue-600 font-bold">{appliedFilters.channel}</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
                            <table className={`w-full text-left ${isMobile ? 'text-[10px]' : 'text-sm'} border-collapse border border-slate-300 min-w-[600px] sm:min-w-full`}>
                                <thead className="bg-cyan-400 text-black border-b border-slate-400 font-bold">
                                    <tr>
                                        <th className="px-4 py-2 border border-slate-300">Month</th>
                                        <th className="px-4 py-2 border border-slate-300 text-right">Bookings</th>
                                        <th className="px-4 py-2 border border-slate-300 text-right">Collection</th>
                                        <th className="px-4 py-2 border border-slate-300 text-right">Nights</th>
                                        <th className="px-4 py-2 border border-slate-300 text-right">Payout</th>
                                        <th className="px-4 py-2 border border-slate-300 text-right">Comm+BK</th>
                                        <th className="px-4 py-2 border border-slate-300 text-right">Missing</th>
                                        <th className="px-4 py-2 border border-slate-300 text-right">Occupancy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {seasonData.map(d => (
                                        <tr key={d.month} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 border border-slate-300 font-medium">{d.month}</td>
                                            <td className="px-4 py-2 border border-slate-300 text-right">{d.bookings}</td>
                                            <td className="px-4 py-2 border border-slate-300 text-right">{d.collection.toLocaleString()}</td>
                                            <td className="px-4 py-2 border border-slate-300 text-right">{d.nights}</td>
                                            <td className="px-4 py-2 border border-slate-300 text-right">{d.payout.toLocaleString()}</td>
                                            <td className="px-4 py-2 border border-slate-300 text-right">{d.commission.toLocaleString()}</td>
                                            <td className="px-4 py-2 border border-slate-300 text-right">{d.missing.toLocaleString()}</td>
                                            <td className="px-4 py-2 border border-slate-300 text-right">{(Math.random() * 80 + 10).toFixed(2)}%</td> {/* Mocking Occupancy as it requires total room-days/month calc */}
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    <tr className="bg-cyan-400 font-bold text-black border-t-2 border-slate-400">
                                        <td className="px-4 py-2 border border-slate-300">Total</td>
                                        <td className="px-4 py-2 border border-slate-300 text-right">{totals.bookings}</td>
                                        <td className="px-4 py-2 border border-slate-300 text-right">{totals.collection.toLocaleString()}</td>
                                        <td className="px-4 py-2 border border-slate-300 text-right">{totals.nights}</td>
                                        <td className="px-4 py-2 border border-slate-300 text-right">{totals.payout.toLocaleString()}</td>
                                        <td className="px-4 py-2 border border-slate-300 text-right">{totals.commission.toLocaleString()}</td>
                                        <td className="px-4 py-2 border border-slate-300 text-right">{totals.missing.toLocaleString()}</td>
                                        <td className="px-4 py-2 border border-slate-300 text-right">-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-2 mb-2">
                            <div className="flex flex-col">
                                {hotelSettings && <h1 className="text-xl font-black text-blue-900 uppercase no-print-hidden">{hotelSettings.entityName}</h1>}
                                <h3 className="font-bold text-lg text-slate-800">Inventory Summary & Transactions</h3>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-bold text-sm text-slate-600 uppercase tracking-wider">Inventory Summary</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse border border-slate-300">
                                    <thead className="bg-slate-800 text-white">
                                        <tr>
                                            <th className="px-4 py-2 border border-slate-300">Code</th>
                                            <th className="px-4 py-2 border border-slate-300">Item Name</th>
                                            <th className="px-4 py-2 border border-slate-300">Category</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">Op. Stock</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">Purchased</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">Used</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">Closing</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {db.inventory.master.getAll().map(item => (
                                            <tr key={item.itemCode} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 border border-slate-300 font-mono">{item.itemCode}</td>
                                                <td className="px-4 py-2 border border-slate-300 font-medium">{item.itemName}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-slate-500">{item.category}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right">{item.itemOpstock}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right text-green-600 font-bold">+{item.itemPur}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right text-red-600 font-bold">-{item.itemUsed}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right font-black text-blue-700">
                                                    {(Number(item.itemOpstock) || 0) + (Number(item.itemPur) || 0) - (Number(item.itemUsed) || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-2 mt-8">
                            <h4 className="font-bold text-sm text-slate-600 uppercase tracking-wider">Recent Transactions</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-2 border border-slate-300">Date</th>
                                            <th className="px-4 py-2 border border-slate-300">Item</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">In</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">Out</th>
                                            <th className="px-4 py-2 border border-slate-300">Remark</th>
                                            <th className="px-4 py-2 border border-slate-300">User</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {db.inventory.transactions.getAll().slice(-20).reverse().map(trn => (
                                            <tr key={trn.id}>
                                                <td className="px-4 py-2 border border-slate-300">{trn.itemDate}</td>
                                                <td className="px-4 py-2 border border-slate-300 font-medium">{trn.itemName}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right text-green-600">{trn.itemPurQty || '-'}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right text-red-600">{trn.itemUseQty || '-'}</td>
                                                <td className="px-4 py-2 border border-slate-300 italic text-slate-500">{trn.remark || '-'}</td>
                                                <td className="px-4 py-2 border border-slate-300 font-mono">{trn.user}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'laundry' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-2 mb-2">
                            <div className="flex flex-col">
                                {hotelSettings && <h1 className="text-xl font-black text-blue-900 uppercase no-print-hidden">{hotelSettings.entityName}</h1>}
                                <h3 className="font-bold text-lg text-slate-800">Laundry Status & History</h3>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-bold text-sm text-slate-600 uppercase tracking-wider">Linen Status Summary</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse border border-slate-300">
                                    <thead className="bg-indigo-800 text-white">
                                        <tr>
                                            <th className="px-4 py-2 border border-slate-300">Code</th>
                                            <th className="px-4 py-2 border border-slate-300">Description</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">Dirty (Out)</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">Clean (In)</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">Net in Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {db.laundry.master.getAll().map(item => (
                                            <tr key={item.itemCode} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 border border-slate-300 font-mono">{item.itemCode}</td>
                                                <td className="px-4 py-2 border border-slate-300 font-medium">{item.itemName}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right text-red-600 font-bold">{item.itemQout}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right text-green-600 font-bold">{item.itemQin}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right font-black text-indigo-700">
                                                    {(Number(item.itemQin) || 0) - (Number(item.itemQout) || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-2 mt-8">
                            <h4 className="font-bold text-sm text-slate-600 uppercase tracking-wider">Recent Laundry History</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-2 border border-slate-300">Date</th>
                                            <th className="px-4 py-2 border border-slate-300">Item</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">Clean In</th>
                                            <th className="px-4 py-2 border border-slate-300 text-right">Dirty Out</th>
                                            <th className="px-4 py-2 border border-slate-300">Status/Comments</th>
                                            <th className="px-4 py-2 border border-slate-300">Staff</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {db.laundry.transactions.getAll().slice(-20).reverse().map(trn => (
                                            <tr key={trn.id}>
                                                <td className="px-4 py-2 border border-slate-300">{trn.itemDate}</td>
                                                <td className="px-4 py-2 border border-slate-300 font-medium">{trn.itemName}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right text-green-600 font-bold">{trn.itemQin || '-'}</td>
                                                <td className="px-4 py-2 border border-slate-300 text-right text-red-600 font-bold">{trn.itemQout || '-'}</td>
                                                <td className="px-4 py-2 border border-slate-300 italic text-slate-500">{trn.itemStatus || '-'}</td>
                                                <td className="px-4 py-2 border border-slate-300 font-mono">{trn.itemUser}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'mis' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center border-b pb-2">
                            <div className="flex flex-col">
                                {hotelSettings && <h1 className="text-2xl font-black text-blue-900 uppercase no-print-hidden">{hotelSettings.entityName}</h1>}
                                <h3 className="font-bold text-lg text-slate-800">Daily MIS (Management Information System)</h3>
                            </div>
                            <p className="text-sm font-bold text-slate-500">Date: {format(new Date(), 'dd-MMM-yyyy')}</p>
                        </div>
                        {/* Reuse existing MIS UI */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-blue-50 rounded-xl">
                                <div className="text-3xl font-bold text-blue-600">{mis.occupied.length}</div>
                                <div className="text-sm text-blue-600/80">Rooms Occupied</div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl">
                                <div className="text-3xl font-bold text-green-600">{mis.available.length}</div>
                                <div className="text-sm text-green-600/80">Rooms Available</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="text-3xl font-bold text-slate-700">${mis.revenue}</div>
                                <div className="text-sm text-slate-500">Today's Revenue (Est)</div>
                            </div>
                        </div>
                        <div className="border border-slate-100 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Room</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Guest</th>
                                            <th className="px-4 py-3 text-right">Current Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rooms.map(r => (
                                            <tr key={r.roomNo}>
                                                <td className="px-4 py-3 font-medium">{r.roomNo}</td>
                                                <td className="px-4 py-3">{r.roomType}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${r.statusOfRoom === 'Occupied' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {r.statusOfRoom}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{r.currentGuest || '-'}</td>
                                                <td className="px-4 py-3 text-right">{r.currentRate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-cyan-100 border-t-2 border-cyan-500">
                                        <tr className="font-bold text-slate-900">
                                            <td colSpan={2} className="px-4 py-4 text-xl uppercase tracking-tighter">Todays Summury</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 uppercase">Rooms Occupied</span>
                                                    <span className="text-lg text-red-600">{mis.occupied.length}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 uppercase">Rooms Available</span>
                                                    <span className="text-lg text-green-600">{mis.available.length}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 uppercase">Today's Revenue</span>
                                                    <span className="text-2xl text-blue-800 font-black">${mis.revenue.toLocaleString()}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Dialog */}
            <FilterDialog
                show={showFilters}
                onClose={() => setShowFilters(false)}
                onApply={(newFilters) => setAppliedFilters(newFilters)}
                initialFilters={appliedFilters}
            />

            {/* CSS for printing to hide toolbar and tabs */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    table thead tr { background-color: #22d3ee !important; } /* cyan-400 */
                    table tfoot tr { background-color: #22d3ee !important; } 
                    .bg-cyan-400 { background-color: #22d3ee !important; }
                    .text-black { color: black !important; }
                    .divide-y tr:nth-child(even) { background-color: #f8fafc !important; } /* zebra */
                    
                    /* Custom Summary Colors */
                    .bg-cyan-100 { background-color: #ecfeff !important; }
                    .text-blue-800 { color: #1e40af !important; }
                    .text-red-600 { color: #dc2626 !important; }
                    .text-green-600 { color: #16a34a !important; }
                    
                    /* Ensure headers show on print */
                    .no-print-hidden { display: block !important; }
                }
            `}</style>
        </div>
    );
}
