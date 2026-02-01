import React, { useState } from 'react';
import { db } from '../services/db';
import * as XLSX from 'xlsx';
import { Download, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Backup() {
    const { currentUser } = useAuth();
    const [isExporting, setIsExporting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleExport = async () => {
        setIsExporting(true);
        setStatus('loading');

        try {
            // Fetch all data from DB
            const users = db.users.getAll();
            const rooms = db.rooms.getAll();
            const bookings = db.bookings.getAll();
            const tasks = db.tasks.getAll();
            const settings = db.settings.get('H001'); // Assuming H001 for now

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Add sheets
            const sheets = [
                { data: rooms, name: 'Room Master' },
                { data: bookings, name: 'Bookings' },
                { data: tasks, name: 'Tasks' },
                { data: users.map(({ password, ...u }) => u), name: 'Users' },
                { data: [settings], name: 'Settings' }
            ];

            sheets.forEach(sheet => {
                if (sheet.data && (Array.isArray(sheet.data) ? sheet.data.length > 0 : true)) {
                    const ws = XLSX.utils.json_to_sheet(Array.isArray(sheet.data) ? sheet.data : [sheet.data]);
                    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
                } else {
                    // Even if empty, create a sheet with headers if possible or just an empty sheet
                    const ws = XLSX.utils.json_to_sheet([]);
                    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
                }
            });

            // Generate filename
            const date = new Date().toISOString().split('T')[0];
            const filename = `SmartHotel_Backup_${date}.xlsx`;

            // Export file
            XLSX.writeFile(wb, filename);

            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error('Export failed:', error);
            setStatus('error');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Database Backup</h2>
                        <p className="text-slate-500 text-sm">Export all hotel data to an Excel file with multiple sheets.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Data Included
                        </h3>
                        <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                            <li>Room Master Data</li>
                            <li>Reservation Records</li>
                            <li>Task & Housekeeping Logs</li>
                            <li>User Accounts (excluding passwords)</li>
                            <li>General Hotel Settings</li>
                        </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Export Info
                        </h3>
                        <p className="text-sm text-slate-600">
                            The backup will be saved as an <strong>.xlsx</strong> file.
                            Each data category will be placed in a separate sheet for easy organization.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-blue-900">Ready to Backup?</h4>
                        <p className="text-sm text-blue-700">Click the button to generate and download the latest backup.</p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : status === 'success' ? (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Exported!
                            </>
                        ) : status === 'error' ? (
                            <>
                                <AlertCircle className="w-5 h-5" />
                                Error occurred
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Export All Data
                            </>
                        )}
                    </button>
                </div>
            </div>

            {status === 'success' && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                        <p className="font-medium text-sm">Backup completed successfully!</p>
                        <p className="text-xs text-emerald-600">Your data has been exported to an Excel file.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
