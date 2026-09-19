import { MatchRecord } from '../api/types';

const OFFLINE_MATCHES_KEY = 'pirate_offline_matches';

export const getPendingMatches = (): MatchRecord[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_MATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const enqueueOfflineMatch = (match: MatchRecord): void => {
  try {
    const list = getPendingMatches();
    const matchId = match.matchId || match.id;
    const existingIndex = list.findIndex((m) => (m.matchId && m.matchId === matchId) || m.id === matchId);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...match, synced: false };
    } else {
      list.push({ ...match, synced: false });
    }
    localStorage.setItem(OFFLINE_MATCHES_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: list.length }));
  } catch (err) {
    console.warn('Failed to enqueue offline match', err);
  }
};

export const clearPendingMatches = (): void => {
  try {
    localStorage.removeItem(OFFLINE_MATCHES_KEY);
    window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: 0 }));
  } catch {}
};

export const markMatchesAsSynced = (ids: string[]): void => {
  try {
    const list = getPendingMatches();
    const idSet = new Set(ids);
    const remaining = list.filter((item) => !idSet.has(item.id) && (!item.matchId || !idSet.has(item.matchId)));
    localStorage.setItem(OFFLINE_MATCHES_KEY, JSON.stringify(remaining));
    window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: remaining.length }));
  } catch {}
};

