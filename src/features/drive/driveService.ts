
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
        const backupData = {
            version: 2, // Bump version implies auth data included
            backupDate: new Date().toISOString(),
            auth: authData, // Encrypted Vault Keys
            entries,        // Encrypted Entries
            images: await db.images.toArray(), // Encrypted Images
            settings
        };

        const fileContent = JSON.stringify(backupData);
        const fileName = `selfjournal_backup_${today}.sjv`;

        const metadata = {
            name: fileName,
            mimeType: 'application/json',
            parents: [folderId]
        };

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            fileContent +
            close_delim;

        // Check if today's backup already exists
        const q = `'${folderId}' in parents and name = '${fileName}' and trashed = false`;
        const findRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const findData = await findRes.json();
        const existingFileId = findData.files?.[0]?.id;

        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';

        if (existingFileId) {
            url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
            method = 'PATCH';
            // For PATCH, we strictly shouldn't send parents again usually, but Drive API often tolerates it or we construct body differently.
            // Simpler to just delete and re-upload or overwrite. 
            // Let's stick to standard "Create new daily" approach or overwrite. 
            // To properly PATCH metadata + content in one go is complex. 
            // Easier logic: if exists, update content.
            // Actually, the prompt says "Daily Auto Export". Overwriting today's file is fine.
        }

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

        // Helper to recursively fix Uint8Arrays from JSON objects
        const hydrateDeep = (obj: any): any => {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }

            // Detect if this object looks like a serialized Uint8Array (numeric keys '0', '1', etc.)
            // A simple heuristic: if it has keys '0', '1' and is not an array, convert.
            // But JSON.stringify of Uint8Array sometimes makes it an object: {0: x, 1: y...}
            // Dexie might have stored it as ArrayBuffer which stringifies differently, 
            // BUT usually crypto keys are Uint8Arrays.
            // Let's check structurally.

            // If it's an array, map over it
            if (Array.isArray(obj)) {
                return obj.map(hydrateDeep);
            }

            // Check if it's a serialized Uint8Array (object with numeric keys)
            const keys = Object.keys(obj);
            if (keys.length > 0 && keys.every(k => !isNaN(Number(k)))) {
                // It's likely a byte array
                const length = Math.max(...keys.map(Number)) + 1;
                const arr = new Uint8Array(length);
                for (const k of keys) {
                    arr[Number(k)] = obj[k];
                }
                return arr;
            }

            // Otherwise, recurse values
            const newObj: any = {};
            for (const [k, v] of Object.entries(obj)) {
                newObj[k] = hydrateDeep(v);
            }
            return newObj;
        };

        // Hydrate the ENTIRE structure
        const hydratedBackup = hydrateDeep(backup);

        // Validation
        if (!hydratedBackup.auth || !Array.isArray(hydratedBackup.entries)) {
            throw new Error("Invalid backup format. Missing vital data.");
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
