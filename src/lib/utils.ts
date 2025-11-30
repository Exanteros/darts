import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Verschleiert sensible Daten für Datenschutz
 */
export function blurName(name: string): string {
  if (!name || name.length < 2) return name;

  const firstChar = name.charAt(0);
  const lastChar = name.charAt(name.length - 1);
  const middleChars = '*'.repeat(Math.max(1, name.length - 2));

  return `${firstChar}${middleChars}${lastChar}`;
}

export function blurEmail(email: string): string {
  if (!email || !email.includes('@')) return email;

  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  // Verschleiere den lokalen Teil der E-Mail
  let blurredLocal = localPart;
  if (localPart.length > 2) {
    const firstChar = localPart.charAt(0);
    const dotIndex = localPart.indexOf('.');
    if (dotIndex > 0 && dotIndex < localPart.length - 1) {
      // Behandle E-Mails wie "k.madan" -> "k.****"
      const prefix = localPart.substring(0, dotIndex + 1);
      const suffix = localPart.substring(dotIndex + 1);
      if (suffix.length > 1) {
        blurredLocal = `${prefix}${'*'.repeat(suffix.length)}`;
      }
    } else {
      // Normale E-Mail-Verschleierung
      blurredLocal = `${firstChar}${'*'.repeat(Math.max(1, localPart.length - 2))}${localPart.charAt(localPart.length - 1)}`;
    }
  }

  // Verschleiere die Domäne
  let blurredDomain = domain;
  if (domain.length > 2) {
    const [domainName, tld] = domain.split('.');
    if (domainName && tld) {
      // Verschleiere den Domain-Namen, aber behalte die TLD
      const domainFirstChar = domainName.charAt(0);
      const domainLastChar = domainName.charAt(domainName.length - 1);
      const domainMiddle = '*'.repeat(Math.max(1, domainName.length - 2));
      blurredDomain = `${domainFirstChar}${domainMiddle}${domainLastChar}.${tld}`;
    } else {
      // Fallback für Domains ohne klare TLD
      const domainFirstChar = domain.charAt(0);
      const domainLastChar = domain.charAt(domain.length - 1);
      const domainMiddle = '*'.repeat(Math.max(1, domain.length - 2));
      blurredDomain = `${domainFirstChar}${domainMiddle}${domainLastChar}`;
    }
  }

  return `${blurredLocal}@${blurredDomain}`;
}

export function blurPlayerName(playerName: string): string {
  return blurName(playerName);
}

/**
 * Verschleiert Benutzerdaten in einem Objekt
 */
export function blurUserData(user: Record<string, unknown>): Record<string, unknown> {
  if (!user) return user;

  return {
    ...user,
    name: user.name ? blurName(user.name as string) : user.name,
    email: user.email ? blurEmail(user.email as string) : user.email,
  };
}

/**
 * Verschleiert Spielerdaten in einem Objekt
 */
export function blurPlayerData(player: Record<string, unknown>): Record<string, unknown> {
  if (!player) return player;

  return {
    ...player,
    playerName: player.playerName ? blurPlayerName(player.playerName as string) : player.playerName,
    user: player.user ? blurUserData(player.user as Record<string, unknown>) : player.user,
  };
}
