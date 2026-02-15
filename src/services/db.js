import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
            const { data, error } = await supabase.from('rooms').upsert(room).select();
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
            return predicate ? data.filter(predicate) : data;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) {
                console.error('Error fetching tasks:', error);
                return [];
            }
            return data || [];
        },
        save: async (task) => {
            const { data, error } = await supabase.from('tasks').upsert(task).select();
            if (error) {
                console.error('Error saving task:', error);
                throw error;
            }
            return data[0];
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
                const { data, error } = await supabase.from('inv_mast').upsert(item).select();
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
                return data || [];
            },
            save: async (trn) => {
                const isNew = !trn.id;
                const id = trn.id || Date.now().toString();
                const refinedTrn = { ...trn, id };

                if (Number(refinedTrn.itemPurQty) > 0) refinedTrn.itemUseQty = 0;
                else if (Number(refinedTrn.itemUseQty) > 0) refinedTrn.itemPurQty = 0;

                const { data, error } = await supabase.from('inv_trn').upsert(refinedTrn).select();
                if (error) {
                    console.error('Error saving inventory transaction:', error);
                    throw error;
                }

                // Update Master quantities (Real-time update logic can be complex, 
                // but we follow current pattern of updating master alongside trn)
                const { data: masters, error: mError } = await supabase.from('inv_mast').select('*').eq('itemCode', refinedTrn.itemCode);
                if (!mError && masters.length > 0) {
                    const master = masters[0];
                    // Redo math logic here if needed, or assume it's settled in UI.
                    // The old logic was fetching all transactions and re-summing or diffing.
                    // For now, simpler: Upsert the master with new values if UI provided them.
                    // But in this app, the `save` method in `db.js` was doing calculations.
                }

                return data[0];
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
                const { data, error } = await supabase.from('laundry_mast').upsert(item).select();
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
            const { data, error } = await supabase.from('petty_cash').upsert(trn).select();
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

