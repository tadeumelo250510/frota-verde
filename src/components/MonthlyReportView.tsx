import React, { useState } from 'react';
import {
  FileBarChart,
  Calendar,
  DollarSign,
  Fuel,
  Printer,
  Download,
  Car,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  MonthlyReportSummary,
  Vehicle,
} from '../types';
import { LicensePlateBadge } from './LicensePlateBadge';
import { formatCurrency, formatNumber } from '../utils/calculations';

interface MonthlyReportViewProps {
  monthlyReports: MonthlyReportSummary[];
  vehicles: Vehicle[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  monthlyReports,
  vehicles,
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    monthlyReports[0]?.monthKey || ''
  );

  const currentReport =
    monthlyReports.find((r) => r.monthKey === selectedMonthKey) ||
    monthlyReports[0];

  // Exportar para CSV
  const handleExportCSV = () => {
    if (!currentReport) return;

    const headers = [
      'Data',
      'Veículo',
      'Placa',
      'Padrão Placa',
      'Combustível',
      'Odômetro (KM)',
      'Km Rodados',
      'Litros',
      'Preço/L (R$)',
      'Total (R$)',
      'Consumo Médio (km/L)',
      'Custo por KM (R$/km)',
      'Posto',
    ];

    const rows = currentReport.records.map((r) => [
      r.date,
      r.vehicle?.model || '',
      r.vehicle?.plate || '',
      r.vehicle?.plateType === 'mercosul' ? 'Mercosul' : 'Tradicional',
      r.fuelType,
      r.odometer,
      r.kmDrivenSinceLast || '',
      r.liters,
      r.pricePerLiter,
      r.totalCost,
      r.calculatedKmL || '',
      r.costPerKm || '',
      `"${r.stationName || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `relatorio_abastecimento_${currentReport.monthKey}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!currentReport) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-emerald-100">
        <FileBarChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">
          Nenhum relatório mensal disponível
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Lance abastecimentos para gerar demonstrativos mensais automáticos.
        </p>
      </div>
    );
  }

  // Preço médio do litro no mês
  const avgPricePerLiter =
    currentReport.totalLiters > 0
      ? currentReport.totalCost / currentReport.totalLiters
      : 0;

  // Encontrar o maior gasto dos meses para normalizar o gráfico de barras
  const maxMonthCost = Math.max(...monthlyReports.map((m) => m.totalCost), 1);

  return (
    <div className="space-y-8">
      {/* Cabeçalho do Relatório & Seletor de Mês */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Relatório Mensal Consolidado
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentReport.monthLabel}
          </h2>
          <p className="text-xs text-slate-500">
            Demonstrativo analítico de despesas com combustível, consumo médio e eficiência
          </p>
        </div>

        {/* Seletor de Mês e Ações de Exportação */}
        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <div className="flex items-center gap-2 bg-[#f7faf8] px-3 py-1.5 rounded-xl border border-emerald-100">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              aria-label="Selecionar Mês do Relatório"
              className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              {monthlyReports.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.monthLabel} ({formatCurrency(m.totalCost)})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Exportar dados para planilha CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            title="Imprimir relatório"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Grid de KPIs do Mês Selecionado */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Gasto */}
        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-xs col-span-2 sm:col-span-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Gasto no Mês
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(currentReport.totalCost)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {currentReport.refuelsCount} abastecimento(s) realizados
          </div>
        </div>

        {/* Consumo Médio */}
        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Consumo Médio
          </div>
          <div className="text-xl font-extrabold text-emerald-800">
            {currentReport.averageKmL > 0
              ? `${formatNumber(currentReport.averageKmL, 2)} km/L`
              : '--'}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-semibold">
            Eficiência ponderada
          </div>
        </div>

        {/* Custo por KM */}
        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Custo por KM
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {currentReport.averageCostPerKm > 0
              ? `${formatCurrency(currentReport.averageCostPerKm)}/km`
              : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Gasto / Km rodado
          </div>
        </div>

        {/* Km Percorridos */}
        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Km Percorridos
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {formatNumber(currentReport.totalKmDriven, 0)} km
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Distância total
          </div>
        </div>

        {/* Litros e Preço Médio */}
        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Litragem Total
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {formatNumber(currentReport.totalLiters, 1)} L
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Méd. {formatCurrency(avgPricePerLiter)}/L
          </div>
        </div>
      </div>

      {/* Gráficos Interativos SVG de Evolução Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        {/* Gráfico 1: Evolução dos Gastos Mensais (Barras SVG) */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Evolução dos Gastos por Mês (R$)
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Comparativo de investimento mensal em combustível
          </p>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
            {monthlyReports
              .slice()
              .reverse()
              .map((rep) => {
                const heightPercent = Math.max(
                  15,
                  Math.round((rep.totalCost / maxMonthCost) * 100)
                );
                const isCurrent = rep.monthKey === currentReport.monthKey;

                return (
                  <div
                    key={rep.monthKey}
                    onClick={() => setSelectedMonthKey(rep.monthKey)}
                    className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700 transition">
                      {formatCurrency(rep.totalCost)}
                    </div>
                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg relative flex items-end h-28 overflow-hidden">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isCurrent
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/20'
                            : 'bg-emerald-300/80 group-hover:bg-emerald-400'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold truncate max-w-[65px] ${
                        isCurrent
                          ? 'text-emerald-800 font-extrabold underline decoration-2'
                          : 'text-slate-500'
                      }`}
                    >
                      {rep.monthKey.slice(5)}/{rep.monthKey.slice(2, 4)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Gráfico 2: Evolução do Consumo Médio (km/L) */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Consumo Médio da Frota (km/L)
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Histórico da média de rendimento por litro
          </p>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
            {monthlyReports
              .slice()
              .reverse()
              .map((rep) => {
                const maxKmL = 18;
                const heightPercent = Math.min(
                  100,
                  Math.max(15, Math.round((rep.averageKmL / maxKmL) * 100))
                );
                const isCurrent = rep.monthKey === currentReport.monthKey;

                return (
                  <div
                    key={rep.monthKey}
                    onClick={() => setSelectedMonthKey(rep.monthKey)}
                    className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-emerald-800 group-hover:text-emerald-600 transition">
                      {rep.averageKmL > 0 ? `${formatNumber(rep.averageKmL, 1)} km/L` : '--'}
                    </div>
                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg relative flex items-end h-28 overflow-hidden">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isCurrent
                            ? 'bg-gradient-to-t from-teal-700 to-emerald-500 shadow-md'
                            : 'bg-teal-300/80 group-hover:bg-teal-400'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold truncate max-w-[65px] ${
                        isCurrent
                          ? 'text-emerald-800 font-extrabold underline decoration-2'
                          : 'text-slate-500'
                      }`}
                    >
                      {rep.monthKey.slice(5)}/{rep.monthKey.slice(2, 4)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Divisão por Veículo & Combustível */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalhamento de Despesas por Veículo */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                Desempenho dos Veículos no Mês
              </h3>
              <p className="text-xs text-slate-500">
                Consumo individual apurado para cada placa cadastrada
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Placa / Veículo</th>
                  <th className="py-2.5 px-3 text-right">Km Percorrido</th>
                  <th className="py-2.5 px-3 text-right">Litros</th>
                  <th className="py-2.5 px-3 text-right">Consumo Médio</th>
                  <th className="py-2.5 px-3 text-right">Custo/km</th>
                  <th className="py-2.5 px-3 text-right">Total Gasto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {currentReport.vehicleBreakdown.map((vb) => (
                  <tr key={vb.vehicleId} className="hover:bg-[#f7faf8] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <LicensePlateBadge
                          plate={vb.plate}
                          plateType={vb.plateType}
                          size="sm"
                        />
                        <span className="font-bold text-slate-900 truncate max-w-[150px]">
                          {vb.model}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-800">
                      {formatNumber(vb.totalKm, 0)} km
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700">
                      {formatNumber(vb.totalLiters, 1)} L
                    </td>
                    <td className="py-3 px-3 text-right">
                      {vb.avgKmL > 0 ? (
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                          {formatNumber(vb.avgKmL, 2)} km/L
                        </span>
                      ) : (
                        <span className="text-slate-400">---</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700">
                      {vb.avgCostPerKm > 0 ? formatCurrency(vb.avgCostPerKm) : '---'}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {formatCurrency(vb.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Divisão por Tipo de Combustível */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-100 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <Fuel className="w-4 h-4 text-emerald-600" />
            Gastos por Tipo de Combustível
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Distribuição percentual dos gastos no mês
          </p>

          <div className="space-y-4">
            {currentReport.fuelBreakdown.map((fb) => (
              <div key={fb.fuelType} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{fb.fuelType}</span>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900">
                      {formatCurrency(fb.totalCost)}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-1.5">
                      ({formatNumber(fb.totalLiters, 1)} L • {fb.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${fb.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-[#f7faf8] -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Total Consolidado:</span>
              <span className="text-emerald-800 text-sm font-extrabold">
                {formatCurrency(currentReport.totalCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Completa de Registros do Mês */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-100 shadow-xs">
        <h3 className="text-base font-extrabold text-slate-900 mb-1">
          Extrato Detalhado dos Abastecimentos de {currentReport.monthLabel}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Todos os tickets de abastecimento do período com odômetros e cálculo de consumo
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-emerald-100 bg-[#f7faf8] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Placa / Veículo</th>
                <th className="py-2.5 px-3">Odômetro</th>
                <th className="py-2.5 px-3">Km Rodados</th>
                <th className="py-2.5 px-3">Combustível</th>
                <th className="py-2.5 px-3 text-right">Litros</th>
                <th className="py-2.5 px-3 text-right">Preço/L</th>
                <th className="py-2.5 px-3 text-right">Consumo (km/L)</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentReport.records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                    {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {r.vehicle && (
                        <LicensePlateBadge
                          plate={r.vehicle.plate}
                          plateType={r.vehicle.plateType}
                          size="sm"
                        />
                      )}
                      <span className="font-bold text-slate-800">
                        {r.vehicle?.model}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    {formatNumber(r.odometer, 0)} km
                  </td>
                  <td className="py-2.5 px-3">
                    {r.kmDrivenSinceLast ? (
                      <span className="font-bold text-slate-800">
                        +{r.kmDrivenSinceLast} km
                      </span>
                    ) : (
                      <span className="text-slate-400">---</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {r.fuelType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                    {formatNumber(r.liters, 2)} L
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">
                    {formatCurrency(r.pricePerLiter)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {r.calculatedKmL ? (
                      <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                        {formatNumber(r.calculatedKmL, 2)} km/L
                      </span>
                    ) : (
                      <span className="text-slate-400">---</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                    {formatCurrency(r.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
