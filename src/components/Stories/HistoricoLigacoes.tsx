import React, { useState, useEffect } from 'react';
import { Phone, Calendar, User, Hash, DollarSign, Search, Filter, PhoneCall, PhoneOff } from 'lucide-react';
import { getLigacoes } from '../../lib/supabase.ts';
import type { Ligacao } from '../../types';

interface HistoricoLigacoesProps {
  currentUser: any;
}

interface Filters {
  search: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  retorno: string;
}

export function HistoricoLigacoes({ currentUser }: HistoricoLigacoesProps) {
  const [ligacoes, setLigacoes] = useState<any[]>([]);
  const [filteredLigacoes, setFilteredLigacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    dataInicio: '',
    dataFim: '',
    retorno: '',
  });

  useEffect(() => {
    loadLigacoes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [ligacoes, filters]);

  const loadLigacoes = async () => {
    try {
      const data = await getLigacoes(currentUser.perfil === 'supervisao' ? undefined : currentUser.id);
      setLigacoes(data);
    } catch (err) {
      console.error('Erro ao carregar ligações:', err);
      setError('Erro ao carregar histórico de ligações');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...ligacoes];

    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(ligacao => 
        ligacao.nome.toLowerCase().includes(searchLower) ||
        ligacao.matricula.toLowerCase().includes(searchLower) ||
        ligacao.telefone.includes(filters.search)
      );
    }

    // Filtro por status
    if (filters.status) {
      filtered = filtered.filter(ligacao => ligacao.status === filters.status);
    }

    // Filtro por retorno
    if (filters.retorno) {
      filtered = filtered.filter(ligacao => ligacao.retorno === filters.retorno);
    }

    // Filtro por data de início
    if (filters.dataInicio) {
      const dataInicio = new Date(filters.dataInicio);
      dataInicio.setHours(0, 0, 0, 0);
      filtered = filtered.filter(ligacao => {
        const ligacaoDate = new Date(ligacao.created_at);
        return ligacaoDate >= dataInicio;
      });
    }

    // Filtro por data de fim
    if (filters.dataFim) {
      const dataFim = new Date(filters.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      filtered = filtered.filter(ligacao => {
        const ligacaoDate = new Date(ligacao.created_at);
        return ligacaoDate <= dataFim;
      });
    }

    setFilteredLigacoes(filtered);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dataInicio: '',
      dataFim: '',
      retorno: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'atendeu': return 'bg-green-100 text-green-800';
      case 'nao_atendeu': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'atendeu': return <PhoneCall className="w-4 h-4" />;
      case 'nao_atendeu': return <PhoneOff className="w-4 h-4" />;
      default: return <Phone className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h2 className="text-2xl font-bold text-white">Histórico de Ligações</h2>
          <p className="text-blue-100 mt-1">Visualize e gerencie todas as ligações realizadas</p>
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
                className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
              >
                Limpar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Busca */}
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nome, matrícula ou telefone"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Todos</option>
                  <option value="atendeu">Atendeu</option>
                  <option value="nao_atendeu">Não Atendeu</option>
                </select>
              </div>

              {/* Retorno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retorno
                </label>
                <select
                  value={filters.retorno}
                  onChange={(e) => handleFilterChange('retorno', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Todos</option>
                  <option value="1x">1x</option>
                  <option value="2x">2x</option>
                  <option value="3x">3x</option>
                  <option value="4+">4+</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Resumo dos filtros */}
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
              <span>Mostrando {filteredLigacoes.length} de {ligacoes.length} ligações</span>
              {(filters.search || filters.status || filters.retorno || filters.dataInicio || filters.dataFim) && (
                <span className="text-blue-600">• Filtros ativos</span>
              )}
            </div>
          </div>

          {filteredLigacoes.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {ligacoes.length === 0 ? 'Nenhuma ligação encontrada' : 'Nenhuma ligação corresponde aos filtros'}
              </p>
              <p className="text-gray-400 mt-1">
                {ligacoes.length === 0 ? 'Ligações aparecerão aqui após serem realizadas' : 'Tente ajustar os filtros acima'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {filteredLigacoes.map((ligacao) => (
                  <div
                    key={ligacao.id}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-6 transition-all duration-200 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(ligacao.status)}`}>
                          {getStatusIcon(ligacao.status)}
                          <span>{ligacao.status === 'atendeu' ? 'Atendeu' : 'Não Atendeu'}</span>
                        </span>
                        {ligacao.retorno && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Retorno: {ligacao.retorno}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(ligacao.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {currentUser.perfil === 'supervisao' && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <User className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">{ligacao.usuario?.nome}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Hash className="w-4 h-4 text-indigo-500" />
                        <span>{ligacao.matricula}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-700">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{ligacao.nome}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Phone className="w-4 h-4 text-orange-500" />
                        <span>{ligacao.telefone}</span>
                      </div>
                      
                      {ligacao.valor && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span>R$ {ligacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      
                      {ligacao.qtd_mensalidades && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>{ligacao.qtd_mensalidades}x</span>
                        </div>
                      )}

                      {ligacao.forma_pagamento && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">
                            {ligacao.forma_pagamento.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {ligacao.data_retorno && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <span>Retorno: {new Date(ligacao.data_retorno).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>

                    {/* Observações */}
                    {ligacao.observacoes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start space-x-2">
                          <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Observações:</p>
                            <p className="text-sm text-blue-700">{ligacao.observacoes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status do ticket */}
                    {ligacao.ticket_gerado && (
                      <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>Ticket Gerado</span>
                        </div>
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