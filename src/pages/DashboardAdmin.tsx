import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import '../assets/Loading.css';

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
  const { user, logout, users, addUser, adminAddUser, updateUser, updateUserPassword, deleteUser, fetchUsers, fetchLogs, fetchStatistics, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mantendo os estados que não são redundantes
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false); // Removed showConfigModal
  const [logs, setLogs] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({ accessCount: 0, scheduleCount: 0, pendingCount: 0 });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch logs when component mounts and user is admin
  useEffect(() => {
    const loadLogs = async () => {
      if (user?.role === 'admin' || user?.role === 'diretoria') {
        setLoadingLogs(true);
        try {
          const logsData = await fetchLogs(20); // Fetch 20 most recent logs
          setLogs(logsData);
        } catch (error) {
          console.error('Error fetching logs:', error);
        } finally {
          setLoadingLogs(false);
        }
      } else {
        setLogs([]); // Clear logs if not admin/diretoria
      }
    };

    loadLogs();
  }, [user, fetchLogs]);

  // Fetch statistics when component mounts and user is admin
  useEffect(() => {
    const loadStats = async () => {
      if (user?.role === 'admin' || user?.role === 'diretoria') {
        setLoadingStats(true);
        try {
          const statsData = await fetchStatistics();
          setStatistics(statsData);
        } catch (error) {
          console.error('Error fetching statistics:', error);
        } finally {
          setLoadingStats(false);
        }
      } else {
        setStatistics({ accessCount: 0, scheduleCount: 0, pendingCount: 0 }); // Reset stats if not admin/diretoria
      }
    };

    loadStats();
  }, [user, fetchStatistics]);

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
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);

    try {
      // Validação de Role
      if (!['admin', 'diretoria', 'solicitante', 'portaria'].includes(newUser.role as string)) {
        alert('Selecione um Perfil de Acesso válido.');
        setIsSubmitting(false);
        return;
      }

      let successMessage = '';

      if (editingUser) {
        // Lógica de ATUALIZAÇÃO
        // Se uma nova senha foi fornecida, atualizar também a senha
        if (newUser.password && newUser.password.length >= 6) {
          try {
            await updateUserPassword(editingUser.id, newUser.password);
          } catch (passwordError) {
            console.error('Erro ao atualizar senha:', passwordError);
            alert('Erro ao atualizar senha: ' + (passwordError as Error).message);
            setIsSubmitting(false);
            return;
          }
        } else if (newUser.password && newUser.password.length > 0 && newUser.password.length < 6) {
          alert('A senha deve ter pelo menos 6 caracteres');
          setIsSubmitting(false);
          return;
        }

        // Atualizar informações do perfil
        await updateUser(
          editingUser.id,
          {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role as UserRole
          }
        );

        successMessage = `Usuário ${newUser.name} atualizado com sucesso!`;

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

        successMessage = `Novo usuário criado: ${newUser.name} (${newUser.email})`;
      }

      // Exibir mensagem de sucesso
      toast({
        title: "Sucesso!",
        description: successMessage,
      });

      // Limpar estados e fechar o formulário
      handleCloseNewUserForm();

      // Atualizar a lista de usuários em segundo plano
      setTimeout(() => {
        fetchUsers().catch(fetchError => {
          console.error('Erro ao atualizar lista de usuários:', fetchError);
        });
      }, 100); // Pequeno delay para garantir que o formulário é fechado primeiro

    } catch (error: any) {
      console.error('Erro ao processar usuário:', error);
      // Mensagem de erro mais amigável
      toast({
        title: "Erro!",
        description: `Erro: ${error.message?.includes('already exists') ? 'Este e-mail já está em uso.' : error.message || 'Ocorreu um erro desconhecido.'}`,
        variant: "destructive",
      });
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

        toast({
          title: "Sucesso!",
          description: 'Usuário deletado com sucesso!',
        });
      } catch (err: any) {
        console.error('Erro ao deletar usuário:', err);
        toast({
          title: "Erro!",
          description: `Erro ao deletar usuário: ${err.message || 'Ocorreu um erro desconhecido'}`,
          variant: "destructive",
        });
      } finally {
        // Atualizar a lista de usuários após exclusão para garantir atualização
        fetchUsers().catch(fetchError => {
          console.error('Erro ao atualizar lista de usuários:', fetchError);
        });
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
          <p className="text-gray-800">Bem-vindo, <span className="font-semibold">{user?.name || 'Administrador'}</span>. Seu perfil: <span className="font-semibold text-purple-600">{user?.role?.toUpperCase()}</span></p>
        </div>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Sair</button>
      </div>

      {/* Menu de Administração */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div
          className="bg-white rounded-lg shadow-lg p-6 card-hover cursor-pointer border-l-4 border-blue-500 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
          onClick={() => setShowNewUserForm(true)} // Ação: Abrir o formulário de NOVO usuário
        >
          <div className="flex items-center">
            <span className="text-3xl mr-4">➕</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Criar Novo Usuário</h3>
              <p className="text-gray-800 text-sm">Adicionar um novo acesso ao sistema</p>
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
              <p className="text-gray-800 text-sm">Logs e históricos completos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais (Atualizado para mostrar estatísticas reais do banco de dados) */}
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border-2 border-gray-400 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {loadingStats ? '...' : users.reduce((count, user) => user.user.role === 'admin' ? count + 1 : count, 0)}
          </div>
          <div className="text-xs text-gray-800">Administradores</div>
        </div>
        <div className="bg-white border-2 border-gray-400 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {loadingStats ? '...' : users.reduce((count, user) => user.user.role === 'diretoria' ? count + 1 : count, 0)}
          </div>
          <div className="text-xs text-gray-800">Diretores</div>
        </div>
        <div className="bg-white border-2 border-gray-400 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {loadingStats ? '...' : users.reduce((count, user) => user.user.role === 'solicitante' ? count + 1 : count, 0)}
          </div>
          <div className="text-xs text-gray-800">Solicitantes</div>
        </div>
        <div className="bg-white border-2 border-gray-400 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {loadingStats ? '...' : users.reduce((count, user) => user.user.role === 'portaria' ? count + 1 : count, 0)}
          </div>
          <div className="text-xs text-gray-800">Portaria</div>
        </div>
        <div className="bg-white border-2 border-gray-400 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {loadingStats ? '...' : statistics.scheduleCount}
          </div>
          <div className="text-xs text-gray-800">Agendamentos</div>
        </div>
      </div>

      {/* Gerenciamento de Usuários (Tabela no Dashboard) */}
      <div className="bg-white border-2 border-gray-400 rounded-lg shadow mb-6">
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

      {/* Logs do Sistema (Atualizado para mostrar logs reais do banco de dados) */}
      <div className="bg-white border-2 border-gray-400 rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">📋 Logs Recentes do Sistema</h3>
        </div>
        <div className="p-6">
          {loadingLogs ? (
            <div className="text-center py-4">Carregando logs...</div>
          ) : logs.length > 0 ? (
            <div className="space-y-3 text-sm">
              {logs.slice(0, 4).map((log, index) => { // Show only first 4 logs
                // Format the date to show only date and time
                const date = new Date(log.created_at);
                const formattedDate = date.toLocaleString('pt-BR');

                // Determine color based on action type
                let bgColor = 'bg-gray-50';
                let icon = 'ℹ️';

                if (log.action === 'LOGIN') {
                  bgColor = 'bg-green-50';
                  icon = '✅';
                } else if (log.action === 'LOGOUT') {
                  bgColor = 'bg-yellow-50';
                  icon = '🚪';
                } else if (log.action === 'CREATE_USER') {
                  bgColor = 'bg-blue-50';
                  icon = '🆕';
                } else if (log.action === 'UPDATE_USER') {
                  bgColor = 'bg-purple-50';
                  icon = '✏️';
                } else if (log.action === 'DELETE_USER') {
                  bgColor = 'bg-red-50';
                  icon = '🗑️';
                }

                return (
                  <div key={log.id || index} className={`flex justify-between items-center p-3 ${bgColor} rounded`}>
                    <span>{icon} {log.description}</span>
                    <span className="text-gray-500">{formattedDate}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">Nenhum log encontrado.</div>
          )}
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">🔒 Senha:</label>
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={editingUser ? "Deixe em branco para manter a senha atual" : "Digite uma nova senha"}
              />
              {!editingUser && <span className="text-xs text-gray-500">A senha deve ter pelo menos 6 caracteres</span>}
            </div>
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



  // renderReportsModal (Atualizado para mostrar logs reais do banco de dados e estatísticas reais)
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
              {loadingStats ? (
                <div className="text-2xl font-bold text-blue-600">...</div>
              ) : (
                <div className="text-2xl font-bold text-blue-600">{statistics.accessCount}</div>
              )}
            </div>
            <div className="bg-green-50 p-4 rounded-lg border">
              <h4 className="font-bold text-green-800 mb-2">Agendamentos</h4>
              {loadingStats ? (
                <div className="text-2xl font-bold text-green-600">...</div>
              ) : (
                <div className="text-2xl font-bold text-green-600">{statistics.scheduleCount}</div>
              )}
            </div>
            <div className="bg-red-50 p-4 rounded-lg border">
              <h4 className="font-bold text-red-800 mb-2">Pendências</h4>
              {loadingStats ? (
                <div className="text-2xl font-bold text-red-600">...</div>
              ) : (
                <div className="text-2xl font-bold text-red-600">{statistics.pendingCount}</div>
              )}
            </div>
          </div>

          <h4 className="text-lg font-bold text-gray-800 mb-4">📋 Logs Recentes do Sistema</h4>
          <div className="space-y-3 text-sm max-h-96 overflow-y-auto">
            {loadingLogs ? (
              <div className="text-center py-4">Carregando logs...</div>
            ) : logs.length > 0 ? (
              logs.map((log, index) => {
                // Format the date to show only date and time
                const date = new Date(log.created_at);
                const formattedDate = date.toLocaleString('pt-BR');

                // Determine color based on action type
                let bgColor = 'bg-gray-50';
                let icon = 'ℹ️';

                if (log.action === 'LOGIN') {
                  bgColor = 'bg-green-50';
                  icon = '✅';
                } else if (log.action === 'LOGOUT') {
                  bgColor = 'bg-yellow-50';
                  icon = '🚪';
                } else if (log.action === 'CREATE_USER') {
                  bgColor = 'bg-blue-50';
                  icon = '🆕';
                } else if (log.action === 'UPDATE_USER') {
                  bgColor = 'bg-purple-50';
                  icon = '✏️';
                } else if (log.action === 'DELETE_USER') {
                  bgColor = 'bg-red-50';
                  icon = '🗑️';
                }

                return (
                  <div key={log.id || index} className={`flex justify-between items-center p-3 ${bgColor} rounded`}>
                    <span>{icon} {log.description}</span>
                    <span className="text-gray-500">{formattedDate}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-gray-500">Nenhum log encontrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <div className="gradient-bg bg-gradient-to-br from-blue-300 to-blue-600 text-white py-6 relative z-10">
        <div className="max-w-6xl mx-auto px-44">
          <div className="main-container">
            <div className="Loading">
              <svg viewBox="-300 120 1400 255" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <defs>
                  <linearGradient id="chipGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d2d2d"></stop>
                    <stop offset="100%" stopColor="#0f0f0f"></stop>
                  </linearGradient>

                  <linearGradient id="textGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eeeeee"></stop>
                    <stop offset="100%" stopColor="#888888"></stop>
                  </linearGradient>

                  <linearGradient id="pinGradient" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="#bbbbbb"></stop>
                    <stop offset="50%" stopColor="#888888"></stop>
                    <stop offset="100%" stopColor="#555555"></stop>
                  </linearGradient>
                </defs>

                <g id="traces">
                  <path d="M100 100 H200 V210 H326" className="trace-bg"></path>
                  <path d="M100 100 H200 V210 H326" className="trace-flow purple"></path>

                  <path d="M80 180 H180 V230 H326" className="trace-bg"></path>
                  <path d="M80 180 H180 V230 H326" className="trace-flow blue"></path>

                  <path d="M60 260 H150 V250 H326" className="trace-bg"></path>
                  <path d="M60 260 H150 V250 H326" className="trace-flow yellow"></path>

                  <path d="M100 350 H200 V270 H326" className="trace-bg"></path>
                  <path d="M100 350 H200 V270 H326" className="trace-flow green"></path>

                  <path d="M700 90 H560 V210 H474" className="trace-bg"></path>
                  <path d="M700 90 H560 V210 H474" className="trace-flow blue"></path>

                  <path d="M740 160 H580 V230 H474" className="trace-bg"></path>
                  <path d="M740 160 H580 V230 H474" className="trace-flow green"></path>

                  <path d="M720 250 H590 V250 H474" className="trace-bg"></path>
                  <path d="M720 250 H590 V250 H474" className="trace-flow red"></path>

                  <path d="M680 340 H570 V270 H474" className="trace-bg"></path>
                  <path d="M680 340 H570 V270 H474" className="trace-flow yellow"></path>
                </g>

                <rect
                  x="330"
                  y="190"
                  width="140"
                  height="100"
                  rx="20"
                  ry="20"
                  fill="url(#chipGradient)"
                  stroke="#222"
                  strokeWidth="3"
                  filter="drop-shadow(0 0 6px rgba(0,0,0,0.8))"
                ></rect>

                <g>
                  <rect
                    x="322"
                    y="205"
                    width="8"
                    height="10"
                    fill="url(#pinGradient)"
                    rx="2"
                  ></rect>
                  <rect
                    x="322"
                    y="225"
                    width="8"
                    height="10"
                    fill="url(#pinGradient)"
                    rx="2"
                  ></rect>
                  <rect
                    x="322"
                    y="245"
                    width="8"
                    height="10"
                    fill="url(#pinGradient)"
                    rx="2"
                  ></rect>
                  <rect
                    x="322"
                    y="265"
                    width="8"
                    height="10"
                    fill="url(#pinGradient)"
                    rx="2"
                  ></rect>
                </g>

                <g>
                  <rect
                    x="470"
                    y="205"
                    width="8"
                    height="10"
                    fill="url(#pinGradient)"
                    rx="2"
                  ></rect>
                  <rect
                    x="470"
                    y="225"
                    width="8"
                    height="10"
                    fill="url(#pinGradient)"
                    rx="2"
                  ></rect>
                  <rect
                    x="470"
                    y="245"
                    width="8"
                    height="10"
                    fill="url(#pinGradient)"
                    rx="2"
                  ></rect>
                  <rect
                    x="470"
                    y="265"
                    width="8"
                    height="10"
                    fill="url(#pinGradient)"
                    rx="2"
                  ></rect>
                </g>

                <text
                  x="400"
                  y="240"
                  fontFamily="Arial, sans-serif"
                  fontSize="16"
                  fontWeight="bold"
                  fill="url(#textGradient)"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  AGENDAMENTOS
                </text>

                <circle cx="100" cy="100" r="5" fill="black"></circle>
                <circle cx="80" cy="180" r="5" fill="black"></circle>
                <circle cx="60" cy="260" r="5" fill="black"></circle>
                <circle cx="100" cy="350" r="5" fill="black"></circle>

                <circle cx="700" cy="90" r="5" fill="black"></circle>
                <circle cx="740" cy="160" r="5" fill="black"></circle>
                <circle cx="720" cy="250" r="5" fill="black"></circle>
                <circle cx="680" cy="340" r="5" fill="black"></circle>
              </svg>
            </div>
          </div>
        </div >
      </div >

      {/* Dashboard Content */}
      {renderAdminDashboard()}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">
            Design Visual e Site desenvolvido por <strong>Manuela Wendling</strong> | <strong>Full Arts Design</strong>
          </p>
        </div>
      </footer>

      {/* Modals */}
      {showNewUserForm && renderNewUserForm()}
      {showReportsModal && renderReportsModal()}
    </div >
  );

};

export default DashboardAdmin;