import React, { useState, useEffect } from 'react';
import { Users, Send, Loader2, UserCheck } from 'lucide-react';
import { getUsuarios, getConfiguracoesSupervisor, getClientes, distribuirClientes } from '../../lib/supabase.ts';
import type { Usuario, DistribuicaoClientes, ConfiguracaoSupervisor, Cliente } from '../../types';

export function DistribuicaoClientesPanel() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mesReferente, setMesReferente] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<DistribuicaoClientes>({
    usuario_id: '',
    categoria: 'NR',
    aba_destino: '',
    quantidade: 1,
  });

  useEffect(() => {
    loadUsuarios();
    loadClientes();
    loadMesReferente();
  }, []);

  const loadUsuarios = async () => {
    try {
      const data = await getUsuarios();
      // Filtrar apenas usuários de ligação
      setUsuarios(data.filter(u => u.perfil === 'ligacao'));
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
    }
  };

  const loadClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar clientes');
    }
  };

  const loadMesReferente = async () => {
    try {
      const config: ConfiguracaoSupervisor = await getConfiguracoesSupervisor();
      if (config?.mes_referente) {
        setMesReferente(config.mes_referente);
        setFormData(prev => ({ ...prev, aba_destino: config.mes_referente }));
      }
    } catch (err) {
      console.error('Erro ao carregar mês de referência:', err);
      setError('Erro ao carregar mês de referência');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.usuario_id || !formData.aba_destino || formData.quantidade <= 0) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const usuario = usuarios.find(u => u.id === formData.usuario_id);
    if (!usuario) {
      setError('Usuário não encontrado.');
      return;
    }

    // Verificar se há clientes suficientes da categoria
    const clientesDisponiveis = clientes.filter(c => c.categoria === formData.categoria);
    if (clientesDisponiveis.length < formData.quantidade) {
      setError(`Apenas ${clientesDisponiveis.length} clientes disponíveis da categoria ${formData.categoria}`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Distribuir clientes diretamente na tabela clientes_distribuidos
      await distribuirClientes(formData.usuario_id, formData.categoria, formData.quantidade);

      setSuccess('Distribuição de clientes enviada com sucesso!');
      
      setFormData({
        usuario_id: '',
        categoria: 'NR',
        aba_destino: mesReferente,
        quantidade: 1,
      });

      // Recarregar clientes para atualizar disponibilidade
      loadClientes();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Erro ao enviar distribuição:', err);
      setError(err.message || 'Erro ao distribuir clientes');
    } finally {
      setLoading(false);
    }
  };

  const categorias = [
    { value: 'NR', label: 'NR' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
  ];

  const getClientesDisponiveis = (categoria: string) => {
    return clientes.filter(c => c.categoria === categoria).length;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6">
          <h2 className="text-2xl font-bold text-white">Distribuição de Clientes</h2>
          <p className="text-teal-100 mt-1">Distribua clientes para os usuários de ligação</p>
        </div>

        <div className="p-6">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">{error}</div>}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 mb-6 flex items-center space-x-2">
              <UserCheck className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Resumo de clientes disponíveis */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Clientes Disponíveis por Categoria:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {categorias.map(cat => (
                <div key={cat.value} className="flex justify-between">
                  <span className="text-blue-700">{cat.label}:</span>
                  <span className="font-semibold text-blue-800">{getClientesDisponiveis(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Usuário */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Usuário *</label>
                <select
                  value={formData.usuario_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, usuario_id: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                >
                  <option value="">Selecione um usuário</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria *</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value as any }))}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                >
                  {categorias.map(c => (
                    <option key={c.value} value={c.value}>
                      {c.label} ({getClientesDisponiveis(c.value)} disponíveis)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantidade *</label>
                <input
                  type="number"
                  min="1"
                  max={getClientesDisponiveis(formData.categoria)}
                  value={formData.quantidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Máximo: {getClientesDisponiveis(formData.categoria)} clientes
                </p>
              </div>
            </div>

            {/* Resumo */}
            {formData.usuario_id && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h4 className="font-semibold text-teal-800 mb-2">Resumo:</h4>
                <p><strong>Usuário:</strong> {usuarios.find(u => u.id === formData.usuario_id)?.nome}</p>
                <p><strong>Categoria:</strong> {formData.categoria}</p>
                <p><strong>Quantidade:</strong> {formData.quantidade}</p>
                <p><strong>Disponíveis:</strong> {getClientesDisponiveis(formData.categoria)}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || getClientesDisponiveis(formData.categoria) < formData.quantidade}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {loading ? 'Enviando...' : 'Distribuir Clientes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
