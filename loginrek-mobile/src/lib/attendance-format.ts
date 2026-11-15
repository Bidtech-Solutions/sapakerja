import type { AttendanceResponse } from '@/lib/api';
import type { AttendanceRecord } from '@/lib/user-store';
import i18n from '@/i18n';

/**
 * Pemformat tanggal/jam/status presensi yang mengikuti bahasa aktif (lihat src/i18n).
 * Nilai yang disimpan (cache perangkat, respons server) bersifat netral bahasa; teks
 * tampilan disusun di sini saat dirender.
 */

function list(key: 'dayShort' | 'dayLong' | 'monthShort' | 'monthLong'): string[] {
  return i18n.t(`date.${key}`, { returnObjects: true }) as unknown as string[];
}

/** "2026-11-15" dari tanggal lokal (bukan UTC, supaya tidak bergeser dekat tengah malam WIB). */
export function toLocalISODate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Urai "YYYY-MM-DD" menjadi Date lokal; null bila bentuknya salah. */
export function parseISODate(value: string | undefined | null): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "Rab, 14 Okt 2026" / "Wed, 14 Oct 2026"; dengan `today`: "Hari ini, Rab 14 Okt 2026". */
export function formatDayLabel(date: Date, today = false): string {
  const day = list('dayShort')[date.getDay()];
  const month = list('monthShort')[date.getMonth()];
  const rest = `${date.getDate()} ${month} ${date.getFullYear()}`;
  return today ? `${i18n.t('date.today')}, ${day} ${rest}` : `${day}, ${rest}`;
}

/** "Selasa, 27 Oktober 2026" / "Tuesday, 27 October 2026". */
export function formatFullDate(date: Date): string {
  return `${list('dayLong')[date.getDay()]}, ${date.getDate()} ${list('monthLong')[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Oktober 2026" / "October 2026". */
export function formatMonthYear(date: Date): string {
  return `${list('monthLong')[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthName(monthIndex: number): string {
  return list('monthLong')[monthIndex] ?? '';
}

export function shortMonthName(monthIndex: number): string {
  return list('monthShort')[monthIndex] ?? '';
}

export function weekdayShortNames(): string[] {
  return list('dayShort');
}

/** Ambil "08.15" dari "08.15", "08:15", atau teks lama "Jam Masuk: 08.15 WIB". */
export function normalizeClockIn(raw: string): string {
  const match = /(\d{1,2})[.:](\d{2})/.exec(raw);
  return match ? `${match[1].padStart(2, '0')}.${match[2]}` : raw;
}

/** "Jam Masuk: 08.15 WIB" / "Clock-in: 08.15 WIB". */
export function formatClockInLine(raw: string): string {
  return i18n.t('date.clockIn', { time: normalizeClockIn(raw) });
}

export function statusLabel(isLate: boolean): string {
  return i18n.t(isLate ? 'common.status.late' : 'common.status.onTime');
}

/* ---- Rekaman riwayat (AttendanceRecord) --------------------------------- */

/** Teks tanggal rekaman: dari `date` bila ada, jika tidak teks lama yang tersimpan di cache. */
export function recordDayLabel(
  rec: Pick<AttendanceRecord, 'date' | 'day'>,
  now = new Date(),
): string {
  const d = parseISODate(rec.date);
  return d ? formatDayLabel(d, isSameDay(d, now)) : rec.day;
}

/** Teks jam masuk rekaman: dari `clockIn` bila ada, jika tidak teks lama di cache. */
export function recordTimeLabel(rec: Pick<AttendanceRecord, 'clockIn' | 'time'>): string {
  return rec.clockIn ? formatClockInLine(rec.clockIn) : rec.time;
}

/** Bentuk AttendanceRecord dari data presensi server. */
export function recordFromServer(
  att: Pick<AttendanceResponse, 'id' | 'date' | 'clockInTime' | 'isLate'>,
  photoUri?: string,
  now = new Date(),
): AttendanceRecord {
  const d = parseISODate(att.date);
  const rec: AttendanceRecord = {
    id: String(att.id),
    day: '',
    time: '',
    date: d ? toLocalISODate(d) : undefined,
    clockIn: normalizeClockIn(att.clockInTime),
    status: att.isLate ? 'Terlambat' : 'Tepat Waktu',
    photoUri,
  };
  rec.day = recordDayLabel(rec, now);
  rec.time = recordTimeLabel(rec);
  return rec;
}
