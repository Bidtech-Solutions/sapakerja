import type { Metadata } from 'next';
import AdminProvider from '@/components/dashboard/AdminProvider';
import DashboardShell from '@/components/dashboard/DashboardShell';
import '@/styles/dashboard.css';

// Dashboard HR bersifat privat: jangan diindeks mesin pencari.
export const metadata: Metadata = {
  title: { default: 'SapaKerja • Portal HR', template: '%s • SapaKerja HR' },
  description: 'Portal administrasi HR SapaKerja.',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Dashboard HR hanya berbahasa Indonesia, apa pun bahasa situs publik: `lang="id"` pada pembungkus.
 * Seluruh CSS dashboard dibungkus di bawah `.dash` (lihat styles/dashboard.css) agar tidak bentrok dengan Tailwind situs publik.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash" lang="id">
      <AdminProvider>
        <DashboardShell>{children}</DashboardShell>
      </AdminProvider>
    </div>
  );
}
