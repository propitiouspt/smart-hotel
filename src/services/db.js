import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
            upsert: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
            delete: () => Promise.resolve({ error: { message: 'Supabase not initialized' } }),
        })
    };

// ─── HELPERS ──────────────────────────────────────────

const sanitizeNumeric = (val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

const sanitizeTime = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    return val;
};

// Safe string for .toLowerCase() calls - prevents undefined crashes
const s = (val) => (val == null ? '' : String(val));

// ─── TASK MAPPERS ────────────────────────────────────

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

// ─── BOOKING MAPPERS ─────────────────────────────────
// The bookings table does NOT have columns for checkInTime, checkoutNote,
// idProofMemo, idProofImages, etc. We pack these into the 'remarks' TEXT column.

const mapBookingToDB = (b) => {
    const extras = {
        userRemarks: b.remarks || '',
        checkInTime: b.checkInTime,
        checkOutTime: b.checkOutTime,
        actualArrivalTime: b.actualArrivalTime,
        actualCheckoutDate: b.actualCheckoutDate,
        checkedInBy: b.checkedInBy,
        checkoutNote: b.checkoutNote,
        idProofMemo: b.idProofMemo,
        idProofImages: b.idProofImages
    };

    const dbObj = {
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
        checkedIn: b.checkedIn || false,
        remarks: JSON.stringify(extras)
    };

    // Include 'id' only if present (for updates)
    if (b.id) dbObj.id = b.id;

    return dbObj;
};

const mapBookingFromDB = (b) => {
    let extras = {};
    let originalRemarks = b.remarks || '';
    try {
        if (b.remarks && b.remarks.startsWith('{')) {
            const parsed = JSON.parse(b.remarks);
            if (typeof parsed === 'object') {
                extras = parsed;
                originalRemarks = extras.userRemarks || '';
            }
        }
    } catch (e) { /* remarks was plain text */ }

    return {
        ...b,
        ...extras,
        remarks: originalRemarks
    };
};

// ─── INVENTORY MAPPERS ───────────────────────────────
// inv_trn has: id, date, itemCode, itemPurQty, itemUseQty, remarks, hotelId
// UI expects: id, itemDate, itemCode, itemName, itemPurQty, itemUseQty, remark, user

const mapInvTrnToDB = (trn) => ({
    id: trn.id,
    date: sanitizeTime(trn.itemDate),
    itemCode: trn.itemCode,
    itemPurQty: sanitizeNumeric(trn.itemPurQty),
    itemUseQty: sanitizeNumeric(trn.itemUseQty),
    remarks: trn.remark || '',
    hotelId: trn.hotelId || 'H001'
});

const mapInvTrnFromDB = (dbTrn, masterLookup = {}) => ({
    id: dbTrn.id,
    itemDate: dbTrn.date,
    itemCode: dbTrn.itemCode || '',
    itemName: masterLookup[dbTrn.itemCode] || '',  // ← ENRICHED from master
    itemPurQty: dbTrn.itemPurQty || 0,
    itemUseQty: dbTrn.itemUseQty || 0,
    remark: dbTrn.remarks || '',
    hotelId: dbTrn.hotelId,
    user: ''
});

// ─── LAUNDRY MAPPERS ─────────────────────────────────
// laundry_trn has: id, date, itemCode, itemQout, itemQin, cleaner, remarks, hotelId
// UI expects: id, itemDate, itemCode, itemName, itemQout, itemQin, cleaner, itemStatus, itemUser

const mapLaundryTrnToDB = (trn) => ({
    id: trn.id,
    date: sanitizeTime(trn.itemDate),
    itemCode: trn.itemCode,
    itemQout: sanitizeNumeric(trn.itemQout),
    itemQin: sanitizeNumeric(trn.itemQin),
    cleaner: trn.cleaner || 'Inhouse',
    remarks: trn.itemStatus || '',
    hotelId: trn.hotelId || 'H001'
});

const mapLaundryTrnFromDB = (dbTrn, masterLookup = {}) => ({
    id: dbTrn.id,
    itemDate: dbTrn.date,
    itemCode: dbTrn.itemCode || '',
    itemName: masterLookup[dbTrn.itemCode] || '',  // ← ENRICHED from master
    itemQout: dbTrn.itemQout || 0,
    itemQin: dbTrn.itemQin || 0,
    cleaner: dbTrn.cleaner || '',
    itemStatus: dbTrn.remarks || '',
    itemUser: '',
    hotelId: dbTrn.hotelId
});

// ─── PETTY CASH MAPPERS ──────────────────────────────
// petty_cash has: id, vchNo, date, description, category, amount, type, hotelId
// UI expects: id, vchNo, date, description, name, paidTo, mode, category, remark, amount, type

const mapPettyCashToDB = (pc) => ({
    id: pc.id,
    vchNo: pc.vchNo,
    date: sanitizeTime(pc.date),
    description: JSON.stringify({
        d: pc.description || '',
        m: pc.mode || 'Cash',
        p: pc.paidTo || pc.name || '',
        r: pc.remark || ''
    }),
    category: pc.category || '',
    amount: sanitizeNumeric(pc.amount),
    type: pc.type || 'Payment',
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
        id: dbPc.id || '',
        vchNo: dbPc.vchNo || '',
        date: dbPc.date || '',
        description: extras.d || '',
        name: extras.p || '',
        paidTo: extras.p || '',
        mode: extras.m || 'Cash',
        category: dbPc.category || extras.c || '',
        remark: extras.r || '',
        amount: dbPc.amount || 0,
        type: dbPc.type || 'Payment',
        hotelId: dbPc.hotelId || ''
    };
};

// ─── DB SERVICE ──────────────────────────────────────

export const db = {
    users: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) { console.error('Users find:', error); return []; }
            return predicate ? data.filter(predicate) : data;
        },
        findOne: async (predicate) => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) { console.error('Users findOne:', error); return null; }
            return data.find(predicate);
        },
        getAll: async () => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) { console.error('Users getAll:', error); return []; }
            return data || [];
        },
        save: async (user) => {
            const { data, error } = await supabase.from('users').upsert(user).select();
            if (error) { console.error('Users save:', error); throw error; }
            return data[0];
        },
        delete: async (userId) => {
            const { error } = await supabase.from('users').delete().eq('userId', userId);
            if (error) throw error;
        }
    },

    rooms: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('rooms').select('*');
            if (error) { console.error('Rooms find:', error); return []; }
            return predicate ? data.filter(predicate) : data;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('rooms').select('*');
            if (error) { console.error('Rooms getAll:', error); return []; }
            return data || [];
        },
        save: async (room) => {
            const { currentRate, ...roomData } = room;
            if (roomData.basicRate) roomData.basicRate = sanitizeNumeric(roomData.basicRate);
            const { data, error } = await supabase.from('rooms').upsert(roomData).select();
            if (error) { console.error('Rooms save:', error); throw error; }
            return data[0];
        },
        delete: async (roomNo, hotelId) => {
            const { error } = await supabase.from('rooms').delete().match({ roomNo, hotelId });
            if (error) throw error;
        }
    },

    bookings: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('bookings').select('*');
            if (error) { console.error('Bookings find:', error); return []; }
            const mapped = data.map(mapBookingFromDB);
            return predicate ? mapped.filter(predicate) : mapped;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('bookings').select('*');
            if (error) { console.error('Bookings getAll:', error); return []; }
            return data.map(mapBookingFromDB);
        },
        save: async (booking) => {
            const dbBooking = mapBookingToDB(booking);
            const { data, error } = await supabase.from('bookings').upsert(dbBooking).select();
            if (error) {
                console.error('Bookings save error:', error);
                throw error;
            }
            return mapBookingFromDB(data[0]);
        },
        delete: async (bookingId) => {
            const { error } = await supabase.from('bookings').delete().eq('bookingId', bookingId);
            if (error) throw error;
        }
    },

    tasks: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) { console.error('Tasks find:', error); return []; }
            const mapped = data.map(mapTaskFromDB);
            return predicate ? mapped.filter(predicate) : mapped;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) { console.error('Tasks getAll:', error); return []; }
            return data.map(mapTaskFromDB);
        },
        save: async (task) => {
            const dbTask = mapTaskToDB(task);
            const { data, error } = await supabase.from('tasks').upsert(dbTask).select();
            if (error) { console.error('Tasks save:', error); throw error; }
            return mapTaskFromDB(data[0]);
        },
        delete: async (taskId) => {
            const { error } = await supabase.from('tasks').delete().eq('taskId', taskId);
            if (error) throw error;
        }
    },

    settings: {
        get: async (hotelId) => {
            const { data, error } = await supabase.from('settings').select('*').eq('hotelId', hotelId);
            if (error) return null;
            return data && data.length > 0 ? data[0] : null;
        },
        save: async (settings) => {
            const { data, error } = await supabase.from('settings').upsert(settings).select();
            if (error) throw error;
            return data[0];
        }
    },

    inventory: {
        master: {
            getAll: async () => {
                const { data, error } = await supabase.from('inv_mast').select('*');
                if (error) { console.error('Inv master getAll:', error); return []; }
                return (data || []).map(d => ({
                    itemCode: d.itemCode || '',
                    itemName: d.itemName || '',
                    category: d.unit || '',
                    itemOpstock: d.itemOpstock || 0,
                    itemPur: d.itemPur || 0,
                    itemUsed: d.itemUsed || 0,
                    hotelId: d.hotelId || 'H001'
                }));
            },
            save: async (item) => {
                const dbItem = {
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    unit: item.category || '',
                    itemPur: sanitizeNumeric(item.itemPur),
                    itemUsed: sanitizeNumeric(item.itemUsed),
                    hotelId: item.hotelId || 'H001'
                };

                // Try with itemOpstock (requires ALTER TABLE to have been run)
                const withOpstock = { ...dbItem, itemOpstock: sanitizeNumeric(item.itemOpstock) };
                let { data, error } = await supabase.from('inv_mast').upsert(withOpstock).select();

                // If column doesn't exist yet, retry without it
                if (error && error.message && error.message.includes('itemOpstock')) {
                    console.warn('itemOpstock column not found, saving without it.');
                    ({ data, error } = await supabase.from('inv_mast').upsert(dbItem).select());
                }

                if (error) { console.error('Inv master save:', error); throw error; }
                return data[0];
            },
            delete: async (itemCode) => {
                const { error } = await supabase.from('inv_mast').delete().eq('itemCode', itemCode);
                if (error) throw error;
            }
        },
        transactions: {
            getAll: async () => {
                const { data: trnData, error: trnErr } = await supabase.from('inv_trn').select('*');
                if (trnErr) { console.error('Inv trn getAll:', trnErr); return []; }
                const { data: masterData } = await supabase.from('inv_mast').select('itemCode, itemName');
                const masterLookup = {};
                (masterData || []).forEach(m => { masterLookup[m.itemCode] = m.itemName; });
                return (trnData || []).map(t => mapInvTrnFromDB(t, masterLookup));
            },
            save: async (trn) => {
                const id = trn.id || Date.now().toString();
                const dbTrn = mapInvTrnToDB({ ...trn, id });

                if (dbTrn.itemPurQty > 0) dbTrn.itemUseQty = 0;
                else if (dbTrn.itemUseQty > 0) dbTrn.itemPurQty = 0;

                const { data, error } = await supabase.from('inv_trn').upsert(dbTrn).select();
                if (error) { console.error('Inv trn save:', error); throw error; }

                // ── Auto-update master totals ──
                const itemCode = dbTrn.itemCode;
                if (itemCode) {
                    const { data: allTrns } = await supabase.from('inv_trn').select('itemPurQty, itemUseQty').eq('itemCode', itemCode);
                    const totalPur = (allTrns || []).reduce((sum, t) => sum + (Number(t.itemPurQty) || 0), 0);
                    const totalUsed = (allTrns || []).reduce((sum, t) => sum + (Number(t.itemUseQty) || 0), 0);
                    await supabase.from('inv_mast').update({ itemPur: totalPur, itemUsed: totalUsed }).eq('itemCode', itemCode);
                }

                return mapInvTrnFromDB(data[0]);
            },
            delete: async (id) => {
                // Get the item code before deleting so we can recalculate
                const { data: delTrn } = await supabase.from('inv_trn').select('itemCode').eq('id', id).single();
                const { error } = await supabase.from('inv_trn').delete().eq('id', id);
                if (error) throw error;

                // Recalculate master totals after delete
                if (delTrn?.itemCode) {
                    const { data: allTrns } = await supabase.from('inv_trn').select('itemPurQty, itemUseQty').eq('itemCode', delTrn.itemCode);
                    const totalPur = (allTrns || []).reduce((sum, t) => sum + (Number(t.itemPurQty) || 0), 0);
                    const totalUsed = (allTrns || []).reduce((sum, t) => sum + (Number(t.itemUseQty) || 0), 0);
                    await supabase.from('inv_mast').update({ itemPur: totalPur, itemUsed: totalUsed }).eq('itemCode', delTrn.itemCode);
                }
            }
        }
    },

    laundry: {
        master: {
            getAll: async () => {
                const { data, error } = await supabase.from('laundry_mast').select('*');
                if (error) return [];
                return data || [];
            },
            save: async (item) => {
                const itemToSave = { ...item };
                itemToSave.itemQin = sanitizeNumeric(itemToSave.itemQin);
                itemToSave.pendingInhouse = sanitizeNumeric(itemToSave.pendingInhouse);
                itemToSave.pendingOutside = sanitizeNumeric(itemToSave.pendingOutside);
                const { data, error } = await supabase.from('laundry_mast').upsert(itemToSave).select();
                if (error) { console.error('Laundry master save:', error); throw error; }
                return data[0];
            },
            delete: async (itemCode) => {
                const { error } = await supabase.from('laundry_mast').delete().eq('itemCode', itemCode);
                if (error) throw error;
            }
        },
        transactions: {
            getAll: async () => {
                const { data: trnData, error: trnErr } = await supabase.from('laundry_trn').select('*');
                if (trnErr) { console.error('Laundry trn getAll:', trnErr); return []; }
                const { data: masterData } = await supabase.from('laundry_mast').select('itemCode, itemName');
                const masterLookup = {};
                (masterData || []).forEach(m => { masterLookup[m.itemCode] = m.itemName; });
                return (trnData || []).map(t => mapLaundryTrnFromDB(t, masterLookup));
            },
            save: async (trn) => {
                const id = trn.id || Date.now().toString();
                const dbTrn = mapLaundryTrnToDB({ ...trn, id });

                const { data, error } = await supabase.from('laundry_trn').upsert(dbTrn).select();
                if (error) { console.error('Laundry trn save:', error); throw error; }

                // ── Auto-update laundry master totals ──
                const itemCode = dbTrn.itemCode;
                if (itemCode) {
                    const { data: allTrns } = await supabase.from('laundry_trn').select('itemQout, itemQin, cleaner').eq('itemCode', itemCode);
                    const totalIn = (allTrns || []).reduce((sum, t) => sum + (Number(t.itemQin) || 0), 0);
                    const totalOutInh = (allTrns || []).reduce((sum, t) => sum + (t.cleaner === 'Inhouse' ? (Number(t.itemQout) || 0) : 0), 0);
                    const totalInInh = (allTrns || []).reduce((sum, t) => sum + (t.cleaner === 'Inhouse' ? (Number(t.itemQin) || 0) : 0), 0);
                    const totalOutOut = (allTrns || []).reduce((sum, t) => sum + (t.cleaner !== 'Inhouse' ? (Number(t.itemQout) || 0) : 0), 0);
                    const totalInOut = (allTrns || []).reduce((sum, t) => sum + (t.cleaner !== 'Inhouse' ? (Number(t.itemQin) || 0) : 0), 0);

                    await supabase.from('laundry_mast').update({
                        pendingInhouse: Math.max(0, totalOutInh - totalInInh),
                        pendingOutside: Math.max(0, totalOutOut - totalInOut),
                        itemQin: totalIn
                    }).eq('itemCode', itemCode);
                }

                return mapLaundryTrnFromDB(data[0]);
            },
            delete: async (id) => {
                const { data: delTrn } = await supabase.from('laundry_trn').select('itemCode').eq('id', id).single();
                const { error } = await supabase.from('laundry_trn').delete().eq('id', id);
                if (error) throw error;

                if (delTrn?.itemCode) {
                    const { data: allTrns } = await supabase.from('laundry_trn').select('itemQout, itemQin, cleaner').eq('itemCode', delTrn.itemCode);
                    const totalIn = (allTrns || []).reduce((sum, t) => sum + (Number(t.itemQin) || 0), 0);
                    const totalOutInh = (allTrns || []).reduce((sum, t) => sum + (t.cleaner === 'Inhouse' ? (Number(t.itemQout) || 0) : 0), 0);
                    const totalInInh = (allTrns || []).reduce((sum, t) => sum + (t.cleaner === 'Inhouse' ? (Number(t.itemQin) || 0) : 0), 0);
                    const totalOutOut = (allTrns || []).reduce((sum, t) => sum + (t.cleaner !== 'Inhouse' ? (Number(t.itemQout) || 0) : 0), 0);
                    const totalInOut = (allTrns || []).reduce((sum, t) => sum + (t.cleaner !== 'Inhouse' ? (Number(t.itemQin) || 0) : 0), 0);

                    await supabase.from('laundry_mast').update({
                        pendingInhouse: Math.max(0, totalOutInh - totalInInh),
                        pendingOutside: Math.max(0, totalOutOut - totalInOut),
                        itemQin: totalIn
                    }).eq('itemCode', delTrn.itemCode);
                }
            }
        }
    },

    pettyCash: {
        getAll: async () => {
            const { data, error } = await supabase.from('petty_cash').select('*');
            if (error) { console.error('PettyCash getAll:', error); return []; }
            return (data || []).map(mapPettyCashFromDB);
        },
        save: async (trn) => {
            if (!trn.vchNo) {
                const { data: trns } = await supabase.from('petty_cash')
                    .select('vchNo').order('vchNo', { ascending: false }).limit(1);
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
            if (error) { console.error('PettyCash save:', error); throw error; }
            return mapPettyCashFromDB(data[0]);
        },
        delete: async (vchNo) => {
            const { error } = await supabase.from('petty_cash').delete().eq('vchNo', vchNo);
            if (error) throw error;
        }
    }
};
