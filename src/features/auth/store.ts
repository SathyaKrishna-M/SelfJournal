import { create } from 'zustand';

interface AuthState {
    masterKey: CryptoKey | null;
    isAuthenticated: boolean;
    setMasterKey: (key: CryptoKey) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    masterKey: null,
    isAuthenticated: false,
    setMasterKey: (key) => set({ masterKey: key, isAuthenticated: true }),
    logout: () => set({ masterKey: null, isAuthenticated: false }),
}));
