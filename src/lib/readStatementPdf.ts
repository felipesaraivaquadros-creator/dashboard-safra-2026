import { ExpenseDocument } from './despesasEngine';

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
      const rows: Array<{ y: number; parts: Array<{ x: number; text: string }> }> = [];
      for (const item of content.items) {
        if (!('str' in item) || !item.str.trim()) continue;
        const y = item.transform[5], x = item.transform[4];
        let row = rows.find(r => Math.abs(r.y-y)<2);
        if (!row) { row = { y, parts: [] }; rows.push(row); }
        row.parts.push({ x, text: item.str });
      }
      const lines = rows.sort((a,b)=>b.y-a.y).map((row,i) => ({ page: pageNumber, line: i+1, text: row.parts.sort((a,b)=>a.x-b.x).map(p=>p.text).join(' ') }));
      if (!lines.length) document.warnings.push(`Página ${pageNumber} sem texto extraível: requer OCR ou extrato digital.`);
      document.lines.push(...lines);
      page.cleanup();
    }
    return document;
  } finally { await task.destroy(); }
}
