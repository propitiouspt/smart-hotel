import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../hooks/useDevice';
import {
    Plus,
    Search,
    Printer,
    ArrowUpDown,
    Filter,
    Banknote,
    FileText,
    Eye,
    Trash2,
    Edit
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import PettyCashTransactionDialog from '../components/PettyCashTransactionDialog';
import { ConfirmModal } from '../components/Modal';

export default function PettyCash() {
    const { currentUser } = useAuth();
    const { isMobile } = useDevice();
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showTrnDialog, setShowTrnDialog] = useState(false);
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
    }, [currentUser]);

    const loadTransactions = async () => {
        if (!currentUser) return;
        const data = await db.pettyCash.getAll();
        setTransactions(data);
    };

    const handleDelete = async (vchNo) => {
        try {
            await db.pettyCash.delete(vchNo);
            await loadTransactions();
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Error deleting petty cash voucher:', error);
        }
    };

    const handlePrintRegister = () => {
        window.print();
    };

    const handlePrintSlip = (trn) => {
        const printWindow = window.open('', '_blank');
        const isReceipt = trn.type === 'Receipt';

        printWindow.document.write(`
            <html>
                <head>
                    <title>${isReceipt ? 'Receipt' : 'Payment'} Slip - ${trn.vchNo}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        .slip-container { border: 2px solid #000; padding: 20px; max-width: 600px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 2px solid #000; pb: 10px; mb: 20px; }
                        .header h1 { margin: 0; text-transform: uppercase; font-size: 24px; }
                        .details { margin-bottom: 30px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 15px; }
                        .label { font-weight: bold; }
                        .amount-box { border: 2px solid #000; padding: 10px; font-size: 20px; font-weight: bold; width: fit-content; margin-top: 20px; }
                        .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
                        .sig-line { border-top: 1px solid #000; width: 200px; text-align: center; pt: 5px; }
                    </style>
                </head>
                <body>
                    <div class="slip-container">
                        <div class="header">
                            <h1>${hotelSettings?.entityName || 'Smart Hotel'}</h1>
                            <p>${hotelSettings?.address || ''}</p>
                            <h2>PETTY CASH ${isReceipt ? 'RECEIPT' : 'PAYMENT'}</h2>
                        </div>
                        <div class="details">
                            <div class="row">
                                <span><span class="label">Voucher No:</span> ${trn.vchNo}</span>
                                <span><span class="label">Date:</span> ${trn.date}</span>
                            </div>
                            <div class="row">
                                <span><span class="label">${isReceipt ? 'Received From' : 'Paid To'}:</span> ${trn.name}</span>
                            </div>
                            <div class="row">
                                <span><span class="label">Mode:</span> ${trn.mode}</span>
                            </div>
                            <div class="row">
                                <span><span class="label">Description:</span> ${trn.remark}</span>
                            </div>
                        </div>
                        <div class="amount-box">
                            AMOUNT: RS. ${Number(trn.amount).toLocaleString()}
                        </div>
                        <div class="signatures">
                            <div class="sig-line">Receiver's Signature</div>
                            <div class="sig-line">Authorized By</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const filteredTransactions = transactions.filter(t =>
        (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.vchNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.remark || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate Running Balance for Statement Style
    let runningBalance = 0;
    const sortedForBalance = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const indexedBalance = {};
    sortedForBalance.forEach(t => {
        if (t.type === 'Receipt') runningBalance += Number(t.amount);
        else runningBalance -= Number(t.amount);
        indexedBalance[t.vchNo] = runningBalance;
    });

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Petty Cash Management</h2>
                        <p className="text-sm text-slate-500">Track receipts, payments and cash handling</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <button
                        onClick={() => setShowTrnDialog(true)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-bold shadow-md"
                    >
                        <Plus size={18} /> Add Transaction
                    </button>
                    <button
                        onClick={handlePrintRegister}
                        className="lg:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg border hover:bg-slate-50 transition font-bold shadow-sm"
                    >
                        <Printer size={18} /> Cash Register
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-3xl font-black uppercase">{hotelSettings?.entityName || 'Smart Hotel'}</h1>
                <h2 className="text-xl font-bold">PETTY CASH REGISTER</h2>
                <p className="text-slate-500">Statement of Cash Transactions</p>
                <div className="mt-2 text-sm">
                    As of: {format(new Date(), 'dd-MMM-yyyy')} | Generated By: {currentUser?.userName}
                </div>
            </div>

            {/* Stats Overview (no-print) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Receipts</p>
                    <p className="text-2xl font-black text-emerald-600">
                        RS. {transactions.filter(t => t.type === 'Receipt').reduce((sum, t) => sum + Number(t.amount), 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Payments</p>
                    <p className="text-2xl font-black text-rose-600">
                        RS. {transactions.filter(t => t.type === 'Payment').reduce((sum, t) => sum + Number(t.amount), 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm bg-emerald-50/30">
                    <p className="text-xs font-bold text-slate-400 uppercase">Cash In Hand</p>
                    <p className="text-2xl font-black text-slate-900">
                        RS. {runningBalance.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 no-print">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Voucher, Payee or Remark..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition text-sm font-medium">
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            {/* Main Table / Register */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold border-r border-slate-100">Vch No</th>
                                <th className="px-6 py-4 font-bold border-r border-slate-100">Date</th>
                                <th className="px-6 py-4 font-bold border-r border-slate-100">Payee / Recipient</th>
                                <th className="px-6 py-4 font-bold text-right text-emerald-700 bg-emerald-50/30 border-r border-slate-100">Receipt</th>
                                <th className="px-6 py-4 font-bold text-right text-rose-700 bg-rose-50/30 border-r border-slate-100">Payment</th>
                                <th className="px-6 py-4 font-bold text-right bg-slate-100/50 border-r border-slate-100">Balance</th>
                                <th className="px-6 py-4 font-bold border-r border-slate-100">Mode</th>
                                <th className="px-6 py-4 font-bold no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.map(trn => (
                                <tr key={trn.vchNo} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-slate-900 border-r border-slate-100">{trn.vchNo}</td>
                                    <td className="px-6 py-4 font-mono border-r border-slate-100">{trn.date}</td>
                                    <td className="px-6 py-4 border-r border-slate-100">
                                        <div className="font-medium text-slate-800">{trn.name}</div>
                                        <div className="text-[10px] text-slate-400 uppercase truncate max-w-[150px]">{trn.remark}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right bg-emerald-50/10 border-r border-slate-100">
                                        {trn.type === 'Receipt' ? (
                                            <span className="text-emerald-600 font-black">{Number(trn.amount).toLocaleString()}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right bg-rose-50/10 border-r border-slate-100">
                                        {trn.type === 'Payment' ? (
                                            <span className="text-rose-600 font-black">{Number(trn.amount).toLocaleString()}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right bg-slate-50/30 font-bold text-slate-700 border-r border-slate-100">
                                        {indexedBalance[trn.vchNo]?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-100">
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                                            trn.mode === 'Cash' && "bg-emerald-100 text-emerald-700",
                                            trn.mode === 'Bank' && "bg-blue-100 text-blue-700",
                                            trn.mode === 'Card' && "bg-purple-100 text-purple-700"
                                        )}>
                                            {trn.mode}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 no-print">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handlePrintSlip(trn)}
                                                title="Print Slip"
                                                className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                onClick={() => { setEditTrn(trn); setShowTrnDialog(true); }}
                                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(trn.vchNo)}
                                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
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
                                        No petty cash records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    <div>{hotelSettings?.entityName || 'Smart Hotel'} • Petty Cash Register</div>
                    <div className="flex gap-4">
                        <span>Records: {filteredTransactions.length}</span>
                        <span>Closing: {runningBalance.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <PettyCashTransactionDialog
                show={showTrnDialog}
                onClose={() => { setShowTrnDialog(false); setEditTrn(null); }}
                onSave={loadTransactions}
                editData={editTrn}
            />

            <ConfirmModal
                show={!!confirmDeleteId}
                message="Are you sure you want to delete this petty cash voucher? This action cannot be undone."
                onConfirm={() => handleDelete(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
            />

            {/* Print Styling */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    table { border: 1px solid #000 !important; width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #000 !important; padding: 6px !important; color: #000 !important; }
                    .bg-emerald-50\\/30, .bg-rose-50\\/30, .bg-slate-100\\/50 { background-color: transparent !important; }
                    .text-emerald-600, .text-rose-600 { color: #000 !important; }
                }
            `}</style>
        </div>
    );
}
