/**
 * @file api.js
 * @description Cliente modular de comunicación HTTP con la API RESTful de Campus Find (SQLite 3FN)
 *              y utilidades de geolocalización de Usulután, El Salvador.
 */

(function (window) {
  'use strict';

  const API_BASE = window.location.port === '3000' ? '/api' : 'http://localhost:3000/api';

  // Coordenadas oficiales de referencia en Usulután, El Salvador
  const USULUTAN_COORDS_FALLBACK = {
    1: { lat: 13.3468, lng: -88.4205 }, // Biblioteca Central - Campus Usulután
    2: { lat: 13.3462, lng: -88.4212 }, // Cafetería Principal - Campus Usulután
    3: { lat: 13.3473, lng: -88.4198 }, // Lab Cómputo 102 - Facultad Ingeniería Usulután
    4: { lat: 13.3456, lng: -88.4220 }, // Complejo Polideportivo Usulután
    5: { lat: 13.3470, lng: -88.4215 }, // Auditorio Mayor y Rectoría Usulután
    6: { lat: 13.3446, lng: -88.4368 }, // Plaza Central / Centro de Usulután
    7: { lat: 13.3465, lng: -88.4195 }, // Edificio Aulas A3 - Campus Usulután
  };

  async function request(endpoint, options = {}) {
    const token = localStorage.getItem('campus_find_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const errorMsg = data?.mensaje || data?.error || `Error HTTP ${response.status}`;
      throw new Error(errorMsg);
    }
    return data;
  }

  function obtenerCoordenadasObjeto(obj) {
    if (obj && obj.latitud && obj.longitud && !isNaN(Number(obj.latitud)) && !isNaN(Number(obj.longitud))) {
      return { lat: Number(obj.latitud), lng: Number(obj.longitud) };
    }
    if (obj && obj.ubicacion && obj.ubicacion.latitud && obj.ubicacion.longitud) {
      const offsetLat = ((obj.id % 5) - 2) * 0.0001;
      const offsetLng = ((obj.id % 3) - 1) * 0.0001;
      return {
        lat: Number(obj.ubicacion.latitud) + offsetLat,
        lng: Number(obj.ubicacion.longitud) + offsetLng,
      };
    }
    const base = USULUTAN_COORDS_FALLBACK[obj?.ubicacion_id] || USULUTAN_COORDS_FALLBACK[1];
    const offsetLat = (((obj?.id || 1) % 5) - 2) * 0.0001;
    const offsetLng = (((obj?.id || 1) % 3) - 1) * 0.0001;
    return { lat: base.lat + offsetLat, lng: base.lng + offsetLng };
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

  window.CampusFindGeo = {
    USULUTAN_COORDS_FALLBACK,
    CENTRO_CAMPUS_USULUTAN: [13.3466, -88.4208],
    CENTRO_CIUDAD_USULUTAN: [13.3444, -88.4385],
    VISTA_GENERAL_USULUTAN: [13.3458, -88.4285],
    obtenerCoordenadasObjeto,
    calcularDistanciaKm,
  };

  window.CampusFindAPI = {
    auth: {
      login: (correo, contraseña) =>
        request('/auth/login', { method: 'POST', body: JSON.stringify({ correo, contraseña }) }),
      registro: (payload) =>
        request('/auth/registro', { method: 'POST', body: JSON.stringify(payload) }),
      perfil: () => request('/auth/perfil'),
      tipos: () => request('/auth/tipos'),
    },
    usuarios: {
      listar: (filtros = {}) => {
        const params = new URLSearchParams();
        if (filtros.texto) params.append('texto', filtros.texto);
        if (filtros.tipo_usuario_id) params.append('tipo_usuario_id', filtros.tipo_usuario_id);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return request(`/usuarios${qs}`);
      },
      crear: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
      actualizar: (id, data) => request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      eliminar: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
    },
    objetos: {
      listar: (limite = 50, estado) => {
        const query = estado ? `?limite=${limite}&estado=${estado}` : `?limite=${limite}`;
        return request(`/objetos${query}`);
      },
      buscar: (filtros = {}) => {
        const params = new URLSearchParams();
        if (filtros.categoria && filtros.categoria !== 'todas') params.append('categoria', filtros.categoria);
        if (filtros.ubicacion && filtros.ubicacion !== 'todas') params.append('ubicacion', filtros.ubicacion);
        if (filtros.estado && filtros.estado !== 'todos') params.append('estado', filtros.estado);
        if (filtros.texto) params.append('texto', filtros.texto);
        return request(`/objetos/buscar?${params.toString()}`);
      },
      coincidencias: (filtros) => {
        const params = new URLSearchParams();
        params.append('categoria_id', String(filtros.categoria_id));
        params.append('estado_id', String(filtros.estado_id));
        if (filtros.ubicacion_id) params.append('ubicacion_id', String(filtros.ubicacion_id));
        if (filtros.titulo) params.append('titulo', filtros.titulo);
        return request(`/objetos/coincidencias?${params.toString()}`);
      },
      obtenerPorId: (id) => request(`/objetos/${id}`),
      misReportes: () => request('/objetos/mis-reportes'),
      crear: (data) => request('/objetos', { method: 'POST', body: JSON.stringify(data) }),
      actualizar: (id, data) => request(`/objetos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      eliminar: (id) => request(`/objetos/${id}`, { method: 'DELETE' }),
    },
    categorias: {
      listar: (texto) => {
        const qs = texto ? `?texto=${encodeURIComponent(texto)}` : '';
        return request(`/categorias${qs}`);
      },
      crear: (nombre) => request('/categorias', { method: 'POST', body: JSON.stringify({ nombre }) }),
      actualizar: (id, nombre) => request(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
      eliminar: (id) => request(`/categorias/${id}`, { method: 'DELETE' }),
    },
    ubicaciones: {
      listar: (filtros = {}) => {
        const params = new URLSearchParams();
        if (filtros.texto) params.append('texto', filtros.texto);
        if (filtros.edificio) params.append('edificio', filtros.edificio);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return request(`/ubicaciones${qs}`);
      },
      crear: (data) => request('/ubicaciones', { method: 'POST', body: JSON.stringify(data) }),
      actualizar: (id, data) => request(`/ubicaciones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      eliminar: (id) => request(`/ubicaciones/${id}`, { method: 'DELETE' }),
    },
    reclamaciones: {
      listar: (filtros = {}) => {
        const params = new URLSearchParams();
        if (filtros.texto) params.append('texto', filtros.texto);
        if (filtros.estado_reclamacion_id) params.append('estado_reclamacion_id', filtros.estado_reclamacion_id);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return request(`/reclamaciones${qs}`);
      },
      misReclamaciones: () => request('/reclamaciones/mis-reclamaciones'),
      crear: (data) => request('/reclamaciones', { method: 'POST', body: JSON.stringify(data) }),
      actualizarEstado: (id, estado_reclamacion_id) =>
        request(`/reclamaciones/${id}`, { method: 'PUT', body: JSON.stringify({ estado_reclamacion_id }) }),
      actualizar: (id, data) => request(`/reclamaciones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      eliminar: (id) => request(`/reclamaciones/${id}`, { method: 'DELETE' }),
    },
    entregas: {
      listar: () => request('/entregas'),
      registrar: (data) => request('/entregas', { method: 'POST', body: JSON.stringify(data) }),
    },
    stats: {
      obtener: () => request('/stats'),
      esquema: () => request('/stats/esquema'),
    },
  };

  window.CampusFindGeo = {
    CENTRO_CAMPUS_USULUTAN: [13.3466, -88.4208],
    CENTRO_CIUDAD_USULUTAN: [13.3444, -88.4385],
    VISTA_GENERAL_USULUTAN: [13.3458, -88.4285],
    USULUTAN_COORDS_FALLBACK,
    obtenerCoordenadasObjeto,
    calcularDistanciaKm,
  };
})(window);
