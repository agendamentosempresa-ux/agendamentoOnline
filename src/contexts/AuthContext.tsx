// AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import { User } from '@supabase/supabase-js';
// Importa ambos os clientes
import { supabase, supabaseAdmin } from '../lib/supabaseClient';
import { UserRecord, UserRole } from '../lib/utils';

// --- TIPOS ---
interface LogRecord {
  id: string;
  user_name: string;
  user_email: string;
  user_role: UserRole;
  action: string;
  description: string;
  created_at: string;
}

interface Statistics {
  accessCount: number;
  scheduleCount: number;
  pendingCount: number;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  users: UserRecord[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  // NOVAS FUNÇÕES ADMIN
  adminAddUser: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  deleteUser: (id: string) => Promise<void>; // Função deleteUser existente
  // FUNÇÕES DE GESTÃO
  updateUser: (id: string, updates: { name?: string, email?: string, role?: UserRole }) => Promise<void>;
  addUser: (name: string, email: string, password: string, role: UserRole) => Promise<void>; // Registro normal
  fetchUsers: () => Promise<void>; // Recarregar lista
  fetchLogs: (limit?: number) => Promise<LogRecord[]>; // Fetch logs
  fetchStatistics: () => Promise<Statistics>; // Fetch statistics
  updateUserPassword: (id: string, newPassword: string) => Promise<void>; // Update user password
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- PROVEDOR DE CONTEXTO ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLoginInProgress = useRef(false);

  /* FUNÇÕES AUXILIARES */

  const getProfile = async (supabaseUser: User): Promise<AuthUser | null> => {
    console.log('getProfile called for user:', supabaseUser.id, supabaseUser.email);

    // First, try to get profile by matching the user ID
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, role, id')
      .eq('id', supabaseUser.id)
      .single();

    // If no profile found by ID, try to find by email as fallback
    if (error || !profile) {
      console.log('Profile not found by ID, trying by email:', supabaseUser.email);
      const { data: profilesByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('full_name, role, id')
        .eq('email', supabaseUser.email);

      if (emailError) {
        console.error('Erro ao buscar perfil por email:', emailError.message);
        console.error('Profile data (by ID):', profile);
        return null;
      }

      if (profilesByEmail && profilesByEmail.length > 0) {
        // Profile found by email, but ID doesn't match - this means there's a mismatch
        const profileByEmail = profilesByEmail[0];
        console.log('Profile found by email but ID mismatch, user ID:', supabaseUser.id, 'profile ID:', profileByEmail.id);

        // Update the profile in the local object to match the auth user ID
        profile = { ...profileByEmail, id: supabaseUser.id };
      } else {
        // No profile found - create a default one
        console.log('No profile found, creating default profile for:', supabaseUser.email);

        // Create a default profile with 'solicitante' role as fallback
        const defaultProfile = {
          full_name: supabaseUser.email?.split('@')[0] || 'Usuário', // Use part of email as name
          role: 'solicitante' as UserRole,
          email: supabaseUser.email,
          id: supabaseUser.id
        };

        // Add to the profiles table
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: defaultProfile.full_name,
            role: defaultProfile.role
          }]);

        if (insertError) {
          console.error('Error creating default profile:', insertError.message);
          // If insertion failed due to conflict (user already exists), try to fetch again
          const { data: retryProfiles, error: retryError } = await supabase
            .from('profiles')
            .select('full_name, role, id')
            .eq('id', supabaseUser.id)
            .single();

          if (retryError || !retryProfiles) {
            console.error('Retry also failed:', retryError?.message);
            return null;
          }
          profile = retryProfiles;
        } else {
          profile = defaultProfile;
        }
      }
    }

    if (!profile) {
      console.error('No profile found for user:', supabaseUser.email);
      return null;
    }

    const authUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profile.full_name,
      role: profile.role as UserRole,
    };

    console.log('AuthUser created:', authUser);
    return authUser;
  };

  // Function to log user activities
  const logActivity = async (userId: string | null, action: string, description: string) => {
    try {
      // Get the real IP address and user agent if possible
      // For now, we'll use placeholder values, but in a real app you might want to get this from a server endpoint
      const { error } = await supabase
        .from('logs')
        .insert([{
          user_id: userId,
          action,
          description,
          ip_address: 'CLIENT_IP', // In a real app, get from server
          user_agent: navigator.userAgent
        }]);

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Unexpected error in logActivity:', error);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let data, error;

      // Try admin client first for admin users, fallback to regular client
      if (supabaseAdmin && user && (user.role === 'admin' || user.role === 'diretoria')) {
        ({ data, error } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email, role'));

        // If admin client fails, try regular client
        if (error) {
          console.warn('Admin client failed, falling back to regular client:', error);
          ({ data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role'));
        }
      } else {
        // Use regular client
        ({ data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role'));
      }

      if (error) {
        console.error('Erro ao buscar lista de usuários:', error);
        return;
      }

      // Mapeia para o tipo UserRecord
      const mappedUsers: UserRecord[] = data.map(p => ({
        password: '',
        user: {
          id: p.id,
          email: p.email,
          name: p.full_name,
          role: p.role as UserRole
        }
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Unexpected error during fetchUsers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch logs
  const fetchLogs = async (limit: number = 50) => {
    try {
      let data, error;

      // Try admin client first, then regular client
      if (supabaseAdmin) {
        ({ data, error } = await supabaseAdmin
          .from('logs')
          .select(`
            id,
            action,
            description,
            created_at,
            profiles!inner (
              full_name,
              email,
              role
            )
          `)
          .order('created_at', { ascending: false })
          .limit(limit));

        // If admin client fails, try regular client
        if (error) {
          console.warn('Admin client failed for logs, falling back to regular client:', error);
          ({ data, error } = await supabase
            .from('logs')
            .select(`
              id,
              action,
              description,
              created_at,
              profiles!inner (
                full_name,
                email,
                role
              )
            `)
            .order('created_at', { ascending: false })
            .limit(limit));
        }
      } else {
        ({ data, error } = await supabase
          .from('logs')
          .select(`
            id,
            action,
            description,
            created_at,
            profiles!inner (
              full_name,
              email,
              role
            )
          `)
          .order('created_at', { ascending: false })
          .limit(limit));
      }

      if (error) {
        console.error('Erro ao buscar logs:', error);
        return [];
      }

      // Format the logs data
      return data.map(log => ({
        id: log.id,
        user_name: log.profiles.full_name,
        user_email: log.profiles.email,
        user_role: log.profiles.role,
        action: log.action,
        description: log.description,
        created_at: log.created_at
      }));
    } catch (error) {
      console.error('Unexpected error during fetchLogs:', error);
      return [];
    }
  };

  // Function to fetch statistics
  const fetchStatistics = async () => {
    try {
      // Get the number of users who logged in today
      const today = new Date().toISOString().split('T')[0];

      let accessCount = 0, scheduleCount = 0, pendingCount = 0;
      let accessError, scheduleError, pendingError;

      // Try admin client first, then regular client
      let clientToUse = supabaseAdmin || supabase;

      ({ count: accessCount, error: accessError } = await clientToUse
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .eq('action', 'LOGIN'));

      // If admin client fails, try regular client
      if (accessError && supabaseAdmin) {
        ({ count: accessCount, error: accessError } = await supabase
          .from('logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00`)
          .eq('action', 'LOGIN'));
      }

      ({ count: scheduleCount, error: scheduleError } = await clientToUse
        .from('schedules')
        .select('*', { count: 'exact', head: true }));

      if (scheduleError && supabaseAdmin) {
        ({ count: scheduleCount, error: scheduleError } = await supabase
          .from('schedules')
          .select('*', { count: 'exact', head: true }));
      }

      ({ count: pendingCount, error: pendingError } = await clientToUse
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente'));

      if (pendingError && supabaseAdmin) {
        ({ count: pendingCount, error: pendingError } = await supabase
          .from('schedules')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente'));
      }

      if (accessError) console.error('Error fetching access count:', accessError);
      if (scheduleError) console.error('Error fetching schedule count:', scheduleError);
      if (pendingError) console.error('Error fetching pending count:', pendingError);

      return {
        accessCount: accessCount || 0,
        scheduleCount: scheduleCount || 0,
        pendingCount: pendingCount || 0
      };
    } catch (error) {
      console.error('Unexpected error during fetchStatistics:', error);
      return {
        accessCount: 0,
        scheduleCount: 0,
        pendingCount: 0
      };
    }
  };

  /* FUNÇÕES DE GESTÃO DE USUÁRIOS (ADMIN E NORMAL) */

  // REGISTRO NORMAL (para Register.tsx)
  const addUser = async (name: string, email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;
    if (!data.user) throw new Error('Usuário não retornado após sign up.');

    // Insere o perfil após o sign up
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: email,
        full_name: name,
        role: role,
      });

    if (profileError) {
      console.error("Erro ao criar perfil. O usuário no Auth foi criado, mas o perfil falhou:", profileError);
      throw profileError;
    }
  };

  // NOVO: CRIAÇÃO ADMINISTRATIVA (para DashboardAdmin.tsx)
  const adminAddUser = async (name: string, email: string, password: string, role: UserRole) => {
    if (!supabaseAdmin) throw new Error('Cliente Admin não configurado. Verifique a SERVICE_ROLE_KEY.');
    if (!role) throw new Error('Role é obrigatória na criação administrativa.');
    if (!password || password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');

    try {
      // 1. Criar o Usuário na Autenticação (Com SERVICE_ROLE_KEY)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirma
        user_metadata: { name, role } // Armazena role e nome no metadados
      });

      if (authError) {
        console.error('Erro ao criar usuário Admin:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }

      const newUser = authData.user;
      if (!newUser) throw new Error("Usuário Auth não retornado.");

      // 2. Inserir o Perfil na Tabela 'profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.id,
          email: newUser.email,
          full_name: name,
          role: role,
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // CRUCIAL: Apagar o usuário Auth se a inserção do perfil falhar
        try {
          await supabaseAdmin.auth.admin.deleteUser(newUser.id);
          console.log('Usuário Auth deletado devido a falha no perfil');
        } catch (deleteError) {
          console.error('Erro ao tentar deletar usuário após falha no perfil:', deleteError);
        }
        throw new Error(`Erro de perfil: ${profileError.message}`);
      }

      // Log the user creation activity
      if (user) {
        try {
          await logActivity(user.id, 'CREATE_USER', `Admin ${user.name} created new user: ${name} with role ${role}`);
        } catch (logError) {
          console.error('Erro ao logar atividade de criação de usuário:', logError);
        }
      }
    } catch (error: any) {
      console.error('Erro inesperado na criação de usuário admin:', error);
      throw error;
    }
  };

  // FUNÇÃO DELETE USER (agora exige SERVICE_ROLE_KEY)
  const deleteUser = async (id: string) => {
    if (!supabaseAdmin) throw new Error('Cliente Admin não configurado.');

    try {
      // First, delete from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

      if (authError) {
        console.error('Erro ao deletar usuário do Auth:', authError);

        // Try to delete just the profile if auth deletion fails
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

        if (profileError) {
          console.error('Erro ao deletar perfil:', profileError);
          throw new Error(`${authError.message}, ${profileError.message}`);
        }
      }

      // Log the user deletion activity
      if (user) {
        await logActivity(user.id, 'DELETE_USER', `User ${user.name} deleted user ID: ${id}`);
      }
    } catch (error: any) {
      console.error('Erro inesperado ao deletar usuário:', error);
      throw error;
    }

    // Se for o próprio admin se deletando (não deveria acontecer), ou se deletar da lista
    if (user && user.id === id) {
      setUser(null);
    } else {
      setUsers(prev => prev.filter(u => u.user.id !== id));
    }
  };

  // ATUALIZAÇÃO DE PERFIL (usada em DashboardAdmin para editar)
  const updateUser = async (id: string, updates: { name?: string, email?: string, role?: UserRole }) => {
    const payload: { full_name?: string, email?: string, role?: UserRole } = {};

    if (updates.name) payload.full_name = updates.name;
    if (updates.email) payload.email = updates.email;
    if (updates.role) payload.role = updates.role;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }

    // Recarrega a lista
    if (user && (user.role === 'admin' || user.role === 'diretoria')) {
      await fetchUsers();
    }

    // Log the user update activity
    if (user) {
      await logActivity(user.id, 'UPDATE_USER', `User ${user.name} updated profile for user ID: ${id}`);
    }
  };

  // ATUALIZAÇÃO DE SENHA (usada em DashboardAdmin para alterar senha)
  const updateUserPassword = async (id: string, newPassword: string) => {
    if (!supabaseAdmin) throw new Error('Cliente Admin não configurado. Verifique a SERVICE_ROLE_KEY.');
    if (!newPassword || newPassword.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');

    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: newPassword
      });

      if (error) {
        console.error('Erro ao atualizar senha:', error);
        throw error;
      }

      // Log the password change activity
      if (user) {
        const { data: targetUser, error: userError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', id)
          .single();

        if (!userError && targetUser) {
          await logActivity(user.id, 'UPDATE_PASSWORD', `Admin ${user.name} updated password for user ${targetUser.full_name}`);
        }
      }
    } catch (error) {
      console.error('Erro inesperado ao atualizar senha:', error);
      throw error;
    }
  };

  /* FUNÇÕES DE AUTENTICAÇÃO PADRÃO */

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('AuthContext login called with:', email);
    isLoginInProgress.current = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('Supabase auth result:', { data: !!data, error });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        console.log('Supabase user found:', data.user.id, data.user.email);
        const authUser = await getProfile(data.user);
        console.log('getProfile result:', authUser);

        if (authUser) {
          console.log('Login successful, user:', authUser);
          setUser(authUser);

          // Log the login activity
          await logActivity(authUser.id, 'LOGIN', `User ${authUser.name} logged in successfully`);

          // Immediately fetch users data if user is admin or diretoria
          if (authUser.role === 'admin' || authUser.role === 'diretoria') {
            await fetchUsers();
          }

          // Wait a brief moment to ensure state propagates before navigation
          await new Promise(resolve => setTimeout(resolve, 200));

          return true;
        } else {
          console.error('Failed to get user profile - profile might not exist');
          // Try to sign out if profile is missing to avoid inconsistent state
          await supabase.auth.signOut();
          return false;
        }
      }

      console.log('No user returned from Supabase auth');
      return false;
    } catch (error) {
      console.error('Unexpected error during login:', error);
      return false;
    } finally {
      // Reset the login in progress flag
      isLoginInProgress.current = false;
    }
  };

  const logout = async () => {
    if (user) {
      await logActivity(user.id, 'LOGOUT', `User ${user.name} logged out`);
    }
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
    setUser(null);
    setUsers([]);
  };

  /* EFEITO DE INICIALIZAÇÃO */

  useEffect(() => {
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        console.log('Initial user check result:', { supabaseUser: !!supabaseUser });

        if (supabaseUser) {
          const authUser = await getProfile(supabaseUser);
          console.log('Initial getProfile result:', authUser);
          setUser(authUser);
          // Carrega a lista de usuários para o Admin/Diretoria
          if (authUser?.role === 'admin' || authUser?.role === 'diretoria') {
            await fetchUsers();
          }
        }
      } catch (error) {
        console.error('Error in initial user check:', error);
      } finally {
        setIsLoading(false);
      }

      // Set up the auth state change listener
      const { data: subscription } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', event, !!session?.user);

          if (event === 'SIGNED_IN' && session?.user) {
            // Skip updating user if a login is already in progress to avoid conflicts
            if (isLoginInProgress.current) {
              console.log('Login in progress, skipping auth state change update');
              return;
            }

            try {
              const authUser = await getProfile(session.user);
              console.log('Auth state change getProfile result:', authUser);
              if (authUser) {
                setUser(authUser);
                if (authUser?.role === 'admin' || authUser?.role === 'diretoria') {
                  await fetchUsers();
                }
              } else {
                console.error('Auth state change: Could not get user profile after sign in');
                // Don't set user to null here - let the UI handle the error
              }
            } catch (error) {
              console.error('Error in auth state change handling:', error);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out, clearing state');
            // Reset the login in progress flag on sign out
            isLoginInProgress.current = false;
            setUser(null);
            setUsers([]);
          }
        }
      );

      authSubscription = subscription;
    };

    initializeAuth();

    // Cleanup function
    return () => {
      if (authSubscription) {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, []);

  const value = {
    user,
    users,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    adminAddUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    addUser,
    fetchUsers,
    fetchLogs,
    fetchStatistics,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};