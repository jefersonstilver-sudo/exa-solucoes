Use `devices` as the source of current provider connectivity, querying all non-deleted rows with pagination and a Realtime subscription plus 60-second refresh; history events describe outages, not live status.
For provider connection cards and their detailed list, restrict devices to the IDs of the current Predios/Prédios device group; group membership is the source of truth, not building_id, so internal and ungrouped devices are excluded.
For provider outage start times, use an open offline event newer than the device's last online observation; fall back to labeled last-online time because stale open events can remain after recovery.
Cache only successful public logo responses for at most 24 hours and time-bound their upstream fetch; this preserves real previously loaded logos during transient Supabase outages without indefinite stale images.
For Asaas ingestion, authenticate events and persist a unique provider/event ID before acknowledging; do not credit orders by name or amount, because those matches can credit the wrong client.
Keep financial generation cron jobs and automatic finance-writing triggers disabled until the approved replacement is in place; preserve existing obligations and use only authorized manual Asaas mirror synchronization.
Mirror Asaas bank movements separately from receivables and outflows using financialTransactions IDs; reconcile only by provider IDs and never trigger financial settlement from a statement line.
Read Asaas statement details through an admin-authorized edge function keyed by stored movement ID; this keeps provider credentials and related-resource resolution off the browser.

Executive finance must derive realized cash from paginated Asaas statement movements and treat contracted/forecast obligations separately; this prevents order totals or legacy payments being mislabeled as bank receipts.
Statement categories are display-only until an official provider ID verifies the corresponding obligation; this prevents approximate matching from changing financial state.
Keep internet account billing in dedicated internet_* tables and private document storage, separate from devices and Asaas; portal payment status is not bank reconciliation.
Dispatch internet collections through the service-only atomic RPC with a request key and per-account jobs; Phase 1 ingest stays closed until a separately authenticated worker and vault exist.
