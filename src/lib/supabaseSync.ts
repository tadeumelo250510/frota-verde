import { supabase } from './supabaseClient';
import { Vehicle, RefuelRecord, AppUser } from '../types';

/**
 * Utilitários para sincronização segura com Supabase.
 * Todas as funções contêm tratamento com fallback garantido para manter
 * 100% da usabilidade offline/local caso as tabelas remotas ainda não tenham sido criadas no schema público.
 */

export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('vehicles').select('id').limit(1);
    // Se não houver erro, ou se for apenas tabela vazia, conexão existe
    if (!error) return true;
    // Se o código for 42P01 (relation does not exist), o Supabase respondeu normalmente
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function fetchRemoteVehicles(): Promise<Vehicle[] | null> {
  try {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error || !data) return null;
    return data as Vehicle[];
  } catch (err) {
    console.warn('Supabase fetchRemoteVehicles:', err);
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
    console.log('✅ [Supabase] Veículo gravado com sucesso na nuvem:', vehicle.plate, data);
    return { success: true };
  } catch (err) {
    console.error('⚠️ [Supabase] Erro de rede ou conexão ao gravar veículo:', err);
    return { success: false, error: err };
  }
}

export async function deleteVehicleFromRemote(vehicleId: string) {
  try {
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
    if (error) {
      console.error('❌ [Supabase] Falha ao deletar veículo:', error.message);
    } else {
      console.log('✅ [Supabase] Veículo removido da nuvem:', vehicleId);
    }
  } catch (err) {
    console.error('⚠️ [Supabase] Erro ao deletar veículo:', err);
  }
}

export async function fetchRemoteRefuels(): Promise<RefuelRecord[] | null> {
  try {
    const { data, error } = await supabase.from('refuels').select('*');
    if (error || !data) return null;
    return data as RefuelRecord[];
  } catch (err) {
    console.warn('Supabase fetchRemoteRefuels:', err);
    return null;
  }
}

/**
 * Envio específico e adaptativo para a tabela FROTA-VERDE / frota-verde
 * Tenta enviar primeiro para 'FROTA-VERDE' (maiúsculo) e, caso o Postgres tenha normalizado em minúsculo,
 * efetua fallback automático transparente para 'frota-verde', garantindo compatibilidade total.
 */
export async function syncToFrotaVerdeTable(payload: Record<string, any>): Promise<{ success: boolean; error?: any; data?: any }> {
  try {
    console.log('📡 [Supabase] Enviando registro para "FROTA-VERDE"...', payload);
    
    // Tentativa 1: Nome com letras maiúsculas
    let res = await supabase.from('FROTA-VERDE').upsert(payload).select();
    
    // Se a tabela foi criada em minúsculas pelo Postgres, faz fallback automático
    if (res.error && (res.error.code === 'PGRST205' || res.error.message?.includes('schema cache') || res.error.message?.includes('frota-verde'))) {
      console.warn('ℹ️ [Supabase] Tabela registrada em minúsculas ("frota-verde"). Realizando gravação nela...');
      res = await supabase.from('frota-verde').upsert(payload).select();
    }

    if (res.error) {
      console.error('❌ [Supabase] Falha ao enviar para FROTA-VERDE:', {
        codigo: res.error.code,
        mensagem: res.error.message,
        detalhes: res.error.details,
        dica: res.error.hint,
      });
      return { success: false, error: res.error };
    }

    console.log('✅ [Supabase] Registro gravado com sucesso em FROTA-VERDE:', res.data);
    return { success: true, data: res.data };
  } catch (err: any) {
    console.error('⚠️ [Supabase] Exceção de rede ao gravar em FROTA-VERDE:', {
      mensagem: err?.message,
      stack: err?.stack,
    });
    return { success: false, error: err };
  }
}

export async function syncRefuelToRemote(record: RefuelRecord): Promise<{ success: boolean; error?: any }> {
  try {
    // Também sincroniza com a tabela 'refuels' e 'FROTA-VERDE'
    const { data, error } = await supabase.from('refuels').upsert(record).select();
    if (error) {
      console.error('❌ [Supabase] Falha ao enviar abastecimento:', error.message, error);
    } else {
      console.log('✅ [Supabase] Abastecimento gravado com sucesso na nuvem:', record.id, data);
    }
    
    // Sincroniza em paralelo para FROTA-VERDE
    await syncToFrotaVerdeTable(record);

    return { success: !error };
  } catch (err) {
    console.error('⚠️ [Supabase] Erro de rede ou conexão ao gravar abastecimento:', err);
    return { success: false, error: err };
  }
}

export async function deleteRefuelFromRemote(recordId: string) {
  try {
    const { error } = await supabase.from('refuels').delete().eq('id', recordId);
    if (error) {
      console.error('❌ [Supabase] Falha ao deletar abastecimento:', error.message);
    } else {
      console.log('✅ [Supabase] Abastecimento removido da nuvem:', recordId);
    }
  } catch (err) {
    console.error('⚠️ [Supabase] Erro ao deletar abastecimento:', err);
  }
}

export async function fetchRemoteUsers(): Promise<AppUser[] | null> {
  try {
    const { data, error } = await supabase.from('app_users').select('*');
    if (error || !data) return null;
    return data as AppUser[];
  } catch (err) {
    console.warn('Supabase fetchRemoteUsers:', err);
    return null;
  }
}

export async function syncUserToRemote(user: AppUser): Promise<{ success: boolean; error?: any }> {
  try {
    const { data, error } = await supabase.from('app_users').upsert(user).select();
    if (error) {
      console.error('❌ [Supabase] Falha ao enviar usuário:', error.message, error);
      return { success: false, error };
    }
    console.log('✅ [Supabase] Usuário gravado com sucesso na nuvem:', user.name, data);
    return { success: true };
  } catch (err) {
    console.error('⚠️ [Supabase] Erro de rede ou conexão ao gravar usuário:', err);
    return { success: false, error: err };
  }
}

export async function deleteUserFromRemote(userId: string) {
  try {
    const { error } = await supabase.from('app_users').delete().eq('id', userId);
    if (error) {
      console.error('❌ [Supabase] Falha ao deletar usuário:', error.message);
    } else {
      console.log('✅ [Supabase] Usuário removido da nuvem:', userId);
    }
  } catch (err) {
    console.error('⚠️ [Supabase] Erro ao deletar usuário:', err);
  }
}
