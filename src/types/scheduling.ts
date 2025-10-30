export type SchedulingType =
  | 'servicos-avulsos'
  | 'entrega-liberacao'
  | 'visitas'
  | 'integracao'
  | 'acesso-antecipado';

export type SchedulingStatus = 'pendente' | 'aprovado' | 'reprovado';

export type CheckInStatus = 'autorizado' | 'negado' | 'nao-compareceu';

export interface BaseScheduling {
  id: string;
  type: SchedulingType;
  status: SchedulingStatus;
  solicitanteId: string;
  solicitanteEmail: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  observacoes?: string;
  requestedBy: string;
  requestedByName: string;
  checkInStatus?: CheckInStatus;
  checkInAt?: string;
}

export interface ServicosAvulsosData {
  nomeFuncionario: string;
  cpf: string;
  possuiIntegracao: boolean;
  telefone: string;
  responsavelHSSE: string;
  numeroAPR: string;
  empresaPrestadora: string;
  motivoServico: string;
  responsavelServico: string;
  dataInicio: string;
  horaInicio: string;
  dataTermino: string;
  horaTermino: string;
  liberacaoRefeitorio: boolean;
  marcaVeiculo?: string;
  modeloVeiculo?: string;
  placaVeiculo?: string;
  habilitacaoEspecial?: boolean;
  portariaAcesso: string;
}

export interface EntregaLiberacaoData {
  horario: string;
  dia: string;
  nomeMotorista: string;
  identidade: string;
  cpf: string;
  tipoVeiculo: string;
  placa: string;
  motivoEntrega: string;
  portariaAcesso: string;
}

export interface VisitasData {
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  empresaVisitante: string;
  motivoVisita: string;
  pessoaVisitada: string;
  dataVisita: string;
  previsaoChegada: string;
  previsaoSaida: string;
  liberacaoRefeitorio: boolean;
  marcaVeiculo?: string;
  modeloVeiculo?: string;
  placa?: string;
  portariaAcesso: string;
  consideradoComoVisita: string;
}

export interface IntegracaoData {
  nomeCompleto: string;
  rg: string;
  cpf: string;
  empresa: string;
  integrantes?: Array<{
    nomeCompleto: string;
    rg: string;
    cpf: string;
    empresa: string;
  }>;
}

export interface AcessoAntecipadoData {
  nomeCompleto: string;
  cpf: string;
  atividadeFimDeSemana: boolean;
  responsavelAcompanhamento: string;
  tecnicoSegurancaParticipa: boolean;
  liberacaoForaTurno: boolean;
  motivoForaTurno?: string;
  empresa: string;
  motivoLiberacao: string;
  dataLiberacao: string;
  horarioChegada: string;
  horarioSaida: string;
  portariaAcesso: string;
  acessoVeiculoPlanta: boolean;
  motivoAcessoVeiculo?: string;
  marcaVeiculo?: string;
  modeloVeiculo?: string;
  placa?: string;
}

export type SchedulingData =
  | ServicosAvulsosData
  | EntregaLiberacaoData
  | VisitasData
  | IntegracaoData
  | AcessoAntecipadoData;

export interface Scheduling extends BaseScheduling {
  data: SchedulingData;
}
