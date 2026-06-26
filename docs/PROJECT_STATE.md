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
