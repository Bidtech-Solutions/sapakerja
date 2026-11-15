import i18n, { resolveLanguage } from '@/i18n';
import en from '@/i18n/locales/en';
import id from '@/i18n/locales/id';
import {
  formatClockInLine,
  formatDayLabel,
  formatFullDate,
  recordFromServer,
} from '@/lib/attendance-format';

function keys(obj: unknown, prefix = ''): string[] {
  if (Array.isArray(obj)) return [`${prefix}[${obj.length}]`];
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

describe('resolveLanguage', () => {
  it('Indonesia untuk id / id-ID / kode lama Android "in"', () => {
    expect(resolveLanguage('id')).toBe('id');
    expect(resolveLanguage('id-ID')).toBe('id');
    expect(resolveLanguage('in')).toBe('id');
  });

  it('selain itu (termasuk kosong) Inggris', () => {
    expect(resolveLanguage('en')).toBe('en');
    expect(resolveLanguage('fr')).toBe('en');
    expect(resolveLanguage(null)).toBe('en');
    expect(resolveLanguage(undefined)).toBe('en');
  });
});

describe('kamus', () => {
  it('en punya kunci yang sama dengan id (termasuk panjang daftar)', () => {
    expect(keys(en)).toEqual(keys(id));
  });
});

describe('format tanggal mengikuti bahasa', () => {
  const date = new Date(2026, 9, 28); // Rabu, 28 Oktober 2026

  it('Inggris', async () => {
    await i18n.changeLanguage('en');
    expect(formatDayLabel(date)).toBe('Wed, 28 Oct 2026');
    expect(formatDayLabel(date, true)).toBe('Today, Wed 28 Oct 2026');
    expect(formatFullDate(date)).toBe('Wednesday, 28 October 2026');
    expect(formatClockInLine('08.15')).toBe('Clock-in: 08.15 WIB');
  });

  it('Indonesia', async () => {
    await i18n.changeLanguage('id');
    expect(formatDayLabel(date)).toBe('Rab, 28 Okt 2026');
    expect(formatDayLabel(date, true)).toBe('Hari ini, Rab 28 Okt 2026');
    expect(formatFullDate(date)).toBe('Rabu, 28 Oktober 2026');
    expect(formatClockInLine('08.15')).toBe('Jam Masuk: 08.15 WIB');
  });

  it('jam masuk dari teks lama atau format server tetap terbaca', async () => {
    await i18n.changeLanguage('en');
    expect(formatClockInLine('Jam Masuk: 08.15 WIB')).toBe('Clock-in: 08.15 WIB');
    expect(formatClockInLine('08:15')).toBe('Clock-in: 08.15 WIB');
  });

  it('rekaman dari server menyimpan nilai netral bahasa dan tampil sesuai bahasa', async () => {
    await i18n.changeLanguage('en');
    const rec = recordFromServer({ id: 7, date: '2026-10-14', clockInTime: '08.15', isLate: true });
    expect(rec).toMatchObject({ date: '2026-10-14', clockIn: '08.15', status: 'Terlambat' });
    expect(rec.day).toBe('Wed, 14 Oct 2026');
    expect(rec.time).toBe('Clock-in: 08.15 WIB');
  });
});

describe('plural', () => {
  it('Inggris: 1 Record / 3 Records', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('history.recordCount', { count: 1 })).toBe('1 Record');
    expect(i18n.t('history.recordCount', { count: 3 })).toBe('3 Records');
  });

  it('Indonesia: tanpa bentuk jamak', async () => {
    await i18n.changeLanguage('id');
    expect(i18n.t('history.recordCount', { count: 3 })).toBe('3 Riwayat');
  });
});
