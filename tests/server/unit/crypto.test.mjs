import {test, expect} from 'vitest';
import {encryptionKey, fields} from '../../support/fixtures.mjs';
import {encrypt, decrypt} from '../../../src/server/services/crypto.ts';

test('crypto: all supported fields round-trip as ArrayBuffer and D1 byte arrays', async () => {
    const encrypted = await encrypt(fields, encryptionKey);
    expect(encrypted instanceof ArrayBuffer).toBeTruthy();
    expect(await decrypt(encrypted, encryptionKey)).toEqual(fields);
    expect(await decrypt(Array.from(new Uint8Array(encrypted)), encryptionKey)).toEqual(fields);
    expect(Buffer.from(encrypted).subarray(0, 4).toString()).toBe('PDB1');
    expect(Buffer.from(encrypted).includes(Buffer.from('alice@example.com'))).toBe(false);
});

test('crypto: repeated encryption uses different IVs and ciphertexts', async () => {
    const first = Buffer.from(await encrypt(fields, encryptionKey));
    const second = Buffer.from(await encrypt(fields, encryptionKey));
    expect(first.subarray(4, 16)).not.toEqual(second.subarray(4, 16));
    expect(first).not.toEqual(second);
});

test('crypto: null storage and encrypted empty field arrays decode as empty arrays', async () => {
    expect(await decrypt(null, encryptionKey)).toEqual([]);
    expect(await decrypt(await encrypt([], encryptionKey), encryptionKey)).toEqual([]);
});

for (const secret of ['', 'not-base64', Buffer.alloc(16).toString('base64'), Buffer.alloc(33).toString('base64')]) {
    test(`crypto: rejects invalid key ${JSON.stringify(secret)}`, async () => {
        await expect(encrypt(fields, secret)).rejects.toThrow(/32-byte key/);
        const encrypted = await encrypt(fields, encryptionKey);
        await expect(decrypt(encrypted, secret)).rejects.toThrow(/32-byte key/);
    });
}

test('crypto: rejects unsupported, truncated, tampered, and wrong-key ciphertext', async () => {
    await expect(decrypt(new ArrayBuffer(0), encryptionKey)).rejects.toThrow(/Unsupported encrypted data/);
    const blob = new Uint8Array(await encrypt(fields, encryptionKey));
    const wrongVersion = blob.slice();
    wrongVersion[0] ^= 1;
    await expect(decrypt(wrongVersion.buffer, encryptionKey)).rejects.toThrow(/Unsupported encrypted data/);
    await expect(decrypt(blob.slice(0, 20).buffer, encryptionKey)).rejects.toThrow(/Unsupported encrypted data/);
    for (const offset of [4, 16, blob.length - 1]) {
        const tampered = blob.slice();
        tampered[offset] ^= 1;
        await expect(decrypt(tampered.buffer, encryptionKey)).rejects.toThrow();
    }
    await expect(decrypt(blob.buffer, Buffer.alloc(32, 9).toString('base64'))).rejects.toThrow();
});

test('crypto: decrypted payloads are checked against the field schema', async () => {
    const key = await crypto.subtle.importKey('raw', Buffer.from(encryptionKey, 'base64'), 'AES-GCM', false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const magic = new TextEncoder().encode('PDB1');
    const ciphertext = await crypto.subtle.encrypt({name: 'AES-GCM', iv, additionalData: magic}, key,
        new TextEncoder().encode(JSON.stringify([{name: 'Invalid boolean', type: 'boolean', value: 'yes'}])));
    const envelope = new Uint8Array(16 + ciphertext.byteLength);
    envelope.set(magic); envelope.set(iv, 4); envelope.set(new Uint8Array(ciphertext), 16);
    await expect(decrypt(envelope.buffer, encryptionKey)).rejects.toMatchObject({name: 'ZodError'});
});
