import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../hooks/useDevice';
import { ArrowLeft, CheckCircle, LogIn, LogOut, X, Filter } from 'lucide-react';
import { differenceInDays, format, isWithinInterval, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { MessageModal, ConfirmModal, PasswordModal } from '../components/Modal';
import FilterDialog from '../components/FilterDialog';

export default function CheckInOut() {
    const { currentUser } = useAuth();
    const { isMobile, isTablet } = useDevice();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [hotelSettings, setHotelSettings] = useState(null);

    // Modes: 'VIEW', 'NEW', 'EDIT'
    const [viewMode, setViewMode] = useState('VIEW');
    const [printMode, setPrintMode] = useState('NONE'); // 'NONE', 'SINGLE', 'REGISTER', 'OUT_REGISTER'
    const [showFilters, setShowFilters] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        dateType: 'checkInDate',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd'), // Next 30 days
        channel: 'All'
    });

    // Form State - Matches Bookings.jsx
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
        assignedRoomNo: '',

        // Check-out specific
        checkoutNote: '',
        idProofMemo: '',
        idProofImages: [] // Array of Base64 strings
    };
    const [formData, setFormData] = useState(initialForm);

    // Modal State
    const [messageModal, setMessageModal] = useState({ show: false, message: '', title: 'System Message' });
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });
    const [passwordModal, setPasswordModal] = useState({ show: false, title: '', onConfirm: null });

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

        // Sort: active/today first
        setBookings(bData.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate)));
        const rData = db.rooms.find(r => r.hotelId === currentUser.hotelId);
        setRooms(rData);
        setHotelSettings(db.settings.get(currentUser.hotelId));
    };

    useEffect(() => {
        loadData();
    }, [currentUser, appliedFilters]);

    // Recalculate nights if dates change in this view
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

    // Handlers
    const handleSelect = (booking) => {
        if (viewMode === 'NEW' || viewMode === 'EDIT') return; // Lock grid during any edit/new
        setSelectedBooking(booking);
        setFormData({ ...initialForm, ...booking });
        setViewMode('VIEW');
    };

    const handleEditSelected = () => {
        if (!selectedBooking) return;
        setViewMode('EDIT');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImagePaste = async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (!file) continue;

                // Compress and resize image
                const base64 = await compressImage(file);
                setFormData(prev => ({
                    ...prev,
                    idProofImages: [...(prev.idProofImages || []), base64]
                }));
            }
        }
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            idProofImages: prev.idProofImages.filter((_, i) => i !== index)
        }));
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

    const handleSave = () => {
        db.bookings.save({ ...formData, hotelId: currentUser.hotelId });
        loadData();
        setMessageModal({ show: true, message: viewMode === 'NEW' ? 'New Booking Created!' : 'Booking Updated!', title: 'System Message' });
        setViewMode('VIEW');
    };

    const handleMarkCheckIn = () => {
        if (!selectedBooking) return;
        if (!formData.assignedRoomNo) {
            setMessageModal({ show: true, message: 'Please assign a room before checking in.', title: 'System Message' });
            return;
        }

        setConfirmModal({
            show: true,
            message: `Confirm Check-In for ${formData.mainGuestName}?`,
            onConfirm: () => {
                // Update Booking
                db.bookings.save({
                    ...formData,
                    hotelId: currentUser.hotelId,
                    checkedIn: true,
                    actualArrivalTime: new Date().toISOString(),
                    checkInTime: format(new Date(), 'HH:mm'),
                    checkedInBy: currentUser.userName
                });

                // Update Room
                const room = rooms.find(r => r.roomNo === formData.assignedRoomNo);
                if (room) {
                    db.rooms.save({
                        ...room,
                        statusOfRoom: 'Occupied',
                        currentGuest: formData.mainGuestName,
                        currentRate: formData.totalBookingAmount / (formData.nights || 1)
                    });
                }

                loadData();
                setMessageModal({ show: true, message: 'Guest Checked In Successfully', title: 'System Message' });
            }
        });
    };

    const handleMarkCheckOut = () => {
        if (!selectedBooking) return;
        setConfirmModal({
            show: true,
            message: `Confirm Check-Out for ${formData.mainGuestName}?`,
            onConfirm: () => {
                // Update Booking
                db.bookings.save({
                    ...formData,
                    hotelId: currentUser.hotelId,
                    checkedIn: false,
                    actualCheckoutDate: new Date().toISOString(),
                    checkOutTime: `${format(new Date(), 'HH:mm')} - ${currentUser.userName}`
                });

                // Update Room
                const room = rooms.find(r => r.roomNo === formData.assignedRoomNo);
                if (room) {
                    db.rooms.save({
                        ...room,
                        statusOfRoom: 'Available',
                        currentGuest: '',
                        currentRate: 0,
                        cleaningStatus: 'Dirty'
                    });
                }

                loadData();
                setMessageModal({ show: true, message: 'Guest Checked Out Successfully', title: 'System Message' });
            }
        });
    };

    const handleDelete = () => {
        if (!selectedBooking) return;
        if (currentUser.userType !== 'Admin') {
            setMessageModal({ show: true, message: 'Only Admin can delete bookings.', title: 'Security Restriction' });
            return;
        }

        setPasswordModal({
            show: true,
            title: 'Delete Booking Confirmation',
            onConfirm: (password) => {
                if (password === currentUser.password) {
                    db.bookings.delete(selectedBooking.bookingId);
                    loadData();
                    setSelectedBooking(null);
                    setFormData(initialForm);
                    setViewMode('VIEW');
                    setPasswordModal({ show: false });
                    setMessageModal({ show: true, message: 'Booking Deleted Successfully!', title: 'System Message' });
                } else {
                    setMessageModal({ show: true, message: 'Incorrect Password!', title: 'Security Error' });
                }
            }
        });
    };

    return (
        <div className="space-y-4 max-w-[1400px] mx-auto">
            {/* Header / Top Actions - HIDDEN ON PRINT */}
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 ${isMobile ? 'p-2' : 'p-4'} rounded-lg border border-slate-200 gap-4 print:hidden`}>
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold text-slate-800`}>Check- In / Out</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowFilters(true)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-4 py-2'} rounded-lg border border-slate-700 hover:bg-slate-900 transition font-bold shadow-md`}
                    >
                        <Filter size={isMobile ? 14 : 18} className="text-cyan-400" /> Filter
                    </button>
                    <button
                        onClick={handleEditSelected}
                        disabled={!selectedBooking || viewMode !== 'VIEW'}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-100 text-blue-700 ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-4 py-2'} rounded border border-blue-300 hover:bg-blue-200 transition font-medium disabled:opacity-50`}
                    >
                        Edit
                    </button>
                    <button
                        onClick={handleBack}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-200 text-red-800 ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-4 py-2'} rounded border border-red-300 hover:bg-red-300 transition font-medium`}
                    >
                        Back
                    </button>
                </div>
            </div>

            {/* Top Grid - HIDDEN ON PRINT */}
            <div className={clsx(
                "bg-white border-2 border-slate-300 min-h-[300px] overflow-hidden transition-opacity print:hidden",
                (viewMode === 'NEW' || viewMode === 'EDIT') && "opacity-50 pointer-events-none"
            )}>
                <div className="overflow-auto h-[350px] scrollbar-thin scrollbar-thumb-slate-300">
                    <table className={`w-full text-left ${isMobile ? 'text-[10px]' : 'text-sm'} border-collapse min-w-[1200px] lg:min-w-[1600px]`}>
                        <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300">
                            <tr>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-8"></th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-32">Booking Id</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-32">Channel</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-32">Main Guest</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Room Type</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Room No</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Check In</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Check Out</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-20">Nights</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Total Amt</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Comm. Amt</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Tax Amt</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">City Tax</th>
                                <th className="px-4 py-2 border-r border-slate-300 font-semibold text-slate-700 w-24">Payout</th>
                                <th className="px-4 py-2 font-semibold text-slate-700">Status</th>
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
                                    <td className="px-4 py-2 border-r border-slate-200 w-8 text-center">
                                        {booking.checkedIn && <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />}
                                    </td>
                                    <td className="px-4 py-2 border-r border-slate-200 font-medium">{booking.bookingId}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.channel}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.mainGuestName}</td>
                                    <td className="px-4 py-2 border-r border-slate-200 text-center">{booking.roomType}</td>
                                    <td className="px-4 py-2 border-r border-slate-200 text-center font-bold text-blue-700">{booking.assignedRoomNo || '-'}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.checkInDate}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.checkOutDate}</td>
                                    <td className="px-4 py-2 border-r border-slate-200 text-center">{booking.nights}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.totalBookingAmount}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.commissionAmount || 0}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.taxAmount || 0}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.cityTax || 0}</td>
                                    <td className="px-4 py-2 border-r border-slate-200">{booking.payoutReceived || 0}</td>
                                    <td className="px-4 py-2">
                                        {booking.checkedIn ? <span className="text-green-600 font-bold">In-House</span> : 'Pending'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-400">
                            <tr>
                                <td colSpan={2} className="px-4 py-2 border-r border-slate-300">Count: {bookings.length}</td>
                                <td colSpan={6} className="px-4 py-2 border-r border-slate-300 text-right">Totals:</td>
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

            {/* Form Area - HIDDEN ON PRINT */}
            <div className={`bg-slate-100 ${isMobile ? 'p-3' : 'p-6'} rounded-lg border border-slate-300 shadow-sm print:hidden`}>
                <form className={`grid grid-cols-1 ${isTablet ? 'grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-3 text-sm`} autoComplete="off">
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-bold">Booking Id</label>
                        <input name="bookingId" value={formData.bookingId} readOnly className="px-2 py-1.5 border border-slate-300 bg-yellow-100 rounded font-bold" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-bold">Channel</label>
                        <select name="channel" value={formData.channel} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-yellow-100 rounded disabled:opacity-80">
                            <option>Direct</option><option>Booking.com</option><option>Airbnb</option><option>Expedia</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-bold">Booking Date</label>
                        <input type="date" name="bookingDate" value={formData.bookingDate} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-yellow-100 rounded disabled:opacity-80" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-bold">Nationality</label>
                        <input name="nationality" value={formData.nationality} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-yellow-100 rounded disabled:opacity-80" />
                    </div>

                    <div className={`flex flex-col gap-1 ${isMobile ? '' : 'sm:col-span-2'}`}>
                        <label className="text-slate-700 font-medium">Main Guest</label>
                        <input name="mainGuestName" value={formData.mainGuestName} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Check in dt.</label>
                        <input type="date" name="checkInDate" value={formData.checkInDate} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-yellow-100 rounded disabled:opacity-80" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Check out dt.</label>
                        <input type="date" name="checkOutDate" value={formData.checkOutDate} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-yellow-100 rounded disabled:opacity-80" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Total Guest</label>
                        <input type="number" name="totalGuests" value={formData.totalGuests} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Childrens</label>
                        <input type="number" name="children" value={formData.children} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Age</label>
                        <input name="childrenAges" value={formData.childrenAges} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-bold text-blue-600">Assign Room</label>
                        <div className="flex gap-2">
                            <select name="roomType" value={formData.roomType} onChange={handleChange} disabled={viewMode === 'VIEW'} className="flex-1 px-1 py-1.5 border border-slate-300 bg-white rounded font-bold disabled:bg-slate-50">
                                <option value="T0">T0</option><option value="T1">T1</option><option value="T1F">T1F</option><option value="T2">T2</option>
                            </select>
                            <select name="assignedRoomNo" value={formData.assignedRoomNo} onChange={handleChange} disabled={viewMode === 'VIEW'} className="flex-1 px-1 py-1.5 border border-slate-300 bg-yellow-50 rounded text-xs font-bold">
                                <option value="">Room</option>
                                {rooms.filter(r => r.roomType === formData.roomType).map(r => (
                                    <option key={r.roomNo} value={r.roomNo}>{r.roomNo} ({r.statusOfRoom})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">No. of Nights</label>
                        <input value={formData.nights} readOnly className="px-2 py-1.5 bg-green-500 text-white font-bold rounded text-center" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Total Booking Amount</label>
                        <input type="number" name="totalBookingAmount" value={formData.totalBookingAmount} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Commision %</label>
                        <input type="number" name="commissionPercent" placeholder="%" value={formData.commissionPercent} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Commision Amt</label>
                        <input type="number" name="commissionAmount" placeholder="Amt" value={formData.commissionAmount} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-bold text-red-600">Tax %</label>
                        <input name="taxPercent" placeholder="%" value={formData.taxPercent} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Tax Amount</label>
                        <input name="taxAmount" placeholder="Amt" value={formData.taxAmount} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">City Tax Amount</label>
                        <input name="cityTax" value={formData.cityTax} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Security Deposite</label>
                        <input name="securityDeposit" value={formData.securityDeposit} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Payment Mode</label>
                        <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50">
                            <option value="">Select</option><option value="Cash">Cash</option><option value="Bank Trf">Bank Trf</option><option value="Card">Card</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Collected by</label>
                        <input name="collectedBy" value={formData.collectedBy} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Direct Pay Mode</label>
                        <select name="directPaymentMode" value={formData.directPaymentMode} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50">
                            <option value="">Select</option><option value="Cash">Cash</option><option value="Bank Trf">Bank Trf</option><option value="Card">Card</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Payout Received</label>
                        <input type="number" name="payoutReceived" value={formData.payoutReceived} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Received by</label>
                        <input name="receivedBy" value={formData.receivedBy} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-slate-700 font-medium">Arrival time</label>
                        <input type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className={`flex flex-col gap-1 ${isMobile ? '' : 'sm:col-span-2'}`}>
                        <label className="text-slate-700 font-medium">Remarks</label>
                        <input name="remarks" value={formData.remarks} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>

                    <div className={`flex flex-col gap-1 ${isMobile ? '' : 'sm:col-span-2'}`}>
                        <label className="text-slate-700 font-medium">Contact No.</label>
                        <input name="contactPhone" placeholder="Phone Number" value={formData.contactPhone} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                    <div className={`flex flex-col gap-1 ${isMobile ? '' : 'sm:col-span-2'}`}>
                        <label className="text-slate-700 font-medium">Email Address</label>
                        <input name="contactEmail" placeholder="Email Address" value={formData.contactEmail} onChange={handleChange} disabled={viewMode === 'VIEW'} className="px-2 py-1.5 border border-slate-300 bg-white rounded disabled:bg-slate-50" />
                    </div>
                </form>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mt-6">
                    <button onClick={handleSave} disabled={viewMode === 'VIEW'} className="bg-green-200 text-green-800 py-2 rounded border border-green-400 hover:bg-green-300 font-medium transition disabled:opacity-50">Save</button>
                    <button onClick={handleMarkCheckIn} disabled={!selectedBooking || formData.checkedIn || viewMode !== 'VIEW'} className="bg-blue-200 text-blue-800 py-2 rounded border border-blue-400 hover:bg-blue-300 font-medium transition disabled:opacity-50">Check-In</button>
                    <button onClick={() => { setPrintMode('SINGLE'); setTimeout(() => window.print(), 100); }} disabled={!selectedBooking || viewMode !== 'VIEW'} className="bg-blue-200 text-blue-800 py-2 rounded border border-blue-400 hover:bg-blue-300 font-medium transition disabled:opacity-50">Print Inv</button>
                    <button onClick={() => { setPrintMode('OUT_REGISTER'); setTimeout(() => window.print(), 100); }} disabled={viewMode !== 'VIEW'} className="bg-blue-200 text-blue-800 py-2 rounded border border-blue-400 hover:bg-blue-300 font-medium transition disabled:opacity-50">Register</button>
                    <button onClick={handleDelete} disabled={!selectedBooking || currentUser.userType !== 'Admin' || viewMode !== 'VIEW'} className="bg-red-200 text-red-800 py-2 rounded border border-red-300 hover:bg-red-300 font-medium transition disabled:opacity-50 font-bold">Delete</button>
                </div>

                {/* ID Proof Section - Always Editable for documentation */}
                <div className={`mt-4 ${isMobile ? 'p-3' : 'p-4'} bg-yellow-50 border-2 border-yellow-200 rounded-lg`}>
                    <label className="block text-sm font-bold text-yellow-800 mb-2 uppercase tracking-tight flex flex-col sm:flex-row justify-between gap-1">
                        <span>ID Proof Memo & Images (Paste Directly)</span>
                        <span className="text-[10px] text-yellow-600 font-normal">Pasted images are auto-compressed</span>
                    </label>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-8">
                            <textarea
                                name="idProofMemo"
                                value={formData.idProofMemo}
                                onChange={handleChange}
                                onPaste={handleImagePaste}
                                className="w-full h-32 p-3 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 font-mono text-sm shadow-inner"
                                placeholder="Paste Guest ID text or PICTURES here..."
                            ></textarea>
                        </div>
                        <div className="lg:col-span-4 border border-yellow-300 rounded bg-white p-2 overflow-y-auto max-h-32 flex flex-wrap gap-2">
                            {formData.idProofImages && formData.idProofImages.length > 0 ? (
                                formData.idProofImages.map((img, idx) => (
                                    <div key={idx} className="relative group w-20 h-20 border rounded overflow-hidden shadow-sm">
                                        <img src={img} alt="ID" className="w-full h-full object-cover cursor-zoom-in" onClick={() => window.open(img)} />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs text-center leading-tight italic">
                                    No images pasted yet.<br />Press Ctrl+V to paste ID pictures.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Check-Out Section */}
                <div className={`mt-4 pt-4 border-t border-slate-300 grid grid-cols-1 ${isTablet ? 'sm:grid-cols-2' : 'sm:grid-cols-12'} gap-4`}>
                    <div className={`${isTablet ? '' : 'sm:col-span-2'} flex flex-col justify-end gap-2`}>
                        <label className="text-slate-700 font-medium">Check-out Action</label>
                        <button onClick={handleMarkCheckOut} disabled={!selectedBooking || !formData.checkedIn} className="w-full bg-green-600 text-white py-4 rounded hover:bg-green-700 font-bold transition shadow-md disabled:opacity-50">
                            Check-Out
                        </button>
                    </div>
                    <div className={`${isTablet ? 'sm:col-span-2' : 'sm:col-span-8'}`}>
                        <label className="text-slate-700 font-medium mb-1 block">Check-out Note</label>
                        <textarea
                            name="checkoutNote"
                            value={formData.checkoutNote}
                            onChange={handleChange}
                            disabled={viewMode === 'VIEW'}
                            className="w-full h-24 p-2 border border-slate-300 bg-white rounded resize-none disabled:bg-slate-50"
                        ></textarea>
                    </div>
                    <div className={`${isTablet ? 'sm:col-span-2' : 'sm:col-span-2'} flex flex-col justify-end gap-2`}>
                        <label className="text-slate-700 font-medium">Reporting</label>
                        <button onClick={() => { setPrintMode('OUT_REGISTER'); setTimeout(() => window.print(), 100); }} disabled={viewMode !== 'VIEW'} className="w-full bg-slate-700 text-white py-4 rounded hover:bg-slate-800 font-bold transition leading-tight shadow-md disabled:opacity-50">
                            Print Reg
                        </button>
                    </div>
                </div>
            </div>

            {/* PRINT VIEWS */}
            {printMode === 'REGISTER' && (
                <div className="hidden print:block font-sans">
                    {hotelSettings && <h1 className="text-2xl font-black text-blue-900 uppercase mb-1 text-center">{hotelSettings.entityName}</h1>}
                    <h1 className="text-2xl font-bold text-blue-800 mb-4 text-center border-b-2 pb-2">Check-In / Out Register</h1>
                    <table className="w-full text-left text-[10px] border border-slate-300">
                        <thead className="bg-slate-100 uppercase">
                            <tr>
                                <th className="border p-1">ID</th>
                                <th className="border p-1">Main Guest</th>
                                <th className="border p-1 text-center">Type</th>
                                <th className="border p-1 text-center">Room No</th>
                                <th className="border p-1">Check-In</th>
                                <th className="border p-1">Check-Out</th>
                                <th className="border p-1 text-center">Nights</th>
                                <th className="border p-1 text-right">Amount</th>
                                <th className="border p-1 text-right">Comm.</th>
                                <th className="border p-1 text-right">Tax</th>
                                <th className="border p-1 text-right">Payout</th>
                                <th className="border p-1">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings
                                .filter(b => b.checkInTime) // Only guests who have checked in
                                .map(b => (
                                    <tr key={b.bookingId}>
                                        <td className="border p-1">{b.bookingId}</td>
                                        <td className="border p-1">{b.mainGuestName}</td>
                                        <td className="border p-1 text-center">{b.roomType}</td>
                                        <td className="border p-1 text-center font-bold text-blue-700">{b.assignedRoomNo || '-'}</td>
                                        <td className="border p-1">{b.checkInDate}</td>
                                        <td className="border p-1">{b.checkOutDate}</td>
                                        <td className="border p-1 text-center">{b.nights}</td>
                                        <td className="border p-1 text-right">{b.totalBookingAmount}</td>
                                        <td className="border p-1 text-right">{b.commissionAmount || 0}</td>
                                        <td className="border p-1 text-right">{b.taxAmount || 0}</td>
                                        <td className="border p-1 text-right">{b.payoutReceived || 0}</td>
                                        <td className="border p-1 font-bold">
                                            {b.checkedIn ? (
                                                <span className="text-blue-600">Staying</span>
                                            ) : (
                                                <span className="text-slate-600">Chk Out</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold">
                            <tr>
                                <td colSpan={6} className="border p-1 text-right">Grand Totals:</td>
                                <td className="border p-1 text-center">
                                    {bookings
                                        .filter(b => b.checkInTime)
                                        .reduce((s, b) => s + (Number(b.nights) || 0), 0)
                                    }
                                </td>
                                <td className="border p-1 text-right">
                                    {bookings
                                        .filter(b => b.checkInTime)
                                        .reduce((s, b) => s + (Number(b.totalBookingAmount) || 0), 0).toFixed(2)
                                    }
                                </td>
                                <td className="border p-1 text-right">
                                    {bookings
                                        .filter(b => b.checkInTime)
                                        .reduce((s, b) => s + (Number(b.commissionAmount) || 0), 0).toFixed(2)
                                    }
                                </td>
                                <td className="border p-1 text-right">
                                    {bookings
                                        .filter(b => b.checkInTime)
                                        .reduce((s, b) => s + (Number(b.taxAmount) || 0), 0).toFixed(2)
                                    }
                                </td>
                                <td className="border p-1 text-right">
                                    {bookings
                                        .filter(b => b.checkInTime)
                                        .reduce((s, b) => s + (Number(b.payoutReceived) || 0), 0).toFixed(2)
                                    }
                                </td>
                                <td className="border p-1"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {printMode === 'OUT_REGISTER' && (
                <div className="hidden print:block font-sans text-[8px]">
                    {hotelSettings && <h1 className="text-2xl font-black text-blue-900 uppercase mb-1 text-center">{hotelSettings.entityName}</h1>}
                    <h1 className="text-xl font-bold text-slate-800 mb-2 text-center border-b pb-1 uppercase tracking-tighter">Check-Out Register (Collection Summary)</h1>
                    <table className="w-full text-left border border-slate-400 border-collapse">
                        <thead className="bg-slate-50 uppercase font-black">
                            <tr>
                                <th className="border border-slate-400 p-1 w-12">BK ID</th>
                                <th className="border border-slate-400 p-1">Main Guest</th>
                                <th className="border border-slate-400 p-1 text-center">Room</th>
                                <th className="border border-slate-400 p-1">In Dt/Tm</th>
                                <th className="border border-slate-400 p-1">Out Dt/Tm</th>
                                <th className="border border-slate-400 p-1 text-center">Nts</th>
                                <th className="border border-slate-400 p-1 text-right">Total</th>
                                <th className="border border-slate-400 p-1 text-right">Payout</th>
                                <th className="border border-slate-400 p-1">Guest Memo / Checkout Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings
                                .filter(b => b.checkInTime && !b.checkedIn) // Only checked out guests
                                .map(b => (
                                    <tr key={b.bookingId}>
                                        <td className="border border-slate-400 p-1">{b.bookingId}</td>
                                        <td className="border border-slate-400 p-1 font-bold">{b.mainGuestName}</td>
                                        <td className="border border-slate-400 p-1 text-center font-black">{b.assignedRoomNo}</td>
                                        <td className="border border-slate-400 p-1 whitespace-nowrap">{b.checkInDate} {b.checkInTime}</td>
                                        <td className="border border-slate-400 p-1 whitespace-nowrap">{b.checkOutDate} {b.checkOutTime?.split(' - ')[0]}</td>
                                        <td className="border border-slate-400 p-1 text-center">{b.nights}</td>
                                        <td className="border border-slate-400 p-1 text-right">{b.totalBookingAmount}</td>
                                        <td className="border border-slate-400 p-1 text-right">{b.payoutReceived || 0}</td>
                                        <td className="border border-slate-400 p-1 italic text-slate-600 leading-tight">{b.checkoutNote || '-'}</td>
                                    </tr>
                                ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-black">
                            <tr>
                                <td colSpan={5} className="border border-slate-400 p-1 text-right">REGISTER TOTALS:</td>
                                <td className="border border-slate-400 p-1 text-center">
                                    {bookings.filter(b => b.checkInTime && !b.checkedIn).reduce((s, b) => s + (Number(b.nights) || 0), 0)}
                                </td>
                                <td className="border border-slate-400 p-1 text-right">
                                    {bookings.filter(b => b.checkInTime && !b.checkedIn).reduce((s, b) => s + (Number(b.totalBookingAmount) || 0), 0).toFixed(2)}
                                </td>
                                <td className="border border-slate-400 p-1 text-right">
                                    {bookings.filter(b => b.checkInTime && !b.checkedIn).reduce((s, b) => s + (Number(b.payoutReceived) || 0), 0).toFixed(2)}
                                </td>
                                <td className="border border-slate-400 p-1"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {printMode === 'SINGLE' && formData && (
                <div className="hidden print:block font-sans p-8 border-2 border-slate-300">
                    <div className="flex justify-between items-start border-b-4 border-blue-600 pb-4 mb-6">
                        <div>
                            {hotelSettings && (
                                <>
                                    <h1 className="text-4xl font-black text-blue-900 uppercase tracking-tighter">{hotelSettings.entityName}</h1>
                                    <p className="text-xs text-slate-500 font-bold max-w-xs">{hotelSettings.address}</p>
                                    <p className="text-xs text-slate-700 font-black mt-1 uppercase">VAT: {hotelSettings.vatNo} | Ph: {hotelSettings.contactNo}</p>
                                </>
                            )}
                            <h2 className="text-2xl font-black text-blue-700 mt-2">HOTEL INVOICE</h2>
                            <p className="text-slate-500 font-bold">Booking ID: {formData.bookingId}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-400 italic">Printed on: {new Date().toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 text-sm">
                        <div className="space-y-4">
                            <h3 className="bg-blue-900 text-white px-3 py-1 font-bold uppercase tracking-widest rounded">Guest Info</h3>
                            <div className="grid grid-cols-3 gap-y-2 px-2">
                                <span className="text-slate-400 font-bold">Name</span><span className="col-span-2 font-black border-b border-slate-200">{formData.mainGuestName}</span>
                                <span className="text-slate-400 font-bold">Nationality</span><span className="col-span-2 font-black border-b border-slate-200">{formData.nationality}</span>
                                <span className="text-slate-400 font-bold">Contact</span><span className="col-span-2 font-black border-b border-slate-200">{formData.contactPhone}</span>
                                <span className="text-slate-400 font-bold">Email</span><span className="col-span-2 font-black border-b border-slate-200">{formData.contactEmail}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="bg-blue-900 text-white px-3 py-1 font-bold uppercase tracking-widest rounded">Reservation</h3>
                            <div className="grid grid-cols-3 gap-y-2 px-2">
                                <span className="text-slate-400 font-bold">Channel</span><span className="col-span-2 font-black border-b border-slate-200">{formData.channel}</span>
                                <span className="text-slate-400 font-bold">Arrival</span><span className="col-span-2 font-black border-b border-slate-200">{formData.checkInDate} / {formData.arrivalTime}</span>
                                <span className="text-slate-400 font-bold">Departure</span><span className="col-span-2 font-black border-b border-slate-200">{formData.checkOutDate}</span>
                                <span className="text-slate-400 font-bold">Room Assigned</span><span className="col-span-2 font-black text-blue-700 text-xl italic">{formData.assignedRoomNo}</span>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-4 mt-4">
                            <h3 className="bg-blue-900 text-white px-3 py-1 font-bold uppercase tracking-widest rounded">Financial Summary</h3>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b-2 border-slate-300">
                                        <th className="p-2 font-bold text-slate-500">DESCRIPTION</th>
                                        <th className="p-2 font-bold text-slate-500 text-center">QTY/VAL</th>
                                        <th className="p-2 font-bold text-slate-500 text-right">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-200">
                                        <td className="p-2 font-bold">Room Charges ({formData.roomType})</td>
                                        <td className="p-2 text-center font-bold">{formData.nights} Nights</td>
                                        <td className="p-2 text-right font-black">{formData.totalBookingAmount}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="p-2 font-bold">Tax ({formData.taxPercent || 0}%)</td>
                                        <td className="p-2 text-center">-</td>
                                        <td className="p-2 text-right font-black">{formData.taxAmount || 0}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="p-2 font-bold">City Tax</td>
                                        <td className="p-2 text-center">-</td>
                                        <td className="p-2 text-right font-black">{formData.cityTax || 0}</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td colSpan={2} className="p-3 text-right font-black text-xl">GRAND TOTAL</td>
                                        <td className="p-3 text-right font-black text-2xl text-blue-900 border-l border-slate-300">
                                            {(Number(formData.totalBookingAmount) + Number(formData.taxAmount || 0) + Number(formData.cityTax || 0)).toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="col-span-2 grid grid-cols-2 gap-8 mt-6">
                            <div className="p-4 bg-slate-100 rounded-xl border border-dashed border-slate-400 h-32 flex flex-col justify-end">
                                <p className="text-center font-bold text-slate-400 uppercase text-xs">Guest Signature</p>
                            </div>
                            <div className="p-4 bg-slate-100 rounded-xl border border-dashed border-slate-400 h-32 flex flex-col justify-end">
                                <p className="text-center font-bold text-slate-400 uppercase text-xs">Hotel Authorization</p>
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
            <PasswordModal
                show={passwordModal.show}
                title={passwordModal.title}
                onClose={() => setPasswordModal({ show: false })}
                onConfirm={passwordModal.onConfirm}
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
                    
                    /* Check In Register Styles */
                    .print-register-header { background-color: #22d3ee !important; color: black !important; }
                    table thead tr { background-color: #f1f5f9 !important; }
                    
                    /* Color headers for registers */
                    h1 { color: #1e3a8a !important; } /* blue-900 */
                    
                    /* Zebra striping for registers */
                    table tbody tr:nth-child(even) { background-color: #f8fafc !important; }
                    
                    /* Invoice Specifics */
                    .bg-blue-900 { background-color: #1e3a8a !important; color: white !important; }
                    .border-blue-600 { border-color: #2563eb !important; }
                }
            `}</style>
        </div>
    );
}
