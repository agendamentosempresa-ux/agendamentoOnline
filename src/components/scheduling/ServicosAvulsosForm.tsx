import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function ServicosAvulsosForm() {
  const { user } = useAuth();
  const { addScheduling } = useScheduling();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nomeFuncionario: '',
    cpf: '',
    possuiIntegracao: false,
    telefone: '',
    responsavelHSSE: '',
    numeroAPR: '',
    empresaPrestadora: '',
    motivoServico: '',
    responsavelServico: '',
    dataInicio: '',
    horaInicio: '',
    dataTermino: '',
    horaTermino: '',
    liberacaoRefeitorio: false,
    marcaVeiculo: '',
    modeloVeiculo: '',
    placaVeiculo: '',
    habilitacaoEspecial: false,
    portariaAcesso: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    addScheduling({
      type: 'servicos-avulsos',
      requestedBy: user.id,
      requestedByName: user.name,
      data: formData,
    });

    toast.success('Agendamento solicitado com sucesso!');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🔧 Agendamento de Serviços Avulsos</CardTitle>
            <CardDescription>
              Para serviços com tempo de execução inferior a 4 horas e caráter emergencial ou excepcional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeFuncionario">👤 Nome completo do funcionário *</Label>
                  <Input
                    id="nomeFuncionario"
                    required
                    value={formData.nomeFuncionario}
                    onChange={(e) => setFormData({ ...formData, nomeFuncionario: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">📄 CPF *</Label>
                  <Input
                    id="cpf"
                    required
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="possuiIntegracao">🔄 Possui integração? *</Label>
                  <Select
                    value={formData.possuiIntegracao ? 'sim' : 'nao'}
                    onValueChange={(value) => setFormData({ ...formData, possuiIntegracao: value === 'sim' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">📞 Telefone do prestador *</Label>
                  <Input
                    id="telefone"
                    required
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavelHSSE">🛡️ Responsável HSSE *</Label>
                  <Input
                    id="responsavelHSSE"
                    required
                    value={formData.responsavelHSSE}
                    onChange={(e) => setFormData({ ...formData, responsavelHSSE: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroAPR">🧾 Número APR *</Label>
                  <Input
                    id="numeroAPR"
                    required
                    value={formData.numeroAPR}
                    onChange={(e) => setFormData({ ...formData, numeroAPR: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresaPrestadora">🏢 Empresa prestadora *</Label>
                  <Input
                    id="empresaPrestadora"
                    required
                    value={formData.empresaPrestadora}
                    onChange={(e) => setFormData({ ...formData, empresaPrestadora: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavelServico">👨‍💼 Responsável pelo serviço *</Label>
                  <Input
                    id="responsavelServico"
                    required
                    value={formData.responsavelServico}
                    onChange={(e) => setFormData({ ...formData, responsavelServico: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataInicio">🗓️ Data de início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    required
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaInicio">⏰ Hora de início *</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    required
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataTermino">🗓️ Data de término *</Label>
                  <Input
                    id="dataTermino"
                    type="date"
                    required
                    value={formData.dataTermino}
                    onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaTermino">⏰ Hora de término *</Label>
                  <Input
                    id="horaTermino"
                    type="time"
                    required
                    value={formData.horaTermino}
                    onChange={(e) => setFormData({ ...formData, horaTermino: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="liberacaoRefeitorio">🍽️ Liberação do refeitório *</Label>
                  <Select
                    value={formData.liberacaoRefeitorio ? 'sim' : 'nao'}
                    onValueChange={(value) => setFormData({ ...formData, liberacaoRefeitorio: value === 'sim' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marcaVeiculo">🚗 Marca do veículo</Label>
                  <Input
                    id="marcaVeiculo"
                    value={formData.marcaVeiculo}
                    onChange={(e) => setFormData({ ...formData, marcaVeiculo: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modeloVeiculo">🚙 Modelo do veículo</Label>
                  <Input
                    id="modeloVeiculo"
                    value={formData.modeloVeiculo}
                    onChange={(e) => setFormData({ ...formData, modeloVeiculo: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placaVeiculo">🔢 Placa do veículo</Label>
                  <Input
                    id="placaVeiculo"
                    value={formData.placaVeiculo}
                    onChange={(e) => setFormData({ ...formData, placaVeiculo: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="habilitacaoEspecial">📘 Habilitação especial?</Label>
                  <Select
                    value={formData.habilitacaoEspecial ? 'sim' : 'nao'}
                    onValueChange={(value) => setFormData({ ...formData, habilitacaoEspecial: value === 'sim' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portariaAcesso">🚧 Portaria de acesso *</Label>
                  <Input
                    id="portariaAcesso"
                    required
                    value={formData.portariaAcesso}
                    onChange={(e) => setFormData({ ...formData, portariaAcesso: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivoServico">🛠️ Motivo do serviço (emergencial/excepcional) *</Label>
                <Textarea
                  id="motivoServico"
                  required
                  rows={4}
                  value={formData.motivoServico}
                  onChange={(e) => setFormData({ ...formData, motivoServico: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">Enviar Solicitação</Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
