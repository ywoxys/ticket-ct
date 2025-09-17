import React, { useState, useEffect } from 'react';
import { MessageSquare, Link as LinkIcon, DollarSign, TrendingUp, Calendar, CheckCircle, Wallet } from 'lucide-react';
import { getLinks, getCaixa } from '../../lib/supabase.ts';

interface DashboardWhatsappProps {
  currentUser: any;
}

export function DashboardWhatsapp({ currentUser }: DashboardWhatsappProps) {
  const [stats, setStats] = useState({
    totalLinks: 0,
    linksAtivos: 0,
    linksUsados: 0,
    linksExpirados: 0,
    totalCaixa: 0,
    caixaHoje: 0,
    itensHoje: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      const [links, caixaItems] = await Promise.all([
        getLinks(currentUser.id),
        getCaixa(currentUser.id)
      ]);

      const caixaHoje = caixaItems.filter(item => 
        item.data_operacao === hoje
      );

      const totalCaixaHoje = caixaHoje.reduce((sum, item) => sum + item.valor, 0);
      const totalCaixaGeral = caixaItems.reduce((sum, item) => sum + item.valor, 0);

      setStats({
        totalLinks: links.length,
        linksAtivos: links.filter(l => l.status === 'ativo').length,
        linksUsados: links.filter(l => l.status === 'usado').length,
        linksExpirados: links.filter(l => l.status === 'expirado').length,
        totalCaixa: totalCaixaGeral,
        caixaHoje: totalCaixaHoje,
        itensHoje: caixaHoje.length
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Links</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLinks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Links Ativos</p>
              <p className="text-3xl font-bold text-green-600">{stats.linksAtivos}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Links Usados</p>
              <p className="text-3xl font-bold text-blue-600">{stats.linksUsados}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

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
      </div>

      {/* Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relatório de Links */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <LinkIcon className="w-5 h-5" />
            <span>Relatório de Links</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Links Ativos</span>
              </div>
              <span className="font-semibold text-green-600">{stats.linksAtivos}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Links Usados</span>
              </div>
              <span className="font-semibold text-blue-600">{stats.linksUsados}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Links Expirados</span>
              </div>
              <span className="font-semibold text-red-600">{stats.linksExpirados}</span>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Taxa de Conversão</span>
                <span className="font-semibold text-purple-600">
                  {stats.totalLinks > 0 ? ((stats.linksUsados / stats.totalLinks) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Relatório de Caixa */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Relatório de Caixa</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Caixa Hoje</span>
              </div>
              <span className="font-semibold text-emerald-600">
                R$ {stats.caixaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Total Geral</span>
              </div>
              <span className="font-semibold text-blue-600">
                R$ {stats.totalCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Itens Hoje</span>
              </div>
              <span className="font-semibold text-orange-600">{stats.itensHoje}</span>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Ticket Médio Hoje</span>
                <span className="font-semibold text-purple-600">
                  R$ {stats.itensHoje > 0 ? (stats.caixaHoje / stats.itensHoje).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Performance */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Performance WhatsApp</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.totalLinks > 0 ? ((stats.linksUsados / stats.totalLinks) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-sm text-gray-600">Taxa de Conversão de Links</p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              R$ {stats.itensHoje > 0 ? (stats.caixaHoje / stats.itensHoje).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <p className="text-sm text-gray-600">Ticket Médio</p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.itensHoje}
            </div>
            <p className="text-sm text-gray-600">Transações Hoje</p>
          </div>
        </div>
      </div>
    </div>
  );
}