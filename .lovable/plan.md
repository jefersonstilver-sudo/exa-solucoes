# Plano técnico — Agente de Conciliação de Internet

## Objetivo e limites

Adicionar à rota `/super_admin/paineis-exa` uma área própria de **contas de internet**, sem misturar faturas e pagamentos com os indicadores de conectividade online/offline dos dispositivos. O Asaas continua sendo a fonte de movimentos bancários; a fatura emitida pela operadora é fonte de obrigação e seu estado no portal não comprova, sozinho, a saída bancária. Este plano não executa mudanças, acessa portais nem cria cobranças.

## Estado atual confirmado

- A rota renderiza `PaineisPage` (`src/routes/SuperAdminRoutes.tsx`); `ProviderStatsCards` e `useProviderConnectionStats` mostram conectividade a partir de `devices`, limitados ao grupo `Predios`/`Prédios`, com atualização de 60 segundos e Realtime. `devices` possui `building_id`, `device_group_id`, `provider`, `address`, `status` e ID AnyDesk. Essa leitura **não** informa se a conta da operadora foi paga.
- `buildings` fornece `id`, `nome`, `endereco`, `codigo_predio` e alguns campos informativos do Notion, incluindo `notion_internet`. Vincular contratos pelo `buildings.id`; nome/endereço são evidências de conferência, nunca chave automática suficiente. Um prédio pode ter mais de um dispositivo e mais de um contrato.
- `fornecedores` tem 11 registros, incluindo Ligga, Vivo e Telecom Foz, além de Claro/Oi/Tim; New Oeste e IFOZ não aparecem no cadastro consultado. `contratos_fornecedores` já tem `fornecedor_id`, `building_id`, datas, valor e vencimento, mas **não há registros**; `assinaturas_operacionais` também está vazia. `despesas_fixas` e `parcelas_despesas` têm vínculos de fornecedor/contrato e `asaas_bill_id`, mas representam obrigações financeiras de escopo mais amplo.
- `sync_runs` já registra sincronizações (inclusive outras fontes), enquanto `asaas_extrato_movimentos` e `asaas_saidas` guardam movimentos/saídas Asaas. Existem funções de consulta e sincronização Asaas. As rotinas automáticas de escrita financeira antigas permanecem desativadas por decisão anterior e não devem ser reutilizadas para dar baixa.
- RLS está habilitada nas tabelas consultadas; `devices` admite leitura anônima e atualização autenticada ampla. Portanto **não** guardar credenciais, referências sensíveis, faturas ou documentos em `devices`, `device_groups` ou outros registros públicos. Não foi encontrada tabela específica de faturas/credenciais de operadoras nesta inspeção.

## Experiência proposta

1. Manter intactos cards, filtros, lista e estados de conectividade. Adicionar em `PaineisPage` uma entrada discreta **Contas de internet** que abre uma visão separada: resumo de vencidas, a vencer, pagas e exceções; tabela filtrável por operadora, prédio, competência e situação; última coleta e origem da evidência.
2. Detalhe de cada contrato com prédio(s), titular, identificador oficial, vencimentos, faturas, PDFs/comprovantes oficiais, trilha de eventos e decisão de conciliação. Permitir revisão explícita de correspondências ambíguas e solicitações de reconsulta; nunca oferecer “pago” por inferência de conectividade.
3. Mostrar desafios **CAPTCHA/2FA, acesso expirado, portal indisponível, documento ausente e dados divergentes** como exceções acionáveis. A solução não deve capturar código 2FA em logs nem prometer contornar CAPTCHA; o operador resolve no portal oficial e retoma a coleta quando apropriado.

## Modelo de dados proposto (novas tabelas `public`)

| Tabela | Finalidade e chaves principais |
| --- | --- |
| `internet_providers` | Catálogo de operadoras, aliases normalizados (`NEWOESTE` → `NEW OESTE` etc.), domínio oficial e estratégia `api`/`portal`/`manual`; vincular opcionalmente a `fornecedores.id`, sem confundir a entidade jurídica com o texto de `devices.provider`. |
| `internet_provider_accounts` | Conta/titular por operadora, identificador externo e `credential_ref` opaco apontando para cofre externo; metadados de acesso, sem senha, cookie, token ou resposta confidencial. Acesso restrito a super_admin/equipe financeira autorizada. |
| `internet_contracts` | Contrato da operadora por conta e identificador oficial, titular, endereço de instalação, ciclo, vencimento, estado e eventual vínculo com `contratos_fornecedores.id`; chave única por operadora+ID oficial, quando disponível. |
| `internet_contract_buildings` | Relação N:N contrato–`buildings.id` com evidência, status de validação e quem confirmou; acomoda uma conta com vários prédios e múltiplos contratos no mesmo prédio. Opcional `device_id` apenas quando houver vínculo verificado, nunca como chave de pagamento. |
| `internet_invoices` | Faturas por contrato+ID oficial/número+competência, bruto, vencimento, status do portal, timestamps, hash/metadados de documento e estado de conciliação; índices/uniqueness para reprocessar sem duplicar. Histórico de alterações em eventos, sem sobrescrever evidência anterior. |
| `internet_invoice_payments` | Referências oficiais de pagamento/comprovante e ligação opcional ao movimento Asaas por ID oficial (`asaas_extrato_movimentos.id`/`bill_payment_id` ou ID equivalente), com revisão quando não houver chave confiável; separa “paga no portal” de “confirmada no banco”. |
| `internet_collection_runs` e `internet_reconciliation_events` | Execuções, tentativas, erros redigidos, última coleta, status de desafio e trilha imutável de propostas/confirmações de vínculo ou pagamento; chave de idempotência por trabalho e evento externo. |
| `internet_documents` | Metadados da fatura/comprovante, tipo, hash e caminho em bucket **privado**; acesso por URL assinada curta sob autorização. Não guardar PDF em coluna pública. |

Na implementação, cada `CREATE TABLE public` deve incluir `GRANT` explícito na mesma migração **antes** de ativar RLS e criar políticas. Restringir leitura e escrita por papéis verificados no servidor (`user_roles`/função de autorização efetivamente adotada pelo projeto), sem confiar em status local; worker escreve apenas por funções autorizadas/service role protegido. Criar índices, FKs para tabelas públicas existentes e políticas separadas para leitura administrativa, alterações controladas e serviço. Não alterar registros financeiros legados na migração.

## Serviços e worker

- **Edge Function `internet-accounts-admin`**: autentica usuário e confere papel no servidor; lista contas, contratos, faturas, exceções e evidências paginadas; aceita cadastro/vínculo e solicita reconsulta com validação estrita, trilha de auditoria e sem devolver `credential_ref` ao navegador. Pode ser dividida em leitura/comandos ao implementar.
- **Edge Function `internet-collection-dispatch`**: recebe comando administrativo validado (e futuramente agendamento isolado), cria job idempotente e entrega à fila/worker externo por credencial de máquina guardada em Secrets. Limites de frequência, timeout, retry/backoff e execução por conta/operadora; não executar Playwright dentro da Edge Function.
- **Edge Function `internet-collection-ingest`**: autentica chamada do worker com assinatura/credencial de máquina, valida payload e proveniência, registra primeiro a execução e faz upsert por IDs oficiais de contrato/fatura/documento; não aceita valores arbitrários vindos do browser nem atualiza contas a pagar/Asaas automaticamente.
- **Edge Function `internet-document-access`**: verifica papel e escopo, emite URL assinada curta para bucket privado; nunca expõe credenciais dos portais.
- **Worker externo Playwright** (serviço de execução persistente **fora** deste projeto cliente/Vite e fora das Edge Functions): adaptadores versionados por operadora, API oficial preferida, isolamento de sessão por conta, allowlist dos domínios, login com segredos lidos sob demanda de um cofre com controle de acesso e rotação, coleta paginada, download/validação de PDFs e envio de resultados por canal autenticado. Contratos de entrada/saída comuns permitem novas operadoras sem alterar o núcleo; usar snapshots de teste sanitizados, não contas reais nos testes. O ambiente externo, cofre e permissões são dependências a contratar/configurar antes da operação real.

## Regras de conciliação e etapas

1. Confirmar com a EXA quais contas/contratos e titulares pertencem a cada operadora, quem pode ver documentos e qual infraestrutura hospedará worker/cofre. Cadastrar/validar vínculos por **ID de prédio e ID oficial de contrato**; endereço divergente abre exceção. Não deduzir vínculo pelo provedor do dispositivo.
2. Coletar e auditar faturas primeiro em modo somente leitura. O mesmo ID de fatura reprocessado atualiza estado e acrescenta evento, sem duplicar. Mostrar “não verificado” quando portal/API indisponível, nunca “em dia” por ausência de linhas.
3. Para pagamento, usar identificadores oficiais presentes no portal e no Asaas; exigir revisão humana quando não houver referência comum. Valor, nome, endereço aproximado e competência servem para **sugestão**, nunca para baixa automática. Manter fora das rotinas automáticas financeiras existentes e não reativar agendamentos desabilitados.
4. Fazer piloto em uma conta/operadora, medir divergências e desafios; expandir adaptadores gradualmente. Testar permissões, isolamento de contas, redaction de logs, duplicatas/retries, PDFs privados, indisponibilidade, CAPTCHA/2FA e ciclo de revisão; conferir que os indicadores online/offline e a sincronização Asaas permanecem inalterados.

## Riscos e limitações

- Portais mudam layout, podem bloquear automação ou proibi-la contratualmente; verificar termos e preferir API/convênio oficial. CAPTCHA/2FA exige intervenção legítima, não bypass.
- Dados pessoais e bancários em faturas exigem acesso mínimo, criptografia, retenção definida e auditoria (LGPD). Segredo precisa de cofre externo real; uma referência em tabela não é proteção se o worker puder resolver segredos sem autenticação.
- A identidade textual do provedor em `devices` e o cadastro jurídico em `fornecedores` não são equivalentes; existem aliases e operadoras ainda não cadastradas. Não há contratos de fornecedor preenchidos para reutilização imediata.
- Não há vínculo bancário oficial garantido em todas as faturas: nesses casos o estado ficará pendente de revisão; não certificar conciliação pela mera coleta de PDF nem alterar dívida/despesa/pedido automaticamente.