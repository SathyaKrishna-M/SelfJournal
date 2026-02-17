import { db, type SettingsRecord } from '../../core/storage/db';
import { TimeService } from '../../core/time/timeService';
import { format } from 'date-fns';

const SETTINGS_ID = 'user_settings';

export const ReminderService = {
    async init(): Promise<void> {
        // Ensure settings record exists
        const settings = await db.settings.get(SETTINGS_ID);
        if (!settings) {
            await db.settings.put({
                id: SETTINGS_ID,
                reminderEnabled: false,
                reminderTime: '20:00', // Default 8 PM
                lastReminderDate: '',
                theme: 'system',
                font: 'caveat'
            });
        }

        if ('serviceWorker' in navigator && 'Notification' in window) {
            // Check permissions on load
            if (Notification.permission === 'default') {
                // Verify user hasn't blocked it. We don't ask immediately to avoid annoyance.
            }
        }
    },

    async toggleReminder(enabled: boolean): Promise<boolean> {
        if (enabled) {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                return false;
            }
        }

        await db.settings.update(SETTINGS_ID, { reminderEnabled: enabled });
        return true;
    },

    async setReminderTime(time: string): Promise<void> {
        await db.settings.update(SETTINGS_ID, { reminderTime: time });
    },

    async getSettings(): Promise<SettingsRecord | undefined> {
        return db.settings.get(SETTINGS_ID);
    },

    /**
     * Checks if we should show a reminder.
     * This is called by the frontend when app is open (e.g. valid "smart" check).
     * For background sync, we'd need a Periodic Sync implementation in SW.
     */
    async checkAndNotify(): Promise<void> {
        if (Notification.permission !== 'granted') return;

        const settings = await db.settings.get(SETTINGS_ID);
        if (!settings || !settings.reminderEnabled) return;

        const nowTimestamp = await TimeService.getTrustedTimestamp();
        const now = new Date(nowTimestamp);
        const todayStr = format(now, 'yyyy-MM-dd');

        // 1. Check if already reminded today
        if (settings.lastReminderDate === todayStr) return;

        // 2. Check time
        const [hour, minute] = settings.reminderTime.split(':').map(Number);
        const reminderDate = new Date(now);
        reminderDate.setHours(hour, minute, 0, 0);

        if (now < reminderDate) return; // Too early

        // 3. Check if entry exists for today
        // Retrieve today's entries. 
        // We need to query range for today in UTC.
        // Simplified: Just check if any entry has a timestamp resulting in today's date in local time?
        // Or strictly UTC? Requirement says "smart daily reminder (only if no entry today)".
        // Let's use local time for "today" as that's what user perceives.

        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const entriesToday = await db.entries
            .where('createdAtUTC')
            .between(startOfDay.getTime(), endOfDay.getTime())
            .count();

        if (entriesToday > 0) return; // User already wrote

        // 4. Notify
        try {
            // Try sending via SW first (better for mobile)
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification("Time to Journal", {
                body: "You haven't written yet today. Capture your thoughts?",
                icon: '/pwa-192x192.png',
                tag: 'daily-reminder'
            });
        } catch (e) {
            // Fallback
            new Notification("Time to Journal", {
                body: "You haven't written yet today.",
                icon: '/pwa-192x192.png'
            });
        }

        // 5. Update last reminder date
        await db.settings.update(SETTINGS_ID, { lastReminderDate: todayStr });
    }
};
