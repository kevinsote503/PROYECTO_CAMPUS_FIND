/**
 * @file types.ts
 * @description Definiciones de tipos e interfaces para el frontend de Campus Find.
 */

export interface TipoUsuario {
  id: number;
  nombre: 'estudiante' | 'docente' | 'personal' | 'administrador' | string;
}

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  telefono?: string;
  tipo_usuario_id: number;
  rol: string;
  tipo_usuario?: TipoUsuario;
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Ubicacion {
  id: number;
  nombre: string;
  edificio: string;
  descripcion?: string;
  latitud?: number | null;
  longitud?: number | null;
}

export interface Estado {
  id: number;
  nombre: 'perdido' | 'encontrado' | 'recuperado' | string;
}

export interface EstadoReclamacion {
  id: number;
  nombre: 'pendiente' | 'aprobada' | 'rechazada' | string;
}

export interface Objeto {
  id: number;
  usuario_id: number;
  categoria_id: number;
  ubicacion_id: number;
  estado_id: number;
  titulo: string;
  descripcion: string;
  fecha_reporte: string;
  latitud?: number | null;
  longitud?: number | null;
  categoria?: Categoria;
  ubicacion?: Ubicacion;
  estado?: Estado;
  usuario?: {
    id: number;
    nombre: string;
    correo: string;
    telefono?: string;
  };
  reclamaciones?: Reclamacion[];
}

export interface Reclamacion {
  id: number;
  objeto_id: number;
  usuario_id: number;
  descripcion: string;
  fecha: string;
  estado_reclamacion_id: number;
  objeto?: Objeto;
  usuario?: {
    id: number;
    nombre: string;
    correo: string;
    telefono?: string;
  };
  estado_reclamacion?: EstadoReclamacion;
  entrega?: Entrega;
}

export interface Entrega {
  id: number;
  reclamacion_id: number;
  fecha: string;
  observaciones: string;
  reclamacion?: Reclamacion;
}

export interface Estadisticas {
  totalObjetos: number;
  totalPerdidos: number;
  totalEncontrados: number;
  totalRecuperados: number;
  reclamacionesPendientes: number;
  reclamacionesAprobadas: number;
  totalEntregas: number;
  totalUsuarios: number;
  tasaRecuperacion: number;
}

export interface TablaNormalizadaInfo {
  nombre: string;
  clasePOO: string;
  formaNormal: string;
  pk: string;
  fks: string[];
  columnas: string[];
  registros: number;
  descripcion: string;
}

export interface EsquemaNormalizadoResponse {
  success: boolean;
  motor: string;
  orm: string;
  totalTablas: number;
  tablas: TablaNormalizadaInfo[];
}
