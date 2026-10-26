/**
 * @file ObjectDetailModal.tsx
 * @description Modal de detalle completo de un objeto con opción directa para iniciar reclamo.
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  Calendar,
  Building,
  User,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Sparkles,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { Objeto } from '../types';
import { useAuth } from '../context/AuthContext';
import { obtenerCoordenadasObjeto } from '../pages/MapPage';

interface ObjectDetailModalProps {
  objeto: Objeto | null;
  onCerrar: () => void;
  onReclamar: (objeto: Objeto) => void;
}

export const ObjectDetailModal: React.FC<ObjectDetailModalProps> = ({
  objeto,
  onCerrar,
  onReclamar,
}) => {
  const { usuario, esAdmin } = useAuth();
  const miniMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!objeto || !miniMapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { lat, lng } = obtenerCoordenadasObjeto(objeto);

    const map = L.map(miniMapRef.current, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap | Usulután',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng]).addTo(map);
    marker
      .bindPopup(
        `<strong>${objeto.titulo}</strong><br/><span style="font-size:11px;">${objeto.ubicacion?.edificio || 'Campus Usulután'}</span>`
      )
      .openPopup();

    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [objeto]);

  if (!objeto) return null;

  const { lat: objLat, lng: objLng } = obtenerCoordenadasObjeto(objeto);

  const esDuenio = usuario && usuario.id === objeto.usuario_id;
  const esRecuperado = objeto.estado?.nombre === 'recuperado';

  const formatearFechaCompleta = (fechaStr: string) => {
    try {
      const f = new Date(fechaStr);
      return f.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="modal-detalle-objeto"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden"
      >
        {/* Encabezado del modal */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${
                  objeto.estado?.nombre === 'perdido'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : objeto.estado?.nombre === 'encontrado'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {objeto.estado?.nombre === 'perdido' && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                {objeto.estado?.nombre === 'encontrado' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                {objeto.estado?.nombre === 'recuperado' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                Objeto {objeto.estado?.nombre?.toUpperCase()}
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3 text-blue-600" />
                {objeto.categoria?.nombre || 'General'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {objeto.titulo}
            </h2>
          </div>

          <button
            id="btn-cerrar-detalle"
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-6 space-y-6">
          
          {/* Descripción */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Descripción detallada
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {objeto.descripcion}
            </div>
          </div>

          {/* Tarjeta de ubicación y fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Ubicación en el Campus</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {objeto.ubicacion?.nombre}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Edificio: <strong className="text-slate-700">{objeto.ubicacion?.edificio}</strong></span>
              </div>
              {objeto.ubicacion?.descripcion && (
                <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-100">
                  {objeto.ubicacion.descripcion}
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Fecha del Reporte</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 capitalize">
                {formatearFechaCompleta(objeto.fecha_reporte)}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Reportado por:{' '}
                  <strong className="text-slate-700">
                    {esAdmin || esDuenio ? objeto.usuario?.nombre : `${objeto.usuario?.nombre?.split(' ')[0]} (Miembro Universitario)`}
                  </strong>
                </span>
              </div>
              {esAdmin && objeto.usuario?.correo && (
                <p className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Contacto: {objeto.usuario.correo} {objeto.usuario.telefono ? `| Tel: ${objeto.usuario.telefono}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Mini-Mapa de Geolocalización en Usulután */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Geolocalización en Usulután ({objLat.toFixed(5)}, {objLng.toFixed(5)})</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${objLat},${objLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir en Google Maps</span>
              </a>
            </div>
            <div ref={miniMapRef} className="w-full h-48 z-10" />
          </div>

          {/* Alerta informativa de custodia */}
          {objeto.estado?.nombre === 'encontrado' && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Custodia Institucional y Entrega Segura</p>
                <p className="text-blue-800 mt-0.5">
                  Los objetos encontrados deben ser reclamados formalmente. Para evitar fraudes,
                  la administración universitaria valida las características particulares antes de autorizar la entrega en caseta de seguridad.
                </p>
              </div>
            </div>
          )}

          {/* Historial de reclamaciones para administradores */}
          {esAdmin && objeto.reclamaciones && objeto.reclamaciones.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">
                Reclamaciones registradas para este objeto ({objeto.reclamaciones.length})
              </h4>
              <div className="space-y-2">
                {objeto.reclamaciones.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{rec.usuario?.nombre || 'Usuario'}</span>
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] bg-white border border-purple-200">
                        {rec.estado_reclamacion?.nombre || 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 italic">"{rec.descripcion}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pie del modal con acciones */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            {!esRecuperado && !esDuenio && (
              <button
                id="btn-iniciar-reclamo-modal"
                onClick={() => {
                  onCerrar();
                  onReclamar(objeto);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-700/20 transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4" />
                Creo que es mío (Reclamar)
              </button>
            )}

            {esDuenio && (
              <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-3 py-1.5 rounded-lg">
                Tú reportaste este objeto
              </span>
            )}

            {esRecuperado && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg">
                ✓ Objeto devuelto a su dueño
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectDetailModal;
