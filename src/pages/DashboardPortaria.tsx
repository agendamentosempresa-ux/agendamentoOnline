// DashboardPortaria.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';

const DashboardPortaria = () => {
  const { user, logout } = useAuth();
  const { getApprovedSchedulings, updateCheckInStatus } = useScheduling() as any;
  const navigate = useNavigate();

  // ESTADOS ADICIONADOS PARA A BUSCA
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPlate, setSearchPlate] = useState('');

  // Estados para re-renderização e modais
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentScheduling, setCurrentScheduling] = useState<any | null>(null);

  // Obter todos os agendamentos aprovados
  const approvedSchedulings = getApprovedSchedulings() as any[];
  const today = new Date().toLocaleDateString('pt-BR');

  // Funções Auxiliares (movidas para cima para uso no useMemo)
  const getSchedulingName = (scheduling: any): string => {
    if (scheduling.type === 'servicos-avulsos') {
      const baseName = scheduling.data?.nomeFuncionario || 'Solicitação de Serviço';
      const acompanhantes = scheduling.data?.acompanhantes;
      if (acompanhantes && Array.isArray(acompanhantes) && acompanhantes.length > 0) {
        return `${baseName} (+${acompanhantes.length} acomp.)`;
      }
      return baseName;
    } else if (scheduling.type === 'visitas') {
      const baseName = scheduling.data?.nomeCompleto || 'Solicitação de Visita';
      const acompanhantes = scheduling.data?.acompanhantes;
      if (acompanhantes && Array.isArray(acompanhantes) && acompanhantes.length > 0) {
        return `${baseName} (+${acompanhantes.length} acomp.)`;
      }
      return baseName;
    } else if (scheduling.type === 'entrega-liberacao') {
      return scheduling.data?.nomeMotorista || 'Solicitação de Entrega';
    } else if (scheduling.type === 'integracao') {
      const count = scheduling.data?.integrantes?.length || 0;
      return `📚 Integração: ${count} pessoa(s) - ${scheduling.data?.integrantes?.[0]?.empresa || scheduling.data?.empresa || 'Empresa não informada'}`;
    } else if (scheduling.type === 'acesso-antecipado') {
      return scheduling.data?.nomeCompleto || 'Solicitação de Acesso';
    }
    return 'Solicitação';
  };

  const getSchedulingCompany = (scheduling: any): string => {
    if (scheduling.type === 'integracao') {
      return scheduling.data?.empresa || scheduling.data?.integrantes?.[0]?.empresa || 'N/A';
    }
    return scheduling.data?.empresaPrestadora || scheduling.data?.empresaVisitante || scheduling.data?.empresa || 'N/A';
  };
  // Fim das Funções Auxiliares (para uso interno do filtro)


  // ✅ CORREÇÃO 1: Lógica otimizada e robusta para filtrar agendamentos
  const filteredSchedulings = useMemo(() => {
    // 1. Filtrar agendamentos de hoje
    const todaySchedulings = approvedSchedulings.filter((s: any) => {
      const schedulingDate = new Date(s.createdAt).toLocaleDateString('pt-BR');
      return schedulingDate === today;
    });

    // 2. Aplicar filtros de busca
    if (!searchTerm && !searchPlate) {
      return todaySchedulings;
    }

    const searchLower = searchTerm.toLowerCase();
    const plateLower = searchPlate.toLowerCase().replace(/[^a-z0-9]/g, '');

    return todaySchedulings.filter((s: any) => {
      const data = s.data || {};

      // Sanitizando todas as strings para evitar .toLowerCase() em null/undefined
      const veiculo = (data.placa || data.placaVeiculo || '').toLowerCase();
      const name = getSchedulingName(s).toLowerCase();
      const company = getSchedulingCompany(s).toLowerCase();
      const cpf = (data.cpf || '').toLowerCase();
      const nomeCompleto = (data.nomeCompleto || '').toLowerCase();

      // Busca por Placa
      const matchesPlate = !searchPlate || veiculo.includes(plateLower);

      // Busca Geral (Nome, CPF, Empresa)
      const matchesGeneral = !searchTerm ||
        name.includes(searchLower) ||
        company.includes(searchLower) ||
        cpf.includes(searchLower) ||
        nomeCompleto.includes(searchLower); // Incluindo nome completo na busca geral

      return matchesPlate && matchesGeneral;
    });

  }, [approvedSchedulings, searchTerm, searchPlate, today, refreshKey]);

  // CORRIGIDO: Função para manipular o check-in (Portaria)
  const handleCheckIn = async (id: string, status: 'autorizado' | 'negado' | 'nao-compareceu') => {
    if (updateCheckInStatus) {
      try {
        await updateCheckInStatus(id, status);

        const statusLabels = {
          'autorizado': 'Entrada autorizada',
          'negado': 'Acesso negado',
          'nao-compareceu': 'Marcado como não compareceu',
        };

        alert(`Status atualizado para agendamento ${id}: ${statusLabels[status]}.`);
        setRefreshKey(prevKey => prevKey + 1);

      } catch (error) {
        console.error("Erro ao atualizar status do check-in:", error);
        alert(`ERRO CRÍTICO: Falha ao registrar o status "${status}". Verifique o console para detalhes.`);
        setRefreshKey(prevKey => prevKey + 1);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Função para imprimir a lista de acessos
  const handlePrintList = () => {
    window.print();
  };

  // ✅ CORREÇÃO 2: Função handlePrint simplificada (o CSS fará o trabalho)
  const handlePrint = () => {
    window.print();
  };

  // Funções Auxiliares (as de baixo nível que não crachavam foram mantidas)
  const getSchedulingDocuments = (scheduling: any) => {
    if (scheduling.type === 'integracao') {
      const count = scheduling.data?.integrantes?.length || 0;
      return `Total de Integrantes: ${count}`;
    }
    const cpf = scheduling.data?.cpf || scheduling.data?.identidade || 'N/A';
    const telefone = scheduling.data?.telefone || 'N/A';
    return `CPF: ${cpf} | 📞 ${telefone}`;
  };

  const getSchedulingVehicleTime = (scheduling: any) => {
    if (scheduling.type === 'integracao') {
      return 'Detalhes do veículo no modal (se aplicável)';
    }
    const veiculo = scheduling.data?.marcaVeiculo || scheduling.data?.tipoVeiculo || 'N/A';
    const placa = scheduling.data?.placa || scheduling.data?.placaVeiculo || 'N/A';
    const hora = scheduling.data?.horaInicio || scheduling.data?.horario || scheduling.data?.previsaoChegada || scheduling.data?.horarioChegada || 'N/A';

    return `🚗 ${veiculo} - ${placa} | ⏰ ${hora}`;
  };

  const getSchedulingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'servicos-avulsos': '🔧 Serviço',
      'entrega-liberacao': '📦 Entrega',
      'visitas': '🤝 Visita',
      'integracao': '📚 Integração',
      'acesso-antecipado': '⏰ Acesso',
    };
    return labels[type] || type;
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'negado':
        return '🚫 ACESSO NEGADO';
      case 'nao-compareceu':
        return '❌ NÃO COMPARECEU';
      case 'aprovado':
      case 'autorizado':
      default:
        return '✅ ENTRADA AUTORIZADA';
    }
  };

  const showDetails = (scheduling: any) => {
    setCurrentScheduling(scheduling);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setCurrentScheduling(null);
  };
  // Fim das Funções Auxiliares

  return (
    <>
      {/* ⚠️ CORREÇÃO PRINCIPAL: CSS de impressão corrigido e simplificado */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            /* 1. Esconde todos os elementos da página */
            body * {
              visibility: hidden;
            }
            /* 2. Mostra apenas o container da lista e seu conteúdo */
            #access-list-print, #access-list-print * {
              visibility: visible;
            }
            /* 3. Posiciona a lista no topo da página impressa */
            #access-list-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            /* 4. Esconde os elementos de interface (cards e botões) dentro do container */
            #access-list-print .no-print, #access-list-print .divide-y {
              display: none !important;
            }
            /* 5. Garante que a tabela de impressão seja exibida */
            #access-list-print .print-table {
              display: table !important;
            }
            /* 6. Estilos básicos para a tabela impressa */
            #access-list-print table {
              width: 100%;
              border-collapse: collapse;
            }
            #access-list-print th, #access-list-print td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }
            #access-list-print th {
              background-color: #f2f2f2;
            }
          }
        `
      }} />

      <div className="min-h-screen bg-gray-50">
        {/* Header - CLASSE: no-print */}
        <div className="gradient-bg bg-gradient-to-br from-blue-800 to-blue-600 text-white py-6 no-print">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-center mb-2">🏢 Sistema de Agendamentos </h1>
            <p className="text-center text-blue-100">Gestão Completa de Acessos e Autorizações</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Cabeçalho de Navegação/Ações - CLASSE: no-print */}
          <div className="flex justify-between items-center mb-8 no-print">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                <span className="text-4xl mr-3">🛂</span>
                Controle de Portaria
              </h2>
              <p className="text-gray-600">Bem-vindo, <span className="font-semibold">{user?.name || 'Porteiro'}</span></p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePrintList}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                🖨️ Imprimir Lista
              </button>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Sair</button>
            </div>
          </div>

          {/* Busca Rápida - CLASSE: no-print */}
          <div className="bg-white rounded-lg shadow p-6 mb-6 no-print">
            <div className="grid md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="🔍 Buscar por nome, CPF ou empresa..."
                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <input
                type="text"
                placeholder="🚗 Buscar por placa..."
                className="px-3 py-2 border border-gray-300 rounded-lg"
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
              />
              <button
                onClick={() => { setSearchTerm(''); setSearchPlate(''); }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Acessos do Dia - Container de Impressão */}
          <div id="access-list-print" key={refreshKey} className="bg-white rounded-lg shadow">

            {/* Cabeçalho para impressão - visível na tela e na impressão */}
            <div className="p-6 border-b text-center">
              <h2 className="text-2xl font-bold">📋 Lista de Acessos Autorizados</h2>
              <p className="text-base text-gray-700">Data: {today} | Total de Agendamentos: {filteredSchedulings.length}</p>
              {(searchTerm || searchPlate) && (
                <p className="text-sm text-gray-500">Filtros Ativos: {searchTerm} {searchPlate}</p>
              )}
            </div>

            {/* Tabela de impressão - visível apenas na impressão */}
            {/* ✅ CORREÇÃO: Adicionada classe 'print-table' para seleção no CSS */}
            <div className="hidden print:block p-4 print-table">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Tipo</th>
                    <th className="border p-2 text-left">Nome</th>
                    <th className="border p-2 text-left">Empresa</th>
                    <th className="border p-2 text-left">Documento</th>
                    <th className="border p-2 text-left">Veículo</th>
                    <th className="border p-2 text-left">Hora</th>
                    <th className="border p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedulings.map((scheduling: any) => (
                    <tr key={scheduling.id}>
                      <td className="border p-2">{getSchedulingTypeLabel(scheduling.type)}</td>
                      <td className="border p-2">{getSchedulingName(scheduling)}</td>
                      <td className="border p-2">{getSchedulingCompany(scheduling)}</td>
                      <td className="border p-2">{getSchedulingDocuments(scheduling)}</td>
                      <td className="border p-2">{getSchedulingVehicleTime(scheduling)}</td>
                      <td className="border p-2">{scheduling.data?.horaInicio || scheduling.data?.horario || scheduling.data?.previsaoChegada || scheduling.data?.horarioChegada || 'N/A'}</td>
                      <td className="border p-2">{getStatusDisplay(scheduling.checkInStatus || 'aprovado')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-b no-print">
              <h3 className="text-xl font-bold text-gray-800">
                📅 Acessos Autorizados - Hoje ({today})
                <span className="ml-2 text-base text-gray-500 font-normal">
                  ({filteredSchedulings.length} agendamentos)
                </span>
              </h3>
            </div>
            {/* ✅ CORREÇÃO: Adicionada classe 'no-print' para esconder os cards na impressão */}
            <div className="divide-y no-print">
              {filteredSchedulings.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">Nenhum acesso autorizado ou encontrado com os filtros.</p>
                </div>
              ) : (
                filteredSchedulings.map((scheduling: any) => (
                  <div key={scheduling.id} className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium mr-2">
                            {getSchedulingTypeLabel(scheduling.type)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${scheduling.checkInStatus === 'negado' ? 'bg-red-100 text-red-800' : scheduling.checkInStatus === 'nao-compareceu' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                            {getStatusDisplay(scheduling.checkInStatus || 'aprovado')}
                          </span>
                        </div>
                        <h4 className="font-bold">{getSchedulingName(scheduling)}</h4>

                        {scheduling.type !== 'integracao' && (
                          <p className="text-gray-600">Empresa: {getSchedulingCompany(scheduling)}</p>
                        )}

                        <p className="text-gray-600 text-sm">
                          {getSchedulingDocuments(scheduling)}
                        </p>

                        <p className="text-gray-600 text-sm">
                          {getSchedulingVehicleTime(scheduling)}
                        </p>

                        {scheduling.data?.responsavelHSSE && (
                          <p className="text-yellow-600 text-sm font-medium">🛡️ Acompanhamento obrigatório do técnico de segurança</p>
                        )}
                      </div>
                      {/* Botões de Ação - CLASSE: no-print */}
                      <div className="flex flex-col space-y-2 no-print">
                        <button
                          onClick={() => showDetails(scheduling)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                          🔍 Detalhes
                        </button>
                        {(scheduling.status === 'aprovado' && !scheduling.checkInStatus) && (
                          <>
                            <button
                              onClick={() => handleCheckIn(scheduling.id, 'autorizado')}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                              ✅ Compareceu
                            </button>
                            <button
                              onClick={() => handleCheckIn(scheduling.id, 'nao-compareceu')}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                              🚫 Não compareceu
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal de Detalhes - CLASSE: no-print */}
        {showDetailsModal && currentScheduling && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">🔍 Detalhes do Agendamento</h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">

                {/* Tabela de Integrantes para Integração */}
                {currentScheduling.type === 'integracao' && currentScheduling.data?.integrantes?.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-800 mb-2">Pessoas para Integração ({currentScheduling.data.integrantes.length}):</h4>
                      <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Completo</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RG</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {currentScheduling.data.integrantes.map((integrant: any, index: number) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{integrant.nomeCompleto}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{integrant.empresa}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{integrant.rg}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{integrant.cpf}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm mt-4 p-4 bg-blue-50 rounded-lg">
                      <div><strong>Tipo:</strong> {getSchedulingTypeLabel(currentScheduling.type)}</div>
                      <div><strong>Status:</strong> {getStatusDisplay(currentScheduling.checkInStatus || currentScheduling.status)}</div>
                      <div><strong>Responsável:</strong> {currentScheduling.requestedByName}</div>
                      <div><strong>Data da Solicitação:</strong> {new Date(currentScheduling.createdAt).toLocaleDateString('pt-BR')}</div>
                      <div className="md:col-span-2"><strong>Observações:</strong> {currentScheduling.data?.observacoes || 'Nenhuma'}</div>
                    </div>
                  </>
                ) : (
                  // Conteúdo para outros tipos de agendamento
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm p-4 bg-white border rounded-lg">
                      <div><strong>Tipo:</strong> {getSchedulingTypeLabel(currentScheduling.type)}</div>
                      <div><strong>Status:</strong> {getStatusDisplay(currentScheduling.checkInStatus || currentScheduling.status)}</div>
                      <div><strong>Pessoa/Motorista:</strong> {getSchedulingName(currentScheduling)}</div>
                      <div><strong>Empresa:</strong> {getSchedulingCompany(currentScheduling)}</div>
                      <div><strong>CPF/RG:</strong> {currentScheduling.data?.cpf || currentScheduling.data?.identidade || 'N/A'}</div>
                      <div><strong>Telefone:</strong> {currentScheduling.data?.telefone || 'N/A'}</div>
                      <div><strong>Veículo:</strong> {currentScheduling.data?.marcaVeiculo || currentScheduling.data?.tipoVeiculo || 'N/A'} {currentScheduling.data?.placa || currentScheduling.data?.placaVeiculo || ''}</div>
                      <div><strong>Portaria:</strong> {currentScheduling.data?.portariaAcesso || 'N/A'}</div>
                      <div><strong>Data/Hora Prevista:</strong> {new Date(currentScheduling.createdAt).toLocaleDateString('pt-BR')} {currentScheduling.data?.horaInicio || currentScheduling.data?.horario || currentScheduling.data?.previsaoChegada || currentScheduling.data?.horarioChegada || 'N/A'}</div>
                      <div className="md:col-span-2"><strong>Motivo:</strong> {currentScheduling.data?.motivoServico || currentScheduling.data?.motivoVisita || currentScheduling.data?.motivoEntrega || currentScheduling.data?.motivoLiberacao || 'N/A'}</div>
                      {currentScheduling.data?.responsavelHSSE && (
                        <div className="md:col-span-2 text-yellow-600 font-medium">🛡️ Acompanhamento obrigatório do técnico de segurança</div>
                      )}
                    </div>
                    
                    {/* Exibir informações dos acompanhantes se existirem */}
                    {(currentScheduling.type === 'servicos-avulsos' || currentScheduling.type === 'visitas') && 
                      (currentScheduling.data as any)?.acompanhantes && 
                      Array.isArray((currentScheduling.data as any).acompanhantes) && 
                      (currentScheduling.data as any).acompanhantes.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Acompanhantes ({(currentScheduling.data as any).acompanhantes.length}):</h4>
                        <div className="space-y-3">
                          {(currentScheduling.data as any).acompanhantes.map((acompanhante: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                <div><strong>Nome:</strong> {acompanhante.nome || 'N/A'}</div>
                                <div><strong>CPF:</strong> {acompanhante.cpf || 'N/A'}</div>
                                <div><strong>RG:</strong> {acompanhante.rg || 'N/A'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg">Fechar</button>
                  {/* Botões de Ação dentro do Modal (Lógica Corrigida) */}
                  {(currentScheduling.status === 'aprovado' && !currentScheduling.checkInStatus) && (
                    <>
                      <button
                        onClick={() => { handleCheckIn(currentScheduling.id, 'autorizado'); handleCloseModal(); }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">✅ Marcar Compareceu</button>
                      <button
                        onClick={() => { handleCheckIn(currentScheduling.id, 'nao-compareceu'); handleCloseModal(); }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg">🚫 Marcar Não Compareceu</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer - CLASSE: no-print */}
        <footer className="bg-gray-800 text-white py-6 mt-12 no-print">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm">Design Visual e Site desenvolvido por <strong>Manuela Wendling</strong> | <strong>Full Arts Design</strong></p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default DashboardPortaria;