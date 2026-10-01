# Financeiro — etapas 0 e 1
- [x] Fotografar contagens e estado técnico antes da ingestão.
- [x] Ampliar logs, restringir acesso e registrar eventos Asaas atomicamente.
- [x] Instrumentar sincronizações de entradas e saídas com paginação completa.
- [x] Suspender agendamentos antigos com autenticação insegura.
- [ ] Ativar webhook autenticado — bloqueado até configurar o mesmo token no Asaas e em Project Settings → Secrets.
- [ ] Substituir agendamentos por acionamento seguro com resultado final verificável — bloqueado por ausência de credencial de agendamento compartilhável neste ambiente.
- [ ] Conciliar histórico por IDs Asaas — reservado para etapa 2.
