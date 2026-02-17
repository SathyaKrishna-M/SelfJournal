import { useAuthStore } from '../../auth/store';

export const ImageEncryption = {
    async encryptImage(blob: Blob): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
        const masterKey = useAuthStore.getState().masterKey;
        if (!masterKey) throw new Error("Journal locked");

        const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM standard IV size
        const arrayBuffer = await blob.arrayBuffer();

        const ciphertext = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv as any
            },
            masterKey,
            arrayBuffer as any
        );

        return { ciphertext, iv };
    },

    async decryptImage(ciphertext: ArrayBuffer, iv: Uint8Array, type: string): Promise<Blob> {
        const masterKey = useAuthStore.getState().masterKey;
        if (!masterKey) throw new Error("Journal locked");

        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv as any
            },
            masterKey,
            ciphertext
        );

        return new Blob([decryptedBuffer], { type });
    }
};
