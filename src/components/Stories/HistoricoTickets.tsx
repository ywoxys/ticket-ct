import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Phone, DollarSign, Hash, User, Search, Filter, CheckCircle, XCircle, Send, CreditCard, MessageSquare, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { getTickets, getUsuarios, updateTicket, getValoresMensalidades } from '../../lib/supabase.ts';
import type { Usuario, ValorMensalidade } from '../../types';

interface TicketWithUsuario {
  id: string;
  matricula: string;
  nome: string;
  valor: number;
  qtd_mensalidades: number;
  telefone: string;
  categoria: string;
  subcategoria?: string;
  observacoes?: string;
  enviado: boolean;
  pago: boolean;
  data_envio?: string;
  data_pagamento?: string;
  created_at: string;
  usuario: {
    nome: string;
  };
}

interface Filters {
  search: string;
  usuario: string;
  atendente: string;
  enviado: string;
  pago: string;
  dataInicio: string;
  dataFim: string;
}

export function HistoricoTickets() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tickets, setTickets] = useState<TicketWithUsuario[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketWithUsuario[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [valoresMensalidades, setValoresMensalidades] = useState<ValorMensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTicket, setEditingTicket] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [resending, setResending] = useState<{ [key: string]: boolean }>({});
  const [filters, setFilters] = useState<Filters>({
    search: '',
    usuario: '',
    atendente: '',
    enviado: '',
    pago: '',
    dataInicio: '',
    dataFim: '',
  });

  useEffect(() => {
    // Carregar usuário atual
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, filters]);

  const loadData = async () => {
    try {
      const [ticketsData, usuariosData, valoresData] = await Promise.all([
        getTickets(),
        getUsuarios(),
        getValoresMensalidades()
      ]);
      
      // Filtrar tickets baseado no perfil do usuário
      const userStr = localStorage.getItem('currentUser');
      const user = userStr ? JSON.parse(userStr) : null;
      
      let filteredTicketsData = ticketsData as TicketWithUsuario[];
      if (user && user.perfil !== 'supervisao') {
        filteredTicketsData = filteredTicketsData.filter(ticket => ticket.usuario_id === user.id);
      }
      
      setTickets(filteredTicketsData);
      setUsuarios(usuariosData);
      setValoresMensalidades(valoresData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar histórico de tickets');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.nome.toLowerCase().includes(searchLower) ||
        ticket.matricula.toLowerCase().includes(searchLower) ||
        ticket.id.toLowerCase().includes(searchLower)
      );
    }

    if (filters.atendente) {
      filtered = filtered.filter(ticket => ticket.usuario?.nome === filters.atendente);
    }

    if (filters.enviado !== '') {
      const isEnviado = filters.enviado === 'true';
      filtered = filtered.filter(ticket => ticket.enviado === isEnviado);
    }

    if (filters.pago !== '') {
      const isPago = filters.pago === 'true';
      filtered = filtered.filter(ticket => ticket.pago === isPago);
    }

    if (filters.dataInicio) {
      const dataInicio = new Date(filters.dataInicio);
      dataInicio.setHours(0, 0, 0, 0);
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate >= dataInicio;
      });
    }

    if (filters.dataFim) {
      const dataFim = new Date(filters.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate <= dataFim;
      });
    }

    setFilteredTickets(filtered);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      atendente: '',
      enviado: '',
      pago: '',
      dataInicio: '',
      dataFim: '',
    });
  };

  const handleEdit = (ticket: TicketWithUsuario) => {
    setEditingTicket(ticket.id);
    setEditData({
      nome: ticket.nome,
      matricula: ticket.matricula,
      telefone: ticket.telefone,
      valor: ticket.valor.toString(),
      qtd_mensalidades: ticket.qtd_mensalidades.toString(),
      observacoes: ticket.observacoes || '',
    });
  };

  const handleSave = async (ticketId: string) => {
    try {
      const updates = {
        nome: editData.nome,
        matricula: editData.matricula,
        telefone: editData.telefone,
        valor: parseFloat(editData.valor),
        qtd_mensalidades: parseInt(editData.qtd_mensalidades),
        observacoes: editData.observacoes,
      };

      await updateTicket(ticketId, updates);
      setTickets(prev => 
        prev.map(t => t.id === ticketId ? { ...t, ...updates } : t)
      );
      setEditingTicket(null);
      setEditData({});
    } catch (err) {
      console.error('Erro ao atualizar ticket:', err);
      setError('Erro ao atualizar ticket');
    }
  };

  const handleCancel = () => {
    setEditingTicket(null);
    setEditData({});
  };

  const handleResend = async (ticket: TicketWithUsuario) => {
    setResending(prev => ({ ...prev, [ticket.id]: true }));
    setError('');

    try {
      const usuario = usuarios.find(u => u.id === ticket.usuario?.id);
      const usuarioNome = usuario?.nome || '';

      let webhookUrl = `http://195.200.5.252:5678/webhook/trello-ctn?usuario=${encodeURIComponent(usuarioNome)}&matricula=${encodeURIComponent(ticket.matricula)}&nome=${encodeURIComponent(ticket.nome)}&valor=${ticket.valor}&qtd=${ticket.qtd_mensalidades}&telefone=${ticket.telefone}&categoria=${ticket.categoria}`;

      if (ticket.subcategoria) {
        webhookUrl += `&subcategoria=${ticket.subcategoria}`;
      }

      await fetch(webhookUrl, { method: 'GET', mode: 'no-cors' });
      await updateTicket(ticket.id, { enviado: true, data_envio: new Date().toISOString() });
      
      setTickets(prev => 
        prev.map(t => t.id === ticket.id ? { ...t, enviado: true, data_envio: new Date().toISOString() } : t)
      );
    } catch (err) {
      console.error('Erro ao reenviar ticket:', err);
      setError('Erro ao reenviar ticket');
    } finally {
      setResending(prev => ({ ...prev, [ticket.id]: false }));
    }
  };

  const getValorSugerido = (qtdMensalidades: number) => {
    const valorConfig = valoresMensalidades.find(v => v.quantidade === qtdMensalidades);
    return valorConfig ? valorConfig.valor : null;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
          <h2 className="text-2xl font-bold text-white">Histórico de Tickets</h2>
          <p className="text-purple-100 mt-1">Visualize e gerencie todos os tickets criados no sistema</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
              {error}
            </div>
          )}

          {/* Filtros */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filtros</span>
              </h3>
              <button
                onClick={clearFilters}
                className="text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors"
              >
                Limpar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nome, matrícula ou número do ticket"
                  />
                </div>
              </div>

              {/* Atendente - só mostra para supervisão */}
              {currentUser?.perfil === 'supervisao' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atendente
                  </label>
                  <select
                    value={filters.atendente}
                    onChange={(e) => handleFilterChange('atendente', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Todos</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.nome}>
                        {usuario.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Enviado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enviado
                </label>
                <select
                  value={filters.enviado}
                  onChange={(e) => handleFilterChange('enviado', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Todos</option>
                  <option value="true">Enviados</option>
                  <option value="false">Não Enviados</option>
                </select>
              </div>

              {/* Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pago
                </label>
                <select
                  value={filters.pago}
                  onChange={(e) => handleFilterChange('pago', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Todos</option>
                  <option value="true">Pagos</option>
                  <option value="false">Não Pagos</option>
                </select>
              </div>

              {/* Data Início */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Data Fim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Resumo dos filtros */}
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
              <span>Mostrando {filteredTickets.length} de {tickets.length} tickets</span>
              {(filters.search || filters.atendente || filters.enviado || filters.pago || filters.dataInicio || filters.dataFim) && (
                <span className="text-purple-600">• Filtros ativos</span>
              )}
            </div>
          </div>

          {/* Tickets */}
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {tickets.length === 0 ? 'Nenhum ticket encontrado' : 'Nenhum ticket corresponde aos filtros'}
              </p>
              <p className="text-gray-400 mt-1">
                {tickets.length === 0 ? 'Crie seu primeiro ticket na aba "Novo Ticket"' : 'Tente ajustar os filtros acima'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-6 transition-all duration-200 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          {ticket.categoria}
                          {ticket.subcategoria && (
                            <span className="ml-1 text-xs">
                              ({ticket.subcategoria === 'endereco' ? 'Endereço' : 'Comprovantes'})
                            </span>
                          )}
                        </span>
                        <span className="text-gray-500 text-sm">
                          #{ticket.id.slice(-8)}
                        </span>
                        {ticket.enviado && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Enviado
                          </span>
                        )}
                        {ticket.pago && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Pago
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(ticket.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Dados do ticket */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {/* Só mostra atendente para supervisão */}
                      {currentUser?.perfil === 'supervisao' && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <User className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">{ticket.usuario?.nome}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Hash className="w-4 h-4 text-indigo-500" />
                        <span>{ticket.matricula}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-700">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{ticket.nome}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-700">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span>R$ {ticket.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        {getValorSugerido(ticket.qtd_mensalidades) && 
                         getValorSugerido(ticket.qtd_mensalidades) !== ticket.valor && (
                          <span className="text-xs text-amber-600">
                            (Sugerido: R$ {getValorSugerido(ticket.qtd_mensalidades)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Phone className="w-4 h-4 text-orange-500" />
                        <span>{ticket.telefone}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-700">
                        <span className="text-sm">Parcelas: {ticket.qtd_mensalidades}x</span>
                      </div>
                    </div>

                    {/* Observações */}
                    {ticket.observacoes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Observações:</p>
                            <p className="text-sm text-blue-700">{ticket.observacoes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Datas de envio e pagamento */}
                    {(ticket.data_envio || ticket.data_pagamento) && (
                      <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                        {ticket.data_envio && (
                          <div className="flex items-center space-x-1">
                            <Send className="w-4 h-4 text-green-500" />
                            <span>Enviado: {new Date(ticket.data_envio).toLocaleString('pt-BR')}</span>
                          </div>
                        )}
                        {ticket.data_pagamento && (
                          <div className="flex items-center space-x-1">
                            <CreditCard className="w-4 h-4 text-blue-500" />
                            <span>Pago: {new Date(ticket.data_pagamento).toLocaleString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
