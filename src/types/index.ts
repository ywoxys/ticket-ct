export interface Atendente {
  id: string;
  nome: string;
  id_planilha?: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  usuario_id: string;
  matricula: string;
  nome: string;
  valor: number;
  qtd_mensalidades: number;
  telefone: string;
  categoria: 'Link' | 'Pix' | 'Outros assuntos';
  subcategoria?: 'endereco' | 'comprovantes';
  observacoes?: string;
  enviado: boolean;
  pago: boolean;
  data_envio?: string;
  data_pagamento?: string;
  created_at: string;
}

export interface TicketFormData {
  usuario_id: string;
  matricula: string;
  nome: string;
  valor: string;
  qtd_mensalidades: string;
  telefone: string;
  categoria: 'Link' | 'Pix' | 'Outros assuntos';
  subcategoria?: 'endereco' | 'comprovantes';
  observacoes?: string;
}

export interface Equipe {
  id: string;
  nome: 'whatsapp' | 'supervisao' | 'ligacao';
  senha: string;
  ativo: boolean;
  created_at: string;
}

export interface Solicitacao {
  id: string;
  ticket_id: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  aprovado_por_equipe?: string;
  observacoes?: string;
  link?: string;
  created_at: string;
  updated_at: string;
  ticket?: Ticket;
}

export interface ValorMensalidade {
  id: string;
  quantidade: number;
  valor: number;
  ativo: boolean;
  created_at: string;
}

export interface ConfiguracaoSupervisor {
  id: string;
  mes_referente: string;
  created_at: string;
  updated_at: string;
}

export interface DistribuicaoClientes {
  usuario_id: string;
  categoria: 'NR' | '1' | '2' | '3' | '4' | '5' | '6';
  aba_destino: string;
  quantidade: number;
}

export interface Cliente {
  id: string;
  matricula: string;
  nome: string;
  telefone: string;
  categoria: string;
  ativo: boolean;
  created_at: string;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  perfil: 'ligacao' | 'whatsapp' | 'supervisao';
  id_planilha?: string;
  foto_perfil?: string;
  modo_escuro: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ligacao {
  id: string;
  usuario_id: string;
  cliente_id?: string;
  matricula: string;
  nome: string;
  telefone: string;
  status: 'atendeu' | 'nao_atendeu';
  qtd_mensalidades?: number;
  valor?: number;
  forma_pagamento?: 'pix' | 'link' | 'unidade';
  retorno?: '1x' | '2x' | '3x' | '4+';
  data_retorno?: string;
  observacoes?: string;
  ticket_gerado: boolean;
  ticket_id?: string;
  created_at: string;
}

export interface Link {
  id: string;
  usuario_id: string;
  ticket_id: string;
  link: string;
  status: 'ativo' | 'usado' | 'expirado';
  created_at: string;
  usado_at?: string;
}

export interface Caixa {
  id: string;
  usuario_id: string;
  matricula: string;
  nome: string;
  valor: number;
  comprovante?: string;
  data_operacao: string;
  fechado: boolean;
  created_at: string;
}

export interface ClienteDistribuido {
  id: string;
  usuario_id?: string;
  matricula: string;
  nome: string;
  telefone: string;
  categoria: string;
  status: 'pendente' | 'atendido' | 'nao_atendido';
  data_distribuicao: string;
  data_atendimento?: string;
}

export interface Relatorio {
  id: string;
  usuario_id?: string;
  tipo: 'geral' | 'pessoal' | 'ligacao' | 'whatsapp';
  dados: any;
  periodo_inicio: string;
  periodo_fim: string;
  created_at: string;
}

export interface LigacaoFormData {
  matricula: string;
  nome: string;
  qtd_mensalidades: string;
  valor: string;
  telefone: string;
  forma_pagamento: 'pix' | 'link' | 'unidade';
  retorno: '1x' | '2x' | '3x' | '4+';
  data_retorno?: string;
  observacoes?: string;
}

export interface CaixaFormData {
  matricula: string;
  nome: string;
  valor: string;
  comprovante?: string;
}