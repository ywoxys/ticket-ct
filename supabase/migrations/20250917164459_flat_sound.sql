/*
  # Criar tabela de clientes

  1. Nova Tabela
    - `clientes`
      - `id` (uuid, chave primária)
      - `matricula` (text, único)
      - `nome` (text, obrigatório)
      - `telefone` (text, obrigatório)
      - `categoria` (text, obrigatório)
      - `ativo` (boolean, padrão true)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela
    - Adicionar políticas apropriadas
*/

CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula text UNIQUE NOT NULL,
  nome text NOT NULL,
  telefone text NOT NULL,
  categoria text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Inserir alguns clientes de exemplo
INSERT INTO clientes (matricula, nome, telefone, categoria) VALUES 
  ('12345', 'João Silva', '(11) 99999-1111', 'NR'),
  ('12346', 'Maria Santos', '(11) 99999-2222', '1'),
  ('12347', 'Pedro Oliveira', '(11) 99999-3333', '2'),
  ('12348', 'Ana Costa', '(11) 99999-4444', '3'),
  ('12349', 'Carlos Lima', '(11) 99999-5555', 'NR')
ON CONFLICT (matricula) DO NOTHING;

-- Políticas para clientes
CREATE POLICY "Todos podem ler clientes"
  ON clientes
  FOR SELECT
  USING (ativo = true);

CREATE POLICY "Supervisão pode gerenciar clientes"
  ON clientes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_matricula ON clientes(matricula);
CREATE INDEX IF NOT EXISTS idx_clientes_categoria ON clientes(categoria);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);