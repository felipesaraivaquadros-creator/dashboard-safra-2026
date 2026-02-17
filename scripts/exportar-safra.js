const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// --- Configurações de Exportação ---
const EXCEL_CONFIG = {
  'soja2526': {
    excelPath: path.join('C:', 'Users', 'USER', 'OneDrive', 'Documents', 'PRODUÇÃO', '2026', 'Planejamento 2026.xlsx'),
    sheets: [
      { name: 'ROMANEIOS_SOJA', output: 'romaneios_soja_25_26.json' },
      { name: 'PBI_ADIANTAMENTOS_MOTORISTA', output: 'adiantamentos_soja_25_26.json' },
      { name: 'PBI_DIESEL_MOTORISTA', output: 'diesel_soja_25_26.json' }
    ]
  },
  'soja2425': {
    excelPath: path.join('C:', 'Users', 'USER', 'OneDrive', 'Documents', 'PRODUÇÃO', 'PLANEJAMENTO 2025.xlsx'),
    sheets: [{ name: 'ROMANEIO SOJA', output: 'romaneios_soja_24_25.json' }]
  },
  'milho25': {
    excelPath: path.join('C:', 'Users', 'USER', 'OneDrive', 'Documents', 'PRODUÇÃO', 'PLANEJAMENTO 2025.xlsx'),
    sheets: [{ name: 'ROMANEIO MILHO', output: 'romaneios_milho_25.json' }]
  }
};

function exportar(safraId) {
  const config = EXCEL_CONFIG[safraId];
  if (!config) {
    console.error(`❌ Configuração não encontrada para: ${safraId}`);
    return;
  }

  console.log(`📖 Lendo arquivo: ${config.excelPath}`);
  const workbook = XLSX.readFile(config.excelPath, { cellDates: true, raw: false });

  config.sheets.forEach(sheet => {
    const worksheet = workbook.Sheets[sheet.name];
    if (!worksheet) {
      console.warn(`⚠️ Aba ${sheet.name} não encontrada.`);
      return;
    }

    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    const outputPath = path.join(__dirname, '..', sheet.output);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Gerado: ${sheet.output} (${data.length} linhas)`);
  });
}

const safraId = process.argv[2];
if (!safraId) {
  console.error('❌ Forneça o ID da safra.');
  process.exit(1);
}

try {
  exportar(safraId);
} catch (err) {
  console.error('❌ Erro:', err.message);
}