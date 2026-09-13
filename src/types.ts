export type PlateType = 'mercosul' | 'antigo' | 'invalido';

export type FuelType =
  | 'Gasolina Comum'
  | 'Gasolina Aditivada'
  | 'Etanol'
  | 'Diesel S10'
  | 'GNV';

export type UserRole = 'Administrador' | 'Gestor de Frota';

export interface AppUser {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  isRoot?: boolean;
  vehicleAssigned?: string;
  status: 'Ativo' | 'Inativo';
  createdAt?: string;
}

export type EfficiencyRating = 'Excelente' | 'Boa' | 'Moderada' | 'Baixa';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  plateType: 'mercosul' | 'antigo';
  fuelTypeDefault: FuelType;
  targetKmL: number; // Meta esperada de consumo do veículo
  initialOdometer: number; // KM inicial ao cadastrar
  cityState?: string; // Ex: "SP - SÃO PAULO" (muito comum em placas antigas e visual)
  color?: string;
  createdAt: string;
}

export interface RefuelRecord {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  odometer: number; // Quilometragem atual
  liters: number; // Litros abastecidos
  pricePerLiter: number; // R$/L
  totalCost: number; // R$ total
  fuelType: FuelType;
  isFullTank: boolean; // Tanque cheio (essencial para cálculo de consumo exato)
  stationName?: string; // Nome do posto
  notes?: string;
  createdAt: string;
}

export interface VehicleEfficiencyStats {
  vehicleId: string;
  plate: string;
  model: string;
  brand: string;
  plateType: 'mercosul' | 'antigo';
  totalKm: number;
  totalLiters: number;
  totalCost: number;
  averageKmL: number;
  averageCostPerKm: number;
  lastOdometer: number;
  refuelCount: number;
  targetKmL: number;
  efficiencyRating: EfficiencyRating;
  efficiencyPercentageVsTarget: number;
  rank: number;
  bestKmL: number;
  worstKmL: number;
}

export interface RefuelWithCalculations extends RefuelRecord {
  vehicle?: Vehicle;
  kmDrivenSinceLast?: number;
  calculatedKmL?: number;
  costPerKm?: number;
}

export interface MonthlyReportSummary {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // "Setembro / 2026"
  totalCost: number;
  totalLiters: number;
  totalKmDriven: number;
  averageKmL: number;
  averageCostPerKm: number;
  refuelsCount: number;
  fuelBreakdown: {
    fuelType: FuelType;
    totalCost: number;
    totalLiters: number;
    percentage: number;
  }[];
  vehicleBreakdown: {
    vehicleId: string;
    model: string;
    plate: string;
    plateType: 'mercosul' | 'antigo';
    totalCost: number;
    totalLiters: number;
    totalKm: number;
    avgKmL: number;
    avgCostPerKm: number;
    refuelCount: number;
  }[];
  records: RefuelWithCalculations[];
}

export type AuditActionType = 'CRIAR' | 'EDITAR' | 'EXCLUIR' | 'STATUS';
export type AuditEntityType = 'Veículo' | 'Abastecimento' | 'Usuário';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  action: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  entityDescription: string; // ex: "Placa GDM5A45 (Toyota Corolla)" ou "Abastecimento #ref-123" ou "João da Silva (Gestor)"
  performedBy: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isRoot?: boolean;
  };
  details?: string; // ex: "Alterou status para Inativo", "Registrou 45L a R$ 5,89", etc.
}
