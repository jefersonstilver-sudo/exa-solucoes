
-- Corrige os 3 devices "ghost online" que sumiram da API AnyDesk
-- Marca como offline mas preserva last_online_at original (jan/2026)
-- e adiciona flag stale na metadata para a UI exibir badge âmbar.

UPDATE public.devices
SET 
  status = 'offline',
  consecutive_offline_count = 0,
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'stale', true,
    'stale_reason', 'not_returned_by_anydesk_api',
    'stale_detected_at', now(),
    'stale_since', last_online_at
  )
WHERE anydesk_client_id IN ('1217746313', '1470796265', '1974596809')
  AND is_deleted = false;

-- Registra evento no log
INSERT INTO public.events_log (computer_id, event_type, old_status, new_status, description, metadata)
SELECT 
  id,
  'stale_detected',
  'online',
  'offline',
  'Device removido da API AnyDesk - marcado como offline retroativo',
  jsonb_build_object('stale_since', last_online_at, 'reason', 'manual_audit_correction')
FROM public.devices
WHERE anydesk_client_id IN ('1217746313', '1470796265', '1974596809')
  AND is_deleted = false;
