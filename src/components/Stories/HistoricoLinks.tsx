import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Calendar, User, Hash, Search, Filter, CheckCircle, XCircle, Clock, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { getLinks, updateLink, deleteLink } from '../../lib/supabase.ts';
import type { Link } from '../../types';

interface HistoricoLinksProps {
    currentUser: any;
}

interface Filters {
    search: string;
    status: string;
    dataInicio: string;
    dataFim: string;
    dataVencimento: string;
}

export function HistoricoLinks({ currentUser }: HistoricoLinksProps) {
    const [links, setLinks] = useState<Link[]>([]);
    const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingLink, setEditingLink] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>({});
    const [deleting, setDeleting] = useState<{ [key: string]: boolean }>({});
    const [resending, setResending] = useState<{ [key: string]: boolean }>({});
    const [filters, setFilters] = useState<Filters>({
        search: '',
        status: '',
        dataInicio: '',
        dataFim: '',
        dataVencimento: '',
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

        // Filtro de data de vencimento
        if (filters.dataVencimento) {
            const dataVencimento = new Date(filters.dataVencimento);
            filtered = filtered.filter(link => {
                if (!link.expires_at) return false;
                const vencimentoDate = new Date(link.expires_at);
                return vencimentoDate.toDateString() === dataVencimento.toDateString();
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
            dataVencimento: '',
        });
    };

    const handleEdit = (link: Link) => {
        setEditingLink(link.id);
        setEditData({
            nome: link.nome,
            url: link.url || link.link,
            expires_at: link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : '',
        });
    };

    const handleSave = async (linkId: string) => {
        try {
            const updates = {
                nome: editData.nome,
                url: editData.url,
                link: editData.url,
                expires_at: editData.expires_at ? new Date(editData.expires_at).toISOString() : null,
            };

            await updateLink(linkId, updates);
            setLinks(prev => 
                prev.map(l => l.id === linkId ? { ...l, ...updates } : l)
            );
            setEditingLink(null);
            setEditData({});
        } catch (err) {
            console.error('Erro ao atualizar link:', err);
            setError('Erro ao atualizar link');
        }
    };

    const handleCancel = () => {
        setEditingLink(null);
        setEditData({});
    };

    const handleDelete = async (linkId: string) => {
        if (!confirm('Tem certeza que deseja apagar este link?')) return;
        
        setDeleting(prev => ({ ...prev, [linkId]: true }));
        try {
            await deleteLink(linkId);
            setLinks(prev => prev.filter(l => l.id !== linkId));
        } catch (err) {
            console.error('Erro ao apagar link:', err);
            setError('Erro ao apagar link');
        } finally {
            setDeleting(prev => ({ ...prev, [linkId]: false }));
        }
    };

    const handleResend = async (link: Link) => {
        setResending(prev => ({ ...prev, [link.id]: true }));
        try {
            // Lógica de reenvio aqui
            console.log('Reenviando link:', link);
        } catch (err) {
            console.error('Erro ao reenviar link:', err);
            setError('Erro ao reenviar link');
        } finally {
            setResending(prev => ({ ...prev, [link.id]: false }));
        }
    };

    const getStatusColor = (link: Link) => {
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return 'bg-red-100 text-red-800';
        }
        switch (link.status) {
            case 'ativo': return 'bg-green-100 text-green-800';
            case 'usado': return 'bg-blue-100 text-blue-800';
            case 'expirado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (link: Link) => {
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return 'Expirado';
        }
        switch (link.status) {
            case 'ativo': return 'Ativo';
            case 'usado': return 'Usado';
            case 'expirado': return 'Expirado';
            default: return link.status;
        }
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
                            <div>
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

                            {/* Data de Vencimento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Data Vencimento
                                </label>
                                <input
                                    type="date"
                                    value={filters.dataVencimento}
                                    onChange={(e) => handleFilterChange('dataVencimento', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Resumo */}
                        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                            <span>Mostrando {filteredLinks.length} de {links.length} links</span>
                            {(filters.search || filters.status || filters.dataInicio || filters.dataFim || filters.dataVencimento) && (
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
                                    {editingLink === link.id ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                                                    <input
                                                        type="text"
                                                        value={editData.nome}
                                                        onChange={(e) => setEditData(prev => ({ ...prev, nome: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                                                    <input
                                                        type="url"
                                                        value={editData.url}
                                                        onChange={(e) => setEditData(prev => ({ ...prev, url: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Vencimento</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={editData.expires_at}
                                                        onChange={(e) => setEditData(prev => ({ ...prev, expires_at: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleSave(link.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Salvar</span>
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    <span>Cancelar</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(link)}`}>
                                                        {getStatusText(link)}
                                                    </span>
                                                    <span className="text-gray-500 text-sm">#{link.id.slice(-8)}</span>
                                                </div>

                                                <div className="flex items-center space-x-2 text-gray-500 text-sm">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(link.created_at).toLocaleString('pt-BR')}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                                <div className="flex items-center space-x-2 text-gray-700">
                                                    <User className="w-4 h-4 text-purple-500" />
                                                    <span className="font-medium">{link.nome}</span>
                                                </div>

                                                <div className="flex items-center space-x-2 text-gray-700">
                                                    <Hash className="w-4 h-4 text-indigo-500" />
                                                    <span className="truncate">{link.url || link.link}</span>
                                                </div>

                                                <div className="flex items-center space-x-2 text-gray-700">
                                                    {getStatusText(link) === 'Ativo' ? (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                    )}
                                                    <span>{getStatusText(link)}</span>
                                                </div>
                                            </div>

                                            {link.expires_at && (
                                                <div className="mb-4 flex items-center space-x-2 text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 text-orange-500" />
                                                    <span>
                                                        {new Date(link.expires_at) < new Date() ? 'Expirou em' : 'Expira em'} {' '}
                                                        {new Date(link.expires_at).toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                                                <button
                                                    onClick={() => handleEdit(link)}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200 flex items-center space-x-1"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    <span>Editar</span>
                                                </button>

                                                {currentUser.perfil === 'supervisao' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleResend(link)}
                                                            disabled={resending[link.id]}
                                                            className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-all duration-200 flex items-center space-x-1 disabled:opacity-50"
                                                        >
                                                            {resending[link.id] ? (
                                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <RefreshCw className="w-4 h-4" />
                                                            )}
                                                            <span>Reenviar</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleDelete(link.id)}
                                                            disabled={deleting[link.id]}
                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 flex items-center space-x-1 disabled:opacity-50"
                                                        >
                                                            {deleting[link.id] ? (
                                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                            <span>Apagar</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </>
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
