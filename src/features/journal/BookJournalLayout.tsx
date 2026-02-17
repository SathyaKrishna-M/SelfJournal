import { useState, useEffect } from 'react';
import { useJournalStore } from './store';
import EntryEditor from './EntryEditor';
import BookContainer from '../../components/Book/BookContainer';
import Page from '../../components/Book/Page';
import { CoverPage } from '../../components/Book/CoverPage';
import { AppShell } from '../../components/layout/AppShell';

export default function BookJournalLayout() {
    // Auth store usage for logout is now in TopBar, but we might keep it if needed for other logic
    // const logout = useAuthStore((state) => state.logout); 
    const { loadEntries, entries } = useJournalStore();
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

    // Force re-render of right page when selecting generic "New Entry" to clear form
    const [newEntryKey, setNewEntryKey] = useState(0);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const handleCreate = () => {
        setSelectedEntryId(null);
        setNewEntryKey(k => k + 1);
    };

    const handleSelectEntry = (id: string) => {
        setSelectedEntryId(id);
    };

    const handleSaveComplete = () => {
        // Optional feedback
    };

    const selectedEntry = selectedEntryId ? entries.find(e => e.id === selectedEntryId) : undefined;

    return (
        <AppShell onNewEntry={handleCreate} onSelectEntry={handleSelectEntry}>
            <BookContainer>
                {/* Page 1: Left - Cover / Index */}
                <Page number={1}>
                    <CoverPage onSelectEntry={handleSelectEntry} />
                </Page>

                {/* Page 2: Right - Editor */}
                <Page number={2}>
                    <div key={selectedEntryId || `new-${newEntryKey}`} className="h-full flex flex-col">
                        {/* We can add a date header or title here if not in editor */}
                        <div className="flex-1 h-full">
                            <EntryEditor
                                initialContent={selectedEntry?.content}
                                initialTitle={selectedEntry?.title}
                                entryId={selectedEntry?.id}
                                onCheckIn={handleSaveComplete}
                                onEntryCreated={handleSelectEntry}
                            />
                        </div>
                    </div>
                </Page>
            </BookContainer>
        </AppShell>
    );
}
