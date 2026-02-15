-- SQL Script to set up Table Schema in Supabase
-- Copy and paste this into the Supabase SQL Editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    "userId" TEXT PRIMARY KEY,
    active BOOLEAN DEFAULT true,
    "userName" TEXT,
    password TEXT,
    "userType" TEXT,
    "hotelId" TEXT
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    "roomNo" TEXT,
    floor TEXT,
    "roomType" TEXT,
    "basicRate" NUMERIC,
    "statusOfRoom" TEXT,
    "cleaningStatus" TEXT,
    "hotelId" TEXT,
    "currentGuest" TEXT,
    PRIMARY KEY ("roomNo", "hotelId")
);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "bookingId" TEXT UNIQUE,
    channel TEXT,
    "bookingDate" DATE,
    nationality TEXT,
    "mainGuestName" TEXT,
    "checkInDate" DATE,
    "checkOutDate" DATE,
    "totalGuests" INTEGER,
    children INTEGER,
    "childrenAges" TEXT,
    "roomType" TEXT,
    nights INTEGER,
    "totalBookingAmount" NUMERIC,
    "commissionPercent" NUMERIC,
    "commissionAmount" NUMERIC,
    "taxPercent" NUMERIC,
    "taxAmount" NUMERIC,
    "cityTax" NUMERIC,
    "securityDeposit" NUMERIC,
    "paymentMode" TEXT,
    "collectedBy" TEXT,
    "directPaymentMode" TEXT,
    "payoutReceived" NUMERIC,
    "receivedBy" TEXT,
    "arrivalTime" TIME,
    remarks TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "assignedRoomNo" TEXT,
    "hotelId" TEXT,
    "checkedIn" BOOLEAN DEFAULT false
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    "taskId" TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    "assignedTo" TEXT,
    "dueDate" DATE,
    "roomNo" TEXT,
    "hotelId" TEXT
);

-- 5. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    "hotelId" TEXT PRIMARY KEY,
    "entityName" TEXT,
    address TEXT,
    "contactNo" TEXT,
    email TEXT,
    "vatNo" TEXT
);

-- 6. Inventory Master
CREATE TABLE IF NOT EXISTS inv_mast (
    "itemCode" TEXT PRIMARY KEY,
    "itemName" TEXT,
    unit TEXT,
    "itemPur" NUMERIC DEFAULT 0,
    "itemUsed" NUMERIC DEFAULT 0,
    "hotelId" TEXT
);

-- 7. Inventory Transactions
CREATE TABLE IF NOT EXISTS inv_trn (
    id TEXT PRIMARY KEY,
    date DATE,
    "itemCode" TEXT,
    "itemPurQty" NUMERIC DEFAULT 0,
    "itemUseQty" NUMERIC DEFAULT 0,
    remarks TEXT,
    "hotelId" TEXT
);

-- 8. Laundry Master
CREATE TABLE IF NOT EXISTS laundry_mast (
    "itemCode" TEXT PRIMARY KEY,
    "itemName" TEXT,
    "itemQin" NUMERIC DEFAULT 0,
    "pendingInhouse" NUMERIC DEFAULT 0,
    "pendingOutside" NUMERIC DEFAULT 0,
    "hotelId" TEXT
);

-- 9. Laundry Transactions
CREATE TABLE IF NOT EXISTS laundry_trn (
    id TEXT PRIMARY KEY,
    date DATE,
    "itemCode" TEXT,
    "itemQout" NUMERIC DEFAULT 0,
    "itemQin" NUMERIC DEFAULT 0,
    cleaner TEXT,
    remarks TEXT,
    "hotelId" TEXT
);

-- 10. Petty Cash
CREATE TABLE IF NOT EXISTS petty_cash (
    id TEXT PRIMARY KEY,
    "vchNo" TEXT UNIQUE,
    date DATE,
    description TEXT,
    category TEXT,
    amount NUMERIC,
    "type" TEXT, -- Payment or Receipt
    "hotelId" TEXT
);

-- Enable Row Level Security (RLS) - Optional but recommended. 
-- For now, we will disable it to make it work immediately like the local storage used to.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_mast DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_trn DISABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_mast DISABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_trn DISABLE ROW LEVEL SECURITY;
ALTER TABLE petty_cash DISABLE ROW LEVEL SECURITY;

-- Insert Seed Data for Users
INSERT INTO users ("userId", active, "userName", password, "userType", "hotelId")
VALUES 
('admin', true, 'Administrator', '123', 'Admin', 'H001'),
('manager', true, 'Manager One', '123', 'Manager', 'H001'),
('staff', true, 'Housekeeping Staff', '123', 'Staff', 'H001')
ON CONFLICT ("userId") DO NOTHING;

-- Insert Seed Data for Rooms
INSERT INTO rooms ("roomNo", floor, "roomType", "basicRate", "statusOfRoom", "cleaningStatus", "hotelId", "currentGuest")
VALUES 
('101', '1', 'T0', 100, 'Available', 'Ready', 'H001', ''),
('102', '1', 'T1', 150, 'Available', 'Ready', 'H001', ''),
('201', '2', 'T2', 200, 'Available', 'Ready', 'H001', '')
ON CONFLICT ("roomNo", "hotelId") DO NOTHING;

-- Insert Seed Data for Settings
INSERT INTO settings ("hotelId", "entityName", address, "contactNo", email, "vatNo")
VALUES 
('H001', 'Smart Hotel Management', '123 Luxury Lane, City View', '+1-234-567-8900', 'info@smarthotel.com', 'VAT123456789')
ON CONFLICT ("hotelId") DO NOTHING;
