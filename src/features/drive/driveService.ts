
import { db } from '../../core/storage/db';

// Types for Google API
declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
// Scope for ensuring we only access files created by this app
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const DriveService = {
    tokenClient: null as any,
    accessToken: null as string | null,

    async init() {
        if (!CLIENT_ID) {
            console.warn('Google Client ID not set. Drive backup disabled.');
            return;
        }

        // Load GIS script
        if (!window.google) {
            await new Promise<void>((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = () => resolve();
                document.body.appendChild(script);
            });
        }

        // Initialize Token Client
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response: any) => {
                if (response.error !== undefined) {
                    throw response;
                }
                this.accessToken = response.access_token;
            },
        });
    },

    async authenticate(): Promise<string> {
        if (!this.tokenClient) await this.init();
        if (!this.tokenClient) throw new Error("Could not initialize Google Auth");

        return new Promise((resolve, reject) => {
            this.tokenClient.callback = (resp: any) => {
                if (resp.error) reject(resp);
                this.accessToken = resp.access_token;
                resolve(resp.access_token);
            };
            // Limit to just what we need: creating/reading files in our specific app folder context if possible, 
            // but drive.file scope means "files created by this app".
            this.tokenClient.requestAccessToken({ prompt: '' });
        });
    },

    async ensureAppFolder(): Promise<string> {
        // 1. Check if folder exists
        const q = "mimeType = 'application/vnd.google-apps.folder' and name = 'SelfJournal' and trashed = false";
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const data = await res.json();

        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }

        // 2. Create if not
        const metadata = {
            name: 'SelfJournal',
            mimeType: 'application/vnd.google-apps.folder'
        };

        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
        const folder = await createRes.json();
        return folder.id;
    },

    async pruneBackups(folderId: string) {
        // List all backup files in the folder
        const q = `'${folderId}' in parents and name contains 'selfjournal_backup_' and trashed = false`;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=createdTime desc`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const data = await res.json();

        if (data.files && data.files.length > 7) {
            const toDelete = data.files.slice(7); // Keep top 7
            for (const file of toDelete) {
                await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
            }
        }
    },

    async backup() {
        if (!this.accessToken) await this.authenticate();

        const folderId = await this.ensureAppFolder();

        // Gather Data
        const entries = await db.entries.toArray();
        const settings = await db.settings.toArray();
        const { AuthService } = await import('../auth/authService');
        const authData = await AuthService.getEncryptedBackupData();

        if (!authData) throw new Error("Cannot backup: No encryption keys found locally.");

        const today = new Date().toISOString().split('T')[0];

        // Helper to convert buffer to base64
        const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        };

        // Deep serializer to handle binary data
        const serializeDeep = (obj: any): any => {
            if (obj === null || obj === undefined) return obj;

            // Handle binary types
            if (obj instanceof ArrayBuffer || obj instanceof Uint8Array || (obj.buffer && obj.byteLength !== undefined)) {
                return { __type: 'bytes', data: bufferToBase64(obj) };
            }

            if (Array.isArray(obj)) {
                return obj.map(serializeDeep);
            }

            if (typeof obj === 'object') {
                const newObj: any = {};
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        newObj[key] = serializeDeep(obj[key]);
                    }
                }
                return newObj;
            }

            return obj;
        };

        const backupData = {
            version: 3, // Bump version for Base64 format
            backupDate: new Date().toISOString(),
            auth: serializeDeep(authData),
            entries: serializeDeep(entries),
            images: serializeDeep(await db.images.toArray()),
            settings: serializeDeep(settings)
        };

        const fileContent = JSON.stringify(backupData);
        const fileName = `selfjournal_backup_${today}.sjv`;

        // Define a type for metadata that makes 'parents' optional
        type DriveMetadata = {
            name: string;
            mimeType: string;
            parents?: string[];
        };

        // Initial metadata for creation (includes parents)
        const createMetadata: DriveMetadata = {
            name: fileName,
            mimeType: 'application/json',
            parents: [folderId]
        };

        // Metadata for update (must NOT include parents)
        const updateMetadata: DriveMetadata = {
            name: fileName,
            mimeType: 'application/json'
        };

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        // Check if today's backup already exists
        const q = `'${folderId}' in parents and name = '${fileName}' and trashed = false`;
        const findRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const findData = await findRes.json();
        const existingFileId = findData.files?.[0]?.id;

        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';
        let metadataToUse = createMetadata;

        if (existingFileId) {
            url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
            method = 'PATCH';
            metadataToUse = updateMetadata;
        }

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadataToUse) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            fileContent +
            close_delim;

        const res = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartRequestBody
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error('Upload failed: ' + JSON.stringify(err));
        }

        // Cleanup old
        await this.pruneBackups(folderId);

        // Save timestamp
        localStorage.setItem('last_backup', new Date().toISOString());

        return true;
    },

    async restore() {
        if (!this.accessToken) await this.authenticate();

        // 1. Find Folder
        const q = "name contains 'selfjournal_backup_' and trashed = false";
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=createdTime desc`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const data = await res.json();

        if (!data.files || data.files.length === 0) {
            alert('No backups found in Google Drive.');
            return;
        }

        const latestFile = data.files[0];

        if (!confirm(`Restore from backup: ${latestFile.name}? This will OVERWRITE local data.`)) {
            return;
        }

        const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const backup = await dlRes.json();

        // Helper to convert base64 to Uint8Array
        const base64ToUint8Array = (base64: string): Uint8Array => {
            const binary = window.atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        };

        // Helper to recursively fix Uint8Arrays
        const hydrateDeep = (obj: any): any => {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }

            // Case 1: Base64 Encoded (New Format)
            if (obj.__type === 'bytes' && typeof obj.data === 'string') {
                return base64ToUint8Array(obj.data);
            }

            // Case 2: Array
            if (Array.isArray(obj)) {
                return obj.map(hydrateDeep);
            }

            // Case 3: Legacy "Numeric Keys" Object (Old Format)
            const keys = Object.keys(obj);
            if (keys.length > 0 && keys.every(k => !isNaN(Number(k)))) {
                // Check if it looks like a byte array
                const length = Math.max(...keys.map(Number)) + 1;
                // Heuristic: If keys are dense 0..N, treat as array
                // But this might catch normal objects with numeric keys. 
                // However, in our schema, only byte arrays look like this.
                const arr = new Uint8Array(length);
                for (const k of keys) {
                    arr[Number(k)] = obj[k];
                }
                return arr;
            }

            // Case 4: Standard Object
            const newObj: any = {};
            for (const [k, v] of Object.entries(obj)) {
                newObj[k] = hydrateDeep(v);
            }
            return newObj;
        };

        // Hydrate the ENTIRE structure
        const hydratedBackup = hydrateDeep(backup);

        // Validation Helper
        const isValidBinary = (data: any) => {
            return (data instanceof ArrayBuffer || data instanceof Uint8Array) && data.byteLength > 0;
        };

        // Strict Validation: Check if critical keys exist and are binary
        if (!hydratedBackup.auth) {
            throw new Error("Invalid backup: Missing authentication data.");
        }

        const auth = hydratedBackup.auth;
        // Check Master Key (Password)
        if (!isValidBinary(auth.encryptedMasterKeyWithPassword?.ciphertext) ||
            !isValidBinary(auth.encryptedMasterKeyWithPassword?.iv)) {
            throw new Error("Backup CORRUPTED: Critical encryption keys are missing (likely from an old buggy version). Cannot restore.");
        }

        // Check Master Key (Recovery) - Optional but good to have
        if (!isValidBinary(auth.encryptedMasterKeyWithRecovery?.ciphertext) ||
            !isValidBinary(auth.encryptedMasterKeyWithRecovery?.iv)) {
            console.warn("Backup warning: Recovery key might be corrupted.");
        }

        // Logic
        const { AuthService } = await import('../auth/authService');

        // 1. Restore Auth Keys
        await AuthService.restoreFromBackupData(hydratedBackup.auth);

        // 2. Restore Entries
        await db.entries.clear();
        await db.entries.bulkAdd(hydratedBackup.entries);

        // 3. Restore Images
        if (hydratedBackup.images) {
            await db.images.clear();
            await db.images.bulkAdd(hydratedBackup.images);
        }

        // 4. Restore Settings
        if (hydratedBackup.settings) {
            await db.settings.clear();
            await db.settings.bulkAdd(hydratedBackup.settings);
        }

        alert('Restore complete! Please log in with your password to decrypt the journal.');
        window.location.reload();
    }
};
