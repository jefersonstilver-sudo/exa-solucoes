-- ============================================
-- EDITOR DE VÍDEOS BETA - DATABASE FOUNDATION
-- ============================================

-- 1. ADD FEATURE FLAG TO USERS TABLE
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS can_use_video_editor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_editor_enabled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS video_editor_enabled_by UUID REFERENCES users(id);

-- Enable for super admin master
UPDATE users 
SET can_use_video_editor = true,
    video_editor_enabled_at = NOW(),
    video_editor_enabled_by = id
WHERE email = 'jefersonstilver@gmail.com';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_users_video_editor ON users(can_use_video_editor) WHERE can_use_video_editor = true;

-- 2. VIDEO EDITOR PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_editor_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Status and progress
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'editing', 'rendering', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Project data (JSON)
  project_data JSONB NOT NULL DEFAULT '{}',
  
  -- Export settings
  export_format TEXT DEFAULT 'mp4' CHECK (export_format IN ('mp4', 'webm', 'gif')),
  export_quality TEXT DEFAULT 'high' CHECK (export_quality IN ('low', 'medium', 'high', 'ultra')),
  export_resolution TEXT DEFAULT '1080p' CHECK (export_resolution IN ('480p', '720p', '1080p', '4k')),
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_version_id UUID REFERENCES video_editor_projects(id),
  
  -- Metadata
  duration_seconds NUMERIC(10,2),
  file_size_mb NUMERIC(10,2),
  output_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rendered_at TIMESTAMP WITH TIME ZONE,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_projects_user ON video_editor_projects(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_video_projects_status ON video_editor_projects(status);
CREATE INDEX IF NOT EXISTS idx_video_projects_created ON video_editor_projects(created_at DESC);

-- RLS Policies
ALTER TABLE video_editor_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own projects" ON video_editor_projects;
CREATE POLICY "Users can view own projects" 
  ON video_editor_projects FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Authorized users can create projects" ON video_editor_projects;
CREATE POLICY "Authorized users can create projects" 
  ON video_editor_projects FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.can_use_video_editor = true
    )
  );

DROP POLICY IF EXISTS "Users can update own projects" ON video_editor_projects;
CREATE POLICY "Users can update own projects" 
  ON video_editor_projects FOR UPDATE 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own projects" ON video_editor_projects;
CREATE POLICY "Users can delete own projects" 
  ON video_editor_projects FOR DELETE 
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_video_projects_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_edited_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_video_projects_timestamp ON video_editor_projects;
CREATE TRIGGER trigger_update_video_projects_timestamp
BEFORE UPDATE ON video_editor_projects
FOR EACH ROW
EXECUTE FUNCTION update_video_projects_timestamp();

-- 3. VIDEO EDITOR ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_editor_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES video_editor_projects(id) ON DELETE SET NULL,
  
  -- File info
  asset_type TEXT NOT NULL CHECK (asset_type IN ('video', 'image', 'audio', 'logo', 'template')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_mb NUMERIC(10,2) NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Organization
  folder TEXT DEFAULT 'uploads',
  tags TEXT[] DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_assets_user ON video_editor_assets(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_video_assets_type ON video_editor_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_video_assets_project ON video_editor_assets(project_id);

-- RLS Policies
ALTER TABLE video_editor_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assets" ON video_editor_assets;
CREATE POLICY "Users can view own assets" 
  ON video_editor_assets FOR SELECT 
  USING (user_id = auth.uid() OR is_public = true);

DROP POLICY IF EXISTS "Authorized users can upload assets" ON video_editor_assets;
CREATE POLICY "Authorized users can upload assets" 
  ON video_editor_assets FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.can_use_video_editor = true
    )
  );

DROP POLICY IF EXISTS "Users can update own assets" ON video_editor_assets;
CREATE POLICY "Users can update own assets" 
  ON video_editor_assets FOR UPDATE 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own assets" ON video_editor_assets;
CREATE POLICY "Users can delete own assets" 
  ON video_editor_assets FOR DELETE 
  USING (user_id = auth.uid());

-- 4. VIDEO EDITOR TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_editor_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('social', 'promo', 'tutorial', 'general')),
  thumbnail_url TEXT,
  preview_url TEXT,
  
  -- Template configuration
  template_data JSONB NOT NULL DEFAULT '{}',
  default_duration INTEGER DEFAULT 30,
  aspect_ratio TEXT DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', '4:5')),
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_active ON video_editor_templates(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_templates_category ON video_editor_templates(category);

-- RLS Policies
ALTER TABLE video_editor_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone with access can view templates" ON video_editor_templates;
CREATE POLICY "Anyone with access can view templates" 
  ON video_editor_templates FOR SELECT 
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.can_use_video_editor = true
    )
  );

DROP POLICY IF EXISTS "Super admin can manage templates" ON video_editor_templates;
CREATE POLICY "Super admin can manage templates" 
  ON video_editor_templates FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- 5. VIDEO EDITOR ACCESS LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_editor_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event
  event_type TEXT NOT NULL CHECK (event_type IN ('access', 'create', 'edit', 'export', 'delete', 'share')),
  project_id UUID REFERENCES video_editor_projects(id) ON DELETE SET NULL,
  
  -- Details
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON video_editor_access_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_event ON video_editor_access_logs(event_type, created_at DESC);

-- RLS Policies
ALTER TABLE video_editor_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can insert logs" ON video_editor_access_logs;
CREATE POLICY "System can insert logs" 
  ON video_editor_access_logs FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Super admin can view logs" ON video_editor_access_logs;
CREATE POLICY "Super admin can view logs" 
  ON video_editor_access_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );