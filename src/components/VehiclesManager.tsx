import React, { useState } from 'react';
import {
  Car,
  Plus,
  Trash2,
  Award,
  Gauge,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Fuel,
} from 'lucide-react';
import {
  Vehicle,
  VehicleEfficiencyStats,
  FuelType,
  PlateType,
} from '../types';
import { LicensePlateBadge } from './LicensePlateBadge';
import {
  getPlateValidationDetails,
  detectPlateType,
  formatPlate,
} from '../utils/plateValidator';
import { formatCurrency, formatNumber } from '../utils/calculations';

interface VehiclesManagerProps {
  vehicles: Vehicle[];
  efficiencyStats: VehicleEfficiencyStats[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void;
  onDeleteVehicle: (id: string) => void;
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export const VehiclesManager: React.FC<VehiclesManagerProps> = ({
  vehicles,
  efficiencyStats,
  onAddVehicle,
  onDeleteVehicle,
  isModalOpen,
  onOpenModal,
  onCloseModal,
}) => {
  // Estado do formulário de novo veículo
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [plateInput, setPlateInput] = useState('');
  const [cityState, setCityState] = useState('SP - SÃO PAULO');
  const [color, setColor] = useState('');
  const [initialOdometer, setInitialOdometer] = useState('');
  const [targetKmL, setTargetKmL] = useState('13.0');
  const [fuelTypeDefault, setFuelTypeDefault] = useState<FuelType>('Gasolina Comum');
  const [formError, setFormError] = useState('');

  // Validação dinâmica da placa digitada
  const plateValidation = getPlateValidationDetails(plateInput);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!brand.trim() || !model.trim()) {
      setFormError('Informe a marca e o modelo do veículo.');
      return;
    }

    if (!plateValidation.isValid) {
      setFormError(
        'A placa informada não é válida no padrão Mercosul (ABC1D23) nem no padrão Antigo (ABC-1234).'
      );
      return;
    }

    // Verificar se placa já existe
    const formattedNew = formatPlate(plateInput);
    const existing = vehicles.find(
      (v) => formatPlate(v.plate).replace('-', '') === formattedNew.replace('-', '')
    );
    if (existing) {
      setFormError(`Já existe um veículo cadastrado com a placa ${formattedNew}.`);
      return;
    }

    const odoNum = parseInt(initialOdometer, 10);
    if (isNaN(odoNum) || odoNum < 0) {
      setFormError('Informe a quilometragem inicial válida.');
      return;
    }

    const targetNum = parseFloat(targetKmL);
    if (isNaN(targetNum) || targetNum <= 0) {
      setFormError('Informe a meta de consumo esperada (km/L).');
      return;
    }

    onAddVehicle({
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      plate: plateValidation.formatted,
      plateType: plateValidation.type as 'mercosul' | 'antigo',
      cityState: cityState.trim() || undefined,
      color: color.trim() || undefined,
      initialOdometer: odoNum,
      targetKmL: targetNum,
      fuelTypeDefault,
    });

    // Limpar formulário
    setBrand('');
    setModel('');
    setPlateInput('');
    setColor('');
    setInitialOdometer('');
    setFormError('');
    onCloseModal();
  };

  const getEfficiencyBadge = (rating: string) => {
    switch (rating) {
      case 'Excelente':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Boa':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Moderada':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Baixa':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo / Header */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-600" />
              Veículos Cadastrados & Reconhecimento de Placas
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Suporte a placas Padrão Mercosul (ABC1D23) e Tradicional / Cinza (ABC-1234) com
            diagnóstico de eficiência
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Veículo</span>
        </button>
      </div>

      {/* Explicação dos Padrões de Placas Brasileiras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-emerald-100">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#f7faf8] border border-emerald-100/70">
          <div className="shrink-0 pt-0.5">
            <LicensePlateBadge plate="BRA2E19" plateType="mercosul" size="sm" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Padrão Mercosul (Resolução CONTRAN 780)
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Formato com 3 letras, 1 número, 1 letra e 2 números (Ex: BRA2E19). Tarja azul
              superior, bandeira do Brasil e emblema Mercosul.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="shrink-0 pt-0.5">
            <LicensePlateBadge plate="ABC-1234" plateType="antigo" cityState="SP - SÃO PAULO" size="sm" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              Padrão Antigo / Tradicional (Cinza)
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Formato com 3 letras e 4 números separados por hífen (Ex: ABC-1234). Fundo
              cinza metálico com identificação do município e UF.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Veículos com Cards Detalhados de Eficiência */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {vehicles.map((v) => {
          const stats = efficiencyStats.find((s) => s.vehicleId === v.id);
          const hasRefuels = (stats?.refuelCount || 0) > 0;

          return (
            <div
              key={v.id}
              className="bg-white rounded-2xl border border-emerald-100 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between"
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <LicensePlateBadge
                      plate={v.plate}
                      plateType={v.plateType}
                      cityState={v.cityState}
                      size="md"
                      showLabel
                    />
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                        {v.brand} {v.model}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Ano {v.year} {v.color ? `• ${v.color}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {stats && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getEfficiencyBadge(
                          stats.efficiencyRating
                        )}`}
                      >
                        {stats.efficiencyRating}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteVehicle(v.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Excluir veículo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Métricas e Diagnóstico */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#f7faf8] p-3.5 rounded-xl border border-emerald-50 mb-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Consumo Médio
                    </div>
                    <div className="text-base font-extrabold text-emerald-800 mt-0.5">
                      {hasRefuels && stats?.averageKmL
                        ? `${formatNumber(stats.averageKmL, 2)} km/L`
                        : '--'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Custo por KM
                    </div>
                    <div className="text-base font-extrabold text-slate-800 mt-0.5">
                      {hasRefuels && stats?.averageCostPerKm
                        ? formatCurrency(stats.averageCostPerKm)
                        : '--'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Km Rodados
                    </div>
                    <div className="text-sm font-bold text-slate-700 mt-0.5">
                      {stats ? `${formatNumber(stats.totalKm, 0)} km` : '--'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Total Gasto
                    </div>
                    <div className="text-sm font-bold text-slate-700 mt-0.5">
                      {stats ? formatCurrency(stats.totalCost) : 'R$ 0,00'}
                    </div>
                  </div>
                </div>

                {/* Meta e Posição no Ranking */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                      Meta de Consumo:
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatNumber(v.targetKmL, 1)} km/L
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      Posição de Eficiência na Frota:
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                      {stats?.rank}º mais econômico
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-slate-500" />
                      Combustível Habitual:
                    </span>
                    <span className="font-medium text-slate-700">
                      {v.fuelTypeDefault}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Progresso vs Meta */}
              {stats && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                    <span>Atingimento da Meta de Economia</span>
                    <span
                      className={
                        stats.efficiencyPercentageVsTarget >= 100
                          ? 'text-emerald-700 font-bold'
                          : 'text-amber-700 font-bold'
                      }
                    >
                      {formatNumber(stats.efficiencyPercentageVsTarget, 1)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stats.efficiencyPercentageVsTarget >= 105
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : stats.efficiencyPercentageVsTarget >= 95
                          ? 'bg-emerald-500'
                          : stats.efficiencyPercentageVsTarget >= 82
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(5, stats.efficiencyPercentageVsTarget)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Cadastro de Veículo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Cadastrar Veículo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reconhecimento automático de placa Mercosul ou Antiga
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Marca e Modelo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Fiat, Toyota, VW"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Onix, Corolla, Gol"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Placa com Validação e Visualização em Tempo Real */}
              <div className="bg-[#f7faf8] p-3.5 rounded-xl border border-emerald-100">
                <label className="block font-bold text-slate-800 mb-1">
                  Placa do Veículo (Mercosul ou Padrão Antigo) *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Ex: BRA2E19 ou ABC-1234"
                    value={plateInput}
                    onChange={(e) => setPlateInput(e.target.value)}
                    maxLength={8}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-bold text-sm bg-white"
                    required
                  />
                </div>

                {/* Status e Rótulo de Validação */}
                <div className="flex items-center gap-1.5 text-[11px] mb-3">
                  {plateValidation.isValid ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {plateValidation.message}
                    </span>
                  ) : plateInput.length > 0 ? (
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      {plateValidation.message}
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Digite 7 caracteres (Padrão Mercosul: BRA2E19 ou Tradicional: ABC-1234)
                    </span>
                  )}
                </div>

                {/* Prévia da Placa Renderizada */}
                {plateInput.trim().length >= 3 && (
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                      Prévia Visual da Placa
                    </span>
                    <LicensePlateBadge
                      plate={plateInput}
                      plateType={plateValidation.type}
                      cityState={cityState}
                      size="md"
                      showLabel
                    />
                  </div>
                )}
              </div>

              {/* Cidade/UF e Cor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cidade / UF (Placa Antiga)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SP - SÃO PAULO"
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ano / Cor
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value, 10))}
                      className="w-1/2 p-2.5 rounded-xl border border-slate-200"
                      min={1970}
                      max={2030}
                    />
                    <input
                      type="text"
                      placeholder="Ex: Prata"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-1/2 p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Odômetro Inicial e Meta de Consumo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Odômetro Inicial (KM) *
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 50000"
                    value={initialOdometer}
                    onChange={(e) => setInitialOdometer(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Meta de Consumo (km/L) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 14.0"
                    value={targetKmL}
                    onChange={(e) => setTargetKmL(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-emerald-800"
                    required
                  />
                </div>
              </div>

              {/* Combustível Padrão */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Combustível Habitual
                </label>
                <select
                  value={fuelTypeDefault}
                  onChange={(e) => setFuelTypeDefault(e.target.value as FuelType)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Gasolina Comum">Gasolina Comum</option>
                  <option value="Gasolina Aditivada">Gasolina Aditivada</option>
                  <option value="Etanol">Etanol</option>
                  <option value="Diesel S10">Diesel S10</option>
                  <option value="GNV">GNV</option>
                </select>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!plateValidation.isValid}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  Cadastrar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
