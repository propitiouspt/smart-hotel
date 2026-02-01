import React, { useState } from 'react';
import { X } from 'lucide-react';

export function MessageModal({ show, title = 'System Message', message, onOk }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] print:hidden">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-600 px-4 py-2 flex justify-between items-center">
                    <h3 className="text-white font-bold">{title}</h3>
                </div>
                <div className="p-6">
                    <p className="text-slate-700 text-lg mb-6">{message}</p>
                    <div className="flex justify-end">
                        <button
                            onClick={onOk}
                            className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition shadow-md active:transform active:scale-95"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ConfirmModal({ show, title = 'Confirm Action', message, onConfirm, onCancel }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] print:hidden">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-red-600 px-4 py-2 flex justify-between items-center">
                    <h3 className="text-white font-bold">{title}</h3>
                </div>
                <div className="p-6">
                    <p className="text-slate-700 text-lg mb-6">{message}</p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="bg-red-600 text-white px-6 py-2 rounded font-bold hover:bg-red-700 transition shadow-md active:transform active:scale-95"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
export function PasswordModal({ show, onClose, onConfirm, title = "Security Verification" }) {
    const [password, setPassword] = useState('');

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button onClick={onClose} className="hover:text-slate-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-slate-600">Please enter your password to confirm this sensitive action.</p>
                    <input
                        type="password"
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onConfirm(password);
                                setPassword('');
                            }
                        }}
                    />
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded border border-slate-300 hover:bg-slate-200 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onConfirm(password);
                                setPassword('');
                            }}
                            className="flex-1 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 transition-colors font-medium"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
