/*
  # Criar tabela de atendentes

  1. Nova Tabela
    - `atendentes`
      - `id` (uuid, chave primária)
      - `nome` (text, obrigatório)
      - `created_at` (timestamp com timezone)

  2. Segurança
    - Habilitar RLS na tabela `atendentes`
    - Adicionar política para usuários autenticados lerem todos os dados
    - Adicionar política para usuários autenticados criarem novos atendentes
    - Adicionar política para usuários autenticados deletarem atendentes
*/

CREATE TABLE IF NOT EXISTS atendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE atendentes ENABLE ROW LEVEL SECURITY;

-- Política para leitura de atendentes
CREATE POLICY "Usuários podem ler atendentes"
  ON atendentes
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para criação de atendentes
CREATE POLICY "Usuários podem criar atendentes"
  ON atendentes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para deletar atendentes
CREATE POLICY "Usuários podem deletar atendentes"
  ON atendentes
  FOR DELETE
  TO authenticated
  USING (true);