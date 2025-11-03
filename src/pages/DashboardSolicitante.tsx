// Restore original imports using project alias and remove namespace React import
import { useAuth } from '@/contexts/AuthContext';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Interface auxiliar para os dados de integração na lista
interface IntegrationItem {
  nomeCompleto: string;
  empresa: string;
  rg: string;
  cpf: string;
}

const DashboardSolicitante = () => {
  const { user, logout, users } = useAuth();
  const { schedulings, getSchedulingsByUser, addScheduling, updateScheduling, cancelScheduling } = useScheduling();
  const navigate = useNavigate();

  // Estado para controlar as solicitações do usuário
  const [userSchedulingsState, setUserSchedulingsState] = useState<any[]>([]);
  
  // Atualizar as solicitações do usuário quando o contexto mudar
  useEffect(() => {
    if (user) {
      const userSchedulings = getSchedulingsByUser(user.id);
      setUserSchedulingsState(userSchedulings);
    }
  }, [schedulings, user, getSchedulingsByUser]);
  
  // Usar as solicitações do estado local
  const userSchedulings = userSchedulingsState;

  // Função auxiliar para obter o nome do solicitante com base no tipo
  const getSchedulingName = (scheduling: any) => {
    // MODIFICAÇÃO: Para 'integracao', mostra o número de pessoas ou 'Solicitação de Integração'
    if (scheduling.type === 'servicos-avulsos') {
      const baseName = scheduling.data?.nomeFuncionario || 'Solicitação';
      const acompanhantes = scheduling.data?.acompanhantes;
      if (acompanhantes && Array.isArray(acompanhantes) && acompanhantes.length > 0) {
        return `${baseName} (+${acompanhantes.length} acomp.)`;
      }
      return baseName;
    } else if (scheduling.type === 'visitas') {
      const baseName = scheduling.data?.nomeCompleto || 'Solicitação';
      const acompanhantes = scheduling.data?.acompanhantes;
      if (acompanhantes && Array.isArray(acompanhantes) && acompanhantes.length > 0) {
        return `${baseName} (+${acompanhantes.length} acomp.)`;
      }
      return baseName;
    } else if (scheduling.type === 'integracao') {
      // Verifica se a lista de integrantes existe e tem itens
      const count = scheduling.data?.integrantes?.length;
      return count > 0 ? `Integração: ${count} pessoa(s)` : scheduling.data?.nomeCompleto || 'Solicitação de Integração';
    } else if (scheduling.type === 'acesso-antecipado') {
      return scheduling.data?.nomeCompleto || 'Solicitação';
    }
    return 'Solicitação';
  };

  // Estados para o modal de nova solicitação
  const [showNewSolicitationModal, setShowNewSolicitationModal] = useState(false);
  const [solicitationType, setSolicitationType] = useState('');
  const [solicitationData, setSolicitationData] = useState<any>({});
  const [solicitationName, setSolicitationName] = useState('');
  const [solicitationCompany, setSolicitationCompany] = useState('');
  
  // Estados para acompanhantes no modal de nova solicitação
  const [temAcompanhantesNovo, setTemAcompanhantesNovo] = useState(false);
  const [quantidadeAcompanhantesNovo, setQuantidadeAcompanhantesNovo] = useState(1);
  const [acompanhantesNovo, setAcompanhantesNovo] = useState<Array<{nome: string, cpf: string, rg: string}>>([{nome: '', cpf: '', rg: ''}]);

  // Estados para edição de solicitações
  const [editingScheduling, setEditingScheduling] = useState<any>(null);
  const [editingSchedulingData, setEditingSchedulingData] = useState<any>({});
  const [editingSchedulingName, setEditingSchedulingName] = useState('');
  const [editingSchedulingCompany, setEditingSchedulingCompany] = useState('');
  
  // Estados para detalhes de solicitações
  const [showSchedulingDetails, setShowSchedulingDetails] = useState(false);
  const [currentSchedulingDetails, setCurrentSchedulingDetails] = useState<any>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Estados para acompanhantes
  const [temAcompanhantes, setTemAcompanhantes] = useState(false);
  const [quantidadeAcompanhantes, setQuantidadeAcompanhantes] = useState(1);
  const [acompanhantes, setAcompanhantes] = useState<Array<{nome: string, cpf: string, rg: string}>>([{nome: '', cpf: '', rg: ''}]);

  // NOVO ESTADO: Lista de Integrantes para o tipo 'integracao'
  const [integrationList, setIntegrationList] = useState<IntegrationItem[]>([]);
  // NOVO ESTADO: opção para manter campos após adicionar integrante
  const [keepIntegrantFields, setKeepIntegrantFields] = useState(false);

  // Contar status
  const pendentes = userSchedulings.filter(s => s.status === 'pendente').length;
  const aprovados = userSchedulings.filter(s => s.status === 'aprovado').length;
  const reprovados = userSchedulings.filter(s => s.status === 'reprovado').length;
  const cancelados = userSchedulings.filter(s => s.status === 'cancelado').length;

  // FUNÇÃO AUXILIAR: Resetar estados do modal
  const resetModalStates = () => {
    setShowNewSolicitationModal(false);
    setSolicitationType('');
    setSolicitationData({});
    setSolicitationName('');
    setSolicitationCompany('');
    setIntegrationList([]); // Resetar a lista também
    // Resetar estados dos acompanhantes
    setTemAcompanhantesNovo(false);
    setQuantidadeAcompanhantesNovo(1);
    setAcompanhantesNovo([{nome: '', cpf: '', rg: ''}]);
  };

  // NOVA FUNÇÃO: Adicionar Integrante à Lista
  const handleAddIntegrant = () => {
    // Validação específica para integração
    if (!solicitationName || !solicitationCompany || !solicitationData.rg || !solicitationData.cpf) {
      alert('Por favor, preencha Nome, Empresa, RG e CPF para adicionar na lista.');
      return;
    }

    const newIntegrant: IntegrationItem = {
      nomeCompleto: solicitationName,
      empresa: solicitationCompany,
      rg: solicitationData.rg,
      cpf: solicitationData.cpf,
    };

    setIntegrationList([...integrationList, newIntegrant]);

    // Se keepIntegrantFields for true, mantém os campos; caso contrário limpa
    if (!keepIntegrantFields) {
      setSolicitationName('');
      setSolicitationCompany('');
      setSolicitationData((prevData: any) => ({ ...prevData, rg: '', cpf: '' }));
    }
  };

  // NOVA FUNÇÃO: Remover Integrante da Lista
  const handleRemoveIntegrant = (index: number) => {
    const newList = integrationList.filter((_, i) => i !== index);
    setIntegrationList(newList);
  };

  // FUNÇÃO MODIFICADA: Criar Solicitação
  const handleCreateSolicitation = () => {
    // Para 'integracao', a validação principal é a lista de integrantes
    if (solicitationType === 'integracao' && integrationList.length === 0) {
      alert('Por favor, adicione pelo menos uma pessoa à lista de integração.');
      return;
    }

    // Validação geral para outros tipos
    if (solicitationType !== 'integracao' && (!solicitationType || !solicitationName || !solicitationCompany)) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Objeto de dados base
    let data: any = {};
    let finalSolicitationName = solicitationName; // Nome principal (ou o primeiro da lista)
    let finalSolicitationCompany = solicitationCompany; // Empresa principal (ou a primeira da lista)

    if (solicitationType === 'servicos-avulsos') {
      data = {
        nomeFuncionario: solicitationName,
        empresaPrestadora: solicitationCompany,
        ...solicitationData
      };
      
      // Adicionar dados dos acompanhantes se existirem
      if (temAcompanhantesNovo && acompanhantesNovo && acompanhantesNovo.length > 0) {
        data.acompanhantes = acompanhantesNovo.filter(acompanhante => 
          acompanhante.nome.trim() !== '' || acompanhante.cpf.trim() !== '' || acompanhante.rg.trim() !== ''
        );
      }
    } else if (solicitationType === 'visitas') {
      data = {
        nomeCompleto: solicitationName,
        empresaVisitante: solicitationCompany,
        ...solicitationData
      };
      
      // Adicionar dados dos acompanhantes se existirem
      if (temAcompanhantesNovo && acompanhantesNovo && acompanhantesNovo.length > 0) {
        data.acompanhantes = acompanhantesNovo.filter(acompanhante => 
          acompanhante.nome.trim() !== '' || acompanhante.cpf.trim() !== '' || acompanhante.rg.trim() !== ''
        );
      }
    } else if (solicitationType === 'integracao') {
      // MODIFICAÇÃO: Armazena a lista inteira no campo 'integrantes'
      data = {
        integrantes: integrationList,
        // Mantém os campos principais (nome/empresa) para exibição inicial no dashboard
        nomeCompleto: integrationList[0]?.nomeCompleto || 'Múltiplos Integrantes',
        empresa: integrationList[0]?.empresa || 'Diversas Empresas',
        ...solicitationData // Mantém outros dados do modal, se houver
      };
      // Força o uso do primeiro item da lista ou um placeholder
      finalSolicitationName = data.nomeCompleto;
      finalSolicitationCompany = data.empresa;
    } else if (solicitationType === 'acesso-antecipado') {
      data = {
        nomeCompleto: solicitationName,
        empresa: solicitationCompany,
        ...solicitationData
      };
    }

    // Objeto de solicitação
    const newSolicitation = {
      type: solicitationType as any,
      data,
      requestedBy: user?.id || '',
      requestedByName: user?.name || ''
    };

    // Adicionar a nova solicitação
    addScheduling(newSolicitation);
    alert('Solicitação criada com sucesso!');

    // Resetar e fechar o modal
    resetModalStates();
  };

  // FUNÇÃO: Iniciar edição de solicitação
  const startEditing = (scheduling: any) => {
    if (scheduling.status !== 'pendente') {
      alert('Apenas solicitações pendentes podem ser editadas.');
      return;
    }
    
    setEditingScheduling(scheduling);
    setEditingSchedulingData({ ...scheduling.data });
    
    // Definir nome e empresa com base no tipo da solicitação
    if (scheduling.type === 'servicos-avulsos') {
      setEditingSchedulingName(scheduling.data?.nomeFuncionario || '');
      setEditingSchedulingCompany(scheduling.data?.empresaPrestadora || '');
      
      // Inicializar dados dos acompanhantes se existirem
      if (scheduling.data?.acompanhantes && scheduling.data?.acompanhantes.length > 0) {
        setTemAcompanhantes(true);
        setQuantidadeAcompanhantes(scheduling.data.acompanhantes.length);
        setAcompanhantes(scheduling.data.acompanhantes);
      } else {
        setTemAcompanhantes(false);
        setQuantidadeAcompanhantes(1);
        setAcompanhantes([{nome: '', cpf: '', rg: ''}]);
      }
    } else if (scheduling.type === 'visitas') {
      setEditingSchedulingName(scheduling.data?.nomeCompleto || '');
      setEditingSchedulingCompany(scheduling.data?.empresaVisitante || '');
      
      // Inicializar dados dos acompanhantes se existirem
      if (scheduling.data?.acompanhantes && scheduling.data?.acompanhantes.length > 0) {
        setTemAcompanhantes(true);
        setQuantidadeAcompanhantes(scheduling.data.acompanhantes.length);
        setAcompanhantes(scheduling.data.acompanhantes);
      } else {
        setTemAcompanhantes(false);
        setQuantidadeAcompanhantes(1);
        setAcompanhantes([{nome: '', cpf: '', rg: ''}]);
      }
    } else if (scheduling.type === 'integracao') {
      setEditingSchedulingName(scheduling.data?.nomeCompleto || '');
      setEditingSchedulingCompany(scheduling.data?.empresa || '');
    } else if (scheduling.type === 'acesso-antecipado') {
      setEditingSchedulingName(scheduling.data?.nomeCompleto || '');
      setEditingSchedulingCompany(scheduling.data?.empresa || '');
    }
  };

  // FUNÇÃO: Salvar edição de solicitação
  const handleSaveEdit = async () => {
    if (!editingScheduling) return;

    // Atualizar os dados com base no tipo
    let updatedData: any = { ...editingSchedulingData };
    
    if (editingScheduling.type === 'servicos-avulsos') {
      updatedData.nomeFuncionario = editingSchedulingName;
      updatedData.empresaPrestadora = editingSchedulingCompany;
      
      // Adicionar dados dos acompanhantes se existirem
      if (temAcompanhantes && acompanhantes && acompanhantes.length > 0) {
        updatedData.acompanhantes = acompanhantes.filter(acompanhante => 
          acompanhante.nome.trim() !== '' || acompanhante.cpf.trim() !== '' || acompanhante.rg.trim() !== ''
        );
      }
    } else if (editingScheduling.type === 'visitas') {
      updatedData.nomeCompleto = editingSchedulingName;
      updatedData.empresaVisitante = editingSchedulingCompany;
      
      // Adicionar dados dos acompanhantes se existirem
      if (temAcompanhantes && acompanhantes && acompanhantes.length > 0) {
        updatedData.acompanhantes = acompanhantes.filter(acompanhante => 
          acompanhante.nome.trim() !== '' || acompanhante.cpf.trim() !== '' || acompanhante.rg.trim() !== ''
        );
      }
    } else if (editingScheduling.type === 'integracao') {
      updatedData.nomeCompleto = editingSchedulingName;
      updatedData.empresa = editingSchedulingCompany;
    } else if (editingScheduling.type === 'acesso-antecipado') {
      updatedData.nomeCompleto = editingSchedulingName;
      updatedData.empresa = editingSchedulingCompany;
    }

    // Atualizar a solicitação
    await updateScheduling(editingScheduling.id, {
      data: updatedData,
      requestedByName: editingSchedulingName
    });
    
    alert('Solicitação atualizada com sucesso!');
    
    // Resetar estados de edição
    setEditingScheduling(null);
    setEditingSchedulingData({});
    setEditingSchedulingName('');
    setEditingSchedulingCompany('');
    // Resetar estados dos acompanhantes
    setTemAcompanhantes(false);
    setQuantidadeAcompanhantes(1);
    setAcompanhantes([{nome: '', cpf: '', rg: ''}]);
  };

  // FUNÇÃO: Cancelar solicitação
  const handleCancelSolicitation = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta solicitação?')) {
      // Atualizar imediatamente a lista local para refletir a mudança na UI
      setUserSchedulingsState(prevSchedulings => 
        prevSchedulings.map(s => 
          s.id === id ? { ...s, status: 'cancelado' } : s
        )
      );
      
      try {
        await cancelScheduling(id);
        alert('Solicitação cancelada com sucesso!');
      } catch (error) {
        // Em caso de erro, restaurar o status anterior
        setUserSchedulingsState(prevSchedulings => 
          prevSchedulings.map(s => 
            s.id === id ? { ...s, status: s.status } : s
          )
        );
        alert('Erro ao cancelar solicitação. Por favor, tente novamente.');
      }
    }
  };

  // FUNÇÃO MODIFICADA: Renderizar Modal
  const renderNewSolicitationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-55">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">➕ Nova Solicitação</h3>
            <button
              onClick={resetModalStates} // Usa a função auxiliar
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6">
          {/* Banner no topo do modal para Visitas (V3) */}
          {solicitationType === 'visitas' && (
            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <div className="flex items-start">
                <div className="text-blue-600 text-2xl mr-3">ℹ️</div>
                <div>
                  <h4 className="font-semibold text-blue-700">Considerado como visita:</h4>
                  <ul className="mt-2 text-sm text-gray-700 list-disc list-inside space-y-1">
                    <li>Orçamentos</li>
                    <li>Reuniões com fornecedor ou cliente</li>
                    <li>Visita técnica sem ferramentas</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Solicitação</label>
            <select
              value={solicitationType}
              onChange={(e) => {
                setSolicitationType(e.target.value);
                setSolicitationData({}); // Limpa dados auxiliares ao mudar o tipo
                setIntegrationList([]); // Limpa lista ao mudar o tipo
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Selecione o tipo...</option>
              <option value="servicos-avulsos">🔧 Serviços Avulsos</option>
              <option value="visitas">🤝 Visitas (V3)</option>
              <option value="integracao">📚 Integração</option>
              <option value="acesso-antecipado">⏰ Acesso Antecipado</option>
            </select>
          </div>

          {/* Mostrar mensagem de observações no topo quando for Serviços Avulsos */}
          {solicitationType === 'servicos-avulsos' && (
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <div className="flex items-start">
                <div className="text-yellow-600 text-2xl mr-3">⚠️</div>
                <div>
                  <h4 className="font-semibold text-yellow-700">Observações Importantes</h4>
                  <ul className="mt-2 text-sm text-gray-700 list-disc list-inside space-y-1">
                    <li>A entrada deve ser previamente validada por um Responsável de Segurança do Trabalho (via e-mail).</li>
                    <li>Serviços frequentes com alegação de "avulso" terão acesso negado.</li>
                    <li>Serviços planejados devem seguir os procedimentos de integração HSSE.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* CORREÇÃO: O Nome e a Empresa SEMPRE devem aparecer, especialmente na Integração para preencher o próximo item. */}
          {solicitationType && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo {solicitationType !== 'integracao' ? '*' : ''}
                </label>
                <input
                  type="text"
                  value={solicitationName}
                  onChange={(e) => setSolicitationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Digite o nome completo"
                  required={solicitationType !== 'integracao'}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa {solicitationType !== 'integracao' ? '*' : ''}
                </label>
                <input
                  type="text"
                  value={solicitationCompany}
                  onChange={(e) => setSolicitationCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Digite o nome da empresa"
                  required={solicitationType !== 'integracao'}
                />
              </div>
            </>
          )}

          {solicitationType === 'servicos-avulsos' && (
            <>
              {/* Campos atualizados para serviços avulsos conforme solicitação */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={solicitationName}
                    onChange={(e) => setSolicitationName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nome do funcionário"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                  <input
                    type="text"
                    value={solicitationCompany}
                    onChange={(e) => setSolicitationCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Empresa prestadora"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Responsável</label>
                  <input
                    type="text"
                    value={solicitationData.responsavelServico || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, responsavelServico: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Responsável pelo serviço"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                  <input
                    type="text"
                    value={solicitationData.cpf || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, cpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="CPF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="text"
                    value={solicitationData.telefone || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, telefone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Telefone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número APR</label>
                  <input
                    type="text"
                    value={solicitationData.numeroAPR || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, numeroAPR: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Número da APR"
                  />
                </div>
              </div>

              {/* Veículo checkbox e campos */}
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={!!solicitationData.possuiVeiculo}
                    onChange={(e) => setSolicitationData({ ...solicitationData, possuiVeiculo: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Possui veículo</span>
                </label>
              </div>

              {solicitationData.possuiVeiculo && (
                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                    <input
                      type="text"
                      value={solicitationData.marcaVeiculo || ''}
                      onChange={(e) => setSolicitationData({ ...solicitationData, marcaVeiculo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Marca do veículo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                    <input
                      type="text"
                      value={solicitationData.modeloVeiculo || ''}
                      onChange={(e) => setSolicitationData({ ...solicitationData, modeloVeiculo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Modelo do veículo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Placa</label>
                    <input
                      type="text"
                      value={solicitationData.placaVeiculo || solicitationData.placa || ''}
                      onChange={(e) => setSolicitationData({ ...solicitationData, placa: e.target.value, placaVeiculo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Placa do veículo"
                    />
                  </div>
                </div>
              )}

              {/* Data e horários */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Entrada</label>
                  <input
                    type="date"
                    value={solicitationData.dataInicio || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, dataInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Entrada</label>
                  <input
                    type="time"
                    value={solicitationData.horaInicio || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, horaInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Saída</label>
                  <input
                    type="date"
                    value={solicitationData.dataTermino || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, dataTermino: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Saída</label>
                  <input
                    type="time"
                    value={solicitationData.horaTermino || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, horaTermino: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Prioridade */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                <select
                  value={solicitationData.prioridade || 'normal'}
                  onChange={(e) => setSolicitationData({ ...solicitationData, prioridade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="emergencial">Emergencial</option>
                  <option value="alta">Alta</option>
                  <option value="normal">Normal</option>
                </select>
              </div>

              {/* Motivo/Descrição */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo / Descrição</label>
                <textarea
                  value={solicitationData.motivoServico || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, motivoServico: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="Descreva o motivo do serviço"
                />
              </div>

              {/* Observações Especiais */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações Especiais</label>
                <div className="flex flex-col space-y-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={!!solicitationData.liberacaoRefeitorio}
                      onChange={(e) => setSolicitationData({ ...solicitationData, liberacaoRefeitorio: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Acesso ao refeitório</span>
                  </label>

                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={!!solicitationData.acompanhamentoTecnico}
                      onChange={(e) => setSolicitationData({ ...solicitationData, acompanhamentoTecnico: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Acompanhamento obrigatório do técnico de segurança</span>
                  </label>

                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={!!solicitationData.transporteEquipamentos}
                      onChange={(e) => setSolicitationData({ ...solicitationData, transporteEquipamentos: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Transporte de equipamentos / ferramentas</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Portaria de Acesso</label>
                <select
                  value={solicitationData.portariaAcesso || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, portariaAcesso: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione a portaria...</option>
                  <option value="Portaria 1">Portaria 1</option>
                  <option value="Portaria 2">Portaria 2</option>
                </select>
              </div>
              
              {/* Campo para acompanhantes em serviços avulsos */}
              {solicitationType === 'servicos-avulsos' && (
                <>
                  <div className="mb-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={temAcompanhantesNovo}
                        onChange={(e) => {
                          setTemAcompanhantesNovo(e.target.checked);
                          if (!e.target.checked) {
                            setQuantidadeAcompanhantesNovo(1);
                            setAcompanhantesNovo([{nome: '', cpf: '', rg: ''}]);
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">Acompanhantes</span>
                    </label>
                  </div>

                  {temAcompanhantesNovo && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade de Acompanhantes</label>
                      <input
                        type="number"
                        min="1"
                        value={quantidadeAcompanhantesNovo}
                        onChange={(e) => {
                          const novaQuantidade = Math.max(1, parseInt(e.target.value) || 1);
                          setQuantidadeAcompanhantesNovo(novaQuantidade);
                          
                          // Atualizar o array de acompanhantes
                          const novosAcompanhantes = [];
                          for (let i = 0; i < novaQuantidade; i++) {
                            if (acompanhantesNovo[i]) {
                              novosAcompanhantes.push(acompanhantesNovo[i]);
                            } else {
                              novosAcompanhantes.push({nome: '', cpf: '', rg: ''});
                            }
                          }
                          setAcompanhantesNovo(novosAcompanhantes);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Quantidade de acompanhantes"
                      />
                    </div>
                  )}

                  {temAcompanhantesNovo && (
                    <div className="mb-4 border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Acompanhantes</h4>
                      {acompanhantesNovo.map((acompanhante, index) => (
                        <div key={index} className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-gray-700 mb-2">Acompanhante {index + 1}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                              <input
                                type="text"
                                value={acompanhante.nome}
                                onChange={(e) => {
                                  const novosAcompanhantes = [...acompanhantesNovo];
                                  novosAcompanhantes[index] = {...novosAcompanhantes[index], nome: e.target.value};
                                  setAcompanhantesNovo(novosAcompanhantes);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Nome completo"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                              <input
                                type="text"
                                value={acompanhante.cpf}
                                onChange={(e) => {
                                  const novosAcompanhantes = [...acompanhantesNovo];
                                  novosAcompanhantes[index] = {...novosAcompanhantes[index], cpf: e.target.value};
                                  setAcompanhantesNovo(novosAcompanhantes);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="CPF"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                              <input
                                type="text"
                                value={acompanhante.rg}
                                onChange={(e) => {
                                  const novosAcompanhantes = [...acompanhantesNovo];
                                  novosAcompanhantes[index] = {...novosAcompanhantes[index], rg: e.target.value};
                                  setAcompanhantesNovo(novosAcompanhantes);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="RG"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Adiciona bloco de campos para Visitas (V3) */}
          {solicitationType === 'visitas' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">👤 Nome completo do visitante:</label>
                <input
                  type="text"
                  value={solicitationName}
                  onChange={(e) => setSolicitationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nome completo"
                />
              </div>

              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📄 CPF:</label>
                  <input
                    type="text"
                    value={solicitationData.cpf || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, cpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="CPF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📞 Telefone:</label>
                  <input
                    type="text"
                    value={solicitationData.telefone || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, telefone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Telefone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Empresa visitante:</label>
                  <input
                    type="text"
                    value={solicitationCompany}
                    onChange={(e) => setSolicitationCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Empresa"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Motivo da visita:</label>
                <textarea
                  value={solicitationData.motivoVisita || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, motivoVisita: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Descreva o motivo da visita"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">👥 Pessoa a ser visitada:</label>
                <input
                  type="text"
                  value={solicitationData.pessoaVisitada || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, pessoaVisitada: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nome da pessoa a ser visitada"
                />
              </div>

              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📅 Data da visita:</label>
                  <input
                    type="date"
                    value={solicitationData.dataVisita || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, dataVisita: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">⏱️ Previsão de chegada:</label>
                  <input
                    type="time"
                    value={solicitationData.previsaoChegada || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, previsaoChegada: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">⏳ Previsão de saída:</label>
                  <input
                    type="time"
                    value={solicitationData.previsaoSaida || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, previsaoSaida: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={!!solicitationData.liberacaoRefeitorio}
                    onChange={(e) => setSolicitationData({ ...solicitationData, liberacaoRefeitorio: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">🍽️ Liberação do refeitório (Sim/Não)</span>
                </label>
              </div>

              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🚗 Dados do veículo (marca):</label>
                  <input
                    type="text"
                    value={solicitationData.marcaVeiculo || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, marcaVeiculo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Marca"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🚗 Dados do veículo (modelo):</label>
                  <input
                    type="text"
                    value={solicitationData.modeloVeiculo || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, modeloVeiculo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Modelo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔢 Placa:</label>
                  <input
                    type="text"
                    value={solicitationData.placa || solicitationData.placaVeiculo || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, placa: e.target.value, placaVeiculo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Placa"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">🚧 Portaria de acesso</label>
                <select
                  value={solicitationData.portariaAcesso || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, portariaAcesso: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione a portaria...</option>
                  <option value="Portaria 1">Portaria 1</option>
                  <option value="Portaria 2">Portaria 2</option>
                </select>
              </div>
              
              {/* Campo para acompanhantes em visitas */}
              {solicitationType === 'visitas' && (
                <>
                  <div className="mb-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={temAcompanhantesNovo}
                        onChange={(e) => {
                          setTemAcompanhantesNovo(e.target.checked);
                          if (!e.target.checked) {
                            setQuantidadeAcompanhantesNovo(1);
                            setAcompanhantesNovo([{nome: '', cpf: '', rg: ''}]);
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">Acompanhantes</span>
                    </label>
                  </div>

                  {temAcompanhantesNovo && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade de Acompanhantes</label>
                      <input
                        type="number"
                        min="1"
                        value={quantidadeAcompanhantesNovo}
                        onChange={(e) => {
                          const novaQuantidade = Math.max(1, parseInt(e.target.value) || 1);
                          setQuantidadeAcompanhantesNovo(novaQuantidade);
                          
                          // Atualizar o array de acompanhantes
                          const novosAcompanhantes = [];
                          for (let i = 0; i < novaQuantidade; i++) {
                            if (acompanhantesNovo[i]) {
                              novosAcompanhantes.push(acompanhantesNovo[i]);
                            } else {
                              novosAcompanhantes.push({nome: '', cpf: '', rg: ''});
                            }
                          }
                          setAcompanhantesNovo(novosAcompanhantes);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Quantidade de acompanhantes"
                      />
                    </div>
                  )}

                  {temAcompanhantesNovo && (
                    <div className="mb-4 border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Acompanhantes</h4>
                      {acompanhantesNovo.map((acompanhante, index) => (
                        <div key={index} className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-gray-700 mb-2">Acompanhante {index + 1}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                              <input
                                type="text"
                                value={acompanhante.nome}
                                onChange={(e) => {
                                  const novosAcompanhantes = [...acompanhantesNovo];
                                  novosAcompanhantes[index] = {...novosAcompanhantes[index], nome: e.target.value};
                                  setAcompanhantesNovo(novosAcompanhantes);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Nome completo"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                              <input
                                type="text"
                                value={acompanhante.cpf}
                                onChange={(e) => {
                                  const novosAcompanhantes = [...acompanhantesNovo];
                                  novosAcompanhantes[index] = {...novosAcompanhantes[index], cpf: e.target.value};
                                  setAcompanhantesNovo(novosAcompanhantes);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="CPF"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                              <input
                                type="text"
                                value={acompanhante.rg}
                                onChange={(e) => {
                                  const novosAcompanhantes = [...acompanhantesNovo];
                                  novosAcompanhantes[index] = {...novosAcompanhantes[index], rg: e.target.value};
                                  setAcompanhantesNovo(novosAcompanhantes);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="RG"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {solicitationType === 'integracao' && (
            <>
              {/* RG e CPF são específicos da Integração */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">RG *</label>
                <input
                  type="text"
                  value={solicitationData.rg || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, rg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="RG do funcionário"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF *</label>
                <input
                  type="text"
                  value={solicitationData.cpf || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, cpf: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="CPF do funcionário"
                  required
                />
              </div>

              {/* BOTÃO: Adicionar na Lista com opção 'Manter campos' */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={keepIntegrantFields}
                      onChange={(e) => setKeepIntegrantFields(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Manter campos após adicionar</span>
                  </label>

                  {/* Botão alternativo caso queira um botão separado */}
                  <button
                    type="button"
                    onClick={() => setKeepIntegrantFields((v) => !v)}
                    className={`px-3 py-1 rounded ${keepIntegrantFields ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    {keepIntegrantFields ? 'Mantendo' : 'Manter'}
                  </button>
                </div>

                <button
                  onClick={handleAddIntegrant}
                  type="button" // Evita submeter o formulário
                  className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
                >
                  ➕ Adicionar na Lista
                </button>
              </div>

              {/* Exibição da Lista de Integrantes */}
              {integrationList.length > 0 && (
                <div className="mb-4 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Integrantes Adicionados ({integrationList.length}):</h4>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {integrationList.map((integrant, index) => (
                      <li key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{integrant.nomeCompleto}</p>
                          <p className="text-gray-600 text-xs">{integrant.empresa} | RG: {integrant.rg}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveIntegrant(index)}
                          type="button"
                          className="text-red-500 hover:text-red-700 text-sm font-semibold ml-4"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {solicitationType === 'acesso-antecipado' && (
            <>
              {/* Campos existentes para acesso antecipado */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                <input
                  type="text"
                  value={solicitationData.cpf || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, cpf: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="CPF do funcionário"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Responsável pelo Acompanhamento</label>
                <input
                  type="text"
                  value={solicitationData.responsavelAcompanhamento || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, responsavelAcompanhamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Responsável pelo acompanhamento"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo da Liberação</label>
                <textarea
                  value={solicitationData.motivoLiberacao || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, motivoLiberacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Descreva o motivo da liberação"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data da Liberação</label>
                  <input
                    type="date"
                    value={solicitationData.dataLiberacao || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, dataLiberacao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Chegada</label>
                  <input
                    type="time"
                    value={solicitationData.horarioChegada || ''}
                    onChange={(e) => setSolicitationData({ ...solicitationData, horarioChegada: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Portaria de Acesso</label>
                <select
                  value={solicitationData.portariaAcesso || ''}
                  onChange={(e) => setSolicitationData({ ...solicitationData, portariaAcesso: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione a portaria...</option>
                  <option value="Portaria 1">Portaria 1</option>
                  <option value="Portaria 2">Portaria 2</option>
                </select>
              </div>
            </>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleCreateSolicitation}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
            >
              ✅ Criar Solicitação
            </button>
            <button
              onClick={resetModalStates} // Usa a função auxiliar
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // FUNÇÃO MODIFICADA: Renderizar Modal de Edição
  const renderEditSolicitationModal = () => {
    if (!editingScheduling) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-55">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">📝 Editar Solicitação</h3>
              <button
                onClick={() => {
                  setEditingScheduling(null);
                  setEditingSchedulingData({});
                  setEditingSchedulingName('');
                  setEditingSchedulingCompany('');
                  // Resetar estados dos acompanhantes
                  setTemAcompanhantes(false);
                  setQuantidadeAcompanhantes(1);
                  setAcompanhantes([{nome: '', cpf: '', rg: ''}]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Solicitação</label>
              <input
                type="text"
                value={
                  editingScheduling.type === 'servicos-avulsos' ? '🔧 Serviços Avulsos' :
                  editingScheduling.type === 'visitas' ? '🤝 Visitas (V3)' :
                  editingScheduling.type === 'integracao' ? '📚 Integração' :
                  '⏰ Acesso Antecipado'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
              <input
                type="text"
                value={editingSchedulingName}
                onChange={(e) => setEditingSchedulingName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Digite o nome completo"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
              <input
                type="text"
                value={editingSchedulingCompany}
                onChange={(e) => setEditingSchedulingCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Digite o nome da empresa"
              />
            </div>

            {editingScheduling.type === 'servicos-avulsos' && (
              <>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                    <input
                      type="text"
                      value={editingSchedulingData.cpf || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, cpf: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="CPF"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="text"
                      value={editingSchedulingData.telefone || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, telefone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Telefone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número APR</label>
                    <input
                      type="text"
                      value={editingSchedulingData.numeroAPR || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, numeroAPR: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Número da APR"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Responsável pelo serviço</label>
                    <input
                      type="text"
                      value={editingSchedulingData.responsavelServico || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, responsavelServico: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Responsável pelo serviço"
                    />
                  </div>
                </div>

                {/* Campo para acompanhantes */}
                <div className="mb-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={temAcompanhantes}
                      onChange={(e) => {
                        setTemAcompanhantes(e.target.checked);
                        if (!e.target.checked) {
                          setQuantidadeAcompanhantes(1);
                          setAcompanhantes([{nome: '', cpf: '', rg: ''}]);
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">Acompanhantes</span>
                  </label>
                </div>

                {temAcompanhantes && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade de Acompanhantes</label>
                    <input
                      type="number"
                      min="1"
                      value={quantidadeAcompanhantes}
                      onChange={(e) => {
                        const novaQuantidade = Math.max(1, parseInt(e.target.value) || 1);
                        setQuantidadeAcompanhantes(novaQuantidade);
                        
                        // Atualizar o array de acompanhantes
                        const novosAcompanhantes = [];
                        for (let i = 0; i < novaQuantidade; i++) {
                          if (acompanhantes[i]) {
                            novosAcompanhantes.push(acompanhantes[i]);
                          } else {
                            novosAcompanhantes.push({nome: '', cpf: '', rg: ''});
                          }
                        }
                        setAcompanhantes(novosAcompanhantes);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Quantidade de acompanhantes"
                    />
                  </div>
                )}

                {temAcompanhantes && (
                  <div className="mb-4 border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Acompanhantes</h4>
                    {acompanhantes.map((acompanhante, index) => (
                      <div key={index} className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-2">Acompanhante {index + 1}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                            <input
                              type="text"
                              value={acompanhante.nome}
                              onChange={(e) => {
                                const novosAcompanhantes = [...acompanhantes];
                                novosAcompanhantes[index] = {...novosAcompanhantes[index], nome: e.target.value};
                                setAcompanhantes(novosAcompanhantes);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Nome completo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                            <input
                              type="text"
                              value={acompanhante.cpf}
                              onChange={(e) => {
                                const novosAcompanhantes = [...acompanhantes];
                                novosAcompanhantes[index] = {...novosAcompanhantes[index], cpf: e.target.value};
                                setAcompanhantes(novosAcompanhantes);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="CPF"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                            <input
                              type="text"
                              value={acompanhante.rg}
                              onChange={(e) => {
                                const novosAcompanhantes = [...acompanhantes];
                                novosAcompanhantes[index] = {...novosAcompanhantes[index], rg: e.target.value};
                                setAcompanhantes(novosAcompanhantes);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="RG"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Veículo checkbox e campos */}
                <div className="mb-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={!!editingSchedulingData.possuiVeiculo}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, possuiVeiculo: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Possui veículo</span>
                  </label>
                </div>

                {editingSchedulingData.possuiVeiculo && (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                      <input
                        type="text"
                        value={editingSchedulingData.marcaVeiculo || ''}
                        onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, marcaVeiculo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Marca do veículo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                      <input
                        type="text"
                        value={editingSchedulingData.modeloVeiculo || ''}
                        onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, modeloVeiculo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Modelo do veículo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Placa</label>
                      <input
                        type="text"
                        value={editingSchedulingData.placaVeiculo || editingSchedulingData.placa || ''}
                        onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, placa: e.target.value, placaVeiculo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Placa do veículo"
                      />
                    </div>
                  </div>
                )}

                {/* Data e horários */}
                <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Entrada</label>
                    <input
                      type="date"
                      value={editingSchedulingData.dataInicio || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, dataInicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Entrada</label>
                    <input
                      type="time"
                      value={editingSchedulingData.horaInicio || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, horaInicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Saída</label>
                    <input
                      type="date"
                      value={editingSchedulingData.dataTermino || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, dataTermino: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Saída</label>
                    <input
                      type="time"
                      value={editingSchedulingData.horaTermino || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, horaTermino: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Prioridade */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                  <select
                    value={editingSchedulingData.prioridade || 'normal'}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, prioridade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="emergencial">Emergencial</option>
                    <option value="alta">Alta</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>

                {/* Motivo/Descrição */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motivo / Descrição</label>
                  <textarea
                    value={editingSchedulingData.motivoServico || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, motivoServico: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Descreva o motivo do serviço"
                  />
                </div>

                {/* Observações Especiais */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observações Especiais</label>
                  <div className="flex flex-col space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={!!editingSchedulingData.liberacaoRefeitorio}
                        onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, liberacaoRefeitorio: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Acesso ao refeitório</span>
                    </label>

                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={!!editingSchedulingData.acompanhamentoTecnico}
                        onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, acompanhamentoTecnico: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Acompanhamento obrigatório do técnico de segurança</span>
                    </label>

                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={!!editingSchedulingData.transporteEquipamentos}
                        onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, transporteEquipamentos: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Transporte de equipamentos / ferramentas</span>
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portaria de Acesso</label>
                  <select
                    value={editingSchedulingData.portariaAcesso || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, portariaAcesso: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Selecione a portaria...</option>
                    <option value="Portaria 1">Portaria 1</option>
                    <option value="Portaria 2">Portaria 2</option>
                  </select>
                </div>
              </>
            )}

            {editingScheduling.type === 'visitas' && (
              <>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📄 CPF:</label>
                    <input
                      type="text"
                      value={editingSchedulingData.cpf || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, cpf: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="CPF"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📞 Telefone:</label>
                    <input
                      type="text"
                      value={editingSchedulingData.telefone || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, telefone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Telefone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Empresa visitante:</label>
                    <input
                      type="text"
                      value={editingSchedulingCompany}
                      onChange={(e) => setEditingSchedulingCompany(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Empresa"
                    />
                  </div>
                </div>

                {/* Campo para acompanhantes */}
                <div className="mb-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={temAcompanhantes}
                      onChange={(e) => {
                        setTemAcompanhantes(e.target.checked);
                        if (!e.target.checked) {
                          setQuantidadeAcompanhantes(1);
                          setAcompanhantes([{nome: '', cpf: '', rg: ''}]);
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">Acompanhantes</span>
                  </label>
                </div>

                {temAcompanhantes && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade de Acompanhantes</label>
                    <input
                      type="number"
                      min="1"
                      value={quantidadeAcompanhantes}
                      onChange={(e) => {
                        const novaQuantidade = Math.max(1, parseInt(e.target.value) || 1);
                        setQuantidadeAcompanhantes(novaQuantidade);
                        
                        // Atualizar o array de acompanhantes
                        const novosAcompanhantes = [];
                        for (let i = 0; i < novaQuantidade; i++) {
                          if (acompanhantes[i]) {
                            novosAcompanhantes.push(acompanhantes[i]);
                          } else {
                            novosAcompanhantes.push({nome: '', cpf: '', rg: ''});
                          }
                        }
                        setAcompanhantes(novosAcompanhantes);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Quantidade de acompanhantes"
                    />
                  </div>
                )}

                {temAcompanhantes && (
                  <div className="mb-4 border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Acompanhantes</h4>
                    {acompanhantes.map((acompanhante, index) => (
                      <div key={index} className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-2">Acompanhante {index + 1}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                            <input
                              type="text"
                              value={acompanhante.nome}
                              onChange={(e) => {
                                const novosAcompanhantes = [...acompanhantes];
                                novosAcompanhantes[index] = {...novosAcompanhantes[index], nome: e.target.value};
                                setAcompanhantes(novosAcompanhantes);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Nome completo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                            <input
                              type="text"
                              value={acompanhante.cpf}
                              onChange={(e) => {
                                const novosAcompanhantes = [...acompanhantes];
                                novosAcompanhantes[index] = {...novosAcompanhantes[index], cpf: e.target.value};
                                setAcompanhantes(novosAcompanhantes);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="CPF"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                            <input
                              type="text"
                              value={acompanhante.rg}
                              onChange={(e) => {
                                const novosAcompanhantes = [...acompanhantes];
                                novosAcompanhantes[index] = {...novosAcompanhantes[index], rg: e.target.value};
                                setAcompanhantes(novosAcompanhantes);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="RG"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Motivo da visita:</label>
                  <textarea
                    value={editingSchedulingData.motivoVisita || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, motivoVisita: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Descreva o motivo da visita"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">👥 Pessoa a ser visitada:</label>
                  <input
                    type="text"
                    value={editingSchedulingData.pessoaVisitada || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, pessoaVisitada: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nome da pessoa a ser visitada"
                  />
                </div>

                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📅 Data da visita:</label>
                    <input
                      type="date"
                      value={editingSchedulingData.dataVisita || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, dataVisita: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">⏱️ Previsão de chegada:</label>
                    <input
                      type="time"
                      value={editingSchedulingData.previsaoChegada || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, previsaoChegada: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">⏳ Previsão de saída:</label>
                    <input
                      type="time"
                      value={editingSchedulingData.previsaoSaida || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, previsaoSaida: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={!!editingSchedulingData.liberacaoRefeitorio}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, liberacaoRefeitorio: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">🍽️ Liberação do refeitório (Sim/Não)</span>
                  </label>
                </div>

                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🚗 Dados do veículo (marca):</label>
                    <input
                      type="text"
                      value={editingSchedulingData.marcaVeiculo || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, marcaVeiculo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Marca"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🚗 Dados do veículo (modelo):</label>
                    <input
                      type="text"
                      value={editingSchedulingData.modeloVeiculo || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, modeloVeiculo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Modelo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔢 Placa:</label>
                    <input
                      type="text"
                      value={editingSchedulingData.placa || editingSchedulingData.placaVeiculo || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, placa: e.target.value, placaVeiculo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Placa"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">🚧 Portaria de acesso</label>
                  <select
                    value={editingSchedulingData.portariaAcesso || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, portariaAcesso: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Selecione a portaria...</option>
                    <option value="Portaria 1">Portaria 1</option>
                    <option value="Portaria 2">Portaria 2</option>
                  </select>
                </div>
              </>
            )}

            {editingScheduling.type === 'integracao' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">RG</label>
                  <input
                    type="text"
                    value={editingSchedulingData.rg || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, rg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="RG do funcionário"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                  <input
                    type="text"
                    value={editingSchedulingData.cpf || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, cpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="CPF do funcionário"
                  />
                </div>
              </>
            )}

            {editingScheduling.type === 'acesso-antecipado' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                  <input
                    type="text"
                    value={editingSchedulingData.cpf || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, cpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="CPF do funcionário"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Responsável pelo Acompanhamento</label>
                  <input
                    type="text"
                    value={editingSchedulingData.responsavelAcompanhamento || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, responsavelAcompanhamento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Responsável pelo acompanhamento"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motivo da Liberação</label>
                  <textarea
                    value={editingSchedulingData.motivoLiberacao || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, motivoLiberacao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Descreva o motivo da liberação"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data da Liberação</label>
                    <input
                      type="date"
                      value={editingSchedulingData.dataLiberacao || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, dataLiberacao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Chegada</label>
                    <input
                      type="time"
                      value={editingSchedulingData.horarioChegada || ''}
                      onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, horarioChegada: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portaria de Acesso</label>
                  <select
                    value={editingSchedulingData.portariaAcesso || ''}
                    onChange={(e) => setEditingSchedulingData({ ...editingSchedulingData, portariaAcesso: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Selecione a portaria...</option>
                    <option value="Portaria 1">Portaria 1</option>
                    <option value="Portaria 2">Portaria 2</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
              >
                ✅ Salvar Alterações
              </button>
              <button
                onClick={() => {
                  setEditingScheduling(null);
                  setEditingSchedulingData({});
                  setEditingSchedulingName('');
                  setEditingSchedulingCompany('');
                  // Resetar estados dos acompanhantes
                  setTemAcompanhantes(false);
                  setQuantidadeAcompanhantes(1);
                  setAcompanhantes([{nome: '', cpf: '', rg: ''}]);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ... restante do componente (handleLogout e retorno do JSX principal) ...
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
              <span className="text-4xl mr-3">🧑‍💼</span>
              Painel do Solicitante
            </h2>
            <p className="text-gray-600">Bem-vindo, <span className="font-semibold">{user?.name || 'Solicitante'}</span></p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNewSolicitationModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">🆕 Nova Solicitação</button>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Sair</button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{pendentes}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{aprovados}</div>
            <div className="text-sm text-gray-600">Aprovados</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-red-600">{reprovados}</div>
            <div className="text-sm text-gray-600">Reprovados</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-gray-600">{cancelados}</div>
            <div className="text-sm text-gray-600">Cancelados</div>
          </div>
        </div>

        {/* Minhas Solicitações */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold text-gray-800">📄 Minhas Solicitações</h3>
          </div>
          <div className="divide-y">
            {userSchedulings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Nenhuma solicitação registrada</p>
              </div>
            ) : (
              userSchedulings.map((scheduling) => (
                <div key={scheduling.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer" onClick={() => {
                      setCurrentSchedulingDetails(scheduling);
                      setShowSchedulingDetails(true);
                    }}>
                      <div className="flex items-center mb-2">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium mr-2">
                          {scheduling.type === 'servicos-avulsos' ? '🔧 Serviço Avulso' :
                            scheduling.type === 'visitas' ? '🤝 Visita V3' :
                              scheduling.type === 'entrega-liberacao' ? '📦 Entrega/Liberação' :
                                scheduling.type === 'integracao' ? '📚 Integração' :
                                  '⏰ Acesso Antecipado'}
                        </span>
                        <span className={`${scheduling.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                          scheduling.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                          scheduling.status === 'reprovado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                          } px-2 py-1 rounded text-xs font-medium`}>
                          {scheduling.status === 'pendente' ? 'PENDENTE' :
                            scheduling.status === 'aprovado' ? 'APROVADO' :
                            scheduling.status === 'reprovado' ? 'REPROVADO' : 'CANCELADO'}
                        </span>
                      </div>
                      <h4 className="font-bold">{getSchedulingName(scheduling)}</h4>
                      <p className="text-gray-600 text-sm">Solicitado em: {new Date(scheduling.createdAt).toLocaleString('pt-BR')}</p>
                      {scheduling.status === 'aprovado' && (
                        <p className="text-green-600 text-sm font-medium">✅ Autorizado para entrada</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className={`${scheduling.status !== 'pendente' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded text-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(scheduling);
                        }}
                        disabled={scheduling.status !== 'pendente'}
                      >
                        📝 Editar
                      </button>
                      <button
                        className={`${scheduling.status !== 'pendente' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white px-3 py-1 rounded text-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelSolicitation(scheduling.id);
                        }}
                        disabled={scheduling.status !== 'pendente'}
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ))
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

      {/* Modal de Nova Solicitação */}
      {showNewSolicitationModal && renderNewSolicitationModal()}

      {/* Modal de Edição de Solicitação */}
      {editingScheduling && renderEditSolicitationModal()}
      
      {/* Modal de Detalhes de Solicitação */}
      {showSchedulingDetails && currentSchedulingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">🔍 Detalhes da Solicitação</h3>
                <button
                  onClick={() => {
                    setShowSchedulingDetails(false);
                    setCurrentSchedulingDetails(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm mb-6">
                <div><strong>Tipo:</strong> {currentSchedulingDetails.type === 'servicos-avulsos' ? '🔧 Serviço Avulso' :
                  currentSchedulingDetails.type === 'visitas' ? '🤝 Visita V3' :
                  currentSchedulingDetails.type === 'entrega-liberacao' ? '📦 Entrega/Liberação' :
                  currentSchedulingDetails.type === 'integracao' ? '📚 Integração' :
                  '⏰ Acesso Antecipado'}</div>
                <div><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    currentSchedulingDetails.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                    currentSchedulingDetails.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                    currentSchedulingDetails.status === 'reprovado' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentSchedulingDetails.status === 'pendente' ? 'PENDENTE' :
                      currentSchedulingDetails.status === 'aprovado' ? 'APROVADO' :
                      currentSchedulingDetails.status === 'reprovado' ? 'REPROVADO' : 'CANCELADO'}
                  </span>
                </div>
                <div><strong>Solicitado por:</strong> {currentSchedulingDetails.requestedByName}</div>
                <div><strong>Data de Solicitação:</strong> {new Date(currentSchedulingDetails.createdAt).toLocaleString('pt-BR')}</div>
              </div>
              
              {currentSchedulingDetails.type === 'servicos-avulsos' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><strong>Nome:</strong> {currentSchedulingDetails.data?.nomeFuncionario || 'N/A'}</div>
                    <div><strong>Empresa Prestadora:</strong> {currentSchedulingDetails.data?.empresaPrestadora || 'N/A'}</div>
                    <div><strong>CPF:</strong> {currentSchedulingDetails.data?.cpf || 'N/A'}</div>
                    <div><strong>Telefone:</strong> {currentSchedulingDetails.data?.telefone || 'N/A'}</div>
                    <div><strong>Responsável Serviço:</strong> {currentSchedulingDetails.data?.responsavelServico || 'N/A'}</div>
                    <div><strong>Número APR:</strong> {currentSchedulingDetails.data?.numeroAPR || 'N/A'}</div>
                  </div>
                  
                  {/* Exibir informações dos acompanhantes se existirem */}
                  {currentSchedulingDetails.data?.acompanhantes && 
                    Array.isArray(currentSchedulingDetails.data.acompanhantes) && 
                    currentSchedulingDetails.data.acompanhantes.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Acompanhantes ({currentSchedulingDetails.data.acompanhantes.length}):</h4>
                      <div className="space-y-3">
                        {currentSchedulingDetails.data.acompanhantes.map((acompanhante: any, index: number) => (
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
              
              {currentSchedulingDetails.type === 'visitas' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><strong>Nome:</strong> {currentSchedulingDetails.data?.nomeCompleto || 'N/A'}</div>
                    <div><strong>Empresa:</strong> {currentSchedulingDetails.data?.empresaVisitante || 'N/A'}</div>
                    <div><strong>CPF:</strong> {currentSchedulingDetails.data?.cpf || 'N/A'}</div>
                    <div><strong>Telefone:</strong> {currentSchedulingDetails.data?.telefone || 'N/A'}</div>
                    <div><strong>Pessoa Visitada:</strong> {currentSchedulingDetails.data?.pessoaVisitada || 'N/A'}</div>
                    <div><strong>Data Visita:</strong> {currentSchedulingDetails.data?.dataVisita || 'N/A'}</div>
                    <div><strong>Previsão Chegada:</strong> {currentSchedulingDetails.data?.previsaoChegada || 'N/A'}</div>
                    <div><strong>Previsão Saída:</strong> {currentSchedulingDetails.data?.previsaoSaida || 'N/A'}</div>
                    <div><strong>Liberação Refeitório:</strong> {currentSchedulingDetails.data?.liberacaoRefeitorio ? 'Sim' : 'Não'}</div>
                    <div><strong>Portaria:</strong> {currentSchedulingDetails.data?.portariaAcesso || 'N/A'}</div>
                    <div className="md:col-span-2"><strong>Motivo:</strong> {currentSchedulingDetails.data?.motivoVisita || 'N/A'}</div>
                  </div>
                  
                  {/* Exibir informações dos acompanhantes se existirem */}
                  {currentSchedulingDetails.data?.acompanhantes && 
                    Array.isArray(currentSchedulingDetails.data.acompanhantes) && 
                    currentSchedulingDetails.data.acompanhantes.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Acompanhantes ({currentSchedulingDetails.data.acompanhantes.length}):</h4>
                      <div className="space-y-3">
                        {currentSchedulingDetails.data.acompanhantes.map((acompanhante: any, index: number) => (
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
              
              {currentSchedulingDetails.type === 'entrega-liberacao' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div><strong>Motorista:</strong> {currentSchedulingDetails.data?.nomeMotorista || 'N/A'}</div>
                  <div><strong>Empresa:</strong> {currentSchedulingDetails.data?.empresa || 'N/A'}</div>
                  <div><strong>Identidade/CPF:</strong> {currentSchedulingDetails.data?.identidade || currentSchedulingDetails.data?.cpf || 'N/A'}</div>
                  <div><strong>Tipo Veículo:</strong> {currentSchedulingDetails.data?.tipoVeiculo || 'N/A'}</div>
                  <div><strong>Placa:</strong> {currentSchedulingDetails.data?.placa || 'N/A'}</div>
                  <div><strong>Data:</strong> {currentSchedulingDetails.data?.dia || 'N/A'}</div>
                  <div><strong>Horário:</strong> {currentSchedulingDetails.data?.horario || 'N/A'}</div>
                  <div className="md:col-span-2"><strong>Motivo Entrega:</strong> {currentSchedulingDetails.data?.motivoEntrega || 'N/A'}</div>
                  <div><strong>Portaria:</strong> {currentSchedulingDetails.data?.portariaAcesso || 'N/A'}</div>
                </div>
              )}
              
              {currentSchedulingDetails.type === 'integracao' && (
                <div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><strong>Nome:</strong> {currentSchedulingDetails.data?.nomeCompleto || 'N/A'}</div>
                    <div><strong>Empresa:</strong> {currentSchedulingDetails.data?.empresa || 'N/A'}</div>
                    <div><strong>CPF:</strong> {currentSchedulingDetails.data?.cpf || 'N/A'}</div>
                    <div><strong>RG:</strong> {currentSchedulingDetails.data?.rg || 'N/A'}</div>
                  </div>
                  
                  {/* Exibir informações dos integrantes se existirem */}
                  {currentSchedulingDetails.data?.integrantes && 
                    Array.isArray(currentSchedulingDetails.data.integrantes) && 
                    currentSchedulingDetails.data.integrantes.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Integrantes ({currentSchedulingDetails.data.integrantes.length}):</h4>
                      <div className="space-y-3">
                        {currentSchedulingDetails.data.integrantes.map((integrante: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div><strong>Nome:</strong> {integrante.nomeCompleto || 'N/A'}</div>
                              <div><strong>Empresa:</strong> {integrante.empresa || 'N/A'}</div>
                              <div><strong>RG:</strong> {integrante.rg || 'N/A'}</div>
                              <div><strong>CPF:</strong> {integrante.cpf || 'N/A'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {currentSchedulingDetails.type === 'acesso-antecipado' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div><strong>Nome:</strong> {currentSchedulingDetails.data?.nomeCompleto || 'N/A'}</div>
                  <div><strong>Empresa:</strong> {currentSchedulingDetails.data?.empresa || 'N/A'}</div>
                  <div><strong>CPF:</strong> {currentSchedulingDetails.data?.cpf || 'N/A'}</div>
                  <div><strong>Atividade Fim de Semana:</strong> {currentSchedulingDetails.data?.atividadeFimDeSemana ? 'Sim' : 'Não'}</div>
                  <div><strong>Responsável Acompanhamento:</strong> {currentSchedulingDetails.data?.responsavelAcompanhamento || 'N/A'}</div>
                  <div><strong>Técnico Segurança Participa:</strong> {currentSchedulingDetails.data?.tecnicoSegurancaParticipa ? 'Sim' : 'Não'}</div>
                  <div><strong>Liberacao Fora Turno:</strong> {currentSchedulingDetails.data?.liberacaoForaTurno ? 'Sim' : 'Não'}</div>
                  <div><strong>Data Liberação:</strong> {currentSchedulingDetails.data?.dataLiberacao || 'N/A'}</div>
                  <div><strong>Horário Chegada:</strong> {currentSchedulingDetails.data?.horarioChegada || 'N/A'}</div>
                  <div><strong>Horário Saída:</strong> {currentSchedulingDetails.data?.horarioSaida || 'N/A'}</div>
                  <div><strong>Portaria:</strong> {currentSchedulingDetails.data?.portariaAcesso || 'N/A'}</div>
                  <div className="md:col-span-2"><strong>Motivo da Liberação:</strong> {currentSchedulingDetails.data?.motivoLiberacao || 'N/A'}</div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <div><strong>Observações:</strong> {currentSchedulingDetails.observacoes || 'Nenhuma'}</div>
                {currentSchedulingDetails.reviewedAt && (
                  <div><strong>Revisado em:</strong> {new Date(currentSchedulingDetails.reviewedAt).toLocaleString('pt-BR')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSolicitante;