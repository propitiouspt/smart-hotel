import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from '../services/db';
import { MessageModal } from './Modal';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export default function PettyCashTransactionDialog({ show, onClose, onSave, editData = null }) {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        vchNo: '',
        date: new Date().toISOString().split('T')[0],
        name: '',
        amount: 0,
        mode: 'Cash',
        type: 'Payment',
        remark: ''
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (show) {
            if (editData) {
                setFormData(editData);
            } else {
                setFormData({
                    vchNo: '',
                    date: new Date().toISOString().split('T')[0],
                    name: '',
                    amount: 0,
                    mode: 'Cash',
                    type: 'Payment',
                    remark: ''
                });
            }
        }
    }, [show, editData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.amount || Number(formData.amount) <= 0) {
            setMessage('Please provide a valid name and amount.');
            return;
        }

        try {
            const transaction = {
                ...formData,
                amount: Number(formData.amount),
                user: currentUser?.userId || 'system'
            };

            await db.pettyCash.save(transaction);
            await onSave();
            onClose();
        } catch (error) {
            setMessage('Error saving voucher. Please try again.');
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-emerald-600 text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{editData ? 'Edit' : 'Add'} Petty Cash Voucher</h3>
                    <button onClick={onClose} className="hover:text-emerald-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Voucher No</label>
                            <input
                                type="text"
                                readOnly
                                value={formData.vchNo || 'AUTO-GEN'}
                                className="w-full px-3 py-2 border rounded bg-slate-100 text-slate-500 font-mono text-sm cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date *</label>
                            <input
                                type="date"
                                required
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payee / Recipient Name *</label>
                        <input
                            type="text"
                            required
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter name"
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={clsx(
                                    "w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 text-sm font-bold",
                                    formData.type === 'Receipt' ? "text-emerald-600" : "text-rose-600"
                                )}
                            >
                                <option value="Payment">Payment (-)</option>
                                <option value="Receipt">Receipt (+)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount *</label>
                            <input
                                type="number"
                                required
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                min="0.01"
                                step="0.01"
                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 text-sm font-black"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Transaction Mode</label>
                        <select
                            name="mode"
                            value={formData.mode}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 text-sm"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank Transfer</option>
                            <option value="Card">Card</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remark / Purpose</label>
                        <textarea
                            name="remark"
                            value={formData.remark}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Detailed explanation..."
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 border border-slate-300 rounded font-bold hover:bg-slate-50 transition text-sm text-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-emerald-600 text-white py-2 rounded font-bold hover:bg-emerald-700 transition shadow-md shadow-emerald-200 text-sm"
                        >
                            {editData ? 'Update Voucher' : 'Save Voucher'}
                        </button>
                    </div>
                </form>
            </div>

            <MessageModal
                show={!!message}
                message={message}
                onOk={() => setMessage('')}
            />
        </div>
    );
}
