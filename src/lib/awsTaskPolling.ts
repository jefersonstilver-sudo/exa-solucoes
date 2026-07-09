import { supabase } from '@/integrations/supabase/client';

export type AwsTaskStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'unknown';

export interface AwsTaskStatusResult {
  task_id: string;
  status: AwsTaskStatus;
  http_status?: number;
  error?: string;
}

export interface PollAwsTasksResult {
  completed: string[];
  failed: string[];
  pending: string[]; // ainda em queued/processing/unknown ao dar timeout
  all_ok: boolean;
}

interface PollOptions {
  intervalMs?: number;        // padrão 3s
  timeoutMs?: number;         // padrão 90s
  onTick?: (statuses: AwsTaskStatusResult[]) => void;
}

/**
 * Faz polling em `check-aws-task-status` até que todas as tasks terminem
 * (completed/failed) ou até dar timeout.
 */
export async function pollAwsTasks(
  taskIds: string[],
  options: PollOptions = {},
): Promise<PollAwsTasksResult> {
  const intervalMs = options.intervalMs ?? 3000;
  const timeoutMs = options.timeoutMs ?? 90000;

  const unique = Array.from(new Set(taskIds.filter(Boolean)));
  if (unique.length === 0) {
    return { completed: [], failed: [], pending: [], all_ok: true };
  }

  const start = Date.now();
  const finalStatus = new Map<string, AwsTaskStatus>();

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  while (Date.now() - start < timeoutMs) {
    const pendingIds = unique.filter((id) => {
      const s = finalStatus.get(id);
      return s !== 'completed' && s !== 'failed';
    });

    if (pendingIds.length === 0) break;

    try {
      const { data, error } = await supabase.functions.invoke('update-video-master-aws', {
        body: { action: 'check_status', task_ids: pendingIds },
      });

      if (error) {
        console.warn('[AWS_POLL] erro no check_status, retry em', intervalMs, error);
      } else {
        const list: AwsTaskStatusResult[] = (data as any)?.statuses || [];
        options.onTick?.(list);
        list.forEach((r) => {
          if (r.status === 'completed' || r.status === 'failed') {
            finalStatus.set(r.task_id, r.status);
          }
        });
      }
    } catch (err) {
      console.warn('[AWS_POLL] exceção no polling:', err);
    }

    const stillPending = unique.some((id) => {
      const s = finalStatus.get(id);
      return s !== 'completed' && s !== 'failed';
    });
    if (!stillPending) break;

    await sleep(intervalMs);
  }

  const completed: string[] = [];
  const failed: string[] = [];
  const pending: string[] = [];
  unique.forEach((id) => {
    const s = finalStatus.get(id);
    if (s === 'completed') completed.push(id);
    else if (s === 'failed') failed.push(id);
    else pending.push(id);
  });

  return {
    completed,
    failed,
    pending,
    all_ok: failed.length === 0 && pending.length === 0,
  };
}
