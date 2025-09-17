/*
  # Remover sistema de usuários e ajustar solicitações

  1. Modificações
    - Remover tabela usuarios
    - Ajustar tabela solicitacoes para não depender de usuarios
    - Atualizar políticas de segurança

  2. Segurança
    - Manter RLS nas tabelas necessárias
    - Ajustar políticas para funcionar sem sistema de usuários
*/

-- Remover tabela de usuários
DROP TABLE IF EXISTS usuarios CASCADE;

-- Ajustar tabela de solicitações para não depender de usuários
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'solicitacoes' AND column_name = 'aprovado_por'
  ) THEN
    ALTER TABLE solicitacoes DROP COLUMN aprovado_por;
  END IF;
END $$;

-- Adicionar coluna para identificar quem aprovou (texto simples)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'solicitacoes' AND column_name = 'aprovado_por_equipe'
  ) THEN
    ALTER TABLE solicitacoes ADD COLUMN aprovado_por_equipe text;
  END IF;
END $$;

-- Atualizar políticas da tabela solicitacoes
DROP POLICY IF EXISTS "Usuários podem ler solicitações" ON solicitacoes;
DROP POLICY IF EXISTS "Usuários podem criar solicitações" ON solicitacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar solicitações" ON solicitacoes;

CREATE POLICY "Todos podem ler solicitações"
  ON solicitacoes
  FOR SELECT
  USING (true);

CREATE POLICY "Todos podem criar solicitações"
  ON solicitacoes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar solicitações"
  ON solicitacoes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);