import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Save, Plus, Trash2, Settings, Building, X } from 'lucide-react';
import { MessageModal, ConfirmModal, PasswordModal } from '../components/Modal';

export default function Users() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    const initialForm = {
        userId: '',
        userName: '',
        password: '', // Simple text for this mock
        userType: 'Staff',
        active: true
    };
    const [formData, setFormData] = useState(initialForm);
    const [isEdit, setIsEdit] = useState(false);

    // Modal State
    const [messageModal, setMessageModal] = useState({ show: false, message: '', title: 'System Message' });
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [hotelSettings, setHotelSettings] = useState({
        entityName: '',
        address: '',
        contactNo: '',
        email: '',
        vatNo: ''
    });

    const loadData = () => {
        const uData = db.users.getAll();
        setUsers(uData);
        setHotelSettings(db.settings.get(currentUser.hotelId));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSelect = (user) => {
        setSelectedUser(user);
        setFormData(user);
        setIsEdit(true);
    };

    const handleNew = () => {
        setSelectedUser(null);
        setFormData(initialForm);
        setIsEdit(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!formData.userId) {
            setMessageModal({ show: true, message: 'User ID is required', title: 'System Message' });
            return;
        }

        db.users.save({ ...formData, hotelId: currentUser.hotelId });
        loadData();
        setMessageModal({ show: true, message: 'User Saved Successfully!', title: 'System Message' });
        handleNew(); // Reset
    };

    const handleDelete = (userId) => {
        setConfirmModal({
            show: true,
            message: 'Are you sure you want to delete this user?',
            onConfirm: () => {
                db.users.delete(userId);
                loadData();
                if (selectedUser?.userId === userId) handleNew();
                setMessageModal({ show: true, message: 'User Deleted Successfully!', title: 'System Message' });
            }
        });
    };

    const handleOpenSettings = () => {
        if (currentUser.userType !== 'Admin') {
            setMessageModal({ show: true, message: 'Only Admin can access Settings.', title: 'Access Denied' });
            return;
        }
        setShowPasswordModal(true);
    };

    const handlePasswordConfirm = (password) => {
        // Fetch real user from DB to get the password (context removes it for security)
        const realUser = db.users.findOne(u => u.userId === currentUser.userId);
        if (realUser && password === realUser.password) {
            setShowPasswordModal(false);
            setShowSettingsModal(true);
        } else {
            setMessageModal({ show: true, message: 'Incorrect Password!', title: 'Security Error' });
        }
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        db.settings.save({ ...hotelSettings, hotelId: currentUser.hotelId });
        setShowSettingsModal(false);
        setMessageModal({ show: true, message: 'Hotel Settings Updated Successfully!', title: 'System Message' });
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">User Master</h2>
                {currentUser.userType === 'Admin' && (
                    <button
                        onClick={handleOpenSettings}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition shadow-md font-bold"
                    >
                        <Settings size={18} className="text-cyan-400" /> Entity Settings
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Column */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[500px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-slate-700">User ID</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Type</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Active</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(user => (
                                    <tr
                                        key={user.userId}
                                        onClick={() => handleSelect(user)}
                                        className={`cursor-pointer hover:bg-slate-50 transition ${selectedUser?.userId === user.userId ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-900">{user.userId}</td>
                                        <td className="px-4 py-3">{user.userName}</td>
                                        <td className="px-4 py-3 text-slate-500">{user.userType}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {user.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(user.userId); }}
                                                className="text-red-500 hover:text-red-700 p-1 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:sticky lg:top-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800">{isEdit ? 'Edit User' : 'New User'}</h3>
                            <button
                                onClick={handleNew}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> New
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
                                <input
                                    name="userId"
                                    value={formData.userId}
                                    onChange={handleChange}
                                    readOnly={isEdit} // Prevent ID change on edit
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${isEdit ? 'bg-slate-100 text-slate-500' : 'bg-white border-slate-300'}`}
                                    placeholder="e.g. jdoe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    name="userName"
                                    value={formData.userName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    name="password"
                                    type="text" // Visible for admin simplicity as requested
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">User Type</label>
                                <select
                                    name="userType"
                                    value={formData.userType}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                                >
                                    <option value="Staff">Staff</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <label htmlFor="active" className="text-sm font-medium text-slate-700">Active User</label>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium flex justify-center items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isEdit ? 'Update User' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

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
                show={showPasswordModal}
                title="Admin Verification"
                onClose={() => setShowPasswordModal(false)}
                onConfirm={handlePasswordConfirm}
            />

            {/* Entity Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center bg-gradient-to-r from-slate-800 to-slate-700">
                            <div className="flex items-center gap-2">
                                <Building size={20} className="text-cyan-400" />
                                <h3 className="font-bold text-lg">Entity Settings</h3>
                            </div>
                            <button onClick={() => setShowSettingsModal(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Entity / Hotel Name</label>
                                <input
                                    className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={hotelSettings.entityName}
                                    onChange={(e) => setHotelSettings({ ...hotelSettings, entityName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Address</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows="3"
                                    value={hotelSettings.address}
                                    onChange={(e) => setHotelSettings({ ...hotelSettings, address: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Contact No</label>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={hotelSettings.contactNo}
                                        onChange={(e) => setHotelSettings({ ...hotelSettings, contactNo: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">VAT / Reg No</label>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={hotelSettings.vatNo}
                                        onChange={(e) => setHotelSettings({ ...hotelSettings, vatNo: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Email ID</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={hotelSettings.email}
                                    onChange={(e) => setHotelSettings({ ...hotelSettings, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowSettingsModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded font-bold hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition shadow-md"
                                >
                                    Save Entity Details
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
