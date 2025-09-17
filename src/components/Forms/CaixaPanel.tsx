import React, { useState, useEffect } from 'react';
import { DollarSign, Save, FileText, Calendar, User, Hash, CheckCircle, X, Loader2 } from 'lucide-react';
import { getCaixa, createCaixa, fecharCaixa } from '../../lib/supabase.ts';
import type { Caixa, CaixaFormData } from '../../types';

interface CaixaPanelProps {
  currentUser: any;
}

export function CaixaPanel({ currentUser }: CaixaPanelProps) {
  const [caixaItems, setCaixaItems] = useState<Caixa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [caixaFechado, setCaixaFechado] = useState(false);
  const [showResumo, setShowResumo] = useState(false);
  const [dataOperacao] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<CaixaFormData>({
    matricula: '',
    nome: '',
    valor: '',
    comprovante: '',
  });

  useEffect(() => {
    loadCaixa();
  }, []);

  const loadCaixa = async () => {
    try {
      const data = await getCaixa(currentUser.id, dataOperacao);
      setCaixaItems(data);
      setCaixaFechado(data.length > 0 && data[0].fechado);
    } catch (err) {
      console.error('Erro ao carregar caixa:', err);
      setError('Erro ao carregar caixa');
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const formattedValue = (parseInt(numericValue || '0') / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formattedValue;
  };

  const handleValueChange = (value: string) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, valor: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (caixaFechado) return;

    setLoading(true);
    setError('');

    try {
      const valorNumerico = parseFloat(formData.valor.replace(/\./g, '').replace(',', '.'));
      
      const novoCaixa = await createCaixa({
        usuario_id: currentUser.id,
        matricula: formData.matricula,
        nome: formData.nome,
        valor: valorNumerico,
        comprovante: formData.comprovante,
        data_operacao: dataOperacao,
        fechado: false
      });

      setCaixaItems(prev => [novoCaixa, ...prev]);
      setFormData({
        matricula: '',
        nome: '',
        valor: '',
        comprovante: '',
      });
      
      setSuccess('Item adicionado ao caixa!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao adicionar item ao caixa:', err);
      setError('Erro ao adicionar item ao caixa');
    } finally {
      setLoading(false);
    }
  };

  const handleFecharCaixa = async () => {
    if (caixaItems.length === 0) {
      setError('Não há itens no caixa para fechar');
      return;
    }

    setShowResumo(true);
  };

  const confirmarFechamento = async () => {
    setLoading(true);
    setError('');

    try {
      await fecharCaixa(currentUser.id, dataOperacao);
      setCaixaFechado(true);
      setShowResumo(false);
      setSuccess('Caixa fechado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao fechar caixa:', err);
      setError('Erro ao fechar caixa');
    } finally {
      setLoading(false);
    }
  };

  const totalCaixa = caixaItems.reduce((total, item) => total + item.valor, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
            <h2 className="text-2xl font-bold text-white">Caixa do Dia</h2>
            <p className="text-emerald-100 mt-1">{new Date(dataOperacao).toLocaleDateString('pt-BR')}</p>
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

            {caixaFechado ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Caixa Fechado</h3>
                <p className="text-gray-600">O caixa do dia {new Date(dataOperacao).toLocaleDateString('pt-BR')} foi fechado.</p>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-lg font-semibold text-green-800">
                    Total: R$ {totalCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Matrícula *
                    </label>
                    <input
                      type="text"
                      value={formData.matricula}
                      onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
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
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="Digite o nome completo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valor (R$) *
                    </label>
                    <input
                      type="text"
                      value={formData.valor}
                      onChange={(e) => handleValueChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Comprovante
                    </label>
                    <textarea
                      value={formData.comprovante}
                      onChange={(e) => setFormData(prev => ({ ...prev, comprovante: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      rows={3}
                      placeholder="Cole o comprovante aqui (Ctrl+C / Ctrl+V)"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{loading ? 'Adicionando...' : 'Adicionar ao Caixa'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Lista do Caixa */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Itens do Caixa</h3>
                <p className="text-blue-100 mt-1">{caixaItems.length} itens</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">
                  R$ {totalCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {caixaItems.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum item no caixa</p>
                <p className="text-gray-400 text-sm mt-1">Adicione itens usando o formulário ao lado</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {caixaItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{item.matricula}</span>
                        </div>
                        <span className="text-lg font-semibold text-emerald-600">
                          R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4" />
                        <span>{item.nome}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(item.created_at).toLocaleString('pt-BR')}</span>
                      </div>

                      {item.comprovante && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800 border border-blue-200">
                          <p className="font-medium mb-1">Comprovante:</p>
                          <p className="break-all">{item.comprovante}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!caixaFechado && caixaItems.length > 0 && (
                  <button
                    onClick={handleFecharCaixa}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Fechar Caixa</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Resumo */}
      {showResumo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Resumo do Caixa</h3>
              <p className="text-blue-100 mt-1">Confirme o fechamento</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium">{new Date(dataOperacao).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total de itens:</span>
                  <span className="font-medium">{caixaItems.length}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-900 font-semibold">Total:</span>
                  <span className="font-bold text-emerald-600">
                    R$ {totalCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={confirmarFechamento}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span>{loading ? 'Fechando...' : 'Confirmar Fechamento'}</span>
                </button>
                
                <button
                  onClick={() => setShowResumo(false)}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
                >
                  <X className="w-5 h-5" />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}