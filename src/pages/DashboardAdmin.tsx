import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 1. Definição de Tipos para garantir type-safety e clareza
type UserRole = 'admin' | 'diretoria' | 'solicitante' | 'portaria';

type EditingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
} | null;

type NewUserState = {
  name: string;
  email: string;
  password: string;
  role: string;
};

const DashboardAdmin = () => {
  // Assumindo que addUser e deleteUser usam a SERVICE_ROLE_KEY no AuthContext
  const { user, logout, users, addUser, adminAddUser, updateUser, deleteUser, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // Mantendo os estados que não são redundantes
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Inicializa o estado com o tipo correto
  const [newUser, setNewUser] = useState<NewUserState>({ name: '', email: '', password: '', role: '' });
  const [editingUser, setEditingUser] = useState<EditingUser>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para evitar múltiplos cliques

  // 2. CORREÇÃO: Lógica de Acesso (Segurança)
  const isAdminOrDirector = user?.role === 'admin' || user?.role === 'diretoria';
  if (!isAuthLoading && user && !isAdminOrDirector) {
    navigate('/dashboard');
    return null;
  }
  if (isAuthLoading) {
    return <div className="text-center p-10">Carregando autenticação...</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 3. NOVO: Função para pré-popular o formulário de edição
  const handleEditClick = (userRecord: { user: { id: string, name: string, email: string, role: string } }) => {
    setEditingUser(userRecord.user as EditingUser);
    setNewUser({
      name: userRecord.user.name,
      email: userRecord.user.email,
      password: '', // Senha não deve ser pré-preenchida
      role: userRecord.user.role
    });
    setShowNewUserForm(true);
  };

  // 4. NOVO: Função para fechar e resetar o modal
  const handleCloseNewUserForm = () => {
    setShowNewUserForm(false);
    setEditingUser(null);
    setNewUser({ name: '', email: '', password: '', role: '' });
  };

  // 5. CORREÇÃO CRÍTICA: Lógica de Submissão do Formulário (Assíncrona e com tipagem)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validação de Role
      if (!['admin', 'diretoria', 'solicitante', 'portaria'].includes(newUser.role as string)) {
        alert('Selecione um Perfil de Acesso válido.');
        setIsSubmitting(false);
        return;
      }

      if (editingUser) {
        // Lógica de ATUALIZAÇÃO

        // Nota: O updateUser recebe o ID e um objeto de updates.
        await updateUser(
          editingUser.id,
          {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role as UserRole
          }
        );

        alert(`Usuário ${newUser.name} atualizado com sucesso!`);

      } else {
        // Lógica de CRIAÇÃO
        if (newUser.password.length < 6) {
          alert('A senha deve ter pelo menos 6 caracteres');
          setIsSubmitting(false);
          return;
        }

        await adminAddUser(
          newUser.name,
          newUser.email,
          newUser.password,
          newUser.role as UserRole
        );

        alert(`Novo usuário criado: ${newUser.name} (${newUser.email})`);
      }

      // Limpar estados
      handleCloseNewUserForm();

    } catch (error: any) {
      console.error('Erro ao processar usuário:', error);
      // Mensagem de erro mais amigável
      alert(`Erro: ${error.message.includes('already exists') ? 'Este e-mail já está em uso.' : error.message || 'Ocorreu um erro desconhecido.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. CORREÇÃO: Lógica de Deleção de Usuário (Assíncrona)
  const handleDeleteUser = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${name}? Esta ação é irreversível.`)) {
      try {
        // deleteUser é uma função assíncrona, precisa de await.
        await deleteUser(id);
        alert('Usuário deletado com sucesso!');
      } catch (err: any) {
        console.error('Erro ao deletar usuário:', err);
        alert(`Erro ao deletar usuário: ${err.message || 'Ocorreu um erro desconhecido'}`);
      }
    }
  };

  const renderAdminDashboard = () => (
    <div id="dashboard-admin" className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <span className="text-4xl mr-3">🛡️</span>
            Painel Administrativo
          </h2>
          <p className="text-gray-600">Bem-vindo, <span className="font-semibold">{user?.name || 'Administrador'}</span>. Seu perfil: <span className="font-semibold text-purple-600">{user?.role?.toUpperCase()}</span></p>
        </div>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Sair</button>
      </div>

      {/* Menu de Administração */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div
          className="bg-white rounded-lg shadow-lg p-6 card-hover cursor-pointer border-l-4 border-blue-500 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
          onClick={() => setShowNewUserForm(true)} // Ação: Abrir o formulário de NOVO usuário
        >
          <div className="flex items-center">
            <span className="text-3xl mr-4">➕</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Criar Novo Usuário</h3>
              <p className="text-gray-600 text-sm">Adicionar um novo acesso ao sistema</p>
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-lg shadow-lg p-6 card-hover cursor-pointer border-l-4 border-green-500 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
          onClick={() => setShowConfigModal(true)}
        >
          <div className="flex items-center">
            <span className="text-3xl mr-4">⚙️</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Configurações</h3>
              <p className="text-gray-600 text-sm">Parâmetros do sistema</p>
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-lg shadow-lg p-6 card-hover cursor-pointer border-l-4 border-orange-500 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
          onClick={() => setShowReportsModal(true)}
        >
          <div className="flex items-center">
            <span className="text-3xl mr-4">📊</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Relatórios</h3>
              <p className="text-gray-600 text-sm">Logs e históricos completos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais (Mantido) */}
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">1</div>
          <div className="text-xs text-gray-600">Administradores</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">3</div>
          <div className="text-xs text-gray-600">Diretores</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">15</div>
          <div className="text-xs text-gray-600">Solicitantes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">8</div>
          <div className="text-xs text-gray-600">Portaria</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">127</div>
          <div className="text-xs text-gray-600">Agendamentos</div>
        </div>
      </div>

      {/* Gerenciamento de Usuários (Tabela no Dashboard) */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">👥 Gerenciamento de Usuários ({users.length})</h3>
          <button
            onClick={() => setShowNewUserForm(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">➕ Novo Usuário</button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">E-mail</th>
                  <th className="px-4 py-2 text-left">Perfil</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(users || []).map((userRecord) => (
                  <tr key={userRecord.user.id}>
                    <td className="px-4 py-2">{userRecord.user.name}</td>
                    <td className="px-4 py-2">{userRecord.user.email}</td>
                    <td className="px-4 py-2">
                      <span className={`${userRecord.user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        userRecord.user.role === 'diretoria' ? 'bg-red-100 text-red-800' :
                          userRecord.user.role === 'solicitante' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                        } px-2 py-1 rounded text-xs`}>
                        {userRecord.user.role === 'admin' ? '🛡️ Admin' :
                          userRecord.user.role === 'diretoria' ? '👔 Diretoria' :
                            userRecord.user.role === 'solicitante' ? '🧑‍💼 Solicitante' : '🛂 Portaria'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Ativo</span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs mr-1"
                        onClick={() => handleEditClick(userRecord)} // Chamando a nova função
                      >
                        ✏️
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                        onClick={() => handleDeleteUser(userRecord.user.id, userRecord.user.name)} // Chamando a nova função async
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Logs do Sistema (Mantido) */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">📋 Logs Recentes do Sistema</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span>✅ Login realizado: joao.diretor@petronas.com</span>
              <span className="text-gray-500">25/01/2024 14:32</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span>📝 Agendamento aprovado: TechServ - Manutenção Emergencial</span>
              <span className="text-gray-500">25/01/2024 14:15</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span>🆕 Novo usuário criado: maria.techserv@empresa.com</span>
              <span className="text-gray-500">25/01/2024 13:45</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <span>❌ Agendamento reprovado: Visita sem documentação</span>
              <span className="text-gray-500">25/01/2024 13:20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 7. CORREÇÃO: renderNewUserForm usando a nova função de submissão e fechamento
  const renderNewUserForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{editingUser ? '✏️ Editar Usuário' : '👥 Criar Novo Usuário'}</h3>
            <button
              onClick={handleCloseNewUserForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleFormSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">👤 Nome Completo:</label>
              <input
                type="text"
                name="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">📧 E-mail:</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {!editingUser && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">🔒 Senha:</label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!editingUser}
                />
              </div>
            )}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">🎭 Perfil de Acesso:</label>
              <select
                name="role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione o perfil...</option>
                <option value="admin">🛡️ Admin</option>
                <option value="diretoria">👔 Diretoria</option>
                <option value="solicitante">🧑‍💼 Solicitante</option>
                <option value="portaria">🛂 Portaria</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? (editingUser ? 'Atualizando...' : 'Criando...') : (editingUser ? 'Atualizar Usuário' : '✅ Criar Usuário')}
              </button>
              <button
                type="button"
                onClick={handleCloseNewUserForm}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // renderConfigModal (Mantido, pois a lógica estava OK)
  const renderConfigModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">⚙️ Configurações do Sistema</h3>
          <button
            onClick={() => setShowConfigModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-bold text-lg mb-2">Acesso ao Sistema</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Permitir novos registros</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex justify-between items-center">
                  <span>Exigir confirmação de e-mail</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-bold text-lg mb-2">Notificações</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Enviar e-mail para novas solicitações</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex justify-between items-center">
                  <span>Enviar alerta para pendências</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-bold text-lg mb-2">Segurança</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Exigir senha forte</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex justify-between items-center">
                  <span>Registros de atividade</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              onClick={() => alert('Configurações salvas!')}
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // renderReportsModal (Mantido, pois a lógica estava OK)
  const renderReportsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">📊 Relatórios e Logs</h3>
          <button
            onClick={() => setShowReportsModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border">
              <h4 className="font-bold text-blue-800 mb-2">Acessos Hoje</h4>
              <div className="text-2xl font-bold text-blue-600">42</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border">
              <h4 className="font-bold text-green-800 mb-2">Agendamentos</h4>
              <div className="text-2xl font-bold text-green-600">127</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border">
              <h4 className="font-bold text-red-800 mb-2">Pendências</h4>
              <div className="text-2xl font-bold text-red-600">12</div>
            </div>
          </div>

          <h4 className="text-lg font-bold text-gray-800 mb-4">📋 Logs Recentes do Sistema</h4>
          <div className="space-y-3 text-sm max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span>✅ Login realizado: joao.diretor@petronas.com</span>
              <span className="text-gray-500">25/01/2024 14:32</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span>📝 Agendamento aprovado: TechServ - Manutenção Emergencial</span>
              <span className="text-gray-500">25/01/2024 14:15</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span>🆕 Novo usuário criado: maria.techserv@empresa.com</span>
              <span className="text-gray-500">25/01/2024 13:45</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <span>❌ Agendamento reprovado: Visita sem documentação</span>
              <span className="text-gray-500">25/01/2024 13:20</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span>✅ Login realizado: maria.solicitante@empresa.com</span>
              <span className="text-gray-500">25/01/2024 12:10</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span>📝 Agendamento solicitado: Entrega de equipamentos</span>
              <span className="text-gray-500">25/01/2024 11:45</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
              <span>🔐 Troca de senha: carlos.portaria@petronas.com</span>
              <span className="text-gray-500">25/01/2024 10:30</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span>⚠️ Acesso negado: CPF não consta na lista</span>
              <span className="text-gray-500">25/01/2024 09:15</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-bg bg-gradient-to-br from-blue-800 to-blue-600 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2">🏢 Sistema de Agendamentos PETRONAS</h1>
          <p className="text-center text-blue-100">Gestão Completa de Acessos e Autorizações</p>
        </div>
      </div>

      {/* Dashboard Content */}
      {renderAdminDashboard()}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">Design Visual e Site desenvolvido por <strong>Manuela Wendling</strong> | <strong>Full Arts Design</strong></p>
        </div>
      </footer>

      {/* Modals */}
      {/* 8. REMOÇÃO DE MODAL REDUNDANTE: renderUserModal foi removido. */}
      {showNewUserForm && renderNewUserForm()}
      {showConfigModal && renderConfigModal()}
      {showReportsModal && renderReportsModal()}
    </div>
  );
};

export default DashboardAdmin;