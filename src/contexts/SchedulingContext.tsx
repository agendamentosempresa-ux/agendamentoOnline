import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  Scheduling,
  SchedulingStatus,
  SchedulingData,
  CheckInStatus
} from '../types/scheduling';
import { supabase } from '../lib/supabaseClient';

interface SchedulingContextType {
  schedulings: Scheduling[];
  addScheduling: (scheduling: Omit<Scheduling, 'id' | 'createdAt' | 'status' | 'solicitanteId' | 'solicitanteEmail'>) => void;
  updateStatus: (id: string, status: SchedulingStatus, comment?: string) => void;
  updateCheckInStatus: (id: string, checkInStatus: CheckInStatus) => void;
  getSchedulingsByUser: (userId: string) => Scheduling[];
  getPendingSchedulings: () => Scheduling[];
  getApprovedSchedulings: () => Scheduling[];
}

const SchedulingContext = createContext<SchedulingContextType | undefined>(undefined);

export function SchedulingProvider({ children }: { children: ReactNode }) {
  const [schedulings, setSchedulings] = useState<Scheduling[]>([]);

  useEffect(() => {
    // Carrega do Supabase inicialmente
    (async () => {
      try {
        const { data, error } = await supabase.from('schedules').select('*');
        if (error) {
          console.warn('Erro carregando schedules do supabase', error);
          const stored = localStorage.getItem('petronas_schedulings');
          if (stored) setSchedulings(JSON.parse(stored));
        } else if (data) {
          // Mapear campos do banco de dados para o formato do TypeScript
          const mappedSchedulings: Scheduling[] = data.map(dbScheduling => ({
            id: dbScheduling.id,
            type: dbScheduling.type,
            status: dbScheduling.status,
            requestedBy: dbScheduling.requested_by,
            requestedByName: dbScheduling.requested_by_name,
            data: dbScheduling.data,
            observacoes: dbScheduling.observacoes,
            createdAt: dbScheduling.created_at,
            reviewedAt: dbScheduling.reviewed_at,
            reviewedBy: dbScheduling.reviewed_by,
            solicitanteId: dbScheduling.requested_by,
            solicitanteEmail: '', // não está no banco de dados
            checkInStatus: dbScheduling.check_in_status,
            checkInAt: dbScheduling.check_in_at,
          }));
          setSchedulings(mappedSchedulings);
        }
      } catch (err) {
        console.warn('Erro ao carregar schedules', err);
        const stored = localStorage.getItem('petronas_schedulings');
        if (stored) setSchedulings(JSON.parse(stored));
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem('petronas_schedulings', JSON.stringify(schedulings));
  }, [schedulings]);

  const addScheduling = async (scheduling: Omit<Scheduling, 'id' | 'createdAt' | 'status' | 'solicitanteId' | 'solicitanteEmail'>) => {
    // Gerar ID único para o agendamento
    const newId = self.crypto && self.crypto.randomUUID 
      ? self.crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

    // Mapear os campos para o formato do banco de dados
    const newSchedulingDb = {
      id: newId,
      type: scheduling.type,
      status: 'pendente',
      requested_by: (scheduling as any).requestedBy || '',
      requested_by_name: (scheduling as any).requestedByName || '',
      data: scheduling.data,
      observacoes: '',
      created_at: new Date().toISOString(),
      check_in_status: null,
      check_in_at: null,
    };

    // Inserir no Supabase
    try {
      const { data: insertData, error } = await supabase.from('schedules').insert([newSchedulingDb]).select();
      if (error) {
        console.error('Erro inserindo schedule no supabase', error);
        // Fallback: adicionar localmente se a inserção no Supabase falhar
        const newScheduling: Scheduling = {
          ...scheduling as Scheduling,
          id: newId,
          status: 'pendente',
          solicitanteId: (scheduling as any).requestedBy || '',
          solicitanteEmail: '',
          createdAt: new Date().toISOString(),
          checkInStatus: null,
          checkInAt: null,
        };
        setSchedulings(prev => [...prev, newScheduling]);
      } else if (insertData && insertData.length > 0) {
        console.log('Solicitação salva com sucesso no Supabase:', insertData[0]);
        // Mapear de volta para o formato do TypeScript
        const insertedScheduling: Scheduling = {
          id: insertData[0].id,
          type: insertData[0].type,
          status: insertData[0].status,
          requestedBy: insertData[0].requested_by,
          requestedByName: insertData[0].requested_by_name,
          data: insertData[0].data,
          observacoes: insertData[0].observacoes,
          createdAt: insertData[0].created_at,
          reviewedAt: insertData[0].reviewed_at,
          reviewedBy: insertData[0].reviewed_by,
          solicitanteId: insertData[0].requested_by,
          solicitanteEmail: '', // não está no banco de dados
          checkInStatus: insertData[0].check_in_status,
          checkInAt: insertData[0].check_in_at,
        };
        setSchedulings(prev => [...prev, insertedScheduling]);
      } else {
        console.warn('Nenhum dado retornado após inserção no Supabase');
        // Fallback: adicionar localmente
        const newScheduling: Scheduling = {
          ...scheduling as Scheduling,
          id: newId,
          status: 'pendente',
          solicitanteId: (scheduling as any).requestedBy || '',
          solicitanteEmail: '',
          createdAt: new Date().toISOString(),
          checkInStatus: null,
          checkInAt: null,
        };
        setSchedulings(prev => [...prev, newScheduling]);
      }
    } catch (err) {
      console.error('Erro ao inserir schedule', err);
      // Fallback: adicionar localmente se a inserção falhar
      const newScheduling: Scheduling = {
        ...scheduling as Scheduling,
        id: newId,
        status: 'pendente',
        solicitanteId: (scheduling as any).requestedBy || '',
        solicitanteEmail: '',
        createdAt: new Date().toISOString(),
        checkInStatus: null,
        checkInAt: null,
      };
      setSchedulings(prev => [...prev, newScheduling]);
    }
  };

  const updateStatus = async (id: string, status: SchedulingStatus, comment?: string) => {
    try {
      const reviewedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from('schedules')
        .update({ 
          status, 
          observacoes: comment, 
          reviewed_at: reviewedAt 
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Erro atualizando status no supabase', error);
        setSchedulings(prev => prev.map(s => 
          s.id === id ? { 
            ...s, 
            status, 
            observacoes: comment, 
            reviewedAt 
          } : s
        ));
      } else if (data && data.length > 0) {
        console.log('Status atualizado com sucesso no Supabase:', data[0]);
        // Mapear de volta para o formato do TypeScript
        const updatedScheduling: Scheduling = {
          id: data[0].id,
          type: data[0].type,
          status: data[0].status,
          requestedBy: data[0].requested_by,
          requestedByName: data[0].requested_by_name,
          data: data[0].data,
          observacoes: data[0].observacoes,
          createdAt: data[0].created_at,
          reviewedAt: data[0].reviewed_at,
          reviewedBy: data[0].reviewed_by,
          solicitanteId: data[0].requested_by,
          solicitanteEmail: '',
          checkInStatus: data[0].check_in_status,
          checkInAt: data[0].check_in_at,
        };
        setSchedulings(prev => prev.map(s => s.id === id ? updatedScheduling : s));
      } else {
        console.warn('Nenhum dado retornado após atualização de status no Supabase');
      }
    } catch (err) {
      console.error('Erro updateStatus', err);
      setSchedulings(prev => prev.map(s => 
        s.id === id ? { 
          ...s, 
          status, 
          observacoes: comment, 
          reviewedAt: new Date().toISOString() 
        } : s
      ));
    }
  };

  const updateCheckInStatus = async (id: string, checkInStatus: CheckInStatus) => {
    try {
      const checkInAt = new Date().toISOString();
      const { data, error } = await supabase
        .from('schedules')
        .update({ 
          check_in_status: checkInStatus, 
          check_in_at: checkInAt 
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Erro atualizando checkin no supabase', error);
        setSchedulings(prev => prev.map(s => 
          s.id === id ? { 
            ...s, 
            checkInStatus, 
            checkInAt 
          } : s
        ));
      } else if (data && data.length > 0) {
        console.log('Check-in status atualizado com sucesso no Supabase:', data[0]);
        // Mapear de volta para o formato do TypeScript
        const updatedScheduling: Scheduling = {
          id: data[0].id,
          type: data[0].type,
          status: data[0].status,
          requestedBy: data[0].requested_by,
          requestedByName: data[0].requested_by_name,
          data: data[0].data,
          observacoes: data[0].observacoes,
          createdAt: data[0].created_at,
          reviewedAt: data[0].reviewed_at,
          reviewedBy: data[0].reviewed_by,
          solicitanteId: data[0].requested_by,
          solicitanteEmail: '',
          checkInStatus: data[0].check_in_status,
          checkInAt: data[0].check_in_at,
        };
        setSchedulings(prev => prev.map(s => s.id === id ? updatedScheduling : s));
      } else {
        console.warn('Nenhum dado retornado após atualização de check-in status no Supabase');
      }
    } catch (err) {
      console.error('Erro updateCheckInStatus', err);
      setSchedulings(prev => prev.map(s => 
        s.id === id ? { 
          ...s, 
          checkInStatus, 
          checkInAt: new Date().toISOString() 
        } : s
      ));
    }
  };

  const getSchedulingsByUser = (userId: string) => {
    return schedulings.filter(s => s.requestedBy === userId);
  };

  const getPendingSchedulings = () => {
    return schedulings.filter(s => s.status === 'pendente');
  };

  const getApprovedSchedulings = () => {
    // Retorna todos aprovados, independente de check-in
    return schedulings.filter(s => s.status === 'aprovado');
  };

  return (
    <SchedulingContext.Provider
      value={{
        schedulings,
        addScheduling,
        updateStatus,
        updateCheckInStatus,
        getSchedulingsByUser,
        getPendingSchedulings,
        getApprovedSchedulings,
      }}
    >
      {children}
    </SchedulingContext.Provider>
  );
}

export function useScheduling() {
  const context = useContext(SchedulingContext);
  if (context === undefined) {
    throw new Error('useScheduling must be used within a SchedulingProvider');
  }
  return context;
}
