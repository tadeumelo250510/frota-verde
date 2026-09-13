import React, { useState, useMemo } from 'react';
import { Vehicle, RefuelRecord, RefuelWithCalculations } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { Printer, Download, FileText, Calendar, Filter, Trophy } from 'lucide-react';
import { LicensePlateBadge } from './LicensePlateBadge';

interface PdfReportViewProps {
  vehicles: Vehicle[];
  records: RefuelRecord[];
  enrichedRecords: RefuelWithCalculations[];
}

export const PdfReportView: React.FC<PdfReportViewProps> = ({
  vehicles,
  records,
  enrichedRecords,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  // Lista de meses disponíveis nos registros
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    records.forEach((r) => {
      const monthKey = r.date.substring(0, 7); // YYYY-MM
      monthsSet.add(monthKey);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [records]);

  // Registros filtrados para o relatório
  const reportRecords = useMemo(() => {
    return enrichedRecords.filter((r) => {
      const matchVeh = selectedVehicle === 'all' || r.vehicleId === selectedVehicle;
      const matchMonth = selectedMonth === 'all' || r.date.startsWith(selectedMonth);
      return matchVeh && matchMonth;
    });
  }, [enrichedRecords, selectedVehicle, selectedMonth]);

  // Indicadores consolidados do relatório
  const totalCost = reportRecords.reduce((acc, r) => acc + r.totalCost, 0);
  const totalLiters = reportRecords.reduce((acc, r) => acc + r.liters, 0);
  const totalKm = reportRecords.reduce(
    (acc, r) => acc + (r.kmDrivenSinceLast || 0),
    0
  );
  const avgKmL =
    totalKm > 0 && totalLiters > 0
      ? totalKm / totalLiters
      : totalCost > 0
      ? 3.33
      : 0;

  // Ranking da Frota: Todos os veículos cadastrados classificados de 1° ao último (Maior para Menor Gasto)
  const vehicleRanking = useMemo(() => {
    const statsMap = new Map<
      string,
      {
        refuelsCount: number;
        totalSpent: number;
        totalLiters: number;
        km: number;
      }
    >();

    reportRecords.forEach((r) => {
      const curr = statsMap.get(r.vehicleId) || {
        refuelsCount: 0,
        totalSpent: 0,
        totalLiters: 0,
        km: 0,
      };
      curr.refuelsCount += 1;
      curr.totalSpent += r.totalCost;
      curr.totalLiters += r.liters;
      curr.km += r.kmDrivenSinceLast || 0;
      statsMap.set(r.vehicleId, curr);
    });

    const targetVehicles =
      selectedVehicle === 'all'
        ? vehicles
        : vehicles.filter((v) => v.id === selectedVehicle);

    const ranking = targetVehicles.map((v) => {
      const stats = statsMap.get(v.id) || {
        refuelsCount: 0,
        totalSpent: 0,
        totalLiters: 0,
        km: 0,
      };
      const pct = totalCost > 0 ? (stats.totalSpent / totalCost) * 100 : 0;
      return {
        vehicleId: v.id,
        plate: v.plate,
        model: v.brand === 'Veículo' ? v.model : `${v.brand} ${v.model}`,
        plateType: v.plateType,
        cityState: v.cityState,
        refuelsCount: stats.refuelsCount,
        totalSpent: stats.totalSpent,
        totalLiters: stats.totalLiters,
        km: stats.km,
        percentage: pct,
      };
    });

    // Ordenação estrita: Maior Gasto para Menor Gasto
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
  }, [vehicles, reportRecords, selectedVehicle, totalCost]);

  // Exportar para CSV
  const handleExportCSV = () => {
    const headers = [
      'Data',
      'Placa',
      'Modelo',
      'Combustível',
      'Odômetro',
      'Litros',
      'Preço/L',
      'Gasto Total (R$)',
    ];

    const rows = reportRecords.map((r) => {
      const v = vehicleMap.get(r.vehicleId);
      return [
        r.date,
        v ? v.plate : '',
        v ? `${v.brand} ${v.model}` : '',
        r.fuelType,
        r.odometer,
        r.liters,
        r.pricePerLiter,
        r.totalCost,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_abastecimento_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar Ranking da Frota para CSV
  const handleExportRankingCSV = () => {
    const headers = [
      'Posição',
      'Placa',
      'Modelo',
      'Abastecimentos',
      'Volume Total (L)',
      'Gasto Total (R$)',
      'Participação Frota (%)',
    ];

    const rows = vehicleRanking.map((item, index) => [
      `${index + 1}°`,
      item.plate,
      item.model,
      item.refuelsCount,
      item.totalLiters.toFixed(2),
      item.totalSpent.toFixed(2),
      item.percentage.toFixed(2) + '%',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ranking_frota_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

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
      {/* Barra de Controles e Filtros (oculta na impressão) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#15803d]">
            Relatório Gerencial (PDF / Impressão)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Visualize o demonstrativo consolidado pronto para impressão ou salvamento em PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportRankingCSV}
            className="px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Exportar tabela de ranking dos veículos para CSV"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            Exportar Ranking CSV
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Exportar todos os abastecimentos detalhados para CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Exportar Extrato CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Gerar PDF
          </button>
        </div>
      </div>

      {/* Seletores de Filtro do Relatório (oculto na impressão) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 no-print">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-semibold text-slate-700">Filtrar Veículo:</span>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white text-slate-800 font-medium"
          >
            <option value="all">Todos os Veículos (Geral)</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.brand === 'Veículo' ? v.model : `${v.brand} ${v.model}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-semibold text-slate-700">Período / Mês:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white text-slate-800 font-medium"
          >
            <option value="all">Todo o Histórico</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documento Formatado para Relatório / PDF */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho do Relatório */}
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#15803d] uppercase tracking-wider">
              Relatório Executivo de Abastecimento
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Controle de Combustível & Frota
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Emitido em {new Date().toLocaleDateString('pt-BR')} às{' '}
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="text-right sm:self-center">
            <div className="text-xs text-slate-500">Escopo do Relatório:</div>
            <div className="text-sm font-bold text-slate-800">
              {selectedVehicle === 'all'
                ? 'Frota Completa (Todos os Veículos)'
                : `Veículo Placa ${vehicleMap.get(selectedVehicle)?.plate}`}
            </div>
          </div>
        </div>

        {/* Banner Consolidado Verde */}
        <div className="w-full bg-[#183626] text-white rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
            <span>📊</span>
            <span>Totais Consolidados do Período</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <span>
              Gasto Total:{' '}
              <strong className="text-[#22c55e] text-base sm:text-lg">
                {formatCurrency(totalCost)}
              </strong>
            </span>
            <span>
              Volume Total:{' '}
              <strong className="text-white text-base sm:text-lg">
                {formatNumber(totalLiters, 1)} L
              </strong>
            </span>
          </div>
        </div>

        {/* 3 Indicadores Principais */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#f8faf9] p-4 rounded-xl border border-slate-200 text-center">
            <div className="text-[11px] font-bold text-[#065f46] uppercase">
              Gasto Total
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(totalCost)}
            </div>
          </div>

          <div className="bg-[#f8faf9] p-4 rounded-xl border border-slate-200 text-center">
            <div className="text-[11px] font-bold text-[#065f46] uppercase">
              Total de Litros
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {formatNumber(totalLiters, 1)} L
            </div>
          </div>

          <div className="bg-[#f8faf9] p-4 rounded-xl border border-slate-200 text-center">
            <div className="text-[11px] font-bold text-[#065f46] uppercase">
              Média (km/L)
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {formatNumber(avgKmL, 2)} KM/L
            </div>
          </div>
        </div>

        {/* Seção de Ranking da Frota: Maior para Menor Gasto (1°, 2°, 3°...) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Ranking da Frota: Maior para Menor Gasto por Veículo
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Todos os veículos classificados de 1° ao último colocado
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-[#f1f5f9] text-slate-700 font-bold uppercase border-b border-slate-200 text-xs">
                <tr>
                  <th className="py-2.5 px-3 text-center w-16">Posição</th>
                  <th className="py-2.5 px-4">Veículo / Placa</th>
                  <th className="py-2.5 px-4">Modelo</th>
                  <th className="py-2.5 px-4 text-center">Abastecimentos</th>
                  <th className="py-2.5 px-4 text-right">Volume (L)</th>
                  <th className="py-2.5 px-4 text-right">Gasto Total (R$)</th>
                  <th className="py-2.5 px-4 text-right">% do Gasto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicleRanking.map((item, index) => {
                  const pos = `${index + 1}°`;
                  let badgeStyle =
                    'bg-slate-100 text-slate-700 border-slate-200 font-bold';

                  if (index === 0) {
                    badgeStyle =
                      'bg-amber-100 text-amber-900 border-amber-300 font-extrabold';
                  } else if (index === 1) {
                    badgeStyle =
                      'bg-slate-200 text-slate-800 border-slate-300 font-bold';
                  } else if (index === 2) {
                    badgeStyle =
                      'bg-amber-50 text-amber-900 border-amber-200 font-bold';
                  }

                  return (
                    <tr key={item.vehicleId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded text-xs border ${badgeStyle}`}
                        >
                          {pos}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <LicensePlateBadge
                          plate={item.plate}
                          plateType={item.plateType}
                          cityState={item.cityState}
                          size="sm"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">
                        {item.model}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-xs">
                          {item.refuelsCount} {item.refuelsCount === 1 ? 'abastecimento' : 'abastecimentos'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700 font-medium">
                        {formatNumber(item.totalLiters, 1)} L
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(item.totalSpent)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-[#15803d]">
                        {item.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhamento dos Abastecimentos */}
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2.5">
            Lançamentos de Abastecimento no Período
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-[#f1f5f9] text-slate-700 font-bold uppercase border-b border-slate-200 text-xs">
                <tr>
                  <th className="py-2.5 px-4">Data</th>
                  <th className="py-2.5 px-4">Veículo</th>
                  <th className="py-2.5 px-4">Odômetro</th>
                  <th className="py-2.5 px-4">Litros</th>
                  <th className="py-2.5 px-4">Preço/L</th>
                  <th className="py-2.5 px-4">Total (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportRecords.map((r) => {
                  const v = vehicleMap.get(r.vehicleId);
                  return (
                    <tr key={r.id}>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {formatDateBR(r.date)}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">
                        {v ? v.plate : '---'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono">
                        {r.odometer.toLocaleString()} km
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {formatNumber(r.liters, 1)} L
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {formatCurrency(r.pricePerLiter)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {formatCurrency(r.totalCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rodapé da Impressão */}
        <div className="pt-4 border-t border-slate-200 text-xs text-slate-400 flex items-center justify-between">
          <span>Controle de Abastecimento da Frota</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
};
