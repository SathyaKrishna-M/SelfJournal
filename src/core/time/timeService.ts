import { db } from '../storage/db';

const TIME_RECORD_ID = 'time_integrity';

export const TimeService = {
    /**
     * Runs on app startup to detect time manipulation.
     * If the system clock has moved backwards significantly since last run,
     * we flag it (though for now we just log it and update the observed time).
     */
    async runIntegrityCheck(): Promise<void> {
        const currentSystemTime = Date.now();
        let record = await db.time.get(TIME_RECORD_ID);

        if (!record) {
            // First run ever
            record = {
                id: TIME_RECORD_ID,
                lastTrustedTimestampUTC: currentSystemTime,
                lastSystemTimeObserved: currentSystemTime,
            };
            await db.time.put(record);
            return;
        }

        if (currentSystemTime < record.lastSystemTimeObserved) {
            console.warn(
                `Time manipulation detected! System time went backwards from ${new Date(
                    record.lastSystemTimeObserved
                ).toISOString()} to ${new Date(currentSystemTime).toISOString()}`
            );
            // In a strict app, we might lock the journal or force a sync.
            // For this offline app, we just log it and rely on getTrustedTimestamp to fix ordering.
        }

        // Always update observed time to now
        await db.time.update(TIME_RECORD_ID, {
            lastSystemTimeObserved: currentSystemTime,
        });
    },

    /**
     * Returns a monotonically increasing timestamp.
     * - If system time is valid (>= lastTrusted), uses system time.
     * - If system time is backdated (< lastTrusted), uses lastTrusted + 1ms.
     * - Updates the trusted timestamp in DB.
     */
    async getTrustedTimestamp(): Promise<number> {
        const currentSystemTime = Date.now();
        let record = await db.time.get(TIME_RECORD_ID);

        let trustedTime = currentSystemTime;

        if (record) {
            if (currentSystemTime <= record.lastTrustedTimestampUTC) {
                // System time is behind or same as last trusted.
                // Force forward progress.
                trustedTime = record.lastTrustedTimestampUTC + 1;
            }
        } else {
            // Should have been initialized by runIntegrityCheck, but safe fallback
            record = {
                id: TIME_RECORD_ID,
                lastTrustedTimestampUTC: currentSystemTime,
                lastSystemTimeObserved: currentSystemTime
            };
        }

        // Persist the new high-water mark
        await db.time.put({
            id: TIME_RECORD_ID,
            lastTrustedTimestampUTC: trustedTime,
            lastSystemTimeObserved: currentSystemTime, // Update this too
        });

        return trustedTime;
    }
};
