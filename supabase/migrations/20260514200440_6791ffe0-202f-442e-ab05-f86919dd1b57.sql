UPDATE public.devices
SET is_deleted = false,
    deleted_at = NULL,
    deleted_by = NULL,
    name = 'Royal Legacy 2',
    condominio_name = 'Royal Legacy 2',
    status = 'unknown'
WHERE anydesk_client_id = '1623531003';