/**
 * @file AdminDashboardPage.tsx
 * @description Panel integral de administración: estadísticas, aprobación/rechazo de reclamaciones, registro de entregas y catálogos.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Package,
  Plus,
  Users,
  Clock,
  Eye,
  Building,
  Tag,
  Search,
} from 'lucide-react';
import {
  Estadisticas,
  Reclamacion,
  Entrega,
  Categoria,
  Ubicacion,
  Objeto,
} from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DeliveryModal } from '../components/DeliveryModal';

interface AdminDashboardPageProps {
  onVerDetalleObjeto: (objeto: Objeto) => void;
  onIrACrud?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onVerDetalleObjeto,
  onIrACrud,
}) => {
  const { esAdmin, abrirModalAuth } = useAuth();

  const [pestaña, setPestaña] = useState<'kpis' | 'reclamaciones' | 'entregas' | 'catalogos'>('reclamaciones');
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  const [cargando, setCargando] = useState(true);
  const [reclamacionSeleccionadaParaEntrega, setReclamacionSeleccionadaParaEntrega] = useState<Reclamacion | null>(null);

  // Formulario nueva categoría
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  // Formulario nueva ubicación
  const [nuevoEdificio, setNuevoEdificio] = useState('');
  const [nuevoNombreUbi, setNuevoNombreUbi] = useState('');
  const [nuevaDescUbi, setNuevaDescUbi] = useState('');

  const [accionEnProgreso, setAccionEnProgreso] = useState<number | null>(null);

  const cargarDatos = async () => {
    if (!esAdmin) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const [resStats, resRec, resEnt, resCat, resUbi] = await Promise.all([
        api.stats.obtener(),
        api.reclamaciones.listar(),
        api.entregas.listar(),
        api.categorias.listar(),
        api.ubicaciones.listar(),
      ]);

      if (resStats.success) setStats(resStats.estadisticas);
      if (resRec.success) setReclamaciones(resRec.reclamaciones);
      if (resEnt.success) setEntregas(resEnt.entregas);
      if (resCat.success) setCategorias(resCat.categorias);
      if (resUbi.success) setUbicaciones(resUbi.ubicaciones);
    } catch (err) {
      console.error('Error al cargar panel admin:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [esAdmin]);

  const cambiarEstadoReclamacion = async (id: number, nuevoEstadoId: number) => {
    setAccionEnProgreso(id);
    try {
      await api.reclamaciones.actualizarEstado(id, nuevoEstadoId);
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar reclamación');
    } finally {
      setAccionEnProgreso(null);
    }
  };

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    try {
      await api.categorias.crear(nuevaCategoria.trim());
      setNuevaCategoria('');
      const res = await api.categorias.listar();
      if (res.success) setCategorias(res.categorias);
    } catch (err: any) {
      alert(err.message || 'Error al crear categoría');
    }
  };

  const handleCrearUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreUbi.trim() || !nuevoEdificio.trim()) return;
    try {
      await api.ubicaciones.crear({
        nombre: nuevoNombreUbi.trim(),
        edificio: nuevoEdificio.trim(),
        descripcion: nuevaDescUbi.trim() || undefined,
      });
      setNuevoEdificio('');
      setNuevoNombreUbi('');
      setNuevaDescUbi('');
      const res = await api.ubicaciones.listar();
      if (res.success) setUbicaciones(res.ubicaciones);
    } catch (err: any) {
      alert(err.message || 'Error al crear ubicación');
    }
  };

  if (!esAdmin) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-md mx-auto my-12">
        <ShieldCheck className="w-12 h-12 text-purple-700 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Acceso Administrativo Requerido</h2>
        <p className="text-xs text-slate-500">
          Esta sección está reservada exclusivamente para el personal de administración y seguridad del campus. Inicia sesión con una cuenta administrativa para continuar.
        </p>
        <button
          onClick={abrirModalAuth}
          className="px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800"
        >
          Iniciar Sesión como Administrador
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Cabecera del panel */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-purple-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-700/80 flex items-center justify-center font-bold">
            <ShieldCheck className="w-7 h-7 text-purple-200" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-purple-800/80 text-purple-200 border border-purple-600/40">
              Control Institucional
            </span>
            <h1 className="text-2xl font-black tracking-tight">
              Panel de Administración
            </h1>
            <p className="text-xs text-purple-200">
              Validación de solicitudes, entrega oficial y control del inventario
            </p>
          </div>
        </div>

        {/* Pestañas internas */}
        <div className="flex bg-purple-950/60 p-1.5 rounded-2xl border border-purple-800/50 flex-wrap gap-1">
          <button
            onClick={() => setPestaña('reclamaciones')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              pestaña === 'reclamaciones'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            Reclamaciones ({reclamaciones.filter((r) => r.estado_reclamacion_id === 1).length})
          </button>
          <button
            onClick={() => setPestaña('entregas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              pestaña === 'entregas'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            Entregas ({entregas.length})
          </button>
          <button
            onClick={() => setPestaña('kpis')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              pestaña === 'kpis'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            Métricas
          </button>
          <button
            onClick={() => setPestaña('catalogos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              pestaña === 'catalogos'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            Catálogos
          </button>
          {onIrACrud && (
            <button
              onClick={onIrACrud}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
            >
              Gestión Base de Datos (CRUD) →
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          Actualizando panel institucional...
        </div>
      ) : (
        <>
          {/* PESTAÑA 1: GESTIÓN DE RECLAMACIONES */}
          {pestaña === 'reclamaciones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Solicitudes de Reclamación ({reclamaciones.length})
                </h2>
                <span className="text-xs text-slate-500">
                  Valida las pruebas aportadas antes de autorizar la entrega física
                </span>
              </div>

              {reclamaciones.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  No hay reclamaciones registradas actualmente.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {reclamaciones.map((rec) => {
                    const esPendiente = rec.estado_reclamacion_id === 1;
                    const esAprobada = rec.estado_reclamacion_id === 2;
                    const tieneEntrega = !!rec.entrega;

                    return (
                      <div
                        key={rec.id}
                        className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                esPendiente
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : esAprobada
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {rec.estado_reclamacion?.nombre}
                            </span>
                            <span className="text-xs text-slate-400">
                              ID Solicitud #{rec.id}
                            </span>
                            <span className="text-xs text-slate-500">
                              Fecha: {new Date(rec.fecha).toLocaleDateString('es-ES')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">
                              {rec.objeto?.titulo}
                            </h3>
                            {rec.objeto && (
                              <button
                                onClick={() => onVerDetalleObjeto(rec.objeto!)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver objeto</span>
                              </button>
                            )}
                          </div>

                          {/* Reclamante */}
                          <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800">
                              Reclamante: {rec.usuario?.nombre}
                            </span>
                            <span className="text-slate-400">({rec.usuario?.correo})</span>
                            {rec.usuario?.telefono && (
                              <span className="text-slate-400">| Tel: {rec.usuario.telefono}</span>
                            )}
                          </div>

                          {/* Evidencia */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                            <span className="font-bold text-slate-900 block mb-0.5">
                              Evidencias declaradas por el reclamante:
                            </span>
                            <p className="italic">"{rec.descripcion}"</p>
                          </div>
                        </div>

                        {/* Botones de acción admin */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {esPendiente && (
                            <>
                              <button
                                disabled={accionEnProgreso === rec.id}
                                onClick={() => cambiarEstadoReclamacion(rec.id, 2)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aprobar Reclamación</span>
                              </button>

                              <button
                                disabled={accionEnProgreso === rec.id}
                                onClick={() => cambiarEstadoReclamacion(rec.id, 3)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rechazar</span>
                              </button>
                            </>
                          )}

                          {esAprobada && !tieneEntrega && (
                            <button
                              onClick={() => setReclamacionSeleccionadaParaEntrega(rec)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Registrar Entrega Formal</span>
                            </button>
                          )}

                          {tieneEntrega && (
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                              ✓ Entregado formalmente
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 2: HISTORIAL DE ENTREGAS */}
          {pestaña === 'entregas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Actas y Registro de Entregas Oficiales ({entregas.length})
                </h2>
                <span className="text-xs text-slate-500">
                  Historial inmutable de objetos devueltos a sus dueños legítimos
                </span>
              </div>

              {entregas.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  Aún no se han registrado actas de entrega en el campus.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {entregas.map((ent) => (
                    <div key={ent.id} className="p-5 space-y-2 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-bold text-purple-700">
                          Acta de Entrega #{ent.id}
                        </span>
                        <span>{new Date(ent.fecha).toLocaleDateString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-base">
                          {ent.reclamacion?.objeto?.titulo || 'Objeto devuelto'}
                        </h4>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          Recuperado
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        Entregado a: <strong>{ent.reclamacion?.usuario?.nombre}</strong> ({ent.reclamacion?.usuario?.correo})
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <span className="font-semibold text-slate-800">Observaciones del acta:</span>{' '}
                        {ent.observaciones}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 3: RESUMEN Y MÉTRICAS */}
          {pestaña === 'kpis' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Total Objetos Registrados</span>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalObjetos}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Objetos Perdidos</span>
                  <p className="text-3xl font-black text-rose-600 mt-1">{stats.totalPerdidos}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Objetos en Custodia</span>
                  <p className="text-3xl font-black text-emerald-600 mt-1">{stats.totalEncontrados}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Objetos Recuperados</span>
                  <p className="text-3xl font-black text-blue-600 mt-1">{stats.totalRecuperados}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Tasa de Recuperación</span>
                  <p className="text-3xl font-black text-purple-700 mt-1">{stats.tasaRecuperacion}%</p>
                  <p className="text-xs text-slate-400 mt-1">Porcentaje de objetos devueltos con éxito</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Reclamaciones Pendientes</span>
                  <p className="text-3xl font-black text-amber-600 mt-1">{stats.reclamacionesPendientes}</p>
                  <p className="text-xs text-slate-400 mt-1">Requieren validación de evidencias</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Total Usuarios en Sistema</span>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalUsuarios}</p>
                  <p className="text-xs text-slate-400 mt-1">Estudiantes, docentes y personal</p>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 4: CATÁLOGOS (CATEGORÍAS Y UBICACIONES) */}
          {pestaña === 'catalogos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categorías */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-600" />
                    <span>Categorías ({categorias.length})</span>
                  </h3>
                </div>

                <form onSubmit={handleCrearCategoria} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nueva categoría (ej. Material Deportivo)"
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Añadir
                  </button>
                </form>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pt-2">
                  {categorias.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium">{c.nombre}</span>
                      <span className="text-[10px] text-slate-400">ID #{c.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ubicaciones */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span>Ubicaciones del Campus ({ubicaciones.length})</span>
                  </h3>
                </div>

                <form onSubmit={handleCrearUbicacion} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Edificio (ej. Edificio D)"
                      value={nuevoEdificio}
                      onChange={(e) => setNuevoEdificio(e.target.value)}
                      className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Nombre (ej. Cafetería)"
                      value={nuevoNombreUbi}
                      onChange={(e) => setNuevoNombreUbi(e.target.value)}
                      className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Descripción u orientación adicional (opcional)"
                    value={nuevaDescUbi}
                    onChange={(e) => setNuevaDescUbi(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Añadir Ubicación
                  </button>
                </form>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pt-2">
                  {ubicaciones.map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold">{u.edificio}</span> - {u.nombre}
                      </div>
                      <span className="text-[10px] text-slate-400">ID #{u.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal para registrar entrega oficial */}
      {reclamacionSeleccionadaParaEntrega && (
        <DeliveryModal
          reclamacion={reclamacionSeleccionadaParaEntrega}
          onCerrar={() => setReclamacionSeleccionadaParaEntrega(null)}
          onEntregaRegistrada={() => {
            setReclamacionSeleccionadaParaEntrega(null);
            cargarDatos();
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
