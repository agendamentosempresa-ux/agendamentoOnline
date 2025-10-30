import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useNavigate } from 'react-router-dom';

export default function ApprovalPanel() {
  const { user, logout } = useAuth();
  const { getPendingSchedulings, updateStatus } = useScheduling();
  const navigate = useNavigate();
  const [selectedScheduling, setSelectedScheduling] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentScheduling, setCurrentScheduling] = useState<any>(null);

  if (user?.role !== 'diretoria' && user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const pendingSchedulings = getPendingSchedulings();

  const handleApprove = (id: string) => {
    updateStatus(id, 'aprovado', comment);
    alert('Agendamento aprovado com sucesso!');
    setComment('');
    setSelectedScheduling(null);
    setShowDetailsModal(false);
  };

  const handleReject = (id: string) => {
    if (!comment.trim()) {
      alert('Adicione uma justificativa para a reprovação');
      return;
    }
    updateStatus(id, 'reprovado', comment);
    alert('Agendamento reprovado');
    setComment('');
    setSelectedScheduling(null);
    setShowDetailsModal(false);
  };

  const showDetails = (scheduling: any) => {
    setCurrentScheduling(scheduling);
    setShowDetailsModal(true);
  };

  const getSchedulingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'servicos-avulsos': '🔧 Serviços Avulsos',
      'entrega-liberacao': '📦 Entrega/Liberação',
      'visitas': '👥 Visitas (V3)',
      'integracao': '📚 Integração',
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
          <h1 className="text-3xl font-bold text-center mb-2">🏢 Sistema de Agendamentos PETRONAS</h1>
          <p className="text-center text-blue-100">Gestão Completa de Acessos e Autorizações</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <span className="text-4xl mr-3">👔</span>
              Dashboard Diretoria
            </h2>
            <p className="text-gray-600">Bem-vindo, <span className="font-semibold">{user?.name || 'Diretor'}</span></p>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => navigate('/dashboard')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Voltar</button>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Sair</button>
          </div>
        </div>

        {/* Indicadores */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{pendingSchedulings.length}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600">45</div>
            <div className="text-sm text-gray-600">Aprovados Hoje</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-red-600">3</div>
            <div className="text-sm text-gray-600">Reprovados</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">87%</div>
            <div className="text-sm text-gray-600">Taxa Aprovação</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <select className="px-3 py-2 border border-gray-300 rounded-lg">
              <option>Todos os Tipos</option>
              <option>Serviços Avulsos</option>
              <option>Visitas (V3)</option>
              <option>Entregas</option>
              <option>Integração</option>
              <option>Acesso Antecipado</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg">
              <option>Todas as Urgências</option>
              <option>Emergencial</option>
              <option>Alta</option>
              <option>Normal</option>
            </select>
            <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg" />
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">🔍 Filtrar</button>
          </div>
        </div>

        {/* Lista de Agendamentos Pendentes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold text-gray-800">🔔 Solicitações Pendentes de Aprovação</h3>
          </div>
          <div className="divide-y">
            {pendingSchedulings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Nenhuma solicitação pendente</p>
              </div>
            ) : (
              pendingSchedulings.map((scheduling) => (
                <div key={scheduling.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium mr-2">
                          {getSchedulingTypeLabel(scheduling.type)}
                        </span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">EMERGENCIAL</span>
                      </div>
                      <h4 className="font-bold text-lg">
                        {scheduling.type === 'servicos-avulsos' ? scheduling.data?.nomeFuncionario || 'Serviço Avulso' :
                         scheduling.type === 'visitas' ? scheduling.data?.nomeCompleto || 'Visita V3' :
                         scheduling.type === 'integracao' ? (scheduling.data?.integrantes?.length > 0 ? 
                           `Integração: ${scheduling.data.integrantes.length} pessoa(s)` : scheduling.data?.nomeCompleto || 'Integração') :
                         scheduling.type === 'acesso-antecipado' ? scheduling.data?.nomeCompleto || 'Acesso Antecipado' :
                         'Solicitação'}
                      </h4>
                      <p className="text-gray-600">Empresa: <strong>
                        {scheduling.type === 'servicos-avulsos' ? scheduling.data?.empresaPrestadora || 'N/A' :
                         scheduling.type === 'visitas' ? scheduling.data?.empresaVisitante || 'N/A' :
                         scheduling.type === 'integracao' ? (scheduling.data?.integrantes?.[0]?.empresa || scheduling.data?.empresa || 'N/A') :
                         scheduling.type === 'acesso-antecipado' ? scheduling.data?.empresa || 'N/A' :
                         'N/A'}
                      </strong> | Responsável: {scheduling.requestedByName}</p>
                      <p className="text-gray-600">📅 {new Date(scheduling.createdAt).toLocaleDateString('pt-BR')} 
                      {scheduling.type === 'servicos-avulsos' && ` | ⏰ ${scheduling.data?.horaInicio || 'N/A'} | 🚧 ${scheduling.data?.portariaAcesso || 'N/A'}`}
                      {scheduling.type === 'visitas' && ` | ⏰ ${scheduling.data?.previsaoChegada || 'N/A'} | 🚧 ${scheduling.data?.portariaAcesso || 'N/A'}`}
                      {scheduling.type === 'acesso-antecipado' && ` | ⏰ ${scheduling.data?.horarioChegada || 'N/A'} | 🚧 ${scheduling.data?.portariaAcesso || 'N/A'}`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => showDetails(scheduling)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">🔍 Detalhes</button>
                      <button 
                        onClick={() => handleApprove(scheduling.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">👍 Aprovar</button>
                      <button 
                        onClick={() => setSelectedScheduling(scheduling.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">👎 Reprovar</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && currentScheduling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">🔍 Detalhes da Solicitação</h3>
                <button 
                  onClick={() => setShowDetailsModal(false)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div><strong>Tipo:</strong> {getSchedulingTypeLabel(currentScheduling.type)}</div>
                <div><strong>Urgência:</strong> 
                {currentScheduling.type === 'servicos-avulsos' ? currentScheduling.data?.prioridade || 'Normal' :
                 currentScheduling.type === 'visitas' ? 'Normal' :
                 currentScheduling.type === 'integracao' ? 'Normal' :
                 currentScheduling.type === 'acesso-antecipado' ? 'Normal' : 'Normal'}
                </div>
                <div><strong>Empresa:</strong> 
                {currentScheduling.type === 'servicos-avulsos' ? currentScheduling.data?.empresaPrestadora || 'N/A' :
                 currentScheduling.type === 'visitas' ? currentScheduling.data?.empresaVisitante || 'N/A' :
                 currentScheduling.type === 'integracao' ? (currentScheduling.data?.integrantes?.[0]?.empresa || currentScheduling.data?.empresa || 'N/A') :
                 currentScheduling.type === 'acesso-antecipado' ? currentScheduling.data?.empresa || 'N/A' :
                 'N/A'}
                </div>
                <div><strong>Responsável:</strong> {currentScheduling.requestedByName}</div>
                <div><strong>CPF:</strong> 
                {currentScheduling.type === 'servicos-avulsos' ? currentScheduling.data?.cpf || 'N/A' :
                 currentScheduling.type === 'visitas' ? currentScheduling.data?.cpf || 'N/A' :
                 currentScheduling.type === 'integracao' ? (currentScheduling.data?.integrantes?.[0]?.cpf || currentScheduling.data?.cpf || 'N/A') :
                 currentScheduling.type === 'acesso-antecipado' ? currentScheduling.data?.cpf || 'N/A' :
                 'N/A'}
                </div>
                <div><strong>Telefone:</strong> 
                {currentScheduling.type === 'servicos-avulsos' ? currentScheduling.data?.telefone || 'N/A' :
                 currentScheduling.type === 'visitas' ? currentScheduling.data?.telefone || 'N/A' :
                 'N/A'}
                </div>
                <div><strong>Data/Hora:</strong> 
                {currentScheduling.type === 'servicos-avulsos' ? `${currentScheduling.data?.dataInicio || ''} ${currentScheduling.data?.horaInicio || ''}` :
                 currentScheduling.type === 'visitas' ? `${currentScheduling.data?.dataVisita || ''} ${currentScheduling.data?.previsaoChegada || ''}` :
                 currentScheduling.type === 'acesso-antecipado' ? `${currentScheduling.data?.dataLiberacao || ''} ${currentScheduling.data?.horarioChegada || ''}` :
                 new Date(currentScheduling.createdAt).toLocaleDateString('pt-BR')}
                </div>
                <div><strong>Portaria:</strong> 
                {currentScheduling.type === 'servicos-avulsos' ? currentScheduling.data?.portariaAcesso || 'N/A' :
                 currentScheduling.type === 'visitas' ? currentScheduling.data?.portariaAcesso || 'N/A' :
                 currentScheduling.type === 'acesso-antecipado' ? currentScheduling.data?.portariaAcesso || 'N/A' :
                 'N/A'}
                </div>
                <div className="md:col-span-2"><strong>Motivo:</strong> 
                {currentScheduling.type === 'servicos-avulsos' ? currentScheduling.data?.motivoServico || 'N/A' :
                 currentScheduling.type === 'visitas' ? currentScheduling.data?.motivoVisita || 'N/A' :
                 currentScheduling.type === 'integracao' ? currentScheduling.data?.motivo || 'N/A' :
                 currentScheduling.type === 'acesso-antecipado' ? currentScheduling.data?.motivoLiberacao || 'N/A' :
                 'N/A'}
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">💬 Justificativa da Decisão:</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                  rows={3}
                  placeholder="Digite sua justificativa..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => handleApprove(currentScheduling.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">👍 Aprovar</button>
                <button 
                  onClick={() => handleReject(currentScheduling.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg">👎 Reprovar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reprovação */}
      {selectedScheduling && !showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">💬 Adicionar Justificativa</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Justificativa:</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                  rows={3}
                  placeholder="Digite a justificativa para reprovação..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    const scheduling = pendingSchedulings.find(s => s.id === selectedScheduling);
                    if (scheduling) handleReject(scheduling.id);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg">Reprovar</button>
                <button 
                  onClick={() => {
                    setSelectedScheduling(null);
                    setComment('');
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">Design Visual e Site desenvolvido por <strong>Manuela Wendling</strong> | <strong>Full Arts Design</strong></p>
        </div>
      </footer>
    </div>
  );
}
