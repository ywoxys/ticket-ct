/*
  # Criar tabela de tickets

  1. Nova Tabela
    - `tickets`
      - `id` (uuid, chave primária)
      - `atendente_id` (uuid, chave estrangeira para atendentes)
      - `valor` (numeric, obrigatório)
      - `qtd_mensalidades` (integer, obrigatório)
      - `telefone` (text, obrigatório)
      - `categoria` (text, obrigatório)
      - `created_at` (timestamp com timezone)

  2. Segurança
    - Habilitar RLS na tabela `tickets`
    - Adicionar política para usuários autenticados lerem todos os tickets
    - Adicionar política para usuários autenticados criarem novos tickets

  3. Relacionamentos
    - Chave estrangeira entre tickets.atendente_id e atendentes.id
*/

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendente_id uuid NOT NULL REFERENCES atendentes(id) ON DELETE CASCADE,
  valor numeric NOT NULL,
  qtd_mensalidades integer NOT NULL,
  telefone text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('Link', 'Pix')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Política para leitura de tickets
CREATE POLICY "Usuários podem ler tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para criação de tickets
CREATE POLICY "Usuários podem criar tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Índice para melhorar performance nas consultas por atendente
CREATE INDEX IF NOT EXISTS idx_tickets_atendente_id ON tickets(atendente_id);

-- Índice para melhorar performance nas consultas por data
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);