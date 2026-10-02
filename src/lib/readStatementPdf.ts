import { ExpenseDocument } from './despesasEngine';
import { groupStatementSpans } from './statementFormat';

export async function readStatementPdf(file: File, progress: (text: string) => void): Promise<ExpenseDocument> {
  if (file.size > 20 * 1024 * 1024) throw new Error('Limite de 20 MB por PDF.');
  const buffer = await file.arrayBuffer();
  if (!new TextDecoder().decode(buffer.slice(0,5)).startsWith('%PDF-')) throw new Error('Arquivo não é um PDF válido.');
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
  const moduleUrl = '/pdfjs/pdf.mjs';
  const pdfjs: typeof import('pdfjs-dist') = await import(/* webpackIgnore: true */ moduleUrl);
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer), stopAtErrors: true });
  const document: ExpenseDocument = { id: hash, hash, name: file.name, path: '', lines: [], warnings: [], verified: false };
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 100) throw new Error('Limite de 100 páginas por arquivo.');
    for (let pageNumber=1; pageNumber<=pdf.numPages; pageNumber++) {
      progress(`${file.name}: página ${pageNumber}/${pdf.numPages}`);
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const spans = [];
      for (const item of content.items) {
        if (!('str' in item) || !item.str.trim()) continue;
        spans.push({ x:item.transform[4], y:item.transform[5], width:item.width, text:item.str });
      }
      const lines = groupStatementSpans(spans,pageNumber);
      if (!lines.length) document.warnings.push(`Página ${pageNumber} sem texto extraível: requer OCR ou extrato digital.`);
      document.lines.push(...lines);
      page.cleanup();
    }
    return document;
  } finally { await task.destroy(); }
}
