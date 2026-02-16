import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../hooks/useDevice';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Settings,
    Printer,
    ArrowUpDown,
    Filter,
    WashingMachine
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import LaundryTransactionDialog from '../components/LaundryTransactionDialog';
import LaundryMasterDialog from '../components/LaundryMasterDialog';
import { ConfirmModal } from '../components/Modal';

export default function Laundry() {
    const { currentUser } = useAuth();
    const { isMobile } = useDevice();
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showTrnDialog, setShowTrnDialog] = useState(false);
    const [showMasterDialog, setShowMasterDialog] = useState(false);
    const [editTrn, setEditTrn] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [hotelSettings, setHotelSettings] = useState(null);
    const [masterItems, setMasterItems] = useState([]);

    useEffect(() => {
        const init = async () => {
            if (!currentUser) return;
            const settings = await db.settings.get(currentUser.hotelId || 'H001');
            setHotelSettings(settings);
            const mData = await db.laundry.master.getAll();
            setMasterItems(mData);
            await loadTransactions();
        };
        init();

        const trnSub = db.subscribe('laundry_trn', () => loadTransactions());
        const mastSub = db.subscribe('laundry_mast', () => loadTransactions());

        return () => {
            trnSub.unsubscribe();
            mastSub.unsubscribe();
        };
    }, [currentUser]);

    const loadTransactions = async () => {
        if (!currentUser) return;
        const data = await db.laundry.transactions.getAll();
        setTransactions(data);
        const mData = await db.laundry.master.getAll();
        setMasterItems(mData);
    };

    const handleDelete = async (id) => {
        try {
            await db.laundry.transactions.delete(id);
            await loadTransactions();
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Error deleting laundry record:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredTransactions = transactions.filter(t =>
        (t.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.itemStatus || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
                <div className="flex items-center gap-3 text-indigo-800">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <WashingMachine size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Laundry Management</h2>
                        <p className="text-sm text-slate-500">Track dirty sent out and clean items received</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <button
                        onClick={() => setShowTrnDialog(true)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-bold shadow-md"
                    >
                        <Plus size={18} /> Add Transaction
                    </button>
                    <button
                        onClick={() => setShowMasterDialog(true)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition font-bold shadow-md"
                    >
                        <Settings size={18} /> Master List
                    </button>
                    <button
                        onClick={handlePrint}
                        className="lg:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg border hover:bg-slate-50 transition font-bold shadow-sm"
                    >
                        <Printer size={18} /> Print
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center border-b-2 border-indigo-800 pb-4 mb-6">
                <h1 className="text-3xl font-black uppercase text-indigo-900">Laundry Transaction Report</h1>
                <p className="text-slate-500 font-bold">{hotelSettings?.entityName || 'Smart Hotel Management System'}</p>
                <div className="mt-2 text-sm">
                    Report Date: {format(new Date(), 'dd-MMM-yyyy')} | Generated By: {currentUser?.userName}
                </div>
            </div>

            {/* Status Overview */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
                <div className="flex items-center gap-2 mb-4 text-slate-800">
                    <WashingMachine size={18} className="text-indigo-600" />
                    <h3 className="font-bold">Linen Status Overview (Clean / Inhouse / Outside)</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {masterItems.map(item => (
                        <div key={item.itemCode} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.itemCode}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-black text-indigo-700" title="Cleaned Qty">{item.itemQin || 0}</span>
                                <span className="text-xs text-slate-300">/</span>
                                <span className="text-lg font-black text-orange-600" title="Pending Dirty (Inhouse)">{item.pendingInhouse || 0}</span>
                                <span className="text-xs text-slate-300">/</span>
                                <span className="text-lg font-black text-red-600" title="Pending Dirty (Outside)">{item.pendingOutside || 0}</span>
                            </div>
                        </div>
                    ))}
                    {masterItems.length === 0 && (
                        <p className="text-sm text-slate-400 italic">No master items defined.</p>
                    )}
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 no-print">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by code, item or status..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 text-sm">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition">
                        <ArrowUpDown size={16} /> Sort
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                        <thead className="bg-indigo-50 text-indigo-900 border-b border-indigo-100">
                            <tr>
                                <th className="px-6 py-4 font-bold border-r border-indigo-100/50">Date</th>
                                <th className="px-6 py-4 font-bold border-r border-indigo-100/50">Code</th>
                                <th className="px-6 py-4 font-bold border-r border-indigo-100/50">Description</th>
                                <th className="px-6 py-4 font-bold text-right text-red-700 bg-red-50/30 border-r border-indigo-100/50">Dirty (OUT)</th>
                                <th className="px-6 py-4 font-bold text-right text-green-700 bg-green-50/30 border-r border-indigo-100/50">Clean (IN)</th>
                                <th className="px-6 py-4 font-bold border-r border-indigo-100/50">Staff ID</th>
                                <th className="px-6 py-4 font-bold">Comments</th>
                                <th className="px-6 py-4 text-center no-print">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.map(trn => (
                                <tr key={trn.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-mono border-r border-slate-100">{trn.itemDate}</td>
                                    <td className="px-6 py-4 font-mono text-indigo-600 border-r border-slate-100">{trn.itemCode}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800 border-r border-slate-100">{trn.itemName}</td>
                                    <td className="px-6 py-4 text-right bg-red-50/10 border-r border-slate-100">
                                        {trn.itemQout > 0 ? (
                                            <span className="text-red-600 font-black">{trn.itemQout}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right bg-green-50/10 border-r border-slate-100">
                                        {trn.itemQin > 0 ? (
                                            <span className="text-green-600 font-black">{trn.itemQin}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 border-r border-slate-100">{trn.itemUser}</td>
                                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{trn.itemStatus || '-'}</td>
                                    <td className="px-6 py-4 no-print">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditTrn(trn); setShowTrnDialog(true); }}
                                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(trn.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">
                                        No laundry records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    <div>{hotelSettings?.entityName || 'Smart Hotel'} • Laundry System</div>
                    <div className="flex gap-4">
                        <span>Dirty: {filteredTransactions.reduce((sum, t) => sum + (Number(t.itemQout) || 0), 0)}</span>
                        <span>Clean: {filteredTransactions.reduce((sum, t) => sum + (Number(t.itemQin) || 0), 0)}</span>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <LaundryTransactionDialog
                show={showTrnDialog}
                onClose={() => { setShowTrnDialog(false); setEditTrn(null); }}
                onSave={loadTransactions}
                editData={editTrn}
            />

            <LaundryMasterDialog
                show={showMasterDialog}
                onClose={() => { setShowMasterDialog(false); loadTransactions(); }}
            />

            <ConfirmModal
                show={!!confirmDeleteId}
                message="Are you sure you want to delete this laundry record? This will also revert the cleaned/dirty totals in Master List."
                onConfirm={() => handleDelete(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
            />

            {/* Print Styling */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    table { border: 1px solid #e2e8f0 !important; width: 100% !important; }
                    th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; }
                    .bg-red-50\/30 { background-color: #fef2f2 !important; }
                    .bg-green-50\/30 { background-color: #f0fdf4 !important; }
                    .text-red-600 { color: #dc2626 !important; }
                    .text-green-600 { color: #16a34a !important; }
                }
            `}</style>
        </div>
    );
}
