export const ALGORITHM_AES = 'AES-GCM';
export const ALGORITHM_PBKDF2 = 'PBKDF2';
export const DERIVATION_ITERATIONS = 500000; // High iteration count for security
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12; // 96 bits for AES-GCM
export const KEY_LENGTH = 256; // 256 bits

// --- Types ---
export interface EncryptedData {
    ciphertext: ArrayBuffer;
    iv: Uint8Array;
}

// --- Utilities ---

export const generateRandomBytes = (length: number): Uint8Array => {
    return window.crypto.getRandomValues(new Uint8Array(length));
};

export const generateMasterKey = async (): Promise<CryptoKey> => {
    return window.crypto.subtle.generateKey(
        {
            name: ALGORITHM_AES,
            length: KEY_LENGTH,
        },
        true, // extractable (needed to encrypt it)
        ['encrypt', 'decrypt']
    );
};

export const importMasterKey = async (rawKey: ArrayBuffer): Promise<CryptoKey> => {
    return window.crypto.subtle.importKey(
        "raw",
        rawKey,
        { name: ALGORITHM_AES },
        true,
        ["encrypt", "decrypt"]
    );
};

export const exportKey = async (key: CryptoKey): Promise<ArrayBuffer> => {
    return window.crypto.subtle.exportKey("raw", key);
}

// --- Key Derivation ---

export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: ALGORITHM_PBKDF2 },
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: ALGORITHM_PBKDF2,
            salt: salt as any,
            iterations: DERIVATION_ITERATIONS,
            hash: 'SHA-256',
        },
        passwordKey,
        { name: ALGORITHM_AES, length: KEY_LENGTH },
        false, // derived key is not extractable
        ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
};

// --- Encryption / Decryption of Master Key ---

export const encryptMasterKey = async (
    masterKey: CryptoKey,
    wrappingKey: CryptoKey
): Promise<EncryptedData> => {
    const iv = generateRandomBytes(IV_LENGTH);
    const rawMasterKey = await window.crypto.subtle.exportKey('raw', masterKey);

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: ALGORITHM_AES,
            iv: iv as any,
        },
        wrappingKey,
        rawMasterKey
    );

    return { ciphertext, iv };
};

export const decryptMasterKey = async (
    encryptedData: EncryptedData,
    wrappingKey: CryptoKey
): Promise<CryptoKey> => {
    const rawMasterKey = await window.crypto.subtle.decrypt(
        {
            name: ALGORITHM_AES,
            iv: encryptedData.iv as any,
        },
        wrappingKey,
        encryptedData.ciphertext
    );

    return importMasterKey(rawMasterKey);
};

// --- General Data Encryption ---

export const encryptData = async (
    data: string,
    key: CryptoKey
): Promise<EncryptedData> => {
    const enc = new TextEncoder();
    const encodedData = enc.encode(data);
    const iv = generateRandomBytes(IV_LENGTH);

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: ALGORITHM_AES,
            iv: iv as any,
        },
        key,
        encodedData
    );

    return { ciphertext, iv };
};

export const decryptData = async (
    encryptedData: EncryptedData,
    key: CryptoKey
): Promise<string> => {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: ALGORITHM_AES,
            iv: encryptedData.iv as any,
        },
        key,
        encryptedData.ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
};
