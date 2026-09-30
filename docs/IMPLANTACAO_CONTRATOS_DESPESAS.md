# Contratos e Despesas - primeira entrega

## Ativacao no Supabase

1. Faca um backup do banco antes de aplicar migracoes.
2. Execute docs/supabase_central_contratos.sql no SQL Editor do Supabase.
   Requer as tabelas das migracoes anteriores de contratos financeiros, barter e cumprimento.
3. Execute docs/supabase_despesas.sql.
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

Fluxo: titulo/conta/periodo, um ou mais PDFs, revisao dos movimentos e de cada
arquivo, salvar rascunho ou finalizar. O arquivo original e privado no Storage.
O texto original e preservado junto das correcoes na analise. Cada gravacao gera
uma versao imutavel; a tela abre a ultima. Concorrencia entre abas e detectada.

PDF.js e servido pelo proprio app (scripts/prepare-pdf.cjs, predev/prebuild).
Extracao ocorre no navegador; nenhum PDF e enviado para provedores de IA.
Limites: 20 MB/arquivo, 100 paginas/arquivo, 10 arquivos/analise, 10 mil movimentos
por analise. A lista de historico mostra as 100 analises recentes da safra.

Regras desta versao:
- Leitura generica de linhas com data dd/mm/aaaa, um valor monetario brasileiro e
  indicador D/C ou valor negativo. Duas colunas monetarias exigem correcao humana.
- Sugestoes para pagamentos, tarifas, juros, entradas, aplicacoes e agendamentos.
  PIX/TED por si so nao prova despesa nem transferencia propria. Saques e estornos
  exigem validacao. Beneficiario nao e inventado a partir de uma descricao parcial.
- KPIs consideram apenas decisoes revisadas. Pendencias permanecem fora do gasto confirmado.
- Saldo inicial/final opcional permite conferencia aritmetica, nao conciliacao contabil.
  Informar ambos; havendo divergencia, finalizacao e bloqueada.
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

Enviar PDFs anonimizados de cada banco, mantendo estrutura, datas, valores e D/C.
O teste sintetico nao comprova compatibilidade com layouts reais.

1. Adaptadores por banco (incluindo colunas de saldo e historico em varias linhas).
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
- pnpm run test:despesas-sql
- pnpm run build
- scripts/test-management-ui.cjs: requer Playwright e Microsoft Edge.
  PLAYWRIGHT_MODULE pode apontar para o modulo Playwright do runtime local.
  Servidor local esperado na porta 3000. Todas as requisicoes Supabase sao simuladas.

Testes cobrem centavos, datas invalidas, multiplas colunas, suspeitas de repeticao,
estornos, saldo, isolamento por usuario/safra, RPC atomico, controle de versao,
protecoes contratuais e percurso de PDF ate gravacao/reabertura simulada.

Aviso de manutencao preexistente: Next.js 14.1.0 foi sinalizado pelo gerenciador
como versao vulneravel. Planejar atualizacao em tarefa separada com regressao completa.
