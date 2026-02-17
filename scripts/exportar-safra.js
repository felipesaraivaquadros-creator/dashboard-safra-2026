const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// --- Configurações de Exportação ---
const EXCEL_CONFIG = {
  'soja2526': {
    excelPath: path.join('C:', 'Users', 'USER', 'OneDrive', 'Documents', 'PRODUÇÃO', '2026', 'Planejamento 2026.xlsx'),
    sheetName: 'ROMANEIOS_SOJA',
    outputFile: 'romaneios_soja_25_26.json'
  },
  'adiantamentos2526': {
    excelPath: path.join('C:', 'Users', 'USER', 'OneDrive', 'Documents', 'PRODUÇÃO', '2026', 'Planejamento 2026.xlsx'),
    sheetName: 'PBI_ADIANTAMENTOS_MOTORISTA',
    outputFile: 'adiantamentos_soja_25_26.json'
  },
  'abastecimentos2526': {
    excelPath: path.join('C:', 'Users', 'USER', 'OneDrive', 'Documents', 'PRODUÇÃO', '2026', 'Planejamento 2026.xlsx'),
    sheetName: 'PBI_DIESEL_MOTORISTA',
    outputFile: 'abastecimentos_soja_25_26.json'
  },
  'soja2425': {
    excelPath: path.join('C:', 'Users', 'USER', 'OneDrive', 'Documents', 'PRODUÇÃO', 'PLANEJAMENTO 2025.xlsx'),
    sheetName: 'ROMANEIO SOJA',
    outputFile: 'romaneios_soja_24_25.json'
  },
  'milho25': {
    excelPath: path.join('C:', 'Users', 'USER', 'OneDrive', 'Documents', 'PRODUÇÃO', 'PLANEJAMENTO 2025.xlsx'),
    sheetName: 'ROMANEIO MILHO',
    outputFile: 'romaneios_milho_25.json'
  },
};

function exportar(safraId) {
  const config = EXCEL_CONFIG[safraId];

  if (!config) {
    console.error(`❌ Configuração de exportação não encontrada para: ${safraId}`);
    return;
  }

  const { excelPath, sheetName, outputFile } = config;
  const outputPath = path.join(__dirname, '..', outputFile);

  console.log(`Iniciando exportação para ${safraId}...`);
  
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Arquivo Excel não encontrado em: ${excelPath}`);
  }

  const workbook = XLSX.readFile(excelPath, {
    cellDates: true,
    raw: false
  });

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Aba ${sheetName} não encontrada no arquivo.`);
  }

  const data = XLSX.utils.sheet_to_json(worksheet, {
    defval: null
  });

  fs.writeFileSync(
    outputPath,
    JSON.stringify(data, null, 2),
    'utf-8'
  );

  console.log(`✅ JSON bruto gerado com sucesso em ${outputFile}`);
}

const safraId = process.argv[2];

if (!safraId) {
  console.error('❌ Forneça o ID da configuração (ex: node scripts/exportar-safra.js adiantamentos2526)');
  process.exit(1);
}

try {
  exportar(safraId);
} catch (err) {
  console.error('❌ Erro ao exportar:', err.message);
}