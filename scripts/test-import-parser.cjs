const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const XLSX = require('xlsx');

const [msGestorFile, legacyFile] = process.argv.slice(2);
if (!msGestorFile || !legacyFile) {
  throw new Error('Uso: npm run test:import-parser -- <relatorio-ms-gestor.xls> <planilha-base.xlsx>');
}

const sourcePath = path.join(__dirname, '..', 'src', 'lib', 'spreadsheetImport.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleExports = { exports: {} };
new Function('exports', 'require', 'module', compiled)(moduleExports.exports, require, moduleExports);

const {
  AUTO_MAPPING_BY_HEADER,
  extractSpreadsheetRows,
  normalizeColumnKey,
  normalizeMappedValues,
} = moduleExports.exports;

function mappedFirstRow(filePath, sheetName) {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const worksheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
  assert.ok(worksheet, `Aba não encontrada: ${sheetName}`);

  const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });
  const extracted = extractSpreadsheetRows(matrix);
  const mapping = Object.fromEntries(
    extracted.headers
      .map((header) => [header, AUTO_MAPPING_BY_HEADER[normalizeColumnKey(header)]])
      .filter(([, target]) => Boolean(target))
  );
  const mapped = Object.fromEntries(
    Object.entries(mapping).map(([sourceColumn, target]) => [target, extracted.rows[0][sourceColumn]])
  );

  return { extracted, mapped: normalizeMappedValues(mapped) };
}

const msGestor = mappedFirstRow(msGestorFile);
assert.equal(msGestor.extracted.headerRowIndex, 2, 'Cabeçalho do MS Gestor deve ser localizado após o título');
assert.equal(msGestor.mapped.data, '2025-07-28');
assert.equal(msGestor.mapped.numero_romaneio, 3169);
assert.equal(msGestor.mapped.nfe, 207);
assert.equal(msGestor.mapped.peso_liquid_kg, 52580);

const legacy = mappedFirstRow(legacyFile, 'ROMANEIO MILHO');
assert.equal(legacy.extracted.headerRowIndex, 0);
assert.equal(legacy.mapped.data, '2025-06-18');
assert.equal(legacy.mapped.numero_romaneio, 77691);
assert.equal(legacy.mapped.nfe, 831);
assert.equal(legacy.mapped.peso_bruto_kg, 48880);

console.log('Importador validado com relatório MS Gestor e planilha-base.');
