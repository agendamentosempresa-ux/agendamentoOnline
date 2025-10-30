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

export default function AcessoAntecipadoForm() {
  const { user } = useAuth();
  const { addScheduling } = useScheduling();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
    atividadeFimDeSemana: false,
    responsavelAcompanhamento: '',
    tecnicoSegurancaParticipa: false,
    liberacaoForaTurno: false,
    motivoForaTurno: '',
    empresa: '',
    motivoLiberacao: '',
    dataLiberacao: '',
    horarioChegada: '',
    horarioSaida: '',
    portariaAcesso: '',
    acessoVeiculoPlanta: false,
    motivoAcessoVeiculo: '',
    marcaVeiculo: '',
    modeloVeiculo: '',
    placa: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    addScheduling({
      type: 'acesso-antecipado',
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
            <CardTitle className="text-2xl">⏰ Liberação de Acesso Antecipado ou em Fins de Semana</CardTitle>
            <CardDescription>
              Para acesso em finais de semana ou fora do horário de turno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeCompleto">👤 Nome completo *</Label>
                  <Input
                    id="nomeCompleto"
                    required
                    value={formData.nomeCompleto}
                    onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
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
                  <Label htmlFor="atividadeFimDeSemana">📅 Atividade no fim de semana? *</Label>
                  <Select
                    value={formData.atividadeFimDeSemana ? 'sim' : 'nao'}
                    onValueChange={(value) => setFormData({ ...formData, atividadeFimDeSemana: value === 'sim' })}
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
                  <Label htmlFor="responsavelAcompanhamento">👥 Responsável acompanhante *</Label>
                  <Input
                    id="responsavelAcompanhamento"
                    required
                    value={formData.responsavelAcompanhamento}
                    onChange={(e) => setFormData({ ...formData, responsavelAcompanhamento: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tecnicoSeguranca">🦺 Técnico de segurança participará? *</Label>
                  <Select
                    value={formData.tecnicoSegurancaParticipa ? 'sim' : 'nao'}
                    onValueChange={(value) => setFormData({ ...formData, tecnicoSegurancaParticipa: value === 'sim' })}
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
                  <Label htmlFor="liberacaoForaTurno">⏱️ Liberação fora do turno? *</Label>
                  <Select
                    value={formData.liberacaoForaTurno ? 'sim' : 'nao'}
                    onValueChange={(value) => setFormData({ ...formData, liberacaoForaTurno: value === 'sim' })}
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
                  <Label htmlFor="empresa">🏢 Empresa *</Label>
                  <Input
                    id="empresa"
                    required
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataLiberacao">📅 Data da liberação *</Label>
                  <Input
                    id="dataLiberacao"
                    type="date"
                    required
                    value={formData.dataLiberacao}
                    onChange={(e) => setFormData({ ...formData, dataLiberacao: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horarioChegada">🕒 Horário de chegada *</Label>
                  <Input
                    id="horarioChegada"
                    type="time"
                    required
                    value={formData.horarioChegada}
                    onChange={(e) => setFormData({ ...formData, horarioChegada: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horarioSaida">🕕 Horário de saída *</Label>
                  <Input
                    id="horarioSaida"
                    type="time"
                    required
                    value={formData.horarioSaida}
                    onChange={(e) => setFormData({ ...formData, horarioSaida: e.target.value })}
                  />
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

                <div className="space-y-2">
                  <Label htmlFor="acessoVeiculo">🚗 Acesso de veículo? *</Label>
                  <Select
                    value={formData.acessoVeiculoPlanta ? 'sim' : 'nao'}
                    onValueChange={(value) => setFormData({ ...formData, acessoVeiculoPlanta: value === 'sim' })}
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
              </div>

              {formData.liberacaoForaTurno && (
                <div className="space-y-2">
                  <Label htmlFor="motivoForaTurno">🎯 Motivo para acessar fora do turno *</Label>
                  <Textarea
                    id="motivoForaTurno"
                    required
                    rows={3}
                    value={formData.motivoForaTurno}
                    onChange={(e) => setFormData({ ...formData, motivoForaTurno: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="motivoLiberacao">❓ Motivo da liberação *</Label>
                <Textarea
                  id="motivoLiberacao"
                  required
                  rows={3}
                  placeholder="Ex.: manutenção emergencial, ronda, etc."
                  value={formData.motivoLiberacao}
                  onChange={(e) => setFormData({ ...formData, motivoLiberacao: e.target.value })}
                />
              </div>

              {formData.acessoVeiculoPlanta && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="motivoAcessoVeiculo">📝 Motivo do acesso do veículo *</Label>
                    <Textarea
                      id="motivoAcessoVeiculo"
                      required
                      rows={2}
                      value={formData.motivoAcessoVeiculo}
                      onChange={(e) => setFormData({ ...formData, motivoAcessoVeiculo: e.target.value })}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marcaVeiculo">Marca *</Label>
                      <Input
                        id="marcaVeiculo"
                        required
                        value={formData.marcaVeiculo}
                        onChange={(e) => setFormData({ ...formData, marcaVeiculo: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modeloVeiculo">Modelo *</Label>
                      <Input
                        id="modeloVeiculo"
                        required
                        value={formData.modeloVeiculo}
                        onChange={(e) => setFormData({ ...formData, modeloVeiculo: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placa">Placa *</Label>
                      <Input
                        id="placa"
                        required
                        value={formData.placa}
                        onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

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
