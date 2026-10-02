import type { ExpenseDocument, ExpenseMovement } from './despesasEngine';
import { normalizeStatementText as norm, parseBRDate, parseBRMoney, StatementBank, StatementLine, StatementMetadata } from './statementFormat';

type ParsedMovement = Pick<ExpenseMovement, 'id' | 'documentId' | 'page' | 'line' | 'raw' | 'date' | 'description' | 'beneficiary' | 'cents' | 'direction' | 'bankReference'>;
interface BankResult { movements: ParsedMovement[]; metadata: StatementMetadata; warnings: string[] }
interface LogicalRow { line: StatementLine; date: string; description: string; reference: string; tokens: string[]; raw: string }
const bankLabels: Record<StatementBank,string> = { sicredi:'Sicredi', bb:'Banco do Brasil', cresol:'Cresol', sicoob:'Sicoob' };
const MONEY = /(?:[+-]\s*)?(?:R\$\s*)?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}(?:\s*(?:\([+-]\)|[DC*]))?/gi;
const moneyTokens = (text: string) => Array.from(text.matchAll(MONEY), m => m[0].trim());
const balanceDescription = (s: string) => /^(?:saldo\b|s\s+a\s+l\s+d\s+o\b)/.test(norm(s));

function bankAmount(value: string, bank: StatementBank): number | null {
  const numeric = value.match(/(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}/)?.[0];
  const cents = numeric ? parseBRMoney(numeric) : null;
  if (cents === null || /\*/.test(value)) return null;
  const debit = /^-/.test(value) || /D\s*$/i.test(value) || /\(-\)/.test(value);
  const credit = /^\+/.test(value) || /C\s*$/i.test(value) || /\(\+\)/.test(value);
  // Sicredi's value/saldo columns encode credits as unsigned positive numbers.
  if (!debit && !credit && bank !== 'sicredi') return null;
  if (debit && credit) return null;
  return debit ? -cents : cents;
}

function detectBank(text: string): StatementBank | null {
  const s = norm(text);
  if (/sisbr|sistema de cooperativas de credito do brasil/.test(s)) return 'sicoob';
  if (/sicredi/.test(s) && /documento.*valor.*saldo/.test(s)) return 'sicredi';
  if (/extrato de conta corrente/.test(s) && /dia lote documento historico valor/.test(s)) return 'bb';
  if (/saldo em conta limite de credito saldo disponivel/.test(s) && /consulta posicao consolidada/.test(s) && /saldo do dia/.test(s)) return 'cresol';
  return null;
}

function getPeriod(text: string) {
  const s = norm(text);
  const full = s.match(/periodo(?: de|:)?\s*(\d{2}\/\d{2}\/\d{4})\s*(?:a|-)\s*(\d{2}\/\d{2}\/\d{4})/);
  if (full) return { start:parseBRDate(full[1]), end:parseBRDate(full[2]) };
  const short = s.match(/periodo:\s*(\d{2})\s*a\s*(\d{2})\/(\d{2})\/(\d{4})/);
  return short ? { start:parseBRDate(`${short[1]}/${short[3]}/${short[4]}`), end:parseBRDate(`${short[2]}/${short[3]}/${short[4]}`) } : { start:'', end:'' };
}

function getAccount(text: string, bank: StatementBank) {
  const s = norm(text);
  const branch = s.match(/(?:agencia|cooperativa|coop\.?)\s*:?\s*([\d.-]+)/)?.[1] || '';
  const account = s.match(/\bconta\s*:?\s*([\d.-]+)/)?.[1] || '';
  const key = branch && account ? `${bank}:${branch.replace(/\D/g,'')}:${account.replace(/\D/g,'')}` : '';
  return { key, label:key ? `${bankLabels[bank].toUpperCase()} / AG ${branch} / CONTA ${account}` : '' };
}

function completeDate(value: string, start: string, end: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return parseBRDate(value);
  if (!start || !end) return '';
  const candidates: string[] = [];
  for (let year=Number(start.slice(0,4));year<=Number(end.slice(0,4)) && year<=Number(start.slice(0,4))+3;year++) {
    const date = parseBRDate(`${value}/${year}`);
    if (date && date>=start && date<=end) candidates.push(date);
  }
  return candidates.length === 1 ? candidates[0] : '';
}

// BB and Cresol center dates/amounts vertically across a multi-line history cell.
// Assign history spans by the midpoint between adjacent monetary rows, never by text order.
function centeredRows(lines: StatementLine[], bank: 'bb' | 'cresol'): LogicalRow[] {
  const result: LogicalRow[] = [];
  for (const page of Array.from(new Set(lines.map(l=>l.page)))) {
    const local = lines.filter(l=>l.page===page);
    const header = local.find(l => bank==='bb' ? /dia lote documento historico valor/.test(norm(l.text)) : /^lancamentos$/.test(norm(l.text)));
    if (!header || header.y === undefined) continue;
    const spans = local.flatMap(l=>(l.spans||[]).map(s=>({...s,line:l})));
    const historyX = bank==='bb' ? header.spans?.find(s=>norm(s.text)==='historico')?.x : undefined;
    const footerY = local.find(l=>/^(total aplicacoes financeiras|\* saldos por dia)/.test(norm(l.text)))?.y ?? -Infinity;
    const dates = spans.filter(s=>/^\d{2}\/\d{2}\/\d{4}$/.test(s.text.trim()) && s.y<header.y! && s.x < (historyX || 140));
    const money = spans.filter(s=>s.y<header.y! && s.y>footerY && moneyTokens(s.text).length===1
      && (bank==='bb' ? s.x>(historyX || 260)+140 : s.x>400));
    for (let i=0;i<money.length;i++) {
      const anchor = money[i];
      const top = i ? (money[i-1].y+anchor.y)/2 : Math.min(header.y-0.01,anchor.y+22);
      const bottom = i+1<money.length ? (anchor.y+money[i+1].y)/2 : anchor.y-18;
      const date = dates.find(d=>d.y<=top && d.y>bottom);
      const isOpening = /^saldo anterior/.test(norm(anchor.line.text));
      const left = historyX || 140;
      const cells = spans.filter(s=>s.y<=top && s.y>bottom && s.x>=left && s.x<anchor.x-2 && s!==anchor);
      const description = isOpening ? 'Saldo Anterior' : bank==='cresol' && /^saldo/.test(norm(anchor.text))
        ? anchor.text.replace(MONEY,'').trim()
        : cells.map(s=>s.text).join(' ').trim();
      const reference = bank==='bb' ? spans.find(s=>s.y<=top && s.y>bottom && s.x>=140 && s.x<left)?.text || '' : '';
      const sourceLines = local.filter(l=>l.y!==undefined && l.y<=top && l.y>bottom);
      result.push({ line:date?.line || anchor.line, date:date?.text.trim() || '', description, reference,
        tokens:moneyTokens(anchor.text), raw:sourceLines.map(l=>l.text).join('\n') });
    }
  }
  return result;
}

function beneficiary(description: string, bank: StatementBank): string {
  if (bank==='sicredi') {
    return description.match(/^(?:PAGAMENTO PIX|RECEBIMENTO PIX|TED|LIQUIDACAO BOLETO(?: SICREDI)?)\s+\d{11,14}\s+(.+)$/i)?.[1]?.trim() || '';
  }
  if (bank==='cresol') return description.match(/PIX (?:CREDITO|DEBITO) (?:DE|PARA):\s*(.+)/i)?.[1]?.trim() || '';
  if (bank==='sicoob') {
    const name = description.match(/(?:Recebimento Pix|Devolução Pix)\s+(.+?)(?:\s+\d{2}\.\d{3}\.\d{3}|$)/i)?.[1];
    if (name && /[a-z]/i.test(name)) return name.trim();
    if (/COMPRA MASTERCARD MAESTRO/i.test(description)) return description.replace(/^.*?COMPRA MASTERCARD MAESTRO\s*/i,'').trim();
  }
  if (bank==='bb') {
    const name = description.match(/\d{2}\/\d{2}\s+\d{2}:\d{2}\s+(?:\d+\s+)?(.+)/)?.[1];
    if (name) return name.trim();
  }
  return '';
}

export function analyzeBankStatement(document: ExpenseDocument): BankResult | null {
  const lines = document.lines;
  const text = lines.map(l=>l.text).join('\n');
  const bank = detectBank(text);
  if (!bank) return null;
  const warnings: string[] = [];
  const period = getPeriod(text);
  const account = getAccount(text,bank);
  const metadata: StatementMetadata = { bank, bankLabel:bankLabels[bank], accountKey:account.key, accountLabel:account.label,
    periodStart:period.start, periodEnd:period.end, openingCents:null, closingCents:null, balanceMatches:null,
    emptyStatement:false, futureCount:0, balanceRowCount:0, transactionCount:0, parserVersion:'bank-layouts-v1' };
  let logical: LogicalRow[] = [];
  let tableStarted = false;
  let tableClosed = false;
  if (bank==='bb' || bank==='cresol') {
    logical = centeredRows(lines,bank);
    tableStarted = logical.length>0;
  } else {
    let last: LogicalRow | null = null;
    for (const line of lines) {
      const s = norm(line.text);
      if (/lancamentos futuros/.test(s)) { tableClosed=true; last=null; continue; }
      if (/^resumo$/.test(s)) { tableClosed=true; last=null; continue; }
      if (tableClosed) {
        if (bank==='sicredi' && /^\d{2}\/\d{2}\/\d{4}\b/.test(s)) metadata.futureCount++;
        if (bank==='sicoob' && /^(?:\(\+\) )?saldo em conta:/.test(s)) metadata.closingCents=bankAmount(moneyTokens(line.text)[0]||'',bank);
        continue;
      }
      if (/^data .*valor/.test(s)) { tableStarted=true; last=null; continue; }
      if (!tableStarted) continue;
      const dated = line.text.match(/^(\d{2}\/\d{2}(?:\/\d{4})?)\s+(.+)/);
      if (!dated && bank==='sicredi' && /^saldo anterior/.test(s)) {
        logical.push({line,date:'',description:'SALDO ANTERIOR',tokens:moneyTokens(line.text),reference:'',raw:line.text});
        continue;
      }
      if (dated) {
        const tokens = moneyTokens(dated[2]);
        let description = dated[2].replace(MONEY,'').trim();
        let reference = '';
        if (bank==='sicredi') {
          const columns = line.spans || [];
          const docHeader = lines.find(l=>l.page===line.page && /documento.*valor.*saldo/i.test(l.text)) || lines.find(l=>/documento.*valor.*saldo/i.test(l.text));
          const docX = docHeader?.spans?.find(s=>norm(s.text)==='documento')?.x;
          if (docX!==undefined) {
            reference = columns.filter(s=>s.x>=docX-2 && !moneyTokens(s.text).length).map(s=>s.text).join(' ');
            description = columns.filter(s=>s.x>columns[0].x+5 && s.x<docX-2).map(s=>s.text).join(' ');
          }
        } else {
          const header = lines.find(l=>l.page===line.page && /^data .*historico.*valor/.test(norm(l.text)));
          const historyX = header?.spans?.find(s=>norm(s.text)==='historico')?.x;
          if (historyX!==undefined) {
            const parts = line.spans || [];
            reference = parts.filter(s=>s.x>parts[0].x+30 && s.x<historyX-2).map(s=>s.text).join(' ');
            description = parts.filter(s=>s.x>=historyX-2 && !moneyTokens(s.text).length && !/^R\$$/.test(s.text.trim())).map(s=>s.text).join(' ');
          }
        }
        last={line,date:dated[1],description,reference,tokens,raw:line.text}; logical.push(last);
      } else if (last && line.page===last.line.page && line.spans?.some(s=>s.x>100) && !/^(sac|ouvidoria|pagina|historico de|data )/.test(s)) {
        last.description += ' '+line.text;
        last.raw += '\n'+line.text;
      }
    }
  }
  const movements: ParsedMovement[] = [];
  const daily = new Map<string,number>();
  let previousBalance: number | null = null;
  for (const row of logical) {
    const description = row.description.trim();
    if (balanceDescription(description)) {
      metadata.balanceRowCount++;
      if (/bloq/.test(norm(description))) continue;
      const value=bankAmount(row.tokens[0]||'',bank);
      if (value===null) { warnings.push(`Página ${row.line.page}: saldo não interpretado.`); continue; }
      if (/anterior/.test(norm(description))) { metadata.openingCents=value; previousBalance=value; }
      else if (bank==='bb' && /^s\s*a\s*l\s*d\s*o$/.test(norm(description))) {
        metadata.closingCents=value;
        if (!metadata.periodEnd) metadata.periodEnd=parseBRDate(row.date);
      } else {
        const date=completeDate(row.date,period.start,period.end);
        if (date) daily.set(date,value);
      }
      continue;
    }
    const expected = bank==='sicredi' ? 2 : 1;
    const amount = row.tokens.length===expected ? bankAmount(row.tokens[0],bank) : null;
    const date = completeDate(row.date,period.start,period.end);
    if (!date || amount===null || !description) warnings.push(`Página ${row.line.page}, linha ${row.line.line}: data, histórico ou valor ambíguo.`);
    if (date && period.start && (date<period.start || date>period.end)) warnings.push(`Página ${row.line.page}: movimento fora do período declarado.`);
    movements.push({ id:`${document.id}:${row.line.page}:${row.line.line}`,documentId:document.id,page:row.line.page,line:row.line.line,
      raw:row.raw,date,description,bankReference:row.reference,
      beneficiary:beneficiary(description,bank) || (bank==='sicoob' && /deb\.conv/.test(norm(description)) ? row.reference : ''),
      cents:Math.abs(amount||0),
      direction:amount===null?'indefinido':amount<0?'debito':'credito' });
    if (bank==='sicredi' && amount!==null) {
      const balance=bankAmount(row.tokens[1]||'',bank);
      if (balance!==null && previousBalance!==null && previousBalance+amount!==balance) warnings.push(`Página ${row.line.page}, linha ${row.line.line}: saldo sequencial divergente.`);
      previousBalance=balance;
      metadata.closingCents=balance;
    }
  }
  if (bank==='cresol') {
    metadata.closingCents = Array.from(daily.entries()).sort(([a],[b])=>b.localeCompare(a))[0]?.[1] ?? null;
  }
  metadata.transactionCount=movements.length;
  if (metadata.openingCents!==null && metadata.closingCents!==null) {
    const net=movements.reduce((s,m)=>s+(m.direction==='credito'?m.cents:-m.cents),0);
    metadata.balanceMatches=metadata.openingCents+net===metadata.closingCents && movements.every(m=>m.direction!=='indefinido');
    if (!metadata.balanceMatches) warnings.push('Saldo inicial + créditos - débitos não confere com o saldo final do arquivo.');
  }
  if (metadata.openingCents!==null) {
    let running = metadata.openingCents;
    const netByDate = new Map<string,number>();
    movements.forEach(m=>netByDate.set(m.date,(netByDate.get(m.date)||0)+(m.direction==='credito'?m.cents:-m.cents)));
    for (const [date,net] of Array.from(netByDate.entries()).sort(([a],[b])=>a.localeCompare(b))) {
      running += net;
      if (daily.has(date) && daily.get(date)!==running) warnings.push(`Saldo do dia ${date.split('-').reverse().join('/')} divergente.`);
    }
  }
  metadata.emptyStatement=tableStarted && movements.length===0 && metadata.balanceRowCount>0 && metadata.balanceMatches===true;
  if (!tableStarted) warnings.push('Tabela de movimentações não reconhecida neste layout.');
  if (!movements.length && !metadata.emptyStatement) warnings.push('Ausência de movimentos não comprovada pelos saldos do extrato.');
  if (!account.key) warnings.push('Conta e agência não identificadas no arquivo.');
  return { movements, metadata, warnings:Array.from(new Set(warnings)) };
}
