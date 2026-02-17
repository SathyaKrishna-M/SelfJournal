import { db, type AuthRecord } from '../../core/storage/db';
import {
    generateMasterKey,
    deriveKey,
    encryptMasterKey,
    decryptMasterKey,
    generateRandomBytes,
    SALT_LENGTH,
    DERIVATION_ITERATIONS
} from '../../core/crypto/crypto';
import { useAuthStore } from './store';

export const AuthService = {
    async isSetup(): Promise<boolean> {
        const count = await db.auth.count();
        return count > 0;
    },

    async setup(password: string): Promise<string> {
        // 1. Generate Master Key
        const masterKey = await generateMasterKey();

        // 2. Generate Salts
        const passwordSalt = generateRandomBytes(SALT_LENGTH);
        const recoverySalt = generateRandomBytes(SALT_LENGTH);

        // 3. Derive Password Key
        const passwordKey = await deriveKey(password, passwordSalt);

        // 4. Generate Recovery Key (formatted XXXX-XXXX-XXXX-XXXX)
        // We'll generate 16 random bytes and encode as hex string with dashes
        const recoveryBytes = generateRandomBytes(16);
        const recoveryKeyHex = Array.from(recoveryBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        const recoveryKeyDisplay = recoveryKeyHex.match(/.{1,4}/g)?.join('-') || '';

        // 5. Derive Recovery Key
        const recoveryKey = await deriveKey(recoveryKeyDisplay, recoverySalt);

        // 6. Encrypt Master Key with both
        const encryptedWithPassword = await encryptMasterKey(masterKey, passwordKey);
        const encryptedWithRecovery = await encryptMasterKey(masterKey, recoveryKey);

        // 7. Store in DB
        const authRecord: AuthRecord = {
            id: 'master',
            encryptedMasterKeyWithPassword: encryptedWithPassword,
            encryptedMasterKeyWithRecovery: encryptedWithRecovery,
            passwordSalt,
            recoverySalt,
            iterationCount: DERIVATION_ITERATIONS
        };

        await db.auth.put(authRecord);

        // 8. Set in store (memory)
        useAuthStore.getState().setMasterKey(masterKey);

        return recoveryKeyDisplay;
    },

    async login(password: string): Promise<boolean> {
        const record = await db.auth.get('master');
        if (!record) return false;

        try {
            // Derive key
            const passwordKey = await deriveKey(password, record.passwordSalt);

            // Attempt Decryption
            const masterKey = await decryptMasterKey(
                record.encryptedMasterKeyWithPassword,
                passwordKey
            );

            // If successful (no error thrown), set to store
            useAuthStore.getState().setMasterKey(masterKey);
            return true;
        } catch (e) {
            console.error("Login failed", e);
            return false;
        }
    },

    async recover(recoveryKeyInput: string, newPassword: string): Promise<boolean> {
        const record = await db.auth.get('master');
        if (!record) return false;

        try {
            // Normalize input (remove dashes, uppercase/lowercase handling if needed? Standard says exactly as formatted usually)
            // But derivation uses the string. Let's assume input matches the display format.

            const recoveryKey = await deriveKey(recoveryKeyInput, record.recoverySalt);

            // Decrypt Master Key
            const masterKey = await decryptMasterKey(
                record.encryptedMasterKeyWithRecovery,
                recoveryKey
            );

            // Now re-encrypt with new password
            const passwordSalt = generateRandomBytes(SALT_LENGTH);
            const passwordKey = await deriveKey(newPassword, passwordSalt);
            const encryptedWithPassword = await encryptMasterKey(masterKey, passwordKey);

            // Update DB
            await db.auth.update('master', {
                encryptedMasterKeyWithPassword: encryptedWithPassword,
                passwordSalt: passwordSalt
            });

            useAuthStore.getState().setMasterKey(masterKey);
            return true;

        } catch (e) {
            console.error("Recovery failed", e);
            return false;
        }
    },

    // BACKUP SUPPORT: Export encrypted keys without exposing master key
    async getEncryptedBackupData(): Promise<AuthRecord | null> {
        return await db.auth.get('master') || null;
    },

    // RESTORE SUPPORT: Overwrite local keys
    async restoreFromBackupData(data: AuthRecord): Promise<void> {
        await db.auth.clear();
        await db.auth.put(data);
        // Note: usage requires re-login to derive master key and set in store
        useAuthStore.getState().logout();
    }
};
