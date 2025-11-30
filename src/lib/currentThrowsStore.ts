// Global singleton for current throws storage
// This ensures the Map is shared across all API routes

type CurrentThrowData = {
  darts: number[];
  player: 1 | 2;
  score: number;
  timestamp: number;
};

class CurrentThrowsStore {
  private static instance: CurrentThrowsStore;
  private throws: Map<string, CurrentThrowData>;

  private constructor() {
    this.throws = new Map();
    
    // Clean up old entries every 10 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [gameId, data] of this.throws.entries()) {
        if (now - data.timestamp > 30000) {
          this.throws.delete(gameId);
        }
      }
    }, 10000);
  }

  public static getInstance(): CurrentThrowsStore {
    if (!CurrentThrowsStore.instance) {
      CurrentThrowsStore.instance = new CurrentThrowsStore();
    }
    return CurrentThrowsStore.instance;
  }

  public set(gameId: string, data: CurrentThrowData): void {
    this.throws.set(gameId, data);
  }

  public get(gameId: string): CurrentThrowData | null {
    return this.throws.get(gameId) || null;
  }

  public delete(gameId: string): void {
    this.throws.delete(gameId);
  }
}

export const currentThrowsStore = CurrentThrowsStore.getInstance();
