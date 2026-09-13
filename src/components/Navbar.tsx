import React from 'react';
import { AppUser } from '../types';
import { Crown, Shield, Briefcase, Database } from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'cadastrar-veiculo'
  | 'lancar-abastecimento'
  | 'extrato'
  | 'gerenciar-usuarios'
  | 'relatorio-pdf'
  | 'auditoria-operacoes';

interface NavbarProps {
  currentTab: NavTab;
  currentUser?: AppUser;
  onSelectTab: (tab: NavTab) => void;
  onLogoutClick: () => void;
  isRealtimeConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  currentUser,
  onSelectTab,
  onLogoutClick,
  isRealtimeConnected = true,
}) => {
  const tabs: { id: NavTab; label: string; rootOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'cadastrar-veiculo', label: 'Cadastrar Veículo' },
    { id: 'lancar-abastecimento', label: 'Lançar Abastecimento' },
    { id: 'extrato', label: 'Extrato' },
    { id: 'gerenciar-usuarios', label: 'Gerenciar Usuários' },
    { id: 'relatorio-pdf', label: 'Relatório PDF' },
    ...(currentUser?.isRoot
      ? [{ id: 'auditoria-operacoes' as NavTab, label: 'Auditoria (Root)', rootOnly: true }]
      : []),
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs px-4 py-3 sm:px-6 sm:py-3.5 mb-6 no-print">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Navigation Buttons Row */}
        <nav className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#15803d] text-white shadow-xs'
                    : 'bg-[#e2e8f0] text-slate-700 hover:bg-[#cbd5e1] hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right side: Active User Badge & Sair Button */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Supabase Status Indicator */}
          <div
            title={isRealtimeConnected ? 'Supabase Conectado & Realtime Ativo' : 'Supabase Sincronizando...'}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
              isRealtimeConnected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <Database className={`w-3.5 h-3.5 ${isRealtimeConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>{isRealtimeConnected ? 'Supabase Realtime' : 'Supabase'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'
              }`}
            ></span>
          </div>

          {currentUser && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                currentUser.isRoot
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {currentUser.isRoot ? (
                <Crown className="w-3.5 h-3.5 text-amber-600" />
              ) : currentUser.role === 'Administrador' ? (
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="truncate max-w-[130px]">{currentUser.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-white/80 border border-slate-200">
                {currentUser.isRoot ? 'Root' : currentUser.role}
              </span>
            </div>
          )}

          {/* Botão Sair */}
          <button
            id="btn-sair"
            type="button"
            onClick={onLogoutClick}
            className="px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#b91c1c] text-white hover:bg-[#991b1b] transition-colors cursor-pointer shadow-xs"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};
