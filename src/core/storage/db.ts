import Dexie, { type EntityTable } from 'dexie';

export interface AuthRecord {
    id: string; // 'master'
    encryptedMasterKeyWithPassword: { ciphertext: ArrayBuffer; iv: Uint8Array };
    encryptedMasterKeyWithRecovery: { ciphertext: ArrayBuffer; iv: Uint8Array };
    passwordSalt: Uint8Array;
    recoverySalt: Uint8Array;
    iterationCount: number;
}

export interface JournalEntry {
    id: string; // UUID
    ciphertext: ArrayBuffer;
    iv: Uint8Array;
    createdAtUTC: number; // Trusted timestamp
    updatedAtUTC: number;
    title: string; // Storing as plaintext metadata for now, to enable easier listing/search without full decryption of body
}

export interface TimeRecord {
    id: string; // 'time_integrity'
    lastTrustedTimestampUTC: number;
    lastSystemTimeObserved: number;
}

export interface SettingsRecord {
    id: string; // 'user_settings'
    reminderEnabled: boolean;
    reminderTime: string; // "HH:MM"
    lastReminderDate: string; // "YYYY-MM-DD"
    theme: 'light' | 'dark' | 'system';
    font: 'caveat' | 'indie-flower' | 'patrick-hand';
}

export interface ImageRecord {
    id: string; // UUID
    entryId: string; // FK to JournalEntry
    encryptedBlob: ArrayBuffer;
    iv: Uint8Array;
    mimeType: string;
    width: number;
    height: number;
    createdAtUTC: number;
}

const db = new Dexie('SelfJournalDB') as Dexie & {
    auth: EntityTable<AuthRecord, 'id'>;
    entries: EntityTable<JournalEntry, 'id'>;
    images: EntityTable<ImageRecord, 'id'>;
    time: EntityTable<TimeRecord, 'id'>;
    settings: EntityTable<SettingsRecord, 'id'>;
};

// Schema definition
db.version(2).stores({
    auth: 'id',
    entries: 'id, createdAtUTC, title', // Indexed fields for efficient querying
    images: 'id, entryId',
    time: 'id',
    settings: 'id'
});

export { db };
