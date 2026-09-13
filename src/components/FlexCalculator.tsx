import React, { useState } from 'react';
import {
  Calculator,
  Fuel,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Percent,
  Info,
} from 'lucide-react';
import { Vehicle } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';

interface FlexCalculatorProps {
  vehicles: Vehicle[];
}

export const FlexCalculator: React.FC<FlexCalculatorProps> = ({ vehicles }) => {
  const [gasolinePrice, setGasolinePrice] = useState<string>('5.99');
  const [ethanolPrice, setEthanolPrice] = useState<string>('3.99');
  const [tankSize, setTankSize] = useState<string>('50');
  const [monthlyKm, setMonthlyKm] = useState<string>('1200');

  const gas = parseFloat(gasolinePrice) || 0;
  const eth = parseFloat(ethanolPrice) || 0;
  const tank = parseFloat(tankSize) || 50;
  const km = parseFloat(monthlyKm) || 1000;

  // Paridade: Razão Preço Etanol / Preço Gasolina
  const parity = gas > 0 ? eth / gas : 0;
  const parityPercentage = Number((parity * 100).toFixed(1));

  // Regra padrão dos 70% (ou 73% para motores modernos)
  const threshold = 0.70;
  const isEthanolAdvantageous = parity > 0 && parity <= threshold;

  // Simulação de custos
  // Supondo rendimento médio flex: Gasolina ~13 km/L, Etanol ~9.1 km/L (70%)
  const gasKmL = 13.0;
  const ethKmL = 9.1;

  const gasCostPerKm = gas > 0 ? gas / gasKmL : 0;
  const ethCostPerKm = eth > 0 ? eth / ethKmL : 0;

  const monthlyGasCost = gasCostPerKm * km;
  const monthlyEthCost = ethCostPerKm * km;
  const monthlySavings = Math.abs(monthlyGasCost - monthlyEthCost);

  const tankGasCost = gas * tank;
  const tankEthCost = eth * tank;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Ferramenta Auxiliar
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-600" />
          Calculadora Flex: Etanol vs Gasolina
        </h2>
        <p className="text-xs text-slate-500">
          Descubra instantaneamente qual combustível proporciona menor custo por quilômetro
          rodado baseado na paridade dos preços.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel de Entrada de Preços */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Preços dos Combustíveis no Posto
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preço da Gasolina Comum (R$/L)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={gasolinePrice}
                onChange={(e) => setGasolinePrice(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preço do Etanol (Álcool) (R$/L)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={ethanolPrice}
                onChange={(e) => setEthanolPrice(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-emerald-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Capacidade do Tanque (L)
              </label>
              <input
                type="number"
                value={tankSize}
                onChange={(e) => setTankSize(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Km Rodados por Mês
              </label>
              <input
                type="number"
                value={monthlyKm}
                onChange={(e) => setMonthlyKm(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200"
              />
            </div>
          </div>

          {/* Barra de Paridade */}
          <div className="bg-[#f7faf8] p-4 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Paridade de Preço (Etanol / Gasolina):</span>
              <span className="text-emerald-800 text-sm font-extrabold">
                {parityPercentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden relative">
              <div
                className={`h-full transition-all duration-300 ${
                  isEthanolAdvantageous ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, parityPercentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% (Etanol vantajoso)</span>
              <span className="font-bold text-slate-600">Limite 70%</span>
              <span>100% (Gasolina vantajosa)</span>
            </div>
          </div>
        </div>

        {/* Painel de Recomendação e Economia */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Veredito Econômico
            </span>

            {/* Banner de Recomendação */}
            <div
              className={`mt-2 p-5 rounded-2xl border flex items-center gap-4 ${
                isEthanolAdvantageous
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white border-slate-800 shadow-md'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Fuel className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-85">
                  Recomendação
                </span>
                <h4 className="text-xl font-black tracking-tight">
                  {isEthanolAdvantageous ? 'ABASTEÇA COM ETANOL' : 'ABASTEÇA COM GASOLINA'}
                </h4>
                <p className="text-xs opacity-90">
                  {isEthanolAdvantageous
                    ? `O etanol está custando ${parityPercentage}% da gasolina (abaixo dos 70%).`
                    : `O etanol está custando ${parityPercentage}% da gasolina (acima dos 70%).`}
                </p>
              </div>
            </div>

            {/* Economia Estimada */}
            <div className="mt-5 space-y-3">
              <div className="bg-[#f7faf8] p-3.5 rounded-xl border border-emerald-100">
                <div className="text-xs text-slate-500">
                  Economia Estimada por Mês ({formatNumber(km, 0)} km):
                </div>
                <div className="text-2xl font-extrabold text-emerald-800 mt-0.5">
                  {formatCurrency(monthlySavings)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Economia aproximada de {formatCurrency(monthlySavings * 12)} ao ano
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    Custo/KM no Etanol
                  </div>
                  <div className="text-base font-extrabold text-slate-800 mt-0.5">
                    {formatCurrency(ethCostPerKm)}/km
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    Custo/KM na Gasolina
                  </div>
                  <div className="text-base font-extrabold text-slate-800 mt-0.5">
                    {formatCurrency(gasCostPerKm)}/km
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              A regra dos 70% considera que o etanol rende em média 70% da energia da
              gasolina. Em motores modernos de injeção direta, essa paridade pode chegar a 73%.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
