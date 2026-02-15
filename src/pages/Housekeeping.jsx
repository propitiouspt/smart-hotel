import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { MessageModal } from '../components/Modal';

export default function Housekeeping() {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [staff, setStaff] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [messageModal, setMessageModal] = useState({ show: false, message: '', title: 'System Message' });

    // Task Feedback State
    const [taskFeedback, setTaskFeedback] = useState({
        staffComment: '',
        cleanedFlag: false,
        cleanedTime: format(new Date(), 'HH:mm')
    });

    if (!currentUser) return null;
    const isStaff = currentUser.userType === 'Staff';

    // Load Data
    const loadData = async () => {
        if (!currentUser) return;
        const tData = await db.tasks.find(t => t.hotelId === currentUser.hotelId);
        setTasks(tData);

        if (!isStaff) {
            const rData = await db.rooms.find(r => r.hotelId === currentUser.hotelId);
            setRooms(rData);
            const uData = await db.users.find(u => u.hotelId === currentUser.hotelId && u.userType === 'Staff');
            setStaff(uData);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentUser]);

    // Admin: Assign Task Logic
    const initialForm = {
        roomNo: '',
        userId: '',
        assignMemo: ''
    };
    const [assignForm, setAssignForm] = useState(initialForm);

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            const room = rooms.find(r => r.roomNo === assignForm.roomNo);
            const user = staff.find(u => u.userId === assignForm.userId);

            if (!room || !user) return;

            const newTask = {
                taskId: `TSK-${Date.now()}`,
                assignDate: format(new Date(), 'yyyy-MM-dd'),
                assignTime: format(new Date(), 'HH:mm'),
                userId: user.userId,
                userName: user.userName,
                roomNo: room.roomNo,
                startStat: room.cleaningStatus,
                endStat: '', // Pending
                assignMemo: assignForm.assignMemo,
                hotelId: currentUser.hotelId
            };

            await db.tasks.save(newTask);
            await loadData();
            setAssignForm(initialForm);
        } catch (error) {
            setMessageModal({ show: true, message: 'Error assigning task. Please try again.', title: 'Error' });
        }
    };

    // Staff: Complete Task Logic
    const handleComplete = async (e) => {
        e.preventDefault();
        if (!taskFeedback.cleanedFlag) {
            setMessageModal({ show: true, message: 'Please confirm the room is cleaned by checking the flag.', title: 'System Message' });
            return;
        }

        try {
            // 1. Update Task
            await db.tasks.save({
                ...selectedTask,
                endStat: 'Ready',
                endTime: taskFeedback.cleanedTime,
                staffComment: taskFeedback.staffComment
            });

            // 2. Update Room Status
            const roomsData = await db.rooms.find(r => r.roomNo === selectedTask.roomNo && r.hotelId === currentUser.hotelId);
            const room = roomsData[0];
            if (room) {
                await db.rooms.save({
                    ...room,
                    cleaningStatus: 'Ready',
                    lastCleanedBy: currentUser.userName,
                    lastCleanedTime: taskFeedback.cleanedTime
                });
            }

            await loadData();
            setSelectedTask(null);
            setTaskFeedback({ staffComment: '', cleanedFlag: false, cleanedTime: format(new Date(), 'HH:mm') });
            setMessageModal({ show: true, message: 'Room status updated to Ready!', title: 'System Message' });
        } catch (error) {
            setMessageModal({ show: true, message: 'Error completing task. Please try again.', title: 'Error' });
        }
    };

    const handleSelectTask = (task) => {
        if (!isStaff && task.endStat === 'Ready') return; // Admin just views the list
        setSelectedTask(task);
        setTaskFeedback({
            staffComment: task.staffComment || '',
            cleanedFlag: task.endStat === 'Ready',
            cleanedTime: task.endTime || format(new Date(), 'HH:mm')
        });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Housekeeping</h2>

            {/* Admin Assignment Panel */}
            {!isStaff && (
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Assign Task
                    </h3>
                    <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                        <div className="lg:col-span-3">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Room</label>
                            <select
                                required
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                value={assignForm.roomNo}
                                onChange={e => setAssignForm({ ...assignForm, roomNo: e.target.value })}
                            >
                                <option value="">Select Room</option>
                                {rooms.map(r => {
                                    const isAssigned = tasks.some(t => t.roomNo === r.roomNo && t.endStat !== 'Ready');
                                    return (
                                        <option key={r.roomNo} value={r.roomNo}>
                                            {r.roomNo} | {r.cleaningStatus} | {isAssigned ? 'Assigned' : 'Not Assigned'}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="lg:col-span-3">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Staff</label>
                            <select
                                required
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                value={assignForm.userId}
                                onChange={e => setAssignForm({ ...assignForm, userId: e.target.value })}
                            >
                                <option value="">Select Staff</option>
                                {staff.map(s => (
                                    <option key={s.userId} value={s.userId}>{s.userName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:col-span-4">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Memo</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                placeholder="Instructions..."
                                value={assignForm.assignMemo}
                                onChange={e => setAssignForm({ ...assignForm, assignMemo: e.target.value })}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
                                Assign Task
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Task List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 sm:px-6 py-4 font-semibold text-slate-700">Room</th>
                                <th className="px-4 sm:px-6 py-4 font-semibold text-slate-700">Staff</th>
                                <th className="px-4 sm:px-6 py-4 font-semibold text-slate-700">Instructions</th>
                                <th className="px-4 sm:px-6 py-4 font-semibold text-slate-700">Status</th>
                                {isStaff && <th className="px-4 sm:px-6 py-4 font-semibold text-slate-700 text-right">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tasks.filter(t => isStaff ? t.userId === currentUser.userId : true).map(task => (
                                <tr
                                    key={task.taskId}
                                    className={clsx(
                                        "hover:bg-blue-50 cursor-pointer transition",
                                        selectedTask?.taskId === task.taskId ? "bg-blue-100" : ""
                                    )}
                                    onClick={() => handleSelectTask(task)}
                                >
                                    <td className="px-4 sm:px-6 py-4 font-bold text-slate-800">{task.roomNo}</td>
                                    <td className="px-4 sm:px-6 py-4 text-slate-600">{task.userName}</td>
                                    <td className="px-4 sm:px-6 py-4 text-slate-500 max-w-[150px] sm:max-w-xs truncate">{task.assignMemo || '-'}</td>
                                    <td className="px-4 sm:px-6 py-4">
                                        {task.endStat === 'Ready' ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 font-medium whitespace-nowrap">
                                                <Check className="w-4 h-4" /> Ready
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-orange-500 font-medium font-bold whitespace-nowrap">
                                                <Clock className="w-4 h-4" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    {isStaff && (
                                        <td className="px-4 sm:px-6 py-4 text-right">
                                            <button
                                                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                                            >
                                                {task.endStat === 'Ready' ? 'View' : 'Clean'}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {tasks.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-slate-400">No active tasks</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Staff Detailed View Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-blue-600 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">Room {selectedTask.roomNo} - Task Details</h3>
                            <button onClick={() => setSelectedTask(null)} className="text-white hover:text-blue-100 font-bold">✕</button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Admin Info Section */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructions from Admin</h4>
                                <p className="text-slate-800 italic">"{selectedTask.assignMemo || 'No specific instructions provided.'}"</p>
                                <div className="mt-3 flex gap-4 text-xs text-slate-500">
                                    <span>Assigned: {selectedTask.assignDate} {selectedTask.assignTime}</span>
                                    <span>Start Status: {selectedTask.startStat}</span>
                                </div>
                            </div>

                            {/* Staff Feedback Form */}
                            <form onSubmit={handleComplete} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Staff Comments</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition h-24 resize-none"
                                        placeholder="Enter your cleaning notes here..."
                                        value={taskFeedback.staffComment}
                                        onChange={e => setTaskFeedback({ ...taskFeedback, staffComment: e.target.value })}
                                        disabled={selectedTask.endStat === 'Ready'}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Cleaned At</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                value={taskFeedback.cleanedTime}
                                                onChange={e => setTaskFeedback({ ...taskFeedback, cleanedTime: e.target.value })}
                                                disabled={selectedTask.endStat === 'Ready'}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <label className="flex items-center gap-3 cursor-pointer p-2 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                                                checked={taskFeedback.cleanedFlag}
                                                onChange={e => setTaskFeedback({ ...taskFeedback, cleanedFlag: e.target.checked })}
                                                disabled={selectedTask.endStat === 'Ready'}
                                            />
                                            <span className="text-sm font-bold text-slate-700">Room is Cleaned</span>
                                        </label>
                                    </div>
                                </div>

                                {selectedTask.endStat !== 'Ready' ? (
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg active:transform active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-5 h-5" /> Mark as Ready
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-2">
                                        <div className="text-center p-3 bg-green-100 text-green-700 rounded-lg border border-green-200 font-bold">
                                            Task Completed at {selectedTask.endTime}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <MessageModal
                show={messageModal.show}
                title={messageModal.title}
                message={messageModal.message}
                onOk={() => setMessageModal({ ...messageModal, show: false })}
            />
        </div>
    );
}
