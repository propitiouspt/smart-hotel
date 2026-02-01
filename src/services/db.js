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
    }
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
    }
};
