import React from 'react';
import { PlateType } from '../types';
import { detectPlateType, formatPlate } from '../utils/plateValidator';

interface LicensePlateBadgeProps {
  plate: string;
  plateType?: PlateType;
  cityState?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const LicensePlateBadge: React.FC<LicensePlateBadgeProps> = ({
  plate,
  plateType,
  cityState,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const detectedType = plateType || detectPlateType(plate);
  const formatted = formatPlate(plate);

  const isMercosul = detectedType === 'mercosul';

  // Sizing configurations
  const sizeConfig = {
    sm: {
      container: 'h-7 min-w-[95px] px-1.5 py-0.5 rounded-[4px] text-xs border',
      header: 'h-2 text-[6px]',
      font: 'text-xs tracking-wider',
      bolt: 'w-1 h-1',
    },
    md: {
      container: 'h-9 min-w-[130px] px-2.5 py-0.5 rounded-[5px] text-sm border-[1.5px]',
      header: 'h-2.5 text-[8px]',
      font: 'text-sm font-bold tracking-widest',
      bolt: 'w-1.5 h-1.5',
    },
    lg: {
      container: 'h-14 min-w-[200px] px-4 py-1 rounded-[8px] text-xl border-2 shadow-sm',
      header: 'h-4 text-[10px]',
      font: 'text-2xl font-bold tracking-widest',
      bolt: 'w-2 h-2',
    },
  }[size];

  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      {isMercosul ? (
        // --- PLACA PADRÃO MERCOSUL ---
        <div
          className={`relative flex flex-col justify-between bg-white text-slate-900 border-slate-700 shadow-xs select-none overflow-hidden transition-all duration-200 hover:shadow-md ${sizeConfig.container}`}
          title="Placa Padrão Mercosul"
        >
          {/* Barra Superior Azul Mercosul */}
          <div
            className={`w-full bg-[#003399] text-white flex items-center justify-between px-1 font-semibold uppercase ${sizeConfig.header} -mx-1.5 sm:-mx-2.5 -mt-0.5 mb-0.5`}
            style={{ width: 'calc(100% + 1.25rem)' }}
          >
            {/* Emblema Mercosul (4 estrelas simples) */}
            <div className="flex items-center gap-0.5 opacity-90 scale-90">
              <span className="inline-block w-1 h-1 bg-white rounded-full"></span>
              <span className="inline-block w-1 h-1 bg-white rounded-full"></span>
            </div>

            {/* Texto BRASIL */}
            <span className="font-extrabold tracking-widest text-center flex-1">
              BRASIL
            </span>

            {/* Bandeira do Brasil estilizada */}
            <div className="flex items-center gap-0.5">
              <div className="w-2.5 h-1.5 bg-[#009b3a] relative flex items-center justify-center rounded-[1px] overflow-hidden">
                <div className="w-1.5 h-1 bg-[#fedf00] rotate-45 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 bg-[#002776] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Caracteres da Placa */}
          <div className="flex items-center justify-center flex-1">
            <span className={`font-plate font-bold text-slate-950 ${sizeConfig.font}`}>
              {formatted || '---'}
            </span>
          </div>

          {/* Parafusos decorativos nas pontas */}
          <div className={`absolute bottom-0.5 left-1 rounded-full bg-slate-300 border border-slate-400 ${sizeConfig.bolt}`}></div>
          <div className={`absolute bottom-0.5 right-1 rounded-full bg-slate-300 border border-slate-400 ${sizeConfig.bolt}`}></div>
        </div>
      ) : (
        // --- PLACA PADRÃO TRADICIONAL / ANTIGO (CINZA) ---
        <div
          className={`relative flex flex-col justify-between bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 text-slate-900 border-slate-500 shadow-xs select-none overflow-hidden transition-all duration-200 hover:shadow-md ${sizeConfig.container}`}
          title="Placa Padrão Antigo (Cinza)"
        >
          {/* Topo com Cidade / Estado */}
          <div className="w-full flex items-center justify-center">
            <span className={`text-[7px] md:text-[8px] font-bold text-slate-700 uppercase tracking-tighter truncate max-w-full`}>
              {cityState || 'BRASIL'}
            </span>
          </div>

          {/* Caracteres da Placa */}
          <div className="flex items-center justify-center flex-1">
            <span className={`font-plate font-bold text-slate-900 ${sizeConfig.font}`}>
              {formatted || '---'}
            </span>
          </div>

          {/* Parafusos decorativos */}
          <div className={`absolute top-0.5 left-1 rounded-full bg-slate-400 border border-slate-500 ${sizeConfig.bolt}`}></div>
          <div className={`absolute top-0.5 right-1 rounded-full bg-slate-400 border border-slate-500 ${sizeConfig.bolt}`}></div>
        </div>
      )}

      {/* Rótulo explicativo opcional */}
      {showLabel && (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            isMercosul
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-slate-100 text-slate-700 border border-slate-300'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isMercosul ? 'bg-blue-600' : 'bg-slate-500'
            }`}
          />
          {isMercosul ? 'Mercosul' : 'Antigo'}
        </span>
      )}
    </div>
  );
};
