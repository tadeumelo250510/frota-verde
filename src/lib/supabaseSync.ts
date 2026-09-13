import { supabase } from './supabaseClient';
import { Vehicle, RefuelRecord, AppUser, AuditLogEntry } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Utilitários para sincronização segura e Realtime bidirecional com Supabase.
 * O Supabase opera como banco de dados principal e autoritativo.
 * localStorage opera apenas como cache resiliente.
 */

// Checar conexão com o Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('vehicles').select('id').limit(1);
    if (!error) return true;
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// VEÍCULOS (vehicles)
// -------------------------------------------------------------

export async function fetchRemoteVehicles(): Promise<Vehicle[] | null> {
  try {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) {
      console.warn('Supabase fetchRemoteVehicles warning:', error.message);
      return null;
    }
    return data as Vehicle[];
  } catch (err) {
    console.warn('Supabase fetchRemoteVehicles exception:', err);
    return null;
  }
}

export async function syncVehicleToRemote(vehicle: Vehicle): Promise<{ success: boolean; error?: any }> {
  try {
    const { data, error } = await supabase.from('vehicles').upsert(vehicle).select();
    if (error) {
      console.error('❌ [Supabase] Falha ao enviar veículo:', error.message, error);
      return { success: false, error };
    }
    console.log('✅ [Supabase] Veículo sincronizado na nuvem:', vehicle.plate, data);
    return { success: true };
  } catch (err) {
    console.error('⚠️ [Supabase] Erro de conexão ao sincronizar veículo:', err);
    return { success: false, error: err };
  }
}

export async function deleteVehicleFromRemote(vehicleId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
    if (error) {
      console.error('❌ [Supabase] Falha ao deletar veículo:', error.message);
      return { success: false, error };
    }
    console.log('✅ [Supabase] Veículo removido da nuvem:', vehicleId);
    return { success: true };
  } catch (err) {
    console.error('⚠️ [Supabase] Erro ao deletar veículo:', err);
    return { success: false, error: err };
  }
}

// -------------------------------------------------------------
// ABASTECIMENTOS (refuels & frota-verde)
// -------------------------------------------------------------

export async function fetchRemoteRefuels(): Promise<RefuelRecord[] | null> {
  try {
    const { data, error } = await supabase.from('refuels').select('*');
    if (error) {
      console.warn('Supabase fetchRemoteRefuels warning:', error.message);
      return null;
    }
    return data as RefuelRecord[];
  } catch (err) {
    console.warn('Supabase fetchRemoteRefuels exception:', err);
    return null;
  }
}

/**
 * Envio adaptativo para a tabela FROTA-VERDE / frota-verde
 */
export async function syncToFrotaVerdeTable(payload: Record<string, any>): Promise<{ success: boolean; error?: any; data?: any }> {
  try {
    let res = await supabase.from('FROTA-VERDE').upsert(payload).select();
    if (res.error && (res.error.code === 'PGRST205' || res.error.message?.includes('schema cache') || res.error.message?.includes('frota-verde'))) {
      res = await supabase.from('frota-verde').upsert(payload).select();
    }
    if (res.error) {
      return { success: false, error: res.error };
    }
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function syncRefuelToRemote(record: RefuelRecord): Promise<{ success: boolean; error?: any }> {
  try {
    const { data, error } = await supabase.from('refuels').upsert(record).select();
    if (error) {
      console.error('❌ [Supabase] Falha ao enviar abastecimento:', error.message, error);
    } else {
      console.log('✅ [Supabase] Abastecimento sincronizado na nuvem:', record.id, data);
    }

    // Também dispara para frota-verde
    syncToFrotaVerdeTable(record).catch(() => {});

    return { success: !error };
  } catch (err) {
    console.error('⚠️ [Supabase] Erro ao gravar abastecimento:', err);
    return { success: false, error: err };
  }
}

export async function deleteRefuelFromRemote(recordId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.from('refuels').delete().eq('id', recordId);
    if (error) {
      console.error('❌ [Supabase] Falha ao deletar abastecimento:', error.message);
      return { success: false, error };
    }
    console.log('✅ [Supabase] Abastecimento removido da nuvem:', recordId);
    return { success: true };
  } catch (err) {
    console.error('⚠️ [Supabase] Erro ao deletar abastecimento:', err);
    return { success: false, error: err };
  }
}

// -------------------------------------------------------------
// USUÁRIOS (app_users)
// -------------------------------------------------------------

export async function fetchRemoteUsers(): Promise<AppUser[] | null> {
  try {
    const { data, error } = await supabase.from('app_users').select('*');
    if (error) {
      console.warn('Supabase fetchRemoteUsers warning:', error.message);
      return null;
    }
    return data as AppUser[];
  } catch (err) {
    console.warn('Supabase fetchRemoteUsers exception:', err);
    return null;
  }
}

export async function syncUserToRemote(user: AppUser): Promise<{ success: boolean; error?: any }> {
  try {
    const { data, error } = await supabase.from('app_users').upsert(user).select();
    if (error) {
      console.error('❌ [Supabase] Falha ao sincronizar usuário:', error.message, error);
      return { success: false, error };
    }
    console.log('✅ [Supabase] Usuário sincronizado na nuvem:', user.name, data);
    return { success: true };
  } catch (err) {
    console.error('⚠️ [Supabase] Erro de rede ao gravar usuário:', err);
    return { success: false, error: err };
  }
}

export async function deleteUserFromRemote(userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.from('app_users').delete().eq('id', userId);
    if (error) {
      console.error('❌ [Supabase] Falha ao deletar usuário:', error.message);
      return { success: false, error };
    }
    console.log('✅ [Supabase] Usuário removido da nuvem:', userId);
    return { success: true };
  } catch (err) {
    console.error('⚠️ [Supabase] Erro ao deletar usuário:', err);
    return { success: false, error: err };
  }
}

// -------------------------------------------------------------
// REALTIME SUBSCRIPTIONS (Sincronização instantânea entre PCs)
// -------------------------------------------------------------

let activeRealtimeChannel: RealtimeChannel | null = null;

export interface RealtimeHandlers {
  onVehicleChange: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; newRecord?: Vehicle; oldRecord?: { id: string } }) => void;
  onRefuelChange: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; newRecord?: RefuelRecord; oldRecord?: { id: string } }) => void;
  onUserChange: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; newRecord?: AppUser; oldRecord?: { id: string } }) => void;
  onAuditLog?: (entry: AuditLogEntry) => void;
  onStatusChange?: (status: 'SUBSCRIBED' | 'CONNECTING' | 'CLOSED' | 'CHANNEL_ERROR') => void;
}

export function broadcastAuditLog(entry: AuditLogEntry): void {
  if (activeRealtimeChannel) {
    try {
      activeRealtimeChannel.send({
        type: 'broadcast',
        event: 'audit_event',
        payload: entry,
      });
      console.log('⚡ [Realtime Audit] Registro de auditoria transmitido para outros PCs:', entry.action, entry.entityDescription);
    } catch (e) {
      console.warn('Falha ao transmitir evento de auditoria:', e);
    }
  }
}

export function subscribeToSupabaseRealtime(handlers: RealtimeHandlers): () => void {
  console.log('⚡ [Supabase Realtime] Conectando canais em tempo real para sincronização entre PCs...');

  const channel: RealtimeChannel = supabase
    .channel('frota-verde-realtime-channel')
    // Escuta mudanças na tabela de veículos
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vehicles' },
      (payload) => {
        console.log('⚡ [Realtime Vehicles]', payload.eventType, payload);
        handlers.onVehicleChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          newRecord: payload.new as Vehicle,
          oldRecord: payload.old as { id: string },
        });
      }
    )
    // Escuta mudanças na tabela de abastecimentos
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'refuels' },
      (payload) => {
        console.log('⚡ [Realtime Refuels]', payload.eventType, payload);
        handlers.onRefuelChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          newRecord: payload.new as RefuelRecord,
          oldRecord: payload.old as { id: string },
        });
      }
    )
    // Escuta mudanças na tabela de usuários e senhas
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_users' },
      (payload) => {
        console.log('⚡ [Realtime Users]', payload.eventType, payload);
        handlers.onUserChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          newRecord: payload.new as AppUser,
          oldRecord: payload.old as { id: string },
        });
      }
    )
    // Escuta eventos de auditoria transmitidos entre PCs
    .on(
      'broadcast',
      { event: 'audit_event' },
      ({ payload }) => {
        console.log('⚡ [Realtime Audit Received]', payload);
        if (handlers.onAuditLog && payload) {
          handlers.onAuditLog(payload as AuditLogEntry);
        }
      }
    )
    .subscribe((status) => {
      console.log('⚡ [Supabase Realtime Status]:', status);
      if (handlers.onStatusChange) {
        handlers.onStatusChange(status as any);
      }
    });

  activeRealtimeChannel = channel;

  // Função de desinscrição para limpeza de memória e conexões
  return () => {
    console.log('⚡ [Supabase Realtime] Encerrando canais Realtime...');
    if (activeRealtimeChannel === channel) {
      activeRealtimeChannel = null;
    }
    supabase.removeChannel(channel);
  };
}
