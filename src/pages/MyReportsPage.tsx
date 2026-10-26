/**
 * @file MyReportsPage.tsx
 * @description Listado de objetos reportados por el usuario autenticado con CRUD completo (Editar/Eliminar) y búsqueda interactiva.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderHeart,
  PlusCircle,
  Trash2,
  Edit3,
  Eye,
  Calendar,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Objeto, Categoria, Ubicacion } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface MyReportsPageProps {
  onAbrirReporte: () => void;
  onVerDetalle: (objeto: Objeto) => void;
}

export const MyReportsPage: React.FC<MyReportsPageProps> = ({
  onAbrirReporte,
  onVerDetalle,
}) => {
  const { usuario, abrirModalAuth } = useAuth();
  const [objetos, setObjetos] = useState<Objeto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  // Búsqueda interactiva en Mis Reportes
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Estado de edición inline (Actualizar registro)
  const [objetoEditando, setObjetoEditando] = useState<Objeto | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editCategoriaId, setEditCategoriaId] = useState<number>(1);
  const [editUbicacionId, setEditUbicacionId] = useState<number>(1);
  const [editEstadoId, setEditEstadoId] = useState<number>(1);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const cargarMisReportes = async () => {
    if (!usuario) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const [resObj, resCat, resUbi] = await Promise.all([
        api.objetos.misReportes(),
        api.categorias.listar(),
        api.ubicaciones.listar(),
      ]);
      if (resObj.success) setObjetos(resObj.objetos);
      if (resCat.success) setCategorias(resCat.categorias);
      if (resUbi.success) setUbicaciones(resUbi.ubicaciones);
    } catch (err) {
      console.error('Error al cargar mis reportes:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMisReportes();
  }, [usuario]);

  // Filtrado interactivo en tiempo real
  const objetosFiltrados = useMemo(() => {
    return objetos.filter((o) => {
      if (filtroEstado !== 'todos' && String(o.estado_id) !== filtroEstado) {
        return false;
      }
      if (busquedaTexto.trim()) {
        const q = busquedaTexto.toLowerCase().trim();
        const matchTitulo = o.titulo.toLowerCase().includes(q);
        const matchDesc = o.descripcion.toLowerCase().includes(q);
        const matchUbi = o.ubicacion?.nombre.toLowerCase().includes(q) || o.ubicacion?.edificio.toLowerCase().includes(q);
        const matchCat = o.categoria?.nombre.toLowerCase().includes(q);
        return matchTitulo || matchDesc || matchUbi || matchCat;
      }
      return true;
    });
  }, [objetos, busquedaTexto, filtroEstado]);

  const abrirEdicion = (obj: Objeto) => {
    setObjetoEditando(obj);
    setEditTitulo(obj.titulo);
    setEditCategoriaId(obj.categoria_id);
    setEditUbicacionId(obj.ubicacion_id);
    setEditEstadoId(obj.estado_id);
    setEditDescripcion(obj.descripcion);
    setMensajeError(null);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objetoEditando) return;

    if (editTitulo.trim().length < 4) {
      setMensajeError('El título debe contener al menos 4 caracteres.');
      return;
    }
    if (editDescripcion.trim().length < 10) {
      setMensajeError('La descripción debe contener al menos 10 caracteres.');
      return;
    }

    setGuardandoEdicion(true);
    setMensajeError(null);
    try {
      await api.objetos.actualizar(objetoEditando.id, {
        titulo: editTitulo.trim(),
        categoria_id: editCategoriaId,
        ubicacion_id: editUbicacionId,
        estado_id: editEstadoId,
        descripcion: editDescripcion.trim(),
      });
      setObjetoEditando(null);
      await cargarMisReportes();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al actualizar el reporte.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este reporte?')) return;
    setEliminandoId(id);
    try {
      await api.objetos.eliminar(id);
      setObjetos((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    } finally {
      setEliminandoId(null);
    }
  };

  if (!usuario) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-md mx-auto my-12">
        <FolderHeart className="w-12 h-12 text-blue-700 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Inicia sesión</h2>
        <p className="text-xs text-slate-500">
          Debes estar autenticado para consultar tus reportes de objetos perdidos y encontrados.
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mis Objetos Reportados
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gestión CRUD de tus publicaciones: busca, edita o elimina tus reportes
          </p>
        </div>

        <button
          onClick={onAbrirReporte}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Crear nuevo reporte</span>
        </button>
      </div>

      {/* Barra de búsqueda interactiva */}
      {objetos.length > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              placeholder="Búsqueda interactiva en tus reportes por título, categoría o edificio..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-700 outline-none"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium outline-none"
          >
            <option value="todos">Todos los estados ({objetos.length})</option>
            <option value="1">Perdidos</option>
            <option value="2">Encontrados</option>
            <option value="3">Recuperados</option>
          </select>
        </div>
      )}

      {/* Formulario Modal / Inline para Actualizar (Editar) */}
      {objetoEditando && (
        <div className="p-6 bg-amber-50/70 rounded-3xl border-2 border-amber-300 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                Actualizar Registro #{objetoEditando.id}
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">
                Editar Reporte: {objetoEditando.titulo}
              </h3>
            </div>
            <button
              onClick={() => setObjetoEditando(null)}
              className="p-1.5 rounded-lg hover:bg-amber-200/60 text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {mensajeError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          <form onSubmit={handleGuardarEdicion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Título del Objeto *
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl bg-white border border-slate-300 focus:border-blue-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Estado *
                </label>
                <select
                  value={editEstadoId}
                  onChange={(e) => setEditEstadoId(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 rounded-xl bg-white border border-slate-300 outline-none"
                >
                  <option value={1}>Perdido</option>
                  <option value={2}>Encontrado</option>
                  <option value={3}>Recuperado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Categoría *
                </label>
                <select
                  value={editCategoriaId}
                  onChange={(e) => setEditCategoriaId(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 rounded-xl bg-white border border-slate-300 outline-none"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ubicación *
                </label>
                <select
                  value={editUbicacionId}
                  onChange={(e) => setEditUbicacionId(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 rounded-xl bg-white border border-slate-300 outline-none"
                >
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.edificio} - {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Descripción detallada (mínimo 10 caracteres) *
              </label>
              <textarea
                rows={3}
                required
                minLength={10}
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                className="w-full text-sm p-3 rounded-xl bg-white border border-slate-300 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setObjetoEditando(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoEdicion}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
              >
                {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {cargando ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          Cargando tus reportes...
        </div>
      ) : objetosFiltrados.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FolderHeart className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">
            {objetos.length === 0
              ? 'No has reportado ningún objeto aún'
              : 'Sin coincidencias para tu filtro'}
          </h3>
          <p className="text-xs text-slate-500">
            {objetos.length === 0
              ? 'Si has extraviado o encontrado algo en las instalaciones del campus, publica un reporte para iniciar la búsqueda.'
              : 'Prueba con otro término en el buscador interactivo.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {objetosFiltrados.map((obj) => (
            <div
              key={obj.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      obj.estado?.nombre === 'perdido'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : obj.estado?.nombre === 'encontrado'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {obj.estado?.nombre}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {obj.categoria?.nombre}
                  </span>
                </div>

                <h3
                  onClick={() => onVerDetalle(obj)}
                  className="font-bold text-slate-900 text-base hover:text-blue-700 cursor-pointer transition-colors"
                >
                  {obj.titulo}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-1">
                  {obj.descripcion}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{obj.ubicacion?.nombre} ({obj.ubicacion?.edificio})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(obj.fecha_reporte).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => onVerDetalle(obj)}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1"
                  title="Ver detalle"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ver</span>
                </button>

                <button
                  onClick={() => abrirEdicion(obj)}
                  className="p-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1"
                  title="Actualizar / Editar reporte"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editar</span>
                </button>

                <button
                  disabled={eliminandoId === obj.id}
                  onClick={() => handleEliminar(obj.id)}
                  className="p-2 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1"
                  title="Eliminar reporte"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
