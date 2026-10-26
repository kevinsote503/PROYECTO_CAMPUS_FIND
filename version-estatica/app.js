/**
 * @file app.js
 * @description Lógica completa en JavaScript puro (Vanilla JS ES6+) para Campus Find Usulután.
 *              Conecta con el backend Node.js + SQLite (/api) e incluye geolocalización interactiva
 *              con Leaflet centrada en el Campus Universitario de Usulután, El Salvador.
 */

(function () {
  'use strict';

  // Detectar URL base de la API (funciona tanto en http://localhost:3000 como abriendo index.html en Live Server)
  const API_BASE =
    window.location.port === '3000'
      ? '/api'
      : 'http://localhost:3000/api';

  // Coordenadas oficiales de referencia en Usulután, El Salvador
  const CENTRO_CAMPUS_USULUTAN = [13.3466, -88.4208];
  const CENTRO_CIUDAD_USULUTAN = [13.3444, -88.4385];
  const VISTA_GENERAL_USULUTAN = [13.3458, -88.4285];

  const COORDS_FALLBACK_USULUTAN = {
    1: { lat: 13.3468, lng: -88.4205 }, // Biblioteca Central - Campus Usulután
    2: { lat: 13.3462, lng: -88.4212 }, // Cafetería Principal - Campus Usulután
    3: { lat: 13.3473, lng: -88.4198 }, // Lab Cómputo 102 - Facultad Ingeniería Usulután
    4: { lat: 13.3456, lng: -88.4220 }, // Complejo Polideportivo Usulután
    5: { lat: 13.3470, lng: -88.4215 }, // Auditorio Mayor y Rectoría Usulután
    6: { lat: 13.3446, lng: -88.4368 }, // Plaza Central / Centro de Usulután
    7: { lat: 13.3465, lng: -88.4195 }, // Edificio Aulas A3 - Campus Usulután
  };

  // Estado global de la aplicación en Vanilla JS
  const state = {
    vistaActual: 'inicio',
    token: localStorage.getItem('campus_find_token') || null,
    usuario: JSON.parse(localStorage.getItem('campus_find_user') || 'null'),
    objetos: [],
    categorias: [],
    ubicaciones: [],
    stats: null,
    miUbicacionGPS: null,
    modoMapa: 'calles',
    mostrarEdificios: true,
    objetoDetalleActual: null,
    reportLat: 13.3468,
    reportLng: -88.4205,
  };

  // Instancias de mapas Leaflet
  let mainMap = null;
  let mainTileLayer = null;
  let mainMarkersLayer = null;
  let mainBuildingsLayer = null;
  let mainUserGPSLayer = null;
  let mainMarkerById = {};

  let reportMap = null;
  let reportMarker = null;

  let detailMap = null;

  // =========================================================================
  // 1. UTILIDADES Y CLIENTE HTTP CON TOKEN JWT
  // =========================================================================
  function showToast(mensaje) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mensaje;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3600);
  }

  async function apiFetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.mensaje || data.error || `Error HTTP ${res.status}`);
    }
    return data;
  }

  function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function obtenerCoordenadasObjeto(obj) {
    if (obj.latitud && obj.longitud && !isNaN(Number(obj.latitud)) && !isNaN(Number(obj.longitud))) {
      return { lat: Number(obj.latitud), lng: Number(obj.longitud) };
    }
    if (obj.ubicacion && obj.ubicacion.latitud && obj.ubicacion.longitud) {
      const offsetLat = ((obj.id % 5) - 2) * 0.0001;
      const offsetLng = ((obj.id % 3) - 1) * 0.0001;
      return {
        lat: Number(obj.ubicacion.latitud) + offsetLat,
        lng: Number(obj.ubicacion.longitud) + offsetLng,
      };
    }
    const base = COORDS_FALLBACK_USULUTAN[obj.ubicacion_id] || COORDS_FALLBACK_USULUTAN[1];
    const offsetLat = ((obj.id % 5) - 2) * 0.0001;
    const offsetLng = ((obj.id % 3) - 1) * 0.0001;
    return { lat: base.lat + offsetLat, lng: base.lng + offsetLng };
  }

  function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    try {
      return new Date(fechaStr).toLocaleDateString('es-SV', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  }

  // =========================================================================
  // 2. MODALES NATIVOS <dialog closedby="any"> + FALLBACK LIGHT-DISMISS
  // =========================================================================
  function initDialogs() {
    const dialogs = document.querySelectorAll('dialog.app-dialog');
    dialogs.forEach((dialog) => {
      // Fallback para navegadores que aún no soportan closedby="any"
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        dialog.addEventListener('click', (event) => {
          if (event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          const isDialogContent =
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width;
          if (isDialogContent) return;
          dialog.close();
        });
      }
    });

    document.querySelectorAll('[data-close-dialog]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-close-dialog');
        const dlg = document.getElementById(id);
        if (dlg) dlg.close();
      });
    });
  }

  // =========================================================================
  // 3. NAVEGACIÓN ENTRE VISTAS Y SESIÓN DE USUARIO (RBAC)
  // =========================================================================
  function cambiarVista(vista) {
    state.vistaActual = vista;
    document.querySelectorAll('.view-section').forEach((sec) => {
      sec.classList.toggle('active', sec.id === `view-${vista}`);
    });
    document.querySelectorAll('#main-nav .nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === vista);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (vista === 'inicio') cargarDatosInicio();
    if (vista === 'mapa') {
      initMainUsulutanMap();
      setTimeout(() => {
        if (mainMap) mainMap.invalidateSize();
        renderizarMapaUsulutan();
      }, 150);
    }
    if (vista === 'buscar') ejecutarBusqueda();
    if (vista === 'reportar') {
      initReportMapPicker();
      setTimeout(() => {
        if (reportMap) reportMap.invalidateSize();
      }, 150);
    }
    if (vista === 'mis-reportes') cargarMisReportes();
    if (vista === 'mis-reclamaciones') cargarMisReclamaciones();
    if (vista === 'admin') cargarPanelAdmin();
    if (vista === 'crud') cargarCentroCrud('ubicaciones');
  }

  function actualizarUIUsuario() {
    const esLogueado = Boolean(state.usuario);
    const esAdmin = state.usuario && state.usuario.rol === 'administrador';

    document.querySelectorAll('.auth-only').forEach((el) => {
      el.style.display = esLogueado ? 'inline-flex' : 'none';
    });
    document.querySelectorAll('.admin-only').forEach((el) => {
      el.style.display = esAdmin ? 'inline-flex' : 'none';
    });

    const userArea = document.getElementById('user-area');
    if (!userArea) return;

    if (esLogueado) {
      userArea.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span class="badge badge-recuperado" style="text-transform:capitalize">
            👤 ${state.usuario.nombre.split(' ')[0]} (${state.usuario.rol})
          </span>
          <button type="button" class="btn btn-outline btn-sm" id="btn-logout-now">
            Salir
          </button>
        </div>
      `;
      document.getElementById('btn-logout-now').addEventListener('click', () => {
        state.token = null;
        state.usuario = null;
        localStorage.removeItem('campus_find_token');
        localStorage.removeItem('campus_find_user');
        actualizarUIUsuario();
        showToast('Sesión cerrada correctamente.');
        cambiarVista('inicio');
      });
    } else {
      userArea.innerHTML = `
        <button type="button" class="btn btn-primary btn-sm" id="btn-open-auth">
          👤 Iniciar Sesión
        </button>
      `;
      document.getElementById('btn-open-auth').addEventListener('click', () => {
        document.getElementById('dialog-auth').showModal();
      });
    }
  }

  // =========================================================================
  // 4. CARGA DE CATÁLOGOS E INICIO
  // =========================================================================
  async function cargarCatalogosBase() {
    try {
      const [resCat, resUbi, resObj, resStats] = await Promise.all([
        apiFetch('/categorias'),
        apiFetch('/ubicaciones'),
        apiFetch('/objetos?limite=100'),
        apiFetch('/stats'),
      ]);
      state.categorias = resCat.categorias || [];
      state.ubicaciones = resUbi.ubicaciones || [];
      state.objetos = resObj.objetos || [];
      state.stats = resStats.estadisticas || null;

      poblarSelectoresCatalogos();
      renderizarInicio();
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  }

  function poblarSelectoresCatalogos() {
    const catSelects = ['map-filter-categoria', 'search-select-categoria', 'report-categoria'];
    catSelects.forEach((id) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const isReport = id === 'report-categoria';
      sel.innerHTML = isReport ? '' : '<option value="todas">Todas las Categorías</option>';
      state.categorias.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = String(c.id);
        opt.textContent = c.nombre;
        sel.appendChild(opt);
      });
    });

    const ubiSelects = ['map-filter-ubicacion', 'search-select-ubicacion', 'report-ubicacion'];
    ubiSelects.forEach((id) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const isReport = id === 'report-ubicacion';
      sel.innerHTML = isReport ? '' : '<option value="todas">Todas las Zonas de Usulután</option>';
      state.ubicaciones.forEach((u) => {
        const opt = document.createElement('option');
        opt.value = String(u.id);
        opt.textContent = `${u.edificio} — ${u.nombre}`;
        sel.appendChild(opt);
      });
    });
  }

  async function cargarDatosInicio() {
    await cargarCatalogosBase();
  }

  function renderizarInicio() {
    if (state.stats) {
      document.getElementById('stat-total-objetos').textContent = state.stats.totalObjetos;
      document.getElementById('stat-perdidos').textContent = state.stats.totalPerdidos;
      document.getElementById('stat-encontrados').textContent = state.stats.totalEncontrados;
      document.getElementById('stat-tasa').textContent = `${state.stats.tasaRecuperacion}%`;
    }

    // Categorías rápidas
    const chipsContainer = document.getElementById('home-categories-chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = '';
      state.categorias.forEach((c) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip';
        btn.textContent = `🏷️ ${c.nombre}`;
        btn.addEventListener('click', () => {
          document.getElementById('search-select-categoria').value = String(c.id);
          cambiarVista('buscar');
        });
        chipsContainer.appendChild(btn);
      });
    }

    // Objetos recientes (primeros 6)
    const recentGrid = document.getElementById('home-recent-objects');
    if (recentGrid) {
      renderizarTarjetasObjetos(state.objetos.slice(0, 6), recentGrid);
    }
  }

  // =========================================================================
  // 5. TARJETAS DE OBJETOS Y MODAL DE DETALLE CON MINI-MAPA DE USULUTÁN
  // =========================================================================
  function crearBadgeEstado(obj) {
    const nombre =
      (obj.estado && obj.estado.nombre) ||
      (obj.estado_id === 1 ? 'perdido' : obj.estado_id === 2 ? 'encontrado' : 'recuperado');
    if (nombre === 'perdido') return '<span class="badge badge-perdido">🔴 PERDIDO</span>';
    if (nombre === 'encontrado') return '<span class="badge badge-encontrado">🟢 ENCONTRADO</span>';
    return '<span class="badge badge-recuperado">🔵 RECUPERADO</span>';
  }

  function renderizarTarjetasObjetos(lista, contenedor, opciones = {}) {
    contenedor.innerHTML = '';
    if (!lista || lista.length === 0) {
      contenedor.innerHTML = `
        <div class="card-panel" style="grid-column:1/-1;text-align:center;color:#64748b">
          No se encontraron objetos registrados con estos criterios en Usulután.
        </div>
      `;
      return;
    }

    lista.forEach((obj) => {
      const coords = obtenerCoordenadasObjeto(obj);
      const card = document.createElement('article');
      card.className = 'object-card';
      card.innerHTML = `
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem">
            ${crearBadgeEstado(obj)}
            <span style="font-size:0.74rem;font-weight:700;color:#64748b">
              ${obj.categoria ? obj.categoria.nombre : 'General'}
            </span>
          </div>
          <h3 class="card-title">${obj.titulo}</h3>
          <p class="card-desc">${obj.descripcion}</p>
        </div>

        <div>
          <div class="card-meta" style="margin-bottom:0.75rem">
            <div><strong>📍 Zona:</strong> ${obj.ubicacion ? obj.ubicacion.edificio : 'Campus Usulután'}</div>
            <div><strong>🏫 Lugar:</strong> ${obj.ubicacion ? obj.ubicacion.nombre : 'Usulután'}</div>
            <div style="font-family:monospace;font-size:0.7rem;color:#0284c7">
              🛰️ GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} • 📅 ${formatearFecha(obj.fecha_reporte)}
            </div>
          </div>

          <div class="card-actions">
            <button type="button" class="btn btn-outline btn-sm btn-ver-detalle">
              👁️ Ver Detalle y Mapa
            </button>
            <div style="display:flex;gap:0.4rem">
              ${
                opciones.permitirEliminar
                  ? `<button type="button" class="btn btn-danger btn-sm btn-eliminar-obj">🗑️</button>`
                  : ''
              }
              ${
                obj.estado_id !== 3
                  ? `<button type="button" class="btn btn-primary btn-sm btn-reclamar-obj">✨ Reclamar</button>`
                  : ''
              }
            </div>
          </div>
        </div>
      `;

      card.querySelector('.btn-ver-detalle').addEventListener('click', () => abrirDetalleObjeto(obj));
      const btnRec = card.querySelector('.btn-reclamar-obj');
      if (btnRec) {
        btnRec.addEventListener('click', () => abrirModalReclamar(obj));
      }
      const btnDel = card.querySelector('.btn-eliminar-obj');
      if (btnDel) {
        btnDel.addEventListener('click', async () => {
          try {
            await apiFetch(`/objetos/${obj.id}`, { method: 'DELETE' });
            showToast('Reporte eliminado correctamente.');
            cargarMisReportes();
            cargarCatalogosBase();
          } catch (err) {
            showToast(err.message);
          }
        });
      }

      contenedor.appendChild(card);
    });
  }

  function abrirDetalleObjeto(obj) {
    state.objetoDetalleActual = obj;
    const coords = obtenerCoordenadasObjeto(obj);

    const badge = document.getElementById('detalle-badge');
    const estadoNombre =
      (obj.estado && obj.estado.nombre) ||
      (obj.estado_id === 1 ? 'perdido' : obj.estado_id === 2 ? 'encontrado' : 'recuperado');
    badge.className = `badge badge-${estadoNombre}`;
    badge.textContent = `OBJETO ${estadoNombre.toUpperCase()}`;

    document.getElementById('detalle-titulo').textContent = obj.titulo;
    document.getElementById('detalle-descripcion').textContent = obj.descripcion;
    document.getElementById('detalle-ubicacion').textContent = obj.ubicacion ? obj.ubicacion.nombre : 'Campus Usulután';
    document.getElementById('detalle-edificio').textContent = obj.ubicacion ? obj.ubicacion.edificio : 'Usulután';
    document.getElementById('detalle-fecha').textContent = `Fecha: ${formatearFecha(obj.fecha_reporte)}`;
    document.getElementById('detalle-usuario').textContent = `Reportado por: ${
      obj.usuario ? obj.usuario.nombre : 'Miembro Universitario'
    }`;
    document.getElementById('detalle-coords-label').textContent = `📍 GPS Usulután: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
    document.getElementById('detalle-gmaps-link').href = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

    const btnReclamar = document.getElementById('btn-detalle-reclamar');
    btnReclamar.style.display = obj.estado_id === 3 ? 'none' : 'inline-flex';
    btnReclamar.onclick = () => {
      document.getElementById('dialog-detalle').close();
      abrirModalReclamar(obj);
    };

    const dlg = document.getElementById('dialog-detalle');
    dlg.showModal();

    // Inicializar o actualizar mini-mapa del modal en Usulután
    setTimeout(() => {
      const container = document.getElementById('detail-map-canvas');
      if (detailMap) {
        detailMap.remove();
        detailMap = null;
      }
      detailMap = L.map(container, {
        center: [coords.lat, coords.lng],
        zoom: 17,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | Usulután',
        maxZoom: 19,
      }).addTo(detailMap);

      L.marker([coords.lat, coords.lng])
        .addTo(detailMap)
        .bindPopup(`<strong>${obj.titulo}</strong><br/>${obj.ubicacion ? obj.ubicacion.edificio : 'Usulután'}`)
        .openPopup();

      detailMap.invalidateSize();
    }, 120);
  }

  // =========================================================================
  // 6. MAPA INTERACTIVO DE USULUTÁN (LEAFLET + GEOLOCALIZACIÓN GPS)
  // =========================================================================
  function initMainUsulutanMap() {
    const container = document.getElementById('usulutan-map-canvas');
    if (!container || mainMap) return;

    mainMap = L.map(container, {
      center: VISTA_GENERAL_USULUTAN,
      zoom: 15,
    });

    mainTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | Campus Find Usulután',
      maxZoom: 19,
    }).addTo(mainMap);

    mainBuildingsLayer = L.layerGroup().addTo(mainMap);
    mainMarkersLayer = L.layerGroup().addTo(mainMap);
    mainUserGPSLayer = L.layerGroup().addTo(mainMap);
  }

  function obtenerObjetosFiltradosMapa() {
    const texto = (document.getElementById('map-filter-texto').value || '').trim().toLowerCase();
    const estado = document.getElementById('map-filter-estado').value;
    const cat = document.getElementById('map-filter-categoria').value;
    const ubi = document.getElementById('map-filter-ubicacion').value;

    return state.objetos.filter((obj) => {
      if (estado !== 'todos' && String(obj.estado_id) !== estado) return false;
      if (cat !== 'todas' && String(obj.categoria_id) !== cat) return false;
      if (ubi !== 'todas' && String(obj.ubicacion_id) !== ubi) return false;
      if (texto) {
        const mTit = obj.titulo.toLowerCase().includes(texto);
        const mDes = obj.descripcion.toLowerCase().includes(texto);
        const mUbi =
          (obj.ubicacion && obj.ubicacion.nombre.toLowerCase().includes(texto)) ||
          (obj.ubicacion && obj.ubicacion.edificio.toLowerCase().includes(texto));
        if (!mTit && !mDes && !mUbi) return false;
      }
      return true;
    });
  }

  function renderizarMapaUsulutan() {
    if (!mainMap) return;

    const filtrados = obtenerObjetosFiltradosMapa();
    const cPerdidos = filtrados.filter((o) => o.estado_id === 1).length;
    const cEncontrados = filtrados.filter((o) => o.estado_id === 2).length;
    const cRecuperados = filtrados.filter((o) => o.estado_id === 3).length;

    document.getElementById('map-count-perdidos').textContent = `🔴 Perdidos: ${cPerdidos}`;
    document.getElementById('map-count-encontrados').textContent = `🟢 Encontrados: ${cEncontrados}`;
    document.getElementById('map-count-recuperados').textContent = `🔵 Recuperados: ${cRecuperados}`;
    document.getElementById('map-sidebar-title').textContent = `Objetos en Usulután (${filtrados.length})`;

    // 1. Renderizar edificios oficiales de Usulután
    mainBuildingsLayer.clearLayers();
    if (state.mostrarEdificios) {
      state.ubicaciones.forEach((u) => {
        const lat = u.latitud || (COORDS_FALLBACK_USULUTAN[u.id] && COORDS_FALLBACK_USULUTAN[u.id].lat) || 13.3468;
        const lng = u.longitud || (COORDS_FALLBACK_USULUTAN[u.id] && COORDS_FALLBACK_USULUTAN[u.id].lng) || -88.4205;

        const icon = L.divIcon({
          className: 'building-pin-usulutan',
          html: `
            <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(15,23,42,0.9);color:#fff;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700;white-space:nowrap;border:1.5px solid #38bdf8;transform:translate(-50%,-100%);">
              🏫 ${u.edificio}
            </div>
          `,
          iconSize: [0, 0],
        });

        L.marker([lat, lng], { icon, zIndexOffset: -100 })
          .bindPopup(
            `<strong>🏫 ${u.nombre}</strong><br/><span style="font-size:11px;color:#475569">${u.edificio}</span><br/><small style="font-family:monospace">GPS: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}</small>`
          )
          .addTo(mainBuildingsLayer);
      });
    }

    // 2. Renderizar pines de objetos perdidos/encontrados/recuperados
    mainMarkersLayer.clearLayers();
    mainMarkerById = {};

    const sidebarList = document.getElementById('map-sidebar-list');
    sidebarList.innerHTML = '';

    filtrados.forEach((obj) => {
      const { lat, lng } = obtenerCoordenadasObjeto(obj);
      let color = '#e11d48';
      let emoji = '🔎';
      let label = 'PERDIDO';

      if (obj.estado_id === 2) {
        color = '#059669';
        emoji = '📦';
        label = 'ENCONTRADO';
      } else if (obj.estado_id === 3) {
        color = '#2563eb';
        emoji = '✅';
        label = 'RECUPERADO';
      }

      const pinIcon = L.divIcon({
        className: 'object-pin-usulutan',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
            <div style="width:36px;height:36px;border-radius:999px;background:${color};border:3px solid #ffffff;box-shadow:0 6px 14px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:15px;">
              ${emoji}
            </div>
            <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};margin-top:-1px;"></div>
          </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon });

      const popupEl = document.createElement('div');
      popupEl.style.minWidth = '220px';
      popupEl.innerHTML = `
        <div style="font-family:'Plus Jakarta Sans',sans-serif">
          <div style="font-size:10px;font-weight:800;color:${color};margin-bottom:3px">${label} • ${
            obj.categoria ? obj.categoria.nombre : ''
          }</div>
          <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:4px">${obj.titulo}</div>
          <div style="font-size:11px;color:#475569;margin-bottom:6px">📍 ${
            obj.ubicacion ? obj.ubicacion.edificio + ' - ' + obj.ubicacion.nombre : 'Campus Usulután'
          }</div>
          <div style="font-size:10px;font-family:monospace;color:#64748b;margin-bottom:8px">
            GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn-popup-ver" style="flex:1;background:#0f172a;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer">
              Ver Detalle
            </button>
            ${
              obj.estado_id !== 3
                ? `<button type="button" class="btn-popup-rec" style="flex:1;background:#1d4ed8;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer">Reclamar</button>`
                : ''
            }
          </div>
        </div>
      `;

      popupEl.querySelector('.btn-popup-ver').addEventListener('click', () => abrirDetalleObjeto(obj));
      const bRec = popupEl.querySelector('.btn-popup-rec');
      if (bRec) bRec.addEventListener('click', () => abrirModalReclamar(obj));

      marker.bindPopup(popupEl);
      marker.addTo(mainMarkersLayer);
      mainMarkerById[obj.id] = marker;

      // Agregar a la lista lateral sincronizada
      const distKm = state.miUbicacionGPS
        ? calcularDistanciaKm(state.miUbicacionGPS.lat, state.miUbicacionGPS.lng, lat, lng)
        : null;

      const item = document.createElement('div');
      item.className = 'map-item';
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          ${crearBadgeEstado(obj)}
          <span style="font-size:0.7rem;font-family:monospace;color:#64748b">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
        </div>
        <div style="font-weight:800;font-size:0.86rem;color:#0f172a">${obj.titulo}</div>
        <div style="font-size:0.75rem;color:#475569;margin-top:2px">
          📍 ${obj.ubicacion ? obj.ubicacion.edificio + ' — ' + obj.ubicacion.nombre : 'Usulután'}
        </div>
        ${
          distKm !== null
            ? `<div style="font-size:0.73rem;font-weight:700;color:#0284c7;margin-top:3px">
                📏 A ${distKm < 1 ? Math.round(distKm * 1000) + ' metros' : distKm.toFixed(2) + ' km'} de tu GPS
              </div>`
            : ''
        }
      `;
      item.addEventListener('click', () => {
        mainMap.flyTo([lat, lng], 18, { duration: 0.8 });
        setTimeout(() => marker.openPopup(), 350);
      });
      sidebarList.appendChild(item);
    });
  }

  function activarGPSUsuarioEnUsulutan() {
    const alertBox = document.getElementById('gps-status-alert');
    alertBox.style.display = 'block';
    alertBox.textContent = '🛰️ Obteniendo coordenadas GPS de tu dispositivo...';

    if (!navigator.geolocation) {
      alertBox.textContent = 'Tu navegador no soporta geolocalización.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        state.miUbicacionGPS = { lat, lng };

        if (mainUserGPSLayer && mainMap) {
          mainUserGPSLayer.clearLayers();
          L.circle([lat, lng], {
            radius: 50,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.2,
          }).addTo(mainUserGPSLayer);

          L.marker([lat, lng])
            .addTo(mainUserGPSLayer)
            .bindPopup(`<strong>📍 Tu Ubicación GPS Actual</strong><br/>${lat.toFixed(5)}, ${lng.toFixed(5)}`)
            .openPopup();

          mainMap.flyTo([lat, lng], 16, { duration: 1.1 });
        }

        const distCampus = calcularDistanciaKm(lat, lng, CENTRO_CAMPUS_USULUTAN[0], CENTRO_CAMPUS_USULUTAN[1]);
        alertBox.textContent = `✅ GPS Activo (${lat.toFixed(5)}, ${lng.toFixed(5)}) — Distancia al Campus Usulután: ${distCampus.toFixed(2)} km.`;
        renderizarMapaUsulutan();
      },
      () => {
        // Fallback al punto central del Campus Usulután si está en PC sin GPS o bloquea permiso
        const lat = CENTRO_CAMPUS_USULUTAN[0];
        const lng = CENTRO_CAMPUS_USULUTAN[1];
        state.miUbicacionGPS = { lat, lng };
        if (mainUserGPSLayer && mainMap) {
          mainUserGPSLayer.clearLayers();
          L.circle([lat, lng], {
            radius: 45,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.22,
          }).addTo(mainUserGPSLayer);

          L.marker([lat, lng])
            .addTo(mainUserGPSLayer)
            .bindPopup('<strong>📍 Punto GPS de Referencia — Campus Usulután</strong>')
            .openPopup();

          mainMap.flyTo([lat, lng], 17, { duration: 1.0 });
        }
        alertBox.textContent = `📍 Geolocalización posicionada en el Campus Universitario Usulután (${lat}, ${lng}). Distancias calculadas desde el campus.`;
        renderizarMapaUsulutan();
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }

  // =========================================================================
  // 7. BÚSQUEDA AVANZADA
  // =========================================================================
  async function ejecutarBusqueda() {
    const texto = document.getElementById('search-input-texto').value.trim();
    const cat = document.getElementById('search-select-categoria').value;
    const ubi = document.getElementById('search-select-ubicacion').value;
    const est = document.getElementById('search-select-estado').value;

    const params = new URLSearchParams();
    if (texto) params.append('texto', texto);
    if (cat !== 'todas') params.append('categoria', cat);
    if (ubi !== 'todas') params.append('ubicacion', ubi);
    if (est !== 'todos') params.append('estado', est);

    try {
      const res = await apiFetch(`/objetos/buscar?${params.toString()}`);
      const lista = res.objetos || [];
      document.getElementById('search-results-count').textContent = `Mostrando ${lista.length} objeto(s) encontrados en Usulután`;
      renderizarTarjetasObjetos(lista, document.getElementById('search-results-grid'));
    } catch (err) {
      showToast(err.message);
    }
  }

  // =========================================================================
  // 8. REPORTE DE OBJETOS + SELECTOR GPS EN USULUTÁN + MATCHING EN VIVO
  // =========================================================================
  function initReportMapPicker() {
    const container = document.getElementById('report-map-canvas');
    if (!container || reportMap) return;

    reportMap = L.map(container, {
      center: [state.reportLat, state.reportLng],
      zoom: 17,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap | Usulután GPS',
      maxZoom: 19,
    }).addTo(reportMap);

    reportMarker = L.marker([state.reportLat, state.reportLng], { draggable: true }).addTo(reportMap);
    reportMarker.bindPopup('📍 Haz clic en el mapa o arrastra este pin al lugar exacto en Usulután').openPopup();

    reportMarker.on('dragend', () => {
      const pos = reportMarker.getLatLng();
      actualizarCoordsReporte(pos.lat, pos.lng);
    });

    reportMap.on('click', (e) => {
      actualizarCoordsReporte(e.latlng.lat, e.latlng.lng);
    });
  }

  function actualizarCoordsReporte(lat, lng) {
    state.reportLat = Number(Number(lat).toFixed(6));
    state.reportLng = Number(Number(lng).toFixed(6));
    document.getElementById('report-lat-display').textContent = state.reportLat.toFixed(6);
    document.getElementById('report-lng-display').textContent = state.reportLng.toFixed(6);
    if (reportMarker && reportMap) {
      reportMarker.setLatLng([state.reportLat, state.reportLng]);
      reportMap.panTo([state.reportLat, state.reportLng]);
    }
  }

  async function verificarCoincidenciasEnVivo() {
    const titulo = document.getElementById('report-titulo').value.trim();
    const categoria_id = document.getElementById('report-categoria').value;
    const ubicacion_id = document.getElementById('report-ubicacion').value;
    const estado_id = document.getElementById('report-estado-id').value;

    if (!categoria_id) return;

    try {
      const params = new URLSearchParams({
        categoria_id,
        ubicacion_id,
        estado_id,
      });
      if (titulo.length > 2) params.append('titulo', titulo);

      const res = await apiFetch(`/objetos/coincidencias?${params.toString()}`);
      const box = document.getElementById('report-matching-box');
      const list = document.getElementById('report-matching-list');
      const matches = res.coincidencias || [];

      if (matches.length === 0) {
        box.style.display = 'none';
        return;
      }

      box.style.display = 'block';
      list.innerHTML = '';
      matches.forEach((m) => {
        const row = document.createElement('div');
        row.style =
          'display:flex;justify-content:space-between;align-items:center;background:#fff;padding:0.55rem 0.8rem;border-radius:8px;border:1px solid #fde68a;font-size:0.8rem';
        row.innerHTML = `
          <div>
            <strong>${m.titulo}</strong> — <span style="color:#64748b">${
              m.ubicacion ? m.ubicacion.edificio : 'Usulután'
            }</span>
          </div>
          <button type="button" class="btn btn-outline btn-sm">Ver Objeto</button>
        `;
        row.querySelector('button').addEventListener('click', () => abrirDetalleObjeto(m));
        list.appendChild(row);
      });
    } catch {
      // Silenciar sondeo
    }
  }

  // =========================================================================
  // 9. MIS REPORTES, RECLAMACIONES Y PANEL ADMIN
  // =========================================================================
  async function cargarMisReportes() {
    if (!state.usuario) return;
    try {
      const res = await apiFetch('/objetos/mis-reportes');
      renderizarTarjetasObjetos(res.objetos || [], document.getElementById('mis-reportes-grid'), {
        permitirEliminar: true,
      });
    } catch (err) {
      showToast(err.message);
    }
  }

  function abrirModalReclamar(obj) {
    if (!state.usuario) {
      showToast('Inicia sesión primero para reclamar un objeto.');
      document.getElementById('dialog-auth').showModal();
      return;
    }
    document.getElementById('reclamar-objeto-id').value = String(obj.id);
    document.getElementById('reclamar-objeto-nombre').textContent = `Objeto: ${obj.titulo} (${
      obj.ubicacion ? obj.ubicacion.edificio : 'Usulután'
    })`;
    document.getElementById('reclamar-descripcion').value = '';
    document.getElementById('dialog-reclamar').showModal();
  }

  async function cargarMisReclamaciones() {
    if (!state.usuario) return;
    try {
      const res = await apiFetch('/reclamaciones/mis-reclamaciones');
      const grid = document.getElementById('mis-reclamaciones-grid');
      grid.innerHTML = '';
      const lista = res.reclamaciones || [];
      if (lista.length === 0) {
        grid.innerHTML = `<div class="card-panel" style="grid-column:1/-1;text-align:center">No has enviado reclamaciones aún.</div>`;
        return;
      }
      lista.forEach((rec) => {
        const est = (rec.estado_reclamacion && rec.estado_reclamacion.nombre) || 'pendiente';
        const card = document.createElement('div');
        card.className = 'object-card';
        card.innerHTML = `
          <div>
            <span class="badge badge-${est}">${est.toUpperCase()}</span>
            <h3 class="card-title">${rec.objeto ? rec.objeto.titulo : 'Objeto #' + rec.objeto_id}</h3>
            <p class="card-desc">"${rec.descripcion}"</p>
          </div>
          <div class="card-meta">
            <div>📅 Fecha solicitud: ${formatearFecha(rec.fecha)}</div>
            ${
              rec.entrega
                ? `<div style="color:#059669;font-weight:700">✅ Entregado: ${rec.entrega.observaciones}</div>`
                : ''
            }
          </div>
        `;
        grid.appendChild(card);
      });
    } catch (err) {
      showToast(err.message);
    }
  }

  async function cargarPanelAdmin() {
    try {
      const [resRec, resEnt] = await Promise.all([
        apiFetch('/reclamaciones'),
        apiFetch('/entregas'),
      ]);

      const tbodyRec = document.getElementById('admin-claims-tbody');
      tbodyRec.innerHTML = '';
      (resRec.reclamaciones || []).forEach((r) => {
        const est = (r.estado_reclamacion && r.estado_reclamacion.nombre) || 'pendiente';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>#${r.id}</td>
          <td><strong>${r.objeto ? r.objeto.titulo : 'Objeto'}</strong></td>
          <td>${r.usuario ? r.usuario.nombre : 'Usuario'}</td>
          <td>${r.descripcion}</td>
          <td><span class="badge badge-${est}">${est}</span></td>
          <td style="display:flex;gap:0.35rem;flex-wrap:wrap">
            ${
              r.estado_reclamacion_id === 1
                ? `<button type="button" class="btn btn-success btn-sm btn-aprobar">Aprobar</button>
                   <button type="button" class="btn btn-danger btn-sm btn-rechazar">Rechazar</button>`
                : ''
            }
            ${
              r.estado_reclamacion_id === 2 && !r.entrega
                ? `<button type="button" class="btn btn-primary btn-sm btn-entregar">📦 Registrar Entrega</button>`
                : ''
            }
          </td>
        `;
        const bAp = tr.querySelector('.btn-aprobar');
        if (bAp) {
          bAp.addEventListener('click', async () => {
            await apiFetch(`/reclamaciones/${r.id}`, {
              method: 'PUT',
              body: JSON.stringify({ estado_reclamacion_id: 2 }),
            });
            showToast('Reclamación aprobada.');
            cargarPanelAdmin();
          });
        }
        const bRe = tr.querySelector('.btn-rechazar');
        if (bRe) {
          bRe.addEventListener('click', async () => {
            await apiFetch(`/reclamaciones/${r.id}`, {
              method: 'PUT',
              body: JSON.stringify({ estado_reclamacion_id: 3 }),
            });
            showToast('Reclamación rechazada.');
            cargarPanelAdmin();
          });
        }
        const bEn = tr.querySelector('.btn-entregar');
        if (bEn) {
          bEn.addEventListener('click', async () => {
            await apiFetch('/entregas', {
              method: 'POST',
              body: JSON.stringify({
                reclamacion_id: r.id,
                observaciones: 'Entrega formal verificada en caseta de vigilancia del Campus Usulután.',
              }),
            });
            showToast('¡Acta de entrega registrada y objeto marcado como Recuperado!');
            cargarPanelAdmin();
            cargarCatalogosBase();
          });
        }
        tbodyRec.appendChild(tr);
      });

      const tbodyEnt = document.getElementById('admin-deliveries-tbody');
      tbodyEnt.innerHTML = '';
      (resEnt.entregas || []).forEach((e) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>#${e.id}</td>
          <td><strong>${e.reclamacion && e.reclamacion.objeto ? e.reclamacion.objeto.titulo : 'Objeto'}</strong></td>
          <td>${e.reclamacion && e.reclamacion.usuario ? e.reclamacion.usuario.nombre : 'Solicitante'}</td>
          <td>${formatearFecha(e.fecha)}</td>
          <td>${e.observaciones}</td>
        `;
        tbodyEnt.appendChild(tr);
      });
    } catch (err) {
      showToast(err.message);
    }
  }

  // =========================================================================
  // 10. CENTRO CRUD 3FN (UBICACIONES USULUTÁN, CATEGORÍAS, USUARIOS, ESQUEMA)
  // =========================================================================
  async function cargarCentroCrud(tabActiva) {
    document.querySelectorAll('.crud-tab').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabActiva);
    });
    document.querySelectorAll('.crud-subpanel').forEach((p) => {
      p.style.display = p.id === `crud-panel-${tabActiva}` ? 'block' : 'none';
    });

    await cargarCatalogosBase();

    // Tabla de ubicaciones en Usulután
    const tbodyUbi = document.getElementById('crud-ubicaciones-tbody');
    tbodyUbi.innerHTML = '';
    state.ubicaciones.forEach((u) => {
      const lat = u.latitud || 13.3468;
      const lng = u.longitud || -88.4205;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${u.id}</td>
        <td><strong>${u.edificio}</strong></td>
        <td>${u.nombre}</td>
        <td style="font-family:monospace">${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}</td>
        <td>
          <button type="button" class="btn btn-danger btn-sm">Eliminar</button>
        </td>
      `;
      tr.querySelector('button').addEventListener('click', async () => {
        try {
          await apiFetch(`/ubicaciones/${u.id}`, { method: 'DELETE' });
          showToast('Ubicación eliminada.');
          cargarCentroCrud('ubicaciones');
        } catch (err) {
          showToast(err.message);
        }
      });
      tbodyUbi.appendChild(tr);
    });

    // Tabla de categorías
    const tbodyCat = document.getElementById('crud-categorias-tbody');
    tbodyCat.innerHTML = '';
    state.categorias.forEach((c) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${c.id}</td>
        <td><strong>${c.nombre}</strong></td>
        <td><button type="button" class="btn btn-danger btn-sm">Eliminar</button></td>
      `;
      tr.querySelector('button').addEventListener('click', async () => {
        try {
          await apiFetch(`/categorias/${c.id}`, { method: 'DELETE' });
          showToast('Categoría eliminada.');
          cargarCentroCrud('categorias');
        } catch (err) {
          showToast(err.message);
        }
      });
      tbodyCat.appendChild(tr);
    });

    // Tabla de usuarios
    if (tabActiva === 'usuarios') {
      try {
        const resUsers = await apiFetch('/usuarios');
        const tbodyUsers = document.getElementById('crud-usuarios-tbody');
        tbodyUsers.innerHTML = '';
        (resUsers.usuarios || []).forEach((u) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>#${u.id}</td>
            <td><strong>${u.nombre}</strong></td>
            <td>${u.correo}</td>
            <td>${u.telefono || '-'}</td>
            <td><span class="badge badge-recuperado">${u.rol || (u.tipo_usuario && u.tipo_usuario.nombre)}</span></td>
            <td><button type="button" class="btn btn-danger btn-sm">Eliminar</button></td>
          `;
          tr.querySelector('button').addEventListener('click', async () => {
            try {
              await apiFetch(`/usuarios/${u.id}`, { method: 'DELETE' });
              showToast('Usuario eliminado.');
              cargarCentroCrud('usuarios');
            } catch (err) {
              showToast(err.message);
            }
          });
          tbodyUsers.appendChild(tr);
        });
      } catch (err) {
        showToast(err.message);
      }
    }

    // Esquema 3FN
    if (tabActiva === 'esquema') {
      try {
        const resEsq = await apiFetch('/stats/esquema');
        const grid = document.getElementById('crud-esquema-grid');
        grid.innerHTML = '';
        (resEsq.tablas || []).forEach((t) => {
          const card = document.createElement('div');
          card.className = 'object-card';
          card.innerHTML = `
            <div>
              <span class="badge badge-encontrado">${t.formaNormal}</span>
              <h3 class="card-title">Tabla: ${t.nombre} (${t.registros} reg.)</h3>
              <p class="card-desc">${t.descripcion}</p>
            </div>
            <div class="card-meta">
              <div><strong>🔑 PK:</strong> ${t.pk}</div>
              <div><strong>📋 Columnas:</strong> ${t.columnas.join(', ')}</div>
            </div>
          `;
          grid.appendChild(card);
        });
      } catch (err) {
        showToast(err.message);
      }
    }
  }

  // =========================================================================
  // 11. EVENTOS PRINCIPALES AL INICIAR DOM
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initDialogs();
    actualizarUIUsuario();
    cargarCatalogosBase();

    // Fecha de hoy por defecto en el reporte
    const fechaInput = document.getElementById('report-fecha');
    if (fechaInput) {
      fechaInput.value = new Date().toISOString().substring(0, 10);
    }

    // Navegación principal
    document.getElementById('brand-home').addEventListener('click', () => cambiarVista('inicio'));
    document.querySelectorAll('#main-nav .nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => cambiarVista(btn.getAttribute('data-view')));
    });

    // Botones del Hero
    document.getElementById('hero-btn-mapa').addEventListener('click', () => cambiarVista('mapa'));
    document.getElementById('home-ver-mapa-link').addEventListener('click', () => cambiarVista('mapa'));
    document.getElementById('home-ver-catalogo').addEventListener('click', () => cambiarVista('buscar'));
    document.getElementById('search-ir-mapa').addEventListener('click', () => cambiarVista('mapa'));
    document.getElementById('map-btn-reportar').addEventListener('click', () => cambiarVista('reportar'));
    document.getElementById('mis-reportes-nuevo').addEventListener('click', () => cambiarVista('reportar'));
    document.getElementById('admin-ir-crud').addEventListener('click', () => cambiarVista('crud'));

    document.getElementById('hero-btn-perdido').addEventListener('click', () => {
      document.getElementById('btn-tipo-perdido').click();
      cambiarVista('reportar');
    });
    document.getElementById('hero-btn-encontrado').addEventListener('click', () => {
      document.getElementById('btn-tipo-encontrado').click();
      cambiarVista('reportar');
    });

    document.getElementById('hero-search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = document.getElementById('hero-search-input').value;
      document.getElementById('search-input-texto').value = q;
      cambiarVista('buscar');
    });

    // Controles del Mapa de Usulután
    document.getElementById('btn-gps-actual').addEventListener('click', activarGPSUsuarioEnUsulutan);
    document.getElementById('btn-fly-campus').addEventListener('click', () => {
      if (mainMap) mainMap.flyTo(CENTRO_CAMPUS_USULUTAN, 17, { duration: 1.0 });
    });
    document.getElementById('btn-fly-centro').addEventListener('click', () => {
      if (mainMap) mainMap.flyTo(CENTRO_CIUDAD_USULUTAN, 16, { duration: 1.0 });
    });
    document.getElementById('btn-toggle-layer').addEventListener('click', () => {
      if (!mainMap || !mainTileLayer) return;
      mainMap.removeLayer(mainTileLayer);
      state.modoMapa = state.modoMapa === 'calles' ? 'satelite' : 'calles';
      if (state.modoMapa === 'satelite') {
        mainTileLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { attribution: 'Tiles &copy; Esri | Usulután', maxZoom: 19 }
        ).addTo(mainMap);
      } else {
        mainTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap | Usulután',
          maxZoom: 19,
        }).addTo(mainMap);
      }
    });

    document.getElementById('btn-toggle-edificios').addEventListener('click', () => {
      state.mostrarEdificios = !state.mostrarEdificios;
      renderizarMapaUsulutan();
    });

    document.getElementById('btn-map-reset').addEventListener('click', () => {
      document.getElementById('map-filter-texto').value = '';
      document.getElementById('map-filter-estado').value = 'todos';
      document.getElementById('map-filter-categoria').value = 'todas';
      document.getElementById('map-filter-ubicacion').value = 'todas';
      if (mainMap) mainMap.flyTo(VISTA_GENERAL_USULUTAN, 15, { duration: 0.9 });
      renderizarMapaUsulutan();
    });

    ['map-filter-texto', 'map-filter-estado', 'map-filter-categoria', 'map-filter-ubicacion'].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener('input', () => {
        if (id === 'map-filter-ubicacion' && el.value !== 'todas') {
          const u = state.ubicaciones.find((x) => String(x.id) === el.value);
          if (u && mainMap) {
            const lat = u.latitud || (COORDS_FALLBACK_USULUTAN[u.id] && COORDS_FALLBACK_USULUTAN[u.id].lat) || 13.3468;
            const lng = u.longitud || (COORDS_FALLBACK_USULUTAN[u.id] && COORDS_FALLBACK_USULUTAN[u.id].lng) || -88.4205;
            mainMap.flyTo([lat, lng], 18, { duration: 0.9 });
          }
        }
        renderizarMapaUsulutan();
      });
    });

    // Eventos de Búsqueda Avanzada
    ['search-input-texto', 'search-select-categoria', 'search-select-ubicacion', 'search-select-estado'].forEach(
      (id) => {
        document.getElementById(id).addEventListener('input', ejecutarBusqueda);
      }
    );
    document.getElementById('search-btn-limpiar').addEventListener('click', () => {
      document.getElementById('search-input-texto').value = '';
      document.getElementById('search-select-categoria').value = 'todas';
      document.getElementById('search-select-ubicacion').value = 'todas';
      document.getElementById('search-select-estado').value = 'todos';
      ejecutarBusqueda();
    });

    // Eventos del Formulario de Reporte
    const btnPerdido = document.getElementById('btn-tipo-perdido');
    const btnEncontrado = document.getElementById('btn-tipo-encontrado');
    const btnSubmitReporte = document.getElementById('btn-submit-reporte');

    btnPerdido.addEventListener('click', () => {
      document.getElementById('report-estado-id').value = '1';
      btnPerdido.className = 'btn btn-danger';
      btnEncontrado.className = 'btn btn-outline';
      btnSubmitReporte.className = 'btn btn-danger';
      btnSubmitReporte.textContent = '🚀 Publicar Reporte de Objeto Perdido en Usulután';
      verificarCoincidenciasEnVivo();
    });

    btnEncontrado.addEventListener('click', () => {
      document.getElementById('report-estado-id').value = '2';
      btnEncontrado.className = 'btn btn-success';
      btnPerdido.className = 'btn btn-outline';
      btnSubmitReporte.className = 'btn btn-success';
      btnSubmitReporte.textContent = '🚀 Publicar Reporte de Objeto Encontrado en Usulután';
      verificarCoincidenciasEnVivo();
    });

    document.getElementById('report-ubicacion').addEventListener('change', (e) => {
      const id = Number(e.target.value);
      const u = state.ubicaciones.find((x) => x.id === id);
      if (u) {
        const lat = u.latitud || (COORDS_FALLBACK_USULUTAN[id] && COORDS_FALLBACK_USULUTAN[id].lat) || 13.3468;
        const lng = u.longitud || (COORDS_FALLBACK_USULUTAN[id] && COORDS_FALLBACK_USULUTAN[id].lng) || -88.4205;
        actualizarCoordsReporte(lat, lng);
      }
      verificarCoincidenciasEnVivo();
    });

    document.getElementById('report-titulo').addEventListener('input', verificarCoincidenciasEnVivo);
    document.getElementById('report-categoria').addEventListener('change', verificarCoincidenciasEnVivo);

    document.getElementById('btn-report-mi-gps').addEventListener('click', () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => actualizarCoordsReporte(pos.coords.latitude, pos.coords.longitude),
        () => actualizarCoordsReporte(13.3468, -88.4205)
      );
    });

    document.getElementById('form-reportar-objeto').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.usuario) {
        showToast('Debes iniciar sesión para publicar un reporte.');
        document.getElementById('dialog-auth').showModal();
        return;
      }

      try {
        await apiFetch('/objetos', {
          method: 'POST',
          body: JSON.stringify({
            titulo: document.getElementById('report-titulo').value.trim(),
            descripcion: document.getElementById('report-descripcion').value.trim(),
            categoria_id: Number(document.getElementById('report-categoria').value),
            ubicacion_id: Number(document.getElementById('report-ubicacion').value),
            estado_id: Number(document.getElementById('report-estado-id').value),
            fecha_reporte: document.getElementById('report-fecha').value,
            latitud: state.reportLat,
            longitud: state.reportLng,
          }),
        });
        showToast('¡Objeto reportado y geolocalizado en Usulután con éxito!');
        document.getElementById('form-reportar-objeto').reset();
        await cargarCatalogosBase();
        cambiarVista('mapa');
      } catch (err) {
        showToast(err.message);
      }
    });

    // Enviar Reclamación
    document.getElementById('form-reclamar').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiFetch('/reclamaciones', {
          method: 'POST',
          body: JSON.stringify({
            objeto_id: Number(document.getElementById('reclamar-objeto-id').value),
            descripcion: document.getElementById('reclamar-descripcion').value.trim(),
          }),
        });
        document.getElementById('dialog-reclamar').close();
        showToast('¡Solicitud de reclamación enviada exitosamente!');
        cambiarVista('mis-reclamaciones');
      } catch (err) {
        showToast(err.message);
      }
    });

    // Login y Botones 1-Clic
    document.querySelectorAll('.quick-login').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('login-correo').value = btn.getAttribute('data-email');
        document.getElementById('login-password').value = 'password123';
        document.getElementById('form-login').requestSubmit();
      });
    });

    document.getElementById('form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const correo = document.getElementById('login-correo').value.trim();
      const contraseña = document.getElementById('login-password').value;
      try {
        const res = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ correo, contraseña }),
        });
        state.token = res.token;
        state.usuario = res.usuario;
        localStorage.setItem('campus_find_token', res.token);
        localStorage.setItem('campus_find_user', JSON.stringify(res.usuario));
        document.getElementById('dialog-auth').close();
        actualizarUIUsuario();
        showToast(`¡Bienvenido(a), ${res.usuario.nombre}!`);
      } catch (err) {
        showToast(err.message);
      }
    });

    // Tabs del Centro CRUD
    document.querySelectorAll('.crud-tab').forEach((btn) => {
      btn.addEventListener('click', () => cargarCentroCrud(btn.getAttribute('data-tab')));
    });

    document.getElementById('form-crud-ubicacion').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiFetch('/ubicaciones', {
          method: 'POST',
          body: JSON.stringify({
            edificio: document.getElementById('crud-ubi-edificio').value.trim(),
            nombre: document.getElementById('crud-ubi-nombre').value.trim(),
            latitud: Number(document.getElementById('crud-ubi-lat').value),
            longitud: Number(document.getElementById('crud-ubi-lng').value),
            descripcion: document.getElementById('crud-ubi-desc').value.trim(),
          }),
        });
        e.target.reset();
        showToast('Ubicación en Usulután registrada.');
        cargarCentroCrud('ubicaciones');
      } catch (err) {
        showToast(err.message);
      }
    });

    document.getElementById('form-crud-categoria').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiFetch('/categorias', {
          method: 'POST',
          body: JSON.stringify({
            nombre: document.getElementById('crud-cat-nombre').value.trim(),
          }),
        });
        e.target.reset();
        showToast('Categoría creada.');
        cargarCentroCrud('categorias');
      } catch (err) {
        showToast(err.message);
      }
    });

    document.getElementById('form-crud-usuario').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiFetch('/usuarios', {
          method: 'POST',
          body: JSON.stringify({
            nombre: document.getElementById('crud-user-nombre').value.trim(),
            correo: document.getElementById('crud-user-correo').value.trim(),
            telefono: document.getElementById('crud-user-tel').value.trim(),
            tipo_usuario_id: Number(document.getElementById('crud-user-rol').value),
          }),
        });
        e.target.reset();
        showToast('Usuario registrado.');
        cargarCentroCrud('usuarios');
      } catch (err) {
        showToast(err.message);
      }
    });
  });
})();
