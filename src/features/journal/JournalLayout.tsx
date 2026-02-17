import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth/store';
import { useJournalStore } from './store';
import { Button } from '../../components/Button';
import { LogOut, Plus, ArrowLeft } from 'lucide-react';
import EntryList from './EntryList';
import EntryEditor from './EntryEditor';

export default function JournalLayout() {
    const logout = useAuthStore((state) => state.logout);
    const { loadEntries, entries } = useJournalStore();

    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const handleCreate = () => {
        setView('create');
        setSelectedEntryId(null);
    };

    const handleSelectEntry = (id: string) => {
        setSelectedEntryId(id);
        setView('edit');
    };

    const handleBack = () => {
        setView('list');
        setSelectedEntryId(null);
    };

    const getSelectedEntry = () => {
        if (!selectedEntryId) return undefined;
        return entries.find(e => e.id === selectedEntryId);
    };

    const selectedEntry = getSelectedEntry();

    return (
        <div className="min-h-screen bg-stone-100 flex flex-col">
            <header className="bg-white border-b border-stone-200 px-4 py-3 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {view !== 'list' && (
                            <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        )}
                        <h1 className="text-xl font-serif font-bold text-stone-800">
                            {view === 'list' && 'My Journal'}
                            {view === 'create' && 'New Entry'}
                            {view === 'edit' && 'Edit Entry'}
                        </h1>
                    </div>

                    <div className="flex gap-2">
                        {view === 'list' && (
                            <Button onClick={handleCreate} size="sm">
                                <Plus className="w-4 h-4 mr-1" />
                                New Entry
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={logout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
                {view === 'list' && (
                    <EntryList onSelectEntry={handleSelectEntry} />
                )}

                {(view === 'create' || (view === 'edit' && selectedEntry)) && (
                    <div className="h-[calc(100vh-140px)]">
                        <EntryEditor
                            initialTitle={selectedEntry?.title}
                            entryId={selectedEntry?.id}
                            onCheckIn={handleBack}
                            onEntryCreated={handleSelectEntry}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
