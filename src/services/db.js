import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Check your .env file.');
}

// Safely create Supabase client
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
            upsert: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
            delete: () => Promise.resolve({ error: { message: 'Supabase not initialized' } }),
        })
    };

// --- HELPERS ---

const sanitizeNumeric = (val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

const sanitizeTime = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    return val; // "HH:MM" or "YYYY-MM-DD"
};

// --- MAPPERS ---

// TASK MAPPERS
const mapTaskToDB = (task) => ({
    taskId: task.taskId,
    title: task.userName,
    description: JSON.stringify({
        memo: task.assignMemo,
        startStat: task.startStat,
        assignTime: task.assignTime,
        assignDate: task.assignDate,
        staffComment: task.staffComment,
        endTime: task.endTime
    }),
    status: task.endStat || 'Pending',
    priority: 'Normal',
    assignedTo: task.userId,
    dueDate: sanitizeTime(task.assignDate),
    roomNo: task.roomNo,
    hotelId: task.hotelId
});

const mapTaskFromDB = (dbTask) => {
    let extras = {};
    try { extras = JSON.parse(dbTask.description || '{}'); } catch (e) { extras = { memo: dbTask.description }; }
    return {
        taskId: dbTask.taskId,
        userName: dbTask.title,
        assignMemo: extras.memo || '',
        startStat: extras.startStat || '',
        assignTime: extras.assignTime || '',
        assignDate: extras.assignDate || dbTask.dueDate,
        staffComment: extras.staffComment || '',
        endTime: extras.endTime || '',
        endStat: dbTask.status,
        userId: dbTask.assignedTo,
        roomNo: dbTask.roomNo,
        hotelId: dbTask.hotelId
    };
};

// BOOKING MAPPERS (Crucial for CheckIn/Out Persistence)
const mapBookingToDB = (b) => {
    // These fields exist in DB directly
    const dbFields = {
        id: b.id,
        bookingId: b.bookingId,
        channel: b.channel,
        bookingDate: sanitizeTime(b.bookingDate),
        nationality: b.nationality,
        mainGuestName: b.mainGuestName,
        checkInDate: sanitizeTime(b.checkInDate),
        checkOutDate: sanitizeTime(b.checkOutDate),
        totalGuests: sanitizeNumeric(b.totalGuests),
        children: sanitizeNumeric(b.children),
        childrenAges: b.childrenAges,
        roomType: b.roomType,
        nights: sanitizeNumeric(b.nights),
        totalBookingAmount: sanitizeNumeric(b.totalBookingAmount),
        commissionPercent: sanitizeNumeric(b.commissionPercent),
        commissionAmount: sanitizeNumeric(b.commissionAmount),
        taxPercent: sanitizeNumeric(b.taxPercent),
        taxAmount: sanitizeNumeric(b.taxAmount),
        cityTax: sanitizeNumeric(b.cityTax),
        securityDeposit: sanitizeNumeric(b.securityDeposit),
        paymentMode: b.paymentMode,
        collectedBy: b.collectedBy,
        directPaymentMode: b.directPaymentMode,
        payoutReceived: sanitizeNumeric(b.payoutReceived),
        receivedBy: b.receivedBy,
        arrivalTime: sanitizeTime(b.arrivalTime),
        contactPhone: b.contactPhone,
        contactEmail: b.contactEmail,
        assignedRoomNo: b.assignedRoomNo,
        hotelId: b.hotelId || 'H001',
        checkedIn: b.checkedIn
    };

    // Packing extra UI fields into 'remarks' JSON
    // standard 'remarks' + extras from CheckInOut.jsx
    const extras = {
        userRemarks: b.remarks, // Preserve original remarks
        checkInTime: b.checkInTime,
        checkOutTime: b.checkOutTime,
        actualArrivalTime: b.actualArrivalTime,
        actualCheckoutDate: b.actualCheckoutDate,
        checkedInBy: b.checkedInBy,
        checkoutNote: b.checkoutNote,
        idProofMemo: b.idProofMemo,
        idProofImages: b.idProofImages
    };

    return {
        ...dbFields,
        // If id is empty string, remove it to let DB generate UUID
        ...(dbFields.id ? {} : { id: undefined }),
        remarks: JSON.stringify(extras)
    };
};

const mapBookingFromDB = (b) => {
    let extras = {};
    let originalRemarks = b.remarks;

    // Try to unpack remarks
    try {
        if (b.remarks && (b.remarks.startsWith('{') || b.remarks.startsWith('['))) {
            const parsed = JSON.parse(b.remarks);
            if (typeof parsed === 'object') {
                extras = parsed;
                originalRemarks = extras.userRemarks || '';
            }
        }
    } catch (e) {
        // Fallback: remarks was just a string
    }

    return {
        ...b,
        ...extras, // Spread extras back to top level (checkInTime, etc.)
        remarks: originalRemarks // Restore user visible remarks
    };
};


// INVENTORY MAPPERS
const mapInvTrnToDB = (trn) => ({
    id: trn.id,
    date: sanitizeTime(trn.itemDate),
    itemCode: trn.itemCode,
    itemPurQty: sanitizeNumeric(trn.itemPurQty),
    itemUseQty: sanitizeNumeric(trn.itemUseQty),
    remarks: trn.remark || '',
    hotelId: trn.hotelId || 'H001'
});

const mapInvTrnFromDB = (dbTrn) => ({
    id: dbTrn.id,
    itemDate: dbTrn.date,
    itemCode: dbTrn.itemCode,
    itemPurQty: dbTrn.itemPurQty,
    itemUseQty: dbTrn.itemUseQty,
    remark: dbTrn.remarks,
    hotelId: dbTrn.hotelId,
    itemName: '', // Placeholder, UI joins with master
    user: 'system' // Default if not tracked explicitly in this table
});

// LAUNDRY MAPPERS
const mapLaundryTrnToDB = (trn) => ({
    id: trn.id,
    date: sanitizeTime(trn.itemDate),
    itemCode: trn.itemCode,
    itemQout: sanitizeNumeric(trn.itemQout),
    itemQin: sanitizeNumeric(trn.itemQin),
    cleaner: trn.cleaner,
    remarks: trn.itemStatus || '',
    hotelId: trn.hotelId || 'H001'
});

const mapLaundryTrnFromDB = (dbTrn) => ({
    id: dbTrn.id,
    itemDate: dbTrn.date,
    itemCode: dbTrn.itemCode,
    itemQout: dbTrn.itemQout,
    itemQin: dbTrn.itemQin,
    cleaner: dbTrn.cleaner,
    itemStatus: dbTrn.remarks,
    hotelId: dbTrn.hotelId
});

// PETTY CASH MAPPERS
const mapPettyCashToDB = (pc) => ({
    id: pc.id,
    vchNo: pc.vchNo,
    date: sanitizeTime(pc.date),
    description: JSON.stringify({
        d: pc.description || '',
        m: pc.mode || 'Cash',
        p: pc.paidTo || pc.name || '',
        c: pc.category || '',
        r: pc.remark || ''
    }),
    category: pc.category,
    amount: sanitizeNumeric(pc.amount),
    type: pc.type,
    hotelId: pc.hotelId || 'H001'
});

const mapPettyCashFromDB = (dbPc) => {
    let extras = {};
    try {
        if (dbPc.description && dbPc.description.startsWith('{')) {
            extras = JSON.parse(dbPc.description);
        } else {
            extras = { d: dbPc.description };
        }
    } catch (e) { extras = { d: dbPc.description }; }

    return {
        id: dbPc.id,
        vchNo: dbPc.vchNo,
        date: dbPc.date,
        description: extras.d || '',
        name: extras.p || '',
        paidTo: extras.p || '',
        mode: extras.m || 'Cash',
        category: dbPc.category || extras.c || '',
        remark: extras.r || '',
        amount: dbPc.amount,
        type: dbPc.type,
        hotelId: dbPc.hotelId
    };
};

// --- SERVICE IMPLEMENTATION ---

export const db = {
    users: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) { console.error('Users find error:', error); return []; }
            return predicate ? data.filter(predicate) : data;
        },
        findOne: async (predicate) => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) { console.error('Users findOne error:', error); return null; }
            return data.find(predicate);
        },
        getAll: async () => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) { console.error('Users getAll error:', error); return []; }
            return data || [];
        },
        save: async (user) => {
            const { data, error } = await supabase.from('users').upsert(user).select();
            if (error) { throw error; }
            return data[0];
        },
        delete: async (userId) => {
            const { error } = await supabase.from('users').delete().eq('userId', userId);
            if (error) { throw error; }
        }
    },
    rooms: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('rooms').select('*');
            if (error) { console.error('Rooms find error:', error); return []; }
            return predicate ? data.filter(predicate) : data;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('rooms').select('*');
            if (error) { console.error('Rooms getAll error:', error); return []; }
            return data || [];
        },
        save: async (room) => {
            const { currentRate, ...roomData } = room;
            if (roomData.basicRate) roomData.basicRate = sanitizeNumeric(roomData.basicRate);

            const { data, error } = await supabase.from('rooms').upsert(roomData).select();
            if (error) { throw error; }
            return data[0];
        },
        delete: async (roomNo, hotelId) => {
            const { error } = await supabase.from('rooms').delete().match({ roomNo, hotelId });
            if (error) { throw error; }
        }
    },
    bookings: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('bookings').select('*');
            if (error) { console.error('Bookings find error:', error); return []; }
            const mapped = data.map(mapBookingFromDB);
            return predicate ? mapped.filter(predicate) : mapped;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('bookings').select('*');
            if (error) { console.error('Bookings getAll error:', error); return []; }
            return data.map(mapBookingFromDB);
        },
        save: async (booking) => {
            const dbBooking = mapBookingToDB(booking);
            // Remove ID if undefined to allow auto-generation
            if (!dbBooking.id) delete dbBooking.id;

            const { data, error } = await supabase.from('bookings').upsert(dbBooking).select();
            if (error) {
                console.error('Booking save error:', error);
                throw error;
            }
            return mapBookingFromDB(data[0]);
        },
        delete: async (bookingId) => {
            const { error } = await supabase.from('bookings').delete().eq('bookingId', bookingId);
            if (error) { throw error; }
        }
    },
    tasks: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) { console.error('Tasks find error:', error); return []; }
            const mapped = data.map(mapTaskFromDB);
            return predicate ? mapped.filter(predicate) : mapped;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) { console.error('Tasks getAll error:', error); return []; }
            return data.map(mapTaskFromDB);
        },
        save: async (task) => {
            const dbTask = mapTaskToDB(task);
            const { data, error } = await supabase.from('tasks').upsert(dbTask).select();
            if (error) { throw error; }
            return mapTaskFromDB(data[0]);
        },
        delete: async (taskId) => {
            const { error } = await supabase.from('tasks').delete().eq('taskId', taskId);
            if (error) { throw error; }
        }
    },
    settings: {
        get: async (hotelId) => {
            const { data, error } = await supabase.from('settings').select('*').eq('hotelId', hotelId);
            if (error) { return null; }
            return data && data.length > 0 ? data[0] : null;
        },
        save: async (settings) => {
            const { data, error } = await supabase.from('settings').upsert(settings).select();
            if (error) { throw error; }
            return data[0];
        }
    },
    inventory: {
        master: {
            getAll: async () => {
                const { data, error } = await supabase.from('inv_mast').select('*');
                if (error) { return []; }
                return data || [];
            },
            save: async (item) => {
                const itemToSave = { ...item };
                itemToSave.itemPur = sanitizeNumeric(itemToSave.itemPur);
                itemToSave.itemUsed = sanitizeNumeric(itemToSave.itemUsed);

                const { data, error } = await supabase.from('inv_mast').upsert(itemToSave).select();
                if (error) { throw error; }
                return data[0];
            },
            delete: async (itemCode) => {
                const { error } = await supabase.from('inv_mast').delete().eq('itemCode', itemCode);
                if (error) { throw error; }
            }
        },
        transactions: {
            getAll: async () => {
                const { data, error } = await supabase.from('inv_trn').select('*');
                if (error) { return []; }
                return data.map(mapInvTrnFromDB);
            },
            save: async (trn) => {
                const id = trn.id || Date.now().toString();
                const dbTrn = mapInvTrnToDB({ ...trn, id });

                // Logic check: only one qty should be set
                if (dbTrn.itemPurQty > 0) dbTrn.itemUseQty = 0;
                else if (dbTrn.itemUseQty > 0) dbTrn.itemPurQty = 0;

                const { data, error } = await supabase.from('inv_trn').upsert(dbTrn).select();
                if (error) { throw error; }
                return mapInvTrnFromDB(data[0]);
            },
            delete: async (id) => {
                const { error } = await supabase.from('inv_trn').delete().eq('id', id);
                if (error) { throw error; }
            }
        }
    },
    laundry: {
        master: {
            getAll: async () => {
                const { data, error } = await supabase.from('laundry_mast').select('*');
                if (error) { return []; }
                return data || [];
            },
            save: async (item) => {
                const itemToSave = { ...item };
                itemToSave.itemQin = sanitizeNumeric(itemToSave.itemQin);
                itemToSave.pendingInhouse = sanitizeNumeric(itemToSave.pendingInhouse);
                itemToSave.pendingOutside = sanitizeNumeric(itemToSave.pendingOutside);

                const { data, error } = await supabase.from('laundry_mast').upsert(itemToSave).select();
                if (error) { throw error; }
                return data[0];
            },
            delete: async (itemCode) => {
                const { error } = await supabase.from('laundry_mast').delete().eq('itemCode', itemCode);
                if (error) { throw error; }
            }
        },
        transactions: {
            getAll: async () => {
                const { data, error } = await supabase.from('laundry_trn').select('*');
                if (error) { return []; }
                return data.map(mapLaundryTrnFromDB);
            },
            save: async (trn) => {
                const id = trn.id || Date.now().toString();
                const dbTrn = mapLaundryTrnToDB({ ...trn, id });

                const { data, error } = await supabase.from('laundry_trn').upsert(dbTrn).select();
                if (error) { throw error; }
                return mapLaundryTrnFromDB(data[0]);
            },
            delete: async (id) => {
                const { error } = await supabase.from('laundry_trn').delete().eq('id', id);
                if (error) { throw error; }
            }
        }
    },
    pettyCash: {
        getAll: async () => {
            const { data, error } = await supabase.from('petty_cash').select('*');
            if (error) { return []; }
            return data.map(mapPettyCashFromDB); // FIXED: Using mapper to unpack JSON
        },
        save: async (trn) => {
            if (!trn.vchNo) {
                const { data: trns } = await supabase.from('petty_cash').select('vchNo').order('vchNo', { ascending: false }).limit(1);
                let nextNum = 1;
                if (trns && trns.length > 0 && trns[0].vchNo) {
                    const parts = trns[0].vchNo.split('-');
                    if (parts.length > 1 && !isNaN(parseInt(parts[1]))) {
                        nextNum = parseInt(parts[1]) + 1;
                    }
                }
                trn.vchNo = `PC-${nextNum.toString().padStart(4, '0')}`;
                trn.id = Date.now().toString();
            }
            const dbTrn = mapPettyCashToDB(trn);

            const { data, error } = await supabase.from('petty_cash').upsert(dbTrn).select();
            if (error) { throw error; }
            return mapPettyCashFromDB(data[0]);
        },
        delete: async (vchNo) => {
            const { error } = await supabase.from('petty_cash').delete().eq('vchNo', vchNo);
            if (error) { throw error; }
        }
    }
};
