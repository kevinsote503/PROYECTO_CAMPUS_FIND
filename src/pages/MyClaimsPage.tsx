/**
 * @file MyClaimsPage.tsx
 * @description Pantalla de seguimiento de reclamaciones enviadas por el usuario actual con búsqueda interactiva y edición/eliminación.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  Eye,
  Search,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Reclamacion, Objeto } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface MyClaimsPageProps {
  onVerDetalleObjeto: (objeto: Objeto) => void;
  onIrABuscar: () => void;
}

export const MyClaimsPage: React.FC<MyClaimsPageProps> = ({
  onVerDetalleObjeto,
  onIrABuscar,
}) => {
  const { usuario, abrirModalAuth } = useAuth();
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([]);
  const [cargando, setCargando] = useState(true);

  // Búsqueda interactiva
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Edición de descripción de reclamación
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');

  const cargarReclamaciones = async () => {
    if (!usuario) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const res = await api.reclamaciones.misReclamaciones();
      if (res.success) {
        setReclamaciones(res.reclamaciones);
      }
    } catch (err) {
      console.error('Error al cargar mis reclamaciones:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReclamaciones();
  }, [usuario]);

  const reclamacionesFiltradas = useMemo(() => {
    return reclamaciones.filter((r) => {
      if (filtroEstado !== 'todos' && String(r.estado_reclamacion_id) !== filtroEstado) {
        return false;
      }
      if (busquedaTexto.trim()) {
        const q = busquedaTexto.toLowerCase().trim();
        return (
          r.descripcion.toLowerCase().includes(q) ||
          (r.objeto?.titulo || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reclamaciones, busquedaTexto, filtroEstado]);

  const handleActualizarEvidencia = async (id: number) => {
    if (nuevaDescripcion.trim().length < 10) {
      alert('La evidencia debe tener al menos 10 caracteres.');
      return;
    }
    try {
      await api.reclamaciones.actualizar(id, { descripcion: nuevaDescripcion.trim() });
      setEditandoId(null);
      await cargarReclamaciones();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar reclamación.');
    }
  };

  const handleEliminarReclamacion = async (id: number) => {
    if (!confirm('¿Deseas cancelar y eliminar esta solicitud de reclamación?')) return;
    try {
      await api.reclamaciones.eliminar(id);
      setReclamaciones((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar reclamación.');
    }
  };

  const getEstadoBadge = (estadoNombre?: string) => {
    switch (estadoNombre?.toLowerCase()) {
      case 'aprobada':
        return {
          clase: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icono: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          texto: 'Aprobada - Lista para Retiro',
        };
      case 'rechazada':
        return {
          clase: 'bg-rose-50 text-rose-700 border-rose-200',
          icono: <XCircle className="w-4 h-4 text-rose-600" />,
          texto: 'Rechazada',
        };
      default:
        return {
          clase: 'bg-amber-50 text-amber-700 border-amber-200',
          icono: <Clock className="w-4 h-4 text-amber-600" />,
          texto: 'En Revisión por Administración',
        };
    }
  };

  if (!usuario) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-md mx-auto my-12">
        <FileCheck2 className="w-12 h-12 text-blue-700 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Inicia sesión</h2>
        <p className="text-xs text-slate-500">
          Debes iniciar sesión para consultar el estado de tus solicitudes de reclamación.
        </p>
        <button
          onClick={abrirModalAuth}
          className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold shadow-md hover:bg-blue-800"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Mis Reclamaciones
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Seguimiento, búsqueda interactiva y actualización de evidencias en tus solicitudes
        </p>
      </div>

      {reclamaciones.length > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              placeholder="Buscar en tus reclamaciones por objeto o evidencias..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-700 outline-none"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium outline-none"
          >
            <option value="todos">Todos los estados ({reclamaciones.length})</option>
            <option value="1">Pendientes</option>
            <option value="2">Aprobadas</option>
            <option value="3">Rechazadas</option>
          </select>
        </div>
      )}

      {cargando ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          Cargando reclamaciones...
        </div>
      ) : reclamacionesFiltradas.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">
            No hay reclamaciones para mostrar
          </h3>
          <p className="text-xs text-slate-500">
            Si ves un objeto en la lista de objetos encontrados que coincide con el tuyo, presiona "Creo que es mío" para reclamarlo.
          </p>
          <button
            onClick={onIrABuscar}
            className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800"
          >
            Explorar objetos encontrados
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reclamacionesFiltradas.map((rec) => {
            const estadoInfo = getEstadoBadge(rec.estado_reclamacion?.nombre);
            const esPendiente = rec.estado_reclamacion_id === 1;
            const esAprobada = rec.estado_reclamacion?.nombre === 'aprobada';
            const tieneEntrega = !!rec.entrega;

            return (
              <div
                key={rec.id}
                className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${estadoInfo.clase}`}
                    >
                      {estadoInfo.icono}
                      {estadoInfo.texto}
                    </span>
                    <span className="text-xs text-slate-400">
                      Reclamación #{rec.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Enviada el: {new Date(rec.fecha).toLocaleDateString('es-ES')}</span>
                    {esPendiente && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => {
                            setEditandoId(rec.id);
                            setNuevaDescripcion(rec.descripcion);
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Editar
                        </button>
                        <button
                          onClick={() => handleEliminarReclamacion(rec.id)}
                          className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Objeto asociado */}
                {rec.objeto && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Objeto Reclamado
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {rec.objeto.titulo}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Categoría: {rec.objeto.categoria?.nombre} | Ubicación: {rec.objeto.ubicacion?.nombre}
                      </p>
                    </div>

                    <button
                      onClick={() => onVerDetalleObjeto(rec.objeto!)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver ficha</span>
                    </button>
                  </div>
                )}

                {/* Evidencia suministrada o modo edición */}
                <div>
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tus Evidencias Aportadas:
                  </h5>
                  {editandoId === rec.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={nuevaDescripcion}
                        onChange={(e) => setNuevaDescripcion(e.target.value)}
                        className="w-full text-xs sm:text-sm p-3 rounded-xl border border-amber-300 bg-amber-50/40 outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditandoId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleActualizarEvidencia(rec.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold"
                        >
                          Guardar Evidencia
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic bg-white p-3 rounded-lg border border-slate-200">
                      "{rec.descripcion}"
                    </p>
                  )}
                </div>

                {/* Aviso especial si fue aprobada */}
                {esAprobada && !tieneEntrega && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>¡Tu reclamación ha sido validada por la administración!</span>
                    </div>
                    <p className="leading-relaxed">
                      Por favor acércate a la <strong>Caseta de Seguridad y Vigilancia Central (Edificio de Rectoría)</strong> de lunes a viernes (8:00 a 18:00 hrs). Presenta tu credencial universitaria o documento de identidad para recibir tu pertenencia y firmar el acta.
                    </p>
                  </div>
                )}

                {/* Si ya fue entregada formalmente */}
                {tieneEntrega && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-blue-950">
                      <CheckCircle2 className="w-4 h-4 text-blue-700" />
                      <span>Objeto Entregado Formalmente</span>
                    </div>
                    <p>
                      Fecha de entrega: <strong>{new Date(rec.entrega!.fecha).toLocaleDateString('es-ES')}</strong>.
                    </p>
                    {rec.entrega!.observaciones && (
                      <p className="italic text-blue-800">
                        Observaciones: "{rec.entrega!.observaciones}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyClaimsPage;
