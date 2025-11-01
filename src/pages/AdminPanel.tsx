import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const { user, logout, users, deleteUser, fetchLogs, fetchStatistics } = useAuth();
  const navigate = useNavigate();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({ accessCount: 0, scheduleCount: 0, pendingCount: 0 });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Fetch logs when component mounts and user is admin
  useEffect(() => {
    const loadLogs = async () => {
      if (user?.role === 'admin') {
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
        setLogs([]); // Clear logs if not admin
      }
    };
    
    loadLogs();
  }, [user, fetchLogs]);
  
  // Fetch statistics when component mounts and user is admin
  useEffect(() => {
    const loadStats = async () => {
      if (user?.role === 'admin') {
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
        setStatistics({ accessCount: 0, scheduleCount: 0, pendingCount: 0 }); // Reset stats if not admin
      }
    };
    
    loadStats();
  }, [user, fetchStatistics]);

  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteUser(id);
        // Atualizar a lista de usuários após exclusão
        await fetchUsers();
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (confirmPassword !== 'mwf17') {
      alert('Senha incorreta!');
      return;
    }
    
    // Get all user IDs except the current admin
    const userIds = users
      .filter(u => u.user.id !== user.id) // Don't delete the current admin
      .map(u => u.user.id);
    
    try {
      // Delete each user
      for (const id of userIds) {
        await deleteUser(id);
      }
      
      // Atualizar a lista de usuários após exclusão
      await fetchUsers();
      alert('Todos os usuários de teste foram removidos!');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erro ao deletar usuários:', error);
      alert('Ocorreu um erro ao deletar os usuários');
    }
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
              <span className="text-4xl mr-3">🛡️</span>
              Painel Administrativo
            </h2>
            <p className="text-gray-600">Bem-vindo, <span className="font-semibold">{user?.name || 'Administrador'}</span></p>
          </div>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Sair</button>
        </div>

        {/* Menu de Administração */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 card-hover cursor-pointer border-l-4 border-blue-500">
            <div className="flex items-center">
              <span className="text-3xl mr-4">👥</span>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Gerenciar Usuários</h3>
                <p className="text-gray-600 text-sm">Criar, editar e remover usuários</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 card-hover cursor-pointer border-l-4 border-orange-500">
            <div className="flex items-center">
              <span className="text-3xl mr-4">📊</span>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Relatórios</h3>
                <p className="text-gray-600 text-sm">Logs e históricos completos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Gerais (Atualizado para mostrar estatísticas reais do banco de dados) */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {loadingStats ? '...' : users.reduce((count, user) => user.user.role === 'admin' ? count + 1 : count, 0)}
            </div>
            <div className="text-xs text-gray-600">Administradores</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {loadingStats ? '...' : users.reduce((count, user) => user.user.role === 'diretoria' ? count + 1 : count, 0)}
            </div>
            <div className="text-xs text-gray-600">Diretores</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {loadingStats ? '...' : users.reduce((count, user) => user.user.role === 'solicitante' ? count + 1 : count, 0)}
            </div>
            <div className="text-xs text-gray-600">Solicitantes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {loadingStats ? '...' : users.reduce((count, user) => user.user.role === 'portaria' ? count + 1 : count, 0)}
            </div>
            <div className="text-xs text-gray-600">Portaria</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {loadingStats ? '...' : statistics.scheduleCount}
            </div>
            <div className="text-xs text-gray-600">Agendamentos</div>
          </div>
        </div>

        {/* Gerenciamento de Usuários */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">👥 Gerenciamento de Usuários</h3>
            <button 
              onClick={() => navigate('/dashboard')} // For now, link to dashboard where the modal exists
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">➕ Novo Usuário</button>
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
                  {users.map((userRecord) => (
                    <tr key={userRecord.user.id}>
                      <td className="px-4 py-2">{userRecord.user.name}</td>
                      <td className="px-4 py-2">{userRecord.user.email}</td>
                      <td className="px-4 py-2">
                        <span className={`${
                          userRecord.user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
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
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs mr-1">✏️</button>
                        <button 
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                          onClick={() => handleDeleteUser(userRecord.user.id)}
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

        {/* Seção de Gerenciamento de Usuários */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold text-gray-800">🧹 Gerenciar Todos os Usuários</h3>
            <p className="text-sm text-gray-600 mt-1">Excluir todos os usuários de teste de uma vez</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="pt-4 border-t mt-4">
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Você está prestes a excluir TODOS os usuários de teste do sistema, exceto você mesmo. Esta ação é irreversível!
                  </p>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Digite sua senha para confirmar:</label>
                    <input
                      type="password"
                      placeholder="Digite: mwf17"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button 
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold"
                    onClick={handleDeleteAll}
                  >
                    🧹 Apagar Todos os Usuários de Teste
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Funcionalidades do Superusuário */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold text-gray-800">Funcionalidades do Superusuário</h3>
          </div>
          <div className="p-6">
            <div className="space-y-2 text-sm">
              <p>✅ Acesso total ao sistema e todos os dados</p>
              <p>✅ Criação e remoção de logins da Diretoria</p>
              <p>✅ Gerenciamento completo de usuários</p>
              <p>✅ Visualização de todos os agendamentos</p>
              <p>✅ Acesso aos logs e estatísticas gerais</p>
              <p>✅ Configuração de regras do sistema</p>
              <p>✅ Reset de senha de qualquer perfil</p>
              <p>✅ Backup e exportação de dados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">Design Visual e Site desenvolvido por <strong>Manuela Wendling</strong> | <strong>Full Arts Design</strong></p>
        </div>
      </footer>
    </div>
  );
}
