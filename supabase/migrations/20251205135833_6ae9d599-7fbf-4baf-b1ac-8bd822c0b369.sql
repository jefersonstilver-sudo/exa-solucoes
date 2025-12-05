-- Add proposal_id to proposal_alert_recipients table to link recipients to specific proposals
ALTER TABLE proposal_alert_recipients 
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_proposal_alert_recipients_proposal_id 
ON proposal_alert_recipients(proposal_id);

-- Comment for documentation
COMMENT ON COLUMN proposal_alert_recipients.proposal_id IS 'Links recipient to a specific proposal for targeted notifications';