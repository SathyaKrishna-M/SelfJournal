import { useState, useEffect, useCallback } from 'react';
import { DriveService } from './driveService';
import { useAuthStore } from '../auth/store';

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours

export const useBackupManager = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
    const [backupNeeded, setBackupNeeded] = useState(false);

    // Load initial state
    useEffect(() => {
        const storedDate = localStorage.getItem('last_backup');
        setLastBackupDate(storedDate);

        if (isAuthenticated) {
            checkBackupStatus(storedDate);
        }
    }, [isAuthenticated]);

    const checkBackupStatus = (dateDesc: string | null) => {
        if (!dateDesc) {
            setBackupNeeded(true);
            return;
        }
        const last = new Date(dateDesc).getTime();
        const now = new Date().getTime();
        if (now - last > BACKUP_INTERVAL_MS) {
            setBackupNeeded(true);
            // Attempt auto-backup if we think we might have a token (heuristic)
            // But usually we need a user gesture for the first time or if token expired.
            // We can try calling backup() which handles auth. 
            // If it triggers a popup, it might be blocked if not user-initiated.
            // So for now, we just mark as needed. 
            // Enhancement: Try silent auth?
        } else {
            setBackupNeeded(false);
        }
    };

    const performBackup = useCallback(async () => {
        setIsBackingUp(true);
        try {
            await DriveService.backup();
            const now = new Date().toISOString();
            localStorage.setItem('last_backup', now);
            setLastBackupDate(now);
            setBackupNeeded(false);
        } catch (error) {
            console.error("Backup failed:", error);
            alert("Backup failed. See console for details.");
        } finally {
            setIsBackingUp(false);
        }
    }, []);

    const restoreBackup = useCallback(async () => {
        try {
            await DriveService.restore();
        } catch (error) {
            console.error("Restore failed:", error);
            alert("Restore failed. See console for details.");
        }
    }, []);

    return {
        isBackingUp,
        lastBackupDate,
        backupNeeded,
        performBackup,
        restoreBackup
    };
};
