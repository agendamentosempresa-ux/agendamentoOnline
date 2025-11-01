import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useNavigate } from 'react-router-dom';

export default function PortariaPanel() {
  const { user, logout } = useAuth();
  const { getApprovedSchedulings, updateCheckInStatus } = useScheduling();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPlate, setSearchPlate] = useState('');

  if (user?.role !== 'portaria' && user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const approvedSchedulings = getApprovedSchedulings();

  const filteredSchedulings = approvedSchedulings.filter((scheduling) => {
    const searchLower = searchTerm.toLowerCase();
    const plateLower = searchPlate.toLowerCase();
    const data = scheduling.data as any;

    // Check if search term matches any of the criteria
    const matchesGeneral = !searchTerm ||
      scheduling.requestedByName.toLowerCase().includes(searchLower) ||
      (data.cpf && data.cpf.includes(searchTerm)) ||
      (data.nomeCompleto && data.nomeCompleto.toLowerCase().includes(searchLower)) ||
      (data.nomeFuncionario && data.nomeFuncionario.toLowerCase().includes(searchLower)) ||
      (data.empresa && data.empresa.toLowerCase().includes(searchLower)) ||
      (data.empresaPrestadora && data.empresaPrestadora.toLowerCase().includes(searchLower));

    // Check if plate matches
    const matchesPlate = !searchPlate ||
      (data.placaVeiculo && data.placaVeiculo.toLowerCase().includes(plateLower)) ||
      (data.placa && data.placa.toLowerCase().includes(plateLower));

    return matchesGeneral && matchesPlate;
  });

  const handleCheckIn = (id: string, status: 'autorizado' | 'negado' | 'nao-compareceu') => {
    updateCheckInStatus(id, status);
    const statusLabels = {
      'autorizado': 'Entrada autorizada',
      'negado': 'Acesso negado',
      'nao-compareceu': 'Marcado como não compareceu',
    };
    alert(statusLabels[status]);
  };

  const getSchedulingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'servicos-avulsos': '🔧 Serviços Avulsos',
      'entrega-liberacao': '📦 Entrega/Liberação',
      'visitas': '🤝 Visitas V3',
      'integracao': '🔗 Integração',
      'acesso-antecipado': '⏰ Acesso Antecipado',
    };
    return labels[type] || type;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-bg bg-gradient-to-br from-blue-800 to-blue-600 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2">🏢 Sistema de Agendamentos </h1>
          <p className="text-center text-blue-100">Gestão Completa de Acessos e Autorizações</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <span className="text-4xl mr-3">🛂</span>
              Controle de Portaria
            </h2>
            <p className="text-gray-600">Bem-vindo, <span className="font-semibold">{user?.name || 'Porteiro'}</span></p>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => navigate('/dashboard')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Voltar</button>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Sair</button>
          </div>
        </div>

        {/* Busca Rápida */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              id="search-general"
              placeholder="🔍 Buscar por nome, CPF ou empresa..."
              className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <input
              type="text"
              id="search-plate"
              placeholder="🚗 Buscar por placa..."
              className="px-3 py-2 border border-gray-300 rounded-lg"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
            />
            <button
              onClick={() => { }} // This function just updates the filtered results through state
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Acessos do Dia */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold text-gray-800">📅 Acessos Autorizados - Hoje ({new Date().toLocaleDateString('pt-BR')})</h3>
          </div>
          <div className="divide-y">
            {filteredSchedulings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Nenhum agendamento encontrado</p>
              </div>
            ) : (
              filteredSchedulings.map((scheduling) => {
                const data = scheduling.data as any;
                return (
                  <div key={scheduling.id} className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium mr-2">
                            {getSchedulingTypeLabel(scheduling.type)}
                          </span>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">⚠️ EMERGENCIAL</span>
                        </div>
                        <h4 className="font-bold">{data.nomeCompleto || data.nomeFuncionario || scheduling.requestedByName} - {data.empresa || data.empresaPrestadora || 'N/A'}</h4>
                        <p className="text-gray-600 text-sm">CPF: {data.cpf || 'N/A'} | 📞 {data.phone || data.telefone || 'N/A'}</p>
                        <p className="text-gray-600 text-sm">🚗 {data.marcaModeloVeiculo || 'Veículo'} - {data.placaVeiculo || data.placa || 'N/A'} | ⏰ {data.time || 'N/A'}</p>
                        {data.observacoes && (
                          <p className="text-yellow-600 text-sm font-medium">🛡️ {data.observacoes}</p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleCheckIn(scheduling.id, 'autorizado')}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">✅ Autorizar Entrada</button>
                        <button
                          onClick={() => handleCheckIn(scheduling.id, 'negado')}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">🚫 Negar Acesso</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">Design Visual e Site desenvolvido por <strong>Manuela Wendling</strong> | <strong>Full Arts Design</strong></p>
        </div>
      </footer>
    </div>
  );
}
