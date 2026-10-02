const assert = require('node:assert/strict');
const path = require('node:path');
const e = require('./load-ts.cjs')(path.join(__dirname,'../src/lib/despesasEngine.ts'));
assert.equal(e.parseBRMoney('3.517,85'),351785);
assert.equal(e.parseBRMoney('529,00'),52900);
assert.equal(e.parseBRMoney('6,65'),665);
assert.equal(e.parseBRMoney('1.000.000,01 D'),100000001);
assert.equal(e.parseBRMoney('-20,50'),-2050);
assert.equal(e.parseBRMoney('1,000.50'),null);
assert.equal(e.parseBRMoney('1.23,00'),null);
assert.equal(e.parseBRDate('29/02/2024'),'2024-02-29');
assert.equal(e.parseBRDate('29/02/2025'),'');
assert.equal(e.parseBRDate('31/04/2026'),'');
const doc = {id:'a',hash:'a',name:'teste.pdf',path:'',verified:true,warnings:[],lines:[
  {page:1,line:1,text:'01/09/2026 SALDO ANTERIOR 50.000,00 C'},
  {page:1,line:2,text:'02/09/2026 PAGAMENTO AGRO 10.000,00 D'},
  {page:1,line:3,text:'03/09/2026 PIX RECEBIDO 3.000,00 C'},
  {page:1,line:4,text:'04/09/2026 ESTORNO 1.000,00 C'},
  {page:1,line:5,text:'05/09/2026 COMPRA 500,00 40.000,00'},
]};
let rows=e.parseStatementLines(doc);
assert.equal(rows.length,4);
assert.equal(rows[0].cents,1000000);
assert.equal(rows[0].direction,'debito');
assert.equal(rows[1].decision,'excluir');
assert.equal(rows[2].decision,'revisar');
assert.equal(rows[3].cents,0,'Do not choose between two monetary columns');
assert.equal(rows[3].direction,'indefinido');
rows=rows.slice(0,3).map((m,i)=>({...m,reviewed:true,decision:i===0?'incluir':i===1?'excluir':'estorno',refundOf:i===2?rows[0].id:'',reason:'Conferido'}));
const draft={title:'Teste',account:'CONTA 1',periodStart:'2026-09-01',periodEnd:'2026-09-30',documents:[doc],movements:rows,opening:'50.000,00',closing:'44.000,00'};
assert.deepEqual(e.validateExpenseDraft(draft),[]);
assert.ok(e.validateExpenseDraft({...draft,importFailures:['arquivo incompleto']}).length);
assert.equal(e.expenseTotals(rows.map(m=>({...m,reviewed:false}))).net,0,'Only confirmed movements enter KPIs');
assert.deepEqual(e.expenseTotals(rows),{payments:1000000,refunds:100000,net:900000,reviewCents:0,reviewCount:0});
assert.ok(e.validateExpenseDraft({...draft,closing:'43.000,00'}).length);
assert.ok(e.validateExpenseDraft({...draft,movements:rows.map((m,i)=>i===2?{...m,cents:1000001}:m)}).some(s=>s.includes('excedem')));
assert.ok(e.validateExpenseDraft({...draft,movements:rows.map((m,i)=>i===2?{...m,refundOf:'missing'}:m)}).some(s=>s.includes('Estorno')));
assert.equal(e.markPossibleDuplicates([rows[0]],rows)[0].decision,'revisar');
assert.equal(e.markPossibleDuplicates([rows[0]],rows)[0].reviewed,false);
assert.equal(e.markPossibleDuplicates([rows[0]],[])[0].duplicateHint,undefined);
assert.ok(e.validateExpenseDraft({...draft,documents:[{...doc,verified:false}]}).length);
assert.ok(e.validateExpenseDraft({...draft,movements:[...rows,rows[0]]}).some(s=>s.includes('repetido')));
assert.ok(e.validateExpenseDraft({...draft,movements:rows.map((m,i)=>i===0?{...m,direction:'credito'}:m)}).some(s=>s.includes('débitos')));
console.log('Despesas: decimais, datas, extracao conservadora, duplicidades, estornos e saldos OK.');
