/**
 * @file ReportPage.tsx
 * @description Formulario para reportar objetos perdidos o encontrados con algoritmo de coincidencias en vivo.
 */

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  AlertTriangle,
  CheckCircle2,
  Tag,
  MapPin,
  Calendar,
  Sparkles,
  Send,
  AlertCircle,
  FileText,
  School,
  Crosshair,
} from 'lucide-react';
import { Categoria, Ubicacion, Objeto } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MatchingAlert } from '../components/MatchingAlert';
import { USULUTAN_COORDS_FALLBACK } from './MapPage';

interface ReportPageProps {
  tipoInicial?: 'perdido' | 'encontrado';
  onReporteCreado: () => void;
  onVerDetalleObjeto: (objeto: Objeto) => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  tipoInicial = 'perdido',
  onReporteCreado,
  onVerDetalleObjeto,
}) => {
  const { usuario, abrirModalAuth } = useAuth();

  // Tipo de reporte: 1 = perdido, 2 = encontrado
  const [tipoReporte, setTipoReporte] = useState<'perdido' | 'encontrado'>(tipoInicial);

  const [titulo, setTitulo] = useState('');
  const [categoriaId, setCategoriaId] = useState<number>(1);
  const [ubicacionId, setUbicacionId] = useState<number>(1);
  const [fechaReporte, setFechaReporte] = useState<string>(() => {
    return new Date().toISOString().substring(0, 10);
  });
  const [descripcion, setDescripcion] = useState('');

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [coincidencias, setCoincidencias] = useState<Objeto[]>([]);

  // Coordenadas GPS en Usulután
  const [latitud, setLatitud] = useState<number>(13.3468);
  const [longitud, setLongitud] = useState<number>(-88.4205);
  const mapPickerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // Cargar catálogo de categorías y ubicaciones
  useEffect(() => {
    async function cargarCatalogos() {
      try {
        const [resCat, resUbi] = await Promise.all([
          api.categorias.listar(),
          api.ubicaciones.listar(),
        ]);
        if (resCat.success && resCat.categorias.length > 0) {
          setCategorias(resCat.categorias);
          setCategoriaId(resCat.categorias[0].id);
        }
        if (resUbi.success && resUbi.ubicaciones.length > 0) {
          setUbicaciones(resUbi.ubicaciones);
          const first = resUbi.ubicaciones[0];
          setUbicacionId(first.id);
          const initLat = first.latitud ?? USULUTAN_COORDS_FALLBACK[first.id]?.lat ?? 13.3468;
          const initLng = first.longitud ?? USULUTAN_COORDS_FALLBACK[first.id]?.lng ?? -88.4205;
          setLatitud(initLat);
          setLongitud(initLng);
        }
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
      }
    }
    cargarCatalogos();
  }, []);

  // Inicializar mini-mapa selector de coordenadas en Usulután
  useEffect(() => {
    if (!mapPickerRef.current || mapInstanceRef.current || exito) return;

    const map = L.map(mapPickerRef.current, {
      center: [latitud, longitud],
      zoom: 17,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap | Usulután GPS',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([latitud, longitud], { draggable: true }).addTo(map);
    marker.bindPopup('📍 Punto exacto del reporte en Usulután (puedes arrastrar o hacer clic en el mapa)').openPopup();

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setLatitud(Number(pos.lat.toFixed(6)));
      setLongitud(Number(pos.lng.toFixed(6)));
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLatitud(Number(lat.toFixed(6)));
      setLongitud(Number(lng.toFixed(6)));
      marker.setLatLng([lat, lng]);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [exito]);

  // Actualizar pin cuando cambian coordenadas
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([latitud, longitud]);
      mapInstanceRef.current.panTo([latitud, longitud]);
    }
  }, [latitud, longitud]);

  const usarMiGPSActual = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(Number(pos.coords.latitude.toFixed(6)));
        setLongitud(Number(pos.coords.longitude.toFixed(6)));
      },
      () => {
        // Fallback al campus Usulután
        setLatitud(13.3468);
        setLongitud(-88.4205);
      }
    );
  };

  // Algoritmo en vivo de detección de posibles coincidencias (sin IA, solo SQL relacional)
  useEffect(() => {
    if (!categoriaId) return;

    const estadoIdActual = tipoReporte === 'perdido' ? 1 : 2;

    const timeout = setTimeout(async () => {
      try {
        const res = await api.objetos.coincidencias({
          categoria_id: categoriaId,
          ubicacion_id: ubicacionId,
          estado_id: estadoIdActual,
          titulo: titulo.trim() || undefined,
        });

        if (res.success) {
          setCoincidencias(res.coincidencias || []);
        }
      } catch (err) {
        // Silenciar errores de sondeo en background
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [tipoReporte, categoriaId, ubicacionId, titulo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) {
      abrirModalAuth();
      return;
    }

    if (titulo.trim().length < 4) {
      setError('Por favor indica un título más descriptivo para el objeto.');
      return;
    }

    if (descripcion.trim().length < 10) {
      setError('Por favor añade una descripción más completa (mínimo 10 caracteres).');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const estado_id = tipoReporte === 'perdido' ? 1 : 2;
      await api.objetos.crear({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria_id: categoriaId,
        ubicacion_id: ubicacionId,
        estado_id,
        fecha_reporte: fechaReporte,
        latitud,
        longitud,
      });

      setExito(true);
      setTimeout(() => {
        onReporteCreado();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el reporte.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Cabecera */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Formulario de Reporte de Pertenencias
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Registra formalmente un objeto perdido o encontrado en el campus universitario.
        </p>
      </div>

      {/* Selector de modo: Perdido vs Encontrado */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-200/80 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setTipoReporte('perdido');
            setCoincidencias([]);
          }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs ${
            tipoReporte === 'perdido'
              ? 'bg-rose-600 text-white shadow-rose-600/30'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>He perdido un objeto</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTipoReporte('encontrado');
            setCoincidencias([]);
          }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs ${
            tipoReporte === 'encontrado'
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>He encontrado un objeto</span>
        </button>
      </div>

      {/* Alerta de sesión requerida si no está logueado */}
      {!usuario && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-blue-700 shrink-0" />
            <span>Debes iniciar sesión con tu cuenta universitaria para publicar un reporte.</span>
          </div>
          <button
            type="button"
            onClick={abrirModalAuth}
            className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-bold shrink-0 hover:bg-blue-800"
          >
            Ingresar ahora
          </button>
        </div>
      )}

      {/* Formulario principal */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs">
        {exito ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              ¡Reporte Registrado Exitosamente!
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              El objeto ha sido añadido a la base de datos de Campus Find y está visible en los listados institucionales.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Título */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Título del objeto *
              </label>
              <input
                id="input-titulo-reporte"
                type="text"
                required
                placeholder="Ej. Mochila verde oliva con libreta de cálculo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>

            {/* Categoría y Ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Categoría *
                </label>
                <div className="relative">
                  <select
                    id="select-categoria-reporte"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Lugar o Edificio del Campus *
                </label>
                <select
                  id="select-ubicacion-reporte"
                  value={ubicacionId}
                  onChange={(e) => {
                    const idSeleccionado = Number(e.target.value);
                    setUbicacionId(idSeleccionado);
                    const ubi = ubicaciones.find((u) => u.id === idSeleccionado);
                    if (ubi) {
                      const newLat = ubi.latitud ?? USULUTAN_COORDS_FALLBACK[ubi.id]?.lat ?? 13.3468;
                      const newLng = ubi.longitud ?? USULUTAN_COORDS_FALLBACK[ubi.id]?.lng ?? -88.4205;
                      setLatitud(newLat);
                      setLongitud(newLng);
                    }
                  }}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
                >
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.edificio} - {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selector Interactivo de Geolocalización en el Mapa de Usulután */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  📍 Geolocalización exacta en Usulután (Haz clic en el mapa para ajustar el pin)
                </label>
                <button
                  type="button"
                  onClick={usarMiGPSActual}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5 text-sky-600" />
                  <span>Usar mi GPS actual</span>
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-xs">
                <div ref={mapPickerRef} className="w-full h-56 z-10" />
                <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                  <span>Latitud: {latitud.toFixed(6)}</span>
                  <span>Longitud: {longitud.toFixed(6)}</span>
                  <span className="text-blue-700 font-sans font-bold">Usulután, SV</span>
                </div>
              </div>
            </div>

            {/* Fecha del suceso */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Fecha del extravío o hallazgo *
              </label>
              <div className="relative">
                <input
                  id="input-fecha-reporte"
                  type="date"
                  required
                  value={fechaReporte}
                  onChange={(e) => setFechaReporte(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 outline-none"
                />
              </div>
            </div>

            {/* Descripción detallada */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Descripción detallada *
              </label>
              <textarea
                id="input-descripcion-reporte"
                required
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Menciona color, marca, modelo, condiciones físicas, calcomanías, contenido visible o cualquier detalle distintivo..."
                className="w-full text-sm p-3.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* ALERTA DE COINCIDENCIAS EN VIVO */}
            {coincidencias.length > 0 && (
              <MatchingAlert
                coincidencias={coincidencias}
                tipoReporteActual={tipoReporte}
                onSeleccionarObjeto={onVerDetalleObjeto}
              />
            )}

            {/* Botón enviar */}
            <div className="pt-2">
              <button
                id="btn-publicar-reporte"
                type="submit"
                disabled={enviando}
                className={`w-full py-3 px-6 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  tipoReporte === 'perdido'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                } disabled:opacity-50`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {enviando
                    ? 'Registrando en base de datos...'
                    : tipoReporte === 'perdido'
                    ? 'Publicar Reporte de Objeto Perdido'
                    : 'Publicar Reporte de Objeto Encontrado'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
