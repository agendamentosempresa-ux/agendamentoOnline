/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from '@/contexts/AuthContext';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { Scheduling, ServicosAvulsosData, EntregaLiberacaoData, VisitasData, AcessoAntecipadoData } from '@/types/scheduling';

const DashboardDiretor = () => {
  const { user, logout } = useAuth();
  const { schedulings, getPendingSchedulings, updateStatus, getSchedulingsByUser, getApprovedSchedulings, clearHistory } = useScheduling();
  const navigate = useNavigate();
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [urgenciaFiltro, setUrgenciaFiltro] = useState('todas');
  const [dataFiltro, setDataFiltro] = useState('');

  // Estado para modal de histórico
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTab, setHistoryTab] = useState<'aprovados' | 'reprovados' | 'compareceram' | 'nao-compareceram'>('aprovados');
  // filter flag to show only today's items when modal opened
  const [historyTodayOnly, setHistoryTodayOnly] = useState(false);

  // Obter os agendamentos pendentes do contexto e ordenar do mais recente para o mais antigo
  const pendingSchedulings = [...getPendingSchedulings()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // ref para seção pendentes
  const pendingRef = useRef<HTMLDivElement | null>(null);

  // --- NOVOS CÁLCULOS: Aprovados Hoje, Reprovados Totais, Taxa de Aprovação ---
  const todayStr = new Date().toLocaleDateString('pt-BR');
  const approvedToday = schedulings.filter(s => s.status === 'aprovado' && s.reviewedAt && new Date(s.reviewedAt).toLocaleDateString('pt-BR') === todayStr).length;
  const rejectedTotal = schedulings.filter(s => s.status === 'reprovado').length;
  const approvedTotal = schedulings.filter(s => s.status === 'aprovado').length;
  const reviewedTotal = approvedTotal + rejectedTotal;
  const approvalRate = reviewedTotal === 0 ? '0%' : `${Math.round((approvedTotal / reviewedTotal) * 100)}%`;

  // Estados para os modais
  const [selectedScheduling, setSelectedScheduling] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentScheduling, setCurrentScheduling] = useState<Scheduling | null>(null);
  const [isHistoryDetail, setIsHistoryDetail] = useState(false);

  // Função auxiliar para obter o nome do solicitante com base no tipo
  const getSchedulingName = (scheduling: Scheduling) => {
    if (scheduling.type === 'servicos-avulsos') {
      const baseName = (scheduling.data as any)?.nomeFuncionario || 'Solicitação';
      const acompanhantes = (scheduling.data as any)?.acompanhantes;
      if (acompanhantes && Array.isArray(acompanhantes) && acompanhantes.length > 0) {
        return `${baseName} (+${acompanhantes.length} acomp.)`;
      }
      return baseName;
    } else if (scheduling.type === 'visitas') {
      const baseName = (scheduling.data as any)?.nomeCompleto || 'Solicitação';
      const acompanhantes = (scheduling.data as any)?.acompanhantes;
      if (acompanhantes && Array.isArray(acompanhantes) && acompanhantes.length > 0) {
        return `${baseName} (+${acompanhantes.length} acomp.)`;
      }
      return baseName;
    } else if (scheduling.type === 'entrega-liberacao') {
      return (scheduling.data as any)?.nomeMotorista || 'Solicitação';
    } else if (scheduling.type === 'integracao') {
      // CORREÇÃO: Mostra o resumo da lista de integrantes
      const count = (scheduling.data as any)?.integrantes?.length;
      return count > 0 ? `Integração: ${count} pessoa(s)` : (scheduling.data as any)?.nomeCompleto || 'Solicitação de Integração';
    } else if (scheduling.type === 'acesso-antecipado') {
      return (scheduling.data as any)?.nomeCompleto || 'Solicitação';
    }
    return 'Solicitação';
  };

  // Função auxiliar para obter a empresa com base no tipo
  const getSchedulingCompany = (scheduling: Scheduling) => {
    if (scheduling.type === 'servicos-avulsos') {
      return (scheduling.data as any)?.empresaPrestadora || 'N/A';
    } else if (scheduling.type === 'visitas') {
      return (scheduling.data as any)?.empresaVisitante || 'N/A';
    } else if (scheduling.type === 'entrega-liberacao') {
      return (scheduling.data as any)?.empresa || 'N/A';
    } else if (scheduling.type === 'integracao') {
      // CORREÇÃO: Pega a empresa do primeiro integrante ou o campo principal
      return (scheduling.data as any)?.integrantes?.[0]?.empresa || (scheduling.data as any)?.empresa || 'N/A';
    } else if (scheduling.type === 'acesso-antecipado') {
      return (scheduling.data as any)?.empresa || 'N/A';
    }
    return 'N/A';
  };

  // Função auxiliar para obter a hora com base no tipo
  const getSchedulingTime = (scheduling: Scheduling) => {
    if (scheduling.type === 'servicos-avulsos') {
      return (scheduling.data as any)?.horaInicio || 'N/A';
    } else if (scheduling.type === 'visitas') {
      return (scheduling.data as any)?.previsaoChegada || 'N/A';
    } else if (scheduling.type === 'entrega-liberacao') {
      return (scheduling.data as any)?.horario || 'N/A';
    } else if (scheduling.type === 'integracao') {
      return 'N/A'; // Não tem horário definido para a integração da lista
    } else if (scheduling.type === 'acesso-antecipado') {
      return (scheduling.data as any)?.horarioChegada || 'N/A';
    }
    return 'N/A';
  };

  // Função auxiliar para obter a portaria com base no tipo
  const getSchedulingGate = (scheduling: Scheduling) => {
    if (scheduling.type === 'servicos-avulsos') {
      return (scheduling.data as any)?.portariaAcesso || 'N/A';
    } else if (scheduling.type === 'visitas') {
      return (scheduling.data as any)?.portariaAcesso || 'N/A';
    } else if (scheduling.type === 'entrega-liberacao') {
      return (scheduling.data as any)?.portariaAcesso || 'N/A';
    } else if (scheduling.type === 'integracao') {
      return 'N/A';
    } else if (scheduling.type === 'acesso-antecipado') {
      return (scheduling.data as any)?.portariaAcesso || 'N/A';
    }
    return 'N/A';
  };

  // Função auxiliar para obter o motivo com base no tipo
  const getSchedulingReason = (scheduling: Scheduling) => {
    if (scheduling.type === 'servicos-avulsos') {
      return (scheduling.data as any)?.motivoServico || 'N/A';
    } else if (scheduling.type === 'visitas') {
      return (scheduling.data as any)?.motivoVisita || 'N/A';
    } else if (scheduling.type === 'entrega-liberacao') {
      return (scheduling.data as any)?.motivoEntrega || 'N/A';
    } else if (scheduling.type === 'acesso-antecipado') {
      return (scheduling.data as any)?.motivoLiberacao || 'N/A';
    } else if (scheduling.type === 'integracao') {
      // CORREÇÃO: Adiciona o número de pessoas no motivo
      const count = (scheduling.data as any)?.integrantes?.length || 0;
      return `Integração de novos funcionários (${count} pessoa(s))`;
    }
    return 'N/A';
  };

  // Função auxiliar para verificar se uma solicitação é emergencial
  const isEmergencial = (scheduling: Scheduling) => {
    if (!scheduling.data) return false;

    if (scheduling.type === 'servicos-avulsos') {
      const data = scheduling.data as ServicosAvulsosData;
      return data.motivoServico?.toLowerCase().includes('emergencial') || false;
    } else if (scheduling.type === 'visitas') {
      const data = scheduling.data as VisitasData;
      return data.motivoVisita?.toLowerCase().includes('emergencial') || false;
    } else if (scheduling.type === 'entrega-liberacao') {
      const data = scheduling.data as EntregaLiberacaoData;
      return data.motivoEntrega?.toLowerCase().includes('emergencial') || false;
    } else if (scheduling.type === 'acesso-antecipado') {
      const data = scheduling.data as AcessoAntecipadoData;
      return data.motivoLiberacao?.toLowerCase().includes('emergencial') || false;
    }
    return false;
  };

  // Função para aplicar os filtros
  const agendamentosFiltrados = pendingSchedulings.filter(scheduling => {
    // Filtro por tipo
    const tipoMatch = tipoFiltro === 'todos' || scheduling.type.includes(tipoFiltro);

    // Filtro por urgência - Verifica campos específicos de acordo com o tipo
    const urgenciaMatch = urgenciaFiltro === 'todas' ||
      (urgenciaFiltro === 'emergencial' && isEmergencial(scheduling)) ||
      (urgenciaFiltro === 'alta') || // Padrão para alta se não tiver critério específico
      (urgenciaFiltro === 'normal');

    // Filtro por data
    const dataAgendamento = scheduling.createdAt ? new Date(scheduling.createdAt).toLocaleDateString('pt-BR') : '';
    const dataMatch = !dataFiltro || dataAgendamento === dataFiltro;

    return tipoMatch && urgenciaMatch && dataMatch;
  });

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

  const showDetails = (scheduling: Scheduling) => {
    setCurrentScheduling(scheduling);
    setShowDetailsModal(true);
    setIsHistoryDetail(false); // Not from history
    // Fechar o modal de histórico ao abrir o de detalhes
    setShowHistoryModal(false);
    // Garantir que o comentário seja resetado quando abrir o modal
    setComment('');
  };

  // Função para mostrar detalhes de uma solicitação do histórico
  const showHistoricalSchedulingDetails = (scheduling: Scheduling) => {
    setCurrentScheduling(scheduling);
    setShowDetailsModal(true);
    setIsHistoryDetail(true); // From history - no approve/reject buttons
    // Fechar o modal de histórico ao abrir o de detalhes
    setShowHistoryModal(false);
    // Garantir que o comentário seja resetado
    setComment('');
  };

  const getSchedulingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'servicos-avulsos': '🔧 Serviços Avulsos',
      'entrega_liberacao': '📦 Entrega/Liberação',
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

  // New simplified mapper: returns a flat row with consistent columns
  const mapSchedulingToRow = (s: Scheduling) => {
    const d = s.data;
    const createdAt = s.createdAt ? new Date(s.createdAt).toLocaleString('pt-BR') : '';
    const reviewedAt = s.reviewedAt ? new Date(s.reviewedAt).toLocaleString('pt-BR') : '';
    const checkInAt = s.checkInAt ? new Date(s.checkInAt).toLocaleString('pt-BR') : '';

    // Common fields
    const row: Record<string, string> = {
      'Data Solicitação': createdAt,
      'Tipo': s.type,
      'Status': s.status,
      'Nome': '',
      'Empresa': '',
      'Documento': '',
      'Telefone': '',
      'Data Prevista': '',
      'Hora Prevista': '',
      'Portaria': '',
      'Pessoa Visitada': '',
      'Veículo': '',
      'Solicitante': s.requestedByName || '',
      'Observações': s.observacoes || '',
      'Revisado Em': reviewedAt,
      'CheckIn Status': s.checkInStatus || '',
      'CheckIn Em': checkInAt,
      'Integrantes': ''
    };

    if (s.type === 'servicos-avulsos') {
      const data = d as typeof d & { nomeFuncionario?: string; cpf?: string; telefone?: string; empresaPrestadora?: string; dataInicio?: string; horaInicio?: string; portariaAcesso?: string };
      row['Nome'] = data.nomeFuncionario || '';
      row['Documento'] = data.cpf || '';
      row['Telefone'] = data.telefone || '';
      row['Empresa'] = data.empresaPrestadora || '';
      row['Data Prevista'] = data.dataInicio || '';
      row['Hora Prevista'] = data.horaInicio || '';
      row['Portaria'] = data.portariaAcesso || '';
    } else if (s.type === 'visitas') {
      const data = d as typeof d & { nomeCompleto?: string; cpf?: string; telefone?: string; empresaVisitante?: string; pessoaVisitada?: string; dataVisita?: string; previsaoChegada?: string; portariaAcesso?: string; marcaVeiculo?: string; modeloVeiculo?: string; placa?: string };
      row['Nome'] = data.nomeCompleto || '';
      row['Documento'] = data.cpf || '';
      row['Telefone'] = data.telefone || '';
      row['Empresa'] = data.empresaVisitante || '';
      row['Pessoa Visitada'] = data.pessoaVisitada || '';
      row['Data Prevista'] = data.dataVisita || '';
      row['Hora Prevista'] = data.previsaoChegada || '';
      row['Portaria'] = data.portariaAcesso || '';
      row['Veículo'] = [data.marcaVeiculo, data.modeloVeiculo, data.placa].filter(Boolean).join(' - ');
    } else if (s.type === 'entrega-liberacao') {
      const data = d as typeof d & { nomeMotorista?: string; cpf?: string; identidade?: string; empresa?: string; dia?: string; horario?: string; portariaAcesso?: string; tipoVeiculo?: string; placa?: string };
      row['Nome'] = data.nomeMotorista || '';
      row['Documento'] = data.cpf || data.identidade || '';
      row['Empresa'] = data.empresa || '';
      row['Data Prevista'] = data.dia || '';
      row['Hora Prevista'] = data.horario || '';
      row['Portaria'] = data.portariaAcesso || '';
      row['Veículo'] = [data.tipoVeiculo, data.placa].filter(Boolean).join(' - ');
    } else if (s.type === 'integracao') {
      const data = d as typeof d & { integrantes?: Array<{ nomeCompleto: string; cpf?: string; rg?: string; empresa?: string }>; nomeCompleto?: string; cpf?: string; empresa?: string };
      if (Array.isArray(data.integrantes) && data.integrantes.length) {
        row['Integrantes'] = data.integrantes.map((it) => `${it.nomeCompleto} (${it.cpf || it.rg || 'N/D'})`).join('; ');
        row['Empresa'] = data.integrantes[0]?.empresa || data.empresa || '';
        row['Nome'] = data.integrantes[0]?.nomeCompleto || data.nomeCompleto || '';
      } else {
        row['Nome'] = data.nomeCompleto || '';
        row['Documento'] = data.cpf || '';
        row['Empresa'] = data.empresa || '';
      }
    } else if (s.type === 'acesso-antecipado') {
      const data = d as typeof d & { nomeCompleto?: string; cpf?: string; empresa?: string; dataLiberacao?: string; horarioChegada?: string; portariaAcesso?: string };
      row['Nome'] = data.nomeCompleto || '';
      row['Documento'] = data.cpf || '';
      row['Empresa'] = data.empresa || '';
      row['Data Prevista'] = data.dataLiberacao || '';
      row['Hora Prevista'] = data.horarioChegada || '';
      row['Portaria'] = data.portariaAcesso || '';
    }

    return row;
  };

  const handleExportXLSX = () => {
    try {
      if (!schedulings || schedulings.length === 0) {
        alert('Nenhum registro para exportar');
        return;
      }

      const rows = schedulings.map(mapSchedulingToRow);

      const headers = Object.keys(rows[0] || {});
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico');

      const fileName = `historico_agendamentos_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      alert('Exportação concluída: ' + fileName);
    } catch (err) {
      console.error('Erro exportando XLSX:', err);
      alert('Falha ao exportar. Veja o console para detalhes.');
    }
  };

  // Derived lists for history tabs (ordered from newest to oldest)
  const approvedList = schedulings
    .filter(s => s.status === 'aprovado')
    .sort((a, b) => new Date(b.reviewedAt || b.createdAt).getTime() - new Date(a.reviewedAt || a.createdAt).getTime());
  const rejectedList = schedulings
    .filter(s => s.status === 'reprovado')
    .sort((a, b) => new Date(b.reviewedAt || b.createdAt).getTime() - new Date(a.reviewedAt || a.createdAt).getTime());
  const attendedList = schedulings
    .filter(s => (s as any).checkInStatus === 'autorizado')
    .sort((a, b) => new Date((b as any).checkInAt || b.createdAt).getTime() - new Date((a as any).checkInAt || a.createdAt).getTime());
  const notAttendedList = schedulings
    .filter(s => (s as any).checkInStatus === 'nao-compareceu')
    .sort((a, b) => new Date((b as any).checkInAt || b.createdAt).getTime() - new Date((a as any).checkInAt || a.createdAt).getTime());

  // Modal lists (apply 'today only' filter when requested)
  const modalApprovedList = historyTodayOnly
    ? approvedList.filter(s => s.reviewedAt && new Date(s.reviewedAt).toLocaleDateString('pt-BR') === todayStr)
    : approvedList;
  const modalRejectedList = historyTodayOnly
    ? rejectedList.filter(s => s.reviewedAt && new Date(s.reviewedAt).toLocaleDateString('pt-BR') === todayStr)
    : rejectedList;
  const modalAttendedList = historyTodayOnly
    ? attendedList.filter(s => (s as any).checkInAt && new Date((s as any).checkInAt).toLocaleDateString('pt-BR') === todayStr)
    : attendedList;
  const modalNotAttendedList = historyTodayOnly
    ? notAttendedList.filter(s => (s as any).checkInAt && new Date((s as any).checkInAt).toLocaleDateString('pt-BR') === todayStr)
    : notAttendedList;

  // helper to close history modal and reset 'today only' flag
  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setHistoryTodayOnly(false);
  };

  // Indicator click handlers
  const handleClickPendentes = () => {
    if (pendingRef.current) pendingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClickAprovadosHoje = () => {
    setHistoryTab('aprovados');
    setHistoryTodayOnly(true);
    setShowHistoryModal(true);
  };

  const handleClickReprovados = () => {
    setHistoryTab('reprovados');
    setHistoryTodayOnly(false);
    setShowHistoryModal(true);
  };

  const handleClickTaxa = () => {
    setHistoryTab('aprovados');
    setHistoryTodayOnly(false);
    setShowHistoryModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <div className="gradient-bg bg-gradient-to-br from-blue-800 to-blue-600 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1
            className="text-4xl font-bold text-center mb-2 text-white relative animate-glow"
          >
            🏢 Sistema de Agendamentos
          </h1>

          <style>
            {`
@keyframes glow {
  0%, 100% { text-shadow: 0 0 8px #00ffcc, 0 0 16px #00ffcc; }
  50% { text-shadow: 0 0 2px #00ffcc, 0 0 6px #00ffcc; }
}
.animate-glow {
  animation: glow 2.5s ease-in-out infinite;
}
`}
          </style>

          <p className="text-center text-blue-100 font-bold">Gestão Completa de Acessos e Autorizações</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="flex items-center justify-start text-3xl font-bold text-gray-800">
              <div className="title-glow-static">
                <div className="title-glow-inner border border-gray-700">
                  Painel de Diretores
                </div>
              </div>
            </h2>



            <p className="text-gray-700 font-bold">Bem-vindo Diretor(a), <span className="font-semibold">{user?.name || 'Diretor'}</span></p>
          </div>
          <div className="flex space-x-3">
            <button onClick={handleExportXLSX} className="btn-export">
              <div className="docs">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="svgIcon"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Exportar
              </div>
              <div className="download">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="svgIcon"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
            </button>

            <button onClick={() => setShowHistoryModal(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg">Histórico</button>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Sair</button>
          </div>
        </div>

        {/* Indicadores */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div onClick={handleClickPendentes} className="bg-white border-2 border-gray-400 rounded-lg shadow p-6 text-center cursor-pointer">
            <div className="text-3xl font-bold text-yellow-600">{pendingSchedulings.length}</div>
            <div className="text-sm text-gray-800">Pendentes</div>
          </div>
          <div onClick={handleClickAprovadosHoje} className="bg-white border-2 border-gray-400 rounded-lg shadow p-6 text-center cursor-pointer">
            <div className="text-3xl font-bold text-green-600">{approvedToday}</div>
            <div className="text-sm text-gray-800">Aprovados Hoje</div>
          </div>
          <div onClick={handleClickReprovados} className="bg-white border-2 border-gray-400 rounded-lg shadow p-6 text-center cursor-pointer">
            <div className="text-3xl font-bold text-red-600">{rejectedTotal}</div>
            <div className="text-sm text-gray-800">Reprovados</div>
          </div>
          <div onClick={handleClickTaxa} className="bg-white border-2 border-gray-400 rounded-lg shadow p-6 text-center cursor-pointer">
            <div className="text-3xl font-bold text-blue-600">{approvalRate}</div>
            <div className="text-sm text-gray-800">Taxa Aprovação</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border-2 border-gray-400 rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
            >
              <option value="todos">Todos os Tipos</option>
              <option value="servicos-avulsos">Serviços Avulsos</option>
              <option value="visitas">Visitas (V3)</option>
              <option value="entregas">Entregas</option>
              <option value="integracao">Integração</option>
              <option value="acesso-antecipado">Acesso Antecipado</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg"
              value={urgenciaFiltro}
              onChange={(e) => setUrgenciaFiltro(e.target.value)}
            >
              <option value="todas">Todas as Urgências</option>
              <option value="emergencial">Emergencial</option>
              <option value="alta">Alta</option>
              <option value="normal">Normal</option>
            </select>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
            />
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              onClick={() => { }}
            >
              🔍 Filtrar
            </button>
          </div>
        </div>

        {/* Lista de Agendamentos Pendentes */}
        <div className="bg-white border-2 border-gray-400 rounded-lg shadow" ref={pendingRef}>
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">🔔 Solicitações Pendentes de Aprovação</h3>
          </div>
          <div className="divide-y-2">
            {pendingSchedulings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Nenhuma solicitação pendente</p>
              </div>
            ) : (
              agendamentosFiltrados.map((scheduling) => (
                <div key={scheduling.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 cursor-pointer" onClick={() => showDetails(scheduling)}>
                      <div className="flex items-center mb-2">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium mr-2">
                          {getSchedulingTypeLabel(scheduling.type)}
                        </span>
                        {isEmergencial(scheduling) && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">EMERGENCIAL</span>
                        )}
                      </div>
                      <h4 className="font-bold text-lg">{getSchedulingName(scheduling)}</h4>
                      <p className="text-gray-600">Empresa: <strong>{getSchedulingCompany(scheduling)}</strong> | Responsável: {scheduling.requestedByName}</p>
                      <p className="text-gray-600">📅 {new Date(scheduling.createdAt).toLocaleDateString('pt-BR')} | ⏰ {getSchedulingTime(scheduling)} | 🚧 {getSchedulingGate(scheduling)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showDetails(scheduling);
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium border-2 border-blue-900 transition-colors hover:bg-blue-600 hover:border-blue-700"
                        >
                          🔍 Detalhes
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(scheduling.id);
                          }}
                          className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium border-2 border-green-900 transition-colors hover:bg-green-600 hover:border-green-700"
                        >
                          👍 Aprovar
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScheduling(scheduling.id);
                          }}
                          className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium border-2 border-red-900 transition-colors hover:bg-red-600 hover:border-red-700"
                        >
                          👎 Reprovar
                        </button>
                      </div>

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white border border-gray-700 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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

              {/* CORREÇÃO: Renderiza a tabela de integrantes se for Integração */}
              {currentScheduling.type === 'integracao' && 'integrantes' in currentScheduling.data && Array.isArray(currentScheduling.data.integrantes) && currentScheduling.data.integrantes.length > 0 ? (
                <>
                  <div className="mb-4 ">
                    <h4 className="text-lg font-bold text-gray-800 mb-2">Pessoas para Integração ({currentScheduling.data.integrantes.length}):</h4>
                    <div className="border border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3  py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Nome</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Empresa</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">RG</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">CPF</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentScheduling.data.integrantes.map((integrant, index: number) => (
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
                  {/* Detalhes específicos de Integração */}
                  <div className="grid border border-gray-700 rounded-sm md:grid-cols-2 gap-4 text-sm">
                    <div><strong>Tipo:</strong> {getSchedulingTypeLabel(currentScheduling.type)}</div>
                    <div><strong>Urgência:</strong> {isEmergencial(currentScheduling) ? 'Emergencial' : 'Normal'}</div>
                    <div><strong>Responsável:</strong> {currentScheduling.requestedByName}</div>
                    <div><strong>Data:</strong> {new Date(currentScheduling.createdAt).toLocaleDateString('pt-BR')}</div>
                    <div className="md:col-span-2"><strong>Motivo:</strong> {getSchedulingReason(currentScheduling)}</div>
                  </div>
                </>
              ) : (
                // Expanded per-type detailed rendering for other types
                <div className="text-sm space-y-4">
                  {currentScheduling.type === 'servicos-avulsos' && (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><strong>Nome:</strong> {(currentScheduling.data as any)?.nomeFuncionario || 'N/A'}</div>
                        <div><strong>Empresa Prestadora:</strong> {(currentScheduling.data as any)?.empresaPrestadora || 'N/A'}</div>
                        <div><strong>CPF:</strong> {(currentScheduling.data as any)?.cpf || 'N/A'}</div>
                        <div><strong>Telefone:</strong> {(currentScheduling.data as any)?.telefone || 'N/A'}</div>
                        <div><strong>Responsável HSSE:</strong> {(currentScheduling.data as any)?.responsavelHSSE || 'N/A'}</div>
                        <div><strong>Responsável Serviço:</strong> {(currentScheduling.data as any)?.responsavelServico || 'N/A'}</div>
                        <div><strong>Número APR:</strong> {(currentScheduling.data as any)?.numeroAPR || 'N/A'}</div>
                        <div><strong>Possui Veículo:</strong> {(currentScheduling.data as any)?.possuiVeiculo ? 'Sim' : 'Não'}</div>
                        {(currentScheduling.data as any)?.possuiVeiculo && (
                          <>
                            <div><strong>Marca Veículo:</strong> {(currentScheduling.data as any)?.marcaVeiculo || 'N/A'}</div>
                            <div><strong>Modelo Veículo:</strong> {(currentScheduling.data as any)?.modeloVeiculo || 'N/A'}</div>
                            <div><strong>Placa:</strong> {(currentScheduling.data as any)?.placa || (currentScheduling.data as any)?.placaVeiculo || 'N/A'}</div>
                          </>
                        )}
                        <div><strong>Data Início:</strong> {(currentScheduling.data as any)?.dataInicio || 'N/A'}</div>
                        <div><strong>Hora Início:</strong> {(currentScheduling.data as any)?.horaInicio || 'N/A'}</div>
                        <div><strong>Data Término:</strong> {(currentScheduling.data as any)?.dataTermino || 'N/A'}</div>
                        <div><strong>Hora Término:</strong> {(currentScheduling.data as any)?.horaTermino || 'N/A'}</div>
                        <div><strong>Prioridade:</strong> {(currentScheduling.data as any)?.prioridade || 'N/A'}</div>
                        <div className="md:col-span-2"><strong>Motivo do Serviço:</strong> {(currentScheduling.data as any)?.motivoServico || 'N/A'}</div>
                        <div><strong>Acesso Refeitório:</strong> {(currentScheduling.data as any)?.liberacaoRefeitorio ? 'Sim' : 'Não'}</div>
                        <div><strong>Acompanhamento Técnico:</strong> {(currentScheduling.data as any)?.acompanhamentoTecnico ? 'Sim' : 'Não'}</div>
                        <div><strong>Transporte Equipamentos:</strong> {(currentScheduling.data as any)?.transporteEquipamentos ? 'Sim' : 'Não'}</div>
                        <div><strong>Portaria:</strong> {(currentScheduling.data as any)?.portariaAcesso || 'N/A'}</div>
                      </div>

                      {/* Exibir informações dos acompanhantes se existirem */}
                      {(currentScheduling.data as any)?.acompanhantes &&
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

                  {currentScheduling.type === 'visitas' && (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><strong>Nome:</strong> {(currentScheduling.data as any)?.nomeCompleto || 'N/A'}</div>
                        <div><strong>Empresa:</strong> {(currentScheduling.data as any)?.empresaVisitante || 'N/A'}</div>
                        <div><strong>CPF:</strong> {(currentScheduling.data as any)?.cpf || 'N/A'}</div>
                        <div><strong>Telefone:</strong> {(currentScheduling.data as any)?.telefone || 'N/A'}</div>
                        <div><strong>Pessoa Visitada:</strong> {(currentScheduling.data as any)?.pessoaVisitada || 'N/A'}</div>
                        <div><strong>Data Visita:</strong> {(currentScheduling.data as any)?.dataVisita || 'N/A'}</div>
                        <div><strong>Previsão Chegada:</strong> {(currentScheduling.data as any)?.previsaoChegada || 'N/A'}</div>
                        <div><strong>Previsão Saída:</strong> {(currentScheduling.data as any)?.previsaoSaida || 'N/A'}</div>
                        <div><strong>Liberação Refeitório:</strong> {(currentScheduling.data as any)?.liberacaoRefeitorio ? 'Sim' : 'Não'}</div>
                        <div><strong>Veículo:</strong> {[(currentScheduling.data as any)?.marcaVeiculo, (currentScheduling.data as any)?.modeloVeiculo, (currentScheduling.data as any)?.placa].filter(Boolean).join(' - ') || 'N/A'}</div>
                        <div><strong>Portaria:</strong> {(currentScheduling.data as any)?.portariaAcesso || 'N/A'}</div>
                        <div className="md:col-span-2"><strong>Motivo:</strong> {(currentScheduling.data as any)?.motivoVisita || 'N/A'}</div>
                        <div className="md:col-span-2"><strong>Considerado Como Visita:</strong> {(currentScheduling.data as any)?.consideradoComoVisita || 'N/A'}</div>
                      </div>

                      {/* Exibir informações dos acompanhantes se existirem */}
                      {(currentScheduling.data as any)?.acompanhantes &&
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

                  {currentScheduling.type === 'entrega-liberacao' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><strong>Motorista:</strong> {(currentScheduling.data as any)?.nomeMotorista || 'N/A'}</div>
                      <div><strong>Empresa:</strong> {(currentScheduling.data as any)?.empresa || 'N/A'}</div>
                      <div><strong>Identidade/CPF:</strong> {(currentScheduling.data as any)?.identidade || (currentScheduling.data as any)?.cpf || 'N/A'}</div>
                      <div><strong>Tipo Veículo:</strong> {(currentScheduling.data as any)?.tipoVeiculo || 'N/A'}</div>
                      <div><strong>Placa:</strong> {(currentScheduling.data as any)?.placa || 'N/A'}</div>
                      <div><strong>Data:</strong> {(currentScheduling.data as any)?.dia || 'N/A'}</div>
                      <div><strong>Horário:</strong> {(currentScheduling.data as any)?.horario || 'N/A'}</div>
                      <div className="md:col-span-2"><strong>Motivo Entrega:</strong> {(currentScheduling.data as any)?.motivoEntrega || 'N/A'}</div>
                      <div><strong>Portaria:</strong> {(currentScheduling.data as any)?.portariaAcesso || 'N/A'}</div>
                    </div>
                  )}

                  {currentScheduling.type === 'acesso-antecipado' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><strong>Nome:</strong> {(currentScheduling.data as any)?.nomeCompleto || 'N/A'}</div>
                      <div><strong>Empresa:</strong> {(currentScheduling.data as any)?.empresa || 'N/A'}</div>
                      <div><strong>CPF:</strong> {(currentScheduling.data as any)?.cpf || 'N/A'}</div>
                      <div><strong>Atividade Fim de Semana:</strong> {(currentScheduling.data as any)?.atividadeFimDeSemana ? 'Sim' : 'Não'}</div>
                      <div><strong>Responsável Acompanhamento:</strong> {(currentScheduling.data as any)?.responsavelAcompanhamento || 'N/A'}</div>
                      <div><strong>Técnico Segurança Participa:</strong> {(currentScheduling.data as any)?.tecnicoSegurancaParticipa ? 'Sim' : 'Não'}</div>
                      <div><strong>Liberacao Fora Turno:</strong> {(currentScheduling.data as any)?.liberacaoForaTurno ? 'Sim' : 'Não'}</div>
                      {(currentScheduling.data as any)?.liberacaoForaTurno && (<div><strong>Motivo Fora Turno:</strong> {(currentScheduling.data as any)?.motivoForaTurno || 'N/A'}</div>)}
                      <div><strong>Data Liberação:</strong> {(currentScheduling.data as any)?.dataLiberacao || 'N/A'}</div>
                      <div><strong>Horário Chegada:</strong> {(currentScheduling.data as any)?.horarioChegada || 'N/A'}</div>
                      <div><strong>Horário Saída:</strong> {(currentScheduling.data as any)?.horarioSaida || 'N/A'}</div>
                      <div><strong>Portaria:</strong> {(currentScheduling.data as any)?.portariaAcesso || 'N/A'}</div>
                      <div className="md:col-span-2"><strong>Motivo da Liberação:</strong> {(currentScheduling.data as any)?.motivoLiberacao || 'N/A'}</div>
                      <div><strong>Acesso Veículo Planta:</strong> {(currentScheduling.data as any)?.acessoVeiculoPlanta ? 'Sim' : 'Não'}</div>
                      {(currentScheduling.data as any)?.acessoVeiculoPlanta && (<div><strong>Motivo Acesso Veículo:</strong> {(currentScheduling.data as any)?.motivoAcessoVeiculo || 'N/A'}</div>)}
                      <div><strong>Veículo:</strong> {[(currentScheduling.data as any)?.marcaVeiculo, (currentScheduling.data as any)?.modeloVeiculo, (currentScheduling.data as any)?.placa].filter(Boolean).join(' - ') || 'N/A'}</div>
                    </div>
                  )}

                  {/* Generic footer details common to all */}
                  <div className="pt-4 border-t">
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div><strong>Tipo:</strong> {getSchedulingTypeLabel(currentScheduling.type)}</div>
                      <div><strong>Urgência:</strong> {isEmergencial(currentScheduling) ? 'Emergencial' : 'Normal'}</div>
                      <div><strong>Solicitante:</strong> {currentScheduling.requestedByName}</div>
                      <div><strong>Solicitado em:</strong> {new Date(currentScheduling.createdAt).toLocaleString('pt-BR')}</div>
                      <div className="md:col-span-2"><strong>Observações:</strong> {currentScheduling.observacoes || 'Nenhuma'}</div>
                    </div>
                  </div>
                </div>
              )}

              {!isHistoryDetail && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-black-700 mb-2">Justificativa da Decisão:</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg"
                    rows={3}
                    placeholder="Digite sua justificativa..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                </div>
              )}
              {!isHistoryDetail && (
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => handleApprove(currentScheduling.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">👍 Aprovar</button>
                  <button
                    onClick={() => handleReject(currentScheduling.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg">👎 Reprovar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reprovação */}
      {selectedScheduling && !showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-55">
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

      {/* Histórico Modal com abas */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 my-10 max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">📚 Histórico de Solicitações</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={async () => {
                    if (
                      window.confirm(
                        'Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.'
                      )
                    ) {
                      await clearHistory();
                      closeHistoryModal();
                    }
                  }}
                  className="btn-delete"
                >
                  <svg viewBox="0 0 448 512" className="svgIcon">
                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                  </svg>
                </button>

                <div className="text-sm text-gray-900 text-base font-bold">Total: {schedulings.length}</div>
                <button onClick={closeHistoryModal} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex space-x-2 mb-4">
                <button onClick={() => setHistoryTab('aprovados')} className={`px-4 py-2 rounded ${historyTab === 'aprovados' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Aprovados ({approvedList.length})</button>
                <button onClick={() => setHistoryTab('reprovados')} className={`px-4 py-2 rounded ${historyTab === 'reprovados' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Reprovados ({rejectedList.length})</button>
                <button onClick={() => setHistoryTab('compareceram')} className={`px-4 py-2 rounded ${historyTab === 'compareceram' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Compareceram ({attendedList.length})</button>
                <button onClick={() => setHistoryTab('nao-compareceram')} className={`px-4 py-2 rounded ${historyTab === 'nao-compareceram' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Não Compareceram ({notAttendedList.length})</button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                {/* Renderizar lista conforme aba */}
                {historyTab === 'aprovados' && (
                  <div>
                    {approvedList.length === 0 ? <p className="text-gray-600">Nenhum agendamento aprovado.</p> : (
                      modalApprovedList.map(s => (
                        <div
                          key={s.id}
                          className="p-3 bg-white rounded mb-2 border cursor-pointer hover:bg-gray-50"
                          onClick={() => showHistoricalSchedulingDetails(s)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="text-sm text-gray-500">{getSchedulingTypeLabel(s.type)}
                                {(s.data as any)?.acompanhantes && (s.data as any).acompanhantes.length > 0
                                  ? ` (+${(s.data as any).acompanhantes.length} acomp.)` : ''}
                              </div>
                              <div className="font-semibold">{getSchedulingName(s)}</div>
                              <div className="text-xs text-gray-600">Empresa: {getSchedulingCompany(s)} | Solicitante: {s.requestedByName}</div>
                            </div>
                            <div className="text-right text-sm text-gray-500">{new Date(s.createdAt).toLocaleString('pt-BR')}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {historyTab === 'reprovados' && (
                  <div>
                    {rejectedList.length === 0 ? <p className="text-gray-600">Nenhum agendamento reprovado.</p> : (
                      modalRejectedList.map(s => (
                        <div
                          key={s.id}
                          className="p-3 bg-white rounded mb-2 border cursor-pointer hover:bg-gray-50"
                          onClick={() => showHistoricalSchedulingDetails(s)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="text-sm text-gray-500">{getSchedulingTypeLabel(s.type)}
                                {(s.data as any)?.acompanhantes && (s.data as any).acompanhantes.length > 0
                                  ? ` (+${(s.data as any).acompanhantes.length} acomp.)` : ''}
                              </div>
                              <div className="font-semibold">{getSchedulingName(s)}</div>
                              <div className="text-xs text-gray-600">Empresa: {getSchedulingCompany(s)} | Justificativa: {s.observacoes || 'Nenhuma'}</div>
                            </div>
                            <div className="text-right text-sm text-gray-500">{new Date(s.reviewedAt || s.createdAt).toLocaleString('pt-BR')}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {historyTab === 'compareceram' && (
                  <div>
                    {attendedList.length === 0 ? <p className="text-gray-600">Nenhum registro de comparecimento.</p> : (
                      modalAttendedList.map(s => (
                        <div
                          key={s.id}
                          className="p-3 bg-white rounded mb-2 border cursor-pointer hover:bg-gray-50"
                          onClick={() => showHistoricalSchedulingDetails(s)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="text-sm text-gray-500">{getSchedulingTypeLabel(s.type)}
                                {(s.data as any)?.acompanhantes && (s.data as any).acompanhantes.length > 0
                                  ? ` (+${(s.data as any).acompanhantes.length} acomp.)` : ''}
                              </div>
                              <div className="font-semibold">{getSchedulingName(s)}</div>
                              <div className="text-xs text-gray-600">Empresa: {getSchedulingCompany(s)} | Entrada: {new Date((s as any).checkInAt).toLocaleString('pt-BR')}</div>
                            </div>
                            <div className="text-right text-sm text-gray-500">{new Date(s.createdAt).toLocaleString('pt-BR')}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {historyTab === 'nao-compareceram' && (
                  <div>
                    {notAttendedList.length === 0 ? <p className="text-gray-600">Nenhum registro de não comparecimento.</p> : (
                      modalNotAttendedList.map(s => (
                        <div
                          key={s.id}
                          className="p-3 bg-white rounded mb-2 border cursor-pointer hover:bg-gray-50"
                          onClick={() => showHistoricalSchedulingDetails(s)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="text-sm text-gray-500">{getSchedulingTypeLabel(s.type)}
                                {(s.data as any)?.acompanhantes && (s.data as any).acompanhantes.length > 0
                                  ? ` (+${(s.data as any).acompanhantes.length} acomp.)` : ''}
                              </div>
                              <div className="font-semibold">{getSchedulingName(s)}</div>
                              <div className="text-xs text-gray-600">Empresa: {getSchedulingCompany(s)} | Registrado: {new Date((s as any).checkInAt).toLocaleString('pt-BR')}</div>
                            </div>
                            <div className="text-right text-sm text-gray-500">{new Date(s.createdAt).toLocaleString('pt-BR')}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

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
};

export default DashboardDiretor;
