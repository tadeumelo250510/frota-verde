import React, { useState } from 'react';
import {
  Plus,
  Search,
  Fuel,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  Vehicle,
  RefuelRecord,
  RefuelWithCalculations,
  FuelType,
} from '../types';
import { LicensePlateBadge } from './LicensePlateBadge';
import { formatCurrency, formatNumber } from '../utils/calculations';

interface RefuelsManagerProps {
  vehicles: Vehicle[];
  records: RefuelRecord[];
  enrichedRecords: RefuelWithCalculations[];
  onAddRecord: (record: Omit<RefuelRecord, 'id' | 'createdAt'>) => void;
  onDeleteRecord: (id: string) => void;
  isModalOpen: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
}

export const RefuelsManager: React.FC<RefuelsManagerProps> = ({
  vehicles,
  enrichedRecords,
  onAddRecord,
  onDeleteRecord,
  isModalOpen,
  onCloseModal,
  onOpenModal,
}) => {
  // Filtros
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');
  const [selectedFuelFilter, setSelectedFuelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estado do formulário de novo abastecimento
  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState<string>('');
  const [liters, setLiters] = useState<string>('');
  const [pricePerLiter, setPricePerLiter] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [fuelType, setFuelType] = useState<FuelType>('Gasolina Comum');
  const [isFullTank, setIsFullTank] = useState<boolean>(true);
  const [stationName, setStationName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Ao trocar de veículo no formulário, sugere o combustível padrão
  const handleVehicleChange = (vId: string) => {
    setVehicleId(vId);
    const v = vehicles.find((item) => item.id === vId);
    if (v) {
      setFuelType(v.fuelTypeDefault);
    }
  };

  // Atualização bidirecional de valores
  const handleLitersChange = (val: string) => {
    setLiters(val);
    const numLiters = parseFloat(val);
    const numPrice = parseFloat(pricePerLiter);
    if (!isNaN(numLiters) && !isNaN(numPrice) && numLiters > 0 && numPrice > 0) {
      setTotalCost((numLiters * numPrice).toFixed(2));
    }
  };

  const handlePriceChange = (val: string) => {
    setPricePerLiter(val);
    const numPrice = parseFloat(val);
    const numLiters = parseFloat(liters);
    if (!isNaN(numPrice) && !isNaN(numLiters) && numPrice > 0 && numLiters > 0) {
      setTotalCost((numLiters * numPrice).toFixed(2));
    } else if (!isNaN(numPrice) && numPrice > 0) {
      const numTotal = parseFloat(totalCost);
      if (!isNaN(numTotal) && numTotal > 0) {
        setLiters((numTotal / numPrice).toFixed(2));
      }
    }
  };

  const handleTotalChange = (val: string) => {
    setTotalCost(val);
    const numTotal = parseFloat(val);
    const numPrice = parseFloat(pricePerLiter);
    if (!isNaN(numTotal) && !isNaN(numPrice) && numTotal > 0 && numPrice > 0) {
      setLiters((numTotal / numPrice).toFixed(2));
    }
  };

  // Informações do último odômetro para validação
  const selectedVehicleObj = vehicles.find((v) => v.id === vehicleId);
  const vehiclePastRecords = enrichedRecords
    .filter((r) => r.vehicleId === vehicleId)
    .sort((a, b) => b.odometer - a.odometer);
  const lastKnownOdometer =
    vehiclePastRecords.length > 0
      ? vehiclePastRecords[0].odometer
      : selectedVehicleObj?.initialOdometer || 0;

  // Envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!vehicleId) {
      setFormError('Selecione um veículo.');
      return;
    }
    const odoNum = parseInt(odometer, 10);
    const litNum = parseFloat(liters);
    const priceNum = parseFloat(pricePerLiter);
    const totNum = parseFloat(totalCost);

    if (isNaN(odoNum) || odoNum <= 0) {
      setFormError('Informe a quilometragem atual válida.');
      return;
    }
    if (odoNum <= lastKnownOdometer) {
      setFormError('KM INFERIOR OU IGUAL AO LANÇAMENTO ANTERIOR');
      return;
    }
    if (isNaN(litNum) || litNum <= 0) {
      setFormError('Informe a quantidade de litros válida.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Informe o preço por litro válido.');
      return;
    }
    if (isNaN(totNum) || totNum <= 0) {
      setFormError('Informe o valor total válido.');
      return;
    }

    onAddRecord({
      vehicleId,
      date,
      odometer: odoNum,
      liters: litNum,
      pricePerLiter: priceNum,
      totalCost: totNum,
      fuelType,
      isFullTank,
      stationName: stationName.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Resetar campos
    setOdometer('');
    setLiters('');
    setPricePerLiter('');
    setTotalCost('');
    setStationName('');
    setNotes('');
    onCloseModal();
  };

  // Filtragem dos registros
  const filteredRecords = enrichedRecords.filter((r) => {
    if (selectedVehicleFilter !== 'all' && r.vehicleId !== selectedVehicleFilter) {
      return false;
    }
    if (selectedFuelFilter !== 'all' && r.fuelType !== selectedFuelFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchStation = r.stationName?.toLowerCase().includes(q);
      const matchPlate = r.vehicle?.plate.toLowerCase().includes(q);
      const matchModel = r.vehicle?.model.toLowerCase().includes(q);
      const matchNotes = r.notes?.toLowerCase().includes(q);
      if (!matchStation && !matchPlate && !matchModel && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Ações & Filtros */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-emerald-600" />
            Lançamentos de Abastecimento
          </h2>
          <p className="text-xs text-slate-500">
            Registro de abastecimentos com cálculo automático de km rodados e consumo (km/L)
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Abastecimento</span>
        </button>
      </div>

      {/* Controles de Busca e Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-emerald-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa, posto, notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <div>
          <select
            value={selectedVehicleFilter}
            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
            aria-label="Filtrar por Veículo"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          >
            <option value="all">Todos os Veículos / Placas</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} ({v.plate})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedFuelFilter}
            onChange={(e) => setSelectedFuelFilter(e.target.value)}
            aria-label="Filtrar por Combustível"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          >
            <option value="all">Todos os Combustíveis</option>
            <option value="Gasolina Comum">Gasolina Comum</option>
            <option value="Gasolina Aditivada">Gasolina Aditivada</option>
            <option value="Etanol">Etanol</option>
            <option value="Diesel S10">Diesel S10</option>
            <option value="GNV">GNV</option>
          </select>
        </div>
      </div>

      {/* Tabela Principal de Registros */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f7faf8] border-b border-emerald-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Placa & Veículo</th>
                <th className="py-3 px-4">Odômetro</th>
                <th className="py-3 px-4">Km Rodados</th>
                <th className="py-3 px-4">Combustível</th>
                <th className="py-3 px-4 text-right">Litros</th>
                <th className="py-3 px-4 text-right">Preço/L</th>
                <th className="py-3 px-4 text-right">Consumo Médio</th>
                <th className="py-3 px-4 text-right">Custo/km</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Nenhum registro de abastecimento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f8fbf9] transition-colors">
                    {/* Data */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>

                    {/* Placa e Veículo */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {r.vehicle && (
                          <LicensePlateBadge
                            plate={r.vehicle.plate}
                            plateType={r.vehicle.plateType}
                            size="sm"
                          />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {r.vehicle?.model || 'Desconhecido'}
                          </div>
                          {r.stationName && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {r.stationName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Odômetro */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {formatNumber(r.odometer, 0)} km
                    </td>

                    {/* Km Rodados */}
                    <td className="py-3.5 px-4">
                      {r.kmDrivenSinceLast !== undefined && r.kmDrivenSinceLast > 0 ? (
                        <span className="font-bold text-slate-800">
                          +{formatNumber(r.kmDrivenSinceLast, 0)} km
                        </span>
                      ) : (
                        <span className="text-slate-400">1º reg.</span>
                      )}
                    </td>

                    {/* Combustível */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {r.fuelType}
                        {r.isFullTank && (
                          <span
                            title="Tanque Completo"
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          />
                        )}
                      </span>
                    </td>

                    {/* Litros */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                      {formatNumber(r.liters, 2)} L
                    </td>

                    {/* Preço por Litro */}
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {formatCurrency(r.pricePerLiter)}
                    </td>

                    {/* Consumo Calculado (km/L) */}
                    <td className="py-3.5 px-4 text-right">
                      {r.calculatedKmL ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                            {formatNumber(r.calculatedKmL, 2)} km/L
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">---</span>
                      )}
                    </td>

                    {/* Custo por KM */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {r.costPerKm ? formatCurrency(r.costPerKm) : '---'}
                    </td>

                    {/* Total R$ */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {formatCurrency(r.totalCost)}
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(r.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Excluir abastecimento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Novo Abastecimento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Novo Abastecimento
                  </h3>
                  <p className="text-xs text-slate-500">
                    Adicione os dados para cálculo automático de consumo e custo/km
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
              {/* Seleção de Veículo */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Selecione o Veículo (Placa / Modelo) *
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      [{v.plate}] {v.brand} {v.model} ({v.plateType === 'mercosul' ? 'Mercosul' : 'Antigo'})
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Último odômetro registrado:</span>
                  <span className="font-bold text-slate-700">
                    {formatNumber(lastKnownOdometer, 0)} km
                  </span>
                </div>
              </div>

              {/* Data e Odômetro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data do Abastecimento *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Odômetro Atual (KM) *
                  </label>
                  <input
                    type="number"
                    placeholder={`Ex: ${lastKnownOdometer + 450}`}
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    min={lastKnownOdometer + 1}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                  {odometer && parseInt(odometer, 10) > lastKnownOdometer && (
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                      +{parseInt(odometer, 10) - lastKnownOdometer} km rodados
                    </span>
                  )}
                </div>
              </div>

              {/* Tipo de Combustível */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tipo de Combustível *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      'Gasolina Comum',
                      'Gasolina Aditivada',
                      'Etanol',
                      'Diesel S10',
                      'GNV',
                    ] as FuelType[]
                  ).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFuelType(type)}
                      className={`p-2 rounded-xl text-xs font-semibold text-center border transition ${
                        fuelType === type
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-400'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Litros, Preço/L e Total com cálculo automático */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f7faf8] p-3 rounded-xl border border-emerald-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Litros (L) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 40.0"
                    value={liters}
                    onChange={(e) => handleLitersChange(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Preço por Litro (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5.89"
                    value={pricePerLiter}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 235.60"
                    value={totalCost}
                    onChange={(e) => handleTotalChange(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-bold text-emerald-900"
                    required
                  />
                </div>
              </div>

              {/* Checkbox Tanque Cheio */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                <input
                  type="checkbox"
                  id="fullTankCheckbox"
                  checked={isFullTank}
                  onChange={(e) => setIsFullTank(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label
                  htmlFor="fullTankCheckbox"
                  className="text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Tanque Cheio (Recomendado para cálculo preciso do km/L)</span>
                </label>
              </div>

              {/* Posto e Observações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Posto / Estabelecimento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Posto Shell Jardins"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Percurso serra, ar condicionado..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  Salvar Abastecimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
