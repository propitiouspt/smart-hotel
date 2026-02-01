import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';

// Placeholder components for routes we haven't built yet
const Placeholder = ({ title }) => (
    <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">This page is under construction.</p>
    </div>
);

// Lazy load real pages as we build them
// In a real app we might use React.lazy, but for this step-by-step build regular imports are fine.
import RoomMaster from './pages/RoomMaster';
import Bookings from './pages/Bookings';
import CheckInOut from './pages/CheckInOut';
import Housekeeping from './pages/Housekeeping';
import Reports from './pages/Reports';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Backup from './pages/Backup';

function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser } = useAuth();

    if (!currentUser) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(currentUser.userType)) {
        // Redirect to a page they can see, e.g., Housekeeping for staff
        return currentUser.userType === 'Staff'
            ? <Navigate to="/housekeeping" replace />
            : <Navigate to="/" replace />;
    }

    return children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<DashboardLayout />}>
                <Route path="/" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                        <Dashboard />
                    </ProtectedRoute>
                } />

                <Route path="/rooms" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                        <RoomMaster />
                    </ProtectedRoute>
                } />

                <Route path="/bookings" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                        <Bookings />
                    </ProtectedRoute>
                } />

                <Route path="/check-in-out" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                        <CheckInOut />
                    </ProtectedRoute>
                } />

                <Route path="/housekeeping" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
                        <Housekeeping />
                    </ProtectedRoute>
                } />

                <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                        <Reports />
                    </ProtectedRoute>
                } />

                <Route path="/users" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <Users />
                    </ProtectedRoute>
                } />

                <Route path="/backup" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                        <Backup />
                    </ProtectedRoute>
                } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
