/**
 * @file mapa.js
 * @description Controlador en JavaScript puro para el Mapa Interactivo de Geolocalización de Usulután (pages/mapa/index.html).
 */

(function () {
  'use strict';

  let objetos = [];
  let ubicaciones = [];
  let miUbicacionGPS = null;
  let modoSatelite = false;
  let mostrarEdificios = true;
  let seleccionadoId = null;

  let map = null;
  let tileLayer = null;
  let buildingsLayer = null;
  let markersLayer = null;
  let gpsLayer = null;
  let markerById = {};

  function obtenerFiltrados() {
    const q = (document.getElementById('map-input-texto').value || '').trim().toLowerCase();
    const est = document.getElementById('map-select-estado').value;
    const cat = document.getElementById('map-select-categoria').value;
    const ubi = document.getElementById('map-select-ubicacion').value;

    return objetos.filter((o) => {
      if (est !== 'todos' && String(o.estado_id) !== est) return false;
      if (cat !== 'todas' && String(o.categoria_id) !== cat) return false;
      if (ubi !== 'todas' && String(o.ubicacion_id) !== ubi) return false;
      if (q) {
        const mTit = o.titulo.toLowerCase().includes(q);
        const mDesc = o.descripcion.toLowerCase().includes(q);
        const mUbi =
          (o.ubicacion?.nombre || '').toLowerCase().includes(q) ||
          (o.ubicacion?.edificio || '').toLowerCase().includes(q);
        if (!mTit && !mDesc && !mUbi) return false;
      }
      return true;
    });
  }

  function renderizarPinesYLista() {
    if (!map) return;

    const filtrados = obtenerFiltrados();
    const cPerd = filtrados.filter((o) => o.estado_id === 1).length;
    const cEnc = filtrados.filter((o) => o.estado_id === 2).length;
    const cRec = filtrados.filter((o) => o.estado_id === 3).length;

    document.getElementById('badge-count-perdidos').textContent = `🔴 Perdidos: ${cPerd}`;
    document.getElementById('badge-count-encontrados').textContent = `🟢 Encontrados: ${cEnc}`;
    document.getElementById('badge-count-recuperados').textContent = `🔵 Recuperados: ${cRec}`;
    document.getElementById('map-sidebar-count').textContent = `Objetos en el Mapa (${filtrados.length})`;

    // 1. Edificios de Usulután
    buildingsLayer.clearLayers();
    if (mostrarEdificios) {
      ubicaciones.forEach((u) => {
        const lat = u.latitud ?? window.CampusFindGeo.USULUTAN_COORDS_FALLBACK[u.id]?.lat ?? 13.3468;
        const lng = u.longitud ?? window.CampusFindGeo.USULUTAN_COORDS_FALLBACK[u.id]?.lng ?? -88.4205;

        const icon = window.L.divIcon({
          className: 'custom-building-pin',
          html: `
            <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(15,23,42,0.9);color:#f8fafc;padding:3px 8px;border-radius:9999px;font-size:10px;font-weight:700;white-space:nowrap;border:1.5px solid #38bdf8;box-shadow:0 2px 6px rgba(0,0,0,0.25);transform:translate(-50%,-100%);">
              <span>🏫</span><span>${u.edificio}</span>
            </div>
          `,
          iconSize: [0, 0],
        });

        window.L.marker([lat, lng], { icon, zIndexOffset: -100 })
          .bindPopup(
            `<strong>🏫 ${u.nombre}</strong><br/><span style="font-size:11px;color:#475569">${u.edificio}</span><br/><small style="font-family:monospace">GPS: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}</small>`
          )
          .addTo(buildingsLayer);
      });
    }

    // 2. Pines de Objetos
    markersLayer.clearLayers();
    markerById = {};

    const sidebar = document.getElementById('map-sidebar-items');
    sidebar.innerHTML = '';

    if (filtrados.length === 0) {
      sidebar.innerHTML = `
        <div class="p-8 text-center text-xs text-slate-500">
          No se hallaron objetos en esta zona de Usulután con los filtros seleccionados.
        </div>
      `;
      return;
    }

    filtrados.forEach((obj) => {
      const { lat, lng } = window.CampusFindGeo.obtenerCoordenadasObjeto(obj);
      let bgPin = '#e11d48';
      let emoji = '🔎';
      let labelEstado = 'PERDIDO';

      if (obj.estado_id === 2) {
        bgPin = '#059669';
        emoji = '📦';
        labelEstado = 'ENCONTRADO';
      } else if (obj.estado_id === 3) {
        bgPin = '#2563eb';
        emoji = '✅';
        labelEstado = 'RECUPERADO';
      }

      const pinIcon = window.L.divIcon({
        className: 'custom-object-pin',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);cursor:pointer;">
            <div style="width:36px;height:36px;border-radius:9999px;background:${bgPin};border:3px solid #ffffff;box-shadow:0 6px 14px rgba(0,0,0,0.32);display:flex;align-items:center;justify-content:center;font-size:15px;">
              ${emoji}
            </div>
            <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${bgPin};margin-top:-1px;"></div>
          </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -42],
      });

      const marker = window.L.marker([lat, lng], { icon: pinIcon });

      const popupDiv = document.createElement('div');
      popupDiv.style.minWidth = '225px';
      popupDiv.innerHTML = `
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:10px;font-weight:800;color:${bgPin}">${labelEstado}</span>
            <span style="font-size:10px;color:#64748b">${obj.categoria?.nombre || ''}</span>
          </div>
          <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:4px">${obj.titulo}</div>
          <div style="font-size:11px;color:#475569;margin-bottom:6px">📍 ${obj.ubicacion?.edificio || 'Usulután'} — ${obj.ubicacion?.nombre || ''}</div>
          <div style="font-size:10px;font-family:monospace;color:#64748b;margin-bottom:8px">GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn-pop-detalle" style="flex:1;background:#0f172a;color:#fff;border:none;border-radius:8px;padding:6px 8px;font-size:11px;font-weight:700;cursor:pointer">Ver Detalle</button>
            ${
              obj.estado_id !== 3
                ? `<button type="button" class="btn-pop-reclamar" style="flex:1;background:#1d4ed8;color:#fff;border:none;border-radius:8px;padding:6px 8px;font-size:11px;font-weight:700;cursor:pointer">Creo que es mío</button>`
                : ''
            }
          </div>
        </div>
      `;

      popupDiv.querySelector('.btn-pop-detalle').addEventListener('click', () => {
        window.CampusFindLayout.abrirModalDetalle(obj);
      });
      const bRec = popupDiv.querySelector('.btn-pop-reclamar');
      if (bRec) {
        bRec.addEventListener('click', () => {
          window.CampusFindLayout.abrirModalReclamo(obj);
        });
      }

      marker.bindPopup(popupDiv);
      marker.addTo(markersLayer);
      markerById[obj.id] = marker;

      // Elemento en lista lateral
      const distKm = miUbicacionGPS
        ? window.CampusFindGeo.calcularDistanciaKm(miUbicacionGPS.lat, miUbicacionGPS.lng, lat, lng)
        : null;

      const card = document.createElement('div');
      card.className = `p-3.5 rounded-2xl border transition-all cursor-pointer ${
        seleccionadoId === obj.id
          ? 'border-blue-600 bg-blue-50/60 shadow-xs'
          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
      }`;
      card.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-1">
          <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
            obj.estado_id === 1
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : obj.estado_id === 2
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }">${labelEstado}</span>
          <span class="text-[10px] font-mono text-slate-400">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
        </div>
        <h3 class="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">${obj.titulo}</h3>
        <p class="mt-1 text-[11px] text-slate-600 truncate">📍 ${obj.ubicacion?.edificio} — ${obj.ubicacion?.nombre}</p>
        ${
          distKm !== null
            ? `<div class="mt-1 text-[11px] font-semibold text-blue-700">📏 A ${
                distKm < 1 ? Math.round(distKm * 1000) + ' metros' : distKm.toFixed(2) + ' km'
              } de tu ubicación GPS</div>`
            : ''
        }
        <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <button type="button" class="btn-item-ver text-[11px] font-bold text-slate-700 hover:text-blue-700 cursor-pointer">Ver detalles</button>
          ${
            obj.estado_id !== 3
              ? `<button type="button" class="btn-item-rec px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold cursor-pointer">Creo que es mío</button>`
              : ''
          }
        </div>
      `;

      card.addEventListener('click', () => {
        seleccionadoId = obj.id;
        map.flyTo([lat, lng], 18, { duration: 0.9 });
        setTimeout(() => marker.openPopup(), 350);
      });

      card.querySelector('.btn-item-ver').addEventListener('click', (e) => {
        e.stopPropagation();
        window.CampusFindLayout.abrirModalDetalle(obj);
      });
      const btnItemRec = card.querySelector('.btn-item-rec');
      if (btnItemRec) {
        btnItemRec.addEventListener('click', (e) => {
          e.stopPropagation();
          window.CampusFindLayout.abrirModalReclamo(obj);
        });
      }

      sidebar.appendChild(card);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    window.CampusFindLayout.renderNavbar('mapa');
    window.CampusFindLayout.renderFooter();

    // Inicializar mapa Leaflet en Usulután
    const mapContainer = document.getElementById('usulutan-main-map');
    map = window.L.map(mapContainer, {
      center: window.CampusFindGeo.VISTA_GENERAL_USULUTAN,
      zoom: 15,
    });

    tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | Campus Find Usulután',
      maxZoom: 19,
    }).addTo(map);

    buildingsLayer = window.L.layerGroup().addTo(map);
    markersLayer = window.L.layerGroup().addTo(map);
    gpsLayer = window.L.layerGroup().addTo(map);

    try {
      const [resObj, resCat, resUbi] = await Promise.all([
        window.CampusFindAPI.objetos.listar(100),
        window.CampusFindAPI.categorias.listar(),
        window.CampusFindAPI.ubicaciones.listar(),
      ]);

      objetos = resObj.objetos || [];
      ubicaciones = resUbi.ubicaciones || [];

      const selCat = document.getElementById('map-select-categoria');
      (resCat.categorias || []).forEach((c) => {
        const opt = document.createElement('option');
        opt.value = String(c.id);
        opt.textContent = c.nombre;
        selCat.appendChild(opt);
      });

      const selUbi = document.getElementById('map-select-ubicacion');
      ubicaciones.forEach((u) => {
        const opt = document.createElement('option');
        opt.value = String(u.id);
        opt.textContent = `${u.edificio} - ${u.nombre}`;
        selUbi.appendChild(opt);
      });

      renderizarPinesYLista();
    } catch (err) {
      console.error('Error cargando mapa:', err);
    }

    // Eventos de filtros
    ['map-input-texto', 'map-select-estado', 'map-select-categoria', 'map-select-ubicacion'].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener('input', () => {
        if (id === 'map-select-ubicacion' && el.value !== 'todas') {
          const u = ubicaciones.find((x) => String(x.id) === el.value);
          if (u) {
            const lat = u.latitud ?? window.CampusFindGeo.USULUTAN_COORDS_FALLBACK[u.id]?.lat ?? 13.3468;
            const lng = u.longitud ?? window.CampusFindGeo.USULUTAN_COORDS_FALLBACK[u.id]?.lng ?? -88.4205;
            map.flyTo([lat, lng], 18, { duration: 0.9 });
          }
        }
        renderizarPinesYLista();
      });
    });

    // Botones de navegación rápida en Usulután
    document.getElementById('btn-fly-campus').addEventListener('click', () => {
      map.flyTo(window.CampusFindGeo.CENTRO_CAMPUS_USULUTAN, 17, { duration: 1.0 });
    });
    document.getElementById('btn-fly-centro').addEventListener('click', () => {
      map.flyTo(window.CampusFindGeo.CENTRO_CIUDAD_USULUTAN, 16, { duration: 1.0 });
    });
    document.getElementById('btn-fly-general').addEventListener('click', () => {
      map.flyTo(window.CampusFindGeo.VISTA_GENERAL_USULUTAN, 15, { duration: 1.0 });
    });

    document.getElementById('btn-toggle-edificios').addEventListener('click', () => {
      mostrarEdificios = !mostrarEdificios;
      renderizarPinesYLista();
    });

    document.getElementById('btn-toggle-satelite').addEventListener('click', () => {
      map.removeLayer(tileLayer);
      modoSatelite = !modoSatelite;
      if (modoSatelite) {
        tileLayer = window.L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { attribution: 'Tiles &copy; Esri | Campus Usulután', maxZoom: 19 }
        ).addTo(map);
      } else {
        tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap | Campus Usulután',
          maxZoom: 19,
        }).addTo(map);
      }
    });

    document.getElementById('btn-reset-mapa').addEventListener('click', () => {
      document.getElementById('map-input-texto').value = '';
      document.getElementById('map-select-estado').value = 'todos';
      document.getElementById('map-select-categoria').value = 'todas';
      document.getElementById('map-select-ubicacion').value = 'todas';
      map.flyTo(window.CampusFindGeo.VISTA_GENERAL_USULUTAN, 15, { duration: 0.9 });
      renderizarPinesYLista();
    });

    // Botón de Geolocalización GPS real
    document.getElementById('btn-activar-gps').addEventListener('click', () => {
      const banner = document.getElementById('gps-status-banner');
      banner.style.display = 'flex';
      banner.textContent = '🛰️ Localizando tu posición GPS actual...';

      const posicionarEnMapa = (lat, lng, textoBanner) => {
        miUbicacionGPS = { lat, lng };
        gpsLayer.clearLayers();
        window.L.circle([lat, lng], {
          radius: 45,
          color: '#0284c7',
          fillColor: '#38bdf8',
          fillOpacity: 0.22,
        }).addTo(gpsLayer);

        window.L.marker([lat, lng])
          .addTo(gpsLayer)
          .bindPopup(`<strong>📍 Tu Ubicación GPS</strong><br/>${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          .openPopup();

        map.flyTo([lat, lng], 17, { duration: 1.0 });
        banner.textContent = textoBanner;
        renderizarPinesYLista();
      };

      if (!navigator.geolocation) {
        posicionarEnMapa(
          13.3466,
          -88.4208,
          '📍 Geolocalización establecida en el Campus Universitario de Usulután (13.3466, -88.4208).'
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          posicionarEnMapa(
            pos.coords.latitude,
            pos.coords.longitude,
            `✅ GPS Activo (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}) — Distancias actualizadas en la lista.`
          );
        },
        () => {
          posicionarEnMapa(
            13.3466,
            -88.4208,
            '📍 Geolocalización establecida en el Punto Central del Campus Universitario Usulután (13.3466, -88.4208).'
          );
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  });
})();
