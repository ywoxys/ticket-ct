import React from 'react';
import { 
  Users, FileText, Home, CheckSquare, LogOut, Settings, 
  DollarSign, UserCheck, Cog, Phone, Link as LinkIcon, Plus,
  Wallet, User 
} from 'lucide-react';
import logo from '../../../download.png';

interface NavigationProps {
  currentView: 'dashboard' | 'ticket' | 'ligacao' | 'historico' | 'historico-ligacoes' | 'historico-links' | 'caixa' | 'solicitacoes' | 'distribuicao' | 'configuracoes' | 'perfil' | 'novo-link' | 'usuarios';
  onViewChange: (view: NavigationProps["currentView"]) => void;
  currentUser: any;
  onLogout: () => void;
}

export function Navigation({ currentView, onViewChange, currentUser, onLogout }: NavigationProps) {
  const getNavItems = () => {
    const baseItems = [
      { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
      { id: 'ticket' as const, label: 'Ticket', icon: FileText },
      { id: 'ligacao' as const, label: 'Ligação', icon: Phone },
      { id: 'historico' as const, label: 'Histórico Tickets', icon: FileText },
      { id: 'historico-ligacoes' as const, label: 'Histórico Ligações', icon: Phone },
    ];

    if (['whatsapp', 'supervisao'].includes(currentUser.perfil)) {
      baseItems.push(
        { id: 'historico-links' as const, label: 'Histórico Links', icon: LinkIcon },
        { id: 'novo-link' as const, label: 'Novo Link', icon: Plus },
        { id: 'caixa' as const, label: 'Caixa', icon: Wallet },
        { id: 'distribuicao' as const, label: 'Distribuição', icon: UserCheck },
        { id: 'solicitacoes' as const, label: 'Solicitações', icon: CheckSquare }
      );
    }

    if (currentUser.perfil === 'supervisao') {
      baseItems.push(
        { id: 'usuarios' as const, label: 'Usuários', icon: Users },
        { id: 'configuracoes' as const, label: 'Configurações', icon: Cog }
      );
    }

    baseItems.push(
      { id: 'perfil' as const, label: 'Perfil', icon: User }
    );

    return baseItems;
  };

  const navItems = getNavItems();

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

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 h-screen flex flex-col">
      {/* Header com logo e usuário */}
      <div className="flex items-center space-x-2 p-4 border-b border-gray-200">
        <img src={logo} alt="Logo" className="w-10 h-10" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">CorujoTicket</h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-600">{currentUser.nome}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(currentUser.perfil)}`}>
              {getPerfilName(currentUser.perfil)}
            </span>
          </div>
        </div>
      </div>

      {/* Menu lateral */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-left ${
                currentView === item.id
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Botão de logout embaixo */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-red-600 hover:text-red-800 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
