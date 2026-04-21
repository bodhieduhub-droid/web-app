-- Chatbots capture natural language (e.g., "tomorrow", "next friday") instead of strict YYYY-MM-DD.
-- We must convert these columns to TEXT to avoid 'invalid input syntax' errors.

ALTER TABLE enquiries
ALTER COLUMN visit_date TYPE TEXT,
ALTER COLUMN visit_time TYPE TEXT;
