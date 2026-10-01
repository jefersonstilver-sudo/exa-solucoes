# Lista detalhada de conexões por operadora

## Resultado esperado
- Manter os cartões atuais de operadoras e acrescentar um botão “Ver todas as conexões” que abre uma lista completa, sem substituir a visão atual.
- Mostrar uma linha por conexão cadastrada: nome do prédio, operadora, endereço físico, status e, quando offline, a data/hora e a duração da queda.
- Permitir ordenar por status (offline primeiro ou online primeiro), além de filtrar por operadora e pesquisar prédio/endereço. Diferenciar “desconhecido” de online e offline.
- Em telas menores, apresentar os mesmos dados de forma legível, com rolagem; indicar claramente endereço ou horário não disponíveis, sem inventar valores.

## Melhorias úteis antes de implementar
- **Priorizar atendimento:** iniciar com offline primeiro e, entre os offline, mostrar as quedas mais antigas no topo.
- **Evitar confusão entre vários links no mesmo prédio:** identificar cada conexão pelo painel/identificador existente; a lista conta conexões, não prédios únicos.
- **Confiança nos dados:** exibir a hora da última atualização e não transformar “última vez online” em horário exato da queda.

## Detalhes técnicos e validação
- Reutilizar os registros não excluídos de `devices`, com paginação completa, assinatura Realtime e atualização de 60 segundos, mantendo os totais dos cartões e a tabela consistentes.
- Usar `devices.address` para endereço físico e `devices.condominio_name` para nome do prédio. Confirmar nos dados reais como os endereços ausentes e os prédios não vinculados aparecem.
- Para “offline desde”, verificar o evento de queda **em aberto** (`connection_history.event_type = 'offline'`, `ended_at` vazio) do dispositivo. O horário de `last_online_at` é a última observação online e não necessariamente o início exato da queda; quando não houver evento válido, apresentar apenas “Última vez online” ou “Horário indisponível”, sem precisão falsa. Eventos históricos não determinam o status atual.
- Verificar com dados reais que cada linha bate com seu cartão de operadora, que ordenação/filtros funcionam e que a lista não corta registros além do limite de consulta; preservar o restante da página.
