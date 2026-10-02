const path=require('node:path');
const assert=require('node:assert/strict');
const {reviewableSuggestions}=require('./load-ts.cjs')(path.join(__dirname,'../src/lib/despesasEngine.ts'));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const inputs=process.argv.slice(2);
if(!inputs.length) throw new Error('Provide local PDF paths. No original documents or extracted data are written to the repository.');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1400,height:1000}});
    const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'qa@example.invalid'};
    await context.addInitScript(session=>localStorage.setItem('sb-pohcuxyzdfctfpppnvxa-auth-token',JSON.stringify(session)),{access_token:'qa-local',refresh_token:'qa-local',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user});
    let captured=null;
    // All external requests are intercepted. The original PDFs never leave this machine.
    await context.route('**/*',async route=>{
      const req=route.request(),url=new URL(req.url());
      if(url.hostname==='localhost') return route.continue();
      if(!url.hostname.endsWith('.supabase.co')) return route.abort();
      let result=[];
      if(url.pathname.includes('/auth/')) result=user;
      else if(url.pathname.includes('/storage/')) result={Key:'test'};
      else if(url.pathname.endsWith('salvar_analise_despesas')) {captured=req.postDataJSON().p_dados;result='00000000-0000-4000-8000-000000000001';}
      else if(req.headers().accept?.includes('vnd.pgrst.object')) result=null;
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    const saveDraft=async()=>{
      const response=page.waitForResponse(r=>r.url().endsWith('/rpc/salvar_analise_despesas'));
      await page.getByRole('button',{name:'Salvar rascunho',exact:true}).click();
      await response;
      await page.getByRole('button',{name:'Salvar rascunho',exact:true}).waitFor();
    };
    const reports=[];
    for(const input of inputs) {
      captured=null;
      await page.goto('http://localhost:3000/milho26/despesas');
      await page.getByLabel('Título da análise').fill('Validacao local');
      await page.locator('input[type=file]').setInputFiles(path.resolve(input));
      await page.getByText('1 arquivos',{exact:false}).waitFor({timeout:90000});
      await saveDraft();
      assert.ok(captured,'RPC payload not captured');
      const doc=captured.documents[0],metadata=doc.statement;
      assert.ok(metadata,'No adapter detected');
      assert.deepEqual(doc.warnings,[]);
      assert.equal(metadata.balanceMatches,true);
      assert.equal(captured.movements.length,metadata.transactionCount);
      assert.equal(new Set(captured.movements.map(m=>m.id)).size,captured.movements.length,'Movement IDs must be unique within a file');
      assert.ok(captured.movements.every(m=>m.date && Number.isSafeInteger(m.cents) && m.cents>0 && m.direction!=='indefinido'));
      const batchButton=page.getByRole('button',{name:/Confirmar sugestões/});
      assert.equal(await batchButton.isDisabled(),true,'Unchecked source must block batch review');
      await page.getByRole('checkbox').check();
      const expected=reviewableSuggestions({...captured,documents:captured.documents.map(d=>({...d,verified:true}))},new Set(captured.movements.map(m=>m.id)));
      if(expected.length) {
        await batchButton.click();
        const dialog=page.getByRole('dialog',{name:'Revisão em lote'});
        await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
        await saveDraft();
        assert.equal(captured.movements.filter(m=>m.reviewed).length,0,'Cancel must not approve movements');
        await batchButton.click();
        await dialog.getByRole('button',{name:`Confirmar ${expected.length} ${expected.length===1?'movimento':'movimentos'}`,exact:true}).click();
        await saveDraft();
        assert.equal(captured.movements.filter(m=>m.reviewed && m.reviewMethod==='lote' && m.reviewedAt).length,expected.length);
        assert.ok(captured.movements.filter(m=>m.duplicateHint || m.decision==='revisar').every(m=>!m.reviewed));
      }
      if(metadata.emptyStatement) {
        if(!captured.periodStart) await page.getByLabel('Início do período').fill(captured.periodEnd.slice(0,8)+'01');
        await page.getByRole('button',{name:'Finalizar',exact:true}).click();
        await page.getByText('Análise finalizada.',{exact:true}).waitFor();
      }
      reports.push({bank:metadata.bank,movements:metadata.transactionCount,futures:metadata.futureCount,empty:metadata.emptyStatement,balanced:metadata.balanceMatches,batchReviewed:expected.length});
    }
    // Differing source accounts must never silently merge, even during bulk upload.
    if(inputs.length>1) {
      await page.goto('http://localhost:3000/milho26/despesas');
      await page.getByLabel('Título da análise').fill('Contas distintas');
      await page.locator('input[type=file]').setInputFiles(inputs.map(p=>path.resolve(p)));
      await page.getByText('Arquivos não processados',{exact:true}).waitFor({timeout:90000});
      await saveDraft();
      assert.ok(captured.importFailures.length>0);
      assert.equal(new Set(captured.documents.map(d=>d.statement.accountKey)).size,1);
    }
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow '+width);
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({reports,totalMovements:reports.reduce((s,r)=>s+r.movements,0),externalUploads:0},null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
