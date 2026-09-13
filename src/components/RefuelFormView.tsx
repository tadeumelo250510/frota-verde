import React, { useState, useMemo } from 'react';
import { Vehicle, RefuelRecord, FuelType } from '../types';
import { Fuel, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { LicensePlateBadge } from './LicensePlateBadge';

interface RefuelFormViewProps {
  vehicles: Vehicle[];
  records: RefuelRecord[];
  onAddRecord: (record: Omit<RefuelRecord, 'id' | 'createdAt'>) => void;
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

// Utilitários para formatação e conversão de Moeda Brasileira (Real R$)
function parseBRL(value: string): number {
  if (!value) return 0;
  // Remove R$, espaços, e pontos de milhar, substituindo a vírgula decimal por ponto
  const clean = value.replace(/[^\d,-]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function formatBRLInput(rawValue: string): string {
  // Pega apenas os dígitos
  const digits = rawValue.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const RefuelFormView: React.FC<RefuelFormViewProps> = ({
  vehicles,
  records,
  onAddRecord,
  onNavigateTab,
}) => {
  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState<string>('');
  const [liters, setLiters] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [fuelType, setFuelType] = useState<FuelType>('Gasolina Comum');
  const [isFullTank, setIsFullTank] = useState<boolean>(true);
  const [stationName, setStationName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  // Histórico de abastecimentos do veículo selecionado para validação do odômetro
  const vehiclePastRecords = useMemo(() => {
    return records
      .filter((r) => r.vehicleId === vehicleId)
      .sort((a, b) => b.odometer - a.odometer);
  }, [records, vehicleId]);

  const lastKnownOdometer = useMemo(() => {
    if (vehiclePastRecords.length > 0) {
      return vehiclePastRecords[0].odometer;
    }
    return selectedVehicle?.initialOdometer || 0;
  }, [vehiclePastRecords, selectedVehicle]);

  const hasPastRecord = vehiclePastRecords.length > 0 || (selectedVehicle?.initialOdometer ?? 0) > 0;
  const currentOdoNum = parseFloat(odometer);
  // Verificação estrita: KM não pode ser inferior ou igual ao abastecimento passado
  const isOdoInvalid = !isNaN(currentOdoNum) && hasPastRecord && currentOdoNum <= lastKnownOdometer;

  // Atualização manual do campo Valor do Abastecimento com máscara no formato Real Brasileiro (R$)
  const handleTotalCostInputChange = (val: string) => {
    setError('');
    const formatted = formatBRLInput(val);
    setTotalCost(formatted);
  };

  const handleLitersChange = (val: string) => {
    setError('');
    setLiters(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!vehicleId) {
      setError('Por favor, selecione um veículo.');
      return;
    }

    const odo = parseFloat(odometer);
    if (isNaN(odo) || odo <= 0) {
      setError('Informe a quilometragem atual do veículo.');
      return;
    }

    if (hasPastRecord && odo <= lastKnownOdometer) {
      setError('KM INFERIOR OU IGUAL AO LANÇAMENTO ANTERIOR');
      return;
    }

    const lit = parseFloat(liters);
    if (isNaN(lit) || lit <= 0) {
      setError('Informe a quantidade de litros abastecidos.');
      return;
    }

    const parsedTotal = parseBRL(totalCost);
    if (parsedTotal <= 0) {
      setError('Informe o valor do abastecimento (R$).');
      return;
    }

    const price = lit > 0 ? parsedTotal / lit : 0;

    onAddRecord({
      vehicleId,
      date,
      odometer: odo,
      liters: lit,
      pricePerLiter: price,
      totalCost: parsedTotal,
      fuelType,
      isFullTank,
      stationName: stationName.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setSuccessMsg('Abastecimento lançado com sucesso no sistema!');
    // Limpa campos para novo lançamento mantendo o veículo
    setOdometer('');
    setLiters('');
    setTotalCost('');
    setNotes('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#15803d]">
            Lançar Abastecimento
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registre o abastecimento do veículo para atualização instantânea dos indicadores.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-[#15803d] font-bold text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="px-3 py-1.5 rounded-lg bg-[#15803d] text-white font-semibold hover:bg-[#166534] transition-colors cursor-pointer flex items-center gap-1"
            >
              Ver Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('extrato')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Ver Extrato
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-bold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção do Veículo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Veículo *
            </label>
            <select
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] cursor-pointer"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.brand === 'Veículo' ? v.model : `${v.brand} ${v.model}`}
                </option>
              ))}
            </select>

            {selectedVehicle && (
              <div className="mt-2.5 flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <LicensePlateBadge
                  plate={selectedVehicle.plate}
                  plateType={selectedVehicle.plateType}
                  size="sm"
                />
                <span className="text-xs text-slate-600 font-medium">
                  {selectedVehicle.brand} {selectedVehicle.model} • Meta:{' '}
                  <strong>{selectedVehicle.targetKmL} km/L</strong>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Data */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data do Abastecimento *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
              />
            </div>

            {/* Odômetro Atual (Sem mostrar o KM anterior) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Odômetro Atual (KM) *
              </label>
              <input
                type="number"
                placeholder="Ex: 101250"
                value={odometer}
                onChange={(e) => {
                  setError('');
                  setOdometer(e.target.value);
                }}
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border font-mono font-medium focus:outline-none focus:ring-2 ${
                  isOdoInvalid
                    ? 'border-red-500 bg-red-50/50 text-red-900 focus:ring-red-300'
                    : 'border-slate-300 focus:ring-[#15803d]/30 focus:border-[#15803d]'
                }`}
              />

              {/* Mensagem de Erro Específica Solicitada */}
              {isOdoInvalid && (
                <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded-md text-[11px] font-bold text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span>KM INFERIOR OU IGUAL AO LANÇAMENTO ANTERIOR</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantidade de Litros */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade de Litros *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 45.50"
                value={liters}
                onChange={(e) => handleLitersChange(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Preenchimento manual de litros abastecidos
              </p>
            </div>

            {/* Valor do Abastecimento (R$) com Reconhecimento de Moeda Brasileira Real */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor do Abastecimento (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs sm:text-sm font-bold text-slate-500">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={totalCost}
                  onChange={(e) => handleTotalCostInputChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-bold text-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] placeholder:text-slate-300"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Preenchimento manual em Real (pontos e vírgulas automáticos)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo de Combustível */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de Combustível
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
              >
                <option value="Gasolina Comum">Gasolina Comum</option>
                <option value="Gasolina Aditivada">Gasolina Aditivada</option>
                <option value="Etanol">Etanol (Álcool)</option>
                <option value="Diesel S10">Diesel S10</option>
                <option value="GNV">GNV</option>
              </select>
            </div>

            {/* Posto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Posto de Combustível (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Posto Ipiranga Express"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Troca de óleo realizada, calibragem de pneus, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
            />
          </div>

          {/* Tanque Cheio */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFullTankCheck"
              checked={isFullTank}
              onChange={(e) => setIsFullTank(e.target.checked)}
              className="w-4 h-4 rounded text-[#15803d] focus:ring-[#15803d]"
            />
            <label
              htmlFor="isFullTankCheck"
              className="text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Completou o tanque (Tanque Cheio)? Recomendado para cálculo exato de km/L.
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isOdoInvalid}
              className={`px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 ${
                isOdoInvalid
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                  : 'bg-[#15803d] hover:bg-[#166534] text-white cursor-pointer'
              }`}
            >
              <Fuel className="w-4 h-4" />
              Salvar Abastecimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
