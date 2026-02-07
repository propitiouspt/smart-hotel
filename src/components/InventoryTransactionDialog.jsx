import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from '../services/db';
import { MessageModal } from './Modal';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export default function InventoryTransactionDialog({ show, onClose, onSave, editData = null }) {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState({
        itemCode: '',
        itemName: '',
        itemDate: new Date().toISOString().split('T')[0],
        itemPurQty: 0,
        itemUseQty: 0,
        remark: '',
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (show) {
            const masterItems = db.inventory.master.getAll();
            setItems(masterItems);

            if (editData) {
                setFormData(editData);
            } else {
                setFormData({
                    itemCode: '',
                    itemName: '',
                    itemDate: new Date().toISOString().split('T')[0],
                    itemPurQty: 0,
                    itemUseQty: 0,
                    remark: '',
                });
            }
        }
    }, [show, editData]);

    const handleItemChange = (itemCode) => {
        const item = items.find(i => i.itemCode === itemCode);
        setFormData({
            ...formData,
            itemCode,
            itemName: item ? item.itemName : ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.itemCode || !formData.itemDate) {
            setMessage('Please fill all mandatory fields.');
            return;
        }

        if (Number(formData.itemPurQty) === 0 && Number(formData.itemUseQty) === 0) {
            setMessage('At least one of Purchased Qty or Used Qty must be greater than 0.');
            return;
        }

        const transaction = {
            ...formData,
            itemPurQty: Number(formData.itemPurQty) || 0,
            itemUseQty: Number(formData.itemUseQty) || 0,
            user: currentUser?.userId || 'system'
        };

        db.inventory.transactions.save(transaction);
        onSave();
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{editData ? 'Edit' : 'Add'} Inventory Transaction</h3>
                    <button onClick={onClose} className="hover:text-blue-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Item Code *</label>
                        <select
                            required
                            value={formData.itemCode}
                            onChange={(e) => handleItemChange(e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Item</option>
                            {items.map(item => (
                                <option key={item.itemCode} value={item.itemCode}>
                                    {item.itemCode} - {item.itemName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Item Name</label>
                        <input
                            type="text"
                            readOnly
                            value={formData.itemName}
                            className="w-full px-3 py-2 border rounded bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Date *</label>
                        <input
                            type="date"
                            required
                            value={formData.itemDate}
                            onChange={(e) => setFormData({ ...formData, itemDate: e.target.value })}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Purchased Qty</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.itemPurQty}
                                disabled={Number(formData.itemUseQty) > 0}
                                onChange={(e) => setFormData({ ...formData, itemPurQty: e.target.value, itemUseQty: 0 })}
                                className={clsx(
                                    "w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500",
                                    Number(formData.itemUseQty) > 0 && "bg-slate-100 cursor-not-allowed"
                                )}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Used Qty</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.itemUseQty}
                                disabled={Number(formData.itemPurQty) > 0}
                                onChange={(e) => setFormData({ ...formData, itemUseQty: e.target.value, itemPurQty: 0 })}
                                className={clsx(
                                    "w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500",
                                    Number(formData.itemPurQty) > 0 && "bg-slate-100 cursor-not-allowed"
                                )}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Remark</label>
                        <textarea
                            value={formData.remark}
                            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                            rows="2"
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 border border-slate-300 rounded font-bold hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition"
                        >
                            {editData ? 'Update' : 'Save'}
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
