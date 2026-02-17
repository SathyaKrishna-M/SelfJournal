import { useJournalStore } from './store';
import { format } from 'date-fns';
import { BookOpen, Calendar, ChevronRight } from 'lucide-react';

interface EntryListProps {
    onSelectEntry: (id: string) => void;
}

// Helper to extract text from Tiptap JSON or return string
const getTextPreview = (content: any): string => {
    if (typeof content === 'string') {
        return content.substring(0, 100) + (content.length > 100 ? '...' : '');
    }

    if (typeof content === 'object' && content?.type === 'doc') {
        // Tiptap JSON
        try {
            let text = '';
            // Simple DFS to get text
            const traverse = (node: any) => {
                if (node.type === 'text') {
                    text += node.text || '';
                } else if (node.content) {
                    node.content.forEach(traverse);
                    // Add space after paragraphs/blocks
                    if (['paragraph', 'heading'].includes(node.type)) {
                        text += ' ';
                    }
                }
            };
            traverse(content);
            return text.substring(0, 100) + (text.length > 100 ? '...' : '');
        } catch {
            return 'Preview unavailable';
        }
    }

    return 'No preview';
};

export default function EntryList({ onSelectEntry }: EntryListProps) {
    const { entries, isLoading, error } = useJournalStore();

    if (error) {
        return <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;
    }

    if (isLoading && entries.length === 0) {
        return <div className="p-4 text-center text-stone-400">Loading your memories...</div>;
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                <BookOpen className="w-12 h-12 mb-2 opacity-20" />
                <p>No entries yet. Start writing!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {entries.map((entry) => (
                <button
                    key={entry.id}
                    onClick={() => onSelectEntry(entry.id)}
                    className="w-full text-left bg-white dark:bg-stone-800 p-4 rounded-lg shadow-sm border border-stone-100 dark:border-stone-700 hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 transition-all group"
                >
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-serif font-bold text-stone-800 dark:text-dark-text text-lg group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                            {entry.title || 'Untitled'}
                        </h3>
                        <span className="text-xs text-stone-400 dark:text-primary-300 flex items-center bg-stone-50 dark:bg-stone-900/50 px-2 py-1 rounded">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(entry.createdAtUTC, 'MMM d, yyyy')}
                        </span>
                    </div>
                    <p className="text-stone-500 dark:text-primary-200 text-sm line-clamp-2 font-serif italic opacity-80">
                        {getTextPreview(entry.content)}
                    </p>
                    <div className="mt-2 flex justify-end">
                        <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                    </div>
                </button>
            ))}
        </div>
    );
}
