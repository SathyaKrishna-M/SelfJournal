import React from 'react';
import { TopBar } from './TopBar';

interface AppShellProps {
    children: React.ReactNode;
    onNewEntry: () => void;
    onSelectEntry?: (id: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, onNewEntry, onSelectEntry }) => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-warm-neutral dark:bg-dark-bg text-stone-800 dark:text-dark-text transition-colors duration-500">
            {/* Background Texture/Vignette */}
            <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-stone-200/50 to-stone-300/80" />

            {/* Top Navigation */}
            <TopBar onNewEntry={onNewEntry} onSelectEntry={onSelectEntry} />

            {/* Main Content Area - Centered for the book */}
            <main className="relative z-10 w-full h-screen flex items-center justify-center p-4 sm:p-8">
                {children}
            </main>
        </div>
    );
};
