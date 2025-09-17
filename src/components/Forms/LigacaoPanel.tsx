import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, User, Hash, Calendar, DollarSign, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { 
  getClientesDistribuidos, 
  updateClienteDistribuido, 
  createLigacao, 
  createTicket,
  buscarClientePorMatricula,
  getValoresMensalidades
} from '../../lib/supabase.ts';
import type { ClienteDistribuido, LigacaoFormData, ValorMensalidade } from '../../types';

interface LigacaoPanelProps {
  currentUser: any;
}

export function LigacaoPanel({ currentUser }: LigacaoPanelProps) {
  const [clientes, setClientes] = useState<ClienteDistribuido[]>([]);
  const [valoresMensalidades, setValoresMensalidades] = useState<ValorMensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteDistribuido | null>(null);
  const [formData, setFormData] = useState<LigacaoFormData>({
    matricula: '',
    nome: '',
    qtd_mensalidades: '',
    valor: '',
    telefone: '',
    forma_pagamento: 'pix',
    retorno: '1x',
    observacoes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientesData, valoresData] = await Promise.all([
        getClientesDistribuidos(currentUser.id),
        getValoresMensalidades()
      ]);
      setClientes(clientesData.filter(c => c.status === 'pendente'));
      setValoresMensalidades(valoresData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleClienteAction = async (cliente: ClienteDistribuido, action: 'atendeu' | 'nao_atendeu') => {
    try {
      if (action === 'atendeu') {
        setSelectedCliente(cliente);
        setFormData(prev => ({
          ...prev,
          matricula: cliente.matricula,
          nome: cliente.nome,
          telefone: cliente.telefone,
        }));
        
        // Buscar dados existentes da matrícula
        try {
          const clienteExistente = await buscarClientePorMatricula(cliente.matricula);
          if (clienteExistente) {
            setFormData(prev => ({
              ...prev,
              nome: clienteExistente.nome,
              telefone: clienteExistente.telefone,
            }));
          }
        } catch (err) {
          // Cliente não encontrado, usar dados do cliente distribuído
        }
        
        setShowForm(true);
      } else {
        await updateClienteDistribuido(cliente.id, {
          status: 'nao_atendido',
          data_atendimento: new Date().toISOString()
        });
        
        await createLigacao({
          usuario_id: currentUser.id,
          cliente_id: cliente.id,
          matricula: cliente.matricula,
          nome: cliente.nome,
          telefone: cliente.telefone,
          status: 'nao_atendeu',
          ticket_gerado: false
        });
        
        setClientes(prev => prev.filter(c => c.id !== cliente.id));
        setSuccess('Ligação registrada como não atendida');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Erro ao processar ação:', err);
      setError('Erro ao processar ação');
    }
  };

  const getValorSugerido = (qtdMensalidades: string) => {
    if (!qtdMensalidades) return null;
    const qtd = parseInt(qtdMensalidades);
    const valorConfig = valoresMensalidades.find(v => v.quantidade === qtd);
    return valorConfig ? valorConfig.valor : null;
  };

  const handleQtdMensalidadesChange = (qtd: string) => {
    setFormData(prev => ({ ...prev, qtd_mensalidades: qtd }));
    
    const valorSugerido = getValorSugerido(qtd);
    if (valorSugerido) {
      setFormData(prev => ({ ...prev, valor: valorSugerido.toString() }));
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const formattedValue = (parseInt(numericValue) / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formattedValue;
  };

  const formatPhone = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 11) {
      return numericValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;

    setLoading(true);
    setError('');

    try {
      // Registrar ligação
      const ligacao = await createLigacao({
        usuario_id: currentUser.id,
        cliente_id: selectedCliente.id,
        matricula: formData.matricula,
        nome: formData.nome,
        telefone: formData.telefone,
        status: 'atendeu',
        qtd_mensalidades: parseInt(formData.qtd_mensalidades),
        valor: parseFloat(formData.valor),
        forma_pagamento: formData.forma_pagamento,
        retorno: formData.retorno,
        data_retorno: formData.data_retorno,
        observacoes: formData.observacoes,
        ticket_gerado: false
      });

      // Atualizar cliente
      await updateClienteDistribuido(selectedCliente.id, {
        status: 'atendido',
        data_atendimento: new Date().toISOString()
      });

      setClientes(prev => prev.filter(c => c.id !== selectedCliente.id));
      setShowForm(false);
      setSelectedCliente(null);
      setFormData({
        matricula: '',
        nome: '',
        qtd_mensalidades: '',
        valor: '',
        telefone: '',
        forma_pagamento: 'pix',
        retorno: '1x',
        observacoes: '',
      });
      
      setSuccess('Ligação registrada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao registrar ligação:', err);
      setError('Erro ao registrar ligação');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarTicket = async () => {
    if (!selectedCliente) return;

    try {
      // Criar ticket
      const ticket = await createTicket({
        usuario_id: currentUser.id,
        matricula: formData.matricula,
        nome: formData.nome,
        valor: parseFloat(formData.valor),
        qtd_mensalidades: parseInt(formData.qtd_mensalidades),
        telefone: formData.telefone,
        categoria: formData.forma_pagamento === 'pix' ? 'Pix' : 'Link',
        observacoes: formData.observacoes,
      });

      // Fazer requisição webhook
      const webhookUrl = `http://195.200.5.252:5678/webhook/trello-ctn?atendente=${encodeURIComponent(currentUser.nome)}&matricula=${encodeURIComponent(formData.matricula)}&nome=${encodeURIComponent(formData.nome)}&valor=${formData.valor}&qtd=${formData.qtd_mensalidades}&telefone=${formData.telefone}&categoria=${formData.forma_pagamento === 'pix' ? 'Pix' : 'Link'}`;

      await fetch(webhookUrl, { method: 'GET', mode: 'no-cors' });

      setSuccess('Ticket enviado com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar ticket:', err);
      setError('Erro ao enviar ticket');
    }
  };

  if (loading && !showForm) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {!showForm ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-2xl font-bold text-white">Painel de Ligações</h2>
            <p className="text-blue-100 mt-1">Clientes distribuídos para atendimento</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 mb-6 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            )}

            {clientes.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhum cliente para atendimento</p>
                <p className="text-gray-400 mt-1">Novos clientes aparecerão aqui quando distribuídos</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-6 transition-all duration-200 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{cliente.nome}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center space-x-1">
                              <Hash className="w-4 h-4" />
                              <span>{cliente.matricula}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{cliente.telefone}</span>
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {cliente.categoria}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleClienteAction(cliente, 'atendeu')}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>Atendeu</span>
                        </button>
                        
                        <button
                          onClick={() => handleClienteAction(cliente, 'nao_atendeu')}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                        >
                          <PhoneOff className="w-4 h-4" />
                          <span>Não Atendeu</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
            <h2 className="text-2xl font-bold text-white">Formulário de Atendimento</h2>
            <p className="text-green-100 mt-1">Preencha os dados do atendimento</p>
          </div>

          <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Matrícula *
                </label>
                <input
                  type="text"
                  value={formData.matricula}
                  onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Qtd. Mensalidades *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.qtd_mensalidades}
                  onChange={(e) => handleQtdMensalidadesChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valor (R$) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  {getValorSugerido(formData.qtd_mensalidades) && 
                   getValorSugerido(formData.qtd_mensalidades) !== parseFloat(formData.valor) && (
                    <div className="absolute -bottom-6 left-0 text-xs text-green-600">
                      Valor sugerido: R$ {getValorSugerido(formData.qtd_mensalidades)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: formatPhone(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Forma de Pagamento *
                </label>
                <select
                  value={formData.forma_pagamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, forma_pagamento: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                  required
                >
                  <option value="pix">Pix</option>
                  <option value="link">Link</option>
                  <option value="unidade">Unidade</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Retorno *
                </label>
                <select
                  value={formData.retorno}
                  onChange={(e) => setFormData(prev => ({ ...prev, retorno: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                  required
                >
                  <option value="1x">1x</option>
                  <option value="2x">2x</option>
                  <option value="3x">3x</option>
                  <option value="4+">4+</option>
                </select>
              </div>

              {formData.retorno !== '1x' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data de Retorno
                  </label>
                  <input
                    type="date"
                    value={formData.data_retorno || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_retorno: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  rows={3}
                  placeholder="Observações sobre o atendimento..."
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Registrar Atendimento</span>
              </button>

              <button
                type="button"
                onClick={handleEnviarTicket}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Enviar Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedCliente(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}