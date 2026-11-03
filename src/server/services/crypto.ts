import { fieldInput, type Field } from "../../shared/types";
const encoder = new TextEncoder();
const magic = encoder.encode("PDB1");
async function keyFromSecret(secret: string) {
    if (!secret || !/^[A-Za-z0-9+/]{43}=$/.test(secret))
        throw new Error("ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
    const bytes = Uint8Array.from(atob(secret), (c) => c.charCodeAt(0));
    if (bytes.length !== 32) throw new Error("Invalid encryption key length.");
    return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [
        "encrypt",
        "decrypt",
    ]);
}
export async function encrypt(
    fields: Field[],
    secret: string,
): Promise<ArrayBuffer> {
    const key = await keyFromSecret(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: magic },
        key,
        encoder.encode(JSON.stringify(fields)),
    );
    const envelope = new Uint8Array(16 + ciphertext.byteLength);
    envelope.set(magic);
    envelope.set(iv, 4);
    envelope.set(new Uint8Array(ciphertext), 16);
    return envelope.buffer;
}
export async function decrypt(
    blob: ArrayBuffer | number[] | null,
    secret: string,
): Promise<Field[]> {
    if (blob === null) return [];
    const bytes = Array.isArray(blob)
        ? new Uint8Array(blob)
        : new Uint8Array(blob);
    if (bytes.length < 32 || !magic.every((v, i) => bytes[i] === v))
        throw new Error("Unsupported encrypted data.");
    const key = await keyFromSecret(secret);
    const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: bytes.slice(4, 16), additionalData: magic },
        key,
        bytes.slice(16),
    );
    return fieldInput
        .array()
        .parse(JSON.parse(new TextDecoder().decode(plain)));
}
