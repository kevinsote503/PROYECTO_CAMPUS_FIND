/**
 * @file MatchingAlert.tsx
 * @description Componente visual para alertar de coincidencias probables entre objetos perdidos y encontrados.
 */

import React from 'react';
import { Sparkles, MapPin, Eye, ArrowRight, ShieldCheck } from 'lucide-react';
import { Objeto } from '../types';

interface MatchingAlertProps {
  coincidencias: Objeto[];
  tipoReporteActual: 'perdido' | 'encontrado';
  onSeleccionarObjeto: (objeto: Objeto) => void;
}

export const MatchingAlert: React.FC<MatchingAlertProps> = ({
  coincidencias,
  tipoReporteActual,
  onSeleccionarObjeto,
}) => {
  if (!coincidencias || coincidencias.length === 0) return null;

  const esBuscandoPerdido = tipoReporteActual === 'perdido';

  return (
    <div
      id="alerta-posibles-coincidencias"
      className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
            ¡Posible coincidencia encontrada! ({coincidencias.length})
          </h4>
          <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
            {esBuscandoPerdido
              ? 'Detectamos que alguien reportó haber encontrado un objeto similar en la misma categoría o ubicación. Revisa antes de crear un nuevo reporte duplicado:'
              : 'Detectamos que un estudiante o docente reportó haber extraviado un objeto con características afines:'}
          </p>
        </div>
      </div>

      {/* Lista horizontal o grid de coincidencias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {coincidencias.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-white rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {item.estado?.nombre}
                </span>
                <span className="text-[11px] text-slate-500">
                  {item.categoria?.nombre}
                </span>
              </div>
              <h5 className="font-bold text-xs text-slate-900 line-clamp-1">
                {item.titulo}
              </h5>
              <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                {item.descripcion}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">{item.ubicacion?.nombre}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSeleccionarObjeto(item)}
              className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver y reclamar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchingAlert;
