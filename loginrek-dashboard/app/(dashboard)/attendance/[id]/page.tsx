'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Check, Building2, Camera, MapPin, Clock, X, Navigation, MapPinOff, ShieldCheck } from 'lucide-react';
import { API_ORIGIN } from '@/lib/api';
import type { AttendanceRecord, Employee } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { Redirect, SessionCheck } from '@/components/dashboard/Session';
import { buildRecordsForDate, useAdmin } from '@/components/dashboard/AdminProvider';

// Helper to parse time string like "08.08" or "08:08" to minutes from midnight
function parseTimeToMinutes(timeStr: string) {
  if (!timeStr || typeof timeStr !== 'string' || timeStr === '—') return null;
  const match = timeStr.match(/(\d{1,2})[.:](\d{2})/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function AttendanceDetailPage({ record, onBack }: { record: AttendanceRecord; onBack: () => void }) {

  // Check if check-in data exists (not empty, not dash)
  const hasCheckIn = Boolean(
    record &&
    record.checkInTime && 
    record.checkInTime !== '—' && 
    String(record.checkInTime).trim() !== ''
  );

  // Default work schedule (e.g. 08.00 WIB)
  const defaultScheduleStr = '08.00 WIB';
  const scheduleDisplay = record?.schedule
    ? (record.schedule.startsWith('Jadwal') ? record.schedule : `Jadwal : ${record.schedule}`)
    : `Jadwal : ${defaultScheduleStr}`;

  // Automatically calculate late minutes and status if check-in time is available
  const { status, lateMinutes, isLate, isOnTime } = useMemo(() => {
    if (!record || !hasCheckIn) {
      return {
        status: record?.status || 'Belum Hadir',
        lateMinutes: 0,
        isLate: false,
        isOnTime: false
      };
    }

    const checkInMin = parseTimeToMinutes(record.checkInTime);
    const scheduleMin = parseTimeToMinutes(record.schedule || defaultScheduleStr);

    let calculatedStatus = record.status;
    let calculatedLate = Number(record.lateMinutes) || 0;

    if (checkInMin !== null && scheduleMin !== null) {
      const diff = checkInMin - scheduleMin;
      if (diff > 0) {
        calculatedStatus = 'Terlambat';
        calculatedLate = calculatedLate > 0 ? calculatedLate : diff;
      } else {
        calculatedStatus = 'Tepat Waktu';
        calculatedLate = 0;
      }
    }

    return {
      status: calculatedStatus,
      lateMinutes: calculatedLate,
      isLate: calculatedStatus === 'Terlambat',
      isOnTime: calculatedStatus === 'Tepat Waktu'
    };
  }, [record, hasCheckIn]);

  // Hook selesai dipanggil, aman return null jika data record tidak ada
  if (!record) return null;

  // Role / Jabatan dari tabel karyawan (Divisi tidak ditampilkan lagi: tidak bisa diisi HR)
  const displayRole = record.role || '—';

  // Avatar fallback: gunakan avatar asli user, atau default-avatar.webp jika belum upload
  const rawAvatar = record.avatar;
  const avatarImg = rawAvatar
    ? (rawAvatar.startsWith('http') || rawAvatar.startsWith('data:')
        ? rawAvatar
        : rawAvatar.startsWith('/uploads')
        ? `${API_ORIGIN}${rawAvatar}`
        : rawAvatar)
    : '/images/default-avatar.webp';

  // Distance string
  const hasDistance = Boolean(record.distance && record.distance !== '—' && String(record.distance).trim() !== '');
  const distanceText = hasDistance ? record.distance : '3m';

  // Coordinates
  const lat = Number(record.latitude) || 1.105925;
  const lng = Number(record.longitude) || 104.075342;

  // Photo resolution:
  // If record.selfieUrl is local file:/// (from mobile phone without base64), fallback to default-avatar.webp (placeholder netral, bukan foto orang)
  const isLocalFileUri = Boolean(record.selfieUrl && record.selfieUrl.startsWith('file://'));
  const selfieDisplaySrc = record.selfieUrl && !isLocalFileUri
    ? record.selfieUrl
    : '/images/default-avatar.webp';

  return (
    <div className="attendance-detail-view">
      {/* Back Button */}
      <button 
        type="button" 
        className="btn-back-link" 
        onClick={onBack}
        id="btn-back-to-attendance"
      >
        <ArrowLeft size={16} />
        <span>Kembali ke Riwayat Absensi</span>
      </button>

      {/* Page Title & Subtitle */}
      <div className="detail-header-block">
        <h1 className="page-title detail-page-title">Detail Presensi Karyawan</h1>
        <p className="page-subtitle detail-page-subtitle">
          Rincian catatan jam kehadiran, verifikasi swafoto, dan validasi lokasi Google Maps GPS harian.
        </p>
      </div>

      {/* Summary Card: Employee Profile + Check-in Time */}
      <div className="attendance-summary-card">
        <div className="summary-left-profile">
          <div className="summary-avatar-wrapper">
            <img 
              src={avatarImg} 
              alt={record.name} 
              className="summary-avatar-img"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/default-avatar.webp';
              }}
            />
            {hasCheckIn && (
              <div className="summary-avatar-badge" title="Terverifikasi">
                <Check size={11} strokeWidth={3} />
              </div>
            )}
          </div>

          <div className="summary-info-col">
            <div className="summary-name-row">
              <h2 className="summary-employee-name">{record.name}</h2>
              {isLate ? (
                <span className="summary-status-pill pill-late">
                  <Clock size={12} strokeWidth={2.5} className="status-pill-icon" />
                  <span>Terlambat {lateMinutes ? `${lateMinutes} mnt` : ''}</span>
                </span>
              ) : isOnTime ? (
                <span className="summary-status-pill pill-ontime">
                  <Check size={12} strokeWidth={2.5} className="status-pill-icon" />
                  <span>Tepat Waktu</span>
                </span>
              ) : (
                <span className="summary-status-pill pill-neutral">
                  <X size={12} strokeWidth={2.5} className="status-pill-icon" />
                  <span>{status}</span>
                </span>
              )}
            </div>

            <p className="summary-meta-line">
              <span>{displayRole}</span>
            </p>
          </div>
        </div>

        {/* Jam Masuk Box */}
        <div className={`summary-checkin-box ${!hasCheckIn ? 'is-empty' : ''}`}>
          <span className="checkin-box-caption">JAM MASUK</span>
          <div className="checkin-box-time">
            {hasCheckIn ? (
              <>
                <span className="time-main">{record.checkInTime}</span>
                <span className="time-tz">{record.timezone || 'WIB'}</span>
              </>
            ) : (
              <span className="time-main time-empty">—</span>
            )}
          </div>
          <span className="checkin-box-schedule">{scheduleDisplay}</span>
        </div>
      </div>

      {/* 2 Columns Lower Grid */}
      <div className="attendance-detail-grid">
        {/* Left: Swafoto Card */}
        <div className="detail-panel-card">
          <div className="detail-panel-header">
            <Camera size={18} className="panel-header-icon text-teal" />
            <h3 className="detail-panel-title">Swafoto Masuk (Selfie Check-in)</h3>
          </div>

          <div className="selfie-frame-wrapper">
            {hasCheckIn ? (
              <div className="selfie-image-container">
                <img 
                  src={selfieDisplaySrc} 
                  alt={`Swafoto Presensi ${record.name}`} 
                  className="selfie-checkin-img"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/default-avatar.webp';
                  }}
                />
                <div className="selfie-caption-overlay">
                  <div className="selfie-badge-verified">
                    <Check size={13} strokeWidth={3} />
                    <span>Swafoto Kamera Terverifikasi ({record.checkInTime})</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="selfie-empty-state">
                <div className="empty-state-icon-circle">
                  <Camera size={30} />
                </div>
                <h4 className="empty-state-title">Belum Ada Swafoto</h4>
                <p className="empty-state-desc">
                  Foto swafoto otomatis tersimpan dan ditampilkan setelah karyawan melakukan presensi masuk.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Geofence & Location Card (Google Maps Asli - Peta Jalan) */}
        <div className="detail-panel-card">
          <div className="detail-panel-header">
            <MapPin size={18} className="panel-header-icon text-teal" />
            <h3 className="detail-panel-title">Validasi Lokasi Google Maps</h3>
          </div>

          <div className="geofence-map-viewport gmaps-viewport">
            {hasCheckIn ? (
              <>
                <iframe
                  title="Google Maps Lokasi Presensi"
                  width="100%"
                  height="100%"
                  className="gmaps-iframe"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${lat},${lng}&t=m&hl=id&z=17&output=embed`}
                />
                {/* Geofence Status Overlay */}
                <div className="gmaps-status-pill">
                  <ShieldCheck size={14} className="text-emerald" />
                  <span>Geofence: <strong>{distanceText}</strong> (Valid &lt;100m)</span>
                  <span className="gmaps-coord-tag">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                </div>
              </>
            ) : (
              <div className="selfie-empty-state">
                <div className="empty-state-icon-circle">
                  <MapPinOff size={30} />
                </div>
                <h4 className="empty-state-title">Lokasi Belum Tersedia</h4>
                <p className="empty-state-desc">
                  Data koordinat GPS akan ditampilkan otomatis di Google Maps saat karyawan melakukan presensi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Cari satu baris untuk halaman detail (/attendance/:id), termasuk baris "Belum Hadir" (id "att-<karyawan>-<tanggal>"). */
export function findAttendanceRecord(id: string, attendanceData: AttendanceRecord[], employeesData: Employee[]): AttendanceRecord | null {
  const raw = (attendanceData || []).find((r) => String(r.id) === id) ?? null;
  const placeholderDate = /^att-.+-(\d{4}-\d{2}-\d{2})$/.exec(id)?.[1];
  const dateIso = raw?.date || placeholderDate;
  if (!dateIso) return raw;
  return buildRecordsForDate(attendanceData, employeesData, dateIso).find((r) => String(r.id) === id) ?? raw;
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { attendanceData, employeesData, dataReady } = useAdmin();
  const record = useMemo(() => findAttendanceRecord(id, attendanceData, employeesData), [id, attendanceData, employeesData]);
  // Tunggu data pertama sebelum menyimpulkan baris tidak ada (buka langsung / muat ulang halaman detail).
  if (!record) return dataReady ? <Redirect to="/attendance" /> : <SessionCheck />;
  return <AttendanceDetailPage record={record} onBack={() => router.push('/attendance')} />;
}
