# PROJECT_STATE.md

## Projeto

Painel Safra

## Localização Atual

C:\Users\USER\Downloads\Telegram Desktop\Nova pasta (3)\DASHBOARD\Painel Safra

## Stack Tecnológica

* Next.js 14
* TypeScript
* Supabase
* Vercel
* Git configurado
* Repositório remoto: dashboard-safra-2026

## Estrutura Atual do Projeto

O sistema é um painel de gestão de safra.

Originalmente, o fluxo era totalmente local:

1. Usuário exportava uma planilha.
2. Um arquivo JSON realizava a normalização dos dados.
3. O aplicativo consumia os dados já normalizados.
4. As safras anteriores permaneciam gravadas no banco de dados e serviam como histórico.

## Nova Evolução do Sistema

Foi criada uma funcionalidade de importação direta de planilhas pelo próprio aplicativo hospedado na Vercel.

Novo fluxo desejado:

1. Usuário acessa o aplicativo.
2. Faz upload da planilha de romaneios.
3. O sistema lê a planilha.
4. O sistema identifica e normaliza os dados automaticamente.
5. O sistema grava as informações no Supabase.
6. A safra fica imediatamente disponível no painel.
7. O processo deve funcionar tanto para a safra atual quanto para futuras safras.

## Objetivo Atual

Validar e estabilizar a funcionalidade de importação direta de planilhas antes de disponibilizar definitivamente em produção.

## Diagnóstico Inicial Realizado

Foi identificado que:

* O projeto estava compilando.
* O Git estava limpo, sem alterações pendentes.
* O Supabase está conectado em:

src/integrations/supabase/client.ts

* Não existe arquivo .env.
* URL e chave pública do Supabase estão escritas diretamente no código.

Recomendação futura:
Mover as credenciais para variáveis de ambiente.

## Alterações Já Realizadas

### Correções na Importação

* Correção da rota:

app/[safraId]/importar

* Correção de importação incorreta de componentes.
* Correção de erros de JSX.
* Correção de atributo inválido em checkbox que quebrava o TypeScript.
* Correção do auto-mapeamento inicial da planilha.

### Ajustes de Persistência

Preparação dos dados antes do envio ao Supabase:

* Criação ou atualização de Fazendas.
* Criação ou atualização de Armazéns.
* Criação ou atualização de Contratos.
* Conversão de nomes para:

  * fazenda_id
  * armazem_id
  * contrato_id
* Envio para a tabela de romaneios somente dos campos esperados pelo banco.

## Arquivos Alterados

* app/[safraId]/importar/page.tsx
* src/components/msgestor/useMSgestorImport.ts
* src/components/msgestor/DataReviewStep.tsx
* src/components/msgestor/types.ts
* src/components/ImportExcelButton.tsx

## Ambiente de Testes

Aplicação executada localmente em:

http://localhost:3000/soja2526/importar

Inicialmente houve redirecionamento para /login.

Após autenticação, foi realizado teste de upload de planilha.

## Problema Encontrado

Mensagem exibida:

"Nenhum romaneio com volume líquido encontrado na aba."

## Investigação Realizada

Foi identificado que:

* O erro não veio da nova tela de importação.
* O erro veio do botão antigo:

src/components/ImportExcelButton.tsx

Esse fluxo antigo dependia de nomes exatos de colunas e descartava registros quando não encontrava a coluna esperada de volume líquido.

## Hipóteses Identificadas

A planilha pode utilizar variações de cabeçalho como:

* Peso Líquido
* Peso Liquido
* PesoL
* Pesol
* Peso Liquido Kg
* Outras variações semelhantes

Além disso, algumas planilhas podem possuir apenas peso líquido em quilogramas e não apresentar o valor em sacas.

## Melhorias Implementadas

Foi iniciada a reescrita do ImportExcelButton para:

* Ignorar diferenças de:

  * acentos
  * maiúsculas/minúsculas
  * espaços

* Converter números com vírgulas corretamente.

* Aceitar múltiplos nomes de cabeçalho.

* Calcular:

sacasLiquida = pesoLiquidoKg / 60

quando a planilha possuir somente peso líquido em quilogramas.

## Situação Atual

* Helpers novos foram inseridos.
* Parte da lógica de leitura foi substituída.
* O arquivo ImportExcelButton.tsx foi reescrito para ficar mais robusto.
* A verificação de TypeScript:

npx tsc --noEmit --pretty false

foi concluída sem erros.

## Pendência Atual

Ainda não foi possível:

* Finalizar validação do upload.
* Executar testes completos de importação.
* Confirmar a gravação dos romaneios no Supabase.

A sessão do Codex foi interrompida por limite de uso antes da conclusão dos testes.

## Próximos Passos

1. Abrir o projeto.
2. Ler este arquivo de contexto.
3. Revisar ImportExcelButton.tsx.
4. Executar a aplicação localmente.
5. Testar importação com planilha real.
6. Verificar:

   * leitura das colunas;
   * cálculo das sacas;
   * registros gerados;
   * persistência no Supabase;
   * comportamento para múltiplas safras.
7. Somente após validação completa:

   * realizar commit;
   * enviar alterações para GitHub;
   * publicar na Vercel.

## Atualização da Sessão - 2026-06-26

O usuário informou o cabeçalho real exportado pelo MS Gestor:

Data, Tipo NF, Nº, NFe, Emitente, Destinatário, Placa, Motorista, Cidade de Entrega, Armazem, Contrato, ncontrato, Venc., Safra, Fazenda, Talhão, Peso Bruto, Umid, Impu, Ardi, Avari, Contaminantes, Quebr, Peso Liquido, Sacas Bruto, Sacas Liquido, precofrete.

Alterações realizadas nesta sessão:

* `src/components/ImportExcelButton.tsx`
  * Melhorado o parser numérico para aceitar `50.414` como 50414 e `2,50` como 2.5.
  * A escolha da aba agora compara nomes normalizados e, se a aba esperada não existir, usa a primeira aba da planilha.
  * Adicionado suporte explícito para `Sacas Liquido`, `Sacas Líquido`, `Sacas Liquidos`, `Sacas Líquidos`, `SacasLiquido`, `Sc Liquido` e `Sc Líquido`.
  * O fluxo continua calculando `sacasLiquida = pesoLiquidoKg / 60` quando a planilha não traz sacas líquidas.

* `src/components/msgestor/useMSgestorImport.ts`
  * Criado auto-mapeamento normalizado para o cabeçalho real do MS Gestor.
  * Campos reconhecidos automaticamente: Data, Tipo NF, Nº, NFe, Emitente, Placa, Motorista, Cidade de Entrega, Armazem, Contrato, ncontrato, Safra, Fazenda, Talhão, Peso Bruto, Peso Liquido, Sacas Bruto, Sacas Liquido, Umid, Impu, Ardi, Avari, Contaminantes, Quebr e precofrete.
  * Corrigida a conversão numérica para não transformar valores com ponto de milhar em decimal.
  * O mapeamento salvo no localStorage agora é aplicado imediatamente ao processar a planilha.
  * Para `milho26`, quando a planilha tiver várias abas, a importação agora procura a aba `ROMANEIOS_MILHO`. Se a aba esperada não existir, usa a primeira aba, preservando compatibilidade com o cenário futuro de arquivo com aba única.
  * Evolução posterior: o fluxo agora possui uma etapa intermediária de seleção de aba. Após o upload, o sistema lista todas as abas do Excel e o usuário escolhe qual aba importar antes de seguir para o mapeamento. A aba sugerida continua respeitando a safra (`ROMANEIOS_MILHO` para `milho26`), mas o usuário pode trocar.

* `src/components/msgestor/SheetSelectionStep.tsx`
  * Novo componente criado para listar as abas encontradas no Excel e permitir a seleção manual da aba que será processada.

* `src/components/msgestor/MSgestorImport.tsx`
  * Fluxo atualizado de 5 para 6 etapas: upload, escolha de aba, mapeamento, revisão, salvamento e conclusão.

* `src/components/msgestor/ColumnMappingStep.tsx`
  * Corrigida a validação do botão de continuar para verificar campos de destino mapeados (`data`, `nfe` ou `numero_romaneio`), e não nomes fixos de colunas de origem.

* `src/components/msgestor/types.ts`
  * Campo `contaminantes` adicionado às opções de mapeamento.

* `src/lib/supabaseSync.ts`
  * Passou a verificar erros retornados pelo Supabase em upserts/selects/deletes de apoio.
  * Contratos encontrados na planilha agora também são criados/atualizados antes de gravar romaneios.
  * Mapas de fazenda, armazém e contrato agora usam chave normalizada para reduzir falhas por espaço, caixa ou `.0`.

Validações executadas:

* `npx tsc --noEmit --pretty false` concluído sem erros.
* Simulação local com cabeçalho contendo `Peso Liquido`, `Sacas Liquido` e `precofrete`:
  * `Peso Liquido = 50.414` foi interpretado como 50414 kg;
  * `Sacas Liquido` vazio gerou 840.23 sacas;
  * `precofrete = 2,50` foi interpretado como 2.5;
  * `Nº = 123` foi interpretado como 123.
* Criada planilha local de teste multiabas em `C:\Users\USER\Documents\Codex\2026-06-26\ac\work\ms-gestor-milho26-multiabas.xlsx`, com a aba correta `ROMANEIOS_MILHO` após uma aba inicial de descarte, para validar o comportamento atual do arquivo MS Gestor.
* Após a implementação da seleção manual de aba, `npx tsc --noEmit --pretty false` foi executado novamente e concluído sem erros.
* Teste real no navegador local com `milho26`:
  * planilha carregada;
  * revisão exibiu 113 romaneios;
  * verificação de duplicatas no banco manteve 113 válidos, 0 duplicados e 0 erros;
  * 113 romaneios foram selecionados para salvar;
  * tentativa de gravação no Supabase falhou com: `there is no unique or exclusion constraint matching the ON CONFLICT specification`.
* Criado `docs/supabase_import_constraints.sql` com SQL para adicionar as constraints necessárias aos `upsert`.
* Ao executar as constraints, o Supabase retornou duplicata existente em `romaneios`: `(safra_id, nfe, numero_romaneio, data, placa)=(milho25, 142, 49028, 2025-07-17, MLT2D28)`.
* Após revisão do usuário, a regra de duplicidade foi alterada para: safra + número do romaneio + número da NF + peso bruto.
* `src/components/msgestor/useMSgestorImport.ts` atualizado para:
  * gerar `_uniqueKey` com `safra_id`, `numero_romaneio`, `nfe` e `peso_bruto_kg`;
  * verificar duplicatas no banco por esses campos;
  * fazer `upsert` em `romaneios` com `onConflict: 'safra_id,numero_romaneio,nfe,peso_bruto_kg'`.
* `docs/supabase_import_constraints.sql` atualizado para criar `romaneios_import_key` em `(safra_id, numero_romaneio, nfe, peso_bruto_kg)`.
* `docs/supabase_dedupe_before_constraints.sql` atualizado para revisar duplicatas pelo novo critério.
* Após a alteração da regra de duplicidade, `npx tsc --noEmit --pretty false` foi executado novamente e concluído sem erros.
* Depois que o usuário executou o SQL atualizado no Supabase, a gravação real foi testada novamente na tela `/milho26/importar`.
* Resultado final da integração Supabase para `milho26`:
  * 113 romaneios salvos com sucesso;
  * 0 erros;
  * tela exibiu `Importação Concluída!`.

Pendências após esta sessão:

* Testar com a planilha real exportada do MS Gestor.
* Confirmar visualmente se o auto-mapeamento da tela `/[safraId]/importar` seleciona todos os campos esperados.
* Salvamento real no Supabase para `milho26` concluído com sucesso em teste local.
* Antes de tentar salvar novamente, executar no Supabase SQL Editor o arquivo `docs/supabase_import_constraints.sql`.
* Se a criação de constraints falhar por duplicatas no novo critério, executar primeiro `docs/supabase_dedupe_before_constraints.sql`, revisar os resultados e só então rodar o bloco de DELETE comentado.
* Confirmar se a substituição completa da safra pelo `ImportExcelButton` antigo é o comportamento desejado antes de usar em produção.
* Rodar `npm run build` até o fim antes de commit/deploy. Um build foi iniciado nesta sessão, mas foi interrompido pelo usuário antes de concluir.

Observação importante:

O banco Supabase possui as colunas `peso_liquido_kg` e `peso_liquid_kg`, mas os dados atuais consultados estão preenchidos em `peso_liquid_kg`. Por isso o código manteve `peso_liquid_kg` para compatibilidade com o painel atual.
## Atualizacao da Sessao - continuidade 2026-06-26

Ordem combinada com o usuario apos a gravacao Supabase:

1. Validar dashboard e rotas principais.
2. Rodar build.
3. Revisar diff.
4. Preparar commit/deploy somente depois da validacao.

Validacoes ja realizadas:

* `/milho26` abriu localmente e mostrou 113 cargas, 98.785 sc e 5.927.100 kg.
* `/milho26/saldos` abriu localmente e mostrou estoque fisico por armazem totalizando 5.927.100 kg / 98.785 sc.
* `/milho26/fretes` abriu localmente sem erros visiveis.
* `/milho26/importar` abriu localmente mostrando o fluxo do MS Gestor.
* A importacao real de `milho26` gravou 113 romaneios no Supabase com 0 erros.

Revisao em andamento:

* `git diff --check` nao encontrou erro de whitespace; exibiu somente avisos normais de LF/CRLF no Windows.
* `tsconfig.tsbuildinfo` apareceu como artefato de build e foi adicionado ao `.gitignore`.
* Durante a revisao foi ajustado o recalculo de linhas quando o usuario altera manualmente o mapeamento de colunas, para evitar manter valores antigos no objeto visual da linha.
* Apos esse ajuste, um `npm run build` acusou erro de TypeScript porque `_rowIndex` e `safra_id` nao estavam sendo preservados no remapeamento.
* O erro foi corrigido preservando `_rowIndex`, `safra_id` e `_message` ao recalcular `mapped`.

Proximo passo imediato:

* `npm run build` foi executado novamente e passou com sucesso.
* Proximo passo: revisar `git diff --stat`, conferir arquivos staged e preparar o commit com os arquivos de codigo, SQL e documentacao.

## Atualizacao da regra de atualizacao incremental - 2026-06-26

O usuario confirmou que, dentro da mesma safra, nao existira o mesmo numero de romaneio para o mesmo numero de nota fiscal.

Decisao aplicada:

* A chave de importacao/atualizacao de `romaneios` passa a ser somente `safra_id + numero_romaneio + nfe`.
* `peso_bruto_kg` deixa de fazer parte da chave, pois e um dado mutavel.
* Quando um romaneio vier primeiro com peso zerado e depois com peso preenchido, o app deve atualizar o registro existente em vez de criar um novo.
* O `onConflict` do Supabase foi alterado para `safra_id,numero_romaneio,nfe`.
* A verificacao visual de duplicidade no app tambem foi alinhada para a mesma chave.
* `docs/supabase_import_constraints.sql` foi atualizado para recriar `romaneios_import_key` em `(safra_id, numero_romaneio, nfe)`.
* `docs/supabase_dedupe_before_constraints.sql` foi atualizado para revisar duplicatas pelo mesmo criterio de 3 campos.
* `npm run build` foi executado apos a alteracao e passou com sucesso.

## Atualizacao Supabase - duplicata historica milho25

Ao tentar recriar `romaneios_import_key` com `(safra_id, numero_romaneio, nfe)`, o Supabase retornou duplicidade historica em:

* `(safra_id, numero_romaneio, nfe) = (milho25, 49028, 142)`.

Conclusao:

* A regra nova continua correta para importacao incremental.
* Antes da constraint, o banco precisa colapsar duplicados antigos pela nova chave.
* `docs/supabase_dedupe_before_constraints.sql` foi ajustado para manter a linha mais completa/recente:
  * peso bruto preenchido primeiro;
  * peso liquido preenchido depois;
  * `created_at` mais novo;
  * maior `id`.
* `docs/supabase_import_constraints.sql` agora interrompe com mensagem clara se ainda houver duplicados, orientando rodar o dedupe primeiro.

## Atualizacao de fluxo oficial - planilhas pelo app

O usuario definiu que a planilha base do MS Gestor sera a fonte oficial para todas as safras.

Decisoes aplicadas:

* O fluxo operacional por JSON local esta descontinuado.
* O painel deve consumir dados do Supabase.
* A entrada de romaneios passa a ser feita pela tela `/[safraId]/importar`.
* O botao antigo de sincronizacao do banco a partir de JSON local foi removido do painel.
* Ao importar, linhas ja existentes no banco por `safra_id + numero_romaneio + nfe` devem ser atualizadas, nao bloqueadas como duplicadas.
* Duplicatas dentro da propria planilha sao consolidadas antes da gravacao, mantendo a linha mais completa.
* A gravacao agora procura registros existentes por chave, atualiza por `id`, insere somente quando nao existe e remove duplicatas antigas encontradas para a mesma chave importada.
* A tabela `saldos` e recalculada apos cada importacao com base nos romaneios gravados da safra.
* A tela de fretes foi ajustada para exibir Motorista, Placa, Peso Bruto kg e Sacas Bruto a partir do banco.
* Criado `docs/supabase_reset_safras_for_reimport.sql` para limpar safras selecionadas antes de reimportar as planilhas oficiais pelo app.

## Atualizacao CRUD financeiro - 2026-06-30

O usuario informou erro ao gravar novo abastecimento e pediu um fluxo profissional para adicionar, editar e remover abastecimentos e adiantamentos em qualquer safra.

Diagnostico:

* `abastecimentos` nao possuia a coluna `produto`, mas o formulario tentava gravar `produto`.
* Uma tentativa controlada de insert com a chave publica retornou RLS: `new row violates row-level security policy`.
* As telas devem considerar o Supabase como fonte oficial para todas as safras.

Alteracoes:

* `src/components/descontos/AbastecimentoForm.tsx` foi recriado com validacao, suporte a numero com virgula/ponto, mensagens melhores e fallback quando `produto` ainda nao existir no banco.
* `src/components/descontos/AdiantamentoForm.tsx` foi recriado com validacao e suporte a numero com virgula/ponto.
* `app/[safraId]/descontos/page.tsx` passou a exibir erros de exclusao com detalhe do banco e formatar numeros nulos de forma segura.
* Criado `docs/supabase_finance_crud_policies.sql` para:
  * adicionar `abastecimentos.produto`;
  * habilitar RLS;
  * conceder select/insert/update/delete para usuarios autenticados;
  * criar politicas CRUD para `adiantamentos` e `abastecimentos`.

## Atualizacao calculo abastecimento e fretes - 2026-07-01

Pedido atual do usuario:

* Corrigir o calculo do total em novo abastecimento.
* Permitir selecionar mais de um motorista na configuracao de fechamento de fretes.
* Atualizar este arquivo antes de encerrar a sessao.
* Depois destes pontos, o proximo passo sera evoluir a logica de preco de frete para permitir preco por motorista e cidade, editavel e salvo no banco.

Alteracoes aplicadas:

* `src/components/descontos/AbastecimentoForm.tsx`
  * Corrigido o parser numerico para nao tratar ponto decimal como separador de milhar quando nao ha virgula.
  * Exemplo validado: `529` litros x `6.65` ou `6,65` agora calcula `3517.85`, exibindo `R$ 3.517,85`.

* `src/components/descontos/AdiantamentoForm.tsx`
  * Aplicada a mesma normalizacao numerica para manter o padrao dos formularios financeiros.

* `src/lib/useFretesData.ts`
  * O filtro de motorista passou de valor unico para lista de motoristas.
  * Lista vazia continua significando todos os motoristas.
  * Fretes, adiantamentos e abastecimentos do relatorio agora respeitam a selecao multipla.

* `src/components/fretes/FiltrosFrete.tsx`
  * O campo Motorista foi substituido por uma selecao multipla com checkboxes.
  * Adicionados atalhos para selecionar todos e limpar.

* `app/[safraId]/fretes/page.tsx`
  * A pagina foi ajustada para usar a selecao multipla.
  * O cabecalho de impressao mostra todos os motoristas selecionados.

* `src/components/fretes/AcoesRelatorio.tsx`
  * Exportacao Excel passou a incluir a coluna Motorista.
  * Geracao de recibo passou a usar `URLSearchParams`, evitando problemas quando ha varios nomes no parametro.
  * Nome do arquivo exportado agora e sanitizado quando houver varios motoristas.

Status desta atualizacao:

* Edicoes feitas.
* Teste numerico validado: `529 x 6,65 = 3517,85`.
* `git diff --check` executado sem erros finais.
* `npm run build` executado com sucesso.
* Proximo passo operacional: commit e push para o GitHub.

## Atualizacao preco de frete por motorista e cidade - 2026-07-01

Pedido do usuario:

* Evoluir a logica de preco de frete para todas as safras.
* Cada motorista deve poder ter seu proprio preco por cidade.
* Os valores devem ser editaveis e gravaveis no banco.

Decisao aplicada:

* A tabela `precos_frete` passa a trabalhar com a chave `safra_id + motorista + cidade`.
* O app procura o preco nesta ordem:
  * preco especifico do motorista naquela cidade;
  * preco `GERAL` da cidade, para compatibilidade com cadastros antigos;
  * preco vindo do romaneio/planilha, quando nao houver preco configurado.
* Cidade e motorista sao normalizados sem acento e em maiusculas para reduzir duplicidades como `CLAUDIA` x `CLÁUDIA`.

Alteracoes aplicadas:

* `src/lib/useFretesData.ts`
  * Consulta `precos_frete` com `cidade`, `motorista` e `valor`.
  * Monta mapa de precos por `motorista|cidade`.
  * Expos `cidadesEntrega` vindas dos romaneios da safra para apoiar o cadastro.

* `src/components/fretes/TabelaPrecosReferencia.tsx`
  * Recriado como cadastro de preco por Motorista + Cidade + Valor.
  * Permite adicionar, editar e excluir valores.
  * Usa `upsert` em `safra_id,motorista,cidade`.
  * Usa listas sugeridas de motoristas e cidades da propria safra.

* `app/[safraId]/fretes/page.tsx`
  * Passa motoristas e cidades da safra para a tabela de precos.

* `docs/supabase_precos_frete_motorista.sql`
  * Novo SQL de migracao para criar/adaptar `precos_frete`.
  * Adiciona coluna `motorista`.
  * Migra precos antigos para motorista `GERAL`.
  * Remove constraint antiga por cidade, consolida duplicatas e cria indice unico por `safra_id, motorista, cidade`.
  * Habilita RLS e politica CRUD para usuarios autenticados.

* `scripts/cadastrar_precos_milho26.sql`
  * Atualizado para inserir fallback `GERAL` usando a nova chave.

Status desta atualizacao:

* Edicoes feitas.
* `git diff --check` executado sem erros finais.
* `npm run build` executado com sucesso.
* Antes de testar gravacao em producao, executar no Supabase SQL Editor: `docs/supabase_precos_frete_motorista.sql`.

## Atualizacao visual precos de frete - 2026-07-01

Pedido do usuario:

* Melhorar o visual da area de precos por motorista na pagina de fretes.
* A lista ficou extensa quando existem varios registros de precos para diferentes motoristas.
* Os precos devem acompanhar a selecao de motoristas da configuracao de fechamento:
  * nenhum motorista selecionado: mostrar apenas precos `GERAL`;
  * um motorista selecionado: mostrar apenas os precos dele;
  * varios motoristas selecionados: mostrar apenas os precos dos selecionados.

Alteracoes aplicadas:

* `src/components/fretes/TabelaPrecosReferencia.tsx`
  * Recebe `motoristasSelecionados` da pagina de fretes.
  * Filtra visualmente os precos pelo contexto da selecao.
  * Quando nenhum motorista esta selecionado, mostra somente `GERAL`.
  * Compactou os registros em linhas mais enxutas, reduzindo o tamanho visual da lista.
  * Ao adicionar novo preco, preenche automaticamente `GERAL` quando nenhum motorista esta selecionado, ou o motorista selecionado quando houver apenas um.

* `app/[safraId]/fretes/page.tsx`
  * Passa `motoristasFiltro` para a tabela de precos.

Status desta atualizacao:

* Edicoes feitas.
* `git diff --check` executado sem erros finais.
* `npm run build` executado com sucesso.

## Atualização e Configuração de Variáveis de Ambiente - 2026-07-10

Esta sessão deu continuidade ao projeto validando o status e adicionando melhorias recomendadas na segurança das credenciais do Supabase.

Alterações aplicadas:

* `src/integrations/supabase/client.ts`
  * Modificada a inicialização do cliente Supabase para buscar as variáveis de ambiente `process.env.NEXT_PUBLIC_SUPABASE_URL` e `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  * Mantido fallback seguro para as strings de conexão antigas, garantindo compatibilidade direta e sem quebras de execução local.

* `.env.example`
  * Novo arquivo criado no diretório raiz do projeto documentando os nomes e os valores padrão das variáveis de ambiente necessárias para o deploy (Supabase URL e Anon Key).

Validações executadas:

* Testada a conectividade com o banco Supabase em script de teste isolado (`test-db.js`), confirmando:
  * Conexão ativa e integrada.
  * Presença da coluna `motorista` na tabela `precos_frete` (confirmando a aplicação correta da migração SQL `docs/supabase_precos_frete_motorista.sql`).
  * Presença de dados importados em múltiplas safras na tabela `romaneios` (196 romaneios para `milho26`, 169 para `soja2526` e 158 para `soja2425`).
* Executado `npm run build` com sucesso.

Status desta atualização:

* Edições feitas.
* `.env.example` criado.
* `npm run build` executado com sucesso.

## Atualização - áreas plantadas e importação flexível - 2026-08-26

Contexto confirmado pelo usuário:

* Os romaneios de todas as safras devem ter o Supabase como fonte oficial.
* A entrada de novos romaneios deve ocorrer pela tela `/[safraId]/importar`, por planilha e mapeamento de colunas.
* A área plantada não é mais fixa por fazenda: ela pode mudar a cada safra.
* O importador precisa aceitar tanto a planilha-base antiga quanto o relatório atual do MS Gestor, inclusive datas brasileiras `dd/mm/aaaa`.

### Áreas plantadas por safra

Alterações aplicadas:

* Criada a rota `/[safraId]/areas`, acessível pelo menu lateral e pelo atalho `Áreas` no painel da safra.
* Criado `src/components/areas/AreasPlantadasManager.tsx`:
  * lista as fazendas existentes;
  * permite cadastrar/editar/remover a área plantada somente para a safra atual;
  * permite cadastrar uma nova fazenda já com sua área da safra;
  * aceita números com vírgula ou ponto, como `675,5`.
* Criado `docs/supabase_areas_plantadas.sql` com a tabela `areas_plantadas`, chave única por `safra_id + fazenda_id`, índices e política RLS para usuários autenticados.
* `src/lib/useDataProcessing.ts` agora usa as áreas cadastradas no banco para calcular área e produtividade no painel. Enquanto uma safra ainda não possuir áreas cadastradas, mantém o valor estático antigo como compatibilidade temporária.
* `setup.sql` também passou a incluir a estrutura de `areas_plantadas` para instalações novas.

Passo operacional obrigatório antes de usar a tela de áreas em produção:

1. Abrir o Supabase SQL Editor.
2. Executar o conteúdo de `docs/supabase_areas_plantadas.sql`.
3. Abrir `/milho26/areas` e cadastrar as áreas efetivamente plantadas nesta safra.

### Importação de planilhas

Alterações aplicadas:

* Criado `src/lib/spreadsheetImport.ts`, centralizando a detecção de cabeçalho e a normalização de dados.
* O importador procura o cabeçalho nas primeiras 50 linhas da aba. Isso aceita relatórios do MS Gestor que trazem título e linhas vazias antes das colunas.
* Auto-mapeamento compatível com os dois modelos:
  * planilha-base: `Tipo NF`, `Nº`, `Peso Bruto`, `Peso Liquido`, `Sacas Liquido` e demais campos usuais;
  * MS Gestor: `Tp`, `Nº`, `NFe`, `Produto`, `Placa`, `Arm`, `Safra`, `Talhão`, `Pesol`, `Umid`, `Impu`, `Ardi`, `Avari`, `Verdes`, `Quebr`, `Seca`, `Class`, `Entrada` e `Saída`.
* Campos ausentes no relatório MS Gestor, como fazenda, motorista, cidade, contrato e peso bruto, continuam opcionais e podem receber valores padrão na tela de mapeamento.
* A data privilegia `dd/mm/aaaa`; mantém compatibilidade com células antigas exibidas como `mm/dd/aa` apenas quando o segundo número não pode ser mês, por exemplo `6/18/25`.
* O parser numérico cobre formatos como `48,880`, `50.414`, `52.580.00`, `52.580,00` e `6,65`.
* Ao importar, os três identificadores obrigatórios são `Data`, `NFe` e `Nº do romaneio`; os demais campos seguem opcionais.
* As linhas válidas passam a vir selecionadas automaticamente para gravação.
* Ajustado o retorno do mapeamento para a escolha de aba, preservando a planilha selecionada.
* A tela passou a se chamar `Importar Romaneios`/`Importar Planilha de Romaneios`, pois não é exclusiva do MS Gestor.

Arquivos reais validados nesta sessão:

* `C:\Users\USER\Downloads\RELATORIO90090181787685661.xls`
  * aba `Sheet1`;
  * cabeçalho detectado na linha 3;
  * primeira data `28/07/2025` convertida para `2025-07-28`;
  * `Pesol = 52.580.00` convertido para `52580` kg.
* `C:\Users\USER\OneDrive\Documents\PRODUÇÃO\PLANEJAMENTO 2025.xlsx`
  * aba `ROMANEIO MILHO`;
  * primeira data exibida como `6/18/25` convertida para `2025-06-18`;
  * peso bruto `48,880` convertido para `48880` kg.

Validações executadas:

* Adicionado o comando `npm run test:import-parser -- <arquivo-ms-gestor.xls> <planilha-base.xlsx>`.
* O comando foi executado com os dois arquivos reais acima e passou.
* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou.
* Servidor local iniciado em `http://localhost:3001`; as rotas `/milho26/areas` e `/milho26/importar` responderam HTTP 200.

Próximos passos recomendados:

1. Executar `docs/supabase_areas_plantadas.sql` no Supabase.
2. Cadastrar as áreas plantadas da safra `milho26` em `/milho26/areas` e conferir os indicadores de produtividade do painel.
3. Importar primeiro uma planilha pequena de teste em cada modelo e confirmar o salvamento real no Supabase antes de reimportar arquivos completos.
4. Depois da validação operacional, publicar as alterações do repositório no GitHub/Vercel.

## Atualização - talhões e produtividade por hectare - 2026-08-26

Pedido implementado:

* Criar cadastro de talhões com nome, área em hectares e associação obrigatória a uma fazenda.
* Permitir editar e excluir talhões sem remover romaneios históricos.
* Exibir no painel um ranking visual de produtividade bruta por talhão.

Alterações aplicadas:

* Criada a rota `/[safraId]/talhoes`, disponível no menu lateral e no atalho `Talhões` do painel.
* Criado `src/components/talhoes/TalhoesManager.tsx`:
  * cria talhões para a safra em aberto;
  * exige fazenda, nome e área maior que zero;
  * permite editar fazenda, nome e hectares;
  * permite excluir somente o cadastro do talhão, sem apagar romaneios.
* Criado `docs/supabase_talhoes.sql`:
  * tabela `talhoes` por `safra_id + fazenda_id + nome`;
  * área em hectares maior que zero;
  * índice, RLS, permissões e política CRUD para usuários autenticados.
* `setup.sql` passou a incluir a estrutura de talhões para instalações novas.
* `src/lib/useDataProcessing.ts` agora calcula um ranking de produtividade bruta:
  * fórmula: `sacas_bruto / área_ha`;
  * quando `sacas_bruto` estiver vazio, usa `peso_bruto_kg / 60`;
  * os dados são ordenados do maior para o menor resultado;
  * romaneio sem talhão entra como `Talhão Geral` da fazenda;
  * para `Talhão Geral`, a área usada é a área plantada da fazenda; se ela não existir, usa a soma dos talhões cadastrados daquela fazenda;
  * talhão informado no romaneio só entra no ranking depois que tiver área cadastrada.
* `src/components/ChartSection.tsx` ganhou o ranking horizontal:
  * mostra nome do talhão e fazenda quando aplicável;
  * exibe o valor de `sc/ha` em cada barra;
  * preserva as cores existentes de cada fazenda;
  * selecionar uma fazenda filtra o ranking;
  * selecionar um talhão seleciona a fazenda associada e atualiza os indicadores/fazendas;
  * o gráfico de armazéns continua dinâmico com fazendas, sem ganhar dependência adicional do talhão.

Passo operacional obrigatório antes do cadastro real:

1. Executar `docs/supabase_talhoes.sql` no Supabase SQL Editor.
2. Acessar `/milho26/talhoes` e cadastrar as áreas de cada talhão da safra.
3. Abrir `/milho26` para conferir o ranking de produtividade em sacas brutas por hectare.

## Correção - acesso à safra 26/27 - 2026-08-26

Problema identificado:

* A página inicial já lê as safras cadastradas na tabela `safras` do Supabase.
* As páginas internas ainda dependiam de `src/data/safraConfig.ts`, que só conhecia as safras históricas.
* Quando uma safra nova, como `soja2627` ou `milho2627`, era aberta, `getSafraConfig` retornava indevidamente a configuração de `Soja 25/26`.

Correção aplicada:

* `getSafraConfig` deixou de usar `Soja 25/26` como fallback.
* Para qualquer ID de safra ainda não presente na lista estática, o app cria uma configuração neutra com o próprio ID, cultura e período inferidos. Exemplos validados:
  * `soja2627` → `Soja 26/27`;
  * `milho2627` → `Milho 26/27`.
* `src/components/SafraSelector.tsx` agora busca a lista de safras cadastradas no Supabase após a autenticação. Assim o seletor interno também apresenta a safra nova com o nome, cultura e status gravados no banco.
* A troca de safra preserva qualquer sub-rota atual, por exemplo `/fretes`, `/saldos`, `/importar`, `/areas` e `/talhoes`.

Validação:

* `npx tsc --noEmit --pretty false` passou.
* Teste isolado confirmou os IDs e nomes de fallback para `soja2627` e `milho2627`.

## Atualização - navegação e central de configurações - 2026-08-27

Reorganização implementada:

* A faixa verde global de última atualização foi removida do topo do app.
* O cabeçalho do painel deixou de exibir os atalhos separados `Áreas` e `Talhões` e ganhou o botão `Configurações`.
* A página `/configuracoes` passou a funcionar como central de cadastros, com navegação horizontal entre:
  * `Safras`;
  * `Áreas`;
  * `Talhões`.
* Nas abas `Áreas` e `Talhões`, a safra pode ser escolhida no próprio cabeçalho da central de configurações.
* O topo da página de fretes ganhou os atalhos `Descontos` e `Recibo`.
* O menu lateral foi simplificado para manter `Painel`, `Saldos`, `Fretes`, `Importar planilha` e `Configurações`, além das ações já existentes de retorno e saída.
* `Descontos`, `Recibos`, `Áreas plantadas` e `Talhões` deixaram de ocupar itens independentes no menu lateral, mas suas rotas e recursos continuam disponíveis pelos novos atalhos.

Validação executada:

* `npx tsc --noEmit --pretty false` passou sem erros.
* As rotas `/milho26`, `/milho26/fretes`, `/configuracoes?safraId=milho26` e `/milho26/importar` responderam HTTP 200 no servidor local.
* A inspeção visual autenticada não foi executada porque a sessão de teste local abriu na tela de login; nenhuma credencial foi manipulada.

Decisão visual pendente:

* Foi gerada uma proposta visual de dashboard profissional voltado ao agro, com fundo branco, verdes fortes, cinzas neutros e amarelo de colheita como destaque.
* A nova paleta e o redesenho completo ainda não foram aplicados ao código. A implementação deve começar somente após a aprovação da imagem pelo usuário.
* Paleta proposta: verde floresta `#14532D`, verde operacional `#15803D`, verde folha `#22C55E`, amarelo colheita `#EAB308`, texto `#1F2937`, fundo suave `#F7FAF7`, borda `#DDE7DF` e branco `#FFFFFF`.

## Atualização - paleta agro aprovada - 2026-08-27

Direção aprovada e aplicada:

* A proposta visual foi aprovada para aplicação exclusiva das novas cores.
* Layouts, componentes, tipos de gráficos, filtros, interações e fluxos foram preservados.
* A alternância dinâmica entre tema claro e escuro foi mantida com `darkMode: class`.
* As antigas cores primárias roxas, azuis, índigo e violeta foram remapeadas no tema global para os verdes da nova identidade, evitando alterações repetitivas em cada componente.
* Verde floresta `#14532D`, verde operacional `#15803D` e verde folha `#22C55E` passaram a formar a hierarquia principal de ações e indicadores.
* Amarelo colheita `#EAB308` passou a ser o destaque complementar em gráficos, alertas e informações ligadas ao milho/colheita.
* Os neutros receberam leve tonalidade agro: fundo claro `#F7FAF7`, borda `#DDE7DF`, texto principal `#1F2937` e fundo escuro `#172019`.
* Metadados do navegador, autenticação, tooltips, grades dos gráficos e barras de rolagem também foram alinhados à paleta.
* As paletas de fazendas e armazéns foram atualizadas para verdes coordenados, amarelo de destaque e neutros, mantendo cada série identificável.

Validação executada:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou com todas as rotas geradas.
* O CSS de produção contém as novas cores e não contém os antigos roxo `#7C3AED` e azul `#2563EB` como cores utilitárias.
* O painel `/milho26` foi aberto com dados reais no navegador local.
* Temas claro e escuro foram alternados e inspecionados visualmente com sucesso.
* Os gráficos de fazendas, armazéns, produtividade por talhão e participação global mantiveram seus formatos originais.

## Atualização - keep-alive automático do Supabase - 2026-09-24

Objetivo implementado:

* Evitar que o projeto gratuito do Supabase seja considerado inativo por falta de consultas ao banco.
* Criada a rota dinâmica `GET /api/keep-alive` em `app/api/keep-alive/route.ts`.
* A rota realiza três leituras mínimas e sem alteração de dados nas tabelas `romaneios`, `safras` e `fazendas`.
* As respostas usam `Cache-Control: no-store`, garantindo que a execução chegue ao banco em vez de ser atendida por cache.
* Criado `vercel.json` com agendamento diário às `10:00 UTC` (`06:00` no horário de Cuiabá).
* O agendamento diário é compatível com o limite atual do plano Vercel Hobby.
* O cron funciona somente em deployments de produção da Vercel.

Segurança:

* Quando `CRON_SECRET` estiver configurado na Vercel, a rota exige `Authorization: Bearer <CRON_SECRET>`; a Vercel envia esse cabeçalho automaticamente nas execuções agendadas.
* Sem `CRON_SECRET`, a produção aceita apenas chamadas identificadas pela Vercel como `vercel-cron/1.0`.
* Em desenvolvimento local, a rota pode ser chamada sem autenticação para diagnóstico.

Variáveis recomendadas na Vercel:

1. `CRON_SECRET`: texto aleatório com pelo menos 16 caracteres.
2. `SUPABASE_SECRET_KEY`: opcional; a chave secreta atual do projeto Supabase. A antiga `SUPABASE_SERVICE_ROLE_KEY` também é aceita.

Observações operacionais:

* Se nenhuma chave secreta do Supabase estiver configurada, a rota usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` e executa somente leituras limitadas por RLS.
* A produção atual respondeu com sucesso usando a chave pública; a chave secreta só será necessária se as políticas RLS deixarem de permitir essas leituras mínimas.
* Após o deploy, conferir em `Vercel > Project > Settings > Cron Jobs` se `/api/keep-alive` está ativo e usar `View Logs` para confirmar uma resposta HTTP 200.

Validação executada:

* `vercel.json` foi validado como JSON e contém a expressão `0 10 * * *`.
* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e registrou `/api/keep-alive` como rota dinâmica.
* O teste local de produção com variáveis temporárias foi impedido pela política do ambiente antes de iniciar o servidor; a consulta real deverá ser confirmada nos logs do primeiro deploy da Vercel.
* O deploy de produção foi confirmado em `https://painel-safra.vercel.app/api/keep-alive`.
* Uma chamada comum recebeu HTTP `401`, confirmando a proteção do endpoint.
* Uma chamada simulando o agente oficial `vercel-cron/1.0` recebeu HTTP `200` com `checks: 3`, confirmando as leituras reais nas três tabelas em produção.

## Atualização - módulo financeiro de contratos - 2026-09-24

Escopo aprovado e implementado:

* Os dados financeiros foram adicionados como uma camada opcional vinculada aos contratos existentes.
* Nenhum contrato antigo foi alterado, preenchido automaticamente ou passou a exigir preço, tributos ou competência.
* Cada informação permanece isolada por safra porque o financeiro é carregado somente para os contratos da `safra_id` em aberto.
* Contratos antigos podem receber ou atualizar as informações financeiras pelo mesmo formulário usado em `Saldos`.

Banco de dados:

* Criado `docs/supabase_contratos_financeiros.sql`, que deve ser executado manualmente no SQL Editor do Supabase antes de usar o módulo em produção.
* Criada a tabela `contratos_financeiros`, com relação única e opcional para `contratos`.
* Criada a tabela `contratos_descontos`, permitindo múltiplos descontos/tributos por contrato.
* Tipos disponíveis: `SENAR`, `FETHAB`, `FUNRURAL`, `IAGRO`, `COOP` e `OUTRO`.
* Métodos disponíveis: percentual sobre o bruto, valor por saca e valor fixo.
* O preço pode ficar `a_fixar` ou ser marcado como `fixado`.
* A função transacional `salvar_contrato_financeiro` grava o cabeçalho e substitui os descontos na mesma transação. Se uma parte falhar, os descontos anteriores não são apagados isoladamente.
* As duas tabelas usam RLS e permitem CRUD somente para usuários autenticados.
* `setup.sql` recebeu as mesmas estruturas para instalações novas, além das colunas `grupo` já usadas pelo app em armazéns e contratos.

Interface e fluxo:

* `src/components/saldos/ContratoForm.tsx` agora possui uma seção financeira opcional.
* O formulário permite informar preço por saca, data do contrato, competência, tributos/descontos, revisão tributária, volume excedente e observações.
* A prévia exibe valor bruto, descontos e valor líquido antes de salvar.
* Caso o SQL ainda não tenha sido executado, contratos continuam sendo criados e editados normalmente; apenas a seção financeira informa que o banco ainda precisa ser preparado.
* A tela de Saldos exibe o status financeiro de cada contrato e um aviso com a quantidade de contratos incompletos.
* Criada a rota `/[safraId]/financeiro`, também disponível no menu lateral.
* A nova tela contém KPIs de bruto contratado, bruto realizado, descontos previstos, líquido a receber e contratos incompletos.
* A tela também mostra os descontos por tipo, gráfico mensal, busca, filtros por status/competência e listagem responsiva para desktop e celular.
* O filtro `Todos os pendentes` reúne contratos não configurados, preço pendente, tributos pendentes, competência pendente e inconsistências.
* Busca e filtros atualizam os KPIs, a lista e o gráfico financeiro.
* O Dashboard recebeu apenas um resumo macro com bruto, descontos, líquido realizado e gráfico dos seis meses mais recentes.

Regras de cálculo:

* Bruto contratado = `volume_total do contrato x preço por saca`.
* Volume entregue = soma de `romaneios.sacas_liquida` vinculados por `contrato_id` dentro da safra.
* Por padrão, o realizado é limitado ao volume contratado; a opção `Aceitar volume excedente` permite considerar entregas acima do contrato.
* Desconto percentual usa o valor bruto; desconto por saca usa o volume; desconto fixo é rateado proporcionalmente no realizado mensal.
* Líquido = bruto menos descontos.
* O valor exibido nesta fase é `líquido a receber`/`líquido realizado por entregas`, e não comprovação de pagamento recebido.

Status financeiro:

* `Não configurado`: contrato antigo ou novo ainda sem camada financeira.
* `Preço pendente`: preço a fixar ou preço inválido.
* `Tributos pendentes`: revisão tributária ainda não confirmada, inclusive quando não há descontos.
* `Competência pendente`: mês financeiro ainda não informado.
* `Inconsistente`: descontos superiores ao valor bruto.
* `Completo`: preço, competência e revisão tributária preenchidos sem inconsistência.

Validação executada:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e gerou a rota dinâmica `/[safraId]/financeiro`.
* Teste isolado confirmou preço, percentual, valor por saca, desconto fixo rateado, teto de volume e distribuição mensal.
* Cenário validado: 1.000 sc a R$ 100,00, com 1,5%, R$ 2,00/sc e R$ 300,00 fixos, resultou em bruto de R$ 100.000,00, descontos de R$ 3.800,00 e líquido de R$ 96.200,00.
* O navegador local abriu em `http://localhost:3000`, mas a inspeção visual autenticada ficou limitada pela tela de login; nenhuma credencial foi manipulada.

Passos operacionais obrigatórios:

1. Executar `docs/supabase_contratos_financeiros.sql` no SQL Editor do Supabase.
2. Abrir um contrato antigo em `Saldos`, adicionar informações financeiras e salvar.
3. Conferir os valores e o status em `/milho26/financeiro` (ou na safra escolhida).
4. Validar um desconto percentual, um valor por saca e um valor fixo antes de cadastrar todos os contratos.
5. Somente depois desses testes, usar o módulo para os demais contratos e safras.

Melhoria futura já separada do escopo atual:

* Criar uma segunda fase de recebimentos reais, com parcelas, datas previstas, datas de pagamento, valor efetivamente recebido, status em aberto/parcial/pago/vencido e conciliação. Não chamar o líquido previsto de `recebido` enquanto essa baixa financeira não existir.

## Atualização - recebimentos e baixas financeiras - 2026-09-28

Correções solicitadas na tela Financeiro:

* O botão `Ver contratos` deixou de aplicar o filtro de contratos pendentes.
* Ao clicar, busca, status e competência são restaurados para `Todos`, preservando na lista os contratos já revisados/concluídos.
* A página desliza suavemente até a seção da lista geral de contratos.
* Os KPIs de bruto, descontos, líquido, incompletos e descontos por tipo passaram a usar sempre os totais globais da safra.
* Busca e filtros continuam afetando a lista e o gráfico de financeiro realizado, mas não zeram nem alteram os KPIs globais.

Etapa 2 implementada:

* Criado `docs/supabase_recebimentos_contratos.sql`, que deve ser executado após `docs/supabase_contratos_financeiros.sql`.
* Criada a tabela `contratos_recebiveis` para parcelas previstas, com número, vencimento, valor, descrição e observações.
* Criada a tabela `contratos_baixas` para recebimentos efetivos, permitindo várias baixas parciais na mesma parcela.
* Cada baixa armazena data, valor recebido, forma de recebimento, referência/comprovante e observações.
* Exclusão de uma parcela remove suas baixas vinculadas por cascata, sempre após confirmação na interface.
* RLS e permissões CRUD foram configuradas para usuários autenticados.
* `setup.sql` também recebeu as novas tabelas, índices, gatilhos, políticas e permissões para instalações novas.

Proteções no banco:

* Uma baixa não pode ultrapassar o saldo disponível da parcela.
* Uma parcela não pode ser reduzida para um valor menor que o total já recebido.
* A validação de saldo bloqueia a parcela durante a gravação, reduzindo risco de duas baixas simultâneas excederem o valor previsto.
* Número da parcela é único dentro do financeiro de cada contrato.

Status calculados automaticamente:

* `Em aberto`: parcela ainda sem baixa e não vencida.
* `Parcial`: parcela com alguma baixa, saldo restante e ainda não vencida.
* `Pago`: soma das baixas atingiu o valor previsto.
* `Vencido`: existe saldo e a data de vencimento já passou, inclusive quando houve pagamento parcial.

Interface de recebimentos:

* A tabela de contratos ganhou colunas de valor recebido e saldo em aberto.
* Cada contrato com financeiro configurado ganhou o botão `Recebimentos e baixas`.
* O modal permite criar, editar e excluir parcelas; registrar, editar e excluir baixas; e acompanhar previsto, recebido, saldo e status por parcela.
* O modal mostra líquido previsto, total programado, recebido, em aberto e ainda a programar.
* Programação acima do líquido previsto gera um alerta de excesso.
* A página Financeiro ganhou KPIs globais de programado, recebido, em aberto, vencido, a programar e excesso programado.
* Criado gráfico mensal comparando previsão por vencimento e recebimento real pela data da baixa.
* O resumo macro do Dashboard passou a mostrar também o valor efetivamente recebido quando a etapa 2 estiver habilitada no banco.
* A interface continua operacional quando o SQL da etapa 2 ainda não foi executado: o financeiro anterior permanece visível e um aviso informa qual script está pendente.

Regras de consolidação:

* `Programado` = soma dos valores previstos das parcelas.
* `Recebido` = soma de todas as baixas efetivas.
* `Em aberto` = soma dos saldos das parcelas já programadas.
* `Vencido` = soma dos saldos das parcelas com vencimento anterior à data atual.
* `A programar` = líquido previsto do contrato menos o total já programado, limitado a zero.
* `Excesso programado` = total programado acima do líquido previsto.
* Contratos, parcelas e baixas continuam isolados pela safra por meio do vínculo com `contratos_financeiros` e `contratos`.

Validação executada:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e gerou normalmente `/[safraId]/financeiro`.
* Teste isolado confirmou parcela vencida com baixa parcial, parcela integralmente paga e agrupamento mensal por vencimento/data da baixa.
* `git diff --check` passou sem erros de whitespace.

Passos operacionais:

1. Confirmar que `docs/supabase_contratos_financeiros.sql` já foi executado.
2. Executar `docs/supabase_recebimentos_contratos.sql` no SQL Editor do Supabase.
3. Abrir `/milho26/financeiro`, escolher um contrato com financeiro configurado e programar uma parcela de teste.
4. Registrar uma baixa parcial e conferir status, KPIs, gráfico e saldo.
5. Registrar a baixa restante e confirmar que a parcela muda para `Pago`.

## Atualização - tipos de contrato e módulo Trocas/Barter - 2026-09-28

Escopo aprovado e implementado:

* Os contratos agora podem ser classificados como `Venda`, `Troca / Barter`, `Misto`, `Outro` ou `Não classificado`.
* A forma de liquidação é independente e pode ser `Financeira`, `Física`, `Mista` ou `Não definida`.
* Todos os contratos existentes permanecem como `Não classificado` até revisão manual. Nenhum registro antigo é convertido, apagado ou obrigado a receber os novos dados.
* Contratos novos exigem a escolha de um tipo depois que a migration estiver instalada.
* Todo dado de barter fica ligado ao `contrato_id`. A safra é herdada do contrato e todas as consultas partem apenas dos contratos da `safra_id` aberta.

Banco de dados:

* Criado `docs/supabase_tipos_contratos_barter.sql`, que deve ser executado manualmente no SQL Editor do Supabase.
* A migration adiciona em `contratos`: `tipo_contrato`, `forma_liquidacao` e `tipo_outro_descricao`.
* Criada `contratos_barter`, com um único cadastro de troca por contrato.
* Criada `contratos_barter_itens`, com composição opcional de sementes, defensivos, fertilizantes, serviços e outros insumos.
* O cabeçalho da troca aceita fornecedor, recebedor dos grãos, valor dos insumos, janela e local de entrega, responsável pelo frete, qualidade exigida, CPR, preços de referência/mercado, conciliação e observações.
* A função `salvar_contrato_barter` grava cabeçalho e substitui os itens na mesma transação.
* RLS, permissões, índices, validação de datas e gatilho de `updated_at` foram incluídos.
* `setup.sql` contém a mesma estrutura para instalações novas.

Integração com os dados existentes:

* O volume contratado continua sendo `contratos.volume_total`; não foi criada uma segunda quantidade física concorrente.
* O volume entregue continua sendo a soma de `romaneios.sacas_liquida` vinculados pelo `contrato_id` dentro da safra.
* Saldo físico do barter = volume contratado menos volume entregue, limitado a zero.
* Status físico: `Não iniciada`, `Parcial`, `Entregue` ou `Vencida`, considerando a data final da janela.
* Valor equivalente entregue = valor dos insumos proporcional ao percentual físico cumprido, limitado a 100%.
* Preço implícito = valor dos insumos dividido pelas sacas contratadas.
* Valor de mercado = sacas contratadas multiplicadas pelo preço de mercado informado.
* Variação de mercado = valor de mercado menos valor dos insumos.
* O detalhamento dos itens mostra divergência em relação ao valor total de insumos sem sobrescrever automaticamente o cabeçalho.

Separação contábil:

* `Venda`: fluxo financeiro, tributos, recebíveis e baixas.
* `Troca / Barter`: obrigação física e valor econômico da troca; não entra nos KPIs de caixa.
* `Misto`: participa tanto do fluxo financeiro quanto do controle físico da troca.
* `Outro` e `Não classificado`: continuam no fluxo financeiro anterior para preservar compatibilidade.
* Se um contrato que já possuía financeiro for reclassificado como barter puro, os dados antigos são preservados, mas deixam de somar nos KPIs de caixa.
* Alterar o tipo não exclui financeiro, recebimentos, barter ou itens já gravados.

Interface:

* O formulário de contratos em `Saldos` ganhou seleção visual de tipo e forma de liquidação.
* Para barter/misto, o mesmo formulário exibe dados da troca, CPR, preços, conciliação, itens e prévia econômica.
* Para barter puro, a edição de venda financeira fica oculta, com aviso de que dados anteriores são preservados.
* A lista de contratos em Saldos exibe o tipo de cada registro.
* A tela `/[safraId]/financeiro` foi dividida em navegação horizontal: `Consolidado`, `Vendas`, `Trocas / Barter` e `Recebimentos`.
* A aba de barter exibe contratado, entregue, saldo físico, valor dos insumos, equivalente entregue, conciliações pendentes e tabela detalhada responsiva.
* O botão `Ver contratos` continua limpando filtros, abre a visão consolidada e desliza até a lista geral, mantendo contratos concluídos/revisados visíveis.
* KPIs continuam globais dentro da visão; busca, status e competência afetam apenas lista e gráfico.
* O resumo macro do Dashboard passou a mostrar saldo de barter quando existirem trocas cadastradas.

Compatibilidade de implantação:

* As consultas de classificação e barter são feitas separadamente das consultas essenciais de contratos.
* O app pode ser publicado antes da migration: Saldos, contratos, financeiro e recebimentos continuam funcionando e a interface mostra o nome do SQL pendente.
* Não adicionar as novas colunas à consulta base obrigatória de `useFinanceiroData`; a sondagem separada evita quebra durante deploy gradual.

Validação executada:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e gerou normalmente as rotas `/[safraId]/financeiro` e `/[safraId]/saldos`.
* As duas rotas responderam HTTP 200 no servidor local em `http://localhost:3000`.
* O navegador local foi aberto em `/milho26/financeiro`, mas redirecionou para o login; nenhuma credencial preenchida foi submetida.
* `git diff --check` passou sem erros de whitespace antes da entrega.

Passos operacionais obrigatórios:

1. Executar `docs/supabase_tipos_contratos_barter.sql` no SQL Editor do Supabase.
2. Abrir um contrato antigo em `Saldos` e classificá-lo manualmente como `Venda`, `Troca / Barter`, `Misto` ou `Outro`.
3. Em uma troca de teste, informar valor dos insumos e confirmar se o volume contratado já corresponde à obrigação em sacas.
4. Vincular/confirmar romaneios no mesmo contrato e conferir entregue, saldo e status na aba `Trocas / Barter`.
5. Validar um contrato misto para confirmar que aparece simultaneamente em Vendas e Barter, sempre dentro da mesma safra.

### Correção visual dos status de barter - 2026-09-28

* Um contrato classificado como barter puro não exibe mais `Financeiro não configurado` na gestão de contratos em Saldos.
* Para barter puro, o cartão mostra somente o status da obrigação física: `Não iniciada`, `Parcial`, `Entregue` ou `Vencida`.
* O status físico não é escolhido manualmente. Ele é calculado pelo volume contratado, pelos romaneios vinculados e pela data final de entrega cadastrada no barter.
* Contratos mistos continuam mostrando o status financeiro na visão de vendas e o status físico na visão de barter, pois participam dos dois controles.

### Vinculação de romaneios aos contratos - 2026-09-28

* O vínculo é realizado durante a importação pela igualdade entre a coluna `ncontrato` da planilha e o campo `Nº Contrato / ID` do contrato cadastrado, sempre dentro da mesma safra.
* Reimportar a mesma planilha não cria uma nova entrega quando a chave do romaneio já existe; o registro existente é atualizado e recebe o `contrato_id` correspondente.
* O importador foi protegido para nunca zerar volume, nome, classificação, financeiro ou barter de um contrato existente ao reencontrar seu número na planilha.
* Contratos ausentes ainda podem ser criados automaticamente com volume zero, mas contratos já cadastrados são ignorados nessa etapa e preservados integralmente.
* Para entregas históricas sem vínculo: cadastrar/revisar primeiro o contrato, garantir que seu número seja igual ao `ncontrato` da planilha e então reimportar a planilha da mesma safra.

## Atualização - cumprimento de contratos pela alocação em Saldos - 2026-09-28

Decisão de negócio aprovada e implementada:

* Em `Saldos > Saldos por Armazém`, gravar um contrato dentro de um slot confirma que a obrigação física daquele contrato foi cumprida.
* A regra vale para contratos de venda, barter e mistos, sempre isolados pela safra aberta.
* Contratos alocados recebem o status operacional `Cumprido` no controle de barter.
* Ao arrastar um contrato do slot de volta para o Banco de Itens, o app pede confirmação explícita.
* Confirmada a retirada e gravadas as alterações, a comprovação por alocação é cancelada e o status operacional volta para `Pendente`.
* A retirada não apaga contrato, barter, financeiro, parcelas, baixas ou romaneios.

Banco de dados:

* Criado `docs/supabase_cumprimento_por_alocacao.sql`, que deve ser executado manualmente no SQL Editor do Supabase.
* Criada `contratos_cumprimentos`, com um único estado por contrato, origem, slot/grupo, volume confirmado, situação ativa, data da confirmação e data do cancelamento.
* O vínculo com a safra continua sendo herdado de `contratos`; a função rejeita qualquer contrato que não pertença à `safra_id` enviada.
* Criada a RPC transacional `salvar_alocacoes_contratos`, que grava o `grupo` do contrato e seu cumprimento na mesma transação.
* A migration reconhece como cumpridos, na primeira execução, os contratos que já possuem `grupo`/slot. Reexecutar o script não reativa registros que tenham sido cancelados depois.
* Exclusão de contrato remove seu cumprimento por cascata. RLS e permissões foram incluídas para usuários autenticados.
* `setup.sql` contém a mesma estrutura para instalações novas.

Regras de cálculo:

* Volume comprovado por romaneios continua sendo calculado normalmente.
* Volume confirmado pela alocação corresponde ao volume total atual do contrato.
* Volume efetivo cumprido usa o maior valor entre romaneios e alocação; os dois valores nunca são somados, evitando dupla contagem.
* Alocação ativa tem prioridade de status e exibe `Cumprido`.
* Um registro de alocação cancelado tem prioridade de status e exibe `Pendente`, conforme decisão do usuário.
* Sem histórico de alocação, permanece a regra anterior por romaneios: `Pendente`, `Parcial`, `Entregue` ou `Vencida`.
* Para contratos de venda, a alocação também alimenta o volume realizado e os KPIs financeiros. O gráfico mensal continua baseado nas datas reais dos romaneios, pois a alocação não representa uma competência de faturamento.

Compatibilidade de implantação:

* `useFinanceiroData` consulta `contratos_cumprimentos` separadamente das consultas essenciais.
* O app pode ser publicado antes da migration. Nesse intervalo, os slots continuam salvando a organização antiga e as telas exibem um aviso com o SQL pendente.
* Após executar a migration, recarregar o app é suficiente para habilitar a RPC e os novos status.
* A tela Financeiro informa visualmente quando o cumprimento veio de `Alocação em <slot>`.

Arquivos principais alterados:

* `docs/supabase_cumprimento_por_alocacao.sql`
* `setup.sql`
* `src/data/financeiroTypes.ts`
* `src/lib/financeiroCalculations.ts`
* `src/lib/useFinanceiroData.ts`
* `src/components/saldos/SaldosPorArmazem.tsx`
* `app/[safraId]/saldos/page.tsx`
* `app/[safraId]/financeiro/page.tsx`

Validação executada:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e gerou normalmente as rotas `/[safraId]/saldos` e `/[safraId]/financeiro`.
* O servidor local foi reiniciado em `http://localhost:3000` e `/milho26/financeiro` respondeu HTTP 200.

Passos operacionais obrigatórios:

1. Executar `docs/supabase_cumprimento_por_alocacao.sql` no SQL Editor do Supabase.
2. Recarregar o app e confirmar que o aviso de migration pendente desapareceu.
3. Conferir um barter que já está em um slot: deve aparecer como `Cumprido` no Financeiro.
4. Mover um contrato de teste para o Banco de Itens, confirmar a mensagem e clicar em `Gravar alterações`: deve voltar para `Pendente`.
5. Recolocar o contrato no slot e gravar: deve retornar para `Cumprido` sem duplicar volume.

## Atualização - status financeiro e cumprimento - 2026-09-29

Status consolidados implementados:

* `Baixado`: o valor programado cobre o líquido previsto do contrato, todas as parcelas estão integralmente pagas e não existe saldo aberto.
* Uma baixa parcial não transforma o contrato inteiro em `Baixado`.
* `Vencida`: existe ao menos uma parcela com saldo aberto e data de vencimento ultrapassada. Também se aplica a parcelas parcialmente pagas que continuam com saldo vencido.
* `Completo`: não existem pendências de preço, revisão de tributos, competência ou consistência, e o contrato ainda não se enquadra como `Baixado` ou `Vencida`.
* As pendências detalhadas anteriores (`Não configurado`, `Preço pendente`, `Tributos pendentes`, `Competência pendente` e `Inconsistente`) foram preservadas para indicar exatamente qual informação falta.

Precedência do status financeiro:

1. `Baixado`, quando a obrigação financeira completa foi liquidada.
2. `Vencida`, quando ainda existe saldo vencido.
3. Status de pendência cadastral ou `Completo`.

Status de barter:

* `Cumprido`: contrato de barter/misto com cumprimento ativo gerado pela alocação em um slot de armazém.
* `A cumprir`: contrato sem alocação ativa, inclusive quando foi retirado de um slot mediante confirmação.
* O status de barter passou a ser definido estritamente pela alocação do contrato, conforme o fluxo operacional aprovado. Romaneios continuam compondo volumes e valores, mas não alteram esse status.

Interface e indicadores:

* A tabela Financeiro e os cartões mobile mostram `Baixado`, `Vencida`, `Completo`, `Cumprido` ou `A cumprir` conforme o tipo do contrato.
* O modal de parcelas usa os rótulos `Baixado` e `Vencida` para manter a mesma nomenclatura.
* O filtro financeiro ganhou as opções `Baixado` e `Vencida`.
* O filtro de barter foi reduzido para `Cumprido` e `A cumprir`.
* O KPI `Incompletos` continua contando somente contratos com informações cadastrais faltantes; contratos baixados ou vencidos não são classificados automaticamente como incompletos.

Validação executada:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e gerou normalmente `/[safraId]/financeiro` e `/[safraId]/saldos`.
* O servidor local foi reiniciado e `/milho26/financeiro` respondeu HTTP 200.
* Nenhuma migration adicional é necessária para esta atualização.

## Atualização - KPIs financeiros de vendas - 2026-09-29

Escopo dos KPIs:

* Os KPIs financeiros passam a considerar somente contratos classificados como `Venda` ou `Misto`.
* Contratos `Misto` entram porque possuem componente financeiro de venda além da obrigação de barter.
* Contratos `Barter`, `Outro` e `Não classificado` não entram nos valores dos KPIs de venda.
* Registros antigos `Outro` e `Não classificado` continuam visíveis nas listas para revisão, sem contaminar os totais financeiros.

Fórmulas aplicadas:

* `Bruto contratado` = soma do valor bruto contratado dos contratos de venda/mistos.
* `Bruto realizado` = soma do valor bruto correspondente ao volume entregue/cumprido dos contratos de venda/mistos.
* `Descontos previstos` = soma dos descontos calculados sobre o valor contratado dos contratos de venda/mistos.
* `Líquido a receber` = soma de `máximo(líquido contratado - baixas realizadas, zero)` por contrato.
* `Líquido recebido` = soma de todas as baixas efetivamente registradas nos contratos de venda/mistos.
* Baixas parciais reduzem `Líquido a receber` e aumentam `Líquido recebido` pelo mesmo valor.
* Contratos integralmente baixados contribuem com zero em `Líquido a receber`.

Interface:

* Adicionado o KPI `Líquido recebido` na tela Financeiro.
* A grade passou a comportar seis cartões em telas largas, incluindo o cartão de contratos incompletos.
* O detalhamento `Descontos por tipo` usa o mesmo escopo de contratos de venda/mistos.
* Os totais financeiros usados no resumo macro do Dashboard também foram restringidos a venda/misto.
* Busca e filtros continuam sem alterar os KPIs globais da safra.

Validação:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e gerou normalmente a rota `/[safraId]/financeiro`.
* O servidor local foi reiniciado e `/milho26/financeiro` respondeu HTTP 200.
* Nenhuma migration ou alteração no Supabase é necessária.

## Atualização - nova composição de KPIs e relatório PDF - 2026-09-29

Ordem final dos KPIs da tela Financeiro:

1. `Faturamento global`: soma do bruto integral de todos os contratos do fluxo financeiro, cumpridos ou não. Inclui `Venda`, `Misto`, `Outro` e `Não classificado` quando possuem configuração financeira.
2. `Contratos de venda`: soma do bruto integral somente dos contratos classificados como `Venda`, cumpridos ou não.
3. `Descontos previstos`: mantida a soma dos descontos previstos dos contratos `Venda` e `Misto`.
4. `Líquido recebido`: soma das baixas efetivamente realizadas nos contratos `Venda` e `Misto`.
5. `Líquido a receber`: soma do líquido contratado menos as baixas realizadas, limitado a zero por contrato, para `Venda` e `Misto`.

Separação de barter:

* Barter puro continua fora de `Faturamento global`, pois seu valor econômico permanece controlado separadamente e não representa faturamento de venda em dinheiro.
* Contratos mistos entram no faturamento global e nos descontos/líquidos por possuírem componente financeiro.

KPI removido:

* O cartão `Incompletos` foi removido da grade de KPIs.
* O aviso de complementação financeira continua visível na tela para controle de qualidade dos cadastros, sem ocupar um KPI financeiro.

Impressão e salvamento em PDF:

* Adicionado o comando `Salvar PDF` no cabeçalho da tela Financeiro, usando o diálogo nativo de impressão do navegador.
* O relatório é gerado em A4 paisagem e identifica safra, visão aberta e data/hora de emissão.
* A impressão respeita a aba atual: `Consolidado`, `Vendas`, `Trocas / Barter` ou `Recebimentos`.
* Navegação, filtros, botões de edição, seletores, ações e cartões mobile duplicados são removidos do PDF.
* A grade de KPIs é compactada em cinco colunas no relatório.
* Tabelas perdem a coluna de ações, usam toda a largura disponível, repetem o cabeçalho nas páginas e evitam quebrar uma linha ao meio.
* Gráficos recebem altura própria para impressão e as seções evitam quebras de página desnecessárias.
* Se o app estiver no tema escuro, o comando `Salvar PDF` alterna temporariamente para a aparência clara durante a impressão e restaura o tema ao fechar o diálogo.

Arquivos principais:

* `app/[safraId]/financeiro/page.tsx`
* `app/globals.css`

Banco de dados:

* Nenhuma migration ou alteração no Supabase é necessária.

Validação:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e gerou normalmente `/[safraId]/financeiro`.
* O servidor local foi reiniciado e `/milho26/financeiro` respondeu HTTP 200.
* O navegador local abriu a rota, mas a sessão foi redirecionada para `/login`; nenhuma credencial foi submetida.

## Atualização - integração dos KPIs do Dashboard e Financeiro - 2026-09-29

Problema corrigido:

* O resumo financeiro do Dashboard ainda usava os indicadores antigos de valores realizados por romaneios.
* A tela Financeiro já utilizava a nova composição global, por isso os números exibidos nas duas telas divergiam.

Fonte única dos KPIs:

* `useFinanceiroData` agora calcula e fornece o objeto compartilhado `financialKpis`.
* O Dashboard e a tela Financeiro consomem diretamente esse mesmo objeto, eliminando fórmulas duplicadas.
* Os cinco indicadores integrados são `Faturamento global`, `Contratos de venda`, `Descontos previstos`, `Líquido recebido` e `Líquido a receber`.
* O escopo de cada indicador permanece exatamente o documentado na atualização anterior.
* O gráfico mensal continua representando o financeiro realizado por romaneios; ele é uma visão temporal complementar e não altera os KPIs globais.

Arquivos principais:

* `src/lib/useFinanceiroData.ts`
* `src/components/financeiro/FinanceiroResumoDashboard.tsx`
* `app/[safraId]/financeiro/page.tsx`

Banco de dados:

* Nenhuma migration ou alteração no Supabase é necessária.

Validação:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e gerou normalmente as rotas `/[safraId]` e `/[safraId]/financeiro`.
* As duas rotas responderam HTTP 200 no servidor local.

## Atualização - faturamento global com barter - 2026-09-29

Regra corrigida:

* `Faturamento global` passa a representar a movimentação econômica total dos contratos classificados da safra.
* Componente de venda: soma do valor bruto contratado de `Venda` e `Misto`.
* Componente de troca: soma do `Valor dos insumos` de `Barter` e `Misto`.
* Em contratos `Misto`, entram tanto o componente financeiro de venda quanto o componente econômico da troca, pois são operações distintas do mesmo contrato.
* Contratos `Outro` e `Não classificado` não entram nesse KPI até serem classificados corretamente.
* A fórmula continua usando os valores integrais contratados, independentemente de cumprimento ou baixa.
* Como o cálculo permanece centralizado em `financialKpis`, a correção aparece simultaneamente no Dashboard e na tela Financeiro.

Banco de dados:

* Nenhuma migration ou alteração no Supabase é necessária.

Validação:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e gerou normalmente as rotas `/[safraId]` e `/[safraId]/financeiro`.
* Dashboard e Financeiro responderam HTTP 200 no servidor local.

## Atualização - contratos pendentes e cumpridos no Dashboard - 2026-09-29

Problema corrigido:

* O bloco `Contratos` do Dashboard separava `Pendentes` e `Cumpridos` apenas pelo volume encontrado nos romaneios.
* A regra antiga também forçava determinadas safras anteriores como 100% cumpridas, sem consultar o status financeiro ou a alocação em Saldos.

Nova regra de classificação:

* `Venda`, `Outro` e `Não classificado`: cumprido somente quando o status financeiro for `Baixado`.
* `Barter`: cumprido quando o status físico da troca for `Cumprido`, inclusive por alocação em Saldos.
* `Misto`: cumprido somente quando o financeiro estiver `Baixado` e a obrigação barter estiver `Cumprida`.
* Status `Completo` significa cadastro sem pendências, mas permanece na aba `Pendentes` enquanto não houver baixa.
* Status `Vencida`, configurações incompletas e contratos não configurados permanecem em `Pendentes`.

Interface e dados:

* Os cartões exibem o status financeiro e, para barter/misto, o status da obrigação física.
* As abas mostram a quantidade de contratos em cada situação.
* O volume entregue usa o mesmo resumo financeiro, incluindo cumprimento por alocação, evitando barra física incompatível com o status.
* O Dashboard passou a carregar `useFinanceiroData` uma única vez e compartilha o resultado entre o resumo financeiro e o bloco de contratos.

Arquivos principais:

* `app/[safraId]/page.tsx`
* `src/components/ContractSection.tsx`
* `src/components/financeiro/FinanceiroResumoDashboard.tsx`
* `src/lib/financeiroCalculations.ts`

Banco de dados:

* Nenhuma migration ou alteração no Supabase é necessária.

Validação:

* `npx tsc --noEmit --pretty false` passou sem erros.
* `npm run build` passou e gerou normalmente a rota `/[safraId]`.
* O servidor local foi reiniciado e `/milho26` respondeu HTTP 200.
