/**
 * @file ObjectCard.tsx
 * @description Tarjeta para representar visualmente un objeto perdido o encontrado en los listados.
 */

import React from 'react';
import {
  MapPin,
  Calendar,
  Tag,
  Laptop,
  CreditCard,
  Briefcase,
  Shirt,
  BookOpen,
  Key,
  Coffee,
  HelpCircle,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Objeto } from '../types';

interface ObjectCardProps {
  objeto: Objeto;
  onVerDetalle: (objeto: Objeto) => void;
  onReclamar?: (objeto: Objeto) => void;
}

export const ObjectCard: React.FC<ObjectCardProps> = ({
  objeto,
  onVerDetalle,
  onReclamar,
}) => {
  // Obtener icono según categoría
  const getCategoriaIcon = (categoriaNombre?: string) => {
    const nombre = (categoriaNombre || '').toLowerCase();
    if (nombre.includes('electrónica')) return <Laptop className="w-4 h-4" />;
    if (nombre.includes('documento') || nombre.includes('identifica')) return <CreditCard className="w-4 h-4" />;
    if (nombre.includes('mochila') || nombre.includes('bolso')) return <Briefcase className="w-4 h-4" />;
    if (nombre.includes('ropa') || nombre.includes('accesorio')) return <Shirt className="w-4 h-4" />;
    if (nombre.includes('libro') || nombre.includes('cuaderno')) return <BookOpen className="w-4 h-4" />;
    if (nombre.includes('llave')) return <Key className="w-4 h-4" />;
    if (nombre.includes('botella') || nombre.includes('termo')) return <Coffee className="w-4 h-4" />;
    return <Tag className="w-4 h-4" />;
  };

  // Estilos de badge según estado
  const getEstadoBadge = (estadoNombre?: string) => {
    const nombre = (estadoNombre || '').toLowerCase();
    if (nombre === 'perdido') {
      return {
        clase: 'bg-rose-50 text-rose-700 border-rose-200',
        icono: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />,
        etiqueta: 'Perdido',
      };
    }
    if (nombre === 'encontrado') {
      return {
        clase: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icono: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
        etiqueta: 'Encontrado',
      };
    }
    return {
      clase: 'bg-blue-50 text-blue-700 border-blue-200',
      icono: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" />,
      etiqueta: 'Recuperado',
    };
  };

  const estadoInfo = getEstadoBadge(objeto.estado?.nombre);

  // Formatear fecha
  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div
      id={`objeto-card-${objeto.id}`}
      className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
    >
      <div className="p-5">
        {/* Cabecera de la tarjeta con badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${estadoInfo.clase}`}
          >
            {estadoInfo.icono}
            {estadoInfo.etiqueta}
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            {getCategoriaIcon(objeto.categoria?.nombre)}
            <span className="truncate max-w-[120px]">{objeto.categoria?.nombre || 'General'}</span>
          </span>
        </div>

        {/* Título */}
        <h3
          onClick={() => onVerDetalle(objeto)}
          className="font-bold text-base text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 cursor-pointer mb-2"
          title={objeto.titulo}
        >
          {objeto.titulo}
        </h3>

        {/* Descripción corta */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {objeto.descripcion}
        </p>

        {/* Metadatos de ubicación y fecha */}
        <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-700">
              {objeto.ubicacion?.nombre || 'Campus Universitario'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate">
              Edificio: <strong className="text-slate-600">{objeto.ubicacion?.edificio || 'General'}</strong>
            </span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formatearFecha(objeto.fecha_reporte)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de tarjeta con acciones */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          id={`btn-ver-detalle-${objeto.id}`}
          onClick={() => onVerDetalle(objeto)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver detalles
        </button>

        {objeto.estado?.nombre !== 'recuperado' && onReclamar && (
          <button
            id={`btn-reclamar-${objeto.id}`}
            onClick={() => onReclamar(objeto)}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition-colors"
          >
            <span>Creo que es mío</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ObjectCard;
