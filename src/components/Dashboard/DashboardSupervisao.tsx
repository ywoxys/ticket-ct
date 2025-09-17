import React, { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Calendar, Filter, Eye, MessageSquare, Phone, DollarSign } from 'lucide-react';
import { getLigacoes, getLinks, getCaixa, getTickets, getUsuarios } from '../../lib/supabase.ts';

interface DashboardSupervisaoProps {
  currentUser: any;
}

export function DashboardSupervisao({ currentUser }: DashboardSupervisaoProps) {
  const [selectedTeam, setSelectedTeam] = useState<'geral' | 'ligacao' | 'whatsapp'>('geral');
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalTickets: 0,
    totalLigacoes: 0,
    totalLinks: 0,
    totalCaixa: 0,
    ticketsHoje: 0,
    ligacoesHoje: 0,
    caixaHoje: 0
  });
  const [teamStats, setTeamStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      const [usuarios, tickets, ligacoes, links, caixaItems] = await Promise.all([
        getUsuarios(),
        getTickets(),
        getLigacoes(),
        getLinks(),
        getCaixa(currentUser.id) // Para supervisão, pode ver todos
      ]);

      // Estatísticas gerais
      const ticketsHoje = tickets.filter(t => 
        new Date(t.created_at).toDateString() === new Date().toDateString()
      ).length;

      const ligacoesHoje = ligacoes.filter(l => 
        new Date(l.created_at).toDateString() === new Date().toDateString()
      ).length;

      const caixaHoje = caixaItems.filter(item => 
        item.data_operacao === hoje
      );
      const totalCaixaHoje = caixaHoje.reduce((sum, item) => sum + item.valor, 0);
      const totalCaixaGeral = caixaItems.reduce((sum, item) => sum + item.valor, 0);

      setStats({
        totalUsuarios: usuarios.length,
        totalTickets: tickets.length,
        totalLigacoes: ligacoes.length,
        totalLinks: links.length,
        totalCaixa: totalCaixaGeral,
        ticketsHoje,
        ligacoesHoje,
        caixaHoje: totalCaixaHoje
      });

      // Estatísticas por equipe
      const usuariosLigacao = usuarios.filter(u => u.perfil === 'ligacao');
      const usuariosWhatsapp = usuarios.filter(u => u.perfil === 'whatsapp');

      const ligacoesPorUsuario = usuariosLigacao.map(user => ({
        nome: user.nome,
        total: ligacoes.filter(l => l.usuario_id === user.id).length,
        atendidas: ligacoes.filter(l => l.usuario_id === user.id && l.status === 'atendeu').length
      }));

      const linksPorUsuario = usuariosWhatsapp.map(user => ({
        nome: user.nome,
        total: links.filter(l => l.usuario_id === user.id).length,
        usados: links.filter(l => l.usuario_id === user.id && l.status === 'usado').length
      }));

      setTeamStats({
        ligacao: ligacoesPorUsuario,
        whatsapp: linksPorUsuario
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderGeralStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Usuários</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsuarios}</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Tickets</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalTickets}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Ligações</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalLigacoes}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Phone className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Caixa</p>
            <p className="text-2xl font-bold text-emerald-600">
              R$ {stats.totalCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderLigacaoStats = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ligações Hoje</p>
              <p className="text-3xl font-bold text-blue-600">{stats.ligacoesHoje}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ligações</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalLigacoes}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equipe Ligação</p>
              <p className="text-3xl font-bold text-purple-600">{teamStats.ligacao?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance por usuário */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance da Equipe de Ligação</h3>
        <div className="space-y-3">
          {teamStats.ligacao?.map((user: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{user.nome.charAt(0)}</span>
                </div>
                <span className="font-medium text-gray-900">{user.nome}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">Total: <strong>{user.total}</strong></span>
                <span className="text-green-600">Atendidas: <strong>{user.atendidas}</strong></span>
                <span className="text-blue-600">
                  Taxa: <strong>{user.total > 0 ? ((user.atendidas / user.total) * 100).toFixed(1) : 0}%</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWhatsappStats = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Caixa Hoje</p>
              <p className="text-2xl font-bold text-emerald-600">
                R$ {stats.caixaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Links</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalLinks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equipe WhatsApp</p>
              <p className="text-3xl font-bold text-green-600">{teamStats.whatsapp?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance por usuário */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance da Equipe WhatsApp</h3>
        <div className="space-y-3">
          {teamStats.whatsapp?.map((user: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">{user.nome.charAt(0)}</span>
                </div>
                <span className="font-medium text-gray-900">{user.nome}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">Total: <strong>{user.total}</strong></span>
                <span className="text-blue-600">Usados: <strong>{user.usados}</strong></span>
                <span className="text-green-600">
                  Taxa: <strong>{user.total > 0 ? ((user.usados / user.total) * 100).toFixed(1) : 0}%</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Equipe */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Relatórios por Equipe</span>
          </h3>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedTeam('geral')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedTeam === 'geral'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Relatório Geral
          </button>
          
          <button
            onClick={() => setSelectedTeam('ligacao')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedTeam === 'ligacao'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Equipe Ligação
          </button>
          
          <button
            onClick={() => setSelectedTeam('whatsapp')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedTeam === 'whatsapp'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Equipe WhatsApp
          </button>
        </div>
      </div>

      {/* Conteúdo baseado na seleção */}
      {selectedTeam === 'geral' && (
        <div className="space-y-6">
          {renderGeralStats()}
          
          {/* Resumo do Dia */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Resumo do Dia</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">{stats.ticketsHoje}</div>
                <p className="text-sm text-gray-600">Tickets Criados Hoje</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">{stats.ligacoesHoje}</div>
                <p className="text-sm text-gray-600">Ligações Realizadas Hoje</p>
              </div>
              
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600 mb-2">
                  R$ {stats.caixaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-gray-600">Caixa Hoje</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTeam === 'ligacao' && renderLigacaoStats()}
      {selectedTeam === 'whatsapp' && renderWhatsappStats()}
    </div>
  );
}