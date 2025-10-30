import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SchedulingProvider } from "./contexts/SchedulingContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardDiretor from "./pages/DashboardDiretor";
import DashboardSolicitante from "./pages/DashboardSolicitante";
import DashboardPortaria from "./pages/DashboardPortaria";
import RoleBasedDashboard from "./pages/RoleBasedDashboard";
import AdminPanel from "./pages/AdminPanel";
import ApprovalPanel from "./pages/ApprovalPanel";
import PortariaPanel from "./pages/PortariaPanel";
import NotFound from "./pages/NotFound";
import ServicosAvulsosForm from "./components/scheduling/ServicosAvulsosForm";
import AcessoAntecipadoForm from "./components/scheduling/AcessoAntecipadoForm";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  console.log('ProtectedRoute - user:', user, 'isLoading:', isLoading);
  
  // Show loading while checking authentication state
  if (isLoading) {
    return <div className="text-center p-10">Carregando...</div>;
  }
  
  // If authenticated (user exists), render children, otherwise redirect to login
  return user ? <>{children}</> : <Navigate to="/login" />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SchedulingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><RoleBasedDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/admin" element={<ProtectedRoute><DashboardAdmin /></ProtectedRoute>} />
              <Route path="/dashboard/diretor" element={<ProtectedRoute><DashboardDiretor /></ProtectedRoute>} />
              <Route path="/dashboard/solicitante" element={<ProtectedRoute><DashboardSolicitante /></ProtectedRoute>} />
              <Route path="/dashboard/portaria" element={<ProtectedRoute><DashboardPortaria /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
              <Route path="/aprovacoes" element={<ProtectedRoute><ApprovalPanel /></ProtectedRoute>} />
              <Route path="/portaria" element={<ProtectedRoute><PortariaPanel /></ProtectedRoute>} />
              <Route path="/agendar/servicos-avulsos" element={<ProtectedRoute><ServicosAvulsosForm /></ProtectedRoute>} />
              <Route path="/agendar/acesso-antecipado" element={<ProtectedRoute><AcessoAntecipadoForm /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SchedulingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
