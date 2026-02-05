const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'romaneios_soja_25_26.json');
const outputPath = path.join(__dirname, 'romaneios_soja_25_26_normalizado.json');

// 🔧 Helpers
function parseNumero(valor) {
  if (valor === null || valor === undefined) return null;

  if (typeof valor === 'number') return valor;

  return Number(
    valor
      .toString()
      .replace(/\./g, '')   // remove milhar
      .replace(',', '.')   // vírgula decimal
      .replace(/[^\d.-]/g, '')
  );
}

function parseData(valor) {
  if (!valor) return null;

  // Se já vier como Date
  if (valor instanceof Date) {
    return valor.toISOString().split('T')[0];
  }

  // Formato DD/MM/YYYY
  const partes = valor.split('/');
  if (partes.length === 3) {
    const [dia, mes, ano] = partes;
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  return null;
}

// 🔄 Normalização
const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

const normalizado = rawData.map(linha => ({
  data: parseData(linha['Data']),
  contrato: linha['ncontrato'] || 'S/C', // ADICIONE ESTA LINHA
  ncontrato: String(linha['ncontrato'] || '').trim(), // Mudamos para ncontrato
  tipoNF: linha['Tipo NF'] || null,
  nfe: linha['NFe'] || null,
  cidadeEntrega: linha['Cidade de Entrega'] || null,
  armazem: linha['Armazem'] || null,
  safra: linha['Safra'] || null,
  fazenda: linha['Fazenda'] || null,
  talhao: linha['Talhão'] || null,

  pesoLiquidoKg: parseNumero(linha['Peso Liquido']),
  pesoBrutoKg: parseNumero(linha['Peso Bruto']),
  sacasLiquida: parseNumero(linha['Sacas Liquida']), // Garante que é número,
  sacasBruto: parseNumero(linha['Sacas Bruto']),
  umidade: parseNumero(linha['Umid']),
  impureza: parseNumero(linha['Impu']),
  ardido: parseNumero(linha['Ardi']),
  avariados: parseNumero(linha['Avari']),
  quebrados: parseNumero(linha['Quebr'])
}));

fs.writeFileSync(
  outputPath,
  JSON.stringify(normalizado, null, 2),
  'utf-8'
);

console.log(`✅ JSON normalizado com sucesso (${normalizado.length} linhas)`);
