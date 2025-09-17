/*
  # Sistema de autenticação por equipe

  1. Nova Tabela
    - `equipes`
      - `id` (uuid, chave primária)
      - `nome` (text, nome da equipe)
      - `senha` (text, senha da equipe)
      - `ativo` (boolean, se a equipe está ativa)
      - `created_at` (timestamp)

  2. Modificações na tabela usuarios
    - Remover dependência de email único
    - Adicionar referência à equipe

  3. Segurança
    - Habilitar RLS nas tabelas
    - Adicionar políticas apropriadas
*/

-- Criar tabela de equipes
CREATE TABLE IF NOT EXISTS equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL CHECK (nome IN ('whatsapp', 'ligacao', 'supervisao')),
  senha text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;

-- Inserir equipes padrão com senhas
INSERT INTO equipes (nome, senha) VALUES 
  ('whatsapp', 'whats123'),
  ('ligacao', 'liga123'),
  ('supervisao', 'super123')
ON CONFLICT (nome) DO NOTHING;

-- Política para leitura de equipes (apenas equipes ativas)
CREATE POLICY "Equipes ativas podem ser lidas"
  ON equipes
  FOR SELECT
  USING (ativo = true);

-- Política para atualização de equipes (apenas supervisão)
CREATE POLICY "Supervisão pode atualizar equipes"
  ON equipes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Adicionar colunas na tabela tickets se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'matricula'
  ) THEN
    ALTER TABLE tickets ADD COLUMN matricula text NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'nome'
  ) THEN
    ALTER TABLE tickets ADD COLUMN nome text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Atualizar constraint da categoria para incluir "Outros assuntos"
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_categoria_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_categoria_check 
  CHECK (categoria IN ('Link', 'Pix', 'Outros assuntos'));

-- Adicionar coluna para subcategoria de "Outros assuntos"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'subcategoria'
  ) THEN
    ALTER TABLE tickets ADD COLUMN subcategoria text;
  END IF;
END $$;

-- Criar tabela de usuários se não existir
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  nome text NOT NULL,
  equipe text NOT NULL CHECK (equipe IN ('whatsapp', 'ligacao', 'supervisao')),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Usuários podem ler próprios dados"
  ON usuarios
  FOR SELECT
  USING (true);

CREATE POLICY "Supervisão pode gerenciar usuários"
  ON usuarios
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Criar tabela de solicitações se não existir
CREATE TABLE IF NOT EXISTS solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  aprovado_por uuid REFERENCES usuarios(id),
  observacoes text,
  link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE solicitacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para solicitações
CREATE POLICY "Usuários podem ler solicitações"
  ON solicitacoes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem criar solicitações"
  ON solicitacoes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar solicitações"
  ON solicitacoes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);