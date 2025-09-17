import React, { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle, X } from 'lucide-react';
import { createTicket, createSolicitacao, getValoresMensalidades } from '../../lib/supabase.ts';
import type { TicketFormData, ValorMensalidade } from '../../types';

interface TicketFormProps {
  currentUser: any;
}

export function TicketForm({ currentUser }: TicketFormProps) {
  const [valoresMensalidades, setValoresMensalidades] = useState<ValorMensalidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showSubcategoriaModal, setShowSubcategoriaModal] = useState(false);
  const [valorPersonalizado, setValorPersonalizado] = useState(false);
  const [formData, setFormData] = useState<TicketFormData>({
    usuario_id: '',
    matricula: '',
    nome: '',
    valor: '',
    qtd_mensalidades: '',
    telefone: '',
    categoria: 'Link',
    subcategoria: undefined,
    observacoes: '',
  });

  useEffect(() => {
    loadValoresMensalidades();
    setFormData(prev => ({ ...prev, usuario_id: currentUser.id }));
  }, []);

  const loadValoresMensalidades = async () => {
    try {
      const data = await getValoresMensalidades();
      setValoresMensalidades(data);
    } catch (err) {
      console.error('Erro ao carregar valores de mensalidades:', err);
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
    
    if (!valorPersonalizado) {
      const valorSugerido = getValorSugerido(qtd);
      if (valorSugerido) {
        setFormData(prev => ({ ...prev, valor: valorSugerido.toString() }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.usuario_id || !formData.matricula || !formData.nome || !formData.valor || !formData.qtd_mensalidades || !formData.telefone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (formData.categoria === 'Outros assuntos' && !formData.subcategoria) {
      setError('Por favor, selecione uma subcategoria para "Outros assuntos".');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const ticketData = {
        usuario_id: currentUser.id,
        matricula: formData.matricula,
        nome: formData.nome,
        valor: parseFloat(formData.valor),
        qtd_mensalidades: parseInt(formData.qtd_mensalidades),
        telefone: formData.telefone,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria,
        observacoes: formData.observacoes,
      };

      const newTicket = await createTicket(ticketData);

      if (formData.categoria === 'Link') {
        await createSolicitacao(newTicket.id);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        const usuarioNome = currentUser.nome || '';

        let webhookUrl = `http://195.200.5.252:5678/webhook/trello-ctn?usuario=${encodeURIComponent(usuarioNome)}&matricula=${encodeURIComponent(formData.matricula)}&nome=${encodeURIComponent(formData.nome)}&valor=${formData.valor}&qtd=${formData.qtd_mensalidades}&telefone=${formData.telefone}&categoria=${formData.categoria}`;

        if (formData.subcategoria) {
          webhookUrl += `&subcategoria=${formData.subcategoria}`;
        }

        await fetch(webhookUrl, { method: 'GET', mode: 'no-cors' });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }

      setFormData({
        usuario_id: currentUser.id,
        matricula: '',
        nome: '',
        valor: '',
        qtd_mensalidades: '',
        telefone: '',
        categoria: 'Link',
        subcategoria: undefined,
        observacoes: '',
      });

    } catch (err) {
      console.error('Erro ao criar ticket:', err);
      setError('Erro ao criar ticket. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'categoria' && value === 'Outros assuntos') {
      setShowSubcategoriaModal(true);
    }
    
    if (field === 'categoria' && value !== 'Outros assuntos') {
      setFormData(prev => ({ ...prev, subcategoria: undefined }));
    }
  };

  const handleSubcategoriaSelect = (subcategoria: 'endereco' | 'comprovantes') => {
    setFormData(prev => ({ ...prev, subcategoria }));
    setShowSubcategoriaModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h2 className="text-2xl font-bold text-white">Novo Ticket</h2>
          <p className="text-blue-100 mt-1">Preencha os dados para criar um novo ticket</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>{formData.categoria === 'Link' ? 'Ticket criado! Aguardando aprovação.' : 'Ticket criado com sucesso!'}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usuário *</label>
              <input
                type="text"
                value={currentUser.nome}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
              />
              <input type="hidden" value={currentUser.id} />
            </div>
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Matrícula *
                  </label>
                  <input
                      type="text"
                      value={formData.matricula}
                      onChange={(e) => handleInputChange('matricula', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Digite a matrícula"
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
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Digite o nome completo"
                      required
                  />
              </div>

              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valor *
                  </label>
                  <div className="relative">
                      <input
                          type="number"
                          step="0.01"
                          value={formData.valor}
                          onChange={(e) => {
                              handleInputChange('valor', e.target.value);
                              setValorPersonalizado(true);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="0,00"
                          required
                      />
                      {getValorSugerido(formData.qtd_mensalidades) &&
                          getValorSugerido(formData.qtd_mensalidades) !== parseFloat(formData.valor) && (
                              <div className="absolute -bottom-6 left-0 text-xs text-blue-600">
                                  Valor sugerido: R$ {getValorSugerido(formData.qtd_mensalidades)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  <button
                                      type="button"
                                      onClick={() => {
                                          const valorSugerido = getValorSugerido(formData.qtd_mensalidades);
                                          if (valorSugerido) {
                                              setFormData(prev => ({ ...prev, valor: valorSugerido.toString() }));
                                              setValorPersonalizado(false);
                                          }
                                      }}
                                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                  >
                                      Usar
                                  </button>
                              </div>
                          )}
                  </div>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="1"
                      required
                  />
              </div>

              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telefone *
                  </label>
                  <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="(11) 99999-9999"
                      required
                  />
              </div>

              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Categoria *
                  </label>
                  <select
                      value={formData.categoria}
                      onChange={(e) => handleInputChange('categoria', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      required
                  >
                      <option value="Link">Link</option>
                      <option value="Pix">Pix</option>
                      <option value="Outros assuntos">Outros assuntos</option>
                  </select>
                  {formData.categoria === 'Outros assuntos' && formData.subcategoria && (
                      <p className="text-sm text-blue-600 mt-1">
                          Subcategoria selecionada: {formData.subcategoria === 'endereco' ? 'Endereço' : 'Solicitação de Comprovantes'}
                      </p>
                  )}
                  {formData.categoria === 'Link' && (
                      <p className="text-sm text-amber-600 mt-1">
                          ⚠️ Links passam por aprovação da equipe WhatsApp antes do envio
                      </p>
                  )}
              </div>

              <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Observações
                  </label>
                  <textarea
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      rows={3}
                      placeholder="Adicione observações sobre este ticket (opcional)"
                  />
              </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span>{loading ? 'Criando...' : 'Criar Ticket'}</span>
          </button>
        </form>
      </div>

      {/* Modal de Subcategoria */}
      {showSubcategoriaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Selecionar Subcategoria</h3>
                <button
                  onClick={() => {
                    setShowSubcategoriaModal(false);
                    setFormData(prev => ({ ...prev, categoria: 'Link' }));
                  }}
                  className="text-white hover:text-orange-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-orange-100 mt-2">Escolha o tipo de solicitação:</p>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                onClick={() => handleSubcategoriaSelect('endereco')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>Endereço</span>
              </button>
              
              <button
                onClick={() => handleSubcategoriaSelect('comprovantes')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>Solicitação de Comprovantes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
