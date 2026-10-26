/**
 * @file layout.js
 * @description Componentes institucionales compartidos en JavaScript puro con el diseño exacto original:
 *              Navbar, Footer, ObjectCard, AuthModal, ObjectDetailModal (con mini-mapa de Usulután),
 *              ClaimModal y DeliveryModal.
 */

(function (window) {
  'use strict';

  const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.()'-]{3,100}$/;
  const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  const REGEX_TELEFONO = /^[0-9+\-\s()]{7,20}$/;

  let detailMiniMap = null;

  function getBasePath() {
    return window.CAMPUS_BASE_PATH || '.';
  }

  function getRouteUrl(vista, params = '') {
    const base = getBasePath();
    const map = {
      inicio: `${base}/index.html`,
      mapa: `${base}/pages/mapa/index.html`,
      buscar: `${base}/pages/buscar/index.html`,
      reportar: `${base}/pages/reportar/index.html`,
      'mis-reportes': `${base}/pages/mis-reportes/index.html`,
      'mis-reclamaciones': `${base}/pages/mis-reclamaciones/index.html`,
      admin: `${base}/pages/admin/index.html`,
      crud: `${base}/pages/crud/index.html`,
    };
    const url = map[vista] || `${base}/index.html`;
    return params ? `${url}?${params}` : url;
  }

  function getUsuarioActual() {
    try {
      return JSON.parse(localStorage.getItem('campus_find_user') || 'null');
    } catch {
      return null;
    }
  }

  function esAdminActual() {
    const u = getUsuarioActual();
    return Boolean(u && (u.rol === 'administrador' || u.tipo_usuario_id === 4));
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function getRolBadgeClass(rol) {
    switch (rol) {
      case 'administrador':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'docente':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'personal':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  }

  // =========================================================================
  // 1. NAVBAR IDÉNTICA A Navbar.tsx + ENLACE MAPA USULUTÁN
  // =========================================================================
  function renderNavbar(vistaActual) {
    const header = document.getElementById('app-navbar');
    if (!header) return;

    const usuario = getUsuarioActual();
    const esAdmin = esAdminActual();

    header.className = 'sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs';
    header.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo institucional -->
          <a
            id="nav-logo"
            href="${getRouteUrl('inicio')}"
            class="flex items-center gap-3 cursor-pointer select-none group no-underline"
          >
            <div class="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-700/20 group-hover:bg-blue-800 transition-colors">
              <i data-lucide="school" class="w-5 h-5 text-blue-100"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-xl tracking-tight text-slate-900">
                  Campus<span class="text-blue-700">Find</span>
                </span>
                <span class="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Usulután
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium hidden sm:block">
                Objetos Perdidos y Encontrados
              </p>
            </div>
          </a>

          <!-- Enlaces de Navegación Principal -->
          <nav class="hidden md:flex items-center gap-1">
            <a
              id="nav-link-inicio"
              href="${getRouteUrl('inicio')}"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                vistaActual === 'inicio'
                  ? 'text-blue-700 bg-blue-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }"
            >
              Inicio
            </a>

            <a
              id="nav-link-buscar"
              href="${getRouteUrl('buscar')}"
              class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                vistaActual === 'buscar'
                  ? 'text-blue-700 bg-blue-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }"
            >
              <i data-lucide="search" class="w-4 h-4"></i>
              <span>Buscar Objetos</span>
            </a>

            <a
              id="nav-link-mapa"
              href="${getRouteUrl('mapa')}"
              class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                vistaActual === 'mapa'
                  ? 'text-blue-700 bg-blue-50 font-bold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }"
            >
              <i data-lucide="map-pin" class="w-4 h-4 text-rose-600"></i>
              <span>Mapa Usulután</span>
            </a>

            ${
              usuario
                ? `
              <a
                id="nav-link-mis-reportes"
                href="${getRouteUrl('mis-reportes')}"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                  vistaActual === 'mis-reportes'
                    ? 'text-blue-700 bg-blue-50 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }"
              >
                <i data-lucide="folder-heart" class="w-4 h-4"></i>
                <span>Mis Reportes</span>
              </a>

              <a
                id="nav-link-mis-reclamaciones"
                href="${getRouteUrl('mis-reclamaciones')}"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                  vistaActual === 'mis-reclamaciones'
                    ? 'text-blue-700 bg-blue-50 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }"
              >
                <i data-lucide="file-check-2" class="w-4 h-4"></i>
                <span>Mis Reclamaciones</span>
              </a>
            `
                : ''
            }

            ${
              esAdmin
                ? `
              <a
                id="nav-link-admin"
                href="${getRouteUrl('admin')}"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors no-underline ${
                  vistaActual === 'admin'
                    ? 'text-purple-700 bg-purple-50 border border-purple-200'
                    : 'text-purple-700 hover:bg-purple-50'
                }"
              >
                <i data-lucide="shield-check" class="w-4 h-4"></i>
                <span>Panel Admin</span>
              </a>

              <a
                id="nav-link-crud"
                href="${getRouteUrl('crud')}"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors no-underline ${
                  vistaActual === 'crud'
                    ? 'text-indigo-700 bg-indigo-50 border border-indigo-200'
                    : 'text-indigo-700 hover:bg-indigo-50/80'
                }"
              >
                <i data-lucide="database" class="w-4 h-4"></i>
                <span>Base de Datos (CRUD)</span>
              </a>
            `
                : ''
            }
          </nav>

          <!-- Acciones de reporte y sesión de usuario -->
          <div class="flex items-center gap-2 sm:gap-3">
            <div class="hidden lg:flex items-center gap-2">
              <a
                id="btn-reportar-perdido-nav"
                href="${getRouteUrl('reportar', 'tipo=perdido')}"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors no-underline"
              >
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                <span>Perdí algo</span>
              </a>
              <a
                id="btn-reportar-encontrado-nav"
                href="${getRouteUrl('reportar', 'tipo=encontrado')}"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors no-underline"
              >
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                <span>Encontré algo</span>
              </a>
            </div>

            ${
              usuario
                ? `
              <div class="relative" id="user-dropdown-wrapper">
                <button
                  id="btn-usuario-menu"
                  type="button"
                  class="flex items-center gap-2.5 p-1.5 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div class="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    ${usuario.nombre.substring(0, 2)}
                  </div>
                  <div class="text-left hidden sm:block">
                    <p class="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                      ${usuario.nombre.split(' ')[0]}
                    </p>
                    <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded border capitalize ${getRolBadgeClass(
                      usuario.rol
                    )}">
                      ${usuario.rol}
                    </span>
                  </div>
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
                </button>

                <div
                  id="menu-desplegable-usuario"
                  style="display:none"
                  class="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-modal-enter"
                >
                  <div class="px-4 py-2.5 border-b border-slate-100">
                    <p class="text-xs font-bold text-slate-900">${usuario.nombre}</p>
                    <p class="text-[11px] text-slate-500 truncate">${usuario.correo}</p>
                    <div class="mt-1.5">
                      <span class="text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${getRolBadgeClass(
                        usuario.rol
                      )}">
                        Rol institucional: ${usuario.rol}
                      </span>
                    </div>
                  </div>

                  <a
                    href="${getRouteUrl('mis-reportes')}"
                    class="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 no-underline"
                  >
                    <i data-lucide="folder-heart" class="w-4 h-4 text-slate-400"></i>
                    <span>Mis Objetos Reportados</span>
                  </a>

                  <a
                    href="${getRouteUrl('mis-reclamaciones')}"
                    class="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 no-underline"
                  >
                    <i data-lucide="file-check-2" class="w-4 h-4 text-slate-400"></i>
                    <span>Mis Reclamaciones</span>
                  </a>

                  ${
                    esAdmin
                      ? `
                    <div class="border-t border-slate-100 my-1"></div>
                    <div class="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                      Administración del Campus
                    </div>
                    <a
                      href="${getRouteUrl('admin')}"
                      class="w-full text-left px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2 no-underline"
                    >
                      <i data-lucide="shield-check" class="w-4 h-4 text-purple-600"></i>
                      <span>Panel de Administración</span>
                    </a>
                    <a
                      href="${getRouteUrl('crud')}"
                      class="w-full text-left px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 no-underline"
                    >
                      <i data-lucide="database" class="w-4 h-4 text-indigo-600"></i>
                      <span>Gestión de Base de Datos (CRUD)</span>
                    </a>
                  `
                      : ''
                  }

                  <div class="border-t border-slate-100 my-1"></div>

                  <button
                    id="btn-logout"
                    type="button"
                    class="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <i data-lucide="log-out" class="w-4 h-4"></i>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            `
                : `
              <button
                id="btn-abrir-login"
                type="button"
                class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-colors cursor-pointer"
              >
                <i data-lucide="user" class="w-4 h-4"></i>
                <span>Iniciar Sesión</span>
              </button>
            `
            }
          </div>
        </div>
      </div>

      <!-- Barra móvil inferior -->
      <div class="flex md:hidden border-t border-slate-200 bg-slate-50 px-3 py-2 justify-around text-xs font-medium text-slate-600">
        <a href="${getRouteUrl('inicio')}" class="px-2 py-1 rounded no-underline ${
      vistaActual === 'inicio' ? 'text-blue-700 font-bold' : 'text-slate-600'
    }">Inicio</a>
        <a href="${getRouteUrl('buscar')}" class="px-2 py-1 rounded no-underline ${
      vistaActual === 'buscar' ? 'text-blue-700 font-bold' : 'text-slate-600'
    }">Buscar</a>
        <a href="${getRouteUrl('mapa')}" class="px-2 py-1 rounded no-underline ${
      vistaActual === 'mapa' ? 'text-blue-700 font-bold' : 'text-slate-600'
    }">Mapa GPS</a>
        <a href="${getRouteUrl('reportar', 'tipo=perdido')}" class="px-2 py-1 rounded text-rose-700 font-bold no-underline">+ Perdí</a>
        ${
          esAdmin
            ? `<a href="${getRouteUrl('admin')}" class="px-2 py-1 rounded text-purple-700 font-bold no-underline">Admin</a>
               <a href="${getRouteUrl('crud')}" class="px-2 py-1 rounded text-indigo-700 font-bold no-underline">CRUD</a>`
            : ''
        }
      </div>
    `;

    const btnLogin = document.getElementById('btn-abrir-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', abrirModalAuth);
    }

    const btnUserMenu = document.getElementById('btn-usuario-menu');
    const menuDesplegable = document.getElementById('menu-desplegable-usuario');
    if (btnUserMenu && menuDesplegable) {
      btnUserMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDesplegable.style.display = menuDesplegable.style.display === 'none' ? 'block' : 'none';
      });
      document.addEventListener('click', () => {
        menuDesplegable.style.display = 'none';
      });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        localStorage.removeItem('campus_find_token');
        localStorage.removeItem('campus_find_user');
        window.location.href = getRouteUrl('inicio');
      });
    }

    refreshIcons();
  }

  // =========================================================================
  // 2. FOOTER IDÉNTICO A App.tsx
  // =========================================================================
  function renderFooter() {
    const footer = document.getElementById('app-footer');
    if (!footer) return;
    footer.className = 'mt-auto border-t border-slate-200 bg-white py-8';
    footer.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div class="flex items-center gap-2">
          <i data-lucide="school" class="w-4 h-4 text-blue-700"></i>
          <span class="font-bold text-slate-800">Campus Find</span>
          <span>— Sistema Universitario de Objetos Perdidos y Encontrados (Sede Usulután)</span>
        </div>

        <div class="flex items-center gap-4 text-slate-500">
          <span>Oficina de Seguridad y Vigilancia del Campus Usulután</span>
          <span>•</span>
          <span>Atención: Lunes a Viernes 08:00 - 18:00</span>
        </div>
      </div>
    `;
    refreshIcons();
  }

  // =========================================================================
  // 3. TARJETA DE OBJETO IDÉNTICA A ObjectCard.tsx
  // =========================================================================
  function getCategoriaIconName(categoriaNombre) {
    const nombre = (categoriaNombre || '').toLowerCase();
    if (nombre.includes('electrónica')) return 'laptop';
    if (nombre.includes('documento') || nombre.includes('identifica')) return 'credit-card';
    if (nombre.includes('mochila') || nombre.includes('bolso')) return 'briefcase';
    if (nombre.includes('ropa') || nombre.includes('accesorio')) return 'shirt';
    if (nombre.includes('libro') || nombre.includes('cuaderno')) return 'book-open';
    if (nombre.includes('llave')) return 'key';
    if (nombre.includes('botella') || nombre.includes('termo')) return 'coffee';
    return 'tag';
  }

  function getEstadoBadgeInfo(estadoNombre) {
    const nombre = (estadoNombre || '').toLowerCase();
    if (nombre === 'perdido') {
      return {
        clase: 'bg-rose-50 text-rose-700 border-rose-200',
        icono: '<i data-lucide="alert-triangle" class="w-3.5 h-3.5 mr-1 text-rose-600"></i>',
        etiqueta: 'Perdido',
      };
    }
    if (nombre === 'encontrado') {
      return {
        clase: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icono: '<i data-lucide="check-circle-2" class="w-3.5 h-3.5 mr-1 text-emerald-600"></i>',
        etiqueta: 'Encontrado',
      };
    }
    return {
      clase: 'bg-blue-50 text-blue-700 border-blue-200',
      icono: '<i data-lucide="check-circle-2" class="w-3.5 h-3.5 mr-1 text-blue-600"></i>',
      etiqueta: 'Recuperado',
    };
  }

  function formatearFechaCorta(fechaStr) {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  }

  function crearObjectCardElement(objeto) {
    const estadoNombre =
      objeto.estado?.nombre ||
      (objeto.estado_id === 1 ? 'perdido' : objeto.estado_id === 2 ? 'encontrado' : 'recuperado');
    const estadoInfo = getEstadoBadgeInfo(estadoNombre);
    const iconName = getCategoriaIconName(objeto.categoria?.nombre);

    const card = document.createElement('div');
    card.id = `objeto-card-${objeto.id}`;
    card.className =
      'bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group card-hover-effect';

    card.innerHTML = `
      <div class="p-5">
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${estadoInfo.clase}">
            ${estadoInfo.icono}
            ${estadoInfo.etiqueta}
          </span>

          <span class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            <i data-lucide="${iconName}" class="w-4 h-4"></i>
            <span class="truncate max-w-[120px]">${objeto.categoria?.nombre || 'General'}</span>
          </span>
        </div>

        <h3
          class="btn-card-title font-bold text-base text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 cursor-pointer mb-2"
          title="${objeto.titulo}"
        >
          ${objeto.titulo}
        </h3>

        <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          ${objeto.descripcion}
        </p>

        <div class="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div class="flex items-center gap-1.5">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
            <span class="truncate font-medium text-slate-700">
              ${objeto.ubicacion?.nombre || 'Campus Universitario Usulután'}
            </span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span class="truncate">
              Edificio: <strong class="text-slate-600">${objeto.ubicacion?.edificio || 'Usulután'}</strong>
            </span>
            <div class="flex items-center gap-1">
              <i data-lucide="calendar" class="w-3 h-3 text-slate-400"></i>
              <span>${formatearFechaCorta(objeto.fecha_reporte)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          id="btn-ver-detalle-${objeto.id}"
          type="button"
          class="btn-card-detalle inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
          <span>Ver detalles</span>
        </button>

        ${
          estadoNombre !== 'recuperado'
            ? `
          <button
            id="btn-reclamar-${objeto.id}"
            type="button"
            class="btn-card-reclamar inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition-colors cursor-pointer"
          >
            <span>Creo que es mío</span>
          </button>
        `
            : ''
        }
      </div>
    `;

    card.querySelector('.btn-card-title').addEventListener('click', () => abrirModalDetalle(objeto));
    card.querySelector('.btn-card-detalle').addEventListener('click', () => abrirModalDetalle(objeto));
    const btnRec = card.querySelector('.btn-card-reclamar');
    if (btnRec) {
      btnRec.addEventListener('click', () => abrirModalReclamo(objeto));
    }

    return card;
  }

  function renderObjectCardsGrid(objetos, container) {
    if (!container) return;
    container.innerHTML = '';
    objetos.forEach((obj) => {
      container.appendChild(crearObjectCardElement(obj));
    });
    refreshIcons();
  }

  // =========================================================================
  // 4. MODALES GLOBALES (<dialog closedby="any"> CON DISEÑO IDÉNTICO AL ORIGINAL)
  // =========================================================================
  function ensureGlobalModals() {
    if (document.getElementById('global-modals-root')) return;

    const root = document.createElement('div');
    root.id = 'global-modals-root';
    root.innerHTML = `
      <!-- MODAL 1: AUTENTICACIÓN (AuthModal.tsx) -->
      <dialog id="dialog-auth-modal" class="cf-dialog" closedby="any" aria-labelledby="auth-modal-title">
        <div id="modal-autenticacion" class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-[92vw] overflow-hidden animate-modal-enter">
          <div class="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <i data-lucide="school" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 id="auth-modal-title" class="font-extrabold text-lg tracking-tight">
                  Campus<span class="text-blue-400">Find</span>
                </h3>
                <p class="text-xs text-slate-400">Portal de Autenticación Universitaria</p>
              </div>
            </div>
            <button id="btn-cerrar-auth-modal" type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="flex border-b border-slate-200">
            <button id="tab-iniciar-sesion" type="button" class="flex-1 py-3 text-xs font-bold text-center border-b-2 border-blue-700 text-blue-700 bg-blue-50/40 transition-colors cursor-pointer">
              Iniciar Sesión
            </button>
            <button id="tab-registrarse" type="button" class="flex-1 py-3 text-xs font-bold text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
              Crear Cuenta Nueva
            </button>
          </div>

          <div class="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            <div id="auth-error-box" style="display:none" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2"></div>

            <!-- Formulario Login -->
            <form id="form-login-modal" class="space-y-4">
              <div>
                <label for="input-login-correo" class="block text-xs font-bold text-slate-700 mb-1">Correo Institucional</label>
                <div class="relative">
                  <i data-lucide="mail" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
                  <input id="input-login-correo" type="email" required placeholder="usuario@campusfind.edu" class="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 outline-none" />
                </div>
              </div>

              <div>
                <label for="input-login-password" class="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
                <div class="relative">
                  <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
                  <input id="input-login-password" type="password" required placeholder="••••••••" class="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 outline-none" />
                </div>
              </div>

              <button id="btn-submit-login" type="submit" class="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 transition-all shadow-md shadow-blue-700/20 cursor-pointer">
                Iniciar Sesión
              </button>

              <!-- Guía desplegable de cuentas registradas -->
              <div class="pt-3 border-t border-slate-100">
                <button id="btn-toggle-credenciales" type="button" class="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 font-semibold py-1 cursor-pointer">
                  <span class="flex items-center gap-1.5">
                    <i data-lucide="key-round" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span>Ver cuentas institucionales registradas</span>
                  </span>
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </button>

                <div id="box-credenciales-demo" class="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <p class="text-[11px] text-slate-500">
                    Haz clic en una cuenta para autocompletar (contraseña: <code class="font-mono font-bold text-slate-700">password123</code>):
                  </p>
                  <div class="grid grid-cols-1 gap-1.5">
                    <button type="button" data-demo-email="admin@campusfind.edu" class="p-2 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 flex items-center justify-between text-left transition-colors cursor-pointer">
                      <div>
                        <span class="font-bold text-slate-800 block">Administrador (Acceso Total + BD CRUD)</span>
                        <span class="text-[11px] text-slate-500 font-mono">admin@campusfind.edu</span>
                      </div>
                      <i data-lucide="shield-check" class="w-4 h-4 text-purple-600 shrink-0"></i>
                    </button>

                    <button type="button" data-demo-email="estudiante@campusfind.edu" class="p-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 flex items-center justify-between text-left transition-colors cursor-pointer">
                      <div>
                        <span class="font-bold text-slate-800 block">Estudiante (Valeria Morales)</span>
                        <span class="text-[11px] text-slate-500 font-mono">estudiante@campusfind.edu</span>
                      </div>
                      <i data-lucide="graduation-cap" class="w-4 h-4 text-blue-600 shrink-0"></i>
                    </button>

                    <button type="button" data-demo-email="docente@campusfind.edu" class="p-2 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center justify-between text-left transition-colors cursor-pointer">
                      <div>
                        <span class="font-bold text-slate-800 block">Docente (Prof. Carlos Méndez)</span>
                        <span class="text-[11px] text-slate-500 font-mono">docente@campusfind.edu</span>
                      </div>
                      <i data-lucide="school" class="w-4 h-4 text-amber-600 shrink-0"></i>
                    </button>

                    <button type="button" data-demo-email="personal@campusfind.edu" class="p-2 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 flex items-center justify-between text-left transition-colors cursor-pointer">
                      <div>
                        <span class="font-bold text-slate-800 block">Personal de Seguridad (Marta Gómez)</span>
                        <span class="text-[11px] text-slate-500 font-mono">personal@campusfind.edu</span>
                      </div>
                      <i data-lucide="briefcase" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <!-- Formulario Registro -->
            <form id="form-registro-modal" style="display:none" class="space-y-3.5">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label for="input-reg-nombre" class="text-xs font-bold text-slate-700">Nombre Completo *</label>
                  <span class="text-[10px] text-slate-400">Solo letras y espacios</span>
                </div>
                <input id="input-reg-nombre" type="text" required placeholder="Ej. Valeria Morales" class="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-700 outline-none" />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label for="input-reg-correo" class="text-xs font-bold text-slate-700">Correo Electrónico *</label>
                  <span class="text-[10px] text-slate-400">usuario@dominio.edu</span>
                </div>
                <input id="input-reg-correo" type="email" required placeholder="nombre@campusfind.edu" class="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-700 outline-none" />
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label for="input-reg-password" class="block text-xs font-bold text-slate-700 mb-1">Contraseña *</label>
                  <input id="input-reg-password" type="password" required minlength="6" placeholder="Mín. 6 caract." class="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-700 outline-none" />
                </div>
                <div>
                  <label for="input-reg-telefono" class="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                  <input id="input-reg-telefono" type="tel" placeholder="Ej. 555-0199" class="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-700 outline-none" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">Rol en la Comunidad Universitaria *</label>
                <select id="input-reg-rol" class="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 bg-white outline-none">
                  <option value="1">Estudiante</option>
                  <option value="2">Docente</option>
                  <option value="3">Personal</option>
                </select>
              </div>

              <button id="btn-submit-registro" type="submit" class="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 transition-all shadow-md shadow-blue-700/20 cursor-pointer">
                Crear Cuenta Universitaria
              </button>
            </form>
          </div>
        </div>
      </dialog>

      <!-- MODAL 2: DETALLE DE OBJETO + MINI MAPA USULUTÁN (ObjectDetailModal.tsx) -->
      <dialog id="dialog-detalle-modal" class="cf-dialog" closedby="any" aria-labelledby="detalle-modal-title">
        <div id="modal-detalle-objeto" class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-[94vw] max-h-[90vh] overflow-y-auto overflow-x-hidden animate-modal-enter">
          <div class="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
            <div>
              <div class="flex items-center gap-2 mb-2 flex-wrap" id="detalle-modal-badges"></div>
              <h2 id="detalle-modal-title" class="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight"></h2>
            </div>
            <button id="btn-cerrar-detalle" type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-6">
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Descripción detallada</h4>
              <div id="detalle-modal-desc" class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 whitespace-pre-line leading-relaxed"></div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <i data-lucide="map-pin" class="w-4 h-4 text-blue-600"></i>
                  <span>Ubicación en el Campus Usulután</span>
                </div>
                <p id="detalle-modal-ubi-nombre" class="text-sm font-semibold text-slate-900"></p>
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                  <i data-lucide="building" class="w-3.5 h-3.5 text-slate-400"></i>
                  <span>Edificio: <strong id="detalle-modal-ubi-edificio" class="text-slate-700"></strong></span>
                </div>
                <p id="detalle-modal-ubi-desc" class="text-xs text-slate-500 italic pt-1 border-t border-slate-100"></p>
              </div>

              <div class="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <i data-lucide="clock" class="w-4 h-4 text-blue-600"></i>
                  <span>Fecha del Reporte</span>
                </div>
                <p id="detalle-modal-fecha" class="text-sm font-semibold text-slate-900 capitalize"></p>
                <div class="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                  <span>Reportado por: <strong id="detalle-modal-usuario" class="text-slate-700"></strong></span>
                </div>
              </div>
            </div>

            <!-- Mini-Mapa de Geolocalización en Usulután -->
            <div class="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <div class="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <i data-lucide="map-pin" class="w-4 h-4 text-rose-600"></i>
                  <span id="detalle-modal-coords-text">Geolocalización en Usulután</span>
                </div>
                <a id="detalle-modal-gmaps" href="#" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                  <span>Abrir en Google Maps</span>
                </a>
              </div>
              <div id="detalle-mini-map-canvas" class="w-full h-48 z-10"></div>
            </div>

            <div id="detalle-custodia-alert" class="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              <i data-lucide="shield-alert" class="w-5 h-5 text-blue-700 shrink-0 mt-0.5"></i>
              <div>
                <p class="font-bold">Custodia Institucional y Entrega Segura</p>
                <p class="text-blue-800 mt-0.5">
                  Los objetos encontrados deben ser reclamados formalmente. Para evitar fraudes, la administración universitaria valida las características particulares antes de autorizar la entrega en caseta de seguridad.
                </p>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <button id="btn-cerrar-detalle-footer" type="button" class="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">
              Cerrar
            </button>
            <div id="detalle-modal-actions"></div>
          </div>
        </div>
      </dialog>

      <!-- MODAL 3: RECLAMAR OBJETO (ClaimModal.tsx) -->
      <dialog id="dialog-reclamo-modal" class="cf-dialog" closedby="any" aria-labelledby="reclamo-modal-title">
        <div id="modal-formulario-reclamacion" class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-[92vw] overflow-hidden animate-modal-enter">
          <div class="p-6 border-b border-slate-100 flex items-start justify-between bg-blue-50/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-700/20">
                <i data-lucide="shield-check" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 id="reclamo-modal-title" class="font-extrabold text-lg text-slate-900">Reclamar Objeto</h3>
                <p id="reclamo-modal-subtitle" class="text-xs text-slate-500 truncate max-w-[280px]"></p>
              </div>
            </div>
            <button id="btn-cerrar-reclamo" type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form id="form-reclamo-modal" class="p-6 space-y-4">
            <input type="hidden" id="reclamo-objeto-id" />
            <div class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div class="flex items-center gap-1.5 font-bold mb-1">
                <i data-lucide="alert-circle" class="w-4 h-4 text-amber-700 shrink-0"></i>
                <span>¿Cómo validamos la propiedad?</span>
              </div>
              <p class="text-amber-800 leading-relaxed">
                Describe detalles específicos que no aparezcan en el título general: marcas de uso particulares, calcomanías, número de serie o contenido interno de bolsillos/carpetas.
              </p>
            </div>

            <div id="reclamo-error-box" style="display:none" class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"></div>

            <div>
              <label for="input-descripcion-reclamacion" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Evidencias y Detalles Específicos *
              </label>
              <textarea
                id="input-descripcion-reclamacion"
                required
                rows="4"
                placeholder="Ejemplo: Tiene un rayón en la esquina superior izquierda, la funda es de marca Spigen y dentro de la calculadora hay anotada una fórmula..."
                class="w-full text-sm rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 p-3 outline-none transition-all placeholder:text-slate-400"
              ></textarea>
            </div>

            <div class="pt-2 flex items-center justify-end gap-3">
              <button id="btn-cancelar-reclamo" type="button" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                Cancelar
              </button>
              <button id="btn-confirmar-reclamacion" type="submit" class="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-700/20 transition-all cursor-pointer">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                <span>Confirmar Reclamación</span>
              </button>
            </div>
          </form>
        </div>
      </dialog>
    `;

    document.body.appendChild(root);

    // Fallback obligatorio para <dialog closedby="any">
    root.querySelectorAll('dialog.cf-dialog').forEach((dialog) => {
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

    // Eventos Auth Modal
    const dlgAuth = document.getElementById('dialog-auth-modal');
    document.getElementById('btn-cerrar-auth-modal').addEventListener('click', () => dlgAuth.close());

    const tabLogin = document.getElementById('tab-iniciar-sesion');
    const tabReg = document.getElementById('tab-registrarse');
    const formLogin = document.getElementById('form-login-modal');
    const formReg = document.getElementById('form-registro-modal');
    const errBox = document.getElementById('auth-error-box');

    tabLogin.addEventListener('click', () => {
      errBox.style.display = 'none';
      formLogin.style.display = 'block';
      formReg.style.display = 'none';
      tabLogin.className = 'flex-1 py-3 text-xs font-bold text-center border-b-2 border-blue-700 text-blue-700 bg-blue-50/40 transition-colors cursor-pointer';
      tabReg.className = 'flex-1 py-3 text-xs font-bold text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors cursor-pointer';
    });

    tabReg.addEventListener('click', () => {
      errBox.style.display = 'none';
      formLogin.style.display = 'none';
      formReg.style.display = 'block';
      tabReg.className = 'flex-1 py-3 text-xs font-bold text-center border-b-2 border-blue-700 text-blue-700 bg-blue-50/40 transition-colors cursor-pointer';
      tabLogin.className = 'flex-1 py-3 text-xs font-bold text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors cursor-pointer';
    });

    document.getElementById('btn-toggle-credenciales').addEventListener('click', () => {
      const box = document.getElementById('box-credenciales-demo');
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });

    document.querySelectorAll('[data-demo-email]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('input-login-correo').value = btn.getAttribute('data-demo-email');
        document.getElementById('input-login-password').value = 'password123';
        formLogin.requestSubmit();
      });
    });

    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.style.display = 'none';
      const correo = document.getElementById('input-login-correo').value.trim();
      const pass = document.getElementById('input-login-password').value;

      if (!REGEX_CORREO.test(correo)) {
        errBox.textContent = 'Por favor ingresa un correo electrónico con formato válido.';
        errBox.style.display = 'flex';
        return;
      }

      try {
        const res = await window.CampusFindAPI.auth.login(correo, pass);
        localStorage.setItem('campus_find_token', res.token);
        localStorage.setItem('campus_find_user', JSON.stringify(res.usuario));
        dlgAuth.close();
        window.location.reload();
      } catch (err) {
        errBox.textContent = err.message || 'Credenciales incorrectas.';
        errBox.style.display = 'flex';
      }
    });

    formReg.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.style.display = 'none';
      const nombre = document.getElementById('input-reg-nombre').value.trim();
      const correo = document.getElementById('input-reg-correo').value.trim();
      const contraseña = document.getElementById('input-reg-password').value;
      const telefono = document.getElementById('input-reg-telefono').value.trim();
      const tipo_usuario_id = Number(document.getElementById('input-reg-rol').value);

      if (!REGEX_NOMBRE.test(nombre)) {
        errBox.textContent = 'El nombre completo solo debe contener letras y espacios (mínimo 3 caracteres).';
        errBox.style.display = 'flex';
        return;
      }
      if (!REGEX_CORREO.test(correo)) {
        errBox.textContent = 'Ingresa un correo electrónico válido.';
        errBox.style.display = 'flex';
        return;
      }
      if (telefono && !REGEX_TELEFONO.test(telefono)) {
        errBox.textContent = 'El teléfono debe contener entre 7 y 20 dígitos válidos.';
        errBox.style.display = 'flex';
        return;
      }

      try {
        const res = await window.CampusFindAPI.auth.registro({
          nombre,
          correo,
          contraseña,
          telefono,
          tipo_usuario_id,
        });
        localStorage.setItem('campus_find_token', res.token);
        localStorage.setItem('campus_find_user', JSON.stringify(res.usuario));
        dlgAuth.close();
        window.location.reload();
      } catch (err) {
        errBox.textContent = err.message || 'Error al registrar cuenta.';
        errBox.style.display = 'flex';
      }
    });

    // Eventos Detalle Modal
    const dlgDetalle = document.getElementById('dialog-detalle-modal');
    document.getElementById('btn-cerrar-detalle').addEventListener('click', () => dlgDetalle.close());
    document.getElementById('btn-cerrar-detalle-footer').addEventListener('click', () => dlgDetalle.close());

    // Eventos Reclamo Modal
    const dlgReclamo = document.getElementById('dialog-reclamo-modal');
    document.getElementById('btn-cerrar-reclamo').addEventListener('click', () => dlgReclamo.close());
    document.getElementById('btn-cancelar-reclamo').addEventListener('click', () => dlgReclamo.close());

    document.getElementById('form-reclamo-modal').addEventListener('submit', async (e) => {
      e.preventDefault();
      const recErr = document.getElementById('reclamo-error-box');
      recErr.style.display = 'none';
      const objeto_id = Number(document.getElementById('reclamo-objeto-id').value);
      const descripcion = document.getElementById('input-descripcion-reclamacion').value.trim();

      if (descripcion.length < 10) {
        recErr.textContent = 'Por favor detalla con mayor precisión las evidencias (mínimo 10 caracteres).';
        recErr.style.display = 'block';
        return;
      }

      try {
        await window.CampusFindAPI.reclamaciones.crear({ objeto_id, descripcion });
        dlgReclamo.close();
        window.location.href = getRouteUrl('mis-reclamaciones');
      } catch (err) {
        recErr.textContent = err.message || 'Error al enviar la reclamación.';
        recErr.style.display = 'block';
      }
    });

    refreshIcons();
  }

  function abrirModalAuth() {
    ensureGlobalModals();
    const dlg = document.getElementById('dialog-auth-modal');
    if (dlg) dlg.showModal();
    refreshIcons();
  }

  function abrirModalDetalle(objeto) {
    ensureGlobalModals();
    const usuario = getUsuarioActual();
    const esAdmin = esAdminActual();
    const esDuenio = usuario && usuario.id === objeto.usuario_id;
    const estadoNombre =
      objeto.estado?.nombre ||
      (objeto.estado_id === 1 ? 'perdido' : objeto.estado_id === 2 ? 'encontrado' : 'recuperado');
    const esRecuperado = estadoNombre === 'recuperado';
    const estadoInfo = getEstadoBadgeInfo(estadoNombre);

    document.getElementById('detalle-modal-badges').innerHTML = `
      <span class="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${estadoInfo.clase}">
        ${estadoInfo.icono}
        Objeto ${estadoNombre.toUpperCase()}
      </span>
      <span class="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
        <i data-lucide="tag" class="w-3 h-3 text-blue-600"></i>
        <span>${objeto.categoria?.nombre || 'General'}</span>
      </span>
    `;

    document.getElementById('detalle-modal-title').textContent = objeto.titulo;
    document.getElementById('detalle-modal-desc').textContent = objeto.descripcion;
    document.getElementById('detalle-modal-ubi-nombre').textContent =
      objeto.ubicacion?.nombre || 'Campus Universitario Usulután';
    document.getElementById('detalle-modal-ubi-edificio').textContent =
      objeto.ubicacion?.edificio || 'Sede Usulután';
    document.getElementById('detalle-modal-ubi-desc').textContent =
      objeto.ubicacion?.descripcion || '';

    try {
      const f = new Date(objeto.fecha_reporte);
      document.getElementById('detalle-modal-fecha').textContent = f.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      document.getElementById('detalle-modal-fecha').textContent = objeto.fecha_reporte;
    }

    document.getElementById('detalle-modal-usuario').textContent =
      esAdmin || esDuenio
        ? objeto.usuario?.nombre || 'Usuario Universitario'
        : `${(objeto.usuario?.nombre || 'Miembro').split(' ')[0]} (Miembro Universitario)`;

    const coords = window.CampusFindGeo.obtenerCoordenadasObjeto(objeto);
    document.getElementById('detalle-modal-coords-text').textContent = `Geolocalización en Usulután (${coords.lat.toFixed(
      5
    )}, ${coords.lng.toFixed(5)})`;
    document.getElementById(
      'detalle-modal-gmaps'
    ).href = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

    document.getElementById('detalle-custodia-alert').style.display =
      estadoNombre === 'encontrado' ? 'flex' : 'none';

    const actionsDiv = document.getElementById('detalle-modal-actions');
    if (!esRecuperado && !esDuenio) {
      actionsDiv.innerHTML = `
        <button id="btn-iniciar-reclamo-modal" type="button" class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-700/20 transition-all hover:scale-[1.02] cursor-pointer">
          <i data-lucide="sparkles" class="w-4 h-4"></i>
          <span>Creo que es mío (Reclamar)</span>
        </button>
      `;
      document.getElementById('btn-iniciar-reclamo-modal').addEventListener('click', () => {
        document.getElementById('dialog-detalle-modal').close();
        abrirModalReclamo(objeto);
      });
    } else if (esDuenio) {
      actionsDiv.innerHTML = `<span class="text-xs font-semibold text-slate-500 bg-slate-200 px-3 py-1.5 rounded-lg">Tú reportaste este objeto</span>`;
    } else {
      actionsDiv.innerHTML = `<span class="text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg">✓ Objeto devuelto a su dueño</span>`;
    }

    const dlg = document.getElementById('dialog-detalle-modal');
    dlg.showModal();
    refreshIcons();

    if (window.L) {
      setTimeout(() => {
        const mapEl = document.getElementById('detalle-mini-map-canvas');
        if (!mapEl) return;
        if (detailMiniMap) {
          detailMiniMap.remove();
          detailMiniMap = null;
        }
        detailMiniMap = window.L.map(mapEl, {
          center: [coords.lat, coords.lng],
          zoom: 17,
        });
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap | Usulután',
          maxZoom: 19,
        }).addTo(detailMiniMap);
        window.L.marker([coords.lat, coords.lng])
          .addTo(detailMiniMap)
          .bindPopup(`<strong>${objeto.titulo}</strong><br/><span style="font-size:11px">${objeto.ubicacion?.edificio || 'Campus Usulután'}</span>`)
          .openPopup();
        detailMiniMap.invalidateSize();
      }, 150);
    }
  }

  function abrirModalReclamo(objeto) {
    ensureGlobalModals();
    const usuario = getUsuarioActual();
    if (!usuario) {
      abrirModalAuth();
      return;
    }
    document.getElementById('reclamo-objeto-id').value = String(objeto.id);
    document.getElementById('reclamo-modal-subtitle').textContent = objeto.titulo;
    document.getElementById('input-descripcion-reclamacion').value = '';
    document.getElementById('reclamo-error-box').style.display = 'none';
    const dlg = document.getElementById('dialog-reclamo-modal');
    dlg.showModal();
    refreshIcons();
  }

  window.CampusFindLayout = {
    getRouteUrl,
    getUsuarioActual,
    esAdminActual,
    refreshIcons,
    renderNavbar,
    renderFooter,
    crearObjectCardElement,
    renderObjectCardsGrid,
    abrirModalAuth,
    abrirModalDetalle,
    abrirModalReclamo,
  };
})(window);
