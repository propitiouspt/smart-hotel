import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from '../services/db';
import { MessageModal } from './Modal';
import { useAuth } from '../context/AuthContext';

export default function LaundryTransactionDialog({ show, onClose, onSave, editData = null }) {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState({
        itemCode: '',
        itemName: '',
        itemDate: new Date().toISOString().split('T')[0],
        itemQin: 0,
        itemQout: 0,
        itemStatus: '',
        cleaner: 'Inhouse',
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (show) {
            const masterItems = db.laundry.master.getAll();
            setItems(masterItems);

            if (editData) {
                setFormData(editData);
            } else {
                setFormData({
                    itemCode: '',
                    itemName: '',
                    itemDate: new Date().toISOString().split('T')[0],
                    itemQin: 0,
                    itemQout: 0,
                    itemStatus: '',
                    cleaner: 'Inhouse',
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

        if (Number(formData.itemQin) === 0 && Number(formData.itemQout) === 0) {
            setMessage('At least one of Clean Items (IN) or Dirty Items (OUT) must be greater than 0.');
            return;
        }

        const transaction = {
            ...formData,
            itemQin: Number(formData.itemQin) || 0,
            itemQout: Number(formData.itemQout) || 0,
            itemUser: currentUser?.userId || 'system'
        };

        db.laundry.transactions.save(transaction);
        onSave();
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{editData ? 'Edit' : 'Add'} Laundry Transaction</h3>
                    <button onClick={onClose} className="hover:text-indigo-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Laundry Code *</label>
                        <select
                            required
                            value={formData.itemCode}
                            onChange={(e) => handleItemChange(e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
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
                        <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
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
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1 text-green-600 font-bold">Clean Received (IN)</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.itemQin}
                                onChange={(e) => setFormData({ ...formData, itemQin: e.target.value })}
                                className="w-full px-3 py-2 border rounded border-green-200 focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1 text-red-600 font-bold">Dirty Sent (OUT)</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.itemQout}
                                onChange={(e) => setFormData({ ...formData, itemQout: e.target.value })}
                                className="w-full px-3 py-2 border rounded border-red-200 focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Field Cleaner</label>
                        <select
                            value={formData.cleaner}
                            onChange={(e) => setFormData({ ...formData, cleaner: e.target.value })}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="Inhouse">Inhouse</option>
                            <option value="Outsourced">Outsourced</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Status / Comments</label>
                        <textarea
                            value={formData.itemStatus}
                            onChange={(e) => setFormData({ ...formData, itemStatus: e.target.value })}
                            rows="2"
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
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
                            className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700 transition"
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
