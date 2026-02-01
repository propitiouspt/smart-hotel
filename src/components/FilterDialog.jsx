import React, { useState } from 'react';
import { X, Filter, Calendar, Zap } from 'lucide-react';

export default function FilterDialog({ show, onClose, onApply, initialFilters = {} }) {
    const [filters, setFilters] = useState({
        dateType: 'checkInDate', // 'checkInDate' or 'bookingDate'
        startDate: '',
        endDate: '',
        channel: 'All',
        status: 'All', // 'All', 'Staying', 'Checked-out'
        ...initialFilters
    });

    if (!show) return null;

    const channels = ['All', 'Direct', 'Booking.com', 'Airbnb', 'Expedia'];

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 font-sans no-print">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
                <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center bg-gradient-to-r from-slate-800 to-slate-700">
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-cyan-400" />
                        <h3 className="font-bold text-lg">Report Filter Options</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Date Type Toggle */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Filter Type</label>
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => setFilters({ ...filters, dateType: 'checkInDate' })}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${filters.dateType === 'checkInDate' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Check-in Date
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, dateType: 'bookingDate' })}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${filters.dateType === 'bookingDate' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Booking Date
                            </button>
                        </div>
                    </div>

                    {/* Date Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Calendar size={12} /> From Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Calendar size={12} /> To Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Channel Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Zap size={12} /> Specific Channel
                        </label>
                        <select
                            value={filters.channel}
                            onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em]"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                        >
                            {channels.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm shadow-md active:scale-95"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
