/*
  # Criar tabela de valores fixos de mensalidades

  1. Nova Tabela
    - `valores_mensalidades`
      - `id` (uuid, chave primária)
      - `quantidade` (integer, quantidade de mensalidades)
      - `valor` (numeric, valor fixo)
      - `ativo` (boolean, se está ativo)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela
    - Adicionar políticas apropriadas
*/

CREATE TABLE IF NOT EXISTS valores_mensalidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quantidade integer NOT NULL UNIQUE,
  valor numeric NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE valores_mensalidades ENABLE ROW LEVEL SECURITY;

-- Inserir valores padrão
INSERT INTO valores_mensalidades (quantidade, valor) VALUES 
  (1, 100.00),
  (2, 200.00),
  (3, 300.00),
  (6, 600.00),
  (12, 1200.00)
ON CONFLICT (quantidade) DO NOTHING;

-- Políticas para valores de mensalidades
CREATE POLICY "Todos podem ler valores de mensalidades"
  ON valores_mensalidades
  FOR SELECT
  USING (ativo = true);

CREATE POLICY "Todos podem atualizar valores de mensalidades"
  ON valores_mensalidades
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos podem inserir valores de mensalidades"
  ON valores_mensalidades
  FOR INSERT
  WITH CHECK (true);