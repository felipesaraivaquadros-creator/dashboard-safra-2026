const fs = require('fs');
const path = require('path');

function parseNumero(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'string') {
    const cleaned = valor.replace(/\./g, '').replace(',', '.');
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }
  return typeof valor === 'number' ? valor : null;
}

function parseData(valor) {
  if (!valor) return null;
  if (typeof valor === 'string' && valor.includes('T')) {
    try { return new Date(valor).toISOString().split('T')[0]; } catch (e) {}
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

function normalizar(safraId) {
  const baseDir = path.join(__dirname, '..');
  const dataDir = path.join(baseDir, 'src', 'data', safraId);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // 1. Romaneios
  const romaneioInput = path.join(baseDir, `romaneios_${safraId === 'soja2526' ? 'soja_25_26' : safraId}.json`);
  if (fs.existsSync(romaneioInput)) {
    const raw = JSON.parse(fs.readFileSync(romaneioInput, 'utf-8'));
    const normalizado = raw.map(l => ({
      data: parseData(l['Data']),
      ncontrato: String(l['ncontrato'] || '').trim(),
      emitente: l['Emitente'],
      tipoNF: l['Tipo NF'],
      nfe: parseNumero(l['NFe']),
      numero: parseNumero(l['Nº']),
      armazem: l['Armazem'],
      fazenda: l['Fazenda'],
      motorista: l['Motorista'],
      placa: l['Placa'],
      pesoLiquidoKg: parseNumero(l['Peso Liquido']),
      sacasBruto: parseNumero(l['Sacas Bruto']),
      precofrete: parseNumero(l['precofrete'])
    })).filter(d => d.pesoLiquidoKg > 0);
    fs.writeFileSync(path.join(dataDir, 'romaneios_normalizados.json'), JSON.stringify(normalizado, null, 2));
  }

  // 2. Adiantamentos
  const adiantInput = path.join(baseDir, `adiantamentos_${safraId === 'soja2526' ? 'soja_25_26' : safraId}.json`);
  if (fs.existsSync(adiantInput)) {
    const raw = JSON.parse(fs.readFileSync(adiantInput, 'utf-8'));
    const normalizado = raw.map(l => ({
      data: parseData(l['DATA']),
      motorista: l['Motorista'],
      banco: l['Banco'] || 'N/A',
      valor: parseNumero(l['VALOR'])
    })).filter(d => d.valor > 0);
    fs.writeFileSync(path.join(dataDir, 'adiantamentos_normalizados.json'), JSON.stringify(normalizado, null, 2));
  }

  // 3. Diesel
  const dieselInput = path.join(baseDir, `diesel_${safraId === 'soja2526' ? 'soja_25_26' : safraId}.json`);
  if (fs.existsSync(dieselInput)) {
    const raw = JSON.parse(fs.readFileSync(dieselInput, 'utf-8'));
    const normalizado = raw.map(l => ({
      data: parseData(l['DATA']),
      motorista: l['Motorista'],
      litros: parseNumero(l['Litros']),
      preco: parseNumero(l['Preço']),
      total: parseNumero(l['TOTAL'])
    })).filter(d => d.total > 0);
    fs.writeFileSync(path.join(dataDir, 'diesel_normalizados.json'), JSON.stringify(normalizado, null, 2));
  }

  fs.writeFileSync(path.join(baseDir, 'src', 'data', 'lastUpdate.json'), JSON.stringify({ timestamp: new Date().toISOString() }, null, 2));
  console.log(`✅ Normalização concluída para ${safraId}`);
}

const safraId = process.argv[2];
if (safraId) normalizar(safraId);