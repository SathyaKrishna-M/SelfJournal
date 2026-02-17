import { db, type JournalEntry } from '../../core/storage/db';
import { encryptData, decryptData } from '../../core/crypto/crypto';
import { useAuthStore } from '../auth/store';
import { TimeService } from '../../core/time/timeService';

export interface DecryptedEntry {
    id: string;
    content: any;
    createdAtUTC: number;
    updatedAtUTC: number;
    title: string;
}

export const JournalService = {
    async createEntry(content: any, title: string = 'Untitled', id?: string): Promise<string> {
        const masterKey = useAuthStore.getState().masterKey;
        if (!masterKey) throw new Error("Journal locked");

        // Serialize Tiptap JSON to string
        const contentStr = JSON.stringify(content);

        const encryptedData = await encryptData(contentStr, masterKey);
        const entryId = id || crypto.randomUUID();
        const now = await TimeService.getTrustedTimestamp();

        const entry: JournalEntry = {
            id: entryId,
            ciphertext: encryptedData.ciphertext as ArrayBuffer,
            iv: encryptedData.iv,
            createdAtUTC: now,
            updatedAtUTC: now,
            title
        };

        await db.entries.add(entry);
        return entryId;
    },

    async getEntries(): Promise<DecryptedEntry[]> {
        const masterKey = useAuthStore.getState().masterKey;
        if (!masterKey) throw new Error("Journal locked");

        const entries = await db.entries.orderBy('createdAtUTC').reverse().toArray();

        const decryptedEntries = await Promise.all(
            entries.map(async (entry) => {
                try {
                    const contentStr = await decryptData(
                        { ciphertext: entry.ciphertext as ArrayBuffer, iv: entry.iv },
                        masterKey
                    );

                    // Try parsing as JSON (Tiptap), fallback to string (Legacy)
                    let content;
                    try {
                        content = JSON.parse(contentStr);
                    } catch {
                        content = contentStr; // Legacy plain text
                    }

                    return {
                        id: entry.id,
                        content,
                        createdAtUTC: entry.createdAtUTC,
                        updatedAtUTC: entry.updatedAtUTC,
                        title: entry.title
                    };
                } catch (e) {
                    console.error(`Failed to decrypt entry ${entry.id}`, e);
                    return {
                        id: entry.id,
                        content: "Error: Could not decrypt entry",
                        createdAtUTC: entry.createdAtUTC,
                        updatedAtUTC: entry.updatedAtUTC,
                        title: entry.title
                    };
                }
            })
        );

        return decryptedEntries;
    },

    async getEntry(id: string): Promise<DecryptedEntry | null> {
        const masterKey = useAuthStore.getState().masterKey;
        if (!masterKey) throw new Error("Journal locked");

        const entry = await db.entries.get(id);
        if (!entry) return null;

        try {
            const contentStr = await decryptData(
                { ciphertext: entry.ciphertext as ArrayBuffer, iv: entry.iv },
                masterKey
            );

            let content;
            try {
                content = JSON.parse(contentStr);
            } catch {
                content = contentStr;
            }

            return {
                id: entry.id,
                content,
                createdAtUTC: entry.createdAtUTC,
                updatedAtUTC: entry.updatedAtUTC,
                title: entry.title
            };
        } catch (e) {
            console.error("Failed to decrypt entry", e);
            return null;
        }
    },

    async updateEntry(id: string, content: any, title?: string): Promise<void> {
        const masterKey = useAuthStore.getState().masterKey;
        if (!masterKey) throw new Error("Journal locked");

        const contentStr = JSON.stringify(content);
        const encryptedData = await encryptData(contentStr, masterKey);
        const now = Date.now();

        await db.entries.update(id, {
            ciphertext: encryptedData.ciphertext as ArrayBuffer,
            iv: encryptedData.iv,
            updatedAtUTC: now,
            ...(title ? { title } : {})
        });
    },

    async cleanupDuplicates(): Promise<number> {
        const entries = await this.getEntries();
        // Sort by creation time (ascending) first to detect sequence
        const sorted = [...entries].sort((a, b) => a.createdAtUTC - b.createdAtUTC);

        const toDelete: string[] = [];

        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            // Time threshold: 60 seconds (generous for typing)
            const timeDiff = next.createdAtUTC - current.createdAtUTC;
            const isCloseTime = timeDiff < 60000 && timeDiff >= 0;

            // Content check: if current is a prefix of next, it's likely a partial draft
            // Or if content is identical
            // Content check: if current is a prefix of next, it's likely a partial draft
            const currentStr = typeof current.content === 'string' ? current.content : JSON.stringify(current.content);
            const nextStr = typeof next.content === 'string' ? next.content : JSON.stringify(next.content);

            const isIdentical = currentStr === nextStr && current.title === next.title;
            const isPartial = nextStr.startsWith(currentStr) && next.title === current.title;

            // Additional check for "Untitled" entries which are common in this bug
            const isUntitled = current.title === 'Untitled' || current.title === '';

            if (isCloseTime && (isIdentical || (isUntitled && isPartial))) {
                toDelete.push(current.id);
            }
        }

        if (toDelete.length > 0) {
            await db.entries.bulkDelete(toDelete);
            // Cleanup associated images
            const imagesToDelete = await db.images.where('entryId').anyOf(toDelete).keys();
            if (imagesToDelete.length > 0) {
                await db.images.bulkDelete(imagesToDelete as any);
            }
        }

        return toDelete.length;
    },

    async deleteAllEntries(): Promise<void> {
        await db.entries.clear();
        await db.images.clear();
    }
};
