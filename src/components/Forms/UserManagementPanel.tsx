import React, { useState, useEffect } from 'react';
import { Users, Edit2, Save, X, Plus, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { getUsuarios, updateUsuario, createUsuario, deleteUsuario } from '../../lib/supabase.ts';
import type { Usuario } from '../../types';

export function UserManagementPanel() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [editData, setEditData] = useState<any>({});
  const [newUserData, setNewUserData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'ligacao' as 'ligacao' | 'whatsapp' | 'supervisao',
    id_planilha: '',
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario.id);
    setEditData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil: usuario.perfil,
      id_planilha: usuario.id_planilha || '',
    });
  };

  const handleSave = async (userId: string) => {
    try {
      const updates: any = {
        nome: editData.nome,
        email: editData.email,
        perfil: editData.perfil,
        id_planilha: editData.id_planilha,
      };

      if (editData.senha) {
        updates.senha = editData.senha;
      }

      const updatedUser = await updateUsuario(userId, updates);
      setUsuarios(prev => 
        prev.map(u => u.id === userId ? updatedUser : u)
      );
      setEditingUser(null);
      setEditData({});
      setSuccess('Usuário atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      setError('Erro ao atualizar usuário');
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditData({});
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const newUser = await createUsuario(newUserData);
      setUsuarios(prev => [...prev, newUser]);
      setNewUserData({
        nome: '',
        email: '',
        senha: '',
        perfil: 'ligacao',
        id_planilha: '',
      });
      setShowNewUserForm(false);
      setSuccess('Usuário criado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setError(err.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja apagar este usuário?')) return;

    try {
      await deleteUsuario(userId);
      setUsuarios(prev => prev.filter(u => u.id !== userId));
      setSuccess('Usuário apagado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao apagar usuário:', err);
      setError('Erro ao apagar usuário');
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const getPerfilColor = (perfil: string) => {
    switch (perfil) {
      case 'supervisao': return 'bg-purple-100 text-purple-800';
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'ligacao': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerfilName = (perfil: string) => {
    switch (perfil) {
      case 'supervisao': return 'Supervisão';
      case 'whatsapp': return 'WhatsApp';
      case 'ligacao': return 'Ligação';
      default: return perfil;
    }
  };

  if (loading && usuarios.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h2>
              <p className="text-indigo-100 mt-1">Configure usuários, senhas e permissões</p>
            </div>
            <button
              onClick={() => setShowNewUserForm(!showNewUserForm)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 mb-6">
              {success}
            </div>
          )}

          {/* Formulário de novo usuário */}
          {showNewUserForm && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Criar Novo Usuário</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input
                      type="text"
                      value={newUserData.nome}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Senha *</label>
                    <input
                      type="password"
                      value={newUserData.senha}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, senha: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Perfil *</label>
                    <select
                      value={newUserData.perfil}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, perfil: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value="ligacao">Ligação</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="supervisao">Supervisão</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID da Planilha</label>
                    <input
                      type="text"
                      value={newUserData.id_planilha}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, id_planilha: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="ID da planilha do Google Sheets"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Criando...' : 'Criar Usuário'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowNewUserForm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de usuários */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Usuários ({usuarios.length})</span>
            </h3>
            
            {usuarios.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhum usuário encontrado</p>
                <p className="text-gray-400 mt-1">Crie o primeiro usuário acima</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {usuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-6 transition-all duration-200 border border-gray-200"
                  >
                    {editingUser === usuario.id ? (
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              value={editData.email}
                              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha (deixe em branco para manter)</label>
                            <div className="relative">
                              <input
                                type={showPasswords[usuario.id] ? 'text' : 'password'}
                                value={editData.senha}
                                onChange={(e) => setEditData(prev => ({ ...prev, senha: e.target.value }))}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg"
                                placeholder="Nova senha"
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(usuario.id)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPasswords[usuario.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Perfil</label>
                            <select
                              value={editData.perfil}
                              onChange={(e) => setEditData(prev => ({ ...prev, perfil: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                            >
                              <option value="ligacao">Ligação</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="supervisao">Supervisão</option>
                            </select>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">ID da Planilha</label>
                            <input
                              type="text"
                              value={editData.id_planilha}
                              onChange={(e) => setEditData(prev => ({ ...prev, id_planilha: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="ID da planilha do Google Sheets"
                            />
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(usuario.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                          >
                            <Save className="w-4 h-4" />
                            <span>Salvar</span>
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">{usuario.nome.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{usuario.nome}</h4>
                              <p className="text-sm text-gray-600">{usuario.email}</p>
                            </div>
                          </div>
                          
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPerfilColor(usuario.perfil)}`}>
                            {getPerfilName(usuario.perfil)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">ID da Planilha:</p>
                            <p className="font-medium text-gray-900">{usuario.id_planilha || 'Não configurado'}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Criado em:</p>
                            <p className="font-medium text-gray-900">{new Date(usuario.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleEdit(usuario)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200 flex items-center space-x-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Editar</span>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(usuario.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 flex items-center space-x-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Apagar</span>
                          </button>
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
    </div>
  );
}