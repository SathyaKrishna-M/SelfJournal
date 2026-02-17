import { useState } from 'react';
import { Plus, Settings, LogOut, Moon, Sun, Download, CloudUpload, CloudDownload, AlertTriangle, Trash2, X, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../Button';
import { useAuthStore } from '../../features/auth/store';
import { useJournalStore } from '../../features/journal/store';
import { useThemeStore } from '../../features/theme/store';
import { ExportService } from '../../features/export/exportService';

import { useBackupManager } from '../../features/drive/useBackupManager';
import { CalendarView } from '../../features/journal/components/CalendarView';

interface TopBarProps {
    onNewEntry: () => void;
    onSelectEntry?: (id: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNewEntry, onSelectEntry }) => {
    const logout = useAuthStore((state) => state.logout);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Backup Logic
    const { performBackup, restoreBackup, lastBackupDate, isBackingUp, backupNeeded } = useBackupManager();

    // Settings Logic
    const { isDarkMode, toggleTheme } = useThemeStore();
    const handleDeleteAll = async () => {
        if (confirm("⚠️ ARE YOU SURE? This will delete ALL entries permanently to reset the system.")) {
            await useJournalStore.getState().deleteAllEntries();
            alert("Journal reset successfully.");
            setIsSettingsOpen(false);
        }
    };

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-50 flex flex-col pointer-events-none">
                {/* Main Bar */}
                <div className="flex items-center justify-between px-6 py-4 w-full">
                    {/* Brand - Left */}
                    <div className="pointer-events-auto opacity-80 hover:opacity-100 transition-opacity">
                        <h1 className="font-serif text-xl text-stone-800 dark:text-dark-text font-bold tracking-tight">
                            SelfJournal
                        </h1>
                    </div>

                    {/* Actions - Right */}
                    <div className={`flex items-center gap-3 pointer-events-auto transition-all duration-300 ${!isSettingsOpen ? 'bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm p-1.5 rounded-full shadow-sm border border-white/20 dark:border-white/10' : ''}`}>
                        <Button
                            onClick={onNewEntry}
                            className="rounded-full px-4 bg-stone-800 text-stone-50 hover:bg-stone-700 dark:bg-primary-100 dark:text-stone-900 dark:hover:bg-primary-200 shadow-md transition-all hover:scale-105 active:scale-95 text-sm"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            New Entry
                        </Button>

                        <div className="w-px h-6 bg-stone-300 mx-1" />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCalendarOpen(true)}
                            className="rounded-full w-9 h-9 hover:bg-indigo-50 text-stone-600 hover:text-indigo-600 dark:text-stone-400 dark:hover:text-indigo-400"
                            title="Calendar"
                        >
                            <CalendarIcon className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className={`rounded-full w-9 h-9 hover:bg-white/50 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-transform duration-300 ${isSettingsOpen ? 'rotate-180 bg-stone-100 dark:bg-stone-800' : ''}`}
                            title="Settings"
                        >
                            {isSettingsOpen ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="rounded-full w-9 h-9 hover:bg-red-50 text-stone-500 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Expandable Settings Dropdown (Side Tab) */}
                <div className={`absolute top-full right-6 mt-4 w-full max-w-sm bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-2xl rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-all duration-300 origin-top-right ${isSettingsOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}`}>
                    <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
                        <div className="space-y-6">

                            {/* Appearance */}
                            <div>
                                <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">
                                    Appearance
                                </h3>
                                <div
                                    onClick={toggleTheme}
                                    className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition-colors group"
                                >
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-lg mr-3 transition-colors ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                        </div>
                                        <span className="text-sm font-semibold text-stone-700 dark:text-dark-text group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
                                            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                                        </span>
                                    </div>
                                    <div className={`relative w-10 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-stone-300'}`}>
                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </div>

                            {/* Cloud Backup */}
                            <div>
                                <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">
                                    Cloud Backup
                                </h3>
                                <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <div className={`p-2 rounded-lg mr-3 ${backupNeeded ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                <CloudUpload className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                                                    Google Drive
                                                </p>
                                                <p className="text-xs text-stone-500 dark:text-stone-400">
                                                    {lastBackupDate ? `Last: ${new Date(lastBackupDate).toLocaleDateString()}` : 'No backups yet'}
                                                </p>
                                            </div>
                                        </div>
                                        {backupNeeded && (
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            size="sm"
                                            onClick={performBackup}
                                            disabled={isBackingUp}
                                            className="w-full bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-700 dark:hover:bg-stone-600"
                                        >
                                            {isBackingUp ? (
                                                <span className="animate-pulse">Backing up...</span>
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-3 h-3 mr-2" />
                                                    Backup Now
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={restoreBackup}
                                            className="w-full border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                                        >
                                            <CloudDownload className="w-3 h-3 mr-2" />
                                            Restore
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Data Management */}
                            <div>
                                <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">
                                    Data Management
                                </h3>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => ExportService.generatePDF().catch(console.error)}
                                        className="w-full justify-start h-auto py-2.5 px-3 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800"
                                    >
                                        <Download className="w-4 h-4 mr-3 opacity-70" />
                                        Export to PDF
                                    </Button>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 group hover:border-red-200 dark:hover:border-red-800/50 transition-colors">
                                    <h4 className="flex items-center text-sm font-bold text-red-700 dark:text-red-400 mb-2">
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Reset Journal
                                    </h4>
                                    <p className="text-xs text-red-600/70 dark:text-red-400/60 mb-3 leading-relaxed">
                                        Permanently delete all entries. Cannot be undone.
                                    </p>
                                    <Button
                                        onClick={handleDeleteAll}
                                        size="sm"
                                        className="w-full bg-white dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-600 hover:text-white dark:hover:bg-red-800 transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                                        Delete Forever
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Modal */}
            <CalendarView
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                onSelectEntry={(id) => {
                    if (onSelectEntry) onSelectEntry(id);
                    setIsCalendarOpen(false); // Auto close on selection
                }}
            />
        </>
    );
};
