const fs = require('fs');
const path = require('path');

function parseNumero(valor) {
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === 'string') {
    const cleanedValue = valor.replace(/\./g, '').replace(',', '.');
    const num = Number(cleanedValue);
    return isNaN(num) ? 0 : num;
  }
  return typeof valor === 'number' ? valor : 0;
}

function parseData(valor) {
  if (!valor) return null;
  if (typeof valor === 'string' && valor.includes('T')) {
    return valor.split('T')[0];
  }
  return valor;
}

function normalizar(tipo, safraId, inputFileName) {
  const inputPath = path.join(__dirname, '..', inputFileName);
  const outputDir = path.join(__dirname, '..', 'src', 'data', safraId);
  const outputPath = path.join(outputDir, `${tipo}_normalizados.json`);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Arquivo de entrada não encontrado: ${inputPath}`);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  let normalizado = [];

  if (tipo === 'adiantamentos') {
    normalizado = rawData.map(linha => ({
      motorista: String(linha['Motorista'] || '').trim(),
      data: parseData(linha['DATA']),
      valor: parseNumero(linha['VALOR']),
      safra: String(linha['SAFRA'] || '').trim()
    })).filter(d => d.motorista && d.valor > 0);
  } 
  else if (tipo === 'abastecimentos') {
    normalizado = rawData.map(linha => ({
      safra: String(linha['SAFRA'] || '').trim(),
      data: parseData(linha['DATA']),
      motorista: String(linha['Motorista'] || '').trim(),
      litros: parseNumero(linha['Litros']),
      preco: parseNumero(linha['Preço']),
      total: parseNumero(linha['TOTAL'])
    })).filter(d => d.motorista && d.total > 0);
  }

  fs.writeFileSync(outputPath, JSON.stringify(normalizado, null, 2), 'utf-8');
  console.log(`✅ Dados de ${tipo} normalizados em ${outputPath}`);
}

const tipo = process.argv[2]; // adiantamentos ou abastecimentos
const safraId = process.argv[3]; // soja2526
const inputFileName = process.argv[4];

if (!tipo || !safraId || !inputFileName) {
  console.error('❌ Uso: node scripts/normalizar-extras.js [tipo] [safraId] [arquivo_bruto]');
  process.exit(1);
}

normalizar(tipo, safraId, inputFileName);