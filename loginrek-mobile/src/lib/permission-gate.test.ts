import { classifyPermission, phaseAfterRequest } from './permission-gate';

const p = (status: string, granted: boolean, canAskAgain: boolean) => ({
  status,
  granted,
  canAskAgain,
});

describe('classifyPermission', () => {
  it('undetermined BUKAN denied (layar Pengaturan tidak boleh muncul sebelum dialog sistem)', () => {
    expect(classifyPermission(p('undetermined', false, true))).toBe('undetermined');
  });

  it('granted', () => {
    expect(classifyPermission(p('granted', true, true))).toBe('granted');
  });

  it('denied + canAskAgain -> canAsk (tombol Lanjutkan)', () => {
    expect(classifyPermission(p('denied', false, true))).toBe('canAsk');
  });

  it('denied tanpa canAskAgain -> blocked (boleh ke Pengaturan)', () => {
    expect(classifyPermission(p('denied', false, false))).toBe('blocked');
  });

  it('status tidak dikenal dianggap belum diputuskan selama OS masih boleh bertanya', () => {
    expect(classifyPermission(p('limited', false, true))).toBe('undetermined');
    expect(classifyPermission(p('limited', false, false))).toBe('blocked');
  });
});

describe('phaseAfterRequest', () => {
  it('setelah dialog, undetermined tidak mungkin lagi: jadi canAsk', () => {
    expect(phaseAfterRequest(p('undetermined', false, true))).toBe('canAsk');
  });

  it('ditolak di dialog iOS (canAskAgain=false) -> blocked', () => {
    expect(phaseAfterRequest(p('denied', false, false))).toBe('blocked');
  });

  it('diizinkan -> granted', () => {
    expect(phaseAfterRequest(p('granted', true, true))).toBe('granted');
  });
});
