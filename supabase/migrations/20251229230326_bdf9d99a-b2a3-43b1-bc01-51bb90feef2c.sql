-- First, unlink devices from Notion-created buildings
UPDATE devices SET building_id = NULL 
WHERE building_id IN (SELECT id FROM buildings WHERE notion_page_id IS NOT NULL);

-- Now delete all buildings that were created by Notion sync (have notion_page_id)
-- This preserves only the manually created buildings
DELETE FROM buildings WHERE notion_page_id IS NOT NULL;