import { useState, useEffect, useCallback } from 'react';
import { useJournalStore } from './store';
import { RichTextEditor } from './components/tiptap/RichTextEditor';

interface EntryEditorProps {
    onCheckIn?: () => void;
    onEntryCreated?: (id: string) => void;
    initialContent?: any;
    initialTitle?: string;
    entryId?: string;
}
// ... (parsing logic remains same, skipping for brevity in replacement if possible, but I must match exact content)
// Actually, I can just replace the specific lines if I am careful.
// But the imports are at top.
// Let's replace the whole file content to be safe and clean, or just the components that failed.
// The fail was `useRef` at imports, and `currentId` at line 119.
// Convert legacy content to Tiptap JSON
const parseContent = (legacyContent: any): any => {
    if (!legacyContent) return { type: 'doc', content: [{ type: 'paragraph' }] };

    // Already Tiptap JSON
    if (typeof legacyContent === 'object' && legacyContent.type === 'doc') {
        return legacyContent;
    }

    // Try parsing if string
    let parsed = legacyContent;
    if (typeof legacyContent === 'string') {
        try {
            parsed = JSON.parse(legacyContent);
        } catch {
            // Plain text -> Paragraph
            return {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: legacyContent }]
                    }
                ]
            };
        }
    }

    // Handle Array (Legacy Block[])
    if (Array.isArray(parsed)) {
        const content = parsed.map((block: any) => {
            if (block.type === 'paragraph') {
                if (!block.content) return { type: 'paragraph' };
                return {
                    type: 'paragraph',
                    content: [{ type: 'text', text: block.content }]
                };
            }
            if (block.type === 'image') {
                return {
                    type: 'encryptedImage',
                    attrs: {
                        imageId: block.imageId,
                        caption: block.caption
                    }
                };
            }
            return null;
        }).filter(Boolean);

        return {
            type: 'doc',
            content
        };
    }

    // Fallback
    return parsed.type === 'doc' ? parsed : {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [{ type: 'text', text: typeof parsed === 'string' ? parsed : JSON.stringify(parsed) }]
            }
        ]
    };
};

export default function EntryEditor({
    onCheckIn,
    onEntryCreated,
    initialContent = '',
    initialTitle = '',
    entryId
}: EntryEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState<any>(parseContent(initialContent));
    const [isDirty, setIsDirty] = useState(false);

    // Generate a stable ID for new entries to support image uploads before save
    const [draftId] = useState(() => entryId || crypto.randomUUID());
    const [activeId, setActiveId] = useState<string | undefined>(entryId);

    const { addEntry, updateEntry, isLoading } = useJournalStore();
    const isSaving = isLoading;

    useEffect(() => {
        // When entryId prop changes (navigating between entries), update state
        if (entryId) {
            setActiveId(entryId);
        }
        setTitle(initialTitle);
        setContent(parseContent(initialContent));
        setIsDirty(false);
    }, [entryId, initialContent, initialTitle]);

    const handleSave = useCallback(async () => {
        // Basic check for empty content
        // In Tiptap, empty doc is { type: 'doc', content: [{ type: 'paragraph' }] }
        // We can just save it. 
        if (!content) return;

        // If title is empty and content is effectively empty, maybe skip?
        // But let's allow saving for now.

        try {
            if (activeId) { // Existing entry
                await updateEntry(activeId, content, title);
            } else { // New entry
                // Use draftId as the ID for the new entry
                await addEntry(content, title || 'Untitled', draftId);
                setActiveId(draftId); // Now it's active/persisted
                if (onEntryCreated) {
                    onEntryCreated(draftId);
                }
            }
            setIsDirty(false);
            if (onCheckIn) onCheckIn();
        } catch (error) {
            console.error("Auto-save failed", error);
        }
    }, [content, title, activeId, draftId, addEntry, updateEntry, onEntryCreated, onCheckIn]);

    // Auto-save
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isDirty) {
                handleSave();
            }
        }, 2000);
        return () => clearTimeout(timeout);
    }, [content, title, isDirty, handleSave]);

    // Use currentId for RichTextEditor
    // If we have activeId (saved), use it. Else use draftId.
    const effectiveEntryId = activeId || draftId;

    return (
        <div className="h-full flex flex-col group relative">
            <div className="mb-6">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setIsDirty(true);
                    }}
                    placeholder="Entry Title..."
                    className="w-full text-4xl font-serif font-bold text-stone-800 dark:text-dark-text placeholder:text-stone-300 dark:placeholder:text-stone-600 bg-transparent border-none focus:ring-0 p-0"
                />
                <div className="text-sm text-stone-400 dark:text-primary-300 mt-2 font-sans">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                <RichTextEditor
                    initialContent={content}
                    onChange={(newContent) => {
                        setContent(newContent);
                        setIsDirty(true);
                    }}
                    entryId={effectiveEntryId}
                />
            </div>

            <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-stone-300">
                    {isSaving ? 'Saving...' : isDirty ? 'Unsaved' : 'Saved'}
                </span>
            </div>
        </div>
    );
}
