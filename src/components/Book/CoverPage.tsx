import React from 'react';
import EntryList from '../../features/journal/EntryList';

interface CoverPageProps {
    onSelectEntry: (id: string) => void;
}

export const CoverPage: React.FC<CoverPageProps> = ({ onSelectEntry }) => {
    return (
        <div className="h-full flex flex-col px-4 pb-4 pt-2 md:px-8 md:pb-8 md:pt-4">
            {/* Header Section */}

            <div className="flex flex-col items-center justify-center border-b border-stone-200/60 dark:border-stone-700/60">


                <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 dark:text-dark-text tracking-tight text-center">
                    My Journal
                </h1>
                <p className="font-sans text-stone-500 dark:text-primary-300 tracking-widest uppercase text-[10px]">
                    Personal & Private
                </p>
            </div>

            {/* Content Section - Minimal List */}
            <div className="flex-1 mt-8 overflow-hidden flex flex-col">
                <h3 className="font-serif italic text-stone-400 dark:text-stone-500 text-center mb-6 text-lg">
                    Table of Contents
                </h3>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mask-gradient-bottom">
                    <EntryList onSelectEntry={onSelectEntry} />
                </div>
            </div>

            {/* Footer / Quote */}
            <div className="mt-auto pt-8 text-center opacity-60 dark:opacity-80">
                <p className="font-handwriting text-2xl text-stone-600 dark:text-primary-200">
                    "Keep some room in your heart for the unimaginable."
                </p>
            </div>
        </div>
    );
};
