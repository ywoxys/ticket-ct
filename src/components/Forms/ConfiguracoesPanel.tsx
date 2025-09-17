import React, { useState, useEffect } from 'react';
import {
  Settings, Save, Loader2, Calendar, Edit2, X, Plus,
  Eye, EyeOff, DollarSign
} from 'lucide-react';

import {
  getConfiguracoesSupervisor,
  updateConfiguracoesSupervisor,
  getUsuarios,
  updateUsuario,
  createUsuario,
  getValoresMensalidades,
  updateValorMensalidade,
  createValorMensalidade
} from '../../lib/supabase.ts';

import type {
  ConfiguracaoSupervisor,
  Usuario,
  ValorMensalidade
} from '../../types';

export function ConfiguracoesPanel() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Supervisor
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoSupervisor | null>(null);
  const [mesReferente, setMesReferente] = useState('');
  const [loadingSupervisor, setLoadingSupervisor] = useState(false);

  // Usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editingUsuario, setEditingUsuario] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ nome: string; id_planilha: string }>({ nome: '', id_planilha: '' });
  const [newUsuarioName, setNewUsuarioName] = useState('');
  const [creatingUsuario, setCreatingUsuario] = useState(false);

  // Valores
  const [valores, setValores] = useState<ValorMensalidade[]>([]);
  const [loadingValores, setLoadingValores] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuantidade, setNewQuantidade] = useState('');
  const [newValor, setNewValor] = useState('');

  useEffect(() => {
    loadSupervisor();
    loadUsuarios();
    loadValores();
  }, []);

  // Supervisor
  const loadSupervisor = async () => {
    try {
      const data = await getConfiguracoesSupervisor();
      setConfiguracoes(data);
      setMesReferente(data.mes_referente);
    } catch {
      setError('Erro ao carregar configurações do supervisor');
    }
  };

  const handleSaveMes = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSupervisor(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateConfiguracoesSupervisor(mesReferente);
      setConfiguracoes(updated);
      setSuccess('Mês de referência atualizado!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Erro ao atualizar mês de referência');
    } finally {
      setLoadingSupervisor(false);
    }
  };

  // Usuários
  const loadUsuarios = async () => {
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch {
      setError('Erro ao carregar usuários');
    }
  };

  const handleEditUsuario = (u: Usuario) => {
    setEditingUsuario(u.id);
    setEditData({ nome: u.nome, id_planilha: u.id_planilha || '' });
  };

  const handleSaveUsuario = async (id: string) => {
    try {
      const updated = await updateUsuario(id, editData);
      setUsuarios(prev => prev.map(u => u.id === id ? updated : u));
      setEditingUsuario(null);
      setEditData({ nome: '', id_planilha: '' });
    } catch {
      setError('Erro ao atualizar usuário');
    }
  };

  const handleAddUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsuarioName.trim()) return;
    setCreatingUsuario(true);
    try {
      const novo = await createUsuario(newUsuarioName.trim());
      setUsuarios(prev => [...prev, novo]);
      setNewUsuarioName('');
      setSuccess('Usuário criado com sucesso!');
    } catch {
      setError('Erro ao criar usuário');
    } finally {
      setCreatingUsuario(false);
    }
  };

  // Valores
  const loadValores = async () => {
    try {
      const data = await getValoresMensalidades();
      setValores(data);
    } catch {
      setError('Erro ao carregar valores');
    }
  };

  const handleSaveValor = async (id: string) => {
    if (!editValue.trim()) return;
    setLoadingValores(true);
    try {
      const updated = await updateValorMensalidade(id, parseFloat(editValue));
      setValores(prev => prev.map(v => v.id === id ? updated : v));
      setEditingId(null);
      setEditValue('');
    } catch {
      setError('Erro ao atualizar valor');
    } finally {
      setLoadingValores(false);
    }
  };

  const handleAddValor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuantidade.trim() || !newValor.trim()) return;
    setLoadingValores(true);
    try {
      const novo = await createValorMensalidade(parseInt(newQuantidade), parseFloat(newValor));
      setValores(prev => [...prev, novo].sort((a, b) => a.quantidade - b.quantidade));
      setNewQuantidade('');
      setNewValor('');
      setShowAddForm(false);
    } catch {
      setError('Erro ao criar valor de mensalidade');
    } finally {
      setLoadingValores(false);
    }
  };

  // Meses
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">{success}</div>}

      {/* Supervisor */}
      <section className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-6">
          <h2 className="text-2xl font-bold text-white">Configurações do Sistema</h2>
          <p className="text-slate-100">Parâmetros gerais</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSaveMes} className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">Mês de Referência</label>
            <select
              value={mesReferente}
              onChange={(e) => setMesReferente(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg"
            >
              {meses.map(m => <option key={m}>{m}</option>)}
            </select>
            <button
              type="submit"
              disabled={loadingSupervisor}
              className="bg-slate-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              {loadingSupervisor ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loadingSupervisor ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>
      </section>

      {/* Usuários */}
      <section className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-6">
          <h2 className="text-2xl font-bold text-white">Usuários</h2>
        </div>
        <div className="p-6 space-y-4">
          <form onSubmit={handleAddUsuario} className="flex gap-4">
            <input
              type="text"
              value={newUsuarioName}
              onChange={(e) => setNewUsuarioName(e.target.value)}
              placeholder="Nome do usuário"
              className="flex-1 px-4 py-3 border rounded-lg"
            />
            <button
              type="submit"
              disabled={creatingUsuario}
              className="bg-slate-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              {creatingUsuario ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {creatingUsuario ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>

          <div className="space-y-2">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                {editingUsuario === u.id ? (
                  <div className="flex gap-2 w-full">
                    <input
                      value={editData.nome}
                      onChange={(e) => setEditData(p => ({ ...p, nome: e.target.value }))}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <input
                      value={editData.id_planilha}
                      onChange={(e) => setEditData(p => ({ ...p, id_planilha: e.target.value }))}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <button onClick={() => handleSaveUsuario(u.id)} className="bg-green-600 text-white px-4 rounded-lg">Salvar</button>
                    <button onClick={() => setEditingUsuario(null)} className="bg-gray-500 text-white px-4 rounded-lg">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-semibold">{u.nome}</h4>
                      <p className="text-sm text-gray-500">Planilha: {u.id_planilha || 'Não configurado'}</p>
                    </div>
                    <button onClick={() => handleEditUsuario(u)} className="text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Valores ---------------- */}
      <section className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-6">
          <h2 className="text-2xl font-bold text-white">Valores de Mensalidades</h2>
        </div>
        <div className="p-6 space-y-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-slate-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus /> Novo Valor
          </button>

          {showAddForm && (
            <form onSubmit={handleAddValor} className="flex gap-2">
              <input
                type="number"
                placeholder="Quantidade"
                value={newQuantidade}
                onChange={(e) => setNewQuantidade(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Valor"
                value={newValor}
                onChange={(e) => setNewValor(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <button type="submit" className="bg-emerald-700 text-white px-4 rounded-lg">Adicionar</button>
            </form>
          )}

          <div className="space-y-2">
            {valores.map(v => (
              <div key={v.id} className="p-4 border rounded-lg flex justify-between items-center">
                {editingId === v.id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-3 py-2 border rounded-lg"
                    />
                    <button onClick={() => handleSaveValor(v.id)} className="bg-green-600 text-white px-4 rounded-lg">Salvar</button>
                    <button onClick={() => setEditingId(null)} className="bg-gray-500 text-white px-4 rounded-lg">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <span>{v.quantidade}x - R$ {v.valor.toFixed(2)}</span>
                    <button onClick={() => { setEditingId(v.id); setEditValue(v.valor.toString()); }} className="text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
