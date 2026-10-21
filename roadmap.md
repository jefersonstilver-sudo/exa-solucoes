# CRM 360
- [x] Integrar ficha somente leitura via RPC existente em Sofia, usuários e pedidos, sem alterar banco ou dados.
- [x] Adicionar Consolidação via view existente; 33 testes passaram e compilação automática OK.
- [ ] Solicitar publicação — aguardando decisão sobre 51 alertas críticos preexistentes de segurança.
- [ ] Validar fluxo autenticado — Supabase externo não fornece sessão de teste neste ambiente.

# Financeiro — etapas 0 e 1
- [x] Migrar chamadas frontend de pagamento ao Asaas existente, ocultar meios não suportados, retirar recuperações automáticas e preservar funções protegidas; 16 testes passaram e compilação OK.
- [ ] Validar geração/retomada real de Pix e Pix Automático com sessão autenticada — bloqueado: Supabase externo sem sessão de teste disponível; contrato não oferece recuperação de QR já emitido após recarregar.
- [ ] Zerar busca literal de "mercado" em todo src — bloqueado por campos históricos em tipos gerados que não podem ser editados manualmente; textos editoriais sem relação com pagamento preservados.
- [x] Corrigir envio imediato após extensão/reativação, cobertura master/filhos, preservação do vídeo base/programações e sinalização de envios parciais/pendentes; cinco testes passaram.
- [ ] Executar e confirmar reenvio real AWS dos 20 pedidos vigentes (22 ativos, dois vencidos) — bloqueado: chamadas administrativas retornam 401 e Supabase externo não fornece sessão autenticada neste ambiente. Nenhum reenvio global foi confirmado.
- [x] Liberar 35 segundos para Curiosidades e reorganização por arraste nos cards de pedidos; ordem salva por conta neste navegador, cinco testes passaram e build OK.
- [ ] Validar upload e arraste com pedidos reais na sessão do proprietário — bloqueado: Supabase externo sem sessão de teste disponível.
- [x] Contas de Internet, fase 1: schema/RLS, bucket privado, funções administrativas e tela isolada com execução vazia real.
- [ ] Contas de Internet, fase 2: worker externo, cofre e piloto LIGGA somente leitura — depende de infraestrutura externa aprovada; não solicitar credenciais na fase 1.
- [x] Pausar agendamento mensal de parcelas e gatilhos de geração/espelhamento financeiro, sem alterar obrigações existentes.
- [x] Retirar da configuração os agendamentos automáticos de cancelamento de pedidos, cobrança de fidelidade e lembretes PIX; também suspender o verificador automático legado no frontend e ocultar a geração manual de fluxo de despesas.
- [ ] Confirmar no painel de agendamentos hospedados a desativação efetiva dos três agendamentos definidos apenas na configuração; removê-los do arquivo não comprova cancelamento de jobs remotos. O banco pg_cron contém somente o agendamento mensal de parcelas (pausado) entre os jobs financeiros remanescentes.
- [ ] Rotas manuais e webhooks legados de pagamento ainda podem escrever status ou criar cobranças se invocados; não desativar sem decisão específica sobre pagamentos em produção. Relatórios VAR e lembretes de propostas são comunicação comercial, não processamento bancário, e continuam agendados.
- [x] Fotografar contagens e estado técnico antes da ingestão.
- [x] Ampliar logs, restringir acesso e preparar registro atômico por ID de evento Asaas.
- [x] Instrumentar sincronizações de entradas e saídas com paginação completa.
- [x] Suspender agendamentos antigos com autenticação insegura.
- [x] Implantar webhook autenticado após configuração do token: o endpoint responde e rejeita requisições sem token ou com token inválido; nesta etapa apenas registra eventos para reconciliação posterior e não dá baixa em pedidos.
- [x] Validar o endpoint EXA-PAGAMENTOS-2.0 pelo lado Supabase/Lovable: função responde 405 a GET e 401 a POST vazio sem token ou com token inválido; usa `asaas-access-token` e registra por ID antes de confirmar. Nenhum evento Asaas novo consta em `webhook_logs` e a entrega real ainda não foi comprovada.
- [ ] Confirmar após o reenvio real no Asaas do evento `evt_05b708f961d739ea7eba7e4db318f621&1543434805` que há resposta 200 e registro único em `webhook_logs`, sem baixa automática; bloqueado até o reenvio externo. A função corrigida foi publicada e os testes locais passaram, mas não há chamada nem registro do evento após a publicação. O pagamento `pay_8mj3fhelg71jibab` ainda não consta em `transacoes_asaas`.
- [ ] Substituir agendamentos por acionamento seguro com resultado final verificável — bloqueado por ausência de credencial de agendamento compartilhável neste ambiente; enquanto isso a sincronização depende de acionamento manual autorizado.
- [ ] Conciliar histórico por IDs Asaas — reservado para etapa 2.

# Espelho do extrato Asaas
- [ ] Confirmar o clique na linha EBANX e em PAYMENT_RECEIVED com sessão administrativa no aplicativo — bloqueado: esta prévia usa Supabase externo e não oferece sessão administrativa de teste. Painel e função publicados; consultas oficiais de EBANX (HTTP 200, comprovante presente) e PAYMENT_RECEIVED (HTTP 200, cliente HTTP 200) verificadas separadamente, sem alterar lançamentos.
- [x] Criar espelho separado com acesso administrativo, leitura integral paginada do extrato oficial e conferência por IDs oficiais; adicionar tela de extrato no financeiro.
- [x] Comparar a API real ao arquivo enviado sem importar dados: 492 movimentos e 492 pares data/valor/saldo coincidentes, fechamento R$ 1.063,24; IDs da API (ftn_) diferem dos números no XLSX.
- [ ] Executar leitura no aplicativo com sessão administrativa, repetir para aferir idempotência e conferir registros gravados — bloqueado: Supabase externo não fornece sessão de teste e não há usuário conectado na prévia.
- [ ] Ativar atualização independente de visitas ao aplicativo somente quando existir agendador autenticado autorizado, sem reativar rotinas financeiras antigas.

# Fundação financeira EXA 2.0
- [x] Separar indicadores bancários de contratado/previsto, substituir receita derivada de pedidos no painel principal e adicionar alerta de conciliação.
- [x] Ampliar visualização do extrato por período/tipo/categoria, sem modificar sincronização ou dar baixa.
- [ ] Certificar conciliação fim a fim por IDs de todas as obrigações, testes e operações internas — bloqueado: espelho contém movimentos sem correspondência e falta vínculo comercial inequívoco.
- [ ] Validar telas financeiras autenticadas na prévia — bloqueado: conexão Supabase externa sem sessão administrativa injetada.

# Sofia — correções do CEO (21/10)
- [x] Acessar como cliente: visão interna mantém a sessão e mostra os dados do cliente (sem redirecionar ao painel do CEO).
- [x] Ranking: "Sofia (IA)" com propostas/pedidos pagos/valor vendido; selo "Vendido pela Sofia" na lista e no detalhe.
- [x] Detalhe do pedido: método real (PIX/PIX Automático), termos via contrato assinado, dia de vencimento das parcelas, contrato e cronograma.
- [x] Perfil único em users.nome com sincronização de pedidos.client_name; aba "Perfil do cliente" e campos de marca.
- [x] Faturas: não fica mais preso no carregamento; mostra cobranças Asaas.
- [x] Cupons: tipo "Valor fixo por mês".
- [ ] Validar com sessão real do CEO o pedido 7ce35fb8 — bloqueado: Supabase externo sem sessão de teste neste ambiente.
- [ ] sofia_aceites sem regra de leitura no navegador — aceite por código não é lido diretamente; usar contrato assinado/cobranças da Sofia até liberar leitura (mudança de banco não autorizada).
