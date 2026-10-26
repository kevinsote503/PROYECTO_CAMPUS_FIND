/**
 * @file HomePage.tsx
 * @description Pantalla de inicio de Campus Find con buscador rápido, accesos directos y objetos recientes.
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  School,
  Clock,
  Compass,
} from 'lucide-react';
import { Objeto, Categoria, Estadisticas } from '../types';
import { api } from '../services/api';
import { ObjectCard } from '../components/ObjectCard';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onIrABuscar: (filtroTexto?: string, filtroCategoria?: string) => void;
  onAbrirReporte: (tipo: 'perdido' | 'encontrado') => void;
  onIrACrud?: () => void;
  onVerDetalle: (objeto: Objeto) => void;
  onReclamar: (objeto: Objeto) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onIrABuscar,
  onAbrirReporte,
  onIrACrud,
  onVerDetalle,
  onReclamar,
}) => {
  const { esAdmin } = useAuth();
  const [objetosRecientes, setObjetosRecientes] = useState<Objeto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resObjetos, resCategorias, resStats] = await Promise.all([
          api.objetos.listar(6),
          api.categorias.listar(),
          api.stats.obtener(),
        ]);

        if (resObjetos.success) setObjetosRecientes(resObjetos.objetos);
        if (resCategorias.success) setCategorias(resCategorias.categorias);
        if (resStats.success) setStats(resStats.estadisticas);
      } catch (err) {
        console.error('Error al cargar datos de portada:', err);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    onIrABuscar(textoBusqueda);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Institucional */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-blue-950 text-white rounded-3xl p-6 sm:p-10 lg:p-14 shadow-xl">
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-700/60 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-xs">
            <School className="w-3.5 h-3.5" />
            <span>Sistema Oficial Universitario de Objetos Perdidos</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            ¿Perdiste o encontraste algo en el campus?
          </h1>

          <p className="text-sm sm:text-base text-blue-100/90 max-w-xl mx-auto font-normal leading-relaxed">
            Reporta rápidamente, consulta coincidencias en tiempo real y recupera tus pertenencias
            con el respaldo de la administración universitaria.
          </p>

          {/* Barra de búsqueda principal */}
          <form
            onSubmit={handleBuscar}
            className="flex items-center max-w-xl mx-auto bg-white rounded-2xl p-1.5 shadow-2xl border border-blue-200/50"
          >
            <div className="flex items-center flex-1 pl-3 text-slate-400">
              <Search className="w-5 h-5" />
              <input
                id="input-buscador-hero"
                type="text"
                placeholder="Ej. Calculadora, Mochila, Credencial..."
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
                className="w-full text-sm text-slate-800 px-3 py-2 outline-none placeholder:text-slate-400 font-medium"
              />
            </div>
            <button
              id="btn-buscar-hero"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md transition-colors"
            >
              Buscar
            </button>
          </form>

          {/* Botones de acción principales */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="btn-reportar-perdido-hero"
              onClick={() => onAbrirReporte('perdido')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-lg shadow-rose-900/30 transition-all hover:scale-[1.02]"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Reportar objeto perdido</span>
            </button>

            <button
              id="btn-reportar-encontrado-hero"
              onClick={() => onAbrirReporte('encontrado')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Reportar objeto encontrado</span>
            </button>

            {esAdmin && onIrACrud && (
              <button
                id="btn-ir-crud-hero"
                onClick={onIrACrud}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 text-sm font-bold shadow-lg transition-all hover:scale-[1.02]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Gestión de Base de Datos (CRUD)</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Métricas e Indicadores del Campus */}
      {stats && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.totalObjetos}</p>
              <p className="text-xs text-slate-500 font-medium">Objetos Reportados</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.totalPerdidos}</p>
              <p className="text-xs text-slate-500 font-medium">En Búsqueda Activa</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.totalEncontrados}</p>
              <p className="text-xs text-slate-500 font-medium">En Custodia / Encontrados</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.tasaRecuperacion}%</p>
              <p className="text-xs text-slate-500 font-medium">Tasa de Recuperación</p>
            </div>
          </div>
        </section>
      )}

      {/* Categorías Rápidas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Categorías de Objetos</h2>
          <button
            onClick={() => onIrABuscar()}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Ver todo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onIrABuscar(undefined, String(cat.id))}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-xs font-semibold text-slate-700 hover:text-blue-700 shrink-0 transition-all shadow-xs"
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </section>

      {/* Objetos Recientes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Reportes Recientes en el Campus
            </h2>
            <p className="text-xs text-slate-500">
              Pertenencias extraviadas o localizadas durante los últimos días
            </p>
          </div>

          <button
            id="btn-ver-todos-los-objetos"
            onClick={() => onIrABuscar()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <span>Explorar catálogo completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Cargando objetos recientes...
          </div>
        ) : objetosRecientes.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            Aún no hay objetos reportados en el sistema.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {objetosRecientes.map((obj) => (
              <ObjectCard
                key={obj.id}
                objeto={obj}
                onVerDetalle={onVerDetalle}
                onReclamar={onReclamar}
              />
            ))}
          </div>
        )}
      </section>

      {/* Cómo funciona el proceso institucional */}
      <section className="p-8 rounded-3xl bg-slate-100 border border-slate-200">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h3 className="text-xl font-extrabold text-slate-900">
            ¿Cómo funciona la recuperación en Campus Find?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900">Reporta en el sistema</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registra la descripción, edificio y fecha. El sistema compara automáticamente coincidencias similares.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900">Solicita tu reclamación</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Si encuentras tu pertenencia en la lista, presiona "Creo que es mío" y proporciona evidencias privadas.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900">Entrega y Devolución</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seguridad universitaria aprueba la solicitud y te entrega el objeto en caseta de vigilancia con acta oficial.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
