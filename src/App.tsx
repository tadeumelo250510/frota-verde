import React, { useState, useEffect, useMemo } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { VehicleRegistrationView } from './components/VehicleRegistrationView';
import { RefuelFormView } from './components/RefuelFormView';
import { ExtratoView } from './components/ExtratoView';
import { UserManager } from './components/UserManager';
import { PdfReportView } from './components/PdfReportView';
import { LoginView } from './components/LoginView';
import { Vehicle, RefuelRecord, AppUser } from './types';
import {
  INITIAL_VEHICLES,
  INITIAL_REFUELS,
  INITIAL_USERS,
} from './data/initialData';
import {
  calculateRefuelsWithMetrics,
  calculateVehiclesEfficiency,
} from './utils/calculations';
import {
  fetchRemoteVehicles,
  fetchRemoteRefuels,
  fetchRemoteUsers,
  syncVehicleToRemote,
  deleteVehicleFromRemote,
  syncRefuelToRemote,
  deleteRefuelFromRemote,
  syncUserToRemote,
  deleteUserFromRemote,
} from './lib/supabaseSync';
import { LogOut, RotateCcw, X } from 'lucide-react';

const STORAGE_KEYS = {
  VEHICLES: 'combustivel_veiculos_v3',
  REFUELS: 'combustivel_abastecimentos_v3',
  USERS: 'combustivel_usuarios_v3',
  IS_AUTH: 'combustivel_is_authenticated_v3',
  ACTIVE_USER: 'combustivel_active_user_id_v3',
};

export default function App() {
  // Inicialização de Veículos
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar veículos:', e);
    }
    return INITIAL_VEHICLES;
  });

  // Inicialização de Abastecimentos (estritamente real, sem mocks)
  const [records, setRecords] = useState<RefuelRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REFUELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar abastecimentos:', e);
    }
    return INITIAL_REFUELS;
  });

  // Inicialização de Usuários com Migração Segura para Administrador Root e Remoção de Motorista
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migração de dados legados:
          // 1. Converte qualquer 'Motorista' para 'Gestor de Frota'
          // 2. Garante telefone e senha
          // 3. Garante e atualiza o cadastro do Administrador Root (CPF 059.958.485-85, e-mail tadeumotog5plus@gmail.com)
          const sanitized: AppUser[] = parsed.map((u: any) => {
            const isRootUser = Boolean(
              u.isRoot ||
              u.id === 'usr-root' ||
              u.email?.toLowerCase() === 'tadeumotog5plus@gmail.com' ||
              (u.cpf && u.cpf.replace(/\D/g, '') === '05995848585')
            );

            if (isRootUser) {
              return {
                ...u,
                id: 'usr-root',
                name: u.name || 'Administrador Root',
                cpf: '059.958.485-85',
                email: 'tadeumotog5plus@gmail.com',
                phone: u.phone || '(11) 98765-4321',
                role: 'Administrador' as const,
                password: u.password && u.password !== 'rootpassword123' && u.password !== 'admin123' ? u.password : '250510',
                isRoot: true,
                vehicleAssigned: 'Todos',
                status: 'Ativo' as const,
              };
            }

            return {
              ...u,
              phone: u.phone || '(11) 99123-4567',
              password: u.password || 'senha123',
              role: u.role === 'Motorista' ? ('Gestor de Frota' as const) : (u.role || 'Gestor de Frota'),
              isRoot: false,
            };
          });

          const hasRoot = sanitized.some((u) => u.isRoot);
          if (!hasRoot) {
            return [INITIAL_USERS[0], ...sanitized];
          }
          return sanitized;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar usuários:', e);
    }
    return INITIAL_USERS;
  });

  // Estado de Autenticação (Login via CPF)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.IS_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  // Usuário Conectado no Momento
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    try {
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
      if (activeId) {
        const found = users.find((u) => u.id === activeId);
        if (found && found.status !== 'Inativo') return found;
      }
    } catch (e) {
      console.warn('Erro ao restaurar usuário ativo:', e);
    }
    const root = users.find((u) => u.isRoot);
    return root || users[0] || INITIAL_USERS[0];
  });

  // Login com CPF com Sucesso
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEYS.IS_AUTH, 'true');
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, user.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Encerrar Sessão
  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsLogoutModalOpen(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.IS_AUTH);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    } catch (e) {
      console.error(e);
    }
  };

  // Trocar de usuário dentro do painel
  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, user.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Mantém currentUser sincronizado se seus dados forem atualizados
  useEffect(() => {
    if (currentUser) {
      const refreshed = users.find((u) => u.id === currentUser.id);
      if (refreshed && refreshed !== currentUser) {
        setCurrentUser(refreshed);
      }
    }
  }, [users, currentUser]);

  // Navegação
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Persistência local
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    } catch (e) {
      console.error(e);
    }
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REFUELS, JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  // Sincronização inicial com Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadFromSupabase() {
      const [remoteVehicles, remoteRefuels, remoteUsers] = await Promise.all([
        fetchRemoteVehicles(),
        fetchRemoteRefuels(),
        fetchRemoteUsers(),
      ]);

      if (!isMounted) return;

      if (remoteVehicles && remoteVehicles.length > 0) {
        setVehicles(remoteVehicles);
      }
      if (remoteRefuels && remoteRefuels.length > 0) {
        setRecords(remoteRefuels);
      }
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers(remoteUsers);
      }
    }
    loadFromSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cálculos reativos
  const enrichedRecords = useMemo(
    () => calculateRefuelsWithMetrics(records, vehicles),
    [records, vehicles]
  );

  const efficiencyStats = useMemo(
    () => calculateVehiclesEfficiency(vehicles, records),
    [vehicles, records]
  );

  // Manipuladores de Veículos
  const handleAddVehicle = (newVehicleData: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const newVehicle: Vehicle = {
      ...newVehicleData,
      id: `veh-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setVehicles((prev) => [newVehicle, ...prev]);
    syncVehicleToRemote(newVehicle);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    const confirmMessage = vehicle
      ? `Deseja realmente remover o veículo ${vehicle.brand} ${vehicle.model} (Placa ${vehicle.plate})?`
      : 'Deseja remover este veículo?';

    if (window.confirm(confirmMessage)) {
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      deleteVehicleFromRemote(vehicleId);
    }
  };

  // Manipuladores de Abastecimentos
  const handleAddRecord = (newRecordData: Omit<RefuelRecord, 'id' | 'createdAt'>) => {
    // Validação de segurança: o KM não pode ser inferior ou igual ao abastecimento anterior
    const pastRecords = records
      .filter((r) => r.vehicleId === newRecordData.vehicleId)
      .sort((a, b) => b.odometer - a.odometer);
    const vehicle = vehicles.find((v) => v.id === newRecordData.vehicleId);
    const lastOdo = pastRecords.length > 0 ? pastRecords[0].odometer : (vehicle?.initialOdometer || 0);

    if (lastOdo > 0 && newRecordData.odometer <= lastOdo) {
      console.warn(`Tentativa de cadastrar abastecimento com KM (${newRecordData.odometer}) <= último KM (${lastOdo})`);
      return;
    }

    const newRecord: RefuelRecord = {
      ...newRecordData,
      id: `ref-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setRecords((prev) => [newRecord, ...prev]);
    syncRefuelToRemote(newRecord);
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    deleteRefuelFromRemote(recordId);
  };

  // Manipuladores de Usuários
  const handleAddUser = (newUserData: Omit<AppUser, 'id'>) => {
    const newUser: AppUser = {
      ...newUserData,
      id: `usr-${Date.now()}`,
    };
    setUsers((prev) => [...prev, newUser]);
    syncUserToRemote(newUser);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromRemote(userId);
  };

  const handleUpdateUser = (userId: string, updatedData: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updatedData };
          syncUserToRemote(updated);
          return updated;
        }
        return u;
      })
    );
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated: AppUser = {
            ...u,
            status: u.status === 'Ativo' ? 'Inativo' : 'Ativo',
          };
          syncUserToRemote(updated);
          return updated;
        }
        return u;
      })
    );
  };

  // Restaurar dados originais do modelo
  const handleResetData = () => {
    setVehicles(INITIAL_VEHICLES);
    setRecords(INITIAL_REFUELS);
    setUsers(INITIAL_USERS);
    localStorage.removeItem(STORAGE_KEYS.VEHICLES);
    localStorage.removeItem(STORAGE_KEYS.REFUELS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    setIsLogoutModalOpen(false);
    setCurrentTab('dashboard');
  };

  // Se o usuário não estiver autenticado, exibe a tela de Login exclusiva via CPF
  if (!isAuthenticated) {
    return <LoginView users={users} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#edf3f0] text-slate-800 p-3 sm:p-6 selection:bg-emerald-200">
      {/* Container Centralizado com bordas suaves */}
      <div className="max-w-6xl mx-auto">
        {/* Barra de Navegação no Topo */}
        <Navbar
          currentTab={currentTab}
          currentUser={currentUser}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onLogoutClick={() => setIsLogoutModalOpen(true)}
        />

        {/* Conteúdo da Aba Ativa */}
        <main>
          {currentTab === 'dashboard' && (
            <Dashboard
              vehicles={vehicles}
              records={records}
              enrichedRecords={enrichedRecords}
              efficiencyStats={efficiencyStats}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'cadastrar-veiculo' && (
            <VehicleRegistrationView
              vehicles={vehicles}
              onAddVehicle={handleAddVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'lancar-abastecimento' && (
            <RefuelFormView
              vehicles={vehicles}
              records={records}
              onAddRecord={handleAddRecord}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'extrato' && (
            <ExtratoView
              vehicles={vehicles}
              records={records}
              enrichedRecords={enrichedRecords}
              onDeleteRecord={handleDeleteRecord}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'gerenciar-usuarios' && (
            <UserManager
              users={users}
              vehicles={vehicles}
              currentUser={currentUser}
              onSwitchUser={handleSwitchUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onToggleStatus={handleToggleUserStatus}
            />
          )}

          {currentTab === 'relatorio-pdf' && (
            <PdfReportView
              vehicles={vehicles}
              records={records}
              enrichedRecords={enrichedRecords}
            />
          )}
        </main>
      </div>

      {/* Modal de Saída / Restaurar Dados */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <LogOut className="w-5 h-5 text-red-600" />
                <span>Sessão & Dados</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Você pode encerrar a sessão de <strong>{currentUser.name}</strong> e retornar à tela de login com CPF, ou limpar todos os registros locais para iniciar do zero.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                Encerrar Sessão (Ir para Login com CPF)
              </button>

              <button
                type="button"
                onClick={handleResetData}
                className="w-full py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Limpar Cache Local e Resetar
              </button>

              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-full py-2 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Permanecer Conectado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
