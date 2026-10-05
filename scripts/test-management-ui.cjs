const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'qa@example.invalid'};
    await context.addInitScript(session=>{
      localStorage.setItem('sb-pohcuxyzdfctfpppnvxa-auth-token',JSON.stringify(session));
      localStorage.setItem('theme','light');
    },{access_token:'qa-fixture',refresh_token:'qa-fixture',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user});
    const contracts=[
      {id:'sale',nome:'Venda teste',numero:'001',safra_id:'milho26',tipo_contrato:'venda',volume_total:1000,forma_liquidacao:'financeira'},
      {id:'barter',nome:'Troca teste',numero:'002',safra_id:'milho26',tipo_contrato:'barter',volume_total:500,forma_liquidacao:'fisica'},
      {id:'rent',nome:'Arrendamento dinheiro',numero:'003',safra_id:'milho26',tipo_contrato:'arrendamento',volume_total:0,arrendamento_valor:20000,arrendamento_pago_em:'2026-09-01',contraparte:'Proprietario Teste',forma_liquidacao:'financeira'},
      {id:'rent-mixed',nome:'Arrendamento misto',numero:'004',safra_id:'milho26',tipo_contrato:'arrendamento',volume_total:80,arrendamento_valor:15000,arrendamento_pago_em:'2026-09-01',contraparte:'Proprietario Misto',forma_liquidacao:'mista'},
      {id:'rent-grain',nome:'Arrendamento graos',numero:'005',safra_id:'milho26',tipo_contrato:'arrendamento',volume_total:100,arrendamento_valor:0,contraparte:'Proprietario Graos',forma_liquidacao:'fisica'},
      {id:'old-rent',nome:'Arrendamento safra anterior',numero:'006',safra_id:'milho25',tipo_contrato:'arrendamento',volume_total:0,arrendamento_valor:18000,contraparte:'Proprietario Anterior',forma_liquidacao:'financeira'},
    ].map(c=>({...c,created_at:'2026-09-01',arquivado_em:null}));
    const expenseRequests=[],errors=[];
    // No real database changes. All remote requests are intercepted.
    await context.route('**/*',async route=>{
      const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').at(-1);
      if(url.hostname==='localhost') return route.continue();
      if(!url.hostname.endsWith('.supabase.co')) return route.abort();
      if(url.pathname.includes('despesas')) expenseRequests.push(url.pathname);
      let result=[];
      if(url.pathname.includes('/auth/')) result=user;
      else if(table==='contratos') {
        result=contracts;
        const safra=url.searchParams.get('safra_id');
        if(safra) result=result.filter(c=>'eq.'+c.safra_id===safra);
        const ids=url.searchParams.get('id');
        if(ids?.startsWith('eq.')) result=result.filter(c=>'eq.'+c.id===ids);
        else if(ids?.startsWith('in.')) {
          const list=ids.slice(4,-1).split(',');
          result=result.filter(c=>list.includes(c.id));
        }
      } else if(table==='contratos_cumprimentos') result=[
        {contrato_id:'barter',ativo:true,volume_sacas:500,grupo:'ARM'},
        {contrato_id:'rent-grain',ativo:true,volume_sacas:100,grupo:'ARM'},
      ];
      else if(table==='contratos_barter') result=[{contrato_id:'barter',valor_insumos:25000,contratos_barter_itens:[]}];
      else if(table==='contratos_financeiros') result=[{id:'finance',contrato_id:'sale',status_preco:'fixado',preco_saca:60,tributos_revisados:true,competencia:'2026-09-01',contratos_descontos:[]}];
      else if(table==='safras') result=[{id:'milho26',nome:'Milho 2026',tipo:'Milho',status:'Atual'},{id:'milho25',nome:'Milho 2025',tipo:'Milho',status:'Anterior'}];
      if(req.headers().accept?.includes('vnd.pgrst.object') && Array.isArray(result)) result=result[0]||null;
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
    });
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    const out=process.env.QA_OUTPUT || path.join(require('node:os').tmpdir(),'painel-safra-qa');
    fs.mkdirSync(out,{recursive:true});
    await page.goto('http://localhost:3000/milho26/contratos');
    await page.getByText('Venda teste',{exact:true}).waitFor();
    assert.equal(await page.locator('article').count(),5);
    assert.equal(await page.getByRole('link',{name:'Despesas',exact:true}).count(),0);
    await page.getByRole('button',{name:'Arrendamento',exact:true}).click();
    assert.equal(await page.locator('article').count(),3);
    await page.getByLabel('Situação').selectOption('cumpridos');
    assert.equal(await page.locator('article').count(),2);
    await page.getByLabel('Situação').selectOption('todos');
    await page.getByTitle('Detalhes',{exact:true}).first().click();
    await page.getByRole('dialog').waitFor();
    await page.getByTitle('Fechar',{exact:true}).click();
    await page.getByTitle('Editar',{exact:true}).first().click();
    await page.getByText('Editar Contrato',{exact:true}).waitFor();
    await page.getByTitle('Fechar',{exact:true}).click();
    await page.getByRole('button',{name:'Novo contrato',exact:true}).click();
    await page.getByText('Novo Contrato',{exact:true}).last().waitFor();
    await page.getByTitle('Fechar',{exact:true}).click();
    assert.equal(await page.getByTitle('Excluir sem histórico').count(),3);
    await page.screenshot({path:path.join(out,'contratos-preservados.png'),fullPage:true});
    await page.goto('http://localhost:3000/milho26/financeiro');
    const table=page.locator('.financeiro-contracts-section table');
    const row=name=>table.locator('tbody tr').filter({hasText:name});
    await row('Arrendamento dinheiro').waitFor();
    assert.equal(await table.locator('tbody tr').count(),5);
    assert.ok((await row('Arrendamento dinheiro').textContent()).includes('Cumprido'));
    assert.ok((await row('Arrendamento misto').textContent()).includes('A cumprir'));
    assert.ok((await row('Arrendamento graos').textContent()).includes('Cumprido'));
    assert.ok((await row('Arrendamento dinheiro').textContent()).includes('20.000,00'));
    assert.equal(await row('Arrendamento dinheiro').getByTitle('Recebimentos e baixas').count(),0);
    assert.equal(await row('Arrendamento dinheiro').getByText('Não configurado',{exact:true}).count(),0);
    const kpis=await page.locator('.financeiro-kpi-grid').textContent();
    assert.ok(kpis.includes('85.000,00'),'Rent must not inflate global revenue');
    assert.ok(kpis.includes('60.000,00'),'Sales KPIs must be preserved');
    await page.getByLabel('Status dos contratos').selectOption('cumprido');
    assert.equal(await table.locator('tbody tr').count(),3);
    await page.getByLabel('Status dos contratos').selectOption('a_cumprir');
    assert.equal(await table.locator('tbody tr').count(),1);
    assert.ok((await table.textContent()).includes('Arrendamento misto'));
    await page.getByLabel('Status dos contratos').selectOption('nao_configurado');
    assert.equal(await table.getByText('Arrendamento misto',{exact:true}).count(),0);
    await page.getByLabel('Status dos contratos').selectOption('todos');
    await page.getByLabel('Buscar contratos no financeiro').fill('Proprietario Teste');
    assert.equal(await table.locator('tbody tr').count(),1);
    await page.getByLabel('Buscar contratos no financeiro').fill('');
    assert.equal(await page.locator('.financeiro-kpi-grid').textContent(),kpis,'List filters must not alter KPIs');
    await row('Arrendamento dinheiro').getByTitle('Editar arrendamento').click();
    await page.getByText('Editar Contrato',{exact:true}).waitFor();
    await page.getByTitle('Fechar',{exact:true}).click();
    await page.getByRole('button',{name:'Vendas',exact:true}).click();
    assert.equal(await table.getByText('Arrendamento dinheiro',{exact:true}).count(),0);
    await page.getByRole('button',{name:'Recebimentos',exact:true}).click();
    assert.equal(await table.getByText('Arrendamento dinheiro',{exact:true}).count(),0);
    await page.getByRole('button',{name:'Consolidado',exact:true}).click();
    await page.screenshot({path:path.join(out,'financeiro-arrendamentos-desktop.png'),fullPage:true});
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:900});
      const card=page.locator('.financeiro-contracts-section article').filter({hasText:'Arrendamento dinheiro'});
      assert.ok(await card.isVisible());
      assert.equal(await card.getByRole('button',{name:'Recebimentos',exact:true}).count(),0);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Finance overflow '+width);
      assert.ok(await page.locator('.financeiro-app-header').evaluate(header=>Array.from(header.querySelectorAll('button,a,h1')).every(el=>{
        const box=el.getBoundingClientRect();
        return box.left>=0 && box.right<=innerWidth;
      })),'Header controls clipped at '+width);
    }
    await page.locator('.financeiro-contracts-section').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,'financeiro-arrendamentos-mobile.png'),fullPage:true});
    await page.evaluate(()=>document.documentElement.classList.add('dark'));
    await page.screenshot({path:path.join(out,'financeiro-arrendamentos-dark.png'),fullPage:true});
    await page.goto('http://localhost:3000/milho25/financeiro');
    await page.getByText('Arrendamento safra anterior',{exact:true}).last().waitFor();
    assert.equal(await page.getByText('Arrendamento dinheiro',{exact:true}).count(),0);
    const removed=await page.goto('http://localhost:3000/milho26/despesas');
    assert.equal(removed.status(),404,'Expenses route must be removed');
    assert.deepEqual(expenseRequests,[]);
    assert.deepEqual(errors,[]);
    console.log('UI: Contratos preservados; arrendamentos no Financeiro, filtros, KPIs, edicao, safras, mobile e remocao de Despesas OK. Screenshots: '+out);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
