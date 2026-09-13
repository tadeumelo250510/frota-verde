import React, { useState } from 'react';
import { Vehicle } from '../types';
import { Plus, Trash2, CheckCircle, ArrowRight, Car, ShieldCheck } from 'lucide-react';
import { LicensePlateBadge } from './LicensePlateBadge';
import {
  getPlateValidationDetails,
  detectPlateType,
  formatPlate,
  cleanPlate,
} from '../utils/plateValidator';

interface VehicleRegistrationViewProps {
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void;
  onDeleteVehicle: (id: string) => void;
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

export const VehicleRegistrationView: React.FC<VehicleRegistrationViewProps> = ({
  vehicles,
  onAddVehicle,
  onDeleteVehicle,
  onNavigateTab,
}) => {
  const [plateInput, setPlateInput] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState<{ plate: string; type: string } | null>(null);

  const plateValidation = getPlateValidationDetails(plateInput);
  const detectedType = detectPlateType(plateInput);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg(null);

    const cleaned = cleanPlate(plateInput);
    if (!cleaned) {
      setError('Por favor, informe a placa do veículo.');
      return;
    }

    if (!plateValidation.isValid || detectedType === 'invalido') {
      setError('Placa inválida! Digite uma placa no padrão Mercosul (ex: ABC1D23) ou Modelo Antigo (ex: ABC-1234).');
      return;
    }

    // Verificar se a placa já existe na frota
    const alreadyExists = vehicles.some((v) => cleanPlate(v.plate) === cleaned);
    if (alreadyExists) {
      setError(`A placa ${formatPlate(plateInput)} já está cadastrada na frota.`);
      return;
    }

    const finalPlate = formatPlate(plateInput);
    const validPlateType = detectedType;

    onAddVehicle({
      brand: 'Veículo',
      model: validPlateType === 'mercosul' ? 'Padrão Mercosul' : 'Modelo Antigo',
      year: new Date().getFullYear(),
      plate: finalPlate,
      plateType: validPlateType,
      fuelTypeDefault: 'Gasolina Comum',
      targetKmL: 12.0,
      initialOdometer: 0,
    });

    setSuccessMsg({
      plate: finalPlate,
      type: validPlateType === 'mercosul' ? 'Padrão Mercosul' : 'Modelo Antigo (Tradicional Cinza)',
    });
    setPlateInput('');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#15803d]">
            Cadastrar Veículo
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Informe somente a placa. O sistema reconhece automaticamente se é <strong>Padrão Mercosul</strong> ou <strong>Modelo Antigo</strong>.
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 text-[#15803d] px-3.5 py-1.5 rounded-lg text-xs font-bold self-start sm:self-auto">
          {vehicles.length} Veículos na Frota
        </div>
      </div>

      {/* Mensagem de Sucesso */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-[#15803d] font-bold text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>
              Veículo placa <strong>{successMsg.plate}</strong> ({successMsg.type}) cadastrado com sucesso!
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => onNavigateTab('lancar-abastecimento')}
              className="px-3 py-1.5 rounded-lg bg-[#15803d] text-white font-semibold hover:bg-[#166534] transition-colors cursor-pointer flex items-center gap-1"
            >
              Lançar Abastecimento <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Ir ao Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário: SOMENTE A PLACA */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-[#15803d]" />
            Cadastro de Veículo por Placa
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Placa do Veículo *
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="Ex: GDM5A45 ou ABC-1234"
                value={plateInput}
                onChange={(e) => {
                  setError('');
                  setPlateInput(e.target.value.toUpperCase());
                }}
                className="w-full px-3.5 py-2.5 text-base font-mono font-bold tracking-widest uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] bg-white placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                autoFocus
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Digite os 7 caracteres da placa com ou sem hífen.
              </p>
            </div>

            {/* Painel de Reconhecimento do Modelo */}
            <div className="p-4 rounded-xl border transition-all">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Reconhecimento do Padrão
              </div>

              {detectedType === 'mercosul' ? (
                <div className="flex flex-col items-center gap-2.5 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#003399] text-white shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Padrão Mercosul Reconhecido
                  </span>
                  <div className="py-1">
                    <LicensePlateBadge
                      plate={plateValidation.formatted || plateInput}
                      plateType="mercosul"
                      size="lg"
                    />
                  </div>
                  <p className="text-xs text-blue-900 font-medium">
                    Placa no Padrão Mercosul válida (3 letras, 1 número, 1 letra e 2 números).
                  </p>
                </div>
              ) : detectedType === 'antigo' ? (
                <div className="flex flex-col items-center gap-2.5 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#64748b] text-white shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Modelo Antigo Reconhecido (Cinza)
                  </span>
                  <div className="py-1">
                    <LicensePlateBadge
                      plate={plateValidation.formatted || plateInput}
                      plateType="antigo"
                      size="lg"
                    />
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Placa no Padrão Tradicional válida (3 letras e 4 números com hífen).
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center py-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                    Aguardando digitação da placa
                  </span>
                  <div className="opacity-40 py-1">
                    <LicensePlateBadge
                      plate={plateInput || 'ABC1234'}
                      plateType="mercosul"
                      size="md"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Exemplos: <strong>GDM5A45</strong> (Mercosul) ou <strong>ABC-1234</strong> (Antigo).
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!plateValidation.isValid}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                plateValidation.isValid
                  ? 'bg-[#15803d] hover:bg-[#166534] text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              Cadastrar Veículo
            </button>
          </form>
        </div>

        {/* Tabela de Veículos Cadastrados na Frota */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">
              Veículos Cadastrados na Frota
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total: {vehicles.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f1f5f9] text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Placa</th>
                  <th className="py-2.5 px-4">Padrão Reconhecido</th>
                  <th className="py-2.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 text-xs">
                      Nenhum veículo cadastrado. Digite a placa acima para começar.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <LicensePlateBadge
                          plate={v.plate}
                          plateType={v.plateType}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4">
                        {v.plateType === 'mercosul' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#003399] border border-blue-200">
                            🇧🇷 Padrão Mercosul
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            🏛️ Modelo Antigo (Cinza)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteVehicle(v.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Excluir veículo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
