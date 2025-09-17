import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Phone, DollarSign, Hash } from 'lucide-react';
import { getSolicitacoes, updateSolicitacao } from '../../lib/supabase.ts';
import type { Solicitacao } from '../../types';

interface SolicitacoesPanelProps {
    currentUser: any;
}

export function SolicitacoesPanel({ currentUser }: SolicitacoesPanelProps) {
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [observacoes, setObservacoes] = useState<{ [key: string]: string }>({});
    const [links, setLinks] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        loadSolicitacoes();
    }, []);

    const loadSolicitacoes = async () => {
        try {
            const data = await getSolicitacoes();
            setSolicitacoes(data as Solicitacao[]);
        } catch (err) {
            console.error('Erro ao carregar solicitações:', err);
            setError('Erro ao carregar solicitações');
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (id: string, status: 'aprovado' | 'rejeitado') => {
        const solicitacao = solicitacoes.find(s => s.id === id);

        if (status === 'aprovado' && solicitacao?.ticket?.categoria === 'Link' && !links[id]?.trim()) {
            setError('O campo Link é obrigatório para aprovação de tickets da categoria Link');
            return;
        }

        try {
            await updateSolicitacao(id, status, currentUser.perfil, observacoes[id] || '', links[id] || '');

            if (status === 'aprovado' && solicitacao?.ticket) {
                const ticket = solicitacao.ticket;
                const atendenteNome = ticket.atendente?.nome || '';

                let webhookUrl = `http://195.200.5.252:5678/webhook/trello-ctn?atendente=${encodeURIComponent(atendenteNome)}&matricula=${encodeURIComponent(ticket.matricula)}&nome=${encodeURIComponent(ticket.nome)}&valor=${ticket.valor}&qtd=${ticket.qtd_mensalidades}&telefone=${ticket.telefone}&categoria=${ticket.categoria}`;

                if (ticket.subcategoria) webhookUrl += `&subcategoria=${ticket.subcategoria}`;
                if (ticket.categoria === 'Link' && links[id]) webhookUrl += `&link=${encodeURIComponent(links[id])}`;

                await fetch(webhookUrl, { method: 'GET', mode: 'no-cors' });
            }

            setSolicitacoes(prev =>
                prev.map(s =>
                    s.id === id
                        ? { ...s, status, aprovado_por_equipe: currentUser.perfil, link: links[id] || '' }
                        : s
                )
            );
            setObservacoes(prev => ({ ...prev, [id]: '' }));
            setLinks(prev => ({ ...prev, [id]: '' }));
            setError('');
        } catch (err) {
            console.error('Erro ao atualizar solicitação:', err);
            setError('Erro ao atualizar solicitação');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'aprovado': return 'bg-green-100 text-green-800';
            case 'rejeitado': return 'bg-red-100 text-red-800';
            case 'pendente': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'aprovado': return <CheckCircle className="w-4 h-4" />;
            case 'rejeitado': return <XCircle className="w-4 h-4" />;
            case 'pendente': return <Clock className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
                    <h2 className="text-2xl font-bold text-white">
                        {currentUser.perfil === 'whatsapp' ? 'Aprovar Solicitações' : 'Minhas Solicitações'}
                    </h2>
                    <p className="text-orange-100 mt-1">
                        {currentUser.perfil === 'whatsapp'
                            ? 'Aprove ou rejeite solicitações de links da equipe de ligação'
                            : 'Acompanhe o status das suas solicitações'}
                    </p>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
                            {error}
                        </div>
                    )}

                    {solicitacoes.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Nenhuma solicitação encontrada</p>
                            <p className="text-gray-400 mt-1">
                                {currentUser.perfil === 'whatsapp'
                                    ? 'Solicitações para aprovação aparecerão aqui'
                                    : 'Suas solicitações aparecerão aqui'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {solicitacoes.map((solicitacao) => (
                                <div
                                    key={solicitacao.id}
                                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-6 transition-all duration-200 border border-gray-200"
                                >
                                    {/* Status e ID */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(solicitacao.status)}`}>
                                                {getStatusIcon(solicitacao.status)}
                                                <span>{solicitacao.status.charAt(0).toUpperCase() + solicitacao.status.slice(1)}</span>
                                            </span>
                                            <span className="text-gray-500 text-sm">#{solicitacao.id.slice(-8)}</span>
                                        </div>
                                        <div className="text-right text-sm text-gray-500">
                                            <p>Criado em {new Date(solicitacao.created_at).toLocaleString('pt-BR')}</p>
                                            {solicitacao.status !== 'pendente' && (
                                                <p>Atualizado em {new Date(solicitacao.updated_at).toLocaleString('pt-BR')}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dados do ticket */}
                                    {solicitacao.ticket && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                                            <div className="flex items-center space-x-2 text-gray-700">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span>{solicitacao.ticket.nome}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-gray-700">
                                                <Phone className="w-4 h-4 text-orange-500" />
                                                <span>{solicitacao.ticket.telefone}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-gray-700">
                                                <DollarSign className="w-4 h-4 text-green-500" />
                                                <span>R$ {solicitacao.ticket.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-gray-700">
                                                <span className="text-sm">Parcelas: {solicitacao.ticket.qtd_mensalidades}x</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-gray-700">
                                                <Hash className="w-4 h-4 text-indigo-500" />
                                                <span>{solicitacao.ticket.matricula}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Observações */}
                                    {solicitacao.observacoes && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                            <p className="text-sm text-blue-800">
                                                <strong>Observações:</strong> {solicitacao.observacoes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Link existente */}
                                    {solicitacao.link && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                            <p className="text-sm text-blue-800">
                                                <strong>Link:</strong>
                                                <a href={solicitacao.link} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:text-blue-800 underline">
                                                    {solicitacao.link}
                                                </a>
                                            </p>
                                        </div>
                                    )}

                                    {/* Campo de aprovação */}
                                    {currentUser.perfil === 'whatsapp' && solicitacao.status === 'pendente' && (
                                        <div className="border-t border-gray-200 pt-4">
                                            {solicitacao.ticket?.categoria === 'Link' && (
                                                <div className="mb-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Link * <span className="text-red-500">(obrigatório)</span>
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={links[solicitacao.id] || ''}
                                                        onChange={(e) => setLinks(prev => ({ ...prev, [solicitacao.id]: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                                        placeholder="https://exemplo.com/link"
                                                        required
                                                    />
                                                </div>
                                            )}

                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Observações (opcional)
                                                </label>
                                                <textarea
                                                    value={observacoes[solicitacao.id] || ''}
                                                    onChange={(e) => setObservacoes(prev => ({ ...prev, [solicitacao.id]: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                                    rows={2}
                                                    placeholder="Adicione observações sobre esta solicitação..."
                                                />
                                            </div>

                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleApproval(solicitacao.id, 'aprovado')}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Aprovar</span>
                                                </button>

                                                <button
                                                    onClick={() => handleApproval(solicitacao.id, 'rejeitado')}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    <span>Rejeitar</span>
                                                </button>
                                            </div>
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
