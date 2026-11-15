import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';

import {
  classifyPermission,
  phaseAfterRequest,
  type GatePhase,
  type OsPermission,
} from '@/lib/permission-gate';

type Options = {
  getPermission: () => Promise<OsPermission>;
  requestPermission: () => Promise<OsPermission>;
  /** false = tunda sama sekali (mis. izin lokasi menunggu izin kamera selesai). */
  enabled?: boolean;
};

export type PermissionGate = {
  phase: GatePhase;
  /** Memunculkan dialog izin sistem (tombol "Lanjutkan"). */
  ask: () => Promise<void>;
  /** Membuka Pengaturan aplikasi (hanya untuk fase `blocked`). */
  openSettings: () => Promise<void>;
  /** Baca ulang status izin tanpa memunculkan dialog. */
  refresh: () => Promise<void>;
};

/**
 * Alur izin sesuai pedoman Apple:
 * - belum diputuskan  -> fase `requesting` dan dialog sistem langsung diminta (satu kali),
 * - sudah diizinkan   -> `granted`,
 * - ditolak, boleh ditanya lagi -> `canAsk` (UI: tombol "Lanjutkan" -> ask()),
 * - ditolak permanen  -> `blocked` (UI: boleh mengarahkan ke Pengaturan).
 * Kembali dari Pengaturan (app aktif lagi) membaca ulang status tanpa dialog.
 */
export function usePermissionGate({
  getPermission,
  requestPermission,
  enabled = true,
}: Options): PermissionGate {
  const [phase, setPhase] = useState<GatePhase>('checking');
  const mounted = useRef(true);
  const autoRequested = useRef(false);
  const getRef = useRef(getPermission);
  const requestRef = useRef(requestPermission);

  // Selalu pakai fungsi terbaru tanpa membuat efek/callback berubah identitas.
  useEffect(() => {
    getRef.current = getPermission;
    requestRef.current = requestPermission;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const safeSet = useCallback((next: GatePhase) => {
    if (mounted.current) setPhase(next);
  }, []);

  const request = useCallback(async () => {
    safeSet('requesting');
    try {
      safeSet(phaseAfterRequest(await requestRef.current()));
    } catch {
      safeSet('canAsk');
    }
  }, [safeSet]);

  const evaluate = useCallback(
    async (allowAutoRequest: boolean) => {
      try {
        const state = classifyPermission(await getRef.current());
        if (state !== 'undetermined') {
          safeSet(state);
          return;
        }
        if (allowAutoRequest && !autoRequested.current) {
          autoRequested.current = true;
          await request();
        }
      } catch {
        safeSet('canAsk');
      }
    },
    [request, safeSet],
  );

  useEffect(() => {
    if (enabled) void evaluate(true);
  }, [enabled, evaluate]);

  // Kembali dari Pengaturan: perbarui status, tanpa memunculkan dialog.
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void evaluate(false);
    });
    return () => sub.remove();
  }, [enabled, evaluate]);

  const ask = useCallback(() => request(), [request]);
  const refresh = useCallback(() => evaluate(false), [evaluate]);
  const openSettings = useCallback(() => Linking.openSettings(), []);

  return { phase, ask, openSettings, refresh };
}
