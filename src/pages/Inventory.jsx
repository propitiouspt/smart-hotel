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
    FileText,
    Printer,
    ArrowUpDown,
    Filter
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import InventoryTransactionDialog from '../components/InventoryTransactionDialog';
import InventoryMasterDialog from '../components/InventoryMasterDialog';
import { ConfirmModal } from '../components/Modal';

export default function Inventory() {
    const { currentUser } = useAuth();
    const { isMobile } = useDevice();
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showTrnDialog, setShowTrnDialog] = useState(false);
    const [showMasterDialog, setShowMasterDialog] = useState(false);
    const [editTrn, setEditTrn] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [hotelSettings, setHotelSettings] = useState(null);

    useEffect(() => {
        const init = async () => {
            if (!currentUser) return;
            const settings = await db.settings.get(currentUser.hotelId || 'H001');
            setHotelSettings(settings);
            await loadTransactions();
        };
        init();

        const trnSub = db.subscribe('inv_trn', () => loadTransactions());
        const mastSub = db.subscribe('inv_mast', () => loadTransactions());

        return () => {
            trnSub.unsubscribe();
            mastSub.unsubscribe();
        };
    }, [currentUser]);

    const loadTransactions = async () => {
        if (!currentUser) return;
        const data = await db.inventory.transactions.getAll();
        setTransactions(data);
    };

    const handleDelete = async (id) => {
        try {
            await db.inventory.transactions.delete(id);
            await loadTransactions();
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredTransactions = transactions.filter(t =>
        (t.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.remark || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
                    <p className="text-sm text-slate-500">Manage daily movements and master stock</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <button
                        onClick={() => setShowTrnDialog(true)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-bold shadow-md"
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

            {/* Print Header (Visible only on print) */}
            <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-3xl font-black uppercase">Inventory Transaction Report</h1>
                <p className="text-slate-500">{hotelSettings?.entityName || 'Smart Hotel Management System'}</p>
                <div className="mt-2 text-sm">
                    Date: {format(new Date(), 'dd-MMM-yyyy')} | Staff: {currentUser?.userName}
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 no-print">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by code, item or remark..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold">Date</th>
                                <th className="px-6 py-4 font-bold">Item Code</th>
                                <th className="px-6 py-4 font-bold">Item Name</th>
                                <th className="px-6 py-4 font-bold text-right">Purchased</th>
                                <th className="px-6 py-4 font-bold text-right">Used</th>
                                <th className="px-6 py-4 font-bold">User</th>
                                <th className="px-6 py-4 font-bold">Remark</th>
                                <th className="px-6 py-4 text-center no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.map(trn => (
                                <tr key={trn.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-mono">{trn.itemDate}</td>
                                    <td className="px-6 py-4 font-mono text-blue-600">{trn.itemCode}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{trn.itemName}</td>
                                    <td className="px-6 py-4 text-right">
                                        {trn.itemPurQty > 0 ? (
                                            <span className="text-green-600 font-bold">+{trn.itemPurQty}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {trn.itemUseQty > 0 ? (
                                            <span className="text-red-600 font-bold">-{trn.itemUseQty}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{trn.user}</td>
                                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{trn.remark || '-'}</td>
                                    <td className="px-6 py-4 no-print">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditTrn(trn); setShowTrnDialog(true); }}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
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
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                    <div>Showing {filteredTransactions.length} transactions</div>
                    <div className="font-mono">{hotelSettings?.entityName || 'Smart Hotel'} • Inventory Module</div>
                </div>
            </div>

            {/* Dialogs */}
            <InventoryTransactionDialog
                show={showTrnDialog}
                onClose={() => { setShowTrnDialog(false); setEditTrn(null); }}
                onSave={loadTransactions}
                editData={editTrn}
            />

            <InventoryMasterDialog
                show={showMasterDialog}
                onClose={() => { setShowMasterDialog(false); loadTransactions(); }}
            />

            <ConfirmModal
                show={!!confirmDeleteId}
                message="Are you sure you want to delete this transaction? This will also revert the stock levels in Master List."
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
                    .max-w-7xl { max-width: 100% !important; margin: 0 !important; }
                }
            `}</style>
        </div>
    );
}
