import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../hooks/useDevice';
import { Trash2, Save, Plus, X } from 'lucide-react';
import clsx from 'clsx';
import { MessageModal, ConfirmModal } from '../components/Modal';

export default function RoomMaster() {
    const { currentUser } = useAuth();
    const { isMobile, isTablet } = useDevice();
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [viewMode, setViewMode] = useState('VIEW'); // 'VIEW', 'NEW', 'EDIT'

    // Modal State
    const [messageModal, setMessageModal] = useState({ show: false, message: '', title: 'System Message' });
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

    // Form State
    const initialForm = {
        roomNo: '',
        floor: '',
        roomType: 'T0',
        basicRate: '',
        statusOfRoom: 'Available',
        cleaningStatus: 'Ready',
        currentGuest: '',
        currentRate: 0
    };
    const [formData, setFormData] = useState(initialForm);

    // Load Data
    const loadRooms = () => {
        const data = db.rooms.find(r => r.hotelId === currentUser.hotelId);
        setRooms(data);
    };

    useEffect(() => {
        loadRooms();
    }, [currentUser]);

    // Handlers
    const handleSelect = (room) => {
        if (viewMode !== 'VIEW') return;
        setSelectedRoom(room);
        setFormData(room);
    };

    const handleEdit = () => {
        if (!selectedRoom) return;
        setViewMode('EDIT');
    };

    const handleNew = () => {
        setSelectedRoom(null);
        setFormData(initialForm);
        setViewMode('NEW');
    };

    const handleDiscard = () => {
        setViewMode('VIEW');
        if (selectedRoom) {
            setFormData(selectedRoom);
        } else {
            setFormData(initialForm);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        db.rooms.save({ ...formData, hotelId: currentUser.hotelId });
        loadRooms();
        setViewMode('VIEW');
        setMessageModal({ show: true, message: 'Room details saved successfully!', title: 'System Message' });
    };

    const handleDelete = () => {
        setConfirmModal({
            show: true,
            message: 'Are you sure you want to delete this room?',
            onConfirm: () => {
                db.rooms.delete(formData.roomNo, currentUser.hotelId);
                loadRooms();
                setSelectedRoom(null);
                setFormData(initialForm);
                setViewMode('VIEW');
                setMessageModal({ show: true, message: 'Room deleted successfully.', title: 'System Message' });
            }
        });
    };

    const isFormDisabled = viewMode === 'VIEW';
    const isTableLocked = viewMode !== 'VIEW';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-slate-800`}>Room Master</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleNew}
                        disabled={viewMode !== 'VIEW'}
                        className={`${isMobile ? 'flex-1 px-3 py-1.5 text-sm' : 'w-auto px-4 py-2'} flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-bold disabled:opacity-50`}
                    >
                        <Plus className="w-4 h-4" />
                        Add New Room
                    </button>
                    {selectedRoom && viewMode === 'VIEW' && (
                        <button
                            onClick={handleEdit}
                            className={`${isMobile ? 'flex-1 px-3 py-1.5 text-sm' : 'w-auto px-4 py-2'} flex items-center justify-center gap-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition shadow-sm font-bold`}
                        >
                            Edit Room
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className={clsx(
                    "lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-opacity",
                    isTableLocked && "opacity-50 pointer-events-none"
                )}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[500px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 font-semibold text-slate-700">Room</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold text-slate-700">Type</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold text-slate-700">Floor</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold text-slate-700">Status</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold text-slate-700">Condition</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rooms.map((room) => (
                                    <tr
                                        key={room.roomNo}
                                        onClick={() => handleSelect(room)}
                                        className={clsx(
                                            "cursor-pointer hover:bg-slate-50 transition",
                                            selectedRoom?.roomNo === room.roomNo ? "bg-blue-50" : ""
                                        )}
                                    >
                                        <td className="px-4 sm:px-6 py-4 font-medium">{room.roomNo}</td>
                                        <td className="px-4 sm:px-6 py-4">{room.roomType}</td>
                                        <td className="px-4 sm:px-6 py-4">{room.floor}</td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className={clsx(
                                                "px-2 py-1 rounded-full text-xs font-semibold",
                                                room.statusOfRoom === 'Occupied' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                            )}>
                                                {room.statusOfRoom}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className={clsx(
                                                "px-2 py-1 rounded-full text-xs font-semibold",
                                                room.cleaningStatus === 'Dirty' ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-700"
                                            )}>
                                                {room.cleaningStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form */}
                <div className={`lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 ${isMobile ? 'p-4' : 'p-6'} h-fit lg:sticky lg:top-6`}>
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-slate-800 mb-4`}>
                        {viewMode === 'NEW' ? 'New Room' : viewMode === 'EDIT' ? `Edit Room ${formData.roomNo}` : selectedRoom ? `Room ${selectedRoom.roomNo} Details` : 'Select a room'}
                    </h3>
                    <form onSubmit={handleSave} className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Room No</label>
                                <input
                                    name="roomNo"
                                    value={formData.roomNo}
                                    onChange={handleChange}
                                    disabled={isFormDisabled || viewMode === 'EDIT'} // Lock ID on edit
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Floor</label>
                                <input
                                    name="floor"
                                    value={formData.floor}
                                    onChange={handleChange}
                                    disabled={isFormDisabled}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Room Type</label>
                            <select
                                name="roomType"
                                value={formData.roomType}
                                onChange={handleChange}
                                disabled={isFormDisabled}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
                            >
                                <option value="T0">T0 (Single)</option>
                                <option value="T1">T1 (Double)</option>
                                <option value="T1F">T1F (Family)</option>
                                <option value="T2">T2 (Suite)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Basic Rate</label>
                            <input
                                type="number"
                                name="basicRate"
                                value={formData.basicRate}
                                onChange={handleChange}
                                disabled={isFormDisabled}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                <select
                                    name="statusOfRoom"
                                    value={formData.statusOfRoom}
                                    onChange={handleChange}
                                    disabled={isFormDisabled}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
                                >
                                    <option>Available</option>
                                    <option>Occupied</option>
                                    <option>Blocked</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Condition</label>
                                <select
                                    name="cleaningStatus"
                                    value={formData.cleaningStatus}
                                    onChange={handleChange}
                                    disabled={isFormDisabled}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
                                >
                                    <option>Ready</option>
                                    <option>Dirty</option>
                                    <option>Semi cleaned</option>
                                </select>
                            </div>
                        </div>

                        {/* Read-only Info */}
                        <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Current Guest</span>
                                <span className="font-medium truncate max-w-[120px]">{formData.currentGuest || '-'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Current Rate</span>
                                <span className="font-medium">{formData.currentRate || 0}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            {!isFormDisabled ? (
                                <>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex justify-center items-center gap-2 font-bold"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDiscard}
                                        className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 transition flex justify-center items-center gap-2 font-medium"
                                    >
                                        <X className="w-4 h-4" />
                                        Discard
                                    </button>
                                </>
                            ) : currentUser.userType === 'Admin' && selectedRoom && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="w-full bg-red-100 text-red-600 py-2 rounded-lg hover:bg-red-200 transition flex justify-center items-center gap-2 font-bold"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Room
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Modals */}
            <MessageModal
                show={messageModal.show}
                title={messageModal.title}
                message={messageModal.message}
                onOk={() => setMessageModal({ ...messageModal, show: false })}
            />

            <ConfirmModal
                show={confirmModal.show}
                title="System Message"
                message={confirmModal.message}
                onConfirm={() => {
                    confirmModal.onConfirm?.();
                    setConfirmModal({ ...confirmModal, show: false });
                }}
                onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
            />
        </div>
    );
}
