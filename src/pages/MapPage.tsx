/**
 * @file MapPage.tsx
 * @description Mapa Interactivo de Geolocalización de Usulután (Campus Universitario y Ciudad)
 *              con pines dinámicos por estado (perdido, encontrado, recuperado), geolocalización GPS
 *              en tiempo real, cálculo de distancia y filtros interactivos.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Search,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Layers,
  Eye,
  Sparkles,
  Building2,
  Crosshair,
  ExternalLink,
  School,
} from 'lucide-react';
import { Objeto, Categoria, Ubicacion } from '../types';
import { api } from '../services/api';

interface MapPageProps {
  onVerDetalle: (objeto: Objeto) => void;
  onReclamar: (objeto: Objeto) => void;
  onAbrirReporte: (tipo: 'perdido' | 'encontrado') => void;
}

// Coordenadas por defecto de respaldo para ubicaciones en Usulután, El Salvador
export const USULUTAN_COORDS_FALLBACK: Record<number, { lat: number; lng: number }> = {
  1: { lat: 13.3468, lng: -88.4205 }, // Biblioteca Central - Campus Usulután
  2: { lat: 13.3462, lng: -88.4212 }, // Cafetería Principal - Campus Usulután
  3: { lat: 13.3473, lng: -88.4198 }, // Lab Cómputo 102 - Facultad Ingeniería Usulután
  4: { lat: 13.3456, lng: -88.4220 }, // Complejo Polideportivo Usulután
  5: { lat: 13.3470, lng: -88.4215 }, // Auditorio Mayor y Rectoría Usulután
  6: { lat: 13.3446, lng: -88.4368 }, // Plaza Central / Centro de Usulután
  7: { lat: 13.3465, lng: -88.4195 }, // Edificio Aulas A3 - Campus Usulután
};

export const CENTRO_CAMPUS_USULUTAN: [number, number] = [13.3466, -88.4208];
export const CENTRO_CIUDAD_USULUTAN: [number, number] = [13.3444, -88.4385];
export const VISTA_GENERAL_USULUTAN: [number, number] = [13.3458, -88.4285];

// Fórmula de Haversine para calcular distancia en kilómetros entre dos coordenadas GPS
function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function obtenerCoordenadasObjeto(obj: Objeto): { lat: number; lng: number } {
  if (obj.latitud && obj.longitud && !isNaN(Number(obj.latitud)) && !isNaN(Number(obj.longitud))) {
    return { lat: Number(obj.latitud), lng: Number(obj.longitud) };
  }
  if (
    obj.ubicacion?.latitud &&
    obj.ubicacion?.longitud &&
    !isNaN(Number(obj.ubicacion.latitud)) &&
    !isNaN(Number(obj.ubicacion.longitud))
  ) {
    const offsetLat = ((obj.id % 5) - 2) * 0.0001;
    const offsetLng = ((obj.id % 3) - 1) * 0.0001;
    return {
      lat: Number(obj.ubicacion.latitud) + offsetLat,
      lng: Number(obj.ubicacion.longitud) + offsetLng,
    };
  }
  const base = USULUTAN_COORDS_FALLBACK[obj.ubicacion_id] || USULUTAN_COORDS_FALLBACK[1];
  const offsetLat = ((obj.id % 5) - 2) * 0.0001;
  const offsetLng = ((obj.id % 3) - 1) * 0.0001;
  return { lat: base.lat + offsetLat, lng: base.lng + offsetLng };
}

export const MapPage: React.FC<MapPageProps> = ({
  onVerDetalle,
  onReclamar,
  onAbrirReporte,
}) => {
  const [objetos, setObjetos] = useState<Objeto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros interactivos
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('todas');
  const [filtroTexto, setFiltroTexto] = useState<string>('');

  // Controles de mapa y GPS
  const [modoMapa, setModoMapa] = useState<'calles' | 'satelite'>('calles');
  const [mostrarEdificios, setMostrarEdificios] = useState<boolean>(true);
  const [objetoSeleccionadoId, setObjetoSeleccionadoId] = useState<number | null>(null);
  const [miUbicacionGPS, setMiUbicacionGPS] = useState<{ lat: number; lng: number; precision?: number } | null>(null);
  const [buscandoGPS, setBuscandoGPS] = useState(false);
  const [mensajeGPS, setMensajeGPS] = useState<string | null>(null);

  // Referencias de Leaflet
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const buildingsLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Record<number, L.Marker>>({});

  // Cargar datos iniciales
  useEffect(() => {
    async function cargarTodo() {
      setCargando(true);
      try {
        const [resObj, resCat, resUbi] = await Promise.all([
          api.objetos.listar(100),
          api.categorias.listar(),
          api.ubicaciones.listar(),
        ]);
        if (resObj.success) setObjetos(resObj.objetos);
        if (resCat.success) setCategorias(resCat.categorias);
        if (resUbi.success) setUbicaciones(resUbi.ubicaciones);
      } catch (err) {
        console.error('Error al cargar datos del mapa de Usulután:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarTodo();
  }, []);

  // Objetos filtrados
  const objetosFiltrados = useMemo(() => {
    return objetos.filter((obj) => {
      if (filtroEstado !== 'todos' && String(obj.estado_id) !== filtroEstado) return false;
      if (filtroCategoria !== 'todas' && String(obj.categoria_id) !== filtroCategoria) return false;
      if (filtroUbicacion !== 'todas' && String(obj.ubicacion_id) !== filtroUbicacion) return false;
      if (filtroTexto.trim().length > 0) {
        const q = filtroTexto.toLowerCase();
        const matchTitulo = obj.titulo.toLowerCase().includes(q);
        const matchDesc = obj.descripcion.toLowerCase().includes(q);
        const matchUbi = obj.ubicacion?.nombre?.toLowerCase().includes(q) || obj.ubicacion?.edificio?.toLowerCase().includes(q);
        if (!matchTitulo && !matchDesc && !matchUbi) return false;
      }
      return true;
    });
  }, [objetos, filtroEstado, filtroCategoria, filtroUbicacion, filtroTexto]);

  // Inicializar el mapa Leaflet centrado en Usulután
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: VISTA_GENERAL_USULUTAN,
      zoom: 15,
      zoomControl: true,
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | Campus Find Usulután',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = streetLayer;
    buildingsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    userMarkerLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Cambiar entre mapa de calles y vista satelital
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;

    map.removeLayer(tileLayerRef.current);

    if (modoMapa === 'satelite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri | Campus Universitario Usulután',
          maxZoom: 19,
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Campus Find Usulután',
        maxZoom: 19,
      }).addTo(map);
    }
  }, [modoMapa]);

  // Renderizar marcadores de Edificios/Zonas de Usulután
  useEffect(() => {
    const buildingsLayer = buildingsLayerRef.current;
    if (!buildingsLayer) return;

    buildingsLayer.clearLayers();
    if (!mostrarEdificios) return;

    ubicaciones.forEach((ubi) => {
      const lat = ubi.latitud ?? USULUTAN_COORDS_FALLBACK[ubi.id]?.lat ?? 13.3468;
      const lng = ubi.longitud ?? USULUTAN_COORDS_FALLBACK[ubi.id]?.lng ?? -88.4205;

      const buildingIcon = L.divIcon({
        className: 'custom-building-pin',
        html: `
          <div style="
            display:flex;
            align-items:center;
            gap:4px;
            background:rgba(15, 23, 42, 0.88);
            color:#f8fafc;
            padding:3px 8px;
            border-radius:9999px;
            font-size:10px;
            font-weight:700;
            white-space:nowrap;
            border:1.5px solid #38bdf8;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
            transform:translate(-50%, -100%);
          ">
            <span>🏫</span>
            <span>${ubi.edificio}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon: buildingIcon, zIndexOffset: -100 });
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:190px;padding:2px;">
          <div style="font-size:10px;font-weight:800;color:#0284c7;text-transform:uppercase;letter-spacing:0.05em;">
            📍 Punto Oficial Usulután
          </div>
          <div style="font-size:13px;font-weight:800;color:#0f172a;margin-top:2px;">
            ${ubi.nombre}
          </div>
          <div style="font-size:11px;color:#475569;margin-top:2px;">
            <strong>Edificio:</strong> ${ubi.edificio}
          </div>
          ${ubi.descripcion ? `<div style="font-size:11px;color:#64748b;margin-top:4px;font-style:italic;">${ubi.descripcion}</div>` : ''}
          <div style="font-size:10px;color:#94a3b8;margin-top:6px;font-family:monospace;">
            GPS: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}
          </div>
        </div>
      `);
      marker.addTo(buildingsLayer);
    });
  }, [ubicaciones, mostrarEdificios]);

  // Renderizar pines de Objetos Perdidos / Encontrados / Recuperados
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();
    markerMapRef.current = {};

    objetosFiltrados.forEach((obj) => {
      const { lat, lng } = obtenerCoordenadasObjeto(obj);
      const estadoNombre = obj.estado?.nombre || (obj.estado_id === 1 ? 'perdido' : obj.estado_id === 2 ? 'encontrado' : 'recuperado');

      // Colores según estado
      let bgPin = '#e11d48'; // Rojo perdido
      let borderPin = '#ffe4e6';
      let badgeBg = '#fff1f2';
      let badgeText = '#be123c';
      let emoji = '🔎';
      let labelEstado = 'PERDIDO';

      if (estadoNombre === 'encontrado') {
        bgPin = '#059669'; // Verde encontrado
        borderPin = '#d1fae5';
        badgeBg = '#ecfdf5';
        badgeText = '#047857';
        emoji = '📦';
        labelEstado = 'ENCONTRADO';
      } else if (estadoNombre === 'recuperado') {
        bgPin = '#2563eb'; // Azul recuperado
        borderPin = '#dbeafe';
        badgeBg = '#eff6ff';
        badgeText = '#1d4ed8';
        emoji = '✅';
        labelEstado = 'RECUPERADO';
      }

      const isSelected = objetoSeleccionadoId === obj.id;

      const pinIcon = L.divIcon({
        className: 'custom-object-pin',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -100%);cursor:pointer;">
            ${
              estadoNombre === 'perdido'
                ? `<div style="position:absolute;top:-4px;width:42px;height:42px;border-radius:9999px;background:${bgPin};opacity:0.25;animation:ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="
              width:${isSelected ? '42px' : '36px'};
              height:${isSelected ? '42px' : '36px'};
              border-radius:9999px;
              background:${bgPin};
              border:3px solid ${isSelected ? '#facc15' : borderPin};
              box-shadow:0 6px 14px rgba(0,0,0,0.32);
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:${isSelected ? '18px' : '15px'};
              transition:all 0.2s ease;
            ">
              ${emoji}
            </div>
            <div style="
              width:0;
              height:0;
              border-left:6px solid transparent;
              border-right:6px solid transparent;
              border-top:8px solid ${bgPin};
              margin-top:-1px;
            "></div>
          </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -42],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon, zIndexOffset: isSelected ? 1000 : 500 });

      // Crear nodo DOM para el popup con botones interactivos reales de React
      const popupContainer = document.createElement('div');
      popupContainer.style.minWidth = '235px';
      popupContainer.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
      popupContainer.innerHTML = `
        <div style="padding:2px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;">
            <span style="background:${badgeBg};color:${badgeText};font-size:10px;font-weight:800;padding:2px 8px;border-radius:9999px;border:1px solid ${borderPin};">
              ${labelEstado}
            </span>
            <span style="font-size:10px;font-weight:600;color:#64748b;">
              ${obj.categoria?.nombre || 'Objeto'}
            </span>
          </div>
          <div style="font-size:14px;font-weight:800;color:#0f172a;line-height:1.25;margin-bottom:4px;">
            ${obj.titulo}
          </div>
          <div style="font-size:11px;color:#475569;line-height:1.35;margin-bottom:8px;">
            ${obj.descripcion.length > 90 ? obj.descripcion.substring(0, 90) + '...' : obj.descripcion}
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 8px;font-size:11px;color:#334155;margin-bottom:8px;">
            <div><strong>📍 Lugar:</strong> ${obj.ubicacion?.nombre || 'Campus Usulután'}</div>
            <div><strong>🏢 Zona:</strong> ${obj.ubicacion?.edificio || 'Usulután'}</div>
            <div style="font-size:10px;color:#64748b;font-family:monospace;margin-top:2px;">
              GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <button id="popup-ver-${obj.id}" style="flex:1;background:#0f172a;color:#fff;border:none;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;">
              Ver Detalle
            </button>
            ${
              estadoNombre !== 'recuperado'
                ? `<button id="popup-reclamar-${obj.id}" style="flex:1;background:#1d4ed8;color:#fff;border:none;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;">
                    Reclamar
                  </button>`
                : ''
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupContainer);

      marker.on('popupopen', () => {
        setObjetoSeleccionadoId(obj.id);
        const btnVer = document.getElementById(`popup-ver-${obj.id}`);
        if (btnVer) {
          btnVer.onclick = () => onVerDetalle(obj);
        }
        const btnRec = document.getElementById(`popup-reclamar-${obj.id}`);
        if (btnRec) {
          btnRec.onclick = () => onReclamar(obj);
        }
      });

      marker.addTo(markersLayer);
      markerMapRef.current[obj.id] = marker;
    });
  }, [objetosFiltrados, objetoSeleccionadoId, onVerDetalle, onReclamar]);

  // Activar Geolocalización GPS real del navegador o simular en Usulután
  const activarGeolocalizacionGPS = () => {
    setBuscandoGPS(true);
    setMensajeGPS(null);

    if (!navigator.geolocation) {
      setBuscandoGPS(false);
      setMensajeGPS('Tu navegador no soporta Geolocalización HTML5.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuscandoGPS(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const precision = pos.coords.accuracy;

        setMiUbicacionGPS({ lat, lng, precision });

        const distAlCampus = calcularDistanciaKm(lat, lng, CENTRO_CAMPUS_USULUTAN[0], CENTRO_CAMPUS_USULUTAN[1]);

        if (userMarkerLayerRef.current && mapInstanceRef.current) {
          userMarkerLayerRef.current.clearLayers();

          const gpsIcon = L.divIcon({
            className: 'gps-user-pin',
            html: `
              <div style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;transform:translate(-50%,-50%);">
                <div style="position:absolute;width:36px;height:36px;border-radius:9999px;background:#0ea5e9;opacity:0.3;animation:ping 1.5s infinite;"></div>
                <div style="width:16px;height:16px;border-radius:9999px;background:#0284c7;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
              </div>
            `,
            iconSize: [24, 24],
          });

          L.circle([lat, lng], {
            radius: Math.min(precision || 40, 250),
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.15,
            weight: 1.5,
          }).addTo(userMarkerLayerRef.current);

          L.marker([lat, lng], { icon: gpsIcon })
            .bindPopup(
              `<strong>📍 Tu ubicación GPS actual</strong><br/><span style="font-size:11px;">Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</span>`
            )
            .addTo(userMarkerLayerRef.current)
            .openPopup();

          // Si el usuario está a menos de 15 km de Usulután, volar a su ubicación GPS; si está en otra ciudad, avisar y mostrar su pin
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
          if (distAlCampus > 15) {
            setMensajeGPS(
              `Ubicación GPS detectada (${lat.toFixed(4)}, ${lng.toFixed(4)}) a ${distAlCampus.toFixed(1)} km del Campus Usulután. Puedes usar el botón "Ir a Campus Usulután" para volver a los objetos.`
            );
          } else {
            setMensajeGPS(`¡GPS activo en Usulután! Precisión aproximada: ±${Math.round(precision)}m.`);
          }
        }
      },
      () => {
        setBuscandoGPS(false);
        // Si el usuario deniega permisos o está en PC sin GPS, posicionar en el punto de control del Campus Usulután
        const latSim = 13.3466;
        const lngSim = -88.4208;
        setMiUbicacionGPS({ lat: latSim, lng: lngSim, precision: 25 });
        setMensajeGPS(
          'Geolocalización establecida en el Punto Central del Campus Universitario Usulután (13.3466, -88.4208).'
        );

        if (userMarkerLayerRef.current && mapInstanceRef.current) {
          userMarkerLayerRef.current.clearLayers();
          L.circle([latSim, lngSim], {
            radius: 45,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.2,
            weight: 1.5,
          }).addTo(userMarkerLayerRef.current);

          L.marker([latSim, lngSim])
            .bindPopup('<strong>📍 Posición de referencia en Campus Usulután</strong>')
            .addTo(userMarkerLayerRef.current)
            .openPopup();

          mapInstanceRef.current.flyTo([latSim, lngSim], 17, { duration: 1.1 });
        }
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Volar hacia un objeto específico en el mapa
  const enfocarObjetoEnMapa = (obj: Objeto) => {
    setObjetoSeleccionadoId(obj.id);
    const { lat, lng } = obtenerCoordenadasObjeto(obj);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 18, { duration: 0.9 });
      const marker = markerMapRef.current[obj.id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 400);
      }
    }
  };

  // Volar a una zona de Usulután
  const volarAZona = (coords: [number, number], zoom: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, zoom, { duration: 1.0 });
    }
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroCategoria('todas');
    setFiltroUbicacion('todas');
    setFiltroTexto('');
    volarAZona(VISTA_GENERAL_USULUTAN, 15);
  };

  const totalPerdidos = objetosFiltrados.filter((o) => o.estado_id === 1).length;
  const totalEncontrados = objetosFiltrados.filter((o) => o.estado_id === 2).length;
  const totalRecuperados = objetosFiltrados.filter((o) => o.estado_id === 3).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Encabezado de Geolocalización de Usulután */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <Navigation className="w-3.5 h-3.5" />
              <span>Geolocalización GPS en Tiempo Real • Usulután, El Salvador</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Mapa Interactivo de Objetos en Usulután
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Explora visualmente dónde se perdieron o encontraron pertenencias dentro del Campus Universitario de Usulután y zonas aledañas de la ciudad.
            </p>
          </div>

          {/* Botones de Geolocalización y Navegación Rápida */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-activar-gps"
              type="button"
              onClick={activarGeolocalizacionGPS}
              disabled={buscandoGPS}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
            >
              <Crosshair className={`w-4 h-4 ${buscandoGPS ? 'animate-spin' : ''}`} />
              <span>{buscandoGPS ? 'Localizando GPS...' : 'Mi Ubicación GPS Actual'}</span>
            </button>

            <button
              type="button"
              onClick={() => volarAZona(CENTRO_CAMPUS_USULUTAN, 17)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-colors cursor-pointer"
            >
              <School className="w-4 h-4 text-blue-300" />
              <span>Campus Usulután</span>
            </button>

            <button
              type="button"
              onClick={() => volarAZona(CENTRO_CIUDAD_USULUTAN, 16)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-300" />
              <span>Centro de Usulután</span>
            </button>

            <button
              type="button"
              onClick={() => volarAZona(VISTA_GENERAL_USULUTAN, 15)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-amber-300" />
              <span>Vista General</span>
            </button>
          </div>
        </div>

        {/* Notificación de estado GPS */}
        {mensajeGPS && (
          <div className="mt-4 p-3 rounded-xl bg-sky-950/80 border border-sky-400/30 text-sky-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{mensajeGPS}</span>
            </div>
            <button
              type="button"
              onClick={() => volarAZona(CENTRO_CAMPUS_USULUTAN, 17)}
              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 font-bold shrink-0"
            >
              Centrar en Campus
            </button>
          </div>
        )}
      </div>

      {/* Barra de Filtros y Capas del Mapa */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Búsqueda por texto */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar en el mapa de Usulután (ej. calculadora, mochila, biblioteca...)"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:border-blue-700 text-xs sm:text-sm outline-none"
            />
          </div>

          {/* Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="text-xs sm:text-sm p-2 rounded-xl border border-slate-300 bg-white outline-none"
          >
            <option value="todos">Todos los Estados ({objetos.length})</option>
            <option value="1">🔴 Solo Perdidos</option>
            <option value="2">🟢 Solo Encontrados</option>
            <option value="3">🔵 Solo Recuperados</option>
          </select>

          {/* Categoría */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="text-xs sm:text-sm p-2 rounded-xl border border-slate-300 bg-white outline-none"
          >
            <option value="todas">Todas las Categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre}
              </option>
            ))}
          </select>

          {/* Ubicación en Usulután */}
          <select
            value={filtroUbicacion}
            onChange={(e) => {
              const val = e.target.value;
              setFiltroUbicacion(val);
              if (val !== 'todas') {
                const ubi = ubicaciones.find((u) => String(u.id) === val);
                if (ubi) {
                  const lat = ubi.latitud ?? USULUTAN_COORDS_FALLBACK[ubi.id]?.lat ?? 13.3468;
                  const lng = ubi.longitud ?? USULUTAN_COORDS_FALLBACK[ubi.id]?.lng ?? -88.4205;
                  volarAZona([lat, lng], 18);
                }
              }
            }}
            className="text-xs sm:text-sm p-2 rounded-xl border border-slate-300 bg-white outline-none"
          >
            <option value="todas">Todas las Zonas de Usulután</option>
            {ubicaciones.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.edificio} - {u.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Leyenda de Pines y Controles de Vista */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
              Perdidos: {totalPerdidos}
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Encontrados: {totalEncontrados}
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Recuperados: {totalRecuperados}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarEdificios(!mostrarEdificios)}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
                mostrarEdificios
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              🏫 {mostrarEdificios ? 'Ocultar Edificios' : 'Mostrar Edificios'}
            </button>

            <button
              type="button"
              onClick={() => setModoMapa(modoMapa === 'calles' ? 'satelite' : 'calles')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>{modoMapa === 'calles' ? 'Vista Satelital' : 'Mapa de Calles'}</span>
            </button>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor Principal: Mapa Interactivo + Lista Geolocalizada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa Leaflet (2 columnas en escritorio) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div
            ref={mapContainerRef}
            className="w-full h-[480px] sm:h-[580px] z-10"
            style={{ minHeight: '480px' }}
          />
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              💡 <strong>Tip:</strong> Haz clic en cualquier pin sobre el mapa de Usulután para ver la ficha del objeto o iniciar su reclamación.
            </span>
            <span className="font-mono text-slate-600">
              Usulután, El Salvador (13.3466° N, 88.4208° O)
            </span>
          </div>
        </div>

        {/* Panel Lateral de Objetos Geolocalizados */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[530px] sm:h-[625px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                Objetos en el Mapa ({objetosFiltrados.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Selecciona un objeto para volar a su coordenada GPS
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAbrirReporte('perdido')}
              className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              + Reportar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {cargando ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Cargando coordenadas de Usulután...
              </div>
            ) : objetosFiltrados.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  No hay objetos en esta zona con los filtros actuales
                </p>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  Mostrar todos los objetos en Usulután
                </button>
              </div>
            ) : (
              objetosFiltrados.map((obj) => {
                const { lat, lng } = obtenerCoordenadasObjeto(obj);
                const activo = objetoSeleccionadoId === obj.id;
                const distanciaKm = miUbicacionGPS
                  ? calcularDistanciaKm(miUbicacionGPS.lat, miUbicacionGPS.lng, lat, lng)
                  : null;

                return (
                  <div
                    key={obj.id}
                    onClick={() => enfocarObjetoEnMapa(obj)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      activo
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          obj.estado_id === 1
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : obj.estado_id === 2
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {obj.estado?.nombre || (obj.estado_id === 1 ? 'perdido' : obj.estado_id === 2 ? 'encontrado' : 'recuperado')}
                      </span>

                      <span className="text-[10px] font-mono text-slate-400">
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                      {obj.titulo}
                    </h3>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">
                        {obj.ubicacion?.edificio} — {obj.ubicacion?.nombre}
                      </span>
                    </div>

                    {distanciaKm !== null && (
                      <div className="mt-1 text-[11px] font-semibold text-sky-700">
                        📏 A {distanciaKm < 1 ? `${Math.round(distanciaKm * 1000)} metros` : `${distanciaKm.toFixed(2)} km`} de tu ubicación GPS
                      </div>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerDetalle(obj);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-blue-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ficha completa</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                          title="Abrir en Google Maps"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Cómo llegar</span>
                        </a>

                        {obj.estado_id !== 3 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReclamar(obj);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Reclamar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
