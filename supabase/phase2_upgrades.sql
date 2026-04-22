-- 1. Chat Sessions for Analytics
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  messages_count INTEGER DEFAULT 0,
  converted_to_lead BOOLEAN DEFAULT false
);

-- 2. Advanced RAG Setup
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source_type TEXT DEFAULT 'document',
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(768) -- standard size for many embeddings
);

-- Add comments
COMMENT ON TABLE chat_sessions IS 'Tracks Bhanu chatbot usage for the analytics dashboard';
COMMENT ON TABLE document_chunks IS 'Stores vector embeddings for advanced document RAG';
