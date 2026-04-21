-- Add visit_date and visit_time to enquiries table
ALTER TABLE enquiries 
ADD COLUMN IF NOT EXISTS visit_date DATE,
ADD COLUMN IF NOT EXISTS visit_time TIME;

-- Add a comment to the columns for clarity
COMMENT ON COLUMN enquiries.visit_date IS 'Scheduled date for the hub visit';
COMMENT ON COLUMN enquiries.visit_time IS 'Scheduled time for the hub visit';
