import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

interface PageProps {
    children: React.ReactNode;
    className?: string;
    number?: number;
}

const Page = forwardRef<HTMLDivElement, PageProps>(({ children, className }, ref) => {
    return (
        <div ref={ref} className={cn("p-8 md:px-16 md:py-12 h-full text-stone-800 dark:text-dark-text transition-colors duration-500", className)}>
            <div className="max-w-prose mx-auto h-full relative">
                {children}
            </div>
        </div>
    );
});

Page.displayName = 'Page';
export default Page;
