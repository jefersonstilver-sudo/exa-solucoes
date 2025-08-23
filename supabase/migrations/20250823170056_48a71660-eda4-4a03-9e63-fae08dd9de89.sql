-- Secure pedidos table: enforce RLS to prevent public reads
-- Enable Row Level Security (idempotent)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Optionally enforce RLS for all non-bypass roles (safe if policies exist)
ALTER TABLE public.pedidos FORCE ROW LEVEL SECURITY;