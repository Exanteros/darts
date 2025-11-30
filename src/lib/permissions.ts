// Granulare Berechtigungen für Tournament Access
export interface TournamentPermissions {
  // Dashboard & Übersicht
  dashboard: {
    view: boolean;           // Dashboard ansehen
    viewStats: boolean;      // Statistiken einsehen
  };
  
  // Spieler-Verwaltung
  players: {
    view: boolean;           // Spielerliste ansehen
    create: boolean;         // Neue Spieler hinzufügen
    edit: boolean;           // Spielerdaten bearbeiten
    delete: boolean;         // Spieler löschen
    viewStats: boolean;      // Spieler-Statistiken einsehen
  };
  
  // Spiele-Verwaltung
  games: {
    view: boolean;           // Spiele ansehen
    create: boolean;         // Neue Spiele erstellen
    start: boolean;          // Spiele starten
    edit: boolean;           // Spielstände bearbeiten
    finish: boolean;         // Spiele beenden
    assignBoards: boolean;   // Scheiben zuweisen
  };
  
  // Bracket/Turnierbaum
  bracket: {
    view: boolean;           // Turnierbaum ansehen
    edit: boolean;           // Turnierbaum bearbeiten
    advance: boolean;        // Spieler vorrücken
    resetRounds: boolean;    // Runden zurücksetzen
  };
  
  // Shootout
  shootout: {
    view: boolean;           // Shootout-Status ansehen
    manage: boolean;         // Shootout durchführen
    selectPlayer: boolean;   // Spieler auswählen
    enterScores: boolean;    // Ergebnisse eingeben
    finish: boolean;         // Shootout beenden
  };
  
  // Scheiben-Verwaltung
  boards: {
    view: boolean;           // Scheiben ansehen
    create: boolean;         // Neue Scheiben erstellen
    edit: boolean;           // Scheiben bearbeiten
    delete: boolean;         // Scheiben löschen
    setMain: boolean;        // Hauptscheibe festlegen
  };
  
  // Einstellungen
  settings: {
    viewGeneral: boolean;    // Allgemeine Einstellungen ansehen
    editGeneral: boolean;    // Allgemeine Einstellungen bearbeiten
    viewBracket: boolean;    // Bracket-Einstellungen ansehen
    editBracket: boolean;    // Bracket-Einstellungen bearbeiten
    manageLogo: boolean;     // Logo verwalten
  };
  
  // Mail-Verwaltung
  mail: {
    view: boolean;           // Mail-Templates ansehen
    send: boolean;           // Mails versenden
    editTemplates: boolean;  // Templates bearbeiten
  };
  
  // Live-Überwachung
  live: {
    view: boolean;           // Live-Ansicht nutzen
    control: boolean;        // Live-Steuerung
  };
  
  // Suche
  search: {
    use: boolean;            // Suchfunktion nutzen
  };
}

// Vordefinierte Rollen mit Standard-Permissions
export const ROLE_PERMISSIONS: Record<string, Partial<TournamentPermissions>> = {
  VIEWER: {
    dashboard: { view: true, viewStats: true },
    players: { view: true, viewStats: true, create: false, edit: false, delete: false },
    games: { view: true, create: false, start: false, edit: false, finish: false, assignBoards: false },
    bracket: { view: true, edit: false, advance: false, resetRounds: false },
    shootout: { view: true, manage: false, selectPlayer: false, enterScores: false, finish: false },
    boards: { view: true, create: false, edit: false, delete: false, setMain: false },
    settings: { viewGeneral: true, editGeneral: false, viewBracket: true, editBracket: false, manageLogo: false },
    mail: { view: true, send: false, editTemplates: false },
    live: { view: true, control: false },
    search: { use: true },
  },
  
  OPERATOR: {
    dashboard: { view: true, viewStats: true },
    players: { view: true, viewStats: true, create: true, edit: true, delete: false },
    games: { view: true, create: true, start: true, edit: true, finish: true, assignBoards: true },
    bracket: { view: true, edit: false, advance: true, resetRounds: false },
    shootout: { view: true, manage: true, selectPlayer: true, enterScores: true, finish: true },
    boards: { view: true, create: true, edit: true, delete: false, setMain: false },
    settings: { viewGeneral: true, editGeneral: false, viewBracket: true, editBracket: false, manageLogo: false },
    mail: { view: true, send: false, editTemplates: false },
    live: { view: true, control: true },
    search: { use: true },
  },
  
  MANAGER: {
    dashboard: { view: true, viewStats: true },
    players: { view: true, viewStats: true, create: true, edit: true, delete: true },
    games: { view: true, create: true, start: true, edit: true, finish: true, assignBoards: true },
    bracket: { view: true, edit: true, advance: true, resetRounds: true },
    shootout: { view: true, manage: true, selectPlayer: true, enterScores: true, finish: true },
    boards: { view: true, create: true, edit: true, delete: true, setMain: true },
    settings: { viewGeneral: true, editGeneral: true, viewBracket: true, editBracket: true, manageLogo: true },
    mail: { view: true, send: true, editTemplates: true },
    live: { view: true, control: true },
    search: { use: true },
  },
  
  ADMIN: {
    dashboard: { view: true, viewStats: true },
    players: { view: true, viewStats: true, create: true, edit: true, delete: true },
    games: { view: true, create: true, start: true, edit: true, finish: true, assignBoards: true },
    bracket: { view: true, edit: true, advance: true, resetRounds: true },
    shootout: { view: true, manage: true, selectPlayer: true, enterScores: true, finish: true },
    boards: { view: true, create: true, edit: true, delete: true, setMain: true },
    settings: { viewGeneral: true, editGeneral: true, viewBracket: true, editBracket: true, manageLogo: true },
    mail: { view: true, send: true, editTemplates: true },
    live: { view: true, control: true },
    search: { use: true },
  },
};

// Hilfsfunktion zum Zusammenführen von Permissions
export function mergePermissions(
  basePermissions: Partial<TournamentPermissions>,
  customPermissions: Partial<TournamentPermissions>
): TournamentPermissions {
  const merged: any = { ...basePermissions };
  
  for (const [category, perms] of Object.entries(customPermissions)) {
    if (merged[category]) {
      merged[category] = {
        ...merged[category],
        ...perms,
      };
    } else {
      merged[category] = perms;
    }
  }
  
  return merged as TournamentPermissions;
}

// Hilfsfunktion zum Prüfen einer spezifischen Berechtigung
export function hasPermission(
  permissions: TournamentPermissions,
  category: keyof TournamentPermissions,
  action: string
): boolean {
  const categoryPerms = permissions[category];
  if (!categoryPerms) return false;
  return (categoryPerms as any)[action] === true;
}
