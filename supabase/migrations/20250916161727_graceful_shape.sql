/*
  # Sistema Completo de Tickets - Novas Funcionalidades

  1. Novas Tabelas
    - `usuarios` - Sistema de usuários com email/senha
    - `ligacoes` - Histórico de ligações
    - `links` - Histórico de links
    - `caixa` - Sistema de caixa por usuário
    - `clientes_distribuidos` - Clientes distribuídos para ligação
    - `relatorios` - Relatórios do sistema

  2. Modificações
    - Adicionar campos necessários nas tabelas existentes
    - Criar índices para performance
    - Configurar RLS apropriado

  3. Segurança
    - RLS em todas as tabelas
    - Políticas baseadas em perfil de usuário
*/

-- Criar tabela de usuários com sistema de autenticação
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  senha text NOT NULL,
  nome text NOT NULL,
  perfil text NOT NULL CHECK (perfil IN ('ligacao', 'whatsapp', 'supervisao')),
  id_planilha text,
  foto_perfil text,
  modo_escuro boolean DEFAULT false,
  ativo boolean DEFAULT true,
  codigo_reset text,
  codigo_reset_expira timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Criar tabela de ligações
CREATE TABLE IF NOT EXISTS ligacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES clientes_distribuidos(id),
  matricula text NOT NULL,
  nome text NOT NULL,
  telefone text NOT NULL,
  status text NOT NULL CHECK (status IN ('atendeu', 'nao_atendeu')),
  qtd_mensalidades integer,
  valor numeric,
  forma_pagamento text CHECK (forma_pagamento IN ('pix', 'link', 'unidade')),
  retorno text CHECK (retorno IN ('1x', '2x', '3x', '4+')),
  data_retorno date,
  observacoes text,
  ticket_gerado boolean DEFAULT false,
  ticket_id uuid REFERENCES tickets(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ligacoes ENABLE ROW LEVEL SECURITY;

-- Criar tabela de links
CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  link text NOT NULL,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'usado', 'expirado')),
  created_at timestamptz DEFAULT now(),
  usado_at timestamptz
);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Criar tabela de caixa
CREATE TABLE IF NOT EXISTS caixa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  matricula text NOT NULL,
  nome text NOT NULL,
  valor numeric NOT NULL,
  comprovante text,
  data_operacao date DEFAULT CURRENT_DATE,
  fechado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE caixa ENABLE ROW LEVEL SECURITY;

-- Criar tabela de clientes distribuídos
CREATE TABLE IF NOT EXISTS clientes_distribuidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id),
  matricula text NOT NULL,
  nome text NOT NULL,
  telefone text NOT NULL,
  categoria text NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendido', 'nao_atendido')),
  data_distribuicao timestamptz DEFAULT now(),
  data_atendimento timestamptz
);

ALTER TABLE clientes_distribuidos ENABLE ROW LEVEL SECURITY;

-- Criar tabela de relatórios
CREATE TABLE IF NOT EXISTS relatorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id),
  tipo text NOT NULL CHECK (tipo IN ('geral', 'pessoal', 'ligacao', 'whatsapp')),
  dados jsonb NOT NULL,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;

-- Adicionar campos faltantes na tabela tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE tickets ADD COLUMN usuario_id uuid REFERENCES usuarios(id);
  END IF;
END $$;

-- Inserir usuários padrão
INSERT INTO usuarios (email, senha, nome, perfil) VALUES 
  ('admin@sistema.com', '$2b$10$example_hash', 'Administrador', 'supervisao'),
  ('whatsapp@sistema.com', '$2b$10$example_hash', 'WhatsApp', 'whatsapp'),
  ('ligacao@sistema.com', '$2b$10$example_hash', 'Ligação', 'ligacao')
ON CONFLICT (email) DO NOTHING;

-- Políticas RLS para usuários
CREATE POLICY "Usuários podem ver próprios dados"
  ON usuarios FOR SELECT
  USING (auth.uid()::text = id::text OR perfil = 'supervisao');

CREATE POLICY "Usuários podem atualizar próprios dados"
  ON usuarios FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Supervisão pode gerenciar usuários"
  ON usuarios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id::text = auth.uid()::text AND perfil = 'supervisao'
    )
  );

-- Políticas RLS para ligações
CREATE POLICY "Usuários podem ver próprias ligações"
  ON ligacoes FOR SELECT
  USING (
    usuario_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id::text = auth.uid()::text AND perfil = 'supervisao'
    )
  );

CREATE POLICY "Usuários podem criar ligações"
  ON ligacoes FOR INSERT
  WITH CHECK (usuario_id::text = auth.uid()::text);

CREATE POLICY "Usuários podem atualizar próprias ligações"
  ON ligacoes FOR UPDATE
  USING (usuario_id::text = auth.uid()::text);

-- Políticas RLS para links
CREATE POLICY "WhatsApp e supervisão podem ver links"
  ON links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id::text = auth.uid()::text AND perfil IN ('whatsapp', 'supervisao')
    )
  );

CREATE POLICY "WhatsApp pode gerenciar links"
  ON links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id::text = auth.uid()::text AND perfil IN ('whatsapp', 'supervisao')
    )
  );

-- Políticas RLS para caixa
CREATE POLICY "Usuários podem ver próprio caixa"
  ON caixa FOR SELECT
  USING (
    usuario_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id::text = auth.uid()::text AND perfil = 'supervisao'
    )
  );

CREATE POLICY "Usuários podem gerenciar próprio caixa"
  ON caixa FOR ALL
  USING (usuario_id::text = auth.uid()::text);

-- Políticas RLS para clientes distribuídos
CREATE POLICY "Ligação pode ver clientes distribuídos"
  ON clientes_distribuidos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id::text = auth.uid()::text AND perfil IN ('ligacao', 'supervisao')
    )
  );

CREATE POLICY "Ligação pode atualizar clientes"
  ON clientes_distribuidos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id::text = auth.uid()::text AND perfil IN ('ligacao', 'supervisao')
    )
  );

-- Políticas RLS para relatórios
CREATE POLICY "Usuários podem ver próprios relatórios"
  ON relatorios FOR SELECT
  USING (
    usuario_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id::text = auth.uid()::text AND perfil = 'supervisao'
    )
  );

CREATE POLICY "Usuários podem criar relatórios"
  ON relatorios FOR INSERT
  WITH CHECK (usuario_id::text = auth.uid()::text);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX IF NOT EXISTS idx_ligacoes_usuario_id ON ligacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ligacoes_status ON ligacoes(status);
CREATE INDEX IF NOT EXISTS idx_ligacoes_created_at ON ligacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_usuario_id ON links(usuario_id);
CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);
CREATE INDEX IF NOT EXISTS idx_caixa_usuario_id ON caixa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_caixa_data_operacao ON caixa(data_operacao);
CREATE INDEX IF NOT EXISTS idx_clientes_distribuidos_usuario_id ON clientes_distribuidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_clientes_distribuidos_status ON clientes_distribuidos(status);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();