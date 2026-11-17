'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Pengganti <Navigate replace /> milik React Router: pindah rute saat dirender.
export function Redirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return null;
}

export function SessionCheck() {
  return <div style={{ padding: 32, color: '#475569' }}>Memeriksa sesi…</div>;
}


