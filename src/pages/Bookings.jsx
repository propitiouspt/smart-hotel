import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Save, Plus, Printer, ArrowLeft, Trash2 } from 'lucide-react';
import { differenceInDays, format, isWithinInterval, parseISO } from 'date-fns';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { MessageModal, ConfirmModal } from '../components/Modal';
import FilterDialog from '../components/FilterDialog';
import { Filter } from 'lucide-react';

export default function Bookings() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [hotelSettings, setHotelSettings] = useState(null);

    // Modes: 'VIEW', 'NEW', 'EDIT'
    const [viewMode, setViewMode] = useState('VIEW');
    const [printMode, setPrintMode] = useState('NONE'); // 'NONE', 'SINGLE', 'REGISTER'
    const [showFilters, setShowFilters] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        dateType: 'bookingDate',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd'),
        channel: 'All'
    });

    // Modal State
    const [messageModal, setMessageModal] = useState({ show: false, message: '', title: 'System Message' });
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

    // Form State
    const initialForm = {
        bookingId: '',
        channel: 'Direct',
        bookingDate: format(new Date(), 'yyyy-MM-dd'),
        nationality: '',
        mainGuestName: '',
        checkInDate: format(new Date(), 'yyyy-MM-dd'),
        checkOutDate: format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd'),

        totalGuests: 1,
        children: 0,
        childrenAges: '',
        roomType: 'T0',
        nights: 1,

        totalBookingAmount: 0,
        commissionPercent: '',
        commissionAmount: '', // New Field
        taxPercent: '',
        taxAmount: '',
        cityTax: '',
        securityDeposit: '',

        paymentMode: '',
        collectedBy: '',
        directPaymentMode: '',
        payoutReceived: '',
        receivedBy: '',

        arrivalTime: '',
        remarks: '',
        contactPhone: '',
        contactEmail: '',
        assignedRoomNo: ''
    };
    const [formData, setFormData] = useState(initialForm);

    // Load Data
    const loadData = () => {
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

        setBookings(bData.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)));
        const rData = db.rooms.find(r => r.hotelId === currentUser.hotelId);
        setRooms(rData);
        setHotelSettings(db.settings.get(currentUser.hotelId));
    };

    useEffect(() => {
        loadData();
    }, [currentUser, appliedFilters]);

    // NIGHTS Calculation
    useEffect(() => {
        if (formData.checkInDate && formData.checkOutDate) {
            const start = new Date(formData.checkInDate);
            const end = new Date(formData.checkOutDate);
            const diff = differenceInDays(end, start);
            setFormData(prev => ({ ...prev, nights: diff > 0 ? diff : 0 }));
        }
    }, [formData.checkInDate, formData.checkOutDate]);

    // TAX Calculation
    useEffect(() => {
        if (viewMode !== 'VIEW') {
            if (formData.totalBookingAmount && formData.taxPercent) {
                const amount = (Number(formData.totalBookingAmount) * Number(formData.taxPercent)) / 100;
                setFormData(prev => ({ ...prev, taxAmount: amount.toFixed(2) }));
            }
        }
    }, [formData.totalBookingAmount, formData.taxPercent, viewMode]);

    // COMMISSION Calculation
    useEffect(() => {
        if (viewMode !== 'VIEW') {
            if (formData.totalBookingAmount && formData.commissionPercent) {
                const amount = (Number(formData.totalBookingAmount) * Number(formData.commissionPercent)) / 100;
                setFormData(prev => ({ ...prev, commissionAmount: amount.toFixed(2) }));
            }
        }
    }, [formData.totalBookingAmount, formData.commissionPercent, viewMode]);


    // --- ACTION HANDLERS ---

    const handleSelect = (booking) => {
        if (viewMode === 'NEW') return;
        setSelectedBooking(booking);
        setFormData(booking);
        setViewMode('VIEW');
    };

    const handleNew = () => {
        setViewMode('NEW');
        setSelectedBooking(null);
        setFormData({
            ...initialForm,
            bookingId: `BK-${Date.now()}` // Simple ID
        });
    };

    const handleEditSelected = () => {
        if (!selectedBooking) return;
        setViewMode('EDIT');
    };

    const handleSave = (e) => {
        e.preventDefault();
        db.bookings.save({ ...formData, hotelId: currentUser.hotelId });
        loadData();
        setMessageModal({ show: true, message: 'Booking Saved Successfully!', title: 'System Message' });
        setViewMode('VIEW');
    };

    const handleDelete = () => {
        if (!selectedBooking) return;
        setConfirmModal({
            show: true,
            message: 'Are you sure you want to delete this booking?',
            onConfirm: () => {
                // Actual delete logic here if needed
                setMessageModal({ show: true, message: 'Delete functionality implemented (Mock).', title: 'System Message' });
            }
        });
    };

    const handleBack = () => {
        if (viewMode === 'NEW' || viewMode === 'EDIT') {
            setViewMode('VIEW');
            if (selectedBooking) {
                setFormData(selectedBooking);
            } else {
                setFormData(initialForm);
            }
        } else {
            navigate('/');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- RENDER HELPERS ---
    const isFormDisabled = viewMode === 'VIEW';
    const isGridLocked = viewMode !== 'VIEW';

    return (
        <div className="space-y-4 max-w-[1400px] mx-auto">
            {/* Header / Top Actions - HIDDEN ON PRINT */}
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200 print:hidden">
                <h2 className="text-2xl font-bold text-slate-800">Advance Bookings</h2>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleNew}
                        disabled={viewMode === 'NEW' || viewMode === 'EDIT'}
                        className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded border border-blue-300 hover:bg-blue-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                        New Booking
                    </button>
                    <button
                        onClick={() => setShowFilters(true)}
                        className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-900 transition font-bold shadow-md"
                    >
                        <Filter className="w-4 h-4 text-cyan-400" />
                        Filter Options
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={viewMode === 'VIEW'}
                        className="flex items-center gap-2 bg-green-200 text-green-800 px-6 py-2 rounded border border-green-400 hover:bg-green-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        Save Booking
                    </button>
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 bg-red-200 text-red-800 px-6 py-2 rounded border border-red-300 hover:bg-red-300 transition font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
            </div>

            {/* Main Form Area - HIDDEN ON PRINT */}
            <div className="bg-slate-100 p-6 rounded-lg border border-slate-300 shadow-sm print:hidden">
                <form className="grid gap-y-3 gap-x-6 text-sm" autoComplete="off">
                    {/* Row 1 */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-1 text-slate-700 font-medium">Booking Id</label>
                        <input name="bookingId" value={formData.bookingId} readOnly className="col-span-3 px-2 py-1 border border-slate-300 bg-white rounded bg-slate-50" />
                        <label className="col-span-1 text-slate-700 font-medium">Channel</label>
                        <select name="channel" value={formData.channel} onChange={handleChange} disabled={isFormDisabled} className="col-span-2 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500">
                            <option>Direct</option><option>Booking.com</option><option>Airbnb</option><option>Expedia</option>
                        </select>
                        <label className="col-span-1 text-slate-700 font-medium whitespace-nowrap">Booking Date</label>
                        <input type="date" name="bookingDate" value={formData.bookingDate} onChange={handleChange} disabled={isFormDisabled} className="col-span-2 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        <label className="col-span-1 text-slate-700 font-medium">Nationality</label>
                        <input name="nationality" value={formData.nationality} onChange={handleChange} disabled={isFormDisabled} className="col-span-1 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-1 text-slate-700 font-medium">Main Guest</label>
                        <input name="mainGuestName" value={formData.mainGuestName} onChange={handleChange} disabled={isFormDisabled} className="col-span-5 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        <label className="col-span-1 text-slate-700 font-medium">Check in dt.</label>
                        <div className="col-span-2 flex gap-1"><input type="date" name="checkInDate" value={formData.checkInDate} onChange={handleChange} disabled={isFormDisabled} className="w-full px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" /></div>
                        <label className="col-span-1 text-slate-700 font-medium">Check out dt.</label>
                        <div className="col-span-2 flex gap-1"><input type="date" name="checkOutDate" value={formData.checkOutDate} onChange={handleChange} disabled={isFormDisabled} className="w-full px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" /></div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-1 text-slate-700 font-medium">Total Guest</label>
                        <div className="col-span-5 flex items-center gap-2">
                            <input type="number" name="totalGuests" value={formData.totalGuests} onChange={handleChange} disabled={isFormDisabled} className="w-16 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                            <label className="text-slate-700 font-medium">Childrens</label>
                            <input type="number" name="children" value={formData.children} onChange={handleChange} disabled={isFormDisabled} className="w-16 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                            <label className="text-slate-700 font-medium">Age</label>
                            <input name="childrenAges" value={formData.childrenAges} onChange={handleChange} disabled={isFormDisabled} placeholder="e.g. 5, 8" className="flex-1 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        </div>
                        <label className="col-span-1 text-slate-700 font-medium">Room Type</label>
                        <select name="roomType" value={formData.roomType} onChange={handleChange} disabled={isFormDisabled} className="col-span-2 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500">
                            <option value="T0">T0 (Single)</option><option value="T1">T1 (Double)</option><option value="T1F">T1F (Family)</option><option value="T2">T2 (Suite)</option>
                        </select>
                        <label className="col-span-1 text-slate-700 font-medium">No. of Nights</label>
                        <input value={formData.nights} readOnly className="col-span-2 px-2 py-1 bg-green-500 text-white font-bold rounded text-center" />
                    </div>

                    {/* Row 4 */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-2 text-slate-700 font-medium">Total Booking Amount</label>
                        <input type="number" name="totalBookingAmount" value={formData.totalBookingAmount} onChange={handleChange} disabled={isFormDisabled} className="col-span-2 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        <label className="col-span-2 text-slate-700 font-medium text-right pr-2">Commision % & Amt</label>
                        <div className="col-span-2 flex gap-1">
                            <input type="number" name="commissionPercent" placeholder="%" value={formData.commissionPercent} onChange={handleChange} disabled={isFormDisabled} className="w-1/3 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                            <input type="number" name="commissionAmount" placeholder="Amt" value={formData.commissionAmount} onChange={handleChange} disabled={isFormDisabled} className="w-2/3 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        </div>
                        <label className="col-span-2 text-slate-700 font-medium text-right pr-2">Tax % & Amount</label>
                        <div className="col-span-2 flex gap-1">
                            <input type="number" name="taxPercent" placeholder="%" value={formData.taxPercent} onChange={handleChange} disabled={isFormDisabled} className="w-1/3 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                            <input type="number" name="taxAmount" placeholder="Amt" value={formData.taxAmount} onChange={handleChange} disabled={isFormDisabled} className="w-2/3 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        </div>
                    </div>

                    {/* Row 5 */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-2 text-slate-700 font-medium">City Tax Amount</label>
                        <input type="number" name="cityTax" value={formData.cityTax} onChange={handleChange} disabled={isFormDisabled} className="col-span-2 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        <label className="col-span-2 text-slate-700 font-medium text-right pr-2">Security Deposite</label>
                        <input type="number" name="securityDeposit" value={formData.securityDeposit} onChange={handleChange} disabled={isFormDisabled} className="col-span-2 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        <label className="col-span-1 text-slate-700 font-medium text-right pr-2">Mode</label>
                        <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} disabled={isFormDisabled} className="col-span-1 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500">
                            <option value="">Select</option><option value="Cash">Cash</option><option value="Bank Trf">Bank Trf</option><option value="Card">Card</option>
                        </select>
                        <label className="col-span-1 text-slate-700 font-medium text-right pr-2">Collected by</label>
                        <input name="collectedBy" value={formData.collectedBy} onChange={handleChange} disabled={isFormDisabled} className="col-span-1 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                    </div>

                    {/* Row 6 */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-3 text-slate-700 font-medium">Direct Booking Payment mode</label>
                        <select name="directPaymentMode" value={formData.directPaymentMode} onChange={handleChange} disabled={isFormDisabled} className="col-span-2 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500">
                            <option value="">Select</option><option value="Cash">Cash</option><option value="Bank Trf">Bank Trf</option><option value="Card">Card</option>
                        </select>
                        <label className="col-span-2 text-slate-700 font-medium text-right pr-2">Payout Received</label>
                        <input type="number" name="payoutReceived" value={formData.payoutReceived} onChange={handleChange} disabled={isFormDisabled} className="col-span-2 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        <label className="col-span-1 text-slate-700 font-medium text-right pr-2">Received by</label>
                        <input name="receivedBy" value={formData.receivedBy} onChange={handleChange} disabled={isFormDisabled} className="col-span-2 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                    </div>

                    {/* Row 7 */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-1 text-slate-700 font-medium">Arrival time</label>
                        <input type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} disabled={isFormDisabled} className="col-span-2 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        <label className="col-span-1 text-slate-700 font-medium text-right pr-2">Remarks</label>
                        <input name="remarks" value={formData.remarks} onChange={handleChange} disabled={isFormDisabled} className="col-span-8 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                    </div>

                    {/* Row 8 */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-2 text-slate-700 font-medium">Contact No. & Email</label>
                        <div className="col-span-10 flex gap-4">
                            <input name="contactPhone" placeholder="Phone Number" value={formData.contactPhone} onChange={handleChange} disabled={isFormDisabled} className="flex-1 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                            <input name="contactEmail" placeholder="Email Address" value={formData.contactEmail} onChange={handleChange} disabled={isFormDisabled} className="flex-1 px-2 py-1 border border-slate-300 bg-white rounded disabled:bg-slate-100 disabled:text-slate-500" />
                        </div>
                    </div>
                </form>
            </div>

            {/* Grid / List View (Interactive) - HIDDEN ON PRINT */}
            <div className={clsx(
                "bg-white border-2 border-slate-300 min-h-[300px] overflow-hidden transition-opacity print:hidden",
                isGridLocked && "opacity-50 pointer-events-none"
            )}>
                <div className="overflow-auto h-[400px]">
                    <table className="w-full text-left text-sm border-collapse min-w-[1600px]">
                        <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300">
                            <tr>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-32">Booking Id</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-32">Channel</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-48">Main Guest</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Room Type</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Check In</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Check Out</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-20">Nights</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Total Amt</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Comm. Amt</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Tax Amt</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">City Tax</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Payout</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {bookings.map((booking) => (
                                <tr
                                    key={booking.bookingId}
                                    onClick={() => handleSelect(booking)}
                                    className={clsx(
                                        "cursor-pointer hover:bg-blue-50 transition",
                                        selectedBooking?.bookingId === booking.bookingId ? "bg-blue-100 text-blue-900" : "odd:bg-white even:bg-slate-50"
                                    )}
                                >
                                    <td className="px-4 py-2 border-r border-slate-200 font-medium">{booking.bookingId}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.channel}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.mainGuestName}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.roomType}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.checkInDate}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.checkOutDate}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.nights}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.totalBookingAmount}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.commissionAmount || 0}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.taxAmount || 0}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.cityTax || 0}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.payoutReceived || 0}</td>
                                    <td className="px-4 py-2">
                                        {booking.checkedIn ? <span className="text-green-600 font-bold">Checked In</span> : 'Pending'}
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={13} className="px-4 py-12 text-center text-slate-400">
                                        No bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-400">
                            <tr>
                                <td className="px-4 py-2 border-r border-slate-300">Count: {bookings.length}</td>
                                <td colSpan={5} className="px-4 py-2 border-r border-slate-300 text-right">Page Total:</td>
                                <td className="px-4 py-2 border-r border-slate-300">
                                    {bookings.reduce((sum, b) => sum + (Number(b.nights) || 0), 0)}
                                </td>
                                <td className="px-4 py-2 border-r border-slate-300">
                                    {bookings.reduce((sum, b) => sum + (Number(b.totalBookingAmount) || 0), 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-2 border-r border-slate-300">
                                    {bookings.reduce((sum, b) => sum + (Number(b.commissionAmount) || 0), 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-2 border-r border-slate-300">
                                    {bookings.reduce((sum, b) => sum + (Number(b.taxAmount) || 0), 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-2 border-r border-slate-300">
                                    {bookings.reduce((sum, b) => sum + (Number(b.cityTax) || 0), 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-2 border-r border-slate-300">
                                    {bookings.reduce((sum, b) => sum + (Number(b.payoutReceived) || 0), 0).toFixed(2)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Bottom Actions - Actions for Selected Booking - HIDDEN ON PRINT */}
            <div className="flex gap-4 mt-2 print:hidden">
                <button
                    onClick={handleEditSelected}
                    disabled={!selectedBooking || viewMode === 'NEW' || viewMode === 'EDIT'}
                    className="flex-1 bg-blue-300 text-blue-900 px-4 py-2 rounded hover:bg-blue-400 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Edit selected Booking
                </button>
                <button
                    onClick={() => {
                        setPrintMode('SINGLE');
                        setTimeout(() => window.print(), 100);
                    }}
                    disabled={!selectedBooking}
                    className="flex-1 bg-blue-300 text-blue-900 px-4 py-2 rounded hover:bg-blue-400 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Print Single Booking
                </button>
                <button
                    onClick={() => {
                        setPrintMode('REGISTER');
                        setTimeout(() => window.print(), 100);
                    }}
                    disabled={viewMode === 'NEW' || viewMode === 'EDIT'}
                    className="flex-1 bg-blue-300 text-blue-900 px-4 py-2 rounded hover:bg-blue-400 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Print Booking Register
                </button>
                <button
                    onClick={handleDelete}
                    disabled={!selectedBooking || viewMode === 'NEW' || viewMode === 'EDIT'}
                    className="flex-1 bg-red-200 text-red-900 px-4 py-2 rounded hover:bg-red-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    delete selected Booking
                </button>
            </div>

            {/* PRINT-ONLY View for Booking Register */}
            {printMode === 'REGISTER' && (
                <div className="hidden print:block font-sans">
                    {hotelSettings && <h1 className="text-2xl font-black text-blue-900 uppercase mb-1">{hotelSettings.entityName}</h1>}
                    <h1 className="text-xl font-bold text-blue-800 mb-4">Booking Register</h1>
                    <table className="w-full text-left text-sm border border-slate-300">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="border p-2 font-semibold">Booking ID</th>
                                <th className="border p-2 font-semibold">Guest</th>
                                <th className="border p-2 font-semibold">Channel</th>
                                <th className="border p-2 font-semibold">Check-In</th>
                                <th className="border p-2 font-semibold">Check-Out</th>
                                <th className="border p-2 font-semibold">Room</th>
                                <th className="border p-2 font-semibold">Nights</th>
                                <th className="border p-2 font-semibold">Amount</th>
                                <th className="border p-2 font-semibold">Comm.</th>
                                <th className="border p-2 font-semibold">Tax</th>
                                <th className="border p-2 font-semibold">City Tax</th>
                                <th className="border p-2 font-semibold">Payout</th>
                                <th className="border p-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(booking => (
                                <tr key={booking.bookingId} className="odd:bg-white even:bg-slate-50">
                                    <td className="border p-2">{booking.bookingId}</td>
                                    <td className="border p-2">{booking.mainGuestName}</td>
                                    <td className="border p-2">{booking.channel}</td>
                                    <td className="border p-2">{booking.checkInDate}</td>
                                    <td className="border p-2">{booking.checkOutDate}</td>
                                    <td className="border p-2">{booking.assignedRoomNo || '-'}</td>
                                    <td className="border p-2">{booking.nights}</td>
                                    <td className="border p-2">{booking.totalBookingAmount}</td>
                                    <td className="border p-2">{booking.commissionAmount || 0}</td>
                                    <td className="border p-2">{booking.taxAmount || 0}</td>
                                    <td className="border p-2">{booking.cityTax || 0}</td>
                                    <td className="border p-2">{booking.payoutReceived || 0}</td>
                                    <td className="border p-2">{booking.checkedIn ? 'Checked In' : 'Pending'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <td className="border p-2">Count: {bookings.length}</td>
                                <td colSpan={5} className="border p-2 text-right">Grand Total:</td>
                                <td className="border p-2">
                                    {bookings.reduce((sum, b) => sum + (Number(b.nights) || 0), 0)}
                                </td>
                                <td className="border p-2">
                                    {bookings.reduce((sum, b) => sum + (Number(b.totalBookingAmount) || 0), 0).toFixed(2)}
                                </td>
                                <td className="border p-2">
                                    {bookings.reduce((sum, b) => sum + (Number(b.commissionAmount) || 0), 0).toFixed(2)}
                                </td>
                                <td className="border p-2">
                                    {bookings.reduce((sum, b) => sum + (Number(b.taxAmount) || 0), 0).toFixed(2)}
                                </td>
                                <td className="border p-2">
                                    {bookings.reduce((sum, b) => sum + (Number(b.cityTax) || 0), 0).toFixed(2)}
                                </td>
                                <td className="border p-2">
                                    {bookings.reduce((sum, b) => sum + (Number(b.payoutReceived) || 0), 0).toFixed(2)}
                                </td>
                                <td className="border p-2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* PRINT-ONLY View for Single Booking */}
            {printMode === 'SINGLE' && formData && (
                <div className="hidden print:block font-sans p-8 border border-slate-300">
                    <div className="flex justify-between items-start border-b pb-4 mb-6">
                        <div className="flex flex-col">
                            {hotelSettings && <h1 className="text-2xl font-black text-blue-900 uppercase">{hotelSettings.entityName}</h1>}
                            <h1 className="text-xl font-bold text-slate-800">Booking Details</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-medium text-slate-600">ID: {formData.bookingId}</p>
                            <p className="text-sm text-slate-400">Printed: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        {/* Section 1: Basic Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-slate-700 border-b pb-1">Guest Information</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-slate-500">Main Guest:</div>
                                <div className="font-medium">{formData.mainGuestName}</div>
                                <div className="text-slate-500">Nationality:</div>
                                <div className="font-medium">{formData.nationality}</div>
                                <div className="text-slate-500">Contact Phone:</div>
                                <div className="font-medium">{formData.contactPhone}</div>
                                <div className="text-slate-500">Contact Email:</div>
                                <div className="font-medium">{formData.contactEmail}</div>
                                <div className="text-slate-500">Total Guests:</div>
                                <div className="font-medium">{formData.totalGuests} (Children: {formData.children})</div>
                            </div>
                        </div>

                        {/* Section 2: Booking Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-slate-700 border-b pb-1">Reservation Details</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-slate-500">Channel:</div>
                                <div className="font-medium">{formData.channel}</div>
                                <div className="text-slate-500">Booking Date:</div>
                                <div className="font-medium">{formData.bookingDate}</div>
                                <div className="text-slate-500">Check-In:</div>
                                <div className="font-medium">{formData.checkInDate} (Arrival: {formData.arrivalTime})</div>
                                <div className="text-slate-500">Check-Out:</div>
                                <div className="font-medium">{formData.checkOutDate}</div>
                                <div className="text-slate-500">Nights:</div>
                                <div className="font-medium">{formData.nights}</div>
                                <div className="text-slate-500">Room Type:</div>
                                <div className="font-medium">{formData.roomType}</div>
                            </div>
                        </div>

                        {/* Section 3: Financials */}
                        <div className="space-y-4 col-span-2">
                            <h3 className="font-bold text-lg text-slate-700 border-b pb-1">Payment Information</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <div className="text-slate-500 text-sm">Total Amount</div>
                                    <div className="font-bold text-xl">{formData.totalBookingAmount}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-sm">Security Deposit</div>
                                    <div className="font-medium">{formData.securityDeposit}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-sm">City Tax</div>
                                    <div className="font-medium">{formData.cityTax}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-sm">Payout Received</div>
                                    <div className="font-medium">{formData.payoutReceived}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 mt-2">
                                <div>
                                    <div className="text-slate-500 text-sm">Commission ({formData.commissionPercent}%)</div>
                                    <div className="font-medium text-red-600">{formData.commissionAmount}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-sm">Tax ({formData.taxPercent}%)</div>
                                    <div className="font-medium">{formData.taxAmount}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-sm">Payment Mode</div>
                                    <div className="font-medium">{formData.paymentMode}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-sm">Direct Pay Mode</div>
                                    <div className="font-medium">{formData.directPaymentMode}</div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Remarks & Staff */}
                        <div className="col-span-2 mt-4 pt-4 border-t border-slate-200">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className="text-slate-500 mb-1">Remarks</div>
                                    <div className="p-3 bg-slate-50 rounded border border-slate-200 min-h-[60px]">{formData.remarks}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-slate-500 text-sm">Collected By</div>
                                        <div className="font-medium border-b border-slate-300 pb-1">{formData.collectedBy}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-sm">Received By</div>
                                        <div className="font-medium border-b border-slate-300 pb-1">{formData.receivedBy}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* --- CUSTOM MODALS --- */}

            <MessageModal
                show={messageModal.show}
                title={messageModal.title}
                message={messageModal.message}
                onOk={() => setMessageModal({ ...messageModal, show: false })}
            />

            <ConfirmModal
                show={confirmModal.show}
                message={confirmModal.message}
                onConfirm={() => {
                    confirmModal.onConfirm?.();
                    setConfirmModal({ ...confirmModal, show: false });
                }}
                onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
            />

            <FilterDialog
                show={showFilters}
                onClose={() => setShowFilters(false)}
                onApply={(newFilters) => setAppliedFilters(newFilters)}
                initialFilters={appliedFilters}
            />

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    table thead tr { background-color: #22d3ee !important; color: black !important; } /* cyan-400 */
                    table tfoot tr { background-color: #22d3ee !important; color: black !important; } 
                    .divide-y tr:nth-child(even) { background-color: #f8fafc !important; }
                    h1 { color: #1e3a8a !important; }
                }
            `}</style>
        </div>
    );
}
