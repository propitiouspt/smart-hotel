/**
 * Mock Database Service for Smart Hotel
 * Simulates a collection-based NoSQL database using LocalStorage.
 */

const STORAGE_KEYS = {
    USERS: 'sh_users',
    ROOMS: 'sh_rooms',
    BOOKINGS: 'sh_bookings',
    TASKS: 'sh_tasks',
    SETTINGS: 'sh_settings',
    INV_MAST: 'sh_inv_mast',
    INV_TRN: 'sh_inv_trn',
    LAUNDRY_MAST: 'sh_laundry_mast',
    LAUNDRY_TRN: 'sh_laundry_trn',
    PETTY_CASH: 'sh_petty_cash',
};

const SEED_DATA = {
    users: [
        {
            userId: 'admin',
            active: true,
            userName: 'Administrator',
            password: '123',
            userType: 'Admin',
            hotelId: 'H001',
        },
        {
            userId: 'manager',
            active: true,
            userName: 'Manager One',
            password: '123',
            userType: 'Manager',
            hotelId: 'H001',
        },
        {
            userId: 'staff',
            active: true,
            userName: 'Housekeeping Staff',
            password: '123',
            userType: 'Staff',
            hotelId: 'H001',
        }
    ],
    rooms: [
        { roomNo: '101', floor: '1', roomType: 'T0', basicRate: 100, statusOfRoom: 'Available', cleaningStatus: 'Ready', hotelId: 'H001', currentGuest: '' },
        { roomNo: '102', floor: '1', roomType: 'T1', basicRate: 150, statusOfRoom: 'Available', cleaningStatus: 'Ready', hotelId: 'H001', currentGuest: '' },
        { roomNo: '201', floor: '2', roomType: 'T2', basicRate: 200, statusOfRoom: 'Available', cleaningStatus: 'Ready', hotelId: 'H001', currentGuest: '' },
    ],
    bookings: [],
    tasks: [],
    settings: {
        hotelId: 'H001',
        entityName: 'Smart Hotel Management',
        address: '123 Luxury Lane, City View',
        contactNo: '+1-234-567-8900',
        email: 'info@smarthotel.com',
        vatNo: 'VAT123456789'
    },
    invMast: [],
    invTrn: [],
    laundryMast: [],
    laundryTrn: [],
    pettyCash: [],
};

// Initialize DB if empty
const initDB = () => {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_DATA.users));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(SEED_DATA.rooms));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(SEED_DATA.bookings));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_DATA.tasks));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(SEED_DATA.settings));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INV_MAST)) {
        localStorage.setItem(STORAGE_KEYS.INV_MAST, JSON.stringify(SEED_DATA.invMast));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INV_TRN)) {
        localStorage.setItem(STORAGE_KEYS.INV_TRN, JSON.stringify(SEED_DATA.invTrn));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAUNDRY_MAST)) {
        localStorage.setItem(STORAGE_KEYS.LAUNDRY_MAST, JSON.stringify(SEED_DATA.laundryMast));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAUNDRY_TRN)) {
        localStorage.setItem(STORAGE_KEYS.LAUNDRY_TRN, JSON.stringify(SEED_DATA.laundryTrn));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PETTY_CASH)) {
        localStorage.setItem(STORAGE_KEYS.PETTY_CASH, JSON.stringify(SEED_DATA.pettyCash));
    }
};

initDB();

const getCollection = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const setCollection = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
    users: {
        find: (predicate) => getCollection(STORAGE_KEYS.USERS).filter(predicate),
        findOne: (predicate) => getCollection(STORAGE_KEYS.USERS).find(predicate),
        getAll: () => getCollection(STORAGE_KEYS.USERS),
        save: (user) => {
            const users = getCollection(STORAGE_KEYS.USERS);
            const index = users.findIndex(u => u.userId === user.userId);
            if (index >= 0) {
                users[index] = { ...users[index], ...user };
            } else {
                users.push(user);
            }
            setCollection(STORAGE_KEYS.USERS, users);
            return user;
        },
        delete: (userId) => {
            const users = getCollection(STORAGE_KEYS.USERS);
            const filtered = users.filter(u => u.userId !== userId);
            setCollection(STORAGE_KEYS.USERS, filtered);
        }
    },
    rooms: {
        find: (predicate) => getCollection(STORAGE_KEYS.ROOMS).filter(predicate),
        getAll: () => getCollection(STORAGE_KEYS.ROOMS),
        save: (room) => {
            const rooms = getCollection(STORAGE_KEYS.ROOMS);
            const index = rooms.findIndex(r => r.roomNo === room.roomNo && r.hotelId === room.hotelId);
            if (index >= 0) {
                rooms[index] = { ...rooms[index], ...room };
            } else {
                rooms.push(room);
            }
            setCollection(STORAGE_KEYS.ROOMS, rooms);
            return room;
        },
        delete: (roomNo, hotelId) => {
            const rooms = getCollection(STORAGE_KEYS.ROOMS);
            const filtered = rooms.filter(r => !(r.roomNo === roomNo && r.hotelId === hotelId));
            setCollection(STORAGE_KEYS.ROOMS, filtered);
        }
    },
    bookings: {
        find: (predicate) => getCollection(STORAGE_KEYS.BOOKINGS).filter(predicate),
        getAll: () => getCollection(STORAGE_KEYS.BOOKINGS),
        save: (booking) => {
            const bookings = getCollection(STORAGE_KEYS.BOOKINGS);
            const index = bookings.findIndex(b => b.bookingId === booking.bookingId);
            if (index >= 0) {
                bookings[index] = { ...bookings[index], ...booking };
            } else {
                bookings.push(booking);
            }
            setCollection(STORAGE_KEYS.BOOKINGS, bookings);
            return booking;
        },
    },
    tasks: {
        find: (predicate) => getCollection(STORAGE_KEYS.TASKS).filter(predicate),
        getAll: () => getCollection(STORAGE_KEYS.TASKS),
        save: (task) => {
            const tasks = getCollection(STORAGE_KEYS.TASKS);
            const index = tasks.findIndex(t => t.taskId === task.taskId);
            if (index >= 0) {
                tasks[index] = { ...tasks[index], ...task };
            } else {
                tasks.push(task);
            }
            setCollection(STORAGE_KEYS.TASKS, tasks);
            return task;
        },
        delete: (taskId) => {
            const tasks = getCollection(STORAGE_KEYS.TASKS);
            const filtered = tasks.filter(t => t.taskId !== taskId);
            setCollection(STORAGE_KEYS.TASKS, filtered);
        }
    },
    settings: {
        get: (hotelId) => {
            const settings = getCollection(STORAGE_KEYS.SETTINGS);
            return Array.isArray(settings) ? settings.find(s => s.hotelId === hotelId) : settings;
        },
        save: (settings) => {
            // Since we only have one hotel for now, we just save/overwrite.
            // If multiple hotels, we'd find and update.
            setCollection(STORAGE_KEYS.SETTINGS, settings);
            return settings;
        }
    },
    inventory: {
        master: {
            getAll: () => getCollection(STORAGE_KEYS.INV_MAST),
            save: (item) => {
                const items = getCollection(STORAGE_KEYS.INV_MAST);
                const index = items.findIndex(i => i.itemCode === item.itemCode);
                if (index >= 0) {
                    items[index] = { ...items[index], ...item };
                } else {
                    items.push({ ...item, itemPur: 0, itemUsed: 0 });
                }
                setCollection(STORAGE_KEYS.INV_MAST, items);
                return item;
            },
            delete: (itemCode) => {
                const items = getCollection(STORAGE_KEYS.INV_MAST);
                const filtered = items.filter(i => i.itemCode !== itemCode);
                setCollection(STORAGE_KEYS.INV_MAST, filtered);
            }
        },
        transactions: {
            getAll: () => getCollection(STORAGE_KEYS.INV_TRN),
            save: (trn) => {
                const trns = getCollection(STORAGE_KEYS.INV_TRN);
                const isNew = !trn.id;
                const id = trn.id || Date.now().toString();

                // Enforce mutual exclusivity
                const refinedTrn = { ...trn, id };
                if (Number(refinedTrn.itemPurQty) > 0) refinedTrn.itemUseQty = 0;
                else if (Number(refinedTrn.itemUseQty) > 0) refinedTrn.itemPurQty = 0;

                let oldTrn = null;
                if (!isNew) {
                    const index = trns.findIndex(t => t.id === id);
                    oldTrn = trns[index];
                    trns[index] = refinedTrn;
                } else {
                    trns.push(refinedTrn);
                }
                setCollection(STORAGE_KEYS.INV_TRN, trns);

                // Update Master
                const masters = getCollection(STORAGE_KEYS.INV_MAST);
                const mIndex = masters.findIndex(m => m.itemCode === refinedTrn.itemCode);
                if (mIndex >= 0) {
                    const master = masters[mIndex];
                    if (oldTrn) {
                        master.itemPur = (Number(master.itemPur) || 0) - (Number(oldTrn.itemPurQty) || 0);
                        master.itemUsed = (Number(master.itemUsed) || 0) - (Number(oldTrn.itemUseQty) || 0);
                    }
                    master.itemPur = (Number(master.itemPur) || 0) + (Number(refinedTrn.itemPurQty) || 0);
                    master.itemUsed = (Number(master.itemUsed) || 0) + (Number(refinedTrn.itemUseQty) || 0);

                    masters[mIndex] = master;
                    setCollection(STORAGE_KEYS.INV_MAST, masters);
                }
                return refinedTrn;
            },
            delete: (id) => {
                const trns = getCollection(STORAGE_KEYS.INV_TRN);
                const trn = trns.find(t => t.id === id);
                if (trn) {
                    const masters = getCollection(STORAGE_KEYS.INV_MAST);
                    const mIndex = masters.findIndex(m => m.itemCode === trn.itemCode);
                    if (mIndex >= 0) {
                        masters[mIndex].itemPur = (Number(masters[mIndex].itemPur) || 0) - (Number(trn.itemPurQty) || 0);
                        masters[mIndex].itemUsed = (Number(masters[mIndex].itemUsed) || 0) - (Number(trn.itemUseQty) || 0);
                        setCollection(STORAGE_KEYS.INV_MAST, masters);
                    }
                    const filtered = trns.filter(t => t.id !== id);
                    setCollection(STORAGE_KEYS.INV_TRN, filtered);
                }
            }
        }
    },
    laundry: {
        master: {
            getAll: () => getCollection(STORAGE_KEYS.LAUNDRY_MAST),
            save: (item) => {
                const items = getCollection(STORAGE_KEYS.LAUNDRY_MAST);
                const index = items.findIndex(i => i.itemCode === item.itemCode);
                if (index >= 0) {
                    items[index] = { ...items[index], ...item };
                } else {
                    items.push({ ...item, itemQin: 0, pendingInhouse: 0, pendingOutside: 0 });
                }
                setCollection(STORAGE_KEYS.LAUNDRY_MAST, items);
                return item;
            },
            delete: (itemCode) => {
                const items = getCollection(STORAGE_KEYS.LAUNDRY_MAST);
                const filtered = items.filter(i => i.itemCode !== itemCode);
                setCollection(STORAGE_KEYS.LAUNDRY_MAST, filtered);
            }
        },
        transactions: {
            getAll: () => getCollection(STORAGE_KEYS.LAUNDRY_TRN),
            save: (trn) => {
                const trns = getCollection(STORAGE_KEYS.LAUNDRY_TRN);
                const isNew = !trn.id;
                const id = trn.id || Date.now().toString();
                const newTrn = { ...trn, id };

                let oldTrn = null;
                if (!isNew) {
                    const index = trns.findIndex(t => t.id === id);
                    oldTrn = trns[index];
                    trns[index] = newTrn;
                } else {
                    trns.push(newTrn);
                }
                setCollection(STORAGE_KEYS.LAUNDRY_TRN, trns);

                // Update Master
                const masters = getCollection(STORAGE_KEYS.LAUNDRY_MAST);
                const mIndex = masters.findIndex(m => m.itemCode === trn.itemCode);
                if (mIndex >= 0) {
                    if (oldTrn) {
                        // Revert old values
                        masters[mIndex].itemQin = (Number(masters[mIndex].itemQin) || 0) - (Number(oldTrn.itemQin) || 0);
                        if (oldTrn.cleaner === 'Inhouse') {
                            masters[mIndex].pendingInhouse = (Number(masters[mIndex].pendingInhouse) || 0) - (Number(oldTrn.itemQout) || 0) + (Number(oldTrn.itemQin) || 0);
                        } else {
                            masters[mIndex].pendingOutside = (Number(masters[mIndex].pendingOutside) || 0) - (Number(oldTrn.itemQout) || 0) + (Number(oldTrn.itemQin) || 0);
                        }
                    }
                    // Apply new values
                    masters[mIndex].itemQin = (Number(masters[mIndex].itemQin) || 0) + (Number(trn.itemQin) || 0);
                    if (trn.cleaner === 'Inhouse') {
                        masters[mIndex].pendingInhouse = (Number(masters[mIndex].pendingInhouse) || 0) + (Number(trn.itemQout) || 0) - (Number(trn.itemQin) || 0);
                    } else {
                        masters[mIndex].pendingOutside = (Number(masters[mIndex].pendingOutside) || 0) + (Number(trn.itemQout) || 0) - (Number(trn.itemQin) || 0);
                    }
                    setCollection(STORAGE_KEYS.LAUNDRY_MAST, masters);
                }
                return newTrn;
            },
            delete: (id) => {
                const trns = getCollection(STORAGE_KEYS.LAUNDRY_TRN);
                const trn = trns.find(t => t.id === id);
                if (trn) {
                    const masters = getCollection(STORAGE_KEYS.LAUNDRY_MAST);
                    const mIndex = masters.findIndex(m => m.itemCode === trn.itemCode);
                    if (mIndex >= 0) {
                        masters[mIndex].itemQin = (Number(masters[mIndex].itemQin) || 0) - (Number(trn.itemQin) || 0);
                        if (trn.cleaner === 'Inhouse') {
                            masters[mIndex].pendingInhouse = (Number(masters[mIndex].pendingInhouse) || 0) - (Number(trn.itemQout) || 0) + (Number(trn.itemQin) || 0);
                        } else {
                            masters[mIndex].pendingOutside = (Number(masters[mIndex].pendingOutside) || 0) - (Number(trn.itemQout) || 0) + (Number(trn.itemQin) || 0);
                        }
                        setCollection(STORAGE_KEYS.LAUNDRY_MAST, masters);
                    }
                    const filtered = trns.filter(t => t.id !== id);
                    setCollection(STORAGE_KEYS.LAUNDRY_TRN, filtered);
                }
            }
        }
    },
    pettyCash: {
        getAll: () => getCollection(STORAGE_KEYS.PETTY_CASH),
        save: (trn) => {
            const trns = getCollection(STORAGE_KEYS.PETTY_CASH);
            if (!trn.vchNo) {
                // Generate VchNo: PC-0001
                const lastTrn = trns[trns.length - 1];
                let nextNum = 1;
                if (lastTrn && lastTrn.vchNo) {
                    const lastNum = parseInt(lastTrn.vchNo.split('-')[1]);
                    nextNum = lastNum + 1;
                }
                trn.vchNo = `PC-${nextNum.toString().padStart(4, '0')}`;
                trn.id = Date.now().toString();
                trns.push(trn);
            } else {
                const index = trns.findIndex(t => t.vchNo === trn.vchNo);
                if (index >= 0) {
                    trns[index] = { ...trns[index], ...trn };
                }
            }
            setCollection(STORAGE_KEYS.PETTY_CASH, trns);
            return trn;
        },
        delete: (vchNo) => {
            const trns = getCollection(STORAGE_KEYS.PETTY_CASH);
            const filtered = trns.filter(t => t.vchNo !== vchNo);
            setCollection(STORAGE_KEYS.PETTY_CASH, filtered);
        }
    }
};
