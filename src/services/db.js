import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Check your .env file.');
}

// Safely create Supabase client to prevent app crash
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
            upsert: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
            delete: () => Promise.resolve({ error: { message: 'Supabase not initialized' } }),
        })
    };

// Helper to sanitize numeric values
const sanitizeNumeric = (val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

// Helper to sanitize Time/Date values
const sanitizeTime = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    return val;
};

// --- MAPPERS (Adapters) ---
// These translate between UI objects and DB columns

const mapTaskToDB = (task) => ({
    taskId: task.taskId,
    title: task.userName, // Storing userName in title for now
    description: JSON.stringify({
        memo: task.assignMemo,
        startStat: task.startStat,
        assignTime: task.assignTime,
        assignDate: task.assignDate,
        staffComment: task.staffComment,
        endTime: task.endTime
    }), // Store extras in description JSON
    status: task.endStat || 'Pending', // Map endStat to status
    priority: 'Normal',
    assignedTo: task.userId,
    dueDate: sanitizeTime(task.assignDate), // Map assignDate to dueDate
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

const mapInvTrnToDB = (trn) => ({
    id: trn.id,
    date: sanitizeTime(trn.itemDate), // itemDate -> date
    itemCode: trn.itemCode,
    itemPurQty: sanitizeNumeric(trn.itemPurQty),
    itemUseQty: sanitizeNumeric(trn.itemUseQty),
    remarks: trn.remark || '', // remark -> remarks
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
    // Join with master usually happens in UI, but we return raw here
    itemName: '' // Placeholder, UI often fills this
});

const mapLaundryTrnToDB = (trn) => ({
    id: trn.id,
    date: sanitizeTime(trn.itemDate), // itemDate -> date
    itemCode: trn.itemCode,
    itemQout: sanitizeNumeric(trn.itemQout),
    itemQin: sanitizeNumeric(trn.itemQin),
    cleaner: trn.cleaner,
    remarks: trn.itemStatus || '', // itemStatus -> remarks
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

const mapPettyCashToDB = (pc) => ({
    id: pc.id,
    vchNo: pc.vchNo,
    date: sanitizeTime(pc.date),
    description: pc.description + (pc.mode ? ` | Mode: ${pc.mode}` : '') + (pc.paidTo ? ` | PaidTo: ${pc.paidTo}` : ''),
    category: pc.category,
    amount: sanitizeNumeric(pc.amount),
    type: pc.type,
    hotelId: pc.hotelId || 'H001'
});

export const db = {
    users: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) {
                console.error('Error fetching users:', error);
                return [];
            }
            return predicate ? data.filter(predicate) : data;
        },
        findOne: async (predicate) => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) {
                console.error('Error fetching users:', error);
                return null;
            }
            return data.find(predicate);
        },
        getAll: async () => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) {
                console.error('Error fetching users:', error);
                return [];
            }
            return data || [];
        },
        save: async (user) => {
            const { data, error } = await supabase.from('users').upsert(user).select();
            if (error) {
                console.error('Error saving user:', error);
                throw error;
            }
            return data[0];
        },
        delete: async (userId) => {
            const { error } = await supabase.from('users').delete().eq('userId', userId);
            if (error) {
                console.error('Error deleting user:', error);
                throw error;
            }
        }
    },
    rooms: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('rooms').select('*');
            if (error) {
                console.error('Error fetching rooms:', error);
                return [];
            }
            return predicate ? data.filter(predicate) : data;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('rooms').select('*');
            if (error) {
                console.error('Error fetching rooms:', error);
                return [];
            }
            return data || [];
        },
        save: async (room) => {
            // Remove calculated/UI-only fields that are not in the database schema
            const { currentRate, ...roomData } = room;

            // Ensure numeric fields are numbers
            if (roomData.basicRate) roomData.basicRate = sanitizeNumeric(roomData.basicRate);

            const { data, error } = await supabase.from('rooms').upsert(roomData).select();
            if (error) {
                console.error('Error saving room:', error);
                throw error;
            }
            return data[0];
        },
        delete: async (roomNo, hotelId) => {
            const { error } = await supabase.from('rooms').delete().match({ roomNo, hotelId });
            if (error) {
                console.error('Error deleting room:', error);
                throw error;
            }
        }
    },
    bookings: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('bookings').select('*');
            if (error) {
                console.error('Error fetching bookings:', error);
                return [];
            }
            return predicate ? data.filter(predicate) : data;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('bookings').select('*');
            if (error) {
                console.error('Error fetching bookings:', error);
                return [];
            }
            return data || [];
        },
        save: async (booking) => {
            // Remove id if it's empty string to let Supabase generate UUID
            const bookingToSave = { ...booking };
            if (!bookingToSave.id) delete bookingToSave.id;

            // Sanitize numeric fields to prevent empty string errors
            const numericFields = [
                'totalGuests', 'children', 'nights',
                'totalBookingAmount', 'commissionPercent', 'commissionAmount',
                'taxPercent', 'taxAmount', 'cityTax', 'securityDeposit', 'payoutReceived'
            ];

            numericFields.forEach(field => {
                if (field in bookingToSave) {
                    bookingToSave[field] = sanitizeNumeric(bookingToSave[field]);
                }
            });

            // Sanitize DATE/TIME fields to prevent empty string errors
            // Specifically arrivalTime which defaults to '' in UI
            if ('arrivalTime' in bookingToSave) bookingToSave.arrivalTime = sanitizeTime(bookingToSave.arrivalTime);
            if ('checkInDate' in bookingToSave) bookingToSave.checkInDate = sanitizeTime(bookingToSave.checkInDate);
            if ('checkOutDate' in bookingToSave) bookingToSave.checkOutDate = sanitizeTime(bookingToSave.checkOutDate);
            if ('bookingDate' in bookingToSave) bookingToSave.bookingDate = sanitizeTime(bookingToSave.bookingDate);

            const { data, error } = await supabase.from('bookings').upsert(bookingToSave).select();
            if (error) {
                console.error('Error saving booking:', error);
                throw error;
            }
            return data[0];
        },
    },
    tasks: {
        find: async (predicate) => {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) {
                console.error('Error fetching tasks:', error);
                return [];
            }
            const mapped = data.map(mapTaskFromDB);
            return predicate ? mapped.filter(predicate) : mapped;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) {
                console.error('Error fetching tasks:', error);
                return [];
            }
            return data.map(mapTaskFromDB);
        },
        save: async (task) => {
            const dbTask = mapTaskToDB(task);
            const { data, error } = await supabase.from('tasks').upsert(dbTask).select();
            if (error) {
                console.error('Error saving task:', error);
                throw error;
            }
            return mapTaskFromDB(data[0]);
        },
        delete: async (taskId) => {
            const { error } = await supabase.from('tasks').delete().eq('taskId', taskId);
            if (error) {
                console.error('Error deleting task:', error);
                throw error;
            }
        }
    },
    settings: {
        get: async (hotelId) => {
            const { data, error } = await supabase.from('settings').select('*').eq('hotelId', hotelId);
            if (error) {
                console.error('Error fetching settings:', error);
                return null;
            }
            return data && data.length > 0 ? data[0] : null;
        },
        save: async (settings) => {
            const { data, error } = await supabase.from('settings').upsert(settings).select();
            if (error) {
                console.error('Error saving settings:', error);
                throw error;
            }
            return data[0];
        }
    },
    inventory: {
        master: {
            getAll: async () => {
                const { data, error } = await supabase.from('inv_mast').select('*');
                if (error) {
                    console.error('Error fetching inventory master:', error);
                    return [];
                }
                return data || [];
            },
            save: async (item) => {
                const itemToSave = { ...item };
                itemToSave.itemPur = sanitizeNumeric(itemToSave.itemPur) ?? 0;
                itemToSave.itemUsed = sanitizeNumeric(itemToSave.itemUsed) ?? 0;

                const { data, error } = await supabase.from('inv_mast').upsert(itemToSave).select();
                if (error) {
                    console.error('Error saving inventory item:', error);
                    throw error;
                }
                return data[0];
            },
            delete: async (itemCode) => {
                const { error } = await supabase.from('inv_mast').delete().eq('itemCode', itemCode);
                if (error) {
                    console.error('Error deleting inventory item:', error);
                    throw error;
                }
            }
        },
        transactions: {
            getAll: async () => {
                const { data, error } = await supabase.from('inv_trn').select('*');
                if (error) {
                    console.error('Error fetching inventory transactions:', error);
                    return [];
                }
                return data.map(mapInvTrnFromDB);
            },
            save: async (trn) => {
                const isNew = !trn.id;
                const id = trn.id || Date.now().toString();
                // Map first, then fix logic if needed, or fix logic then map.
                // Logic requires standard keys. Let's rely on Mapper to handle structure.

                const dbTrn = mapInvTrnToDB({ ...trn, id });

                // Logic: if buying, usage is 0. If using, purchase is 0.
                if (dbTrn.itemPurQty > 0) dbTrn.itemUseQty = 0;
                else if (dbTrn.itemUseQty > 0) dbTrn.itemPurQty = 0;

                const { data, error } = await supabase.from('inv_trn').upsert(dbTrn).select();
                if (error) {
                    console.error('Error saving inventory transaction:', error);
                    throw error;
                }

                // Update Master quantities - simplified
                // In real app, we might use a Trigger or a separate service method
                // We'll skip local master update here as it complicates "dumb" DB service

                return mapInvTrnFromDB(data[0]);
            },
            delete: async (id) => {
                const { error } = await supabase.from('inv_trn').delete().eq('id', id);
                if (error) {
                    console.error('Error deleting inventory transaction:', error);
                    throw error;
                }
            }
        }
    },
    laundry: {
        master: {
            getAll: async () => {
                const { data, error } = await supabase.from('laundry_mast').select('*');
                if (error) {
                    console.error('Error fetching laundry master:', error);
                    return [];
                }
                return data || [];
            },
            save: async (item) => {
                const itemToSave = { ...item };
                itemToSave.itemQin = sanitizeNumeric(itemToSave.itemQin) ?? 0;
                itemToSave.pendingInhouse = sanitizeNumeric(itemToSave.pendingInhouse) ?? 0;
                itemToSave.pendingOutside = sanitizeNumeric(itemToSave.pendingOutside) ?? 0;

                const { data, error } = await supabase.from('laundry_mast').upsert(itemToSave).select();
                if (error) {
                    console.error('Error saving laundry item:', error);
                    throw error;
                }
                return data[0];
            },
            delete: async (itemCode) => {
                const { error } = await supabase.from('laundry_mast').delete().eq('itemCode', itemCode);
                if (error) {
                    console.error('Error deleting laundry item:', error);
                    throw error;
                }
            }
        },
        transactions: {
            getAll: async () => {
                const { data, error } = await supabase.from('laundry_trn').select('*');
                if (error) {
                    console.error('Error fetching laundry transactions:', error);
                    return [];
                }
                return data || [];
            },
            save: async (trn) => {
                const id = trn.id || Date.now().toString();
                const newTrn = { ...trn, id };

                newTrn.itemQout = sanitizeNumeric(newTrn.itemQout) ?? 0;
                newTrn.itemQin = sanitizeNumeric(newTrn.itemQin) ?? 0;

                const { data, error } = await supabase.from('laundry_trn').upsert(newTrn).select();
                if (error) {
                    console.error('Error saving laundry transaction:', error);
                    throw error;
                }
                return data[0];
            },
            delete: async (id) => {
                const { error } = await supabase.from('laundry_trn').delete().eq('id', id);
                if (error) {
                    console.error('Error deleting laundry transaction:', error);
                    throw error;
                }
            }
        }
    },
    pettyCash: {
        getAll: async () => {
            const { data, error } = await supabase.from('petty_cash').select('*');
            if (error) {
                console.error('Error fetching petty cash:', error);
                return [];
            }
            return data || [];
        },
        save: async (trn) => {
            if (!trn.vchNo) {
                // We might need to generate VchNo on server side or fetch latest.
                // For simplicity, fetch all and generate.
                const { data: trns } = await supabase.from('petty_cash').select('vchNo').order('vchNo', { ascending: false }).limit(1);
                let nextNum = 1;
                if (trns && trns.length > 0) {
                    const lastNum = parseInt(trns[0].vchNo.split('-')[1]);
                    nextNum = lastNum + 1;
                }
                trn.vchNo = `PC-${nextNum.toString().padStart(4, '0')}`;
                trn.id = Date.now().toString();
            }
            const dbTrn = mapPettyCashToDB(trn);

            const { data, error } = await supabase.from('petty_cash').upsert(dbTrn).select();
            if (error) {
                console.error('Error saving petty cash:', error);
                throw error;
            }
            return data[0];
        },
        delete: async (vchNo) => {
            const { error } = await supabase.from('petty_cash').delete().eq('vchNo', vchNo);
            if (error) {
                console.error('Error deleting petty cash:', error);
                throw error;
            }
        }
    }
};

