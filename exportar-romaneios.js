const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function exportar() {
  // NOTE: This path is hardcoded and must be adjusted by the user locally.
  const excelPath = path.join(
    'C:',
    'Users',
    'USER',
    'OneDrive',
    'Documents',
    'PRODUÇÃO',
    '2026',
    'Planejamento 2026.xlsx'
  );

  const outputPath = path.join(__dirname, 'romaneios_soja_25_26.json');

  // 📖 Lê o Excel
  const workbook = XLSX.readFile(excelPath, {
    cellDates: true,
    raw: false
  });

  // 📄 Aba
  const sheetName = 'ROMANEIOS_SOJA';
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Aba ${sheetName} não encontrada`);
  }

  // 🔄 Converte para JSON
  const data = XLSX.utils.sheet_to_json(worksheet, {
    defval: null
  });

  fs.writeFileSync(
    outputPath,
    JSON.stringify(data, null, 2),
    'utf-8'
  );

  console.log(`✅ JSON gerado com sucesso (${data.length} linhas)`);
}

try {
  exportar();
} catch (err) {
  console.error('❌ Erro ao exportar:', err.message);
}