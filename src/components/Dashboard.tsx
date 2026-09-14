import React, { useState, useMemo } from 'react';
import {
  Vehicle,
  RefuelRecord,
  VehicleEfficiencyStats,
  RefuelWithCalculations,
} from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { LicensePlateBadge } from './LicensePlateBadge';
import { Trophy, Fuel, Gauge } from 'lucide-react';

interface DashboardProps {
  vehicles: Vehicle[];
  records: RefuelRecord[];
  enrichedRecords: RefuelWithCalculations[];
  efficiencyStats: VehicleEfficiencyStats[];
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

// Paleta de cores para os veículos nos gráficos de rosca (donut)
const VEHICLE_COLORS = [
  '#65a30d', // Verde oliva vibrante (como no screenshot)
  '#0284c7', // Azul oceânico (como no screenshot)
  '#f59e0b', // Âmbar
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#14b8a6', // Teal
];

interface DonutSlice {
  label: string;
  plate: string;
  value: number;
  formattedValue: string;
  percentage: number;
  color: string;
}

const SvgDonutChart: React.FC<{
  slices: DonutSlice[];
  unit: string;
  emptyText?: string;
}> = ({ slices, unit, emptyText = 'Sem dados' }) => {
  const [hoveredSlice, setHoveredSlice] = useState<DonutSlice | null>(null);

  const total = slices.reduce((acc, s) => acc + s.value, 0);

  if (total === 0 || slices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-slate-400 text-xs">
        <div className="w-28 h-28 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center mb-2">
          <span>0 {unit}</span>
        </div>
        <span>{emptyText}</span>
      </div>
    );
  }

  // Se tiver apenas 1 fatia, 100%
  const radius = 62;
  const strokeWidth = 36;
  const circumference = 2 * Math.PI * radius; // ~389.55

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {slices.map((slice, index) => {
            const strokeDash = (slice.percentage / 100) * circumference;
            const offset = (accumulatedPercent / 100) * circumference;
            accumulatedPercent += slice.percentage;

            return (
              <circle
                key={`${slice.plate}-${index}`}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeDashoffset={-offset}
                className="transition-all duration-300 cursor-pointer hover:opacity-85"
                onMouseEnter={() => setHoveredSlice(slice)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            );
          })}
        </svg>

        {/* Informação no centro do Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {hoveredSlice ? (
            <>
              <span className="text-[11px] font-bold text-slate-500 truncate max-w-[90px]">
                {hoveredSlice.plate}
              </span>
              <span className="text-sm font-extrabold text-slate-800">
                {hoveredSlice.percentage.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500">
                {hoveredSlice.formattedValue}
              </span>
            </>
          ) : (
            <div className="w-14 h-14 rounded-full bg-white shadow-2xs flex items-center justify-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Frota
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Legenda simples e elegante */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3 text-xs">
        {slices.map((slice, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
            onMouseEnter={() => setHoveredSlice(slice)}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="font-semibold text-slate-700">{slice.plate}</span>
            <span className="text-slate-400 text-[11px]">
              ({slice.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  vehicles,
  records,
  enrichedRecords,
  efficiencyStats,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');

  // Mapa rápido de veículo por id
  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  // Registros filtrados de acordo com o seletor
  const filteredRecords = useMemo(() => {
    if (selectedVehicleId === 'all') return records;
    return records.filter((r) => r.vehicleId === selectedVehicleId);
  }, [records, selectedVehicleId]);

  const filteredEnriched = useMemo(() => {
    if (selectedVehicleId === 'all') return enrichedRecords;
    return enrichedRecords.filter((r) => r.vehicleId === selectedVehicleId);
  }, [enrichedRecords, selectedVehicleId]);

  // Métricas Consolidadas
  const totalCost = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + r.totalCost, 0);
  }, [filteredRecords]);

  const totalLiters = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + r.liters, 0);
  }, [filteredRecords]);

  // Média km/L
  const avgKmL = useMemo(() => {
    const totalKm = filteredEnriched.reduce(
      (acc, r) => acc + (r.kmDrivenSinceLast || 0),
      0
    );
    if (totalKm > 0 && totalLiters > 0) {
      return totalKm / totalLiters;
    }
    // Se não tiver delta calculado mas tiver estatísticas de veículos
    if (selectedVehicleId === 'all') {
      const statsWithAvg = efficiencyStats.filter((s) => s.averageKmL > 0);
      if (statsWithAvg.length > 0) {
        const sum = statsWithAvg.reduce((acc, s) => acc + s.averageKmL, 0);
        return sum / statsWithAvg.length;
      }
    } else {
      const stat = efficiencyStats.find((s) => s.vehicleId === selectedVehicleId);
      if (stat && stat.averageKmL > 0) return stat.averageKmL;
    }
    return 0;
  }, [filteredEnriched, totalLiters, selectedVehicleId, efficiencyStats]);

  // Dados para os Gráficos de Rosca (Donut)
  // Gastos por Veículo
  const expensesDonutData = useMemo<DonutSlice[]>(() => {
    const vehicleTotals: { [key: string]: { value: number; plate: string } } = {};

    filteredRecords.forEach((r) => {
      const v = vehicleMap.get(r.vehicleId);
      const plate = v ? v.plate : 'Desconhecido';
      if (!vehicleTotals[r.vehicleId]) {
        vehicleTotals[r.vehicleId] = { value: 0, plate };
      }
      vehicleTotals[r.vehicleId].value += r.totalCost;
    });

    const totalSum = Object.values(vehicleTotals).reduce(
      (acc, item) => acc + item.value,
      0
    );

    return Object.entries(vehicleTotals).map(([vId, data], index) => {
      const pct = totalSum > 0 ? (data.value / totalSum) * 100 : 0;
      return {
        label: data.plate,
        plate: data.plate,
        value: data.value,
        formattedValue: formatCurrency(data.value),
        percentage: pct,
        color: VEHICLE_COLORS[index % VEHICLE_COLORS.length],
      };
    });
  }, [filteredRecords, vehicleMap]);

  // Volume de Litros por Veículo
  const litersDonutData = useMemo<DonutSlice[]>(() => {
    const vehicleTotals: { [key: string]: { value: number; plate: string } } = {};

    filteredRecords.forEach((r) => {
      const v = vehicleMap.get(r.vehicleId);
      const plate = v ? v.plate : 'Desconhecido';
      if (!vehicleTotals[r.vehicleId]) {
        vehicleTotals[r.vehicleId] = { value: 0, plate };
      }
      vehicleTotals[r.vehicleId].value += r.liters;
    });

    const totalSum = Object.values(vehicleTotals).reduce(
      (acc, item) => acc + item.value,
      0
    );

    return Object.entries(vehicleTotals).map(([vId, data], index) => {
      const pct = totalSum > 0 ? (data.value / totalSum) * 100 : 0;
      return {
        label: data.plate,
        plate: data.plate,
        value: data.value,
        formattedValue: `${formatNumber(data.value, 1)} L`,
        percentage: pct,
        color: VEHICLE_COLORS[index % VEHICLE_COLORS.length],
      };
    });
  }, [filteredRecords, vehicleMap]);

  // Ranking de Veículos: TODOS os veículos cadastrados somando Abastecimentos, Litros, Gastos e KM Total Percorrido
  const vehicleRanking = useMemo(() => {
    const vehicleStatsMap: {
      [key: string]: {
        refuelsCount: number;
        totalSpent: number;
        totalLiters: number;
        totalKm: number;
      };
    } = {};

    // Mapear também km das estatísticas consolidadas se disponível
    const efficiencyMap = new Map<string, VehicleEfficiencyStats>();
    efficiencyStats.forEach((s) => efficiencyMap.set(s.vehicleId, s));

    filteredRecords.forEach((rec) => {
      if (!vehicleStatsMap[rec.vehicleId]) {
        vehicleStatsMap[rec.vehicleId] = {
          refuelsCount: 0,
          totalSpent: 0,
          totalLiters: 0,
          totalKm: 0,
        };
      }
      vehicleStatsMap[rec.vehicleId].refuelsCount += 1;
      vehicleStatsMap[rec.vehicleId].totalSpent += rec.totalCost;
      vehicleStatsMap[rec.vehicleId].totalLiters += rec.liters;
    });

    // Somar o KM percorrido real calculado de cada veículo através dos registros enriquecidos
    filteredEnriched.forEach((rec) => {
      if (vehicleStatsMap[rec.vehicleId] && rec.kmDrivenSinceLast && rec.kmDrivenSinceLast > 0) {
        vehicleStatsMap[rec.vehicleId].totalKm += rec.kmDrivenSinceLast;
      }
    });

    const totalAllSpent = Object.values(vehicleStatsMap).reduce(
      (acc, curr) => acc + curr.totalSpent,
      0
    );

    // Incluir TODOS os veículos cadastrados no sistema
    const ranking = vehicles.map((v) => {
      const stats = vehicleStatsMap[v.id] || {
        refuelsCount: 0,
        totalSpent: 0,
        totalLiters: 0,
        totalKm: 0,
      };

      // Se o totalKm ainda for 0 mas houver estatística consolidada com KM maior que zero, utilizar
      let vehicleTotalKm = stats.totalKm;
      if (vehicleTotalKm === 0 && selectedVehicleId === 'all') {
        const eff = efficiencyMap.get(v.id);
        if (eff && eff.totalKm > 0) {
          vehicleTotalKm = eff.totalKm;
        }
      }

      const pct = totalAllSpent > 0 ? (stats.totalSpent / totalAllSpent) * 100 : 0;
      return {
        vehicleId: v.id,
        plate: v.plate,
        model: v.model,
        brand: v.brand,
        year: v.year,
        plateType: v.plateType,
        cityState: v.cityState,
        refuelsCount: stats.refuelsCount,
        totalSpent: stats.totalSpent,
        totalLiters: stats.totalLiters,
        totalKm: vehicleTotalKm,
        percentage: pct,
      };
    });

    // Ordenar do veículo que mais gastou para o que menos gastou
    ranking.sort((a, b) => {
      if (b.totalSpent !== a.totalSpent) {
        return b.totalSpent - a.totalSpent;
      }
      if (b.refuelsCount !== a.refuelsCount) {
        return b.refuelsCount - a.refuelsCount;
      }
      return a.plate.localeCompare(b.plate);
    });

    return ranking;
  }, [vehicles, filteredRecords, filteredEnriched, efficiencyStats, selectedVehicleId]);

  // Total de abastecimentos somados no ranking
  const totalRefuelsInRanking = useMemo(() => {
    return vehicleRanking.reduce((acc, item) => acc + item.refuelsCount, 0);
  }, [vehicleRanking]);

  // Total de KM percorrido somado no ranking
  const totalKmInRanking = useMemo(() => {
    return vehicleRanking.reduce((acc, item) => acc + item.totalKm, 0);
  }, [vehicleRanking]);

  return (
    <div className="space-y-5">
      {/* Linha de Título e Filtro de Veículo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#15803d]">
          Dashboard Gerencial
        </h1>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label
            htmlFor="vehicle-filter"
            className="text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap"
          >
            Filtrar Veículo:
          </label>
          <div className="relative">
            <select
              id="vehicle-filter"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white text-slate-800 font-medium shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] cursor-pointer"
            >
              <option value="all">🌐 Todos os Veículos (Geral)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  🚗 {v.plate} ({v.brand === 'Veículo' ? v.model : `${v.brand} ${v.model}`})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Faixa Verde Escura Consolidada da Frota */}
      <div className="w-full bg-[#183626] text-white rounded-xl px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center gap-2 text-sm sm:text-base font-semibold">
          <span className="text-base">📊</span>
          <span>Visão Geral Consolidada da Frota:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-7 text-xs sm:text-sm font-medium">
          <div>
            <span className="opacity-90">Gasto Total Geral: </span>
            <span className="text-[#22c55e] font-bold text-sm sm:text-base">
              {formatCurrency(totalCost)}
            </span>
          </div>

          <div>
            <span className="opacity-90">Volume Total Geral: </span>
            <span className="text-white font-bold text-sm sm:text-base">
              {formatNumber(totalLiters, 1)} L
            </span>
          </div>
        </div>
      </div>

      {/* Três Cards Principais de Indicadores (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: GASTO TOTAL */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs text-center flex flex-col items-center justify-center min-h-[105px]">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-[#065f46] uppercase">
            GASTO TOTAL
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {formatCurrency(totalCost)}
          </span>
        </div>

        {/* Card 2: TOTAL DE LITROS */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs text-center flex flex-col items-center justify-center min-h-[105px]">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-[#065f46] uppercase">
            TOTAL DE LITROS
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {formatNumber(totalLiters, 1)} L
          </span>
        </div>

        {/* Card 3: MÉDIA (KM/L) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs text-center flex flex-col items-center justify-center min-h-[105px]">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-[#065f46] uppercase">
            MÉDIA (KM/L)
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {formatNumber(avgKmL, 2)} KM/L
          </span>
        </div>
      </div>

      {/* Grade de Gráficos de Rosca Lado a Lado (Gastos e Volume) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card: Gastos por Veículo (R$) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 text-center mb-2">
            Gastos por Veículo (R$)
          </h3>
          <SvgDonutChart slices={expensesDonutData} unit="R$" />
        </div>

        {/* Card: Volume de Litros por Veículo */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 text-center mb-2">
            Volume de Litros por Veículo
          </h3>
          <SvgDonutChart slices={litersDonutData} unit="L" />
        </div>
      </div>

      {/* Seção Completa de Ranking da Frota: Visão Total sem Rolagem Horizontal */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Ranking da Frota: Maior para Menor Gasto por Carro
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Todos os veículos cadastrados classificados de 1° ao último colocado com soma de abastecimentos e gastos
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-[#15803d] border border-emerald-200 self-start sm:self-auto">
            {vehicleRanking.length} {vehicleRanking.length === 1 ? 'veículo' : 'veículos cadastrados'}
          </span>
        </div>

        <div className="w-full rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8fafc] text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-2 sm:px-3 text-center w-14 sm:w-16">Posição</th>
                <th className="py-3 px-3 sm:px-4">Veículo</th>
                <th className="py-3 px-2 sm:px-3 text-center w-28 sm:w-36">Abastecimentos</th>
                <th className="py-3 px-2 sm:px-3 text-right w-28 sm:w-36">KM Percorrido</th>
                <th className="py-3 px-2 sm:px-3 text-right w-24 sm:w-32">Volume Total</th>
                <th className="py-3 px-3 sm:px-4 text-right w-36 sm:w-48">Gasto Total (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicleRanking.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-xs text-slate-400"
                  >
                    Nenhum veículo cadastrado na frota
                  </td>
                </tr>
              ) : (
                vehicleRanking.map((item, index) => {
                  const posNumber = `${index + 1}°`;
                  let badgeStyle =
                    'bg-slate-100 text-slate-700 border-slate-200 font-semibold';

                  if (index === 0) {
                    badgeStyle =
                      'bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-2xs';
                  } else if (index === 1) {
                    badgeStyle =
                      'bg-slate-200 text-slate-800 border-slate-300 font-bold shadow-2xs';
                  } else if (index === 2) {
                    badgeStyle =
                      'bg-amber-50 text-amber-900 border-amber-200 font-bold shadow-2xs';
                  }

                  return (
                    <tr
                      key={item.vehicleId}
                      className="hover:bg-slate-50/80 transition-colors text-xs sm:text-sm"
                    >
                      <td className="py-3 px-2 sm:px-3 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded-md text-xs border ${badgeStyle}`}
                        >
                          {posNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                          <LicensePlateBadge
                            plate={item.plate}
                            plateType={item.plateType}
                            cityState={item.cityState}
                            size="sm"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-800 truncate text-xs sm:text-sm">
                              {item.model}
                            </span>
                            {item.year && (
                              <span className="text-[10px] text-slate-400">
                                Ano {item.year}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                          {item.refuelsCount} {item.refuelsCount === 1 ? 'abastecimento' : 'abastecimentos'}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm font-mono">
                          {item.totalKm.toLocaleString('pt-BR')} km
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatNumber(item.totalLiters, 1)} L
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {formatCurrency(item.totalSpent)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.percentage.toFixed(1)}% da frota
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {vehicleRanking.length > 0 && (
          <div className="mt-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 px-1">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Total de carros: <strong>{vehicleRanking.length}</strong>
              </span>
              <span>•</span>
              <span>
                Abastecimentos somados:{' '}
                <strong>{totalRefuelsInRanking}</strong>
              </span>
              <span>•</span>
              <span>
                KM Total da Frota:{' '}
                <strong className="text-slate-700">{totalKmInRanking.toLocaleString('pt-BR')} km</strong>
              </span>
            </div>
            <span className="font-bold text-slate-800 text-xs sm:text-sm">
              Soma Geral da Frota: {formatCurrency(totalCost)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
