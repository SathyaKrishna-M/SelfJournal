import { db, type ImageRecord } from '../../../core/storage/db';
import { ImageEncryption } from './imageEncryption';

const MAX_WIDTH = 1600;
const QUALITY = 0.8;

export const ImageService = {
    async processImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve({ blob, width, height });
                    } else {
                        reject(new Error("Image processing failed"));
                    }
                }, 'image/webp', QUALITY);
            };
            img.onerror = (e) => reject(e);
            img.src = URL.createObjectURL(file);
        });
    },

    async saveImage(entryId: string, file: File): Promise<string> {
        // 1. Resize & Compress
        const { blob, width, height } = await this.processImage(file);

        // 2. Encrypt
        const { ciphertext, iv } = await ImageEncryption.encryptImage(blob);

        // 3. Store
        const id = crypto.randomUUID();
        const imageRecord: ImageRecord = {
            id,
            entryId,
            encryptedBlob: ciphertext,
            iv,
            mimeType: 'image/webp',
            width,
            height,
            createdAtUTC: Date.now()
        };

        await db.images.add(imageRecord);
        return id;
    },

    async getImage(id: string): Promise<string> {
        const record = await db.images.get(id);
        if (!record) throw new Error("Image not found");

        const blob = await ImageEncryption.decryptImage(
            record.encryptedBlob,
            record.iv,
            record.mimeType
        );

        return URL.createObjectURL(blob);
    },

    revokeImage(url: string) {
        URL.revokeObjectURL(url);
    },

    async deleteImage(id: string) {
        await db.images.delete(id);
    },

    async deleteImagesForEntry(entryId: string) {
        const images = await db.images.where('entryId').equals(entryId).toArray();
        if (images.length > 0) {
            await db.images.bulkDelete(images.map(img => img.id));
        }
    }
};
