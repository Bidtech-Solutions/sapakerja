import { useEffect, useSyncExternalStore } from 'react';

import { runStartupUpdate, startupSkipReason } from './startup-update';

/**
 * checking    : memeriksa koneksi/update (splash native masih tampil)
 * downloading : ada update, UpdateScreen tampil selama unduhan
 * done        : gate selesai, aplikasi boleh jalan
 */
export type StartupPhase = 'checking' | 'downloading' | 'done';

// Satu kali per proses JS (bukan per mount): komponen yang mount ulang tidak mengulang cek.
let phase: StartupPhase | null = null;
let started = false;
const listeners = new Set<() => void>();

function currentPhase(): StartupPhase {
  if (phase === null) phase = startupSkipReason() ? 'done' : 'checking';
  return phase;
}

function setPhase(next: StartupPhase): void {
  if (phase === next) return;
  phase = next;
  listeners.forEach((listener) => listener());
}

function start(): void {
  if (started) return;
  started = true;
  if (currentPhase() === 'done') return; // dilewati (dev / Expo Go / updates nonaktif)
  runStartupUpdate({ onUpdateFound: () => setPhase('downloading') })
    .catch(() => undefined)
    .finally(() => setPhase('done'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStartupUpdate(): StartupPhase {
  const value = useSyncExternalStore(subscribe, currentPhase, currentPhase);
  useEffect(start, []);
  return value;
}

/** Hanya untuk tes. */
export function resetStartupUpdateForTests(): void {
  phase = null;
  started = false;
  listeners.clear();
}
