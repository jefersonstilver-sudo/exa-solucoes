-- Allow anon to read incident categories
CREATE POLICY "Anon users can read incident_categories" ON public.incident_categories FOR SELECT TO anon USING (true);

-- Allow anon to read device offline incidents  
CREATE POLICY "Anon users can read device_offline_incidents" ON public.device_offline_incidents FOR SELECT TO anon USING (true);

-- Allow anon to update device offline incidents (register cause)
CREATE POLICY "Anon users can update device_offline_incidents" ON public.device_offline_incidents FOR UPDATE TO anon USING (true) WITH CHECK (true);