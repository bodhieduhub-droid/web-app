-- Run this in your Supabase SQL Editor
ALTER TABLE readers
ADD COLUMN id_proof_verified BOOLEAN DEFAULT false;
