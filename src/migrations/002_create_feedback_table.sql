-- Migration: 002_create_feedback_table.sql
-- Cria a tabela para armazenar feedback dos usuários

CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    email TEXT, -- opcional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Políticas RLS (Row Level Security) - desabilitado para inserts anônimos
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;