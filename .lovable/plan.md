
Objetivo: fazer o link público espelhar exatamente a proposta salva, sem mexer em fluxos não relacionados.

Diagnóstico confirmado
- Não é erro de banco/RLS: a proposta `be6c216d-0097-465a-ab11-6da308309fd2` está salva com `selected_buildings = 14`.
- O problema é de composição + renderização:
  - a proposta auditada contém 11 prédios `ativo` + 3 `interno` (`COMERCIAL TABLET`, `ENTRADA`, `SALA REUNIÃO`);
  - ela não contém os 3 prédios `instalacao` da loja (`Bella Vita`, `Condomínio Cheverny`, `Residencial Miró`);
  - no link público, `PropostaPublicaPage.tsx` remove qualquer item com `quantidade_telas <= 0`, então os 3 internos somem e restam 11.
- Ou seja: hoje o link público não usa a proposta salva como fonte final de verdade.

Plano de correção
1. Tornar o link público 100% fiel à proposta salva
- Em `src/pages/public/PropostaPublicaPage.tsx`, parar de excluir prédios por `quantidade_telas > 0`.
- Usar `selected_buildings` salvo na proposta como base oficial para:
  - contagem de prédios;
  - cards “Locais Contratados”;
  - metadados e resumo;
  - PDF/export.
- Manter o “enriquecimento” com dados atuais do banco apenas para completar imagem/endereço/métricas, nunca para remover item.
- Se um prédio não vier mais do banco, continuar exibindo o item salvo com fallback dos dados persistidos na proposta.

2. Corrigir o editor para selecionar exatamente os prédios da loja pública
- Em `src/pages/admin/proposals/NovaPropostaPage.tsx`, separar:
  - prédios elegíveis da loja pública: `ativo`, `instalacao`, `instalação`;
  - prédios `interno`: continuam visíveis para uso administrativo manual.
- Ajustar `Selecionar Todos` para marcar apenas os prédios da loja pública.
- Ajustar o auto-select do `vertical_premium` para também usar apenas os prédios da loja pública.
- Atualizar os contadores/badges do editor para refletirem esse conjunto correto.

3. Eliminar divergência entre número exibido e lista renderizada
- Garantir que o número de prédios mostrado no topo, no badge de “Locais Contratados” e no grid use a mesma coleção normalizada.
- Garantir a mesma regra no PDF para não haver diferença entre proposta online e material exportado.

4. Tratar propostas já afetadas
- Auditar propostas salvas no período anterior que carregaram internos no lugar de prédios de instalação.
- Corrigir apenas os registros comprovadamente afetados por esse fluxo antigo, sem mexer em propostas que incluíram internos de propósito.
- Isso é correção de dados, não mudança de schema.

Arquivos principais
- `src/pages/public/PropostaPublicaPage.tsx`
- `src/pages/admin/proposals/NovaPropostaPage.tsx`
- `src/components/public/proposal/ProposalBuildingCard.tsx` (se precisar preservar `0 tela` sem cair no fallback visual de `1`)
- `src/components/proposals/ProposalPDFExporter.tsx`

Detalhes técnicos
```text
Banco atual:
- ativo = 11
- instalacao = 3
- interno = 3 (todos com quantidade_telas = 0)

Erro atual no link público:
- allBuildings.filter((b) => Boolean(b?.building_id) && (b.quantidade_telas ?? 0) > 0)

Efeito:
- proposta salva com 14 itens
- link público renderiza só 11

Resultado esperado após a implementação:
- se a proposta salva tiver 14, o link público mostra 14;
- “Selecionar Todos” no editor passa a selecionar exatamente os 14 da loja pública;
- internos continuam disponíveis apenas por seleção manual administrativa.
```
