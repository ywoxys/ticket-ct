import { createClient } from '@supabase/supabase-js';
import type { 
  Solicitacao, 
  Equipe, 
  Usuario, 
  Ligacao, 
  Link, 
  Caixa, 
  ClienteDistribuido,
  Relatorio,
  LigacaoFormData,
  CaixaFormData
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funções para usuários
export const signInWithEmail = async (email: string, senha: string) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('ativo', true)
    .single();
  
  if (error || !data) {
    throw new Error('Email ou senha incorretos');
  }
  
  // Verificação simples de senha (em produção, use bcrypt)
  if (data.senha !== senha) {
    throw new Error('Email ou senha incorretos');
  }
  
  return data;
};

export const getUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('ativo', true)
    .order('nome');
  
  if (error) throw error;
  return data;
};

export const createUsuario = async (usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('usuarios')
    .insert([usuario])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUsuario = async (id: string, updates: Partial<Usuario>) => {
  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const requestPasswordReset = async (email: string) => {
  const codigo = Math.random().toString(36).substring(2, 15);
  const expira = new Date();
  expira.setHours(expira.getHours() + 1); // Expira em 1 hora
  
  const { data, error } = await supabase
    .from('usuarios')
    .update({
      codigo_reset: codigo,
      codigo_reset_expira: expira.toISOString()
    })
    .eq('email', email)
    .select()
    .single();
  
  if (error) throw error;

  // Enviar código por webhook
  const webhookUrl = `http://195.200.5.252:5678/webhook-test/reset-password?codigo=${codigo}&email=${email}`;
    await fetch(webhookUrl, { method: 'GET', mode: 'no-cors' });
  await fetch(webhookUrl, {
    method: 'GET',
    mode: 'no-cors',
  });
  
  return data;
};

// Funções para ligações
export const getLigacoes = async (usuarioId?: string) => {
  let query = supabase
    .from('ligacoes')
    .select(`
      *,
      usuario:usuarios(nome),
      cliente:clientes_distribuidos(*)
    `)
    .order('created_at', { ascending: false });
  
  if (usuarioId) {
    query = query.eq('usuario_id', usuarioId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createLigacao = async (ligacao: Omit<Ligacao, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('ligacoes')
    .insert([ligacao])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateLigacao = async (id: string, updates: Partial<Ligacao>) => {
  const { data, error } = await supabase
    .from('ligacoes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Funções para links
export const getLinks = async (usuarioId?: string) => {
  let query = supabase
    .from('links')
    .select(`
      *,
      usuario:usuarios(nome),
      ticket:tickets(*)
    `)
    .order('created_at', { ascending: false });
  
  if (usuarioId) {
    query = query.eq('usuario_id', usuarioId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createLink = async (link: Omit<Link, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('links')
    .insert([link])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateLink = async (id: string, updates: Partial<Link>) => {
  const { data, error } = await supabase
    .from('links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Funções para caixa
export const getCaixa = async (usuarioId: string, dataOperacao?: string) => {
  let query = supabase
    .from('caixa')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false });
  
  if (dataOperacao) {
    query = query.eq('data_operacao', dataOperacao);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createCaixa = async (caixa: Omit<Caixa, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('caixa')
    .insert([caixa])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const fecharCaixa = async (usuarioId: string, dataOperacao: string) => {
  const { data, error } = await supabase
    .from('caixa')
    .update({ fechado: true })
    .eq('usuario_id', usuarioId)
    .eq('data_operacao', dataOperacao)
    .select();
  
  if (error) throw error;
  return data;
};

// Funções para clientes distribuídos
export const getClientesDistribuidos = async (usuarioId?: string) => {
  let query = supabase
    .from('clientes_distribuidos')
    .select('*')
    .order('data_distribuicao', { ascending: false });
  
  if (usuarioId) {
    query = query.eq('usuario_id', usuarioId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateClienteDistribuido = async (id: string, updates: Partial<ClienteDistribuido>) => {
  const { data, error } = await supabase
    .from('clientes_distribuidos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const limparClientesPendentes = async () => {
  const { data, error } = await supabase
    .from('clientes_distribuidos')
    .delete()
    .eq('status', 'pendente');
  
  if (error) throw error;
  return data;
};

// Funções para buscar cliente por matrícula
export const buscarClientePorMatricula = async (matricula: string) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('matricula, nome, telefone')
    .eq('matricula', matricula)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Funções para tickets
export const createTicket = async (ticket: Omit<Ticket, 'id' | 'created_at' | 'enviado' | 'pago' | 'data_envio' | 'data_pagamento'>) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert([ticket])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getTickets = async () => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      usuarios (
        nome
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Funções de autenticação
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Funções para equipes
export const getEquipes = async () => {
  const { data, error } = await supabase
    .from('equipes')
    .select('*')
    .eq('ativo', true)
    .order('nome');
  
  if (error) throw error;
  return data;
};

export const updateEquipeSenha = async (id: string, novaSenha: string) => {
  const { data, error } = await supabase
    .from('equipes')
    .update({ senha: novaSenha })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Funções para solicitações
export const createSolicitacao = async (ticketId: string) => {
  const { data, error } = await supabase
    .from('solicitacoes')
    .insert([{ ticket_id: ticketId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getSolicitacoes = async () => {
  const { data, error } = await supabase
    .from('solicitacoes')
    .select(`
      *,
      ticket:tickets(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const updateSolicitacao = async (
  id: string, 
  status: 'aprovado' | 'rejeitado', 
  equipe: string,
  observacoes?: string,
  link?: string
) => {
  const { data, error } = await supabase
    .from('solicitacoes')
    .update({
      status,
      aprovado_por_equipe: equipe,
      observacoes,
      ...(link && { link }),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Funções para valores de mensalidades
export const getValoresMensalidades = async () => {
  const { data, error } = await supabase
    .from('valores_mensalidades')
    .select('*')
    .eq('ativo', true)
    .order('quantidade');
  
  if (error) throw error;
  return data;
};

export const updateValorMensalidade = async (id: string, valor: number) => {
  const { data, error } = await supabase
    .from('valores_mensalidades')
    .update({ valor })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const createValorMensalidade = async (quantidade: number, valor: number) => {
  const { data, error } = await supabase
    .from('valores_mensalidades')
    .insert([{ quantidade, valor }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Função para atualizar ticket
export const updateTicket = async (id: string, updates: Partial<Ticket>) => {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Funções para clientes
export const getClientes = async () => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('ativo', true)
    .order('nome');
  
  if (error) throw error;
  return data;
};

export const distribuirClientes = async (usuarioId: string, categoria: string, quantidade: number) => {
  // Buscar clientes disponíveis da categoria
  const { data: clientes, error: clientesError } = await supabase
    .from('clientes')
    .select('*')
    .eq('categoria', categoria)
    .eq('ativo', true)
    .limit(quantidade);
  
  if (clientesError) throw clientesError;
  
  if (clientes.length === 0) {
    throw new Error('Nenhum cliente disponível para distribuição');
  }
  
  // Criar registros na tabela clientes_distribuidos
  const clientesParaDistribuir = clientes.map(cliente => ({
    usuario_id: usuarioId,
    matricula: cliente.matricula,
    nome: cliente.nome,
    telefone: cliente.telefone,
    categoria: cliente.categoria,
    status: 'pendente'
  }));
  
  const { data, error } = await supabase
    .from('clientes_distribuidos')
    .insert(clientesParaDistribuir)
    .select();
  
  if (error) throw error;
  return data;
};

// Funções para configurações do supervisor
export const getConfiguracoesSupervisor = async () => {
  const { data, error } = await supabase
    .from('configuracoes_supervisor')
    .select('*')
    .single();
  
  if (error) throw error;
  return data;
};

export const updateConfiguracoesSupervisor = async (mesReferente: string) => {
  const { data, error } = await supabase
    .from('configuracoes_supervisor')
    .update({ mes_referente: mesReferente })
    .eq('id', (await getConfiguracoesSupervisor()).id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};