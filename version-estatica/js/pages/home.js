/**
 * @file home.js
 * @description Controlador en JavaScript puro para la página de Inicio (index.html).
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    window.CampusFindLayout.renderNavbar('inicio');
    window.CampusFindLayout.renderFooter();

    // Si es administrador, mostrar botón directo al Centro CRUD en el Hero (idéntico a HomePage.tsx)
    if (window.CampusFindLayout.esAdminActual()) {
      const heroActions = document.getElementById('hero-actions-container');
      const btnCrud = document.createElement('a');
      btnCrud.id = 'btn-ir-crud-hero';
      btnCrud.href = './pages/crud/index.html';
      btnCrud.className =
        'inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 text-sm font-bold shadow-lg transition-all hover:scale-[1.02] no-underline';
      btnCrud.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Gestión de Base de Datos (CRUD)</span>`;
      heroActions.appendChild(btnCrud);
      window.CampusFindLayout.refreshIcons();
    }

    // Buscador del Hero
    document.getElementById('form-buscador-hero').addEventListener('submit', (e) => {
      e.preventDefault();
      const texto = document.getElementById('input-buscador-hero').value.trim();
      const params = texto ? `texto=${encodeURIComponent(texto)}` : '';
      window.location.href = window.CampusFindLayout.getRouteUrl('buscar', params);
    });

    try {
      const [resObjetos, resCategorias, resStats] = await Promise.all([
        window.CampusFindAPI.objetos.listar(6),
        window.CampusFindAPI.categorias.listar(),
        window.CampusFindAPI.stats.obtener(),
      ]);

      if (resStats && resStats.estadisticas) {
        const s = resStats.estadisticas;
        document.getElementById('stat-total-objetos').textContent = s.totalObjetos;
        document.getElementById('stat-total-perdidos').textContent = s.totalPerdidos;
        document.getElementById('stat-total-encontrados').textContent = s.totalEncontrados;
        document.getElementById('stat-tasa-recuperacion').textContent = `${s.tasaRecuperacion}%`;
      }

      if (resCategorias && resCategorias.categorias) {
        const catContainer = document.getElementById('home-categorias-list');
        catContainer.innerHTML = '';
        resCategorias.categorias.forEach((cat) => {
          const btn = document.createElement('a');
          btn.href = `./pages/buscar/index.html?categoria=${cat.id}`;
          btn.className =
            'px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-xs font-semibold text-slate-700 hover:text-blue-700 shrink-0 transition-all shadow-xs no-underline';
          btn.textContent = cat.nombre;
          catContainer.appendChild(btn);
        });
      }

      const loadingEl = document.getElementById('home-recent-loading');
      const gridEl = document.getElementById('home-recent-grid');
      if (loadingEl) loadingEl.style.display = 'none';

      if (resObjetos && resObjetos.objetos && resObjetos.objetos.length > 0) {
        window.CampusFindLayout.renderObjectCardsGrid(resObjetos.objetos, gridEl);
      } else {
        gridEl.innerHTML = `
          <div class="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            Aún no hay objetos reportados en el sistema.
          </div>
        `;
      }
    } catch (err) {
      console.error('Error al cargar portada:', err);
    }
  });
})();
