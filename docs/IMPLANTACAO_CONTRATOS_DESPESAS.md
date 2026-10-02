# Contratos e Despesas - primeira entrega

## Ativacao no Supabase

1. Faca um backup do banco antes de aplicar migracoes.
2. Execute docs/supabase_central_contratos.sql no SQL Editor do Supabase.
   Requer as tabelas das migracoes anteriores de contratos financeiros, barter e cumprimento.
3. Execute docs/supabase_despesas.sql.
   Reexecute mesmo se ja aplicou a primeira versao: a atualizacao de 02/10/2026
   substitui a funcao de gravacao, valida saldos por arquivo e aceita extratos vazios comprovados.
4. Entre no app autenticado e abra /milho26/contratos ou /milho26/despesas.
   As mesmas rotas funcionam com os identificadores das demais safras.

Os scripts sao idempotentes e nao apagam contratos, romaneios, baixas ou saldos.
Nao foram executados automaticamente no Supabase real. Testes SQL foram feitos em
PostgreSQL local (PGlite), com infraestrutura de auth/storage simulada.
O teste de navegador simula respostas do Supabase e nao grava dados de teste na producao.

## Contratos

- Central reaproveita cadastro, IDs e calculos existentes. Filtros da lista nao mudam KPIs.
- Cumprimento de venda depende da baixa; barter depende da alocacao em Saldos;
  misto exige ambos. Cadastro completo nao significa contrato cumprido.
- Arquivar apenas oculta na lista operacional da central. Nao estorna compromisso ou totais.
- Exclusao com historico e bloqueada no banco, inclusive para DELETE das telas antigas.
  O app usa RPC protegido: sem a migration, a exclusao fica indisponivel em vez de
  apagar historico por cascata.
- Arrendamento pode ter obrigacao em dinheiro, sacas ou ambas. Dinheiro nao entra
  em faturamento/recebiveis; pagamento integral e confirmado manualmente com data
  e observacao. Sacas cumprem pela alocacao existente. Nao ha contas a pagar novas.
- Nao ha reclassificacao automatica de contratos antigos.

## Despesas

Cada analise pertence ao usuario autenticado do app e a uma safra, com uma conta
bancaria confirmada. Use outra analise para outra conta. A troca de conta do Codex
nao muda a propriedade no Supabase; trocar o usuario de login do app muda.

Fluxo: titulo, um ou mais PDFs, confirmar conta/periodo, revisao dos movimentos e de cada
arquivo, salvar rascunho ou finalizar. O arquivo original e privado no Storage.
O texto original e preservado junto das correcoes na analise. Cada gravacao gera
uma versao imutavel; a tela abre a ultima. Concorrencia entre abas e detectada.

PDF.js e servido pelo proprio app (scripts/prepare-pdf.cjs, predev/prebuild).
Extracao ocorre no navegador; nenhum PDF e enviado para provedores de IA.
Limites: 20 MB/arquivo, 100 paginas/arquivo, 10 arquivos/analise, 10 mil movimentos
por analise. A lista de historico mostra as 100 analises recentes da safra.

Regras desta versao:
- Leitores para os layouts digitais fornecidos de Sicredi, Banco do Brasil, Cresol
  e Sicoob. Reconstrucao por coordenadas para historicos multilinha e colunas de valor/saldo.
  Sinais (+)/(-), +/- R$ e C/D tratados em centavos. Datas dd/mm usam somente o ano
  do periodo declarado, nunca o ano corrente por adivinhacao.
- Conta e periodo detectados no PDF. Documentos de contas diferentes nao se misturam.
  No BB sem periodo inicial declarado, e necessario preencher essa data manualmente.
- Leitura generica conservadora permanece para outros modelos com data dd/mm/aaaa,
  um valor monetario brasileiro e D/C ou sinal negativo. Colunas ambiguas exigem revisao.
- Saldos, limites de credito, resumos e lancamentos futuros nao viram despesas.
  Extratos sem movimentos so podem ser finalizados se a ausencia for comprovada
  pelo layout e pelos saldos. Nao equivale a aceitar uma falha de extracao como gasto zero.
- Sugestoes para pagamentos, tarifas, juros, entradas, aplicacoes e agendamentos.
  PIX/TED por si so nao prova despesa nem transferencia propria. Saques e estornos
  exigem validacao. Beneficiario nao e inventado a partir de uma descricao parcial.
- KPIs consideram apenas decisoes revisadas. Pendencias permanecem fora do gasto confirmado.
- Confirmacao em lote exige arquivo conferido, saldos consistentes e confirmacao
  explicita do usuario em um resumo. Respeita os filtros da lista. Possiveis duplicidades,
  estornos/debitos vinculados ainda pendentes e transferencias ambiguas ficam para revisao
  individual. Data e metodo da revisao ficam registrados. Nao ha aprovacao automatica.
- Saldos do documento sao comparados aos movimentos em centavos, inclusive apos edicoes;
  saldos diarios/sequenciais disponiveis tambem sao conferidos na leitura.
  Saldos gerais opcionais devem ser informados em conjunto. Divergencias bloqueiam
  finalizacao tanto no app quanto na funcao SQL. Isto nao e conciliacao contabil.
- Estorno de credito deve apontar debito incluido da mesma analise. Estornos
  parciais sao aceitos, mas a soma nao pode ultrapassar o debito.
- Arquivos identicos no lote sao bloqueados por SHA-256. Possiveis sobreposicoes
  com movimentos finalizados da mesma conta geram revisao, nunca exclusao silenciosa.
  Igualdade de data/descricao/valor nao e prova suficiente de duplicidade.
- Falhas por arquivo ficam no rascunho; reimporte ou retire explicitamente.
  Arquivos retirados sao identificados no relatorio.
- Cada relatorio tem seu proprio total. NAO somar totais de analises sobrepostas.
- Salvar nao cria despesas contabeis, compromissos, conciliacoes nem baixas financeiras.

## Limitacoes e proximas etapas

Seis PDFs reais validados localmente: Sicredi 279 movimentos efetivos e 2 futuros;
BB 4 e 0; Cresol 13; Sicoob 0 e 38. Total 334 movimentos, dois extratos vazios,
todos com saldo consistente. Testes no navegador simularam gravacao; nenhum desses
PDFs foi enviado a producao nem incorporado ao Git. Fixtures no repositorio sao ficticias.
Isso valida os modelos recebidos, nao todos os layouts possiveis desses bancos.

1. Novos layouts devem receber testes com amostras; nao presumir compatibilidade.
2. OCR de paginas digitalizadas e avaliacao de confianca. Hoje paginas sem texto
   bloqueiam a finalizacao; solicite extrato digital ao banco.
3. Regras reutilizaveis com previa de impacto e categorias confirmadas.
4. Rateio entre safras e devolucoes de periodos/analises anteriores.
5. Consolidacao canonica sem duplicidade entre analises, navegacao por versoes antigas,
   exclusao de analises e politica de retencao dos arquivos.
6. IA opcional somente apos definir provedor, privacidade e custo.

## Verificacao

- pnpm run test:contracts
- pnpm run test:despesas
- pnpm run test:bank-layouts
- pnpm run test:despesas-sql
- pnpm run build
- scripts/test-management-ui.cjs: requer Playwright e Microsoft Edge.
  PLAYWRIGHT_MODULE pode apontar para o modulo Playwright do runtime local.
  Servidor local esperado na porta 3000. Todas as requisicoes Supabase sao simuladas.
- scripts/test-bank-pdfs.cjs: recebe caminhos locais de um ou mais PDFs como argumentos.
  Usa a mesma configuracao Playwright; bloqueia acesso externo e simula o Supabase.
  Nao grava arquivos ou extracoes no repositorio nem imprime dados bancarios.

Testes cobrem centavos, datas invalidas, multiplas colunas, suspeitas de repeticao,
estornos, saldo, isolamento por usuario/safra, RPC atomico, controle de versao,
protecoes contratuais e percurso de PDF ate gravacao/reabertura simulada.

Aviso de manutencao preexistente: Next.js 14.1.0 foi sinalizado pelo gerenciador
como versao vulneravel. Planejar atualizacao em tarefa separada com regressao completa.
