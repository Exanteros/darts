import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';
const IV_LENGTH = 16;

// Verwende NEXTAUTH_SECRET oder einen Fallback für die Verschlüsselung
// In Production sollte unbedingt eine starke, persistente Variable gesetzt sein!
const SECRET_KEY = process.env.DATA_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-insecure-secret-key-change-me';

// Stelle sicher, dass der Key 32 Bytes lang ist
const getKey = () => {
  return crypto.createHash('sha256').update(String(SECRET_KEY)).digest();
};

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);
  
  return `${iv.toString(ENCODING)}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!text) return text;
  
  const parts = text.split(':');
  if (parts.length !== 2) return text; // Nicht verschlüsselt oder falsches Format
  
  const iv = Buffer.from(parts[0], ENCODING);
  const encryptedText = parts[1];
  
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encryptedText, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return text; // Fallback: Originaltext zurückgeben (falls nicht verschlüsselt war)
  }
}
