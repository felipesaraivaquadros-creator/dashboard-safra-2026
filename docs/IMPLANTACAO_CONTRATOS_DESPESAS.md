# Central de Contratos - implantacao

Atualizado em 05/10/2026. O nome deste arquivo foi mantido para preservar referencias
anteriores; o modulo Despesas foi removido por solicitacao do usuario.

## Ativacao no Supabase

1. Faca um backup do banco antes de aplicar migracoes.
2. Caso ainda nao tenha aplicado, execute docs/supabase_central_contratos.sql.
   Requer as tabelas das migracoes anteriores de financeiro, barter e cumprimento.
3. Entre no app autenticado e abra /milho26/contratos ou /milho26/financeiro.
   As mesmas rotas funcionam para as demais safras.

A correcao de visibilidade de arrendamentos nao requer SQL novo.
A migration da central e idempotente; nao apaga contratos, romaneios, baixas ou saldos.
O agente nao executou migracoes no Supabase real.

## Contratos e Arrendamentos

- A central reaproveita os cadastros, IDs e calculos existentes.
- Cadastro, edicao, detalhes, arquivamento/restauracao, CSV e exclusao protegida permanecem.
- Filtros da lista nao alteram os KPIs globais da safra.
- Arquivamento oculta na lista operacional, sem estornar compromissos ou totais.
- Contratos com historico nao podem ser excluidos, inclusive por telas antigas.
- No Financeiro > Consolidado, arrendamentos aparecem junto dos demais contratos.
- Arrendamento pode ter obrigacao em dinheiro, sacas ou ambas. O pagamento em dinheiro
  e confirmado pelo formulario, com data e observacao; graos cumprem por alocacao.
  Se houver as duas obrigacoes, ambas precisam estar atendidas.
- A lista mostra Cumprido ou A cumprir usando a mesma regra da Central de Contratos.
  Nao exibe Nao configurado por falta de preco de venda em um arrendamento.
- Valores de arrendamento nao compoem faturamento nem recebiveis de venda.
  As abas Vendas/Recebimentos e os KPIs existentes mantem sua logica.
- Nao ha reclassificacao automatica de contratos antigos.

## Despesas Descontinuado

Tela, menu, importacao de PDFs, analises bancarias e dependencia PDF.js foram removidos.
O endereco /[safraId]/despesas nao possui mais pagina (404).
Nao executar o antigo supabase_despesas.sql nem continuar o escopo antigo de OCR/IA.

As tabelas, analises e arquivos que eventualmente existam no Supabase foram preservados.
Nenhum dado bancario foi apagado. Uma limpeza definitiva do banco/storage exigiria
um pedido separado, com verificacao dos dados e backup.

## Verificacao Local

- pnpm run test:contracts
- pnpm run test:import-parser "<relatorio-ms-gestor.xls>" "<planilha-base.xlsx>"
- pnpm run build
- node scripts/test-management-ui.cjs

O teste de interface requer Microsoft Edge e Playwright (PLAYWRIGHT_MODULE pode apontar
para o modulo do runtime local), com servidor na porta 3000. Usa dados ficticios e
intercepta requisicoes externas, sem gravar no banco real. Cobre Contratos, arrendamentos
no Financeiro, filtros, edicao, KPIs, isolamento entre safras, mobile e ausencia de Despesas.

Aviso de manutencao preexistente: Next.js 14.1.0 tem alerta de seguranca.
Planejar atualizacao em tarefa propria com regressao completa.
