import React, { useState, useEffect } from 'react';
import { Sun, Moon, Coffee, Star } from 'lucide-react';
import { DashboardLigacao } from './DashboardLigacao.tsx';
import { DashboardWhatsapp } from './DashboardWhatsapp.tsx';
import { DashboardSupervisao } from './DashboardSupervisao.tsx';

interface DashboardProps {
  currentUser: any;
}

export function Dashboard({ currentUser }: DashboardProps) {
  const currentHour = new Date().getHours();

  const motivationalPhrases = [
    "Você é capaz de grandes coisas hoje!",
    "Cada passo conta para o sucesso!",
    "A persistência supera qualquer obstáculo!",
    "Transforme desafios em oportunidades!",
    "Mantenha o foco e a disciplina!",
    "Seu esforço faz a diferença!",
    "Continue crescendo e evoluindo!",
    "Um bom resultado começa com uma boa atitude!",
    "Você está construindo algo incrível!",
    "Hoje é um ótimo dia para alcançar seus objetivos!"
  ];

  const [currentPhrase, setCurrentPhrase] = useState<string>(motivationalPhrases[0]);

  useEffect(() => {
    const changePhrase = () => {
      const index = Math.floor(Math.random() * motivationalPhrases.length);
      setCurrentPhrase(motivationalPhrases[index]);
    };

    const interval = setInterval(changePhrase, 300000); // 5 minutos em ms
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    if (currentHour >= 5 && currentHour < 12) {
      return {
        text: 'Bom dia',
        icon: Sun,
        gradient: 'from-yellow-400 to-orange-500',
        bgGradient: 'from-yellow-50 to-orange-50'
      };
    } else if (currentHour >= 12 && currentHour < 18) {
      return {
        text: 'Boa tarde',
        icon: Coffee,
        gradient: 'from-orange-400 to-red-500',
        bgGradient: 'from-orange-50 to-red-50'
      };
    } else {
      return {
        text: 'Boa noite',
        icon: Moon,
        gradient: 'from-purple-400 to-indigo-500',
        bgGradient: 'from-purple-50 to-indigo-50'
      };
    }
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const getPerfilName = (perfil: string) => {
    switch (perfil) {
      case 'supervisao': return 'Supervisão';
      case 'whatsapp': return 'WhatsApp';
      case 'ligacao': return 'Ligação';
      default: return perfil;
    }
  };

  const renderDashboardContent = () => {
    switch (currentUser.perfil) {
      case 'ligacao':
        return <DashboardLigacao currentUser={currentUser} />;
      case 'whatsapp':
        return <DashboardWhatsapp currentUser={currentUser} />;
      case 'supervisao':
        return <DashboardSupervisao currentUser={currentUser} />;
      default:
        return <DashboardGeral />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className={`bg-gradient-to-br ${greeting.bgGradient} rounded-2xl shadow-xl border border-gray-100 overflow-hidden`}>
        <div className={`bg-gradient-to-r ${greeting.gradient} p-8`}>
          <div className="flex items-center justify-center space-x-4">
            <GreetingIcon className="w-16 h-16 text-white" />
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">
                {greeting.text}!
              </h1>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Star className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-semibold text-gray-800">
                {currentUser.nome} - {getPerfilName(currentUser.perfil)}
              </h2>
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            
            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
              {currentPhrase}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard específico por perfil */}
      {renderDashboardContent()}
    </div>
  );
}

function DashboardGeral() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Coffee className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-2">Produtividade</h3>
        <p className="text-gray-600 text-sm">
          Gerencie seus tickets de forma eficiente e organizada
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-2">Qualidade</h3>
        <p className="text-gray-600 text-sm">
          Mantenha a excelência no atendimento aos clientes
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sun className="w-6 h-6 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-2">Colaboração</h3>
        <p className="text-gray-600 text-sm">
          Trabalhe em equipe para alcançar os melhores resultados
        </p>
      </div>
    </div>
  );
}
