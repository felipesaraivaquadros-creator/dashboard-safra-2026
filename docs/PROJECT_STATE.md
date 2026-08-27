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
