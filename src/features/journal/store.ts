import { create } from 'zustand';
import { JournalService, type DecryptedEntry } from './journalService';

interface JournalState {
    entries: DecryptedEntry[];
    isLoading: boolean;
    error: string | null;
    loadEntries: () => Promise<void>;
    addEntry: (content: any, title?: string, id?: string) => Promise<string>;
    updateEntry: (id: string, content: any, title?: string) => Promise<void>;
    cleanupDuplicates: () => Promise<number>;
    deleteAllEntries: () => Promise<void>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
    entries: [],
    isLoading: false,
    error: null,

    loadEntries: async () => {
        set({ isLoading: true, error: null });
        try {
            const entries = await JournalService.getEntries();
            set({ entries, isLoading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message || 'Failed to load entries', isLoading: false });
        }
    },

    addEntry: async (content: any, title?: string, id?: string) => {
        set({ isLoading: true, error: null });
        try {
            const newId = await JournalService.createEntry(content, title, id);
            await get().loadEntries(); // Reload to get updated list with correct sorting/IDs
            return newId;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message || 'Failed to save entry', isLoading: false });
            throw err;
        }
    },

    updateEntry: async (id: string, content: any, title?: string) => {
        set({ isLoading: true, error: null });
        try {
            await JournalService.updateEntry(id, content, title);
            await get().loadEntries();
        } catch (err: any) {
            console.error(err);
            set({ error: err.message || 'Failed to update entry', isLoading: false });
        }
    },

    clearEntries: () => set({ entries: [], error: null, isLoading: false }),

    cleanupDuplicates: async () => {
        set({ isLoading: true, error: null });
        try {
            const count = await JournalService.cleanupDuplicates();
            await get().loadEntries();
            return count;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message || 'Failed to cleanup duplicates', isLoading: false });
            throw err;
        }
    },

    deleteAllEntries: async () => {
        set({ isLoading: true, error: null });
        try {
            await JournalService.deleteAllEntries();
            set({ entries: [], isLoading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message || 'Failed to delete all entries', isLoading: false });
            throw err;
        }
    }
}));
