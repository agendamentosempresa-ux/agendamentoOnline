import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

// ✅ Import da imagem (ajuste conforme o caminho real)
import Logo from '@/assets/petronas.png';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('Index page - isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('User is authenticated, navigating to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-secondary flex items-center justify-center p-4">
      <div className="text-center text-white max-w-2xl">
        <div className="mb-8 flex justify-center">
          {/* 🔥 Círculo perfeito com imagem centralizada */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <img
              src={Logo}
              alt="Logo Petronas"
              className="w-full h-full object-contain object-center"
            />
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-4">Sistema de Agendamentos</h1>
        <h2 className="text-2xl mb-6 opacity-90">PETRONAS</h2>
        <p className="text-xl mb-8 opacity-80">
          Gerencie agendamentos de serviços, visitas, entregas e treinamentos
        </p>

        <div className="space-y-4">
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
            onClick={() => navigate('/login')}
          >
            Acessar Sistema
          </Button>
        </div>

        <footer className="mt-16 text-sm opacity-75">
          <p>Design Visual e Site desenvolvido por Manuela Wendling | Full Arts Design</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
