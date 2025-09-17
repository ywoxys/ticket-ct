/*
  # Adicionar campos de status e observações aos tickets

  1. Modificações na tabela tickets
    - `observacoes` (text, opcional) - observações sobre o ticket
    - `enviado` (boolean, padrão false) - se o ticket foi enviado
    - `pago` (boolean, padrão false) - se o ticket foi pago
    - `data_envio` (timestamp, opcional) - quando foi enviado
    - `data_pagamento` (timestamp, opcional) - quando foi pago

  2. Segurança
    - Manter RLS existente
    - Adicionar políticas para atualização dos novos campos
*/

-- Adicionar novos campos à tabela tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE tickets ADD COLUMN observacoes text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'enviado'
  ) THEN
    ALTER TABLE tickets ADD COLUMN enviado boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'pago'
  ) THEN
    ALTER TABLE tickets ADD COLUMN pago boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'data_envio'
  ) THEN
    ALTER TABLE tickets ADD COLUMN data_envio timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'data_pagamento'
  ) THEN
    ALTER TABLE tickets ADD COLUMN data_pagamento timestamptz;
  END IF;
END $$;

-- Política para atualização de status dos tickets
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar status dos tickets"
  ON tickets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Índices para melhorar performance nas consultas de filtro
CREATE INDEX IF NOT EXISTS idx_tickets_enviado ON tickets(enviado);
CREATE INDEX IF NOT EXISTS idx_tickets_pago ON tickets(pago);
CREATE INDEX IF NOT EXISTS idx_tickets_nome ON tickets(nome);
CREATE INDEX IF NOT EXISTS idx_tickets_matricula ON tickets(matricula);