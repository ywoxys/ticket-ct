import React, { useState, useEffect } from 'react';
import { DollarSign, Edit2, Save, X, Plus, Loader2 } from 'lucide-react';
import { getValoresMensalidades, updateValorMensalidade, createValorMensalidade } from '../lib/supabase';
import type { ValorMensalidade } from '../types';

export function ValoresMensalidadesPanel() {
  const [valores, setValores] = useState<ValorMensalidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuantidade, setNewQuantidade] = useState('');
  const [newValor, setNewValor] = useState('');

  useEffect(() => {
    loadValores();
  }, []);

  const loadValores = async () => {
    try {
      const data = await getValoresMensalidades();
      setValores(data);
    } catch (err) {
      console.error('Erro ao carregar valores:', err);
      setError('Erro ao carregar valores de mensalidades');
    }
  };

  const handleEdit = (valor: ValorMensalidade) => {
    setEditingId(valor.id);
    setEditValue(valor.valor.toString());
  };

  const handleSave = async (id: string) => {
    if (!editValue.trim()) return;

    setLoading(true);
    setError('');

    try {
      const updatedValor = await updateValorMensalidade(id, parseFloat(editValue));
      setValores(prev => 
        prev.map(v => v.id === id ? updatedValor : v)
      );
      setEditingId(null);
      setEditValue('');
    } catch (err) {
      console.error('Erro ao atualizar valor:', err);
      setError('Erro ao atualizar valor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuantidade.trim() || !newValor.trim()) return;

    setLoading(true);
    setError('');

    try {
      const novoValor = await createValorMensalidade(
        parseInt(newQuantidade),
        parseFloat(newValor)
      );
      setValores(prev => [...prev, novoValor].sort((a, b) => a.quantidade - b.quantidade));
      setNewQuantidade('');
      setNewValor('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Erro ao criar valor:', err);
      setError('Erro ao criar novo valor de mensalidade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Valores de Mensalidades</h2>
              <p className="text-emerald-100 mt-1">Configure os valores fixos para cada quantidade de mensalidades</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Valor</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
              {error}
            </div>
          )}

          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Novo Valor</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quantidade de Mensalidades *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newQuantidade}
                      onChange={(e) => setNewQuantidade(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ex: 24"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newValor}
                      onChange={(e) => setNewValor(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ex: 2400.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    <span>{loading ? 'Adicionando...' : 'Adicionar'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Valores Configurados ({valores.length})</span>
            </h3>
            
            {valores.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhum valor configurado</p>
                <p className="text-gray-400 mt-1">Adicione o primeiro valor acima</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {valores.map((valor) => (
                  <div
                    key={valor.id}
                    className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{valor.quantidade}x</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {valor.quantidade} mensalidade{valor.quantidade > 1 ? 's' : ''}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Criado em {new Date(valor.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {editingId === valor.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Valor"
                          />
                          <button
                            onClick={() => handleSave(valor.id)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-all duration-200"
                            title="Salvar"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-emerald-600">
                            R$ {valor.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() => handleEdit(valor)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
                            title="Editar valor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}