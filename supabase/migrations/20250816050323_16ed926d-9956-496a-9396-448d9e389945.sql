-- Create table for pin positioning logs and manual coordinates
CREATE TABLE IF NOT EXISTS building_pin_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL,
  old_latitude NUMERIC,
  old_longitude NUMERIC,
  new_latitude NUMERIC NOT NULL,
  new_longitude NUMERIC NOT NULL,
  adjusted_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add manual positioning fields to buildings table
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS manual_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS manual_longitude NUMERIC,
ADD COLUMN IF NOT EXISTS position_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS position_validation_date TIMESTAMP WITH TIME ZONE;

-- Enable RLS on pin adjustments
ALTER TABLE building_pin_adjustments ENABLE ROW LEVEL SECURITY;

-- Create policies for pin adjustments - only admins can view/modify
CREATE POLICY "Admins can manage pin adjustments" 
ON building_pin_adjustments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = ANY (ARRAY['admin', 'super_admin'])
));

-- Create function to log pin adjustments
CREATE OR REPLACE FUNCTION log_pin_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if manual coordinates actually changed
  IF (OLD.manual_latitude IS DISTINCT FROM NEW.manual_latitude) OR 
     (OLD.manual_longitude IS DISTINCT FROM NEW.manual_longitude) THEN
    
    INSERT INTO building_pin_adjustments (
      building_id,
      old_latitude,
      old_longitude,
      new_latitude,
      new_longitude,
      adjusted_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.manual_latitude,
      OLD.manual_longitude,
      NEW.manual_latitude,
      NEW.manual_longitude,
      auth.uid(),
      'Manual position adjustment'
    );
    
    -- Update validation status
    NEW.position_validated = true;
    NEW.position_validation_date = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for logging pin adjustments
DROP TRIGGER IF EXISTS building_pin_adjustment_trigger ON buildings;
CREATE TRIGGER building_pin_adjustment_trigger
  BEFORE UPDATE ON buildings
  FOR EACH ROW
  EXECUTE FUNCTION log_pin_adjustment();