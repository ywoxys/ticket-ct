import React, { useState, useEffect } from 'react';
import { Phone, Users, TrendingUp, Calendar, BarChart3, PhoneCall, PhoneOff } from 'lucide-react';
import { getLigacoes, getTickets } from '../../lib/supabase.ts';

interface DashboardLigacaoProps {
  currentUser: any;
}

export function DashboardLigacao({ currentUser }: DashboardLigacaoProps) {
  const [stats, setStats] = useState({
    totalLigacoes: 0,
    ligacoesAtendidas: 0,
    ligacoesNaoAtendidas: 0,
    ticketsGerados: 0,
    ligacoesHoje: 0,
    taxaAtendimento: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [ligacoes, tickets] = await Promise.all([
        getLigacoes(currentUser.id),
        getTickets()
      ]);

      const hoje = new Date().toDateString();
      const ligacoesHoje = ligacoes.filter(l => 
        new Date(l.created_at).toDateString() === hoje
      ).length;

      const ligacoesAtendidas = ligacoes.filter(l => l.status === 'atendeu').length;
      const ligacoesNaoAtendidas = ligacoes.filter(l => l.status === 'nao_atendeu').length;
      const ticketsGerados = tickets.filter(t => t.usuario_id === currentUser.id).length;
      const taxaAtendimento = ligacoes.length > 0 ? (ligacoesAtendidas / ligacoes.length) * 100 : 0;

      setStats({
        totalLigacoes: ligacoes.length,
        ligacoesAtendidas,
        ligacoesNaoAtendidas,
        ticketsGerados,
        ligacoesHoje,
        taxaAtendimento
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Ligações</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLigacoes}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ligações Atendidas</p>
              <p className="text-3xl font-bold text-green-600">{stats.ligacoesAtendidas}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <PhoneCall className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Não Atendidas</p>
              <p className="text-3xl font-bold text-red-600">{stats.ligacoesNaoAtendidas}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <PhoneOff className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tickets Gerados</p>
              <p className="text-3xl font-bold text-purple-600">{stats.ticketsGerados}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ligações Hoje</p>
              <p className="text-3xl font-bold text-orange-600">{stats.ligacoesHoje}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Atendimento</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.taxaAtendimento.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Relatório de Performance */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Relatório de Ligações</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Performance Geral</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de Ligações</span>
                <span className="font-semibold">{stats.totalLigacoes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taxa de Sucesso</span>
                <span className="font-semibold text-green-600">{stats.taxaAtendimento.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conversão em Tickets</span>
                <span className="font-semibold text-purple-600">
                  {stats.totalLigacoes > 0 ? ((stats.ticketsGerados / stats.totalLigacoes) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Atividade Hoje</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ligações Realizadas</span>
                <span className="font-semibold">{stats.ligacoesHoje}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Meta Diária</span>
                <span className="font-semibold text-blue-600">50</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Progresso</span>
                <span className="font-semibold text-orange-600">
                  {((stats.ligacoesHoje / 50) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso da Meta Diária</span>
            <span className="text-sm text-gray-600">{stats.ligacoesHoje}/50</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((stats.ligacoesHoje / 50) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}