// Restore original imports using project alias and remove namespace React import
import { useAuth } from '@/contexts/AuthContext';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

// Interface auxiliar para os dados de integração na lista
interface IntegrationItem {
  nomeCompleto: string;
  empresa: string;
  rg: string;
  cpf: string;
}

const DashboardSolicitante = () => {
  const { user, logout, users } = useAuth();
  const { getSchedulingsByUser, addScheduling } = useScheduling();
  const navigate = useNavigate();

  // Obter as solicitações do usuário atual
  const userSchedulings = user ? getSchedulingsByUser(user.id) : [];

  // Função auxiliar para obter o nome do solicitante com base no tipo
  const getSchedulingName = (scheduling: any) => {
    // MODIFICAÇÃO: Para 'integracao', mostra o número de pessoas ou 'Solicitação de Integração'
    if (scheduling.type === 'servicos-avulsos') {
      return scheduling.data?.nomeFuncionario || 'Solicitação';
    } else if (scheduling.type === 'visitas') {
      return scheduling.data?.nomeCompleto || 'Solicitação';
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

  // NOVO ESTADO: Lista de Integrantes para o tipo 'integracao'
  const [integrationList, setIntegrationList] = useState<IntegrationItem[]>([]);
  // NOVO ESTADO: opção para manter campos após adicionar integrante
  const [keepIntegrantFields, setKeepIntegrantFields] = useState(false);

  // Contar status
  const pendentes = userSchedulings.filter(s => s.status === 'pendente').length;
  const aprovados = userSchedulings.filter(s => s.status === 'aprovado').length;
  const reprovados = userSchedulings.filter(s => s.status === 'reprovado').length;
  const cancelados = userSchedulings.length - pendentes - aprovados - reprovados;

  // FUNÇÃO AUXILIAR: Resetar estados do modal
  const resetModalStates = () => {
    setShowNewSolicitationModal(false);
    setSolicitationType('');
    setSolicitationData({});
    setSolicitationName('');
    setSolicitationCompany('');
    setIntegrationList([]); // Resetar a lista também
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
    } else if (solicitationType === 'visitas') {
      data = {
        nomeCompleto: solicitationName,
        empresaVisitante: solicitationCompany,
        ...solicitationData
      };
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

  // FUNÇÃO MODIFICADA: Renderizar Modal
  const renderNewSolicitationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                    <div className="flex-1">
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
                            'bg-red-100 text-red-800'
                          } px-2 py-1 rounded text-xs font-medium`}>
                          {scheduling.status === 'pendente' ? 'PENDENTE' :
                            scheduling.status === 'aprovado' ? 'APROVADO' : 'REPROVADO'}
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
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => alert(`Editar solicitação: ${getSchedulingName(scheduling)}`)}
                      >
                        📝 Editar
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja cancelar esta solicitação?')) {
                            alert('Solicitação cancelada');
                          }
                        }}
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
    </div>
  );
};

export default DashboardSolicitante;