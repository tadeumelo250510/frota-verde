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

export async function syncVehicleToRemote(vehicle: Vehicle) {
  try {
    await supabase.from('vehicles').upsert(vehicle);
  } catch (err) {
    console.warn('Supabase syncVehicleToRemote:', err);
  }
}

export async function deleteVehicleFromRemote(vehicleId: string) {
  try {
    await supabase.from('vehicles').delete().eq('id', vehicleId);
  } catch (err) {
    console.warn('Supabase deleteVehicleFromRemote:', err);
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

export async function syncRefuelToRemote(record: RefuelRecord) {
  try {
    await supabase.from('refuels').upsert(record);
  } catch (err) {
    console.warn('Supabase syncRefuelToRemote:', err);
  }
}

export async function deleteRefuelFromRemote(recordId: string) {
  try {
    await supabase.from('refuels').delete().eq('id', recordId);
  } catch (err) {
    console.warn('Supabase deleteRefuelFromRemote:', err);
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

export async function syncUserToRemote(user: AppUser) {
  try {
    await supabase.from('app_users').upsert(user);
  } catch (err) {
    console.warn('Supabase syncUserToRemote:', err);
  }
}

export async function deleteUserFromRemote(userId: string) {
  try {
    await supabase.from('app_users').delete().eq('id', userId);
  } catch (err) {
    console.warn('Supabase deleteUserFromRemote:', err);
  }
}
