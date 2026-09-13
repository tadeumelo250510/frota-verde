import {
  Vehicle,
  RefuelRecord,
  RefuelWithCalculations,
  VehicleEfficiencyStats,
  EfficiencyRating,
  MonthlyReportSummary,
  FuelType,
} from '../types';

/**
 * Ordena registros de abastecimento cronologicamente (data e odômetro)
 */
export function sortRefuels(records: RefuelRecord[], ascending = true): RefuelRecord[] {
  return [...records].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) {
      return ascending ? dateComp : -dateComp;
    }
    return ascending ? a.odometer - b.odometer : b.odometer - a.odometer;
  });
}

/**
 * Adiciona cálculos por registro de abastecimento (distância percorrida, km/l e r$/km)
 */
export function calculateRefuelsWithMetrics(
  records: RefuelRecord[],
  vehicles: Vehicle[]
): RefuelWithCalculations[] {
  const vehicleMap = new Map<string, Vehicle>();
  vehicles.forEach((v) => vehicleMap.set(v.id, v));

  // Agrupar por veículo para calcular km entre abastecimentos sequenciais
  const byVehicle: Record<string, RefuelRecord[]> = {};
  records.forEach((r) => {
    if (!byVehicle[r.vehicleId]) {
      byVehicle[r.vehicleId] = [];
    }
    byVehicle[r.vehicleId].push(r);
  });

  const metricsMap = new Map<
    string,
    {
      kmDrivenSinceLast?: number;
      calculatedKmL?: number;
      costPerKm?: number;
    }
  >();

  Object.entries(byVehicle).forEach(([vehicleId, vRecords]) => {
    const vehicle = vehicleMap.get(vehicleId);
    const sorted = sortRefuels(vRecords, true);

    sorted.forEach((record, idx) => {
      let kmDrivenSinceLast: number | undefined;
      let calculatedKmL: number | undefined;
      let costPerKm: number | undefined;

      if (idx === 0) {
        // Primeiro abastecimento cadastrado
        if (vehicle && record.odometer > vehicle.initialOdometer) {
          kmDrivenSinceLast = record.odometer - vehicle.initialOdometer;
          if (record.liters > 0) {
            calculatedKmL = Number((kmDrivenSinceLast / record.liters).toFixed(2));
            costPerKm = Number((record.totalCost / kmDrivenSinceLast).toFixed(2));
          }
        }
      } else {
        const prev = sorted[idx - 1];
        if (record.odometer > prev.odometer) {
          kmDrivenSinceLast = record.odometer - prev.odometer;
          if (record.liters > 0) {
            calculatedKmL = Number((kmDrivenSinceLast / record.liters).toFixed(2));
            costPerKm = Number((record.totalCost / kmDrivenSinceLast).toFixed(2));
          }
        }
      }

      metricsMap.set(record.id, {
        kmDrivenSinceLast,
        calculatedKmL,
        costPerKm,
      });
    });
  });

  // Retorna na ordem exata de chegada em 'records', garantindo que novos lançamentos
  // inseridos fiquem no início da fila
  return records.map((record) => {
    const vehicle = vehicleMap.get(record.vehicleId);
    const metrics = metricsMap.get(record.id) || {};
    return {
      ...record,
      vehicle,
      ...metrics,
    };
  });
}

/**
 * Calcula a classificação de eficiência baseada na meta do veículo e padrões
 */
export function getEfficiencyRating(avgKmL: number, targetKmL: number): EfficiencyRating {
  if (targetKmL <= 0 || avgKmL <= 0) return 'Moderada';
  const ratio = avgKmL / targetKmL;
  if (ratio >= 1.05) return 'Excelente';
  if (ratio >= 0.95) return 'Boa';
  if (ratio >= 0.82) return 'Moderada';
  return 'Baixa';
}

/**
 * Calcula estatísticas consolidadas de eficiência de cada veículo
 */
export function calculateVehiclesEfficiency(
  vehicles: Vehicle[],
  records: RefuelRecord[]
): VehicleEfficiencyStats[] {
  const enriched = calculateRefuelsWithMetrics(records, vehicles);

  const stats: VehicleEfficiencyStats[] = vehicles.map((vehicle) => {
    const vRecords = enriched.filter((r) => r.vehicleId === vehicle.id);
    const refuelCount = vRecords.length;

    let totalLiters = 0;
    let totalCost = 0;
    let totalKm = 0;
    let maxOdo = vehicle.initialOdometer;
    const kmLValues: number[] = [];

    vRecords.forEach((r) => {
      totalLiters += r.liters;
      totalCost += r.totalCost;
      if (r.odometer > maxOdo) {
        maxOdo = r.odometer;
      }
      if (r.kmDrivenSinceLast && r.kmDrivenSinceLast > 0) {
        totalKm += r.kmDrivenSinceLast;
      }
      if (r.calculatedKmL && r.calculatedKmL > 0 && r.calculatedKmL < 40) {
        kmLValues.push(r.calculatedKmL);
      }
    });

    // Se totalKm for 0 por falta de histórico mas tem odômetro maior
    if (totalKm === 0 && maxOdo > vehicle.initialOdometer) {
      totalKm = maxOdo - vehicle.initialOdometer;
    }

    const averageKmL =
      totalKm > 0 && totalLiters > 0
        ? Number((totalKm / totalLiters).toFixed(2))
        : 0;

    const averageCostPerKm =
      totalKm > 0 && totalCost > 0
        ? Number((totalCost / totalKm).toFixed(2))
        : 0;

    const bestKmL = kmLValues.length > 0 ? Math.max(...kmLValues) : averageKmL;
    const worstKmL = kmLValues.length > 0 ? Math.min(...kmLValues) : averageKmL;

    const efficiencyRating = getEfficiencyRating(averageKmL, vehicle.targetKmL);
    const efficiencyPercentageVsTarget =
      vehicle.targetKmL > 0
        ? Number(((averageKmL / vehicle.targetKmL) * 100).toFixed(1))
        : 100;

    return {
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      model: vehicle.model,
      brand: vehicle.brand,
      plateType: vehicle.plateType,
      totalKm: Math.round(totalKm),
      totalLiters: Number(totalLiters.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      averageKmL,
      averageCostPerKm,
      lastOdometer: maxOdo,
      refuelCount,
      targetKmL: vehicle.targetKmL,
      efficiencyRating,
      efficiencyPercentageVsTarget,
      rank: 1,
      bestKmL,
      worstKmL,
    };
  });

  // Ordena por eficiência (maior km/L) e atribui rank
  stats.sort((a, b) => b.averageKmL - a.averageKmL);
  stats.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return stats;
}

/**
 * Converte chave YYYY-MM para rótulo legível em Português
 */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const mIndex = parseInt(month, 10) - 1;
  return `${months[mIndex] || month} de ${year}`;
}

/**
 * Gera os relatórios mensais detalhados
 */
export function generateMonthlyReports(
  records: RefuelRecord[],
  vehicles: Vehicle[]
): MonthlyReportSummary[] {
  const enriched = calculateRefuelsWithMetrics(records, vehicles);
  const byMonth: Record<string, RefuelWithCalculations[]> = {};

  enriched.forEach((record) => {
    const monthKey = record.date.slice(0, 7); // "YYYY-MM"
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = [];
    }
    byMonth[monthKey].push(record);
  });

  const monthKeys = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  return monthKeys.map((monthKey) => {
    const monthRecords = byMonth[monthKey];
    let totalCost = 0;
    let totalLiters = 0;
    let totalKmDriven = 0;

    const fuelMap = new Map<FuelType, { totalCost: number; totalLiters: number }>();
    const vehicleRecordsMap = new Map<string, RefuelWithCalculations[]>();

    monthRecords.forEach((rec) => {
      totalCost += rec.totalCost;
      totalLiters += rec.liters;
      if (rec.kmDrivenSinceLast && rec.kmDrivenSinceLast > 0) {
        totalKmDriven += rec.kmDrivenSinceLast;
      }

      // Por combustível
      const currFuel = fuelMap.get(rec.fuelType) || { totalCost: 0, totalLiters: 0 };
      currFuel.totalCost += rec.totalCost;
      currFuel.totalLiters += rec.liters;
      fuelMap.set(rec.fuelType, currFuel);

      // Por veículo
      const vList = vehicleRecordsMap.get(rec.vehicleId) || [];
      vList.push(rec);
      vehicleRecordsMap.set(rec.vehicleId, vList);
    });

    const averageKmL =
      totalKmDriven > 0 && totalLiters > 0
        ? Number((totalKmDriven / totalLiters).toFixed(2))
        : 0;

    const averageCostPerKm =
      totalKmDriven > 0 && totalCost > 0
        ? Number((totalCost / totalKmDriven).toFixed(2))
        : 0;

    const fuelBreakdown = Array.from(fuelMap.entries()).map(([fuelType, data]) => ({
      fuelType,
      totalCost: Number(data.totalCost.toFixed(2)),
      totalLiters: Number(data.totalLiters.toFixed(2)),
      percentage: totalCost > 0 ? Number(((data.totalCost / totalCost) * 100).toFixed(1)) : 0,
    }));

    const vehicleBreakdown = Array.from(vehicleRecordsMap.entries()).map(
      ([vId, vRecs]) => {
        const vehicle = vehicles.find((v) => v.id === vId);
        let vCost = 0;
        let vLiters = 0;
        let vKm = 0;

        vRecs.forEach((r) => {
          vCost += r.totalCost;
          vLiters += r.liters;
          if (r.kmDrivenSinceLast && r.kmDrivenSinceLast > 0) {
            vKm += r.kmDrivenSinceLast;
          }
        });

        const vAvgKmL = vKm > 0 && vLiters > 0 ? Number((vKm / vLiters).toFixed(2)) : 0;
        const vCostKm = vKm > 0 && vCost > 0 ? Number((vCost / vKm).toFixed(2)) : 0;

        return {
          vehicleId: vId,
          model: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo Desconhecido',
          plate: vehicle ? vehicle.plate : '---',
          plateType: vehicle ? vehicle.plateType : ('mercosul' as const),
          totalCost: Number(vCost.toFixed(2)),
          totalLiters: Number(vLiters.toFixed(2)),
          totalKm: Math.round(vKm),
          avgKmL: vAvgKmL,
          avgCostPerKm: vCostKm,
          refuelCount: vRecs.length,
        };
      }
    );

    return {
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      totalCost: Number(totalCost.toFixed(2)),
      totalLiters: Number(totalLiters.toFixed(2)),
      totalKmDriven: Math.round(totalKmDriven),
      averageKmL,
      averageCostPerKm,
      refuelsCount: monthRecords.length,
      fuelBreakdown,
      vehicleBreakdown,
      records: monthRecords,
    };
  });
}

/**
 * Formata moeda BRL (R$ 1.234,56)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata número no padrão brasileiro
 */
export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
