import React, { useState, useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { useJournalStore } from '../store';
import { Button } from '../../../components/Button';

interface CalendarViewProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEntry: (entryId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ isOpen, onClose, onSelectEntry }) => {
    const { entries } = useJournalStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Filter entries for the selected date
    const selectedDateEntries = useMemo(() => {
        if (!selectedDate) return [];
        return entries.filter(entry => isSameDay(new Date(entry.createdAtUTC), selectedDate));
    }, [selectedDate, entries]);

    // Get days with entries for the current month view to show indicators
    const daysWithEntries = useMemo(() => {
        const entryDays = new Set<string>();
        entries.forEach(entry => {
            entryDays.add(format(new Date(entry.createdAtUTC), 'yyyy-MM-dd'));
        });
        return entryDays;
    }, [entries]);

    const calendarGrid = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        return eachDayOfInterval({
            start: startDate,
            end: endDate,
        });
    }, [currentMonth]);

    if (!isOpen) return null;

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-stone-200 dark:border-stone-800">

                {/* Calendar Section */}
                <div className="flex-1 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full hover:bg-stone-100 dark:hover:bg-stone-800">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date())} className="text-xs font-medium px-3 rounded-full border border-stone-200 dark:border-stone-700">
                                Today
                            </Button>
                            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full hover:bg-stone-100 dark:hover:bg-stone-800">
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-2">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr">
                        {calendarGrid.map((day) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const hasEntries = daysWithEntries.has(dateKey);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentMonth);

                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                                        relative group flex flex-col items-center justify-center p-2 rounded-xl transition-all
                                        ${!isCurrentMonth ? 'text-stone-300 dark:text-stone-700' : 'text-stone-700 dark:text-stone-300'}
                                        ${isToday(day) ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold' : ''}
                                        ${isSelected ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 shadow-lg scale-105 z-10' : 'hover:bg-stone-100 dark:hover:bg-stone-800/50'}
                                    `}
                                >
                                    <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>
                                        {format(day, 'd')}
                                    </span>

                                    {hasEntries && (
                                        <div className={`mt-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white dark:bg-stone-900' : 'bg-indigo-500'}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar Section (Day Details) */}
                <div className={`
                    w-full md:w-80 bg-stone-50 dark:bg-stone-900/50 border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 p-6 flex flex-col
                    ${selectedDate ? 'block' : 'hidden md:flex'}
                `}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">
                            {selectedDate ? format(selectedDate, 'EEEE, MMM do') : 'Select a date'}
                        </h3>
                        <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                            <X className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex rounded-full hover:bg-stone-200 dark:hover:bg-stone-700">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
                        {!selectedDate ? (
                            <div className="h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 text-center">
                                <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm">Click on a date to view entries</p>
                            </div>
                        ) : selectedDateEntries.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 text-center">
                                <FileText className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm">No entries for this day</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedDateEntries.map(entry => (
                                    <div
                                        key={entry.id}
                                        onClick={() => {
                                            onSelectEntry(entry.id);
                                            onClose();
                                        }}
                                        className="p-4 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all hover:shadow-md group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
                                                {format(new Date(entry.createdAtUTC), 'h:mm a')}
                                            </span>
                                        </div>
                                        <h4 className="font-serif font-semibold text-stone-800 dark:text-stone-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                            {entry.title || "Untitled Entry"}
                                        </h4>
                                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 line-clamp-2">
                                            {/* Strip HTML basic preview */}
                                            {typeof entry.content === 'string'
                                                ? entry.content.replace(/<[^>]*>?/gm, '').substring(0, 100)
                                                : "View content..."}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
