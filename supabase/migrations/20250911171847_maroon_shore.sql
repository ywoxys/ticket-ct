/*
  # Sistema de Distribuição de Clientes

  1. Novas Tabelas
    - `configuracoes_supervisor`
      - `id` (uuid, chave primária)
      - `mes_referente` (text, mês de referência para planilhas)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - Modificar tabela `atendentes` para incluir `id_planilha`

  2. Segurança
    - Habilitar RLS nas tabelas
    - Adicionar políticas apropriadas
*/

-- Criar tabela de configurações do supervisor
CREATE TABLE IF NOT EXISTS configuracoes_supervisor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referente text NOT NULL DEFAULT 'Janeiro',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE configuracoes_supervisor ENABLE ROW LEVEL SECURITY;

-- Inserir configuração padrão
INSERT INTO configuracoes_supervisor (mes_referente) VALUES ('Janeiro')
ON CONFLICT DO NOTHING;

-- Adicionar coluna id_planilha à tabela atendentes se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'atendentes' AND column_name = 'id_planilha'
  ) THEN
    ALTER TABLE atendentes ADD COLUMN id_planilha text;
  END IF;
END $$;

-- Políticas para configurações do supervisor
CREATE POLICY "Todos podem ler configurações"
  ON configuracoes_supervisor
  FOR SELECT
  USING (true);

CREATE POLICY "Todos podem atualizar configurações"
  ON configuracoes_supervisor
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos podem inserir configurações"
  ON configuracoes_supervisor
  FOR INSERT
  WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela configuracoes_supervisor
CREATE TRIGGER update_configuracoes_supervisor_updated_at
    BEFORE UPDATE ON configuracoes_supervisor
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();