import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import '../Loader.css'; // Importa o CSS do loader

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    setIsLoading(true);
    setLoginAttempted(false); // Reset login attempt

    console.log('Attempting login with:', email);

    try {
      const success = await login(email, password);

      console.log('Login result:', success);

      if (success) {
        toast({
          title: "Login realizado com sucesso",
          description: "Redirecionando...",
        });
        // Set login as attempted and let useEffect handle navigation
        setLoginAttempted(true);

      } else {
        toast({
          title: "Erro ao fazer login",
          description: "Email ou senha inválidos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation after successful login and user state is updated
  useEffect(() => {
    if (loginAttempted && user) {
      console.log('User authenticated, navigating to dashboard...');
      navigate('/dashboard');
      setLoginAttempted(false); // Reset to prevent multiple navigations
    }
  }, [loginAttempted, user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com a classe 'title-glow' aplicada ao h1 */}
      <div className="gradient-bg bg-gradient-to-br from-blue-800 to-blue-600 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2 title-glow">📅 Sistema de Agendamentos</h1>
          <p className="text-center font-bold text-blue-100">Gestão Completa de Acessos e Autorizações</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {/* CORREÇÃO AQUI: Alterado p-8 para px-8 py-12 para AUMENTAR A ALTURA (EIXO Y) e adicionado relative */}
        <div className="bg-gray-300 rounded-lg shadow-lg px-8 py-12 relative border border-blue-500 rounded-lg">

          {/* CORREÇÃO AQUI: Loader posicionado ABSOLUTAMENTE no topo e centro do card */}
          <div
            className="loader"
            style={{
              position: 'absolute',
              top: '5px', // Posição vertical para mostrar a esfera completa
              left: '50%', // Move para o centro horizontal
              transform: 'translateX(-50%)', // Centraliza perfeitamente o loader
            }}
          >
            <svg width="100" height="100" viewBox="0 0 100 100">
              <defs>
                <mask id="clipping">
                  {/* RESTAURADO PARA 7 POLYGONS PARA QUE AS ANIMAÇÕES EM CSS FUNCIONEM */}
                  <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                  <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                  <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                  <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                  <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                  <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                  <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                </mask>
              </defs>
            </svg>
            <div className="box"></div>
          </div>

          {/* Adicionado margin-top (mt-[70px]) para criar espaço para a esfera */}
          <div className="text-center mb-6 mt-[70px]">
            <h2 className="text-2xl font-bold text-gray-800">Login de Acesso</h2>
            <p className="text-gray-600">Faça login para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Senha:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full max-w-full rounded-full transition "
            >
              <span className="block w-full text-center">
                {isLoading ? 'Entrando...' : 'Entrar'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full mt-3 max-w-full rounded-full transition "
            >
              <span className="block w-full text-center">
                ← Voltar
              </span>
            </button>

          </form>
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
};

export default Login;