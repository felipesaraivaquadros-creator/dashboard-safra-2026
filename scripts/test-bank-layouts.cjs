const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('./load-ts.cjs');
const { parseStatementDocument, validateExpenseDraft, reviewableSuggestions } = load(path.join(__dirname,'../src/lib/despesasEngine.ts'));
const { groupStatementSpans } = load(path.join(__dirname,'../src/lib/statementFormat.ts'));
// Fictitious identities and amounts. Real bank statements must never become repository fixtures.
const span = (x,y,text) => ({ x,y,text,width:text.length*5 });
function document(pages) {
  return { id:'fixture',hash:'fixture',name:'synthetic.pdf',path:'',warnings:[],verified:false,
    lines:pages.flatMap((items,i)=>groupStatementSpans(items,i+1)) };
}
const sicredi = document([[
  span(40,800,'Sicredi'),span(40,780,'Cooperativa: 0001 Conta: 00001-0'),
  span(40,760,'Período de 01/08/2026 a 31/08/2026'),
  ...[[40,'Data'],[100,'Descrição'],[380,'Documento'],[460,'Valor (R$)'],[520,'Saldo (R$)']].map(([x,s])=>span(x,730,s)),
  span(100,710,'SALDO ANTERIOR'),span(530,710,'100,00'),
  span(40,690,'01/08/2026'),span(100,690,'PAGAMENTO PIX 00000000000000 FORNECEDOR DEMO'),span(380,690,'PIX_DEB'),span(470,690,'-10,00'),span(530,690,'90,00'),
  span(40,670,'02/08/2026'),span(100,670,'RECEBIMENTO PIX 00000000000000 CLIENTE DEMO'),span(380,670,'PIX_CRED'),span(470,670,'5,25'),span(530,670,'95,25'),
  span(40,640,'Lançamentos Futuros'),span(40,620,'01/09/2026 TARIFA 9,00'),
]]);
let result=parseStatementDocument(sicredi);
assert.equal(result.movements.length,2);
assert.equal(result.movements[0].cents,1000);
assert.equal(result.movements[0].beneficiary,'FORNECEDOR DEMO');
assert.equal(result.document.statement.futureCount,1);
assert.equal(result.document.statement.balanceMatches,true);
assert.deepEqual(result.document.warnings,[]);
const corrupt=structuredClone(sicredi);
corrupt.lines.find(l=>l.text.includes('-10,00')).text=corrupt.lines.find(l=>l.text.includes('-10,00')).text.replace('90,00','90,01');
assert.ok(parseStatementDocument(corrupt).document.warnings.some(w=>w.includes('sequencial')));

const bb = document([[
  span(30,810,'Extrato de Conta Corrente'),span(30,790,'Cliente: TITULAR DEMO'),
  span(30,770,'Período: 01 a 31/08/2026 Agência: 0002-0 Conta: 00002-0'),
  ...[[30,'Dia'],[99,'Lote'],[148,'Documento'],[265,'Histórico'],[550,'Valor']].map(([x,s])=>span(x,725.7,s)),
  span(30,710.7,'31/07/2026'),span(265,710.7,'Saldo Anterior'),span(530,710.7,'100,00 (+)'),
  span(265,696.5,'Pix - Enviado'),span(30,690.7,'20/08/2026'),span(99,690.7,'13105'),span(148,690.7,'82001'),span(530,690.7,'25,00 (-)'),
  span(265,685,'20/08 15:29 FORNECEDOR DEMO'),
  span(30,670.7,'20/08/2026'),span(265,670.7,'Saldo do dia'),span(540,670.7,'75,00 (+)'),
  span(30,650.7,'31/08/2026'),span(265,650.7,'S A L D O'),span(540,650.7,'75,00 (+)'),
]]);
result=parseStatementDocument(bb);
assert.equal(result.movements.length,1);
assert.equal(result.movements[0].description,'Pix - Enviado 20/08 15:29 FORNECEDOR DEMO');
assert.equal(result.movements[0].beneficiary,'FORNECEDOR DEMO');
assert.equal(result.movements[0].bankReference,'82001');
assert.equal(result.document.statement.balanceMatches,true);
assert.deepEqual(result.document.warnings,[]);
const bbEmpty=document([[
  span(30,810,'Extrato de Conta Corrente'),span(30,790,'Agência: 0002-0 Conta: 00002-0'),
  ...[[30,'Dia'],[99,'Lote'],[148,'Documento'],[265,'Histórico'],[550,'Valor']].map(([x,s])=>span(x,725.7,s)),
  span(30,710,'06/07/2026'),span(265,705,'Saldo Anterior'),span(530,705,'0,04 (-)'),
  span(30,690,'31/08/2026'),span(265,685,'S A L D O'),span(530,685,'0,04 (-)'),
  span(30,640,'Total Aplicações Financeiras'),span(530,640,'0,00'),
]]);
result=parseStatementDocument(bbEmpty);
assert.equal(result.document.statement.emptyStatement,true);
assert.equal(result.document.statement.openingCents,-4);
assert.equal(result.document.statement.periodStart,'','Do not infer the statement period from a prior balance date');
assert.equal(result.movements.length,0);
assert.deepEqual(result.document.warnings,[]);
const verifiedEmpty={...result.document,verified:true};
const emptyDraft={title:'Teste',account:'DEMO',documents:[verifiedEmpty],movements:[],opening:'-0,04',closing:'-0,04',periodStart:'2026-08-01',periodEnd:'2026-08-31'};
assert.deepEqual(validateExpenseDraft(emptyDraft),[]);
assert.ok(validateExpenseDraft({...emptyDraft,documents:[{...verifiedEmpty,statement:undefined}]}).length);

const cresol=document([[
  span(60,800,'Agência 0003 Conta 00003-0'),span(60,780,'Saldo em Conta Limite de Crédito Saldo Disponível'),
  span(60,750,'Lançamentos'),
  span(60,710.4,'11/08/2026'),span(431,710,'Saldo do Dia: + R$ 5,00'),
  span(146,686,'PGTO PARCELA EMPRESTIMO'),span(84,680.4,'11/08/2026'),span(478,680,'- R$ 10,00'),span(146,673,'AUTOMATICO CONTRATO-DEMO'),
  span(60,650.4,'10/08/2026'),span(431,650,'Saldo do Dia: + R$ 15,00'),
  span(146,626,'PIX CREDITO DE: CLIENTE'),span(84,620.4,'10/08/2026'),span(478,620,'+ R$ 15,00'),span(146,613,'DEMO'),
  span(76,590,'Saldo Anterior:'),span(478,590,'+ R$ 0,00'),
  span(60,70,'Consulta Posição consolidada em 01/09/2026'),
  span(60,50,'Periodo de 01/08/2026 a 31/08/2026'),
]]);
result=parseStatementDocument(cresol);
assert.equal(result.movements.length,2);
assert.equal(result.movements[0].description,'PGTO PARCELA EMPRESTIMO AUTOMATICO CONTRATO-DEMO');
assert.equal(result.movements[1].beneficiary,'CLIENTE DEMO');
assert.equal(result.document.statement.balanceMatches,true);
assert.deepEqual(result.document.warnings,[]);

const sicoob=document([[
  span(40,810,'SICOOB - SISBR'),span(40,790,'Cooperativa: 0004-0 Conta: 00004-0'),
  span(40,770,'Periodo: 01/08/2026 - 31/08/2026'),
  ...[[40,'Data'],[100,'Documento'],[200,'Histórico'],[530,'Valor']].map(([x,s])=>span(x,730,s)),
  span(40,710,'31/07'),span(200,710,'SALDO ANTERIOR'),span(480,710,'R$ 100,00D'),
  span(40,690,'01/08'),span(100,690,'Pix'),span(200,690,'PIX EMITIDO OUTRA IF'),span(480,690,'R$ 25,00D'),
  span(200,680,'Pagamento Pix 00.000.000 0000-00'),
  span(40,660,'01/08'),span(100,660,'Pix'),span(200,660,'CRÉDITO DEVOLUÇÃO PIX'),span(480,660,'R$ 25,00C'),
  span(200,650,'Devolução Pix FORNECEDOR DEMO 00.000.000 0000-00'),
  span(40,630,'01/08'),span(200,630,'SALDO DO DIA'),span(480,630,'R$ 100,00D'),
  span(40,600,'RESUMO'),span(40,580,'Saldo em conta: - 100,00D'),span(40,560,'Saldo disponível: 9.900,00C'),
  span(40,540,'Juros vencidos provisionados: 555,55D'),
]]);
result=parseStatementDocument(sicoob);
assert.equal(result.movements.length,2);
assert.equal(result.movements[0].date,'2026-08-01');
assert.equal(result.movements[1].refundOf,result.movements[0].id);
assert.equal(result.movements[1].decision,'revisar','A suggestion must not apply a refund automatically');
assert.equal(result.document.statement.closingCents,-10000,'Do not use available overdraft as closing balance');
assert.deepEqual(result.document.warnings,[]);
const invalidYear=structuredClone(sicoob);
invalidYear.lines=invalidYear.lines.filter(l=>!l.text.startsWith('Periodo'));
assert.ok(parseStatementDocument(invalidYear).document.warnings.length);
assert.ok(validateExpenseDraft({...emptyDraft,documents:[verifiedEmpty,{...verifiedEmpty,statement:{...verifiedEmpty.statement,accountKey:'bb:other:account'}}]}).some(s=>s.includes('Contas')));
const sample=parseStatementDocument(sicredi);
const batchDraft={...emptyDraft,documents:[{...sample.document,verified:true}],movements:sample.movements};
const visible=new Set(sample.movements.map(m=>m.id));
assert.equal(reviewableSuggestions(batchDraft,visible).length,2);
assert.equal(reviewableSuggestions({...batchDraft,documents:[sample.document]},visible).length,0,'Source must be explicitly checked');
assert.equal(reviewableSuggestions(batchDraft,new Set([sample.movements[0].id])).length,1,'Respect list filters');
assert.equal(reviewableSuggestions({...batchDraft,periodStart:''},visible).length,0);
for (const patch of [{warnings:['Pending check']},{statement:{...sample.document.statement,openingCents:null}}]) {
  assert.equal(reviewableSuggestions({...batchDraft,documents:[{...batchDraft.documents[0],...patch}]},visible).length,0);
}
for (const patch of [{duplicateHint:true},{reviewed:true},{decision:'revisar'},{decision:'excluir',reason:'Possible own-account transfer'}]) {
  assert.equal(reviewableSuggestions({...batchDraft,movements:sample.movements.map(m=>({...m,...patch}))},visible).length,0);
}
assert.equal(reviewableSuggestions({...batchDraft,movements:sample.movements.map((m,i)=>i===0?{...m,cents:m.cents+1}:m)},visible).length,0,'Edited source must still balance');
const refundResult=parseStatementDocument(sicoob);
const refundDraft={...emptyDraft,documents:[{...refundResult.document,verified:true}],movements:refundResult.movements};
assert.equal(reviewableSuggestions(refundDraft,new Set(refundResult.movements.map(m=>m.id))).length,0,'Ambiguous PIX and refunds require individual review');
console.log('Bank layouts: Sicredi, BB, Cresol, Sicoob, multiline histories, cents, empty statements, futures and refund suggestions OK.');
