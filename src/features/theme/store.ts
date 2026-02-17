import { create } from 'zustand';

interface ThemeState {
    isDarkMode: boolean;
    toggleTheme: () => void;
    setTheme: (isDark: boolean) => void;
}

// Helper to get initial theme
const getInitialTheme = () => {
    const saved = localStorage.getItem('theme');
    if (saved) {
        return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const useThemeStore = create<ThemeState>((set) => {
    // Initialize immediately
    const initialDark = getInitialTheme();
    if (initialDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    return {
        isDarkMode: initialDark,
        toggleTheme: () => set((state) => {
            const newIsDark = !state.isDarkMode;
            if (newIsDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return { isDarkMode: newIsDark };
        }),
        setTheme: (isDark) => set(() => {
            if (isDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return { isDarkMode: isDark };
        })
    };
});
