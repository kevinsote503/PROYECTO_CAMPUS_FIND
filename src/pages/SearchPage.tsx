/**
 * @file SearchPage.tsx
 * @description Pantalla de búsqueda multicriterio con filtros combinados (categoría, ubicación, estado, texto).
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, MapPin, Tag, AlertCircle } from 'lucide-react';
import { Objeto, Categoria, Ubicacion } from '../types';
import { api } from '../services/api';
import { ObjectCard } from '../components/ObjectCard';

interface SearchPageProps {
  filtroTextoInicial?: string;
  filtroCategoriaInicial?: string;
  onVerDetalle: (objeto: Objeto) => void;
  onReclamar: (objeto: Objeto) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  filtroTextoInicial = '',
  filtroCategoriaInicial = 'todas',
  onVerDetalle,
  onReclamar,
}) => {
  const [texto, setTexto] = useState(filtroTextoInicial);
  const [categoria, setCategoria] = useState(filtroCategoriaInicial);
  const [ubicacion, setUbicacion] = useState('todas');
  const [estado, setEstado] = useState('todos');

  const [objetos, setObjetos] = useState<Objeto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar categorías y ubicaciones al montar
  useEffect(() => {
    async function cargarFiltros() {
      try {
        const [resCat, resUbi] = await Promise.all([
          api.categorias.listar(),
          api.ubicaciones.listar(),
        ]);
        if (resCat.success) setCategorias(resCat.categorias);
        if (resUbi.success) setUbicaciones(resUbi.ubicaciones);
      } catch (err) {
        console.error('Error al cargar filtros:', err);
      }
    }
    cargarFiltros();
  }, []);

  // Ejecutar búsqueda cuando cambien los filtros
  useEffect(() => {
    async function ejecutarBusqueda() {
      setCargando(true);
      try {
        const res = await api.objetos.buscar({
          texto: texto.trim() || undefined,
          categoria: categoria !== 'todas' ? categoria : undefined,
          ubicacion: ubicacion !== 'todas' ? ubicacion : undefined,
          estado: estado !== 'todos' ? estado : undefined,
        });
        if (res.success) {
          setObjetos(res.objetos);
        }
      } catch (err) {
        console.error('Error en búsqueda:', err);
      } finally {
        setCargando(false);
      }
    }

    const timeout = setTimeout(ejecutarBusqueda, 250);
    return () => clearTimeout(timeout);
  }, [texto, categoria, ubicacion, estado]);

  const limpiarFiltros = () => {
    setTexto('');
    setCategoria('todas');
    setUbicacion('todas');
    setEstado('todos');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Búsqueda de Objetos en el Campus
        </h1>
        <p className="text-sm text-slate-500">
          Encuentra pertenencias aplicando filtros por categoría, edificio y estado
        </p>
      </div>

      {/* Contenedor de filtros */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Barra de texto */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="input-buscar-texto"
            type="text"
            placeholder="Buscar por palabra clave (ej. mochila verde, auriculares sony, credencial...)"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 text-sm outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filtros desplegables */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Categoría</label>
            <select
              id="select-filtro-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
            >
              <option value="todas">Todas las Categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Ubicación / Edificio</label>
            <select
              id="select-filtro-ubicacion"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
            >
              <option value="todas">Todas las Ubicaciones</option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.edificio} - {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Estado del Objeto</label>
            <select
              id="select-filtro-estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
            >
              <option value="todos">Todos los Estados</option>
              <option value="1">Perdido (En búsqueda)</option>
              <option value="2">Encontrado (En custodia)</option>
              <option value="3">Recuperado (Devuelto)</option>
            </select>
          </div>

          {/* Botón limpiar */}
          <div className="flex items-end">
            <button
              id="btn-limpiar-filtros"
              type="button"
              onClick={limpiarFiltros}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resultados y conteo */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium">
          <span>
            Mostrando <strong>{objetos.length}</strong> objetos encontrados
          </span>
          {(texto || categoria !== 'todas' || ubicacion !== 'todas' || estado !== 'todos') && (
            <span className="text-blue-700 font-semibold">
              Filtros activos
            </span>
          )}
        </div>

        {cargando ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            Consultando base de datos universitaria...
          </div>
        ) : objetos.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800">
              No se hallaron objetos con los criterios seleccionados
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Prueba cambiando la ubicación, limpiando el texto de búsqueda o reporta tu objeto si aún no está en el sistema.
            </p>
            <button
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold shadow-xs hover:bg-blue-800 transition-colors"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {objetos.map((obj) => (
              <ObjectCard
                key={obj.id}
                objeto={obj}
                onVerDetalle={onVerDetalle}
                onReclamar={onReclamar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
