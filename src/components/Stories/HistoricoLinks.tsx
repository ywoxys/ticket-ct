import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Calendar, User, Hash, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getLinks } from '../../lib/supabase.ts';
import type { Link } from '../../types';

interface HistoricoLinksProps {
    currentUser: any;
}

interface Filters {
    search: string;
    status: string;
    dataInicio: string;
    dataFim: string;
}

export function HistoricoLinks({ currentUser }: HistoricoLinksProps) {
    const [links, setLinks] = useState<Link[]>([]);
    const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<Filters>({
        search: '',
        status: '',
        dataInicio: '',
        dataFim: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [links, filters]);

    const loadData = async () => {
        try {
            const linksData = await getLinks();
            setLinks(linksData);
        } catch (err) {
            console.error('Erro ao carregar links:', err);
            setError('Erro ao carregar histórico de links');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...links];

        // Busca (nome ou ID do link)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(link =>
                link.nome.toLowerCase().includes(searchLower) ||
                link.id.toLowerCase().includes(searchLower)
            );
        }

        // Filtro de status
        if (filters.status) {
            filtered = filtered.filter(link => link.status === filters.status);
        }

        // Filtro de data início
        if (filters.dataInicio) {
            const dataInicio = new Date(filters.dataInicio);
            dataInicio.setHours(0, 0, 0, 0);
            filtered = filtered.filter(link => {
                const linkDate = new Date(link.created_at);
                return linkDate >= dataInicio;
            });
        }

        // Filtro de data fim
        if (filters.dataFim) {
            const dataFim = new Date(filters.dataFim);
            dataFim.setHours(23, 59, 59, 999);
            filtered = filtered.filter(link => {
                const linkDate = new Date(link.created_at);
                return linkDate <= dataFim;
            });
        }

        setFilteredLinks(filtered);
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
        });
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
                    <h2 className="text-2xl font-bold text-white">Histórico de Links</h2>
                    <p className="text-purple-100 mt-1">Visualize e gerencie todos os links criados no sistema</p>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Nome ou número do link"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                                >
                                    <option value="">Todos</option>
                                    <option value="ativo">Ativos</option>
                                    <option value="inativo">Inativos</option>
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

                        {/* Resumo */}
                        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                            <span>Mostrando {filteredLinks.length} de {links.length} links</span>
                            {(filters.search || filters.status || filters.dataInicio || filters.dataFim) && (
                                <span className="text-purple-600">• Filtros ativos</span>
                            )}
                        </div>
                    </div>

                    {/* Lista */}
                    {filteredLinks.length === 0 ? (
                        <div className="text-center py-12">
                            <LinkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">
                                {links.length === 0 ? 'Nenhum link encontrado' : 'Nenhum link corresponde aos filtros'}
                            </p>
                            <p className="text-gray-400 mt-1">
                                {links.length === 0 ? 'Crie seu primeiro link na aba "Novo Link"' : 'Tente ajustar os filtros acima'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredLinks.map((link) => (
                                <div
                                    key={link.id}
                                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-6 transition-all duration-200 border border-gray-200"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-2">
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {link.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                                            <span className="text-gray-500 text-sm">#{link.id.slice(-8)}</span>
                                        </div>

                                        <div className="flex items-center space-x-2 text-gray-500 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(link.created_at).toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-2 text-gray-700">
                                            <User className="w-4 h-4 text-purple-500" />
                                            <span className="font-medium">{link.nome}</span>
                                        </div>

                                        <div className="flex items-center space-x-2 text-gray-700">
                                            <Hash className="w-4 h-4 text-indigo-500" />
                                            <span>{link.url}</span>
                                        </div>

                                        <div className="flex items-center space-x-2 text-gray-700">
                                            {link.status === 'ativo' ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            <span>{link.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
                                        </div>
                                    </div>

                                    {link.expires_at && (
                                        <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <span>Expira em {new Date(link.expires_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
