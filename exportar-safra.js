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
  'soja2425': {
    // Caminho fornecido pelo usuário
    excelPath: path.join('C:', 'Users', 'USER', 'OneDrive', 'Documents', 'PRODUÇÃO', 'PLANEJAMENTO 2025.xlsx'),
    sheetName: 'ROMANEIO SOJA',
    outputFile: 'romaneios_soja_24_25.json'
  },
  'milho25': {
    // Caminho fornecido pelo usuário
    excelPath: path.join('C:', 'Users', 'USER', 'OneDrive', 'Documents', 'PRODUÇÃO', 'PLANEJAMENTO 2025.xlsx'),
    sheetName: 'ROMANEIO MILHO',
    outputFile: 'romaneios_milho_25.json'
  },
  // Milho 26 é futura, não precisa de exportação
};

function exportar(safraId) {
  const config = EXCEL_CONFIG[safraId];

  if (!config) {
    console.error(`❌ Configuração de exportação não encontrada para a safra: ${safraId}`);
    return;
  }

  const { excelPath, sheetName, outputFile } = config;
  const outputPath = path.join(__dirname, outputFile);

  console.log(`Iniciando exportação para Safra ${safraId}...`);
  console.log(`Lendo arquivo: ${excelPath}`);
  console.log(`Lendo aba: ${sheetName}`);

  // 📖 Lê o Excel
  const workbook = XLSX.readFile(excelPath, {
    cellDates: true,
    raw: false
  });

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Aba ${sheetName} não encontrada no arquivo ${excelPath}`);
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

  console.log(`✅ JSON bruto gerado com sucesso (${data.length} linhas) em ${outputFile}`);
}

const safraId = process.argv[2];

if (!safraId) {
  console.error('❌ Por favor, forneça o ID da safra (ex: node exportar-safra.js soja2526)');
  process.exit(1);
}

try {
  exportar(safraId);
} catch (err) {
  console.error('❌ Erro ao exportar:', err.message);
}