/**
 * @file buscar.js
 * @description Controlador en JavaScript puro para la página de Búsqueda Avanzada (pages/buscar/index.html).
 */

(function () {
  'use strict';

  let timeoutBusqueda = null;

  async function ejecutarBusqueda() {
    const texto = document.getElementById('input-buscar-texto').value.trim();
    const categoria = document.getElementById('select-filtro-categoria').value;
    const ubicacion = document.getElementById('select-filtro-ubicacion').value;
    const estado = document.getElementById('select-filtro-estado').value;

    const hayFiltros = Boolean(texto || categoria !== 'todas' || ubicacion !== 'todas' || estado !== 'todos');
    document.getElementById('badge-filtros-activos').style.display = hayFiltros ? 'inline' : 'none';

    const loadingEl = document.getElementById('buscar-loading');
    const emptyEl = document.getElementById('buscar-empty');
    const gridEl = document.getElementById('buscar-grid');

    try {
      const res = await window.CampusFindAPI.objetos.buscar({
        texto: texto || undefined,
        categoria,
        ubicacion,
        estado,
      });

      if (loadingEl) loadingEl.style.display = 'none';
      const objetos = res.objetos || [];
      document.getElementById('count-objetos-encontrados').textContent = String(objetos.length);

      if (objetos.length === 0) {
        gridEl.innerHTML = '';
        emptyEl.style.display = 'block';
      } else {
        emptyEl.style.display = 'none';
        window.CampusFindLayout.renderObjectCardsGrid(objetos, gridEl);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
    }
  }

  function limpiarFiltros() {
    document.getElementById('input-buscar-texto').value = '';
    document.getElementById('select-filtro-categoria').value = 'todas';
    document.getElementById('select-filtro-ubicacion').value = 'todas';
    document.getElementById('select-filtro-estado').value = 'todos';
    ejecutarBusqueda();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    window.CampusFindLayout.renderNavbar('buscar');
    window.CampusFindLayout.renderFooter();

    // Leer parámetros iniciales de la URL (?texto=&categoria=)
    const urlParams = new URLSearchParams(window.location.search);
    const textoInicial = urlParams.get('texto') || '';
    const catInicial = urlParams.get('categoria') || 'todas';

    document.getElementById('input-buscar-texto').value = textoInicial;

    try {
      const [resCat, resUbi] = await Promise.all([
        window.CampusFindAPI.categorias.listar(),
        window.CampusFindAPI.ubicaciones.listar(),
      ]);

      const selCat = document.getElementById('select-filtro-categoria');
      (resCat.categorias || []).forEach((c) => {
        const opt = document.createElement('option');
        opt.value = String(c.id);
        opt.textContent = c.nombre;
        selCat.appendChild(opt);
      });
      if (catInicial !== 'todas') {
        selCat.value = catInicial;
      }

      const selUbi = document.getElementById('select-filtro-ubicacion');
      (resUbi.ubicaciones || []).forEach((u) => {
        const opt = document.createElement('option');
        opt.value = String(u.id);
        opt.textContent = `${u.edificio} - ${u.nombre}`;
        selUbi.appendChild(opt);
      });
    } catch (err) {
      console.error('Error cargando filtros:', err);
    }

    ejecutarBusqueda();

    document.getElementById('input-buscar-texto').addEventListener('input', () => {
      clearTimeout(timeoutBusqueda);
      timeoutBusqueda = setTimeout(ejecutarBusqueda, 220);
    });

    ['select-filtro-categoria', 'select-filtro-ubicacion', 'select-filtro-estado'].forEach((id) => {
      document.getElementById(id).addEventListener('change', ejecutarBusqueda);
    });

    document.getElementById('btn-limpiar-filtros').addEventListener('click', limpiarFiltros);
    document.getElementById('btn-restablecer-empty').addEventListener('click', limpiarFiltros);
  });
})();
