export interface StatementSpan { x: number; y: number; width: number; text: string }
export interface StatementLine { page: number; line: number; text: string; y?: number; spans?: StatementSpan[] }
export type StatementBank = 'sicredi' | 'bb' | 'cresol' | 'sicoob';
export interface StatementMetadata {
  bank: StatementBank;
  bankLabel: string;
  accountKey: string;
  accountLabel: string;
  periodStart: string;
  periodEnd: string;
  openingCents: number | null;
  closingCents: number | null;
  balanceMatches: boolean | null;
  emptyStatement: boolean;
  futureCount: number;
  balanceRowCount: number;
  transactionCount: number;
  parserVersion: string;
}
export const normalizeStatementText = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export function parseBRMoney(value: string): number | null {
  const clean = value.trim().replace(/^R\$\s*/, '').replace(/\s*[DC]$/i, '').trim();
  if (!/^-?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}$/.test(clean)) return null;
  const negative = clean.startsWith('-');
  const [whole, fraction] = clean.replace('-', '').replace(/\./g, '').split(',');
  const cents = Number(whole) * 100 + Number(fraction);
  return Number.isSafeInteger(cents) ? (negative ? -cents : cents) : null;
}
export function parseBRDate(value: string): string {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [,d,m,y] = match;
  const date = new Date(Date.UTC(Number(y), Number(m)-1, Number(d)));
  return date.getUTCFullYear() === Number(y) && date.getUTCMonth() === Number(m)-1 && date.getUTCDate() === Number(d)
    ? `${y}-${m}-${d}` : '';
}
export function formatBRCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
}

export function groupStatementSpans(spans: StatementSpan[], page: number): StatementLine[] {
  const rows: Array<{ y: number; spans: StatementSpan[] }> = [];
  for (const item of [...spans].sort((a,b) => b.y-a.y || a.x-b.x)) {
    if (!item.text.trim()) continue;
    let row = rows.find(r => Math.abs(r.y-item.y)<2);
    if (!row) { row = { y:item.y, spans:[] }; rows.push(row); }
    row.spans.push(item);
  }
  return rows.map((row,i) => {
    const ordered = row.spans.sort((a,b)=>a.x-b.x);
    return { page, line:i+1, y:row.y, spans:ordered, text:ordered.map(p=>p.text).join(' ') };
  });
}
