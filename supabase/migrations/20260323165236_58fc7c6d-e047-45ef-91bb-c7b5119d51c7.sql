
-- Step 1: Drop the old unique constraint that doesn't include departamento_id
ALTER TABLE public.role_permissions DROP CONSTRAINT role_permissions_role_key_permission_key_key;

-- Step 2: Create new unique index that includes departamento_id
CREATE UNIQUE INDEX role_permissions_role_dept_perm_key 
ON public.role_permissions (role_key, permission_key, COALESCE(departamento_id, '00000000-0000-0000-0000-000000000000'::uuid));
