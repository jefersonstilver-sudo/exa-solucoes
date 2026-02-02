
Contexto do bug (por que está “apagando” coisas ao editar)
- O formulário de edição (NovaPropostaPage.tsx) usa o mesmo componente da criação e, ao clicar em “Editar”, ele:
  1) Busca a proposta (`existingProposal`)
  2) “Hidrata” (preenche) vários estados locais via `useEffect`
- O problema “grave” acontece quando alguns campos da proposta não são hidratados para o estado do React. A tela fica com valores default (vazio/zero) e, se você salvar/atualizar, esses defaults sobrescrevem o que estava no banco (efeito de “apagou várias coisas”).
- No seu caso (permuta), o código atualmente hidrata cliente, prédios, pagamento, exclusividade etc., mas não está garantindo a hidratação completa dos campos da permuta e também não trata bem cenários de “salva só algumas coisas”.

O que vou revisar/corrigir (sem mudar UI/fluxo além do necessário)
Objetivo: “Editar” deve sempre carregar 100% do que foi salvo e nunca sobrescrever com vazio. E o rascunho deve salvar “tudo” (ou pelo menos o mesmo conjunto de campos do envio), não só alguns.

1) Corrigir hidratação completa no modo edição (principal causa de perda de dados)
Arquivo: src/pages/admin/proposals/NovaPropostaPage.tsx

1.1) Hidratar os campos de Permuta ao carregar existingProposal
Hoje o effect “Popular campos quando proposta existente é carregada” não garante (ou pode estar incompleto) para:
- modalidade_proposta
- itens_permuta
- ocultar_valores_publico
- descricao_contrapartida
- metodo_pagamento_alternativo
Ações:
- Ao entrar em edição, setar explicitamente:
  - setModalidadeProposta(existingProposal.modalidade_proposta ?? 'monetaria')
  - setItensPermuta((existingProposal.itens_permuta ?? []) como ItemPermuta[])
  - setOcultarValoresPublico(!!existingProposal.ocultar_valores_publico)
  - setDescricaoContrapartida(existingProposal.descricao_contrapartida ?? '')
  - setMetodoPagamentoAlternativo(existingProposal.metodo_pagamento_alternativo ?? null)
- Garantir também que “metodo_pagamento_alternativo” não seja sobrescrito indevidamente quando modalidade_proposta === 'permuta'.

1.2) Hidratar “validade” (expires_at) corretamente ao editar
Hoje o estado default é validityHours=24 e customDateRange undefined.
Se a proposta já tinha validade diferente, ao editar e salvar, ela pode ser alterada sem intenção.
Ações:
- Se existingProposal.expires_at é null:
  - setValidityHours(0) (indeterminada)
- Se exists expires_at:
  - Calcular diferença em horas (expires_at - now) e:
    - se bater exatamente com opções (24/72/168 etc.), setValidityHours(opção)
    - senão, setValidityHours(-1) e setCustomDateRange({ from: hoje, to: expires_at })

1.3) Tornar robusto o carregamento de selected_buildings (evitar perder seleção)
Hoje o loader assume selected_buildings como array de objetos no formato { building_id, is_manual, ... } (e é assim que o envio salva).
Mas há casos em que rascunhos/legacy podem ter formatos diferentes (ex.: array de ids, ou objetos incompletos).
Ações:
- Implementar normalização do selected_buildings:
  - Se Array de objetos com building_id: extrair ids normalmente
  - Se Array de strings: usar diretamente como ids (sem filtrar por building_id)
  - Se estiver vazio/nulo: setSelectedBuildings([]) sem crash
- Manual buildings:
  - Se vierem objetos is_manual=true, reconstruir manualBuildings como já existe
  - Se vierem apenas ids (sem metadata), não inventar dados; manter como não-manual e evitar deletar (não deve “sumir” do banco — apenas não haverá como reconstruir manual sem dados). Neste caso, também não sobrescrever selected_buildings com array “rico” vazio ao salvar.

1.4) Reset seguro ao trocar de proposta no mesmo componente (estado “gruda”)
Se você navega de uma edição para outra sem o componente desmontar, o state dataLoaded pode permanecer true e impedir o carregamento do novo registro.
Ações:
- Criar um effect: quando editProposalId mudar:
  - setDataLoaded(false)
  - (opcional, mas recomendado) resetar estados críticos para evitar mostrar dados antigos por 1-2 frames: selectedBuildings, manualBuildings, itensPermuta, clientData, etc. de forma controlada (sem mudar UI, só limpando estado antes de hidratar).
- Ajustar dependências do effect de hidratação para incluir editProposalId (para garantir recarregamento).

2) Impedir sobrescrita acidental: “não salvar enquanto não carregou”
Mesmo com hidratação, precisamos de um “airbag”: ninguém deveria conseguir salvar uma edição antes do estado estar consistente.
Ações:
- Na mutation de update (isEditMode):
  - Se isLoadingProposal || !existingProposal || !dataLoaded: bloquear update com toast “Aguarde carregar a proposta para edição”.
- No botão “Enviar”/“Salvar” em modo edição:
  - Desabilitar/interceptar clique enquanto não estiver dataLoaded.
Isso não muda workflow, só evita um estado perigoso.

3) Rascunho Auto-save: hoje “salva só algumas coisas” — tornar o payload completo e consistente
Arquivo: src/pages/admin/proposals/NovaPropostaPage.tsx

Causa provável do “salva apenas algumas coisas”
- O auto-save atual monta um draftData bem reduzido e ainda com alguns campos obrigatórios preenchidos de forma incorreta (ex.: total_panels: selectedBuildings.length em vez de totalPanels).
- Além disso, ele salva selected_buildings como array de ids, enquanto o envio salva selected_buildings como array de objetos detalhados. Isso gera inconsistência e pode quebrar a tela de edição ou causar “perda” de dados quando alterna fluxos.

Ações:
3.1) Unificar a construção de payload: uma função “buildProposalPayload()”
- Extrair uma função interna (no mesmo arquivo) que monta o payload completo de proposals (ou quase completo), reutilizando a mesma lógica do envio:
  - selected_buildings: sempre salvar como array de objetos detalhados (buildingsData) tal como o envio faz
  - total_panels: usar totalPanels real (inclui venda futura e manuais)
  - total_impressions_month: usar totalImpressionsAdjusted
  - tipo_produto, quantidade_posicoes, payment_type, duration_months/custom_days/is_custom_days, discount, fidel_monthly_value/cash_total_value (para permuta, pode manter 0, mas consistente)
  - campos de permuta: modalidade_proposta, itens_permuta, valor_total_permuta, ocultar_valores_publico, descricao_contrapartida, metodo_pagamento_alternativo
  - validade: expires_at conforme estado atual
  - cliente: nome, email, telefone, endereço/lat/lng, país, documento
  - (opcional) campos avançados que já existem no envio: exclusividade, travamento, multa, venda_futura etc. para não “sumir” ao longo do rascunho
- Auto-save deve usar a MESMA função, com status='rascunho' e number=RASCUNHO-...

3.2) Garantir que o auto-save não “apague” campos que o usuário não tocou
- Antes de “update” do rascunho existente, considerar:
  - Se estivermos editando um rascunho existente (draftId), tudo bem sobrescrever com payload completo.
  - Se a proposta já existia e estamos em modo edição (isEditMode): manter auto-save DESLIGADO (já está), para não brigar com update de edição.

3.3) Corrigir “campos obrigatórios” do banco na gravação do rascunho
- Ajustar valores para:
  - total_panels: totalPanels (não selectedBuildings.length)
  - total_impressions_month: totalImpressionsAdjusted (não 0)
  - cash_total_value e fidel_monthly_value: coerentes com modalidade (para permuta pode ser 0, mas não “inventar” a partir de fidelValue se a UI está escondida)
Isso evita rascunho “meio salvo” por falha silenciosa.

4) Diagnóstico humano (checklist) dentro do código: revisar todos os pontos que podem “sumir”
Sem mudar UI, vou revisar e corrigir a hidratação/salvamento destes blocos para consistência:
- Cliente: nome, empresa, email, telefone, país, documento, endereço + lat/lng
- Prédios:
  - selected_buildings (array detalhado)
  - manualBuildings (quando existirem)
  - venda_futura/predios_contratados/telasContratadas (se existirem no estado)
- Período:
  - duration_months e/ou is_custom_days/custom_days
- Produto:
  - tipo_produto, quantidade_posicoes
- Pagamento:
  - payment_type, custom_installments, fidel_monthly_value, cash_total_value, discount_percent
- Permuta:
  - modalidade_proposta, itens_permuta, ocultar_valores_publico, descricao_contrapartida, metodo_pagamento_alternativo, valor_total_permuta
- Condições comerciais:
  - exclusividade_* / travamento_* / multa_*
- Validade:
  - expires_at e UI state validityHours/customDateRange
- CC emails
- created_by / vendedor selecionado (selectedSellerId)

5) Critério de aceitação (o que você vai testar)
Cenários obrigatórios:
1) Abrir /editar para uma proposta de permuta já preenchida:
   - Deve aparecer: prédios marcados, período correto, itens de permuta listados, “ocultar valores” marcado, descrição preenchida (se houver).
2) Abrir /editar e NÃO mexer em nada, clicar salvar/enviar:
   - Não pode “apagar” itens_permuta, selected_buildings ou qualquer campo anteriormente salvo.
3) Fazer pequenas alterações (ex.: adicionar 1 item de permuta) e salvar:
   - Deve preservar o restante intacto.
4) Criar proposta nova, digitar parcialmente e esperar 3s:
   - Rascunho deve ser salvo com todos os campos relevantes e depois reabrir esse rascunho em /editar deve carregar completo.

Notas técnicas (para manter tudo “à prova de falhas”)
- O maior risco aqui é o “shape mismatch” de selected_buildings (ids vs objetos). A correção vai padronizar para o formato detalhado sempre que possível.
- Também vou evitar que qualquer update rode com “form state” não inicializado (guard por dataLoaded).
- Mudanças serão restritas a NovaPropostaPage.tsx (lógica de hidratação/normalização/auto-save) e, se necessário, pequenos ajustes em helpers internos; sem alterar layout/fluxo.

Arquivos envolvidos
- src/pages/admin/proposals/NovaPropostaPage.tsx (principal)
- (somente se precisar para normalização de tipos) src/types/permuta.ts (apenas leitura/uso; sem alterar API pública)

Entrega esperada
- “Editar proposta” deixa de apagar/zerar qualquer coisa.
- Rascunho passa a salvar de forma completa e consistente, permitindo retomar o trabalho sem perda.
