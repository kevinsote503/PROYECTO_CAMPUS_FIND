/**
 * @file api.ts
 * @description Cliente de comunicación HTTP con la API RESTful de Campus Find.
 */

import {
  Usuario,
  Objeto,
  Categoria,
  Ubicacion,
  TipoUsuario,
  Reclamacion,
  Entrega,
  Estadisticas,
  EsquemaNormalizadoResponse,
} from '../types';

const API_BASE = '/api';

/**
 * Función auxiliar para realizar peticiones HTTP con manejo de tokens y errores
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('campus_find_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.mensaje || data?.error || `Error en la petición: ${response.status} ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Autenticación
  auth: {
    login: (correo: string, contraseña: string) =>
      request<{ success: boolean; token: string; usuario: Usuario }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo, contraseña }),
      }),

    registro: (payload: {
      nombre: string;
      correo: string;
      contraseña: string;
      telefono?: string;
      tipo_usuario_id: number;
    }) =>
      request<{ success: boolean; token: string; usuario: Usuario }>('/auth/registro', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    perfil: () =>
      request<{ success: boolean; usuario: Usuario }>('/auth/perfil'),

    tipos: () =>
      request<{ success: boolean; tipos: TipoUsuario[] }>('/auth/tipos'),
  },

  // Usuarios (Formulario CRUD #2 + Búsqueda interactiva)
  usuarios: {
    listar: (filtros?: { texto?: string; tipo_usuario_id?: string }) => {
      const params = new URLSearchParams();
      if (filtros?.texto) params.append('texto', filtros.texto);
      if (filtros?.tipo_usuario_id) params.append('tipo_usuario_id', filtros.tipo_usuario_id);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; total: number; usuarios: Usuario[] }>(`/usuarios${qs}`);
    },

    crear: (data: {
      nombre: string;
      correo: string;
      contraseña?: string;
      telefono?: string;
      tipo_usuario_id: number;
    }) =>
      request<{ success: boolean; mensaje: string; usuario: Usuario }>('/usuarios', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    actualizar: (
      id: number,
      data: Partial<{
        nombre: string;
        correo: string;
        contraseña?: string;
        telefono?: string;
        tipo_usuario_id: number;
      }>
    ) =>
      request<{ success: boolean; mensaje: string; usuario: Usuario }>(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    eliminar: (id: number) =>
      request<{ success: boolean; mensaje: string }>(`/usuarios/${id}`, {
        method: 'DELETE',
      }),
  },

  // Objetos (Formulario CRUD #1 + Búsqueda interactiva)
  objetos: {
    listar: (limite = 50, estado?: number) => {
      const query = estado ? `?limite=${limite}&estado=${estado}` : `?limite=${limite}`;
      return request<{ success: boolean; total: number; objetos: Objeto[] }>(`/objetos${query}`);
    },

    buscar: (filtros: { categoria?: string; ubicacion?: string; estado?: string; texto?: string }) => {
      const params = new URLSearchParams();
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.ubicacion) params.append('ubicacion', filtros.ubicacion);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.texto) params.append('texto', filtros.texto);

      return request<{ success: boolean; total: number; objetos: Objeto[] }>(
        `/objetos/buscar?${params.toString()}`
      );
    },

    coincidencias: (filtros: {
      categoria_id: number;
      ubicacion_id?: number;
      estado_id: number;
      titulo?: string;
    }) => {
      const params = new URLSearchParams();
      params.append('categoria_id', String(filtros.categoria_id));
      params.append('estado_id', String(filtros.estado_id));
      if (filtros.ubicacion_id) params.append('ubicacion_id', String(filtros.ubicacion_id));
      if (filtros.titulo) params.append('titulo', filtros.titulo);

      return request<{ success: boolean; total: number; coincidencias: Objeto[] }>(
        `/objetos/coincidencias?${params.toString()}`
      );
    },

    obtenerPorId: (id: number) =>
      request<{ success: boolean; objeto: Objeto }>(`/objetos/${id}`),

    misReportes: () =>
      request<{ success: boolean; total: number; objetos: Objeto[] }>('/objetos/mis-reportes'),

    crear: (data: {
      categoria_id: number;
      ubicacion_id: number;
      estado_id: number;
      titulo: string;
      descripcion: string;
      fecha_reporte?: string;
      latitud?: number | null;
      longitud?: number | null;
    }) =>
      request<{ success: boolean; mensaje: string; objeto: Objeto }>('/objetos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    actualizar: (
      id: number,
      data: Partial<{
        categoria_id: number;
        ubicacion_id: number;
        estado_id: number;
        titulo: string;
        descripcion: string;
        fecha_reporte: string;
        latitud: number | null;
        longitud: number | null;
      }>
    ) =>
      request<{ success: boolean; mensaje: string; objeto: Objeto }>(`/objetos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    eliminar: (id: number) =>
      request<{ success: boolean; mensaje: string }>(`/objetos/${id}`, {
        method: 'DELETE',
      }),
  },

  // Categorías (CRUD completo + búsqueda)
  categorias: {
    listar: (texto?: string) => {
      const qs = texto ? `?texto=${encodeURIComponent(texto)}` : '';
      return request<{ success: boolean; total?: number; categorias: Categoria[] }>(`/categorias${qs}`);
    },

    crear: (nombre: string) =>
      request<{ success: boolean; mensaje: string; categoria: Categoria }>('/categorias', {
        method: 'POST',
        body: JSON.stringify({ nombre }),
      }),

    actualizar: (id: number, nombre: string) =>
      request<{ success: boolean; mensaje: string; categoria: Categoria }>(`/categorias/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre }),
      }),

    eliminar: (id: number) =>
      request<{ success: boolean; mensaje: string }>(`/categorias/${id}`, {
        method: 'DELETE',
      }),
  },

  // Ubicaciones (Formulario CRUD #3 + búsqueda interactiva)
  ubicaciones: {
    listar: (filtros?: { texto?: string; edificio?: string }) => {
      const params = new URLSearchParams();
      if (filtros?.texto) params.append('texto', filtros.texto);
      if (filtros?.edificio) params.append('edificio', filtros.edificio);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; total?: number; ubicaciones: Ubicacion[] }>(`/ubicaciones${qs}`);
    },

    crear: (data: { nombre: string; edificio: string; descripcion?: string; latitud?: number; longitud?: number }) =>
      request<{ success: boolean; mensaje: string; ubicacion: Ubicacion }>('/ubicaciones', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    actualizar: (id: number, data: Partial<{ nombre: string; edificio: string; descripcion?: string; latitud?: number; longitud?: number }>) =>
      request<{ success: boolean; mensaje: string; ubicacion: Ubicacion }>(`/ubicaciones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    eliminar: (id: number) =>
      request<{ success: boolean; mensaje: string }>(`/ubicaciones/${id}`, {
        method: 'DELETE',
      }),
  },

  // Reclamaciones (CRUD completo + búsqueda)
  reclamaciones: {
    listar: (filtros?: { texto?: string; estado_reclamacion_id?: string }) => {
      const params = new URLSearchParams();
      if (filtros?.texto) params.append('texto', filtros.texto);
      if (filtros?.estado_reclamacion_id) params.append('estado_reclamacion_id', filtros.estado_reclamacion_id);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; total: number; reclamaciones: Reclamacion[] }>(`/reclamaciones${qs}`);
    },

    misReclamaciones: () =>
      request<{ success: boolean; total: number; reclamaciones: Reclamacion[] }>(
        '/reclamaciones/mis-reclamaciones'
      ),

    crear: (data: { objeto_id: number; descripcion: string }) =>
      request<{ success: boolean; mensaje: string; reclamacion: Reclamacion }>('/reclamaciones', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    actualizarEstado: (id: number, estado_reclamacion_id: number) =>
      request<{ success: boolean; mensaje: string; reclamacion: Reclamacion }>(
        `/reclamaciones/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ estado_reclamacion_id }),
        }
      ),

    actualizar: (id: number, data: { descripcion?: string; estado_reclamacion_id?: number }) =>
      request<{ success: boolean; mensaje: string; reclamacion: Reclamacion }>(
        `/reclamaciones/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),

    eliminar: (id: number) =>
      request<{ success: boolean; mensaje: string }>(`/reclamaciones/${id}`, {
        method: 'DELETE',
      }),
  },

  // Entregas
  entregas: {
    listar: () =>
      request<{ success: boolean; total: number; entregas: Entrega[] }>('/entregas'),

    registrar: (data: { reclamacion_id: number; observaciones?: string; fecha?: string }) =>
      request<{ success: boolean; mensaje: string; entrega: Entrega }>('/entregas', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Estadísticas y Esquema BD 3FN
  stats: {
    obtener: () =>
      request<{ success: boolean; estadisticas: Estadisticas }>('/stats'),

    esquema: () =>
      request<EsquemaNormalizadoResponse>('/stats/esquema'),
  },
};

export default api;
