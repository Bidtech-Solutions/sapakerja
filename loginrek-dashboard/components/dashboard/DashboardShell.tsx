'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarClock, Users, Sliders, LogOut, Menu, X, LogIn } from 'lucide-react';
import { getInitials, useAdmin } from './AdminProvider';
import type { AdminData } from '@/lib/types';
import { SessionCheck } from './Session';

interface SidebarProps {
  adminData: AdminData;
  onLogout: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

function Sidebar({ adminData, onLogout, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const menuItems = [
    {
      id: 'attendance',
      to: '/attendance',
      label: 'Riwayat Absensi',
      icon: CalendarClock,
    },
    {
      id: 'employees',
      to: '/employees',
      label: 'Karyawan',
      icon: Users,
    },
    {
      id: 'settings',
      to: '/settings',
      label: 'Pengaturan',
      icon: Sliders,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="mobile-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`sidebar-container ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          {/* Top Brand Logo */}
          <div className="sidebar-brand">
            <div className="brand-logo-icon">
              <img src="/images/sapakerja-simbol-putih.svg" alt="SapaKerja" width={24} height={24} className="brand-logo-img" />
            </div>
            <div className="brand-text">
              <h1 className="brand-title">SapaKerja</h1>
              <span className="brand-badge">PORTAL ADMIN</span>
            </div>
            {isMobileOpen && (
              <button 
                className="close-mobile-btn" 
                onClick={() => setIsMobileOpen(false)}
                aria-label="Tutup Menu"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Navigation Section */}
          <div className="sidebar-menu-section">
            <div className="menu-category-label">MENU UTAMA</div>
            <nav className="sidebar-nav">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    id={`menu-${item.id}`}
                    href={item.to}
                    onClick={() => {
                      if (setIsMobileOpen) setIsMobileOpen(false);
                    }}
                    className={`nav-item ${pathname === item.to || pathname.startsWith(`${item.to}/`) ? 'active' : ''}`}
                  >
                    <Icon className="nav-item-icon" size={19} />
                    <span className="nav-item-label">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Admin Profile Card */}
          <div className="sidebar-footer">
            <div 
              className="admin-profile-card"
              onClick={() => {
                router.push('/settings');
                if (setIsMobileOpen) setIsMobileOpen(false);
              }}
              title="Buka Pengaturan Akun"
            >
              <div className="admin-avatar-circle">
                <img 
                  src={adminData?.avatar || "/images/default-avatar.webp"} 
                  alt={adminData?.name || 'Admin Piposmart'} 
                  className="avatar-img"
                  onError={(e) => { e.currentTarget.src = "/images/default-avatar.webp"; }}
                />
              </div>
              <div className="admin-info">
                <span className="admin-name">{adminData.name ? adminData.name.split(',')[0] : 'Administrator'}</span>
                <span className="admin-role">{adminData.role || 'HR Operations Lead'}</span>
              </div>
            </div>

            <button 
              id="btn-logout"
              onClick={onLogout}
              className="logout-action-btn"
            >
              <LogOut size={16} />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

interface DashboardLayoutProps {
  adminData: AdminData;
  onLogout: () => void;
  onGoToLogin: () => void;
  children: React.ReactNode;
}

function DashboardLayout({ adminData, onLogout, onGoToLogin, children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        adminData={adminData}
        onLogout={onLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Mobile Header Bar */}
        <header className="mobile-top-bar">
          <button 
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Buka menu navigasi"
          >
            <Menu size={22} />
          </button>
          <div className="mobile-brand-title">SapaKerja</div>
          <button 
            className="mobile-quick-switch"
            onClick={onGoToLogin}
            title="Ke Halaman Login"
          >
            <LogIn size={18} />
          </button>
        </header>

        {/* Halaman aktif sesuai rute */}
        <main className="dashboard-main-body">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Kerangka dashboard: halaman /login tampil apa adanya; semua halaman lain wajib login (diverifikasi ke server oleh
 * AdminProvider) dan dibungkus sidebar. Belum login -> /login?next=<halaman tujuan>.
 */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { authChecked, isAuthenticated, adminData, handleLogout, goToLogin } = useAdmin();
  const isLogin = pathname === '/login';

  useEffect(() => {
    if (!isLogin && authChecked && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLogin, authChecked, isAuthenticated, pathname, router]);

  if (isLogin) return <>{children}</>;
  if (!authChecked || !isAuthenticated) return <SessionCheck />;

  return (
    <DashboardLayout adminData={adminData} onLogout={handleLogout} onGoToLogin={goToLogin}>
      {children}
    </DashboardLayout>
  );
}
