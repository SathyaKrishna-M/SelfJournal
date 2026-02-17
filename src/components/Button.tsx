import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary: 'bg-stone-800 text-stone-50 hover:bg-stone-700 dark:bg-primary-100 dark:text-stone-900 dark:hover:bg-primary-200',
            secondary: 'bg-stone-200 text-stone-900 hover:bg-stone-300 dark:bg-stone-800 dark:text-dark-text dark:hover:bg-stone-700',
            outline: 'border border-stone-300 bg-transparent hover:bg-stone-100 text-stone-900 dark:border-stone-700 dark:text-dark-text dark:hover:bg-stone-800',
            ghost: 'bg-transparent hover:bg-stone-100 text-stone-900 dark:text-dark-text dark:hover:bg-stone-800',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-8 text-lg',
            icon: 'h-9 w-9 p-0',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 disabled:pointer-events-none disabled:opacity-50',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
