# Financeiro — etapas 0 e 1
- [x] Fotografar contagens e estado técnico antes da ingestão.
- [x] Ampliar logs, restringir acesso e preparar registro atômico por ID de evento Asaas.
- [x] Instrumentar sincronizações de entradas e saídas com paginação completa.
- [x] Suspender agendamentos antigos com autenticação insegura.
- [ ] Ativar webhook autenticado e processamento seguro — bloqueado até configurar o mesmo token no Asaas e em Project Settings → Secrets; implantação sem isso interromperia notificações. O código preparado nesta etapa apenas registra eventos para reconciliação posterior e não dá baixa em pedidos.
- [ ] Substituir agendamentos por acionamento seguro com resultado final verificável — bloqueado por ausência de credencial de agendamento compartilhável neste ambiente; enquanto isso a sincronização depende de acionamento manual autorizado.
- [ ] Conciliar histórico por IDs Asaas — reservado para etapa 2.
