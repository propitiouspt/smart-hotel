import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Search } from 'lucide-react';
import { db } from '../services/db';
import { MessageModal, ConfirmModal } from './Modal';
import clsx from 'clsx';

export default function LaundryMasterDialog({ show, onClose }) {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({
        itemCode: '',
        itemName: '',
    });

    const [message, setMessage] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        if (show) {
            loadItems();
        }
    }, [show]);

    const loadItems = async () => {
        const data = await db.laundry.master.getAll();
        setItems(data);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.itemCode || !formData.itemName) {
            setMessage('Please fill all mandatory fields.');
            return;
        }

        try {
            const existingItems = await db.laundry.master.getAll();
            const duplicate = existingItems.find(i => i.itemCode === formData.itemCode && i.itemCode !== editItem?.itemCode);

            if (duplicate) {
                setMessage('Laundry code already exists. Please choose another.');
                return;
            }

            await db.laundry.master.save(formData);

            setMessage('Laundry item saved successfully.');
            resetForm();
            await loadItems();
        } catch (error) {
            setMessage('Error saving laundry item. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({ itemCode: '', itemName: '' });
        setIsEditing(false);
        setEditItem(null);
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setEditItem(item);
        setFormData({
            itemCode: item.itemCode,
            itemName: item.itemName
        });
    };

    const handleDelete = async (itemCode) => {
        try {
            await db.laundry.master.delete(itemCode);
            await loadItems();
            setConfirmDelete(null);
        } catch (error) {
            setMessage('Error deleting laundry item. Please try again.');
        }
    };

    if (!show) return null;

    const filteredItems = items.filter(item =>
        (item.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Laundry Master</h3>
                    <button onClick={onClose} className="hover:text-slate-300 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-6">
                    {/* Add/Edit Form */}
                    <div className="w-full md:w-1/3 space-y-4">
                        <h4 className="font-bold text-slate-700 border-b pb-2">
                            {isEditing ? 'Edit Laundry Item' : 'New Laundry Item'}
                        </h4>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Laundry Code *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.itemCode}
                                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Description *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.itemName}
                                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition"
                                >
                                    {isEditing ? 'Update' : 'Save'}
                                </button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 border rounded font-bold hover:bg-slate-100 transition"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Items List */}
                    <div className="w-full md:w-2/3 flex flex-col h-full bg-slate-50 rounded border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b bg-white flex items-center gap-2">
                            <Search size={18} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search laundry items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent focus:outline-none"
                            />
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 border-b">Code</th>
                                        <th className="px-4 py-2 border-b">Description</th>
                                        <th className="px-4 py-2 border-b text-right">Total Dirty</th>
                                        <th className="px-4 py-2 border-b text-right">Total Clean</th>
                                        <th className="px-4 py-2 border-b text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {filteredItems.map(item => (
                                        <tr key={item.itemCode} className="hover:bg-slate-50 border-b last:border-0 transition-colors">
                                            <td className="px-4 py-2 font-mono">{item.itemCode}</td>
                                            <td className="px-4 py-2 font-medium">{item.itemName}</td>
                                            <td className="px-4 py-2 text-right font-bold text-red-600">
                                                {Number(item.itemQout) || 0}
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold text-green-600">
                                                {Number(item.itemQin) || 0}
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => setConfirmDelete(item.itemCode)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-slate-400 italic">No laundry items found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100 px-6 py-2 border-t text-[10px] text-slate-500 flex justify-between">
                    <span>Double click on item to edit</span>
                    <span>Total Types: {items.length}</span>
                </div>
            </div>

            <MessageModal
                show={!!message}
                message={message}
                onOk={() => setMessage('')}
            />

            <ConfirmModal
                show={!!confirmDelete}
                message={`Are you sure you want to delete laundry item ${confirmDelete}?`}
                onConfirm={() => handleDelete(confirmDelete)}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
}
