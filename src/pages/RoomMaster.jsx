import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Trash2, Save, Plus } from 'lucide-react';
import clsx from 'clsx';

export default function RoomMaster() {
    const { currentUser } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);

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
        setSelectedRoom(room);
        setFormData(room);
    };

    const handleNew = () => {
        setSelectedRoom(null);
        setFormData(initialForm);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        db.rooms.save({ ...formData, hotelId: currentUser.hotelId });
        loadRooms();
        handleNew();
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this room?')) {
            db.rooms.delete(formData.roomNo, currentUser.hotelId);
            loadRooms();
            handleNew();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Room Master</h2>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Add New Room
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Room</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Floor</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Condition</th>
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
                                        <td className="px-6 py-4 font-medium">{room.roomNo}</td>
                                        <td className="px-6 py-4">{room.roomType}</td>
                                        <td className="px-6 py-4">{room.floor}</td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2 py-1 rounded-full text-xs font-semibold",
                                                room.statusOfRoom === 'Occupied' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                            )}>
                                                {room.statusOfRoom}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                        {selectedRoom ? `Edit Room ${selectedRoom.roomNo}` : 'New Room'}
                    </h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Room No</label>
                                <input
                                    name="roomNo"
                                    value={formData.roomNo}
                                    onChange={handleChange}
                                    disabled={!!selectedRoom} // Lock ID on edit
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Floor</label>
                                <input
                                    name="floor"
                                    value={formData.floor}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Room Type</label>
                            <select
                                name="roomType"
                                value={formData.roomType}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex justify-center items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>

                            {currentUser.userType === 'Admin' && selectedRoom && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
