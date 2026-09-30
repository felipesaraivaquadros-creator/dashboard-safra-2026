# Proposta: Contratos e Despesas
Data: 30/09/2026
Status: aprovado pelo usuario. Implantacao incremental iniciada em 30/09/2026.
Este documento registra o escopo-alvo; consulte PROJECT_STATE.md e IMPLANTACAO_CONTRATOS_DESPESAS.md
para distinguir a primeira entrega das etapas ainda pendentes.

## Objetivo

Criar uma central de gestao dos contratos e uma tela de analise das saidas bancarias efetivamente realizadas. Manter o isolamento por safra, o tema claro/escuro, a paleta agro e a responsividade do app.

A tela Contratos reutilizara os contratos existentes, seus identificadores, formularios, romaneios, alocacoes, dados financeiros e baixas. A tela Despesas tera dados proprios de analise bancaria: importar um extrato nao criara contas a pagar, conciliacoes ou baixas no Financeiro.

## 1. Contratos

Rota proposta: /[safraId]/contratos. Novo item no menu principal.

### Estrutura da tela

1. Cabecalho com safra, botao Novo contrato e exportacao.
2. KPIs da safra: total de contratos, volume em graos (sc), cumpridos, pendentes e cadastros com informacoes pendentes.
3. Navegacao horizontal: Todos, Vendas, Trocas / Barter, Mistos, Arrendamento, Outros e Nao classificados.
4. Busca por nome, numero e contraparte; filtros por cadastro, entrega, situacao financeira e armazem.
5. Lista com numero/nome, contraparte, tipo, volume, valor conforme a operacao, situacoes e acoes.
6. Detalhe do contrato com dados gerais, componente de venda, componente de troca, entregas/alocacoes e parcelas/baixas quando aplicaveis.

No desktop, tabela compacta com detalhes expansivos. No celular, linhas empilhadas com os mesmos dados e acoes acessiveis. Cores do app, fundo claro/escuro e icones de editar, excluir, visualizar e exportar.

### KPIs e filtros

- Os KPIs superiores mantem o total da safra. A lista mostra separadamente quantidade e subtotal do recorte filtrado.
- Volume total soma apenas contratos expressos em sacas. Contratos exclusivamente em reais nao recebem volume ficticio.
- Valores de venda, valor economico de barter e obrigações de arrendamento recebem rotulos distintos; o faturamento global existente continua vindo do calculo compartilhado.
- Um contrato Misto aparece uma unica vez em Todos. Os seus componentes permanecem visiveis no detalhe.
- O alerta de cadastro incompleto nao significa contrato vencido ou nao entregue.

### Situacoes

Apresentar separadamente:
- Cadastro: completo ou informacoes pendentes.
- Entrega: conforme regra atual de alocacao/cumprimento, com os volumes reais.
- Financeiro: Baixado, Completo, Vencida ou pendencias, conforme o calculo compartilhado atual.

Para as abas de pendentes/cumpridos e KPIs de conclusao, preservar a regra aprovada: venda com Baixado; barter com Cumprido; misto com ambos. Completo significa dados completos, nao recebimento realizado. A pagina nova nao deve criar uma quarta formula de status.

### Arrendamento

Hoje nao existe um tipo proprio de arrendamento no modelo de contratos. A implantacao precisa adiciona-lo por migration e atualizar os pontos que tratam tipos.

Proposta inicial:
- Natureza da obrigacao: pagar em dinheiro, entregar graos ou ambos.
- Contraparte: proprietario/arrendador.
- Fazenda e area em hectares opcionais; safra obrigatoria.
- Volume em sacas apenas quando houver obrigacao em graos; valor em reais quando informado.
- Datas e observacoes; indicacao explicita do cumprimento aplicavel.
- Pagamento de arrendamento e uma obrigacao de saida e nao entra como venda, receita ou recebimento.
- Arrendamento em graos podera consumir saldos conforme alocacoes. O de dinheiro nao consome estoque.
- A primeira versao nao cria contas a pagar: cumprimento financeiro em dinheiro pode ser confirmado manualmente com data e observacao, separado das baixas de recebiveis existentes. Automatizacao posterior dependeria de nova aprovacao.
- Contratos antigos nao serao reclassificados pelo nome. O usuario faz a classificacao manual assistida.

A definicao de arrendamento esta incluida nesta proposta para aprovacao, pois afeta o significado de volume, recebimento e conclusao.

### Cadastro, edicao e exclusao

- Reutilizar e adaptar o formulario atual, mostrando campos aplicaveis ao tipo.
- Alteracao de tipo preserva informacoes anteriores e explicita o impacto nos totais.
- Contrato sem movimentacoes vinculadas pode ser excluido mediante confirmacao.
- Quando houver romaneios, alocacoes, parcelas, baixas ou historico relevante, bloquear exclusao destrutiva e oferecer arquivamento.
- Arquivar esconde o registro da lista operacional padrao, preservando vinculos e calculos historicos. Nao significa cancelar volume, receita ou recebimento.
- Cancelamento com reversao de compromissos nao esta incluido nesta primeira entrega.

### Integracao

- O menu passa a conter Contratos, mantendo Saldos para estoque e alocacoes.
- Os atalhos de Saldos, Dashboard e Financeiro poderao abrir o mesmo contrato na nova central.
- Acoes existentes continuam acessiveis durante a transicao; nao recriar nem duplicar contratos.
- Adicionar novos campos opcionais e a classificacao arrendamento preservando registros existentes.

## 2. Despesas

Rota proposta: /[safraId]/despesas. Novo item no menu principal.
Objetivo: enxergar quanto saiu efetivamente das contas para pagamentos, com rastreabilidade ate o extrato.

A tela e uma analise de caixa. Ela nao calcula automaticamente custo de producao, regime de competencia ou lucro contabil a partir apenas do extrato.

### Estrutura da tela

1. Cabecalho: Despesas, safra, Nova analise e exportacao.
2. KPIs do recorte: pagamentos considerados, devolucoes vinculadas e gasto liquido; itens a revisar aparecem em alerta separado.
3. Filtros: periodo, conta/banco, favorecido e categoria quando confirmada.
4. Abas: Pagamentos, Por favorecido, Revisao e Analises salvas.
5. Lista padrao de pagamentos, do maior valor para o menor; desempate por data.
6. Ranking horizontal por favorecido e, posteriormente, evolucao mensal.

Exemplo ficticio de lista:
- R$ 10.000,00 | Fornecedor Agro
- R$ 5.000,00 | Sementeagro
- R$ 3.000,00 | Diesel TRR
- R$ 2.000,00 | Diesel TRR
- R$ 500,00 | Delvino

A visao Por favorecido agrupa Diesel TRR em R$ 5.000,00, preservando os dois pagamentos na lista detalhada. A identificacao de um favorecido usara CPF/CNPJ quando disponivel; nomes parecidos so serao agrupados mediante revisao ou regra confirmada. O texto original permanece acessivel.

### Fluxo de uso

1. Selecionar um ou varios PDFs na mesma analise.
2. Confirmar conta(s), periodo encontrado e safra de destino.
3. Processar paginas, extrair movimentacoes e executar regras.
4. Apresentar pre-analise com incluidos, excluidos e itens a revisar.
5. Revisar as excecoes e confirmar o resumo.
6. Gravar a analise finalizada e disponibilizar consulta e exportacao.

A leitura deve ser tolerante a falha de um arquivo: exibir o estado de cada PDF, permitir nova tentativa e indicar se o conjunto esta incompleto. Resultados parciais nao podem parecer a analise completa.

A safra aberta sera a sugestao, nao uma inferencia baseada na data do extrato. Se houver gastos de varias safras, oferecer atribuicao individual ou rateio confirmado; a soma das atribuicoes nunca pode exceder a movimentacao. Itens sem safra definida ficam a revisar.

### Leitura dos PDFs e papel da IA

Recomendacao: extracao de texto para PDFs digitais, OCR para paginas digitalizadas e IA como apoio a identificacao de layouts e historicos ambiguos.

- Valores, datas, debito/credito e totais passam por validacoes deterministicas.
- Calcular valores em centavos inteiros ou decimal exato; aceitar dd/mm/aaaa, virgula decimal, ponto de milhar, sinais e marcadores D/C.
- Ignorar cabecalhos, saldos e subtotais na lista de transacoes.
- PDFs com senha, ilegibilidade ou layout desconhecido retornam uma pendencia clara; nao inventar favorecidos ou completar valores por estimativa.
- Cada resultado deve apontar arquivo, pagina e trecho de origem.
- IA sugere classificacoes; nao finaliza sozinha casos duvidosos nem recalcula os totais em linguagem natural.
- Texto dentro do PDF sera tratado como dado, nunca como instrucao para o modelo ou para o sistema.
- A configuracao exata do leitor deve ser validada com amostras reais dos bancos usados pelo usuario antes de prometer suporte geral.
- Se um provedor externo de IA/OCR for escolhido, informar seu uso, custo e dados enviados antes de ativa-lo; manter credenciais no servidor.
- Processamento de lotes precisa de progresso persistido e retomada; OCR pesado pode exigir um worker, a definir apos medir amostras e limites do ambiente de hospedagem.

Nao e necessario incluir um chat de IA no app para oferecer esse fluxo.

### Motor de filtros e tratamentos

| Situacao | Tratamento proposto |
| --- | --- |
| Pagamento efetivado com debito identificado | Incluir como pagamento candidato; favorecido/categoria incertos ficam marcados para revisao. |
| Credito por venda, emprestimo recebido ou outra entrada | Fora do total de despesas; manter no historico bruto. |
| Debito estornado integralmente | Manter pagamento e estorno vinculados; efeito liquido zero. |
| Devolucao parcial | Abater apenas o valor comprovadamente devolvido; preservar valor original e saldo liquido. |
| Estorno sem debito identificado | Revisao; nao abater de uma despesa arbitraria. |
| Debito posterior estornando um credito | Revisao especifica: o sinal negativo sozinho nao prova pagamento a fornecedor. |
| Transferencia entre contas proprias confirmadas | Excluir de despesa; preservar a movimentacao bancaria. PIX/TED sozinho nao e motivo para excluir. |
| Aplicacao ou resgate identificado | Separar como movimentacao financeira; nao tratar automaticamente como despesa/receita operacional. |
| Saque ou favorecido nao identificado | A revisar; nao presumir destino ou categoria. |
| Pagamento de fatura de cartao | Mostrar como saida para cartao; nao inventar lojas. Se houver detalhe futuro, escolher uma base para evitar dupla contagem. |
| Parcela de financiamento | Mostrar como desembolso identificado; separar categoria, sem inferir principal/juros ausentes. |
| Tarifa/juros efetivamente debitados | Incluir se identificados, com categoria correspondente. |
| Saldo inicial/final, limite, total da pagina | Nao e transacao; excluir da lista. |
| Lancamento futuro/agendado | Excluir do gasto realizado. |
| Arquivo identico reenviado | Reconhecer pelo conteudo e impedir importacao duplicada. |
| Periodos sobrepostos em varios PDFs | Cruzar conta, identificador bancario quando existir, data, direcao, valor e contexto. |
| Mesmo favorecido, data e valor | Apenas suspeita; preservar pagamentos legitimos repetidos quando nao houver identificador suficiente. |

### Revisao e qualidade

- Tres estados de decisao: Incluir, Excluir com motivo e A revisar.
- Separar erro de leitura de duvida sobre a natureza do gasto.
- Permitir corrigir interpretacao de valor/data, favorecido e categoria mantendo o texto extraido original.
- Permitir confirmar/excluir itens em grupo por regra, com previa do impacto.
- Uma regra so se torna reutilizavel quando o usuario confirma; restringi-la por conta/banco e criterios suficientes.
- Mostrar incluidos, entradas, transferencias, estornos, duplicados confirmados e pendencias.
- Conferencia matematica de saldo inicial + creditos - debitos = saldo final, quando o PDF fornecer saldos e periodo completos. Isso e uma checagem da leitura, sem conciliacao com o Financeiro.
- Se o documento nao permitir a conferencia, mostrar "Conferencia de saldo indisponivel".
- Divergencias materiais e valores sem leitura confiavel impedem finalizar como revisado; salvar rascunho continua permitido.

### Regra dos totais

Pagamentos considerados = soma dos debitos efetivos incluidos, unicos e atribuidos a safra.
Devolucoes vinculadas = creditos confirmados que devolvem esses pagamentos.
Gasto liquido = pagamentos considerados - devolucoes vinculadas.

Exemplo: debito de R$ 3.000,00 e devolucao confirmada de R$ 500,00 geram pagamento de R$ 3.000,00 e gasto liquido de R$ 2.500,00.

A visao por periodo segue a data real de cada movimento. Se uma devolucao aparecer em outro mes, registrar o ajuste no mes da devolucao, ligando-o ao pagamento original. Um resumo por pagamento pode mostrar o valor liquido acumulado, com esse periodo explicitado. Nao reescrever relatorios anteriores silenciosamente.

Itens a revisar nao entram como despesas confirmadas. Durante a revisao, o total e preliminar e o valor ainda nao classificado permanece visivel.

### Persistencia no Supabase

Estrutura logica proposta, a detalhar em SQL apos aprovacao:
- Arquivos de extrato: conta, periodo, hash do conteudo, estado de processamento e arquivo privado.
- Movimentacoes bancarias: registro canonico com dados originais, valor, direcao, referencia e evidencias de origem.
- Analises e versoes: safra, periodo, estado, totais, autor e momento da finalizacao.
- Decisoes da analise: inclusao/exclusao, motivo, vinculos de estorno e atribuicao/rateio por safra.
- Regras confirmadas: criterios e historico de aplicacao.

Varias analises podem referenciar a mesma movimentacao sem duplica-la nos totais consolidados. O Dashboard de Despesas usa os movimentos unicos e as decisoes vigentes; nao soma os totais de relatorios salvos sobrepostos.

PDFs e transacoes serao privados, com controle de acesso por usuario/organizacao e safra. Chaves administrativas nao irao para o navegador. Exclusao de uma analise nao apaga movimentos ou arquivos ainda utilizados por outra.

Reprocessamento cria nova versao, preserva revisoes manuais ou aponta conflito e nao altera silenciosamente um resultado finalizado. Exportacao em PDF/CSV identifica periodo, contas, safra, filtros e versao.

## 3. Ordem recomendada

1. Implantar a tela Contratos usando a base atual; adicionar arrendamento e arquivamento com as regras aprovadas; validar integracao com Saldos, Dashboard e Financeiro.
2. Receber amostras dos PDFs usados, definir leitores e implementar a pre-analise de Despesas com tratamento numerico, origem e revisao.
3. Implementar persistencia privada, deduplicacao entre arquivos/analises, historico e exportacao; entregar o fluxo completo de upload ate consulta.
4. Ampliar layouts de bancos e OCR/IA conforme as amostras; validar custos e infraestrutura antes de ativar servicos externos.

A primeira entrega operacional de Despesas deve incluir gravacao e reabertura; nao entregar uma analise que desaparece ao atualizar a pagina.

## 4. Criterios de aceite

- Mesmos contratos e status nas telas Contratos, Saldos, Dashboard e Financeiro, sem duplicacao de registros.
- Contratos mistos contados uma vez; arrendamento nao aumenta receita de venda nem usa baixa de recebivel.
- Confirmacao de exclusao e preservacao de historico vinculado.
- Numeros em formato brasileiro interpretados sem alterar casas decimais.
- Creditos comuns, saldos e agendamentos fora das despesas.
- Estorno integral, parcial, de credito e sem origem tratados conforme regras.
- Arquivo reenviado e extratos sobrepostos nao duplicam gastos; dois pagamentos legitimos iguais permanecem.
- Troca de safra nunca mostra transacoes de outra safra sem atribuicao confirmada.
- Falha de leitura nao produz total definitivo silenciosamente.
- Analise salva reabre com as mesmas decisoes, documentos e versao.
- Mobile e temas claro/escuro verificados com exemplos reais antes da publicacao.

## Referencias tecnicas consultadas

- PDF.js, Mozilla: https://github.com/mozilla/pdf.js
- Tesseract OCR, documentacao oficial: https://tesseract-ocr.github.io/tessdoc/
- Supabase Storage e controle de acesso: https://supabase.com/docs/guides/storage/security/access-control

Essas referencias fundamentam a viabilidade de leitura e armazenamento. PDF.js foi selecionado
para a primeira entrega. OCR e IA continuam pendentes das amostras e da definicao de privacidade/custos.
