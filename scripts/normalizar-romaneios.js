const fs = require('fs');
const path = require('path');

// 🔧 Helpers
function parseNumero(valor) {
  if (valor === null || valor === undefined) return null;

  if (typeof valor === 'string') {
    const cleanedValue = valor
      .replace(/\./g, '')   
      .replace(',', '.');   
    
    const num = Number(cleanedValue);
    return isNaN(num) ? null : num;
  }

  if (typeof valor === 'number') return valor;

  return null;
}

function parseData(valor) {
  if (!valor) return null;

  if (typeof valor === 'string' && valor.includes('T')) {
    try {
      return new Date(valor).toISOString().split('T')[0];
    } catch (e) {}
  }

  if (typeof valor === 'string') {
    const partes = valor.split('/');
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
  }

  return null;
}

// 🔄 Normalização
function normalizar(safraId, inputFileName) {
  // Caminho de entrada agora é relativo à raiz do projeto (um nível acima de scripts/)
  const inputPath = path.join(__dirname, '..', inputFileName);
  // Caminho de saída agora é relativo à raiz do projeto
  const outputPath = path.join(__dirname, '..', 'src', 'data', safraId, 'romaneios_normalizados.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Arquivo de entrada não encontrado: ${inputPath}`);
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  const normalizado = rawData
    .map(linha => {
      const pesoLiquidoKg = parseNumero(linha['Peso Liquido']);
      const sacasLiquida = parseNumero(linha['Sacas Liquida']);
      
      return {
        data: parseData(linha['Data']),
        contrato: linha['Contrato'] || 'S/C',
        ncontrato: String(linha['ncontrato'] || '').trim(),
        emitente: linha['Emitente'] || null,
        tipoNF: linha['Tipo NF'] || null,
        nfe: parseNumero(linha['NFe']),
        cidadeEntrega: linha['Cidade de Entrega'] || null,
        armazem: linha['Armazem'] || null,
        armazemsaldo: linha['armazemsaldo'] || null,
        safra: linha['Safra'] || null,
        fazenda: linha['Fazenda'] || null,
        talhao: linha['Talhão'] || null,

        pesoLiquidoKg: pesoLiquidoKg,
        pesoBrutoKg: parseNumero(linha['Peso Bruto']),
        sacasLiquida: sacasLiquida,
        sacasBruto: parseNumero(linha['Sacas Bruto']),
        umidade: parseNumero(linha['Umid']),
        impureza: parseNumero(linha['Impu']),
        ardido: parseNumero(linha['Ardi']),
        avariados: parseNumero(linha['Avari']),
        quebrados: parseNumero(linha['Quebr'])
      };
    })
    .filter(d => d.sacasLiquida > 0 || d.pesoLiquidoKg > 0);

  fs.writeFileSync(
    outputPath,
    JSON.stringify(normalizado, null, 2),
    'utf-8'
  );

  console.log(`✅ JSON normalizado com sucesso (${normalizado.length} linhas) em ${outputPath}`);
}

const safraId = process.argv[2];
const inputFileName = process.argv[3];

if (!safraId || !inputFileName) {
  console.error('❌ Por favor, forneça o ID da safra e o nome do arquivo de entrada (ex: node scripts/normalizar-romaneios.js soja2526 romaneios_soja_25_26.json)');
  process.exit(1);
}

try {
  normalizar(safraId, inputFileName);
} catch (err) {
  console.error('❌ Erro ao normalizar:', err.message);
}