export function eligibleForOrderSync(order: { status: string; data_fim?: string | null }, today: string) {
  return ['ativo', 'video_aprovado'].includes(order.status) &&
    (!order.data_fim || order.data_fim.slice(0, 10) >= today);
}

export function collectOrderBuildings(own: string[] | null, children: Array<{ lista_predios: string[] | null }>) {
  return [...new Set([...(own || []), ...children.flatMap(child => child.lista_predios || [])])];
}

export function orderSyncOutcome(expected: number, sent: number, response: { task_id?: string; task_ids?: string[]; success?: boolean }) {
  if (sent !== expected || response.success === false) return 'error';
  return response.task_id || response.task_ids?.length ? 'pending' : 'success';
}