-- Limpa incidentes/triggered_rules abertos de painéis em prédios "instalação".
-- Garante que após o bloqueio na função monitor-panels não fiquem ocorrências
-- fantasma penduradas que disparariam um falso "voltou online".
UPDATE devices d
SET metadata = COALESCE(d.metadata, '{}'::jsonb)
  || jsonb_build_object(
       'triggered_rules', '[]'::jsonb,
       'offline_alert_count', 0,
       'current_incident_id', NULL,
       'last_offline_alert_at', NULL,
       'notifications_paused_until', NULL,
       'paused_by', NULL
     )
FROM buildings b
WHERE d.building_id = b.id
  AND lower(translate(coalesce(b.status, ''),
        'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç',
        'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
      )) LIKE '%instala%';