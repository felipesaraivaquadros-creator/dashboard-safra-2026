const fs = require('fs');
const path = require('path');

// 🔧 Helper para limpar valores monetários (ex: "R$ 2.500,00" -> 2500)
function parseNumero(valor) {
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === 'number') return valor;
  
  if (typeof valor === 'string') {
    // Remove R$, espaços e pontos de milhar, troca vírgula por ponto
    const cleanedValue = valor
      .replace(/[R$\s]/g, '') 
      .replace(/\./g, '')   
      .replace(',', '.');   
    
    const num = parseFloat(cleanedValue);
    return isNaN(num) ? 0 : num;
  }

  return 0;
}

// 📅 Helper para converter datas (ISO ou DD/MM/YYYY -> YYYY-MM-DD)
function parseData(valor) {
  if (!valor) return null;
  
  const str = String(valor).trim();

  // Caso venha como ISO (2026-01-15T...)
  if (str.includes('T')) {
    return str.split('T')[0];
  }

  // Caso venha como brasileiro (15/01/2026)
  if (str.includes('/')) {
    const partes = str.split('/');
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
  }

  return str;
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
    normalizado = rawData.map(linha => {
      const valorKey = Object.keys(linha).find(k => k.trim() === 'VALOR');
      const motoristaKey = Object.keys(linha).find(k => k.trim() === 'Motorista');
      const dataKey = Object.keys(linha).find(k => k.trim() === 'DATA');
      const safraKey = Object.keys(linha).find(k => k.trim() === 'SAFRA');

      return {
        motorista: String(linha[motoristaKey] || '').trim().toUpperCase(),
        data: parseData(linha[dataKey]),
        valor: parseNumero(linha[valorKey]),
        safra: String(linha[safraKey] || '').trim()
      };
    }).filter(d => d.motorista && d.valor > 0);
  } 
  else if (tipo === 'abastecimentos') {
    normalizado = rawData.map(linha => {
      const motoristaKey = Object.keys(linha).find(k => k.trim() === 'Motorista');
      const dataKey = Object.keys(linha).find(k => k.trim() === 'DATA');
      const safraKey = Object.keys(linha).find(k => k.trim() === 'SAFRA');
      const litrosKey = Object.keys(linha).find(k => k.trim() === 'Litros');
      const precoKey = Object.keys(linha).find(k => k.trim() === 'Preço');
      const totalKey = Object.keys(linha).find(k => k.trim() === 'TOTAL');

      return {
        safra: String(linha[safraKey] || '').trim(),
        data: parseData(linha[dataKey]),
        motorista: String(linha[motoristaKey] || '').trim().toUpperCase(),
        litros: parseNumero(linha[litrosKey]),
        preco: parseNumero(linha[precoKey]),
        total: parseNumero(linha[totalKey])
      };
    }).filter(d => d.motorista && d.total > 0);
  }

  fs.writeFileSync(outputPath, JSON.stringify(normalizado, null, 2), 'utf-8');
  console.log(`✅ Dados de ${tipo} normalizados com sucesso em ${outputPath}`);
}

const tipo = process.argv[2]; 
const safraId = process.argv[3]; 
const inputFileName = process.argv[4];

if (!tipo || !safraId || !inputFileName) {
  console.error('❌ Uso: node scripts/normalizar-extras.js [tipo] [safraId] [arquivo_bruto]');
  process.exit(1);
}

normalizar(tipo, safraId, inputFileName);