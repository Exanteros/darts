import crypto from 'crypto';

/**
 * Generiert einen sicheren Board-Access-Code
 * Länge: 12 Zeichen (alphanumerisch)
 * Entropie: ~71 Bits (ausreichend gegen Brute-Force)
 */
export function generateSecureBoardCode(): string {
  // Verwende crypto.randomBytes für kryptografisch sichere Zufallszahlen
  const bytes = crypto.randomBytes(9); // 9 bytes = 72 bits
  
  // Konvertiere zu Base62 (A-Z, a-z, 0-9)
  const base62Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  
  for (let i = 0; i < 12; i++) {
    const randomIndex = bytes[i % bytes.length] % base62Chars.length;
    code += base62Chars[randomIndex];
  }
  
  return code;
}

/**
 * Generiert einen kurzen, aber dennoch sicheren Code (für Display-Zwecke)
 * Länge: 8 Zeichen (nur Großbuchstaben und Zahlen)
 * Entropie: ~41 Bits
 */
export function generateDisplayCode(): string {
  const bytes = crypto.randomBytes(6);
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 (ohne 0,1,O,I zur Vermeidung von Verwechslungen)
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    const randomIndex = bytes[i % bytes.length] % base32Chars.length;
    code += base32Chars[randomIndex];
  }
  
  return code;
}

/**
 * Validiert ob ein Board-Code das erwartete Format hat
 */
export function isValidBoardCodeFormat(code: string): boolean {
  // Min. 6 Zeichen, max. 32 Zeichen, nur alphanumerisch
  return /^[A-Za-z0-9]{6,32}$/.test(code);
}
