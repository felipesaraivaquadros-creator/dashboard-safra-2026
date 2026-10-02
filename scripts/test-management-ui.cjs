const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
function fixturePdf(lines=['EXTRATO DE TESTE - SEM DADOS REAIS','02/09/2026 PAGAMENTO AGRO 10.000,00 D','03/09/2026 PIX RECEBIDO 3.000,00 C','04/09/2026 ESTORNO 1.000,00 C']) {
  const stream='BT /F1 12 Tf 40 800 Td '+lines.map((l,i)=>(i?'0 -24 Td ':'')+'('+l+') Tj').join('\n')+' ET';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream'];
  let body='%PDF-1.4\n', offsets=[0];
  objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(body));body+=(i+1)+' 0 obj\n'+obj+'\nendobj\n';});
  const xref=Buffer.byteLength(body);
  body+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n'+xref+'\n%%EOF';
  return Buffer.from(body);
}
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'qa@example.invalid'};
    await context.addInitScript(session=>{localStorage.setItem('sb-pohcuxyzdfctfpppnvxa-auth-token',JSON.stringify(session));localStorage.setItem('theme','light');},{access_token:'qa-fixture',refresh_token:'qa-fixture',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user});
    let saved=null, doc=null;
    const contracts=[
      {id:'sale',nome:'Venda teste',numero:'001',safra_id:'milho26',tipo_contrato:'venda',volume_total:1000,forma_liquidacao:'financeira',created_at:'2026-09-01',armazens:{nome:'Armazem Teste'},armazem_id:'arm',contraparte:'Agro Teste'},
      {id:'barter',nome:'Troca teste',numero:'002',safra_id:'milho26',tipo_contrato:'barter',volume_total:500,forma_liquidacao:'fisica',created_at:'2026-09-01'},
      {id:'rent',nome:'Arrendamento teste',numero:'003',safra_id:'milho26',tipo_contrato:'arrendamento',volume_total:0,arrendamento_valor:20000,arrendamento_pago_em:'2026-09-01',forma_liquidacao:'financeira',created_at:'2026-09-01',contraparte:'Proprietario Teste'},
    ];
    await context.route('https://*.supabase.co/**',async route=>{
      const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').at(-1);
      let result=[];
      if(url.pathname.includes('/auth/')) result=user;
      else if(url.pathname.includes('/storage/')) result={Key:'fixture'};
      else if(table==='salvar_analise_despesas') {const body=req.postDataJSON();saved={id:'analysis-qa',safra_id:body.p_safra_id,titulo:body.p_dados.title,conta:body.p_dados.account,status:body.p_finalizar?'finalizada':'rascunho',versao:(saved?.versao||0)+1,dados:body.p_dados,updated_at:new Date().toISOString()};result=saved.id;}
      else if(table==='despesas_analises') result=saved?[saved]:[];
      else if(table==='despesas_documentos') {if(req.method()==='POST') doc={id:'doc-qa',...req.postDataJSON()};result=doc?[doc]:[];}
      else if(table==='contratos') result=contracts;
      else if(table==='contratos_cumprimentos') result=[{contrato_id:'barter',ativo:true,volume_sacas:500,grupo:'ARM'}];
      else if(table==='contratos_barter') result=[{contrato_id:'barter',valor_insumos:25000,contratos_barter_itens:[]}];
      else if(table==='contratos_financeiros') result=[{id:'finance',contrato_id:'sale',status_preco:'fixado',preco_saca:60,tributos_revisados:true,competencia:'2026-09-01',contratos_descontos:[]}];
      else if(table==='safras') result=[{id:'milho26',nome:'Milho 2026',tipo:'Milho',status:'Atual'}];
      if(req.headers().accept?.includes('vnd.pgrst.object') && Array.isArray(result)) result=result[0]||null;
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    const out=process.env.QA_OUTPUT || path.join(require('node:os').tmpdir(),'painel-safra-qa');
    fs.mkdirSync(out,{recursive:true});
    await page.goto('http://localhost:3000/milho26/contratos');
    await page.getByText('Venda teste',{exact:true}).waitFor();
    assert.equal(await page.locator('article').count(),3);
    await page.getByRole('button',{name:'Troca / Barter',exact:true}).click();
    assert.equal(await page.locator('article').count(),1);
    await page.getByRole('button',{name:'Todos',exact:true}).click();
    await page.getByTitle('Detalhes',{exact:true}).first().click();
    await page.getByRole('dialog').waitFor();
    await page.getByTitle('Fechar',{exact:true}).click();
    await page.screenshot({path:path.join(out,'contratos-desktop.png'),fullPage:true});
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Contracts overflow '+width);
    }
    await page.screenshot({path:path.join(out,'contratos-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    await page.goto('http://localhost:3000/milho26/despesas');
    await page.getByRole('button',{name:'Adicionar PDFs'}).waitFor();
    await page.getByLabel('Título da análise').fill('Extrato teste setembro');
    await page.getByLabel('Banco / agência / conta').fill('BANCO TESTE / 001 / 1234');
    await page.getByLabel('Início do período').fill('2026-09-01');
    await page.getByLabel('Fim do período').fill('2026-09-30');
    await page.locator('input[type=file]').setInputFiles({name:'extrato-teste.pdf',mimeType:'application/pdf',buffer:fixturePdf()});
    await page.getByText('3 movimentos',{exact:false}).waitFor({timeout:60000});
    assert.equal(await page.locator('article').count(),3);
    for(const article of await page.locator('article').all()) {
      const raw=await article.textContent();
      await article.getByTitle('Revisar movimento').click();
      const modal=page.getByRole('dialog');
      const kind=raw.includes('PAGAMENTO')?'incluir':raw.includes('ESTORNO')?'estorno':'excluir';
      await modal.getByLabel('Decisão').selectOption(kind);
      if(kind==='estorno') await modal.getByLabel('Débito de origem').selectOption({index:1});
      await modal.getByLabel('Motivo / validação').fill('Conferido no PDF de teste');
      if(kind==='incluir') await modal.getByLabel('Beneficiário confirmado').fill('Agro teste');
      await modal.getByRole('button',{name:'Confirmar revisão'}).click();
    }
    await page.getByRole('checkbox').check();
    await page.getByRole('button',{name:'Finalizar',exact:true}).click();
    await page.getByText('Análise finalizada.',{exact:true}).waitFor();
    assert.equal(saved.status,'finalizada');
    assert.equal(saved.dados.movements.length,3);
    await page.getByRole('button',{name:'Pagamentos',exact:true}).click();
    assert.equal(await page.locator('article').count(),2);
    await page.screenshot({path:path.join(out,'despesas-desktop.png'),fullPage:true});
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Expenses overflow '+width);
    }
    await page.screenshot({path:path.join(out,'despesas-mobile.png'),fullPage:true});
    await page.evaluate(()=>document.documentElement.classList.add('dark'));
    await page.screenshot({path:path.join(out,'despesas-dark.png'),fullPage:true});
    await page.getByRole('button',{name:'Análises salvas',exact:true}).click();
    await page.getByRole('button',{name:'Abrir análise'}).click();
    await page.getByText('Versão 1',{exact:true}).waitFor();
    await page.locator('article').first().waitFor();
    assert.equal(await page.locator('article').count(),2);
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(()=>document.documentElement.classList.remove('dark'));
    await page.getByRole('button',{name:'Nova análise',exact:true}).click();
    await page.getByLabel('Título da análise').fill('Modelo bancario sintetico');
    const bankPdf=fixturePdf(['Sicredi - EXTRATO FICTICIO','Cooperativa: 0001 Conta: 00001-0','Periodo de 01/08/2026 a 31/08/2026',
      'Data Descricao Documento Valor (R$) Saldo (R$)','SALDO ANTERIOR 100,00',
      '01/08/2026 PAGAMENTO AGRO DEMO -10,00 90,00','02/08/2026 RECEBIMENTO PIX DEMO 5,25 95,25',
      'Lancamentos Futuros','01/09/2026 TARIFA 9,00']);
    await page.locator('input[type=file]').setInputFiles({name:'banco-ficticio.pdf',mimeType:'application/pdf',buffer:bankPdf});
    await page.getByText('Leitura: saldos conferem',{exact:false}).waitFor({timeout:60000});
    assert.equal(await page.getByLabel('Início do período').inputValue(),'2026-08-01');
    await page.getByRole('checkbox').check();
    await page.getByLabel('Buscar movimentos').fill('PAGAMENTO');
    await page.getByRole('button',{name:'Confirmar sugestões (1)',exact:true}).click();
    await page.screenshot({path:path.join(out,'despesas-batch-desktop.png'),fullPage:false});
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Batch overflow '+width);
    }
    await page.screenshot({path:path.join(out,'despesas-batch-mobile.png'),fullPage:false});
    await page.getByRole('dialog').getByRole('button',{name:'Confirmar 1 movimento',exact:true}).click();
    await page.getByLabel('Buscar movimentos').fill('');
    await page.getByRole('button',{name:'Confirmar sugestões (1)',exact:true}).click();
    await page.getByRole('dialog').getByRole('button',{name:'Confirmar 1 movimento',exact:true}).click();
    await page.setViewportSize({width:1440,height:1000});
    await page.screenshot({path:path.join(out,'despesas-bank-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:900});
    await page.evaluate(()=>document.documentElement.classList.add('dark'));
    await page.screenshot({path:path.join(out,'despesas-bank-dark.png'),fullPage:true});
    await page.getByRole('button',{name:'Finalizar',exact:true}).click();
    await page.getByRole('button',{name:'Análises salvas',exact:true}).click();
    await page.getByRole('button',{name:'Abrir análise',exact:true}).first().waitFor();
    assert.equal(saved.dados.movements.filter(m=>m.reviewed && m.reviewMethod==='lote').length,2);
    assert.equal(saved.status,'finalizada');
    assert.deepEqual(errors,[]);
    console.log('UI: contratos, PDF sintetico generico/bancario, estorno, revisao individual/lote com filtro, salvar/reabrir, desktop/mobile 320/390 e tema escuro OK. Screenshots: '+out);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
