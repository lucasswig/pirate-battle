export interface MatchEndPayload {
  reason: 'TIME_EXPIRED' | 'PLAYER_DEFEATED';
  score: number;
  durationPlayedSeconds: number;
}

export type GameEventCallback<T> = (data: T) => void;

export class GameEventEmitter {
  private listeners: Map<string, Set<GameEventCallback<unknown>>> = new Map();

  public on<T>(event: string, callback: GameEventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback as GameEventCallback<unknown>);

    return () => {
      set.delete(callback as GameEventCallback<unknown>);
    };
  }

  public emit<T>(event: string, data: T): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    for (const cb of callbacks) {
      cb(data);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
