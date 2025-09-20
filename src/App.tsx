import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Navigation } from './components/ui/Navigation.tsx';
import { Dashboard } from './components/Dashboard/Dashboard.tsx';
import { TicketForm } from './components/Forms/TicketForm.tsx';
import { HistoricoTickets } from './components/Stories/HistoricoTickets.tsx';
import { LigacaoPanel } from './components/Forms/LigacaoPanel.tsx';
import { HistoricoLigacoes } from './components/Stories/HistoricoLigacoes.tsx';
import { HistoricoLinks } from './components/Stories/HistoricoLinks.tsx';
import { CaixaPanel } from './components/Forms/CaixaPanel.tsx';
import { SolicitacoesPanel } from './components/Forms/SolicitacoesPanel.tsx';
import { DistribuicaoClientesPanel } from './components/Forms/DistribuicaoClientesPanel.tsx';
import { ConfiguracoesPanel } from './components/Forms/ConfiguracoesPanel.tsx';
import { UserConfigPanel } from './components/UserConfigPanel';
import { LinkPanel } from './components/Forms/LinkPanel.tsx';
import { UserManagementPanel } from './components/Forms/UserManagementPanel.tsx';

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'ticket' | 'ligacao' | 'historico' | 'historico-ligacoes' | 'historico-links' | 'caixa' | 'solicitacoes' | 'distribuicao' | 'configuracoes' | 'perfil' | 'novo-link' | 'usuarios'>('dashboard');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleUserUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
  };

  const renderCurrentView = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} />;
      case 'ticket':
        return <TicketForm currentUser={currentUser} />;
      case 'ligacao':
        return <LigacaoPanel currentUser={currentUser} />;
      case 'historico':
        return <HistoricoTickets currentUser={currentUser} />;
      case 'historico-ligacoes':
        return <HistoricoLigacoes currentUser={currentUser} />;
      case 'historico-links':
        return ['whatsapp', 'supervisao'].includes(currentUser.perfil) ? <HistoricoLinks currentUser={currentUser} /> : <div>Acesso negado</div>;
      case 'novo-link':
        return ['whatsapp', 'supervisao'].includes(currentUser.perfil) ? <LinkPanel currentUser={currentUser} /> : <div>Acesso negado</div>;
      case 'caixa':
        return ['whatsapp', 'supervisao'].includes(currentUser.perfil) ? <CaixaPanel currentUser={currentUser} /> : <div>Acesso negado</div>;
      case 'distribuicao':
        return ['whatsapp', 'supervisao'].includes(currentUser.perfil) ? <DistribuicaoClientesPanel /> : <div>Acesso negado</div>;
      case 'usuarios':
        return currentUser.perfil === 'supervisao' ? <UserManagementPanel /> : <div>Acesso negado</div>;
      case 'configuracoes':
        return currentUser.perfil === 'supervisao' ? <ConfiguracoesPanel /> : <div>Acesso negado</div>;
      case 'solicitacoes':
        return ['whatsapp', 'supervisao'].includes(currentUser.perfil) ? <SolicitacoesPanel currentUser={currentUser} /> : <div>Acesso negado</div>;
      case 'perfil':
        return <UserConfigPanel currentUser={currentUser} onUserUpdate={handleUserUpdate} />;
      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Sidebar lateral */}
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 p-8 overflow-auto">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;