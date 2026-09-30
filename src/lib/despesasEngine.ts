export type Direction = 'debito' | 'credito' | 'indefinido';
export type Decision = 'incluir' | 'excluir' | 'revisar' | 'estorno';
export interface ExpenseMovement {
  id: string; documentId: string; page: number; line: number; raw: string;
  date: string; description: string; beneficiary: string; cents: number;
  direction: Direction; decision: Decision; reason: string; refundOf: string;
  reviewed: boolean; duplicateHint?: boolean;
}
export interface ExpenseDocument {
  id: string; hash: string; name: string; path: string;
  lines: Array<{ page: number; line: number; text: string }>;
  warnings: string[]; verified: boolean;
}
export interface ExpenseDraft {
  title: string; account: string; documents: ExpenseDocument[];
  movements: ExpenseMovement[]; opening: string; closing: string;
  periodStart: string; periodEnd: string;
  importFailures?: string[];
  excludedFiles?: string[];
}

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
const normalized = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
function suggestDecision(description: string, direction: Direction): { decision: Decision; reason: string } {
  const text = normalized(description);
  if (/agendad|lancamento futuro|a processar/.test(text)) return { decision: 'excluir', reason: 'Agendamento: confirmar que não houve débito efetivo' };
  if (/estorno|devolu|reembolso/.test(text)) return { decision: 'revisar', reason: 'Devolução ou estorno: identificar movimento de origem' };
  if (direction === 'credito') return { decision: 'excluir', reason: 'Entrada: não é despesa' };
  if (/mesma titularidade|entre contas proprias|aplicacao financeira/.test(text)) return { decision: 'excluir', reason: 'Possível movimentação patrimonial: confirmar titularidade ou aplicação' };
  if (/saque/.test(text)) return { decision: 'revisar', reason: 'Saque: destino do dinheiro não identificado pelo extrato' };
  if (direction === 'debito' && /pagamento|tarifa|juros|compra|debito automatico/.test(text)) {
    return { decision: 'incluir', reason: /fatura/.test(text) ? 'Pagamento de fatura; sem detalhar compras novamente' : 'Débito identificado; conferir despesa e beneficiário' };
  }
  return { decision: 'revisar', reason: 'Confirmar natureza, destinatário e débito/crédito' };
}
export function movementSignature(m: ExpenseMovement): string {
  return [m.date, m.direction, m.cents, normalized(m.description)].join('|');
}

// Unknown layouts remain reviewable. Multiple monetary columns are never guessed.
export function parseStatementLines(document: ExpenseDocument): ExpenseMovement[] {
  const result: ExpenseMovement[] = [];
  for (const line of document.lines) {
    const raw = line.text.trim();
    const dateMatch = raw.match(/^(\d{2}\/\d{2}\/\d{4})\b/);
    if (!dateMatch) continue;
    const description = raw.slice(dateMatch[0].length).trim();
    if (/^(saldo|total|subtotal)\b/i.test(normalized(description))) continue;
    const tokens = Array.from(description.matchAll(/-?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}(?:\s*[DC]\b)?/gi));
    const amount = tokens.length === 1 ? parseBRMoney(tokens[0][0]) : null;
    const token = tokens[0]?.[0] || '';
    const direction: Direction = /D$/i.test(token) || token.startsWith('-') ? 'debito' : /C$/i.test(token) ? 'credito' : 'indefinido';
    const text = tokens.length === 1 ? description.replace(token, '').trim() : description;
    const reviewReason = amount === null ? 'Valor ambíguo ou ausente' : direction === 'indefinido' ? 'Confirmar débito ou crédito' : 'Conferir leitura e classificação';
    const suggestion = amount === null || direction === 'indefinido'
      ? { decision: 'revisar' as Decision, reason: reviewReason } : suggestDecision(text, direction);
    result.push({
      id: `${document.id}:${line.page}:${line.line}`, documentId: document.id,
      page: line.page, line: line.line, raw, date: parseBRDate(dateMatch[0]),
      description: text, beneficiary: '', cents: Math.abs(amount || 0), direction,
      ...suggestion,
      refundOf: '', reviewed: false,
    });
  }
  return result;
}

export function markPossibleDuplicates(rows: ExpenseMovement[], previous: ExpenseMovement[] = []): ExpenseMovement[] {
  const seen = new Set(previous.map(movementSignature));
  return rows.map(row => {
    const key = movementSignature(row);
    const suspect = seen.has(key);
    seen.add(key);
    return suspect ? { ...row, duplicateHint: true, reviewed: false, decision: 'revisar', reason: 'Possível repetição. Conferir no extrato; valores iguais podem ser pagamentos distintos.' } : row;
  });
}
export function expenseTotals(rows: ExpenseMovement[]) {
  const payments = rows.filter(m => m.reviewed && m.decision === 'incluir' && m.direction === 'debito').reduce((s,m) => s+m.cents,0);
  const refunds = rows.filter(m => m.reviewed && m.decision === 'estorno' && m.direction === 'credito').reduce((s,m) => s+m.cents,0);
  const review = rows.filter(m => m.decision === 'revisar' || !m.reviewed);
  return { payments, refunds, net: payments-refunds, reviewCents: review.reduce((s,m)=>s+m.cents,0), reviewCount: review.length };
}
export function validateExpenseDraft(draft: ExpenseDraft): string[] {
  const errors: string[] = [];
  if (draft.importFailures?.length) errors.push('Há arquivos com falha de leitura. Reimporte ou retire explicitamente da análise.');
  if (!draft.title.trim() || !draft.account.trim()) errors.push('Informe título e identificação da conta.');
  if (!draft.periodStart || !draft.periodEnd || draft.periodStart > draft.periodEnd) errors.push('Confirme o período do extrato.');
  if (!draft.documents.length || draft.documents.some(d => !d.verified || d.warnings.length > 0)) errors.push('Confira todas as páginas e confirme a leitura de cada arquivo.');
  if (!draft.movements.length) errors.push('Nenhum movimento identificado.');
  if (draft.movements.some(m => !m.reviewed || m.decision === 'revisar')) errors.push('Há movimentos aguardando revisão.');
  const ids = new Set<string>();
  for (const m of draft.movements) {
    if (ids.has(m.id)) errors.push('Movimento repetido dentro da análise.');
    ids.add(m.id);
    if (!m.reason.trim()) errors.push('Registre o motivo de cada decisão.');
    if (!m.date || !parseBRDate(m.date.split('-').reverse().join('/')) || m.date < draft.periodStart || m.date > draft.periodEnd) errors.push('Movimento com data inválida ou fora do período.');
    if (!Number.isSafeInteger(m.cents) || m.cents <= 0 || m.cents > 999999999999) errors.push('Movimento com valor inválido.');
    if (m.direction === 'indefinido') errors.push('Débito/crédito não confirmado.');
    if (m.decision === 'incluir' && m.direction !== 'debito') errors.push('Somente débitos podem ser despesas.');
    if (m.decision === 'estorno') {
      const origin = draft.movements.find(d => d.id === m.refundOf);
      if (m.direction !== 'credito' || !origin || origin.decision !== 'incluir' || origin.date > m.date) errors.push('Estorno precisa de um débito incluído anterior ou da mesma data.');
    }
  }
  for (const debit of draft.movements.filter(m => m.decision === 'incluir')) {
    const refunded = draft.movements.filter(m => m.decision === 'estorno' && m.refundOf === debit.id).reduce((s,m)=>s+m.cents,0);
    if (refunded > debit.cents) errors.push('Estornos excedem o débito de origem.');
  }
  if (draft.opening || draft.closing) {
    const opening = parseBRMoney(draft.opening), closing = parseBRMoney(draft.closing);
    if (opening === null || closing === null) errors.push('Informe ambos os saldos em formato brasileiro.');
    else {
      const balance = draft.movements.reduce((s,m) => s+(m.direction === 'credito' ? m.cents : -m.cents),opening);
      if (balance !== closing) errors.push('Saldo inicial + entradas - saídas difere do saldo final.');
    }
  }
  return Array.from(new Set(errors));
}
