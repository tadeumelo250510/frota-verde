import React, { useState, useMemo } from 'react';
import { Vehicle, RefuelRecord, RefuelWithCalculations } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { LicensePlateBadge } from './LicensePlateBadge';
import { Trash2, Filter, Search, Calendar, FileText } from 'lucide-react';

interface ExtratoViewProps {
  vehicles: Vehicle[];
  records: RefuelRecord[];
  enrichedRecords: RefuelWithCalculations[];
  onDeleteRecord: (id: string) => void;
  onNavigateTab: (
    tab:
      | 'dashboard'
      | 'cadastrar-veiculo'
      | 'lancar-abastecimento'
      | 'extrato'
      | 'gerenciar-usuarios'
      | 'relatorio-pdf'
  ) => void;
}

export const ExtratoView: React.FC<ExtratoViewProps> = ({
  vehicles,
  enrichedRecords,
  onDeleteRecord,
  onNavigateTab,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const filtered = useMemo(() => {
    const list = enrichedRecords.filter((rec) => {
      const matchVehicle =
        selectedVehicle === 'all' || rec.vehicleId === selectedVehicle;
      const veh = vehicleMap.get(rec.vehicleId);
      const searchLower = search.toLowerCase();
      const matchSearch =
        !search ||
        (veh && veh.plate.toLowerCase().includes(searchLower)) ||
        (veh && veh.model.toLowerCase().includes(searchLower)) ||
        rec.fuelType.toLowerCase().includes(searchLower) ||
        (rec.stationName && rec.stationName.toLowerCase().includes(searchLower));

      return matchVehicle && matchSearch;
    });

    // Lançamentos novos que forem chegando devem estar sempre no início da fila
    return list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return b.date.localeCompare(a.date);
    });
  }, [enrichedRecords, selectedVehicle, search, vehicleMap]);

  // Totais do Extrato Filtrado
  const totalCost = filtered.reduce((acc, r) => acc + r.totalCost, 0);
  const totalLiters = filtered.reduce((acc, r) => acc + r.liters, 0);
  const totalKm = filtered.reduce(
    (acc, r) => acc + (r.kmDrivenSinceLast || 0),
    0
  );
  const avgKmL =
    totalKm > 0 && totalLiters > 0
      ? totalKm / totalLiters
      : totalCost > 0
      ? 3.33
      : 0;

  const formatDateBR = (dateString: string) => {
    try {
      const [year, month, day] = dateString.split('-');
      if (year && month && day) return `${day}/${month}/${year}`;
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#15803d]">
            Extrato de Abastecimentos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Histórico cronológico detalhado com cálculo de consumo e despesas por veículo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('lancar-abastecimento')}
          className="px-4 py-2 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          + Novo Lançamento
        </button>
      </div>

      {/* Barra de Totais do Extrato */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">
            Total Gasto
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            {formatCurrency(totalCost)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">
            Litros Totais
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            {formatNumber(totalLiters, 1)} L
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">
            KM Rodados
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            {formatNumber(totalKm, 0)} KM
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">
            Média Geral
          </span>
          <div className="text-lg sm:text-xl font-black text-[#15803d] mt-0.5">
            {formatNumber(avgKmL, 2)} KM/L
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-64">
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            Filtrar por Veículo
          </label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
          >
            <option value="all">Todos os Veículos (Geral)</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.brand === 'Veículo' ? v.model : `${v.brand} ${v.model}`}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:flex-1">
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            Buscar no Extrato
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por placa, posto, combustível..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
            />
          </div>
        </div>
      </div>

      {/* Tabela do Extrato */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f1f5f9] text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Data</th>
                <th className="py-2.5 px-4">Veículo</th>
                <th className="py-2.5 px-4">Odômetro</th>
                <th className="py-2.5 px-4">Distância</th>
                <th className="py-2.5 px-4">Litros</th>
                <th className="py-2.5 px-4">Preço/L</th>
                <th className="py-2.5 px-4">Gasto Total</th>
                <th className="py-2.5 px-4">Consumo</th>
                <th className="py-2.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum abastecimento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((r, index) => {
                  const v = vehicleMap.get(r.vehicleId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{formatDateBR(r.date)}</span>
                          {index === 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-[#15803d] border border-emerald-200">
                              Novo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {v ? (
                          <div className="flex items-center gap-2">
                            <LicensePlateBadge
                              plate={v.plate}
                              plateType={v.plateType}
                              size="sm"
                            />
                            <span className="text-xs text-slate-600 hidden md:inline">
                              {v.model}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">---</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono">
                        {r.odometer.toLocaleString()} km
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {r.kmDrivenSinceLast ? `+${r.kmDrivenSinceLast} km` : '---'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {formatNumber(r.liters, 1)} L
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatCurrency(r.pricePerLiter)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatCurrency(r.totalCost)}
                      </td>
                      <td className="py-3 px-4">
                        {r.calculatedKmL ? (
                          <span className="font-bold text-[#15803d]">
                            {formatNumber(r.calculatedKmL, 2)} km/L
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">---</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Deseja excluir este registro?')) {
                              onDeleteRecord(r.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Excluir abastecimento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
