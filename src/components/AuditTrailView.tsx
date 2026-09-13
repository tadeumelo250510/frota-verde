import React, { useState, useMemo } from 'react';
import { AuditLogEntry, AuditActionType, AuditEntityType, AppUser } from '../types';
import {
  ShieldAlert,
  Search,
  Filter,
  Trash2,
  Clock,
  User,
  PlusCircle,
  Pencil,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Crown,
  Shield,
  Briefcase,
  History,
  RotateCcw,
} from 'lucide-react';

interface AuditTrailViewProps {
  logs: AuditLogEntry[];
  currentUser: AppUser;
  onClearLogs?: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  logs,
  currentUser,
  onClearLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');

  // Filtros
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        !searchTerm ||
        log.entityDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedBy.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchAction = selectedAction === 'all' || log.action === selectedAction;
      const matchEntity = selectedEntity === 'all' || log.entityType === selectedEntity;

      return matchSearch && matchAction && matchEntity;
    });
  }, [logs, searchTerm, selectedAction, selectedEntity]);

  // Contadores
  const stats = useMemo(() => {
    const total = logs.length;
    const creates = logs.filter((l) => l.action === 'CRIAR').length;
    const updates = logs.filter((l) => l.action === 'EDITAR' || l.action === 'STATUS').length;
    const deletes = logs.filter((l) => l.action === 'EXCLUIR').length;
    return { total, creates, updates, deletes };
  }, [logs]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CRIAR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            Cadastro
          </span>
        );
      case 'EDITAR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Pencil className="w-3.5 h-3.5 text-blue-600" />
            Edição
          </span>
        );
      case 'STATUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            Status Alterado
          </span>
        );
      case 'EXCLUIR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            Exclusão
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#15803d]">
              Auditoria de Operações
            </h2>
            <span className="px-2.5 py-1 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              Exclusivo Root
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rastreamento detalhado de quem cadastrou, editou ou excluiu veículos, abastecimentos e usuários no sistema.
          </p>
        </div>

        {currentUser.isRoot && onClearLogs && logs.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Tem certeza de que deseja limpar o histórico de auditoria local?')) {
                onClearLogs();
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            title="Limpar registros de auditoria"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            Limpar Histórico
          </button>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">
            Total de Operações
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
            {stats.total}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-700">
            Cadastros Realizados
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
            {stats.creates}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-blue-700">
            Edições & Alterações
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5">
            {stats.updates}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-red-700">
            Exclusões Efetuadas
          </span>
          <div className="text-xl sm:text-2xl font-black text-red-600 mt-0.5">
            {stats.deletes}
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por administrador, placa, veículo ou detalhes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 focus:border-[#15803d]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#15803d]/20"
          >
            <option value="all">Todas as Ações</option>
            <option value="CRIAR">Apenas Cadastros</option>
            <option value="EDITAR">Apenas Edições</option>
            <option value="EXCLUIR">Apenas Exclusões</option>
            <option value="STATUS">Apenas Troca de Status</option>
          </select>

          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#15803d]/20"
          >
            <option value="all">Todos os Módulos</option>
            <option value="Veículo">Veículos</option>
            <option value="Abastecimento">Abastecimentos</option>
            <option value="Usuário">Usuários</option>
          </select>
        </div>
      </div>

      {/* Tabela de Auditoria */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f1f5f9] text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data & Horário</th>
                <th className="py-3 px-4">Administrador Responsável</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Item Afetado</th>
                <th className="py-3 px-4">Detalhes da Operação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhum registro de auditoria encontrado</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Qualquer cadastro, edição ou exclusão efetuada por administradores será registrada e exibida aqui.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Data/Horário */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Quem executou a ação */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            log.performedBy.isRoot
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-[#15803d] border border-emerald-300'
                          }`}
                        >
                          {log.performedBy.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{log.performedBy.name}</span>
                            {log.performedBy.isRoot && (
                              <Crown className="w-3.5 h-3.5 text-amber-600" title="Administrador Root" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {log.performedBy.email} •{' '}
                            <span className="font-medium text-slate-700">{log.performedBy.role}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Ação */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Módulo */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {log.entityType}
                      </span>
                    </td>

                    {/* Item Afetado */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {log.entityDescription}
                    </td>

                    {/* Detalhes */}
                    <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate" title={log.details}>
                      {log.details || '---'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
