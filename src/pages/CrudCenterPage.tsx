/**
 * @file CrudCenterPage.tsx
 * @description Centro Integral de evaluación del Proyecto Final:
 *              1. Base de Datos SQLite Normalizada (1FN, 2FN, 3FN) y POO en vivo.
 *              2. 3 Formularios Básicos con CRUD Completo (Insertar, Leer, Actualizar y Eliminar).
 *              3. Búsqueda interactiva en tiempo real de registros por cada formulario.
 *              4. Validación estricta de información correcta y en formato adecuado.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Package,
  Users,
  MapPin,
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Eye,
  ShieldCheck,
  Tag,
  Building,
  Calendar,
  Mail,
  Phone,
  UserCheck,
  KeyRound,
  Layers,
  Code2,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import {
  Objeto,
  Usuario,
  Ubicacion,
  Categoria,
  TipoUsuario,
  TablaNormalizadaInfo,
} from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CrudCenterPageProps {
  onVerDetalleObjeto: (objeto: Objeto) => void;
  onIrAPanelAdmin?: () => void;
}

// Expresiones regulares para validación estricta de formato
const REGEX_NOMBRE_HUMANO = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.()'-]{3,100}$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const REGEX_TELEFONO = /^[0-9+\-\s()]{7,20}$/;

export const CrudCenterPage: React.FC<CrudCenterPageProps> = ({
  onVerDetalleObjeto,
  onIrAPanelAdmin,
}) => {
  const { usuario, esAdmin, abrirModalAuth } = useAuth();

  // Pestaña activa: 3 Formularios CRUD + Vista de Base de Datos Normalizada 3FN
  const [formularioActivo, setFormularioActivo] = useState<
    'form1-objetos' | 'form2-usuarios' | 'form3-ubicaciones' | 'bd-normalizada'
  >('form1-objetos');

  // Catálogos compartidos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuario[]>([]);

  // Feedback global de operaciones CRUD
  const [notificacion, setNotificacion] = useState<{
    tipo: 'exito' | 'error';
    texto: string;
  } | null>(null);

  const mostrarMensaje = (tipo: 'exito' | 'error', texto: string) => {
    setNotificacion({ tipo, texto });
    setTimeout(() => {
      setNotificacion((prev) => (prev?.texto === texto ? null : prev));
    }, 5000);
  };

  // Fecha máxima permitida (hoy) para evitar fechas futuras
  const fechaHoyISO = useMemo(() => new Date().toISOString().substring(0, 10), []);

  // =========================================================================
  // ESTADO FORMULARIO CRUD #1: OBJETOS REPORTADOS
  // =========================================================================
  const [objetos, setObjetos] = useState<Objeto[]>([]);
  const [cargandoObjetos, setCargandoObjetos] = useState(false);
  const [editandoObjetoId, setEditandoObjetoId] = useState<number | null>(null);

  // Campos Formulario #1
  const [objTitulo, setObjTitulo] = useState('');
  const [objCategoriaId, setObjCategoriaId] = useState<number>(1);
  const [objUbicacionId, setObjUbicacionId] = useState<number>(1);
  const [objEstadoId, setObjEstadoId] = useState<number>(1);
  const [objFecha, setObjFecha] = useState<string>(fechaHoyISO);
  const [objDescripcion, setObjDescripcion] = useState('');
  const [guardandoObjeto, setGuardandoObjeto] = useState(false);

  // Búsqueda interactiva Formulario #1
  const [busquedaObjTexto, setBusquedaObjTexto] = useState('');
  const [busquedaObjCategoria, setBusquedaObjCategoria] = useState('todas');
  const [busquedaObjUbicacion, setBusquedaObjUbicacion] = useState('todas');
  const [busquedaObjEstado, setBusquedaObjEstado] = useState('todos');

  // Validaciones en tiempo real Formulario #1
  const validacionObjeto = useMemo(() => {
    const errores: Record<string, string> = {};
    const t = objTitulo.trim();
    const d = objDescripcion.trim();

    if (t.length === 0) {
      errores.titulo = 'El título es obligatorio.';
    } else if (t.length < 4 || t.length > 150) {
      errores.titulo = 'Debe tener entre 4 y 150 caracteres.';
    } else if (/^\d+$/.test(t)) {
      errores.titulo = 'El título no puede contener únicamente números.';
    }

    if (!objFecha) {
      errores.fecha = 'La fecha es obligatoria.';
    } else if (objFecha > fechaHoyISO) {
      errores.fecha = 'Formato inválido: no se permiten fechas futuras.';
    }

    if (d.length === 0) {
      errores.descripcion = 'La descripción es obligatoria.';
    } else if (d.length < 10) {
      errores.descripcion = `Mínimo 10 caracteres (actual: ${d.length}).`;
    }

    return {
      esValido: Object.keys(errores).length === 0,
      errores,
    };
  }, [objTitulo, objFecha, objDescripcion, fechaHoyISO]);

  // =========================================================================
  // ESTADO FORMULARIO CRUD #2: USUARIOS UNIVERSITARIOS
  // =========================================================================
  const [usuariosLista, setUsuariosLista] = useState<Usuario[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [editandoUsuarioId, setEditandoUsuarioId] = useState<number | null>(null);

  // Campos Formulario #2
  const [usuNombre, setUsuNombre] = useState('');
  const [usuCorreo, setUsuCorreo] = useState('');
  const [usuTelefono, setUsuTelefono] = useState('');
  const [usuTipoId, setUsuTipoId] = useState<number>(1);
  const [usuPassword, setUsuPassword] = useState('');
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);

  // Búsqueda interactiva Formulario #2
  const [busquedaUsuTexto, setBusquedaUsuTexto] = useState('');
  const [busquedaUsuRol, setBusquedaUsuRol] = useState('todos');

  // Validaciones en tiempo real Formulario #2
  const validacionUsuario = useMemo(() => {
    const errores: Record<string, string> = {};
    const n = usuNombre.trim();
    const c = usuCorreo.trim();
    const tel = usuTelefono.trim();
    const pass = usuPassword.trim();

    if (n.length === 0) {
      errores.nombre = 'El nombre completo es obligatorio.';
    } else if (!REGEX_NOMBRE_HUMANO.test(n)) {
      errores.nombre = 'Formato inválido: use solo letras y espacios (mínimo 3 caracteres, sin números).';
    }

    if (c.length === 0) {
      errores.correo = 'El correo institucional es obligatorio.';
    } else if (!REGEX_EMAIL.test(c)) {
      errores.correo = 'Formato de correo inválido (ejemplo: nombre@campusfind.edu).';
    }

    if (tel.length > 0 && !REGEX_TELEFONO.test(tel)) {
      errores.telefono = 'Formato telefónico inválido (7 a 20 dígitos, ej. 555-0199 o +52 555 0199).';
    }

    if (!editandoUsuarioId) {
      if (pass.length > 0 && pass.length < 6) {
        errores.password = 'La contraseña debe tener al menos 6 caracteres.';
      }
    } else if (pass.length > 0 && pass.length < 6) {
      errores.password = 'Si cambia la contraseña, debe tener mínimo 6 caracteres.';
    }

    return {
      esValido: Object.keys(errores).length === 0,
      errores,
    };
  }, [usuNombre, usuCorreo, usuTelefono, usuPassword, editandoUsuarioId]);

  // =========================================================================
  // ESTADO FORMULARIO CRUD #3: UBICACIONES DEL CAMPUS Y CATEGORÍAS
  // =========================================================================
  const [cargandoUbicaciones, setCargandoUbicaciones] = useState(false);
  const [editandoUbicacionId, setEditandoUbicacionId] = useState<number | null>(null);

  // Campos Formulario #3 (Ubicaciones)
  const [ubiNombre, setUbiNombre] = useState('');
  const [ubiEdificio, setUbiEdificio] = useState('');
  const [ubiDescripcion, setUbiDescripcion] = useState('');
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false);

  // Búsqueda interactiva Formulario #3
  const [busquedaUbiTexto, setBusquedaUbiTexto] = useState('');
  const [busquedaUbiEdificio, setBusquedaUbiEdificio] = useState('todos');

  // Sub-CRUD Categorías
  const [catNombre, setCatNombre] = useState('');
  const [editandoCatId, setEditandoCatId] = useState<number | null>(null);
  const [busquedaCatTexto, setBusquedaCatTexto] = useState('');

  // Validaciones en tiempo real Formulario #3
  const validacionUbicacion = useMemo(() => {
    const errores: Record<string, string> = {};
    const nom = ubiNombre.trim();
    const edif = ubiEdificio.trim();
    const desc = ubiDescripcion.trim();

    if (edif.length === 0) {
      errores.edificio = 'El edificio o facultad es obligatorio.';
    } else if (edif.length < 2 || edif.length > 50) {
      errores.edificio = 'Debe contener entre 2 y 50 caracteres.';
    }

    if (nom.length === 0) {
      errores.nombre = 'El nombre del aula o área es obligatorio.';
    } else if (nom.length < 3 || nom.length > 100) {
      errores.nombre = 'Debe contener entre 3 y 100 caracteres.';
    }

    if (desc.length > 300) {
      errores.descripcion = 'Máximo 300 caracteres permitidos.';
    }

    return {
      esValido: Object.keys(errores).length === 0,
      errores,
    };
  }, [ubiNombre, ubiEdificio, ubiDescripcion]);

  // =========================================================================
  // ESTADO PESTAÑA #4: ESQUEMA NORMALIZADO 3FN & POO
  // =========================================================================
  const [tablasEsquema, setTablasEsquema] = useState<TablaNormalizadaInfo[]>([]);
  const [cargandoEsquema, setCargandoEsquema] = useState(false);

  // Cargar catálogos iniciales
  const cargarCatalogosBase = async () => {
    try {
      const [resCat, resUbi, resTipos] = await Promise.all([
        api.categorias.listar(),
        api.ubicaciones.listar(),
        api.auth.tipos(),
      ]);
      if (resCat.success) setCategorias(resCat.categorias);
      if (resUbi.success) setUbicaciones(resUbi.ubicaciones);
      if (resTipos.success) setTiposUsuario(resTipos.tipos);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  };

  useEffect(() => {
    cargarCatalogosBase();
  }, []);

  // =========================================================================
  // BÚSQUEDA INTERACTIVA EN VIVO: FORMULARIO #1 (OBJETOS)
  // =========================================================================
  const cargarObjetosInteractivo = async () => {
    setCargandoObjetos(true);
    try {
      const res = await api.objetos.buscar({
        texto: busquedaObjTexto.trim() || undefined,
        categoria: busquedaObjCategoria !== 'todas' ? busquedaObjCategoria : undefined,
        ubicacion: busquedaObjUbicacion !== 'todas' ? busquedaObjUbicacion : undefined,
        estado: busquedaObjEstado !== 'todos' ? busquedaObjEstado : undefined,
      });
      if (res.success) {
        setObjetos(res.objetos);
      }
    } catch (err) {
      console.error('Error al buscar objetos:', err);
    } finally {
      setCargandoObjetos(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarObjetosInteractivo();
    }, 180);
    return () => clearTimeout(timer);
  }, [busquedaObjTexto, busquedaObjCategoria, busquedaObjUbicacion, busquedaObjEstado]);

  // =========================================================================
  // BÚSQUEDA INTERACTIVA EN VIVO: FORMULARIO #2 (USUARIOS)
  // =========================================================================
  const cargarUsuariosInteractivo = async () => {
    if (!esAdmin) return;
    setCargandoUsuarios(true);
    try {
      const res = await api.usuarios.listar({
        texto: busquedaUsuTexto.trim() || undefined,
        tipo_usuario_id: busquedaUsuRol !== 'todos' ? busquedaUsuRol : undefined,
      });
      if (res.success) {
        setUsuariosLista(res.usuarios);
      }
    } catch (err) {
      console.error('Error al buscar usuarios:', err);
    } finally {
      setCargandoUsuarios(false);
    }
  };

  useEffect(() => {
    if (!esAdmin) return;
    const timer = setTimeout(() => {
      cargarUsuariosInteractivo();
    }, 180);
    return () => clearTimeout(timer);
  }, [busquedaUsuTexto, busquedaUsuRol, esAdmin]);

  // =========================================================================
  // BÚSQUEDA INTERACTIVA EN VIVO: FORMULARIO #3 (UBICACIONES)
  // =========================================================================
  const [ubicacionesFiltradas, setUbicacionesFiltradas] = useState<Ubicacion[]>([]);

  const cargarUbicacionesInteractivo = async () => {
    setCargandoUbicaciones(true);
    try {
      const res = await api.ubicaciones.listar({
        texto: busquedaUbiTexto.trim() || undefined,
        edificio: busquedaUbiEdificio !== 'todos' ? busquedaUbiEdificio : undefined,
      });
      if (res.success) {
        setUbicacionesFiltradas(res.ubicaciones);
      }
    } catch (err) {
      console.error('Error al buscar ubicaciones:', err);
    } finally {
      setCargandoUbicaciones(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarUbicacionesInteractivo();
    }, 180);
    return () => clearTimeout(timer);
  }, [busquedaUbiTexto, busquedaUbiEdificio]);

  // Cargar esquema 3FN cuando se abre la pestaña o cambian datos
  const cargarEsquema3FN = async () => {
    setCargandoEsquema(true);
    try {
      const res = await api.stats.esquema();
      if (res.success) {
        setTablasEsquema(res.tablas);
      }
    } catch (err) {
      console.error('Error al cargar esquema:', err);
    } finally {
      setCargandoEsquema(false);
    }
  };

  useEffect(() => {
    if (formularioActivo === 'bd-normalizada') {
      cargarEsquema3FN();
    }
  }, [formularioActivo]);

  // =========================================================================
  // MANEJADORES CRUD FORMULARIO #1: OBJETOS
  // =========================================================================
  const limpiarFormularioObjeto = () => {
    setEditandoObjetoId(null);
    setObjTitulo('');
    setObjCategoriaId(categorias[0]?.id || 1);
    setObjUbicacionId(ubicaciones[0]?.id || 1);
    setObjEstadoId(1);
    setObjFecha(fechaHoyISO);
    setObjDescripcion('');
  };

  const seleccionarObjetoParaEditar = (obj: Objeto) => {
    setEditandoObjetoId(obj.id);
    setObjTitulo(obj.titulo);
    setObjCategoriaId(obj.categoria_id);
    setObjUbicacionId(obj.ubicacion_id);
    setObjEstadoId(obj.estado_id);
    setObjFecha(
      obj.fecha_reporte
        ? new Date(obj.fecha_reporte).toISOString().substring(0, 10)
        : fechaHoyISO
    );
    setObjDescripcion(obj.descripcion);
    window.scrollTo({ top: 140, behavior: 'smooth' });
  };

  const handleGuardarObjeto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !esAdmin) {
      abrirModalAuth();
      return;
    }
    if (!validacionObjeto.esValido) {
      mostrarMensaje('error', 'Por favor corrige los campos marcados en rojo antes de guardar.');
      return;
    }

    setGuardandoObjeto(true);
    try {
      if (editandoObjetoId) {
        const res = await api.objetos.actualizar(editandoObjetoId, {
          titulo: objTitulo.trim(),
          categoria_id: objCategoriaId,
          ubicacion_id: objUbicacionId,
          estado_id: objEstadoId,
          fecha_reporte: objFecha,
          descripcion: objDescripcion.trim(),
        });
        mostrarMensaje('exito', res.mensaje || `Objeto #${editandoObjetoId} actualizado correctamente.`);
      } else {
        const res = await api.objetos.crear({
          titulo: objTitulo.trim(),
          categoria_id: objCategoriaId,
          ubicacion_id: objUbicacionId,
          estado_id: objEstadoId,
          fecha_reporte: objFecha,
          descripcion: objDescripcion.trim(),
        });
        mostrarMensaje('exito', res.mensaje || 'Nuevo objeto insertado en SQLite.');
      }
      limpiarFormularioObjeto();
      await cargarObjetosInteractivo();
    } catch (err: any) {
      mostrarMensaje('error', err.message || 'Error al guardar el objeto.');
    } finally {
      setGuardandoObjeto(false);
    }
  };

  const handleEliminarObjeto = async (obj: Objeto) => {
    if (!confirm(`¿Confirmas eliminar el objeto #${obj.id} ("${obj.titulo}") de la base de datos?`)) {
      return;
    }
    try {
      const res = await api.objetos.eliminar(obj.id);
      if (editandoObjetoId === obj.id) limpiarFormularioObjeto();
      mostrarMensaje('exito', res.mensaje || 'Objeto eliminado correctamente.');
      await cargarObjetosInteractivo();
    } catch (err: any) {
      mostrarMensaje('error', err.message || 'No se pudo eliminar el objeto.');
    }
  };

  // =========================================================================
  // MANEJADORES CRUD FORMULARIO #2: USUARIOS
  // =========================================================================
  const limpiarFormularioUsuario = () => {
    setEditandoUsuarioId(null);
    setUsuNombre('');
    setUsuCorreo('');
    setUsuTelefono('');
    setUsuTipoId(1);
    setUsuPassword('');
  };

  const seleccionarUsuarioParaEditar = (u: Usuario) => {
    setEditandoUsuarioId(u.id);
    setUsuNombre(u.nombre);
    setUsuCorreo(u.correo);
    setUsuTelefono(u.telefono || '');
    setUsuTipoId(u.tipo_usuario_id || 1);
    setUsuPassword('');
    window.scrollTo({ top: 140, behavior: 'smooth' });
  };

  const handleGuardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validacionUsuario.esValido) {
      mostrarMensaje('error', 'Verifica el formato de los datos del usuario antes de continuar.');
      return;
    }

    setGuardandoUsuario(true);
    try {
      if (editandoUsuarioId) {
        const payload: any = {
          nombre: usuNombre.trim(),
          correo: usuCorreo.trim().toLowerCase(),
          telefono: usuTelefono.trim(),
          tipo_usuario_id: usuTipoId,
        };
        if (usuPassword.trim().length >= 6) {
          payload.contraseña = usuPassword.trim();
        }
        const res = await api.usuarios.actualizar(editandoUsuarioId, payload);
        mostrarMensaje('exito', res.mensaje || `Usuario #${editandoUsuarioId} actualizado.`);
      } else {
        const res = await api.usuarios.crear({
          nombre: usuNombre.trim(),
          correo: usuCorreo.trim().toLowerCase(),
          telefono: usuTelefono.trim(),
          tipo_usuario_id: usuTipoId,
          contraseña: usuPassword.trim() || 'password123',
        });
        mostrarMensaje('exito', res.mensaje || 'Usuario registrado en SQLite.');
      }
      limpiarFormularioUsuario();
      await cargarUsuariosInteractivo();
    } catch (err: any) {
      mostrarMensaje('error', err.message || 'Error al guardar usuario.');
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const handleEliminarUsuario = async (u: Usuario) => {
    if (!confirm(`¿Deseas eliminar al usuario "${u.nombre}" (${u.correo})?`)) {
      return;
    }
    try {
      const res = await api.usuarios.eliminar(u.id);
      if (editandoUsuarioId === u.id) limpiarFormularioUsuario();
      mostrarMensaje('exito', res.mensaje || 'Usuario eliminado.');
      await cargarUsuariosInteractivo();
    } catch (err: any) {
      mostrarMensaje('error', err.message || 'Error al eliminar usuario.');
    }
  };

  // =========================================================================
  // MANEJADORES CRUD FORMULARIO #3: UBICACIONES Y CATEGORÍAS
  // =========================================================================
  const limpiarFormularioUbicacion = () => {
    setEditandoUbicacionId(null);
    setUbiNombre('');
    setUbiEdificio('');
    setUbiDescripcion('');
  };

  const seleccionarUbicacionParaEditar = (u: Ubicacion) => {
    setEditandoUbicacionId(u.id);
    setUbiNombre(u.nombre);
    setUbiEdificio(u.edificio);
    setUbiDescripcion(u.descripcion || '');
    window.scrollTo({ top: 140, behavior: 'smooth' });
  };

  const handleGuardarUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validacionUbicacion.esValido) {
      mostrarMensaje('error', 'Completa correctamente los campos de la ubicación.');
      return;
    }

    setGuardandoUbicacion(true);
    try {
      if (editandoUbicacionId) {
        const res = await api.ubicaciones.actualizar(editandoUbicacionId, {
          nombre: ubiNombre.trim(),
          edificio: ubiEdificio.trim(),
          descripcion: ubiDescripcion.trim(),
        });
        mostrarMensaje('exito', res.mensaje || `Ubicación #${editandoUbicacionId} actualizada.`);
      } else {
        const res = await api.ubicaciones.crear({
          nombre: ubiNombre.trim(),
          edificio: ubiEdificio.trim(),
          descripcion: ubiDescripcion.trim(),
        });
        mostrarMensaje('exito', res.mensaje || 'Nueva ubicación insertada.');
      }
      limpiarFormularioUbicacion();
      await Promise.all([cargarUbicacionesInteractivo(), cargarCatalogosBase()]);
    } catch (err: any) {
      mostrarMensaje('error', err.message || 'Error al guardar ubicación.');
    } finally {
      setGuardandoUbicacion(false);
    }
  };

  const handleEliminarUbicacion = async (u: Ubicacion) => {
    if (!confirm(`¿Confirmas eliminar la ubicación "${u.edificio} - ${u.nombre}"?`)) {
      return;
    }
    try {
      const res = await api.ubicaciones.eliminar(u.id);
      if (editandoUbicacionId === u.id) limpiarFormularioUbicacion();
      mostrarMensaje('exito', res.mensaje || 'Ubicación eliminada.');
      await Promise.all([cargarUbicacionesInteractivo(), cargarCatalogosBase()]);
    } catch (err: any) {
      mostrarMensaje('error', err.message || 'Error al eliminar ubicación.');
    }
  };

  // Sub-manejadores Categorías
  const handleGuardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (catNombre.trim().length < 3) {
      mostrarMensaje('error', 'El nombre de la categoría debe tener al menos 3 caracteres.');
      return;
    }
    try {
      if (editandoCatId) {
        const res = await api.categorias.actualizar(editandoCatId, catNombre.trim());
        mostrarMensaje('exito', res.mensaje || 'Categoría actualizada.');
      } else {
        const res = await api.categorias.crear(catNombre.trim());
        mostrarMensaje('exito', res.mensaje || 'Categoría creada.');
      }
      setCatNombre('');
      setEditandoCatId(null);
      await cargarCatalogosBase();
    } catch (err: any) {
      mostrarMensaje('error', err.message || 'Error al guardar categoría.');
    }
  };

  const handleEliminarCategoria = async (c: Categoria) => {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    try {
      const res = await api.categorias.eliminar(c.id);
      mostrarMensaje('exito', res.mensaje || 'Categoría eliminada.');
      await cargarCatalogosBase();
    } catch (err: any) {
      mostrarMensaje('error', err.message || 'Error al eliminar categoría.');
    }
  };

  // Lista de edificios únicos para el filtro de Ubicaciones
  const edificiosUnicos = useMemo(() => {
    const set = new Set<string>();
    ubicaciones.forEach((u) => {
      if (u.edificio) set.add(u.edificio);
    });
    return Array.from(set);
  }, [ubicaciones]);

  // Categorías filtradas interactivamente
  const categoriasFiltradas = useMemo(() => {
    if (!busquedaCatTexto.trim()) return categorias;
    const q = busquedaCatTexto.toLowerCase().trim();
    return categorias.filter((c) => c.nombre.toLowerCase().includes(q));
  }, [categorias, busquedaCatTexto]);

  if (!esAdmin) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-md mx-auto my-12 shadow-xs">
        <Database className="w-12 h-12 text-indigo-700 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">
          Acceso Restringido — Administración de Base de Datos
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          La consola de gestión directa de tablas relacionales (Objetos, Directorio de Usuarios, Ubicaciones y Esquema SQLite) es exclusiva para el personal con rol de <strong>Administrador</strong>.
        </p>
        <button
          onClick={abrirModalAuth}
          className="px-5 py-2.5 rounded-xl bg-indigo-700 text-white text-xs font-bold shadow-md hover:bg-indigo-800 transition-colors"
        >
          Iniciar Sesión como Administrador
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Cabecera Institucional de Administración de Base de Datos */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Consola Administrativa • Gestión Integral de Base de Datos SQLite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Administración de Registros y Catálogos del Campus
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
              Gestiona el inventario general de pertenencias reportadas, el directorio de usuarios universitarios y las ubicaciones físicas del campus con búsqueda en tiempo real y validación de integridad referencial.
            </p>
          </div>

          {onIrAPanelAdmin && (
            <div className="shrink-0">
              <button
                onClick={onIrAPanelAdmin}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-purple-300" />
                <span>Ir a Reclamaciones y Entregas</span>
              </button>
            </div>
          )}
        </div>

        {/* Selector de Módulos CRUD + Base de Datos Normalizada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => setFormularioActivo('form1-objetos')}
            className={`p-3.5 rounded-2xl text-left transition-all border flex items-start gap-3 ${
              formularioActivo === 'form1-objetos'
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'bg-white/5 text-indigo-100 border-white/10 hover:bg-white/10'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                formularioActivo === 'form1-objetos'
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-500/20 text-blue-200'
              }`}
            >
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-75 block">
                Módulo 1 • Inventario
              </span>
              <span className="font-extrabold text-sm block">Objetos Reportados</span>
              <span className="text-[11px] opacity-75">
                Registro, edición, baja y filtrado
              </span>
            </div>
          </button>

          <button
            onClick={() => setFormularioActivo('form2-usuarios')}
            className={`p-3.5 rounded-2xl text-left transition-all border flex items-start gap-3 ${
              formularioActivo === 'form2-usuarios'
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'bg-white/5 text-indigo-100 border-white/10 hover:bg-white/10'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                formularioActivo === 'form2-usuarios'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/20 text-emerald-200'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-75 block">
                Módulo 2 • Comunidad
              </span>
              <span className="font-extrabold text-sm block">Directorio de Usuarios</span>
              <span className="text-[11px] opacity-75">
                Cuentas, teléfonos y roles
              </span>
            </div>
          </button>

          <button
            onClick={() => setFormularioActivo('form3-ubicaciones')}
            className={`p-3.5 rounded-2xl text-left transition-all border flex items-start gap-3 ${
              formularioActivo === 'form3-ubicaciones'
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'bg-white/5 text-indigo-100 border-white/10 hover:bg-white/10'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                formularioActivo === 'form3-ubicaciones'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-500/20 text-purple-200'
              }`}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-75 block">
                Módulo 3 • Infraestructura
              </span>
              <span className="font-extrabold text-sm block">Ubicaciones y Categorías</span>
              <span className="text-[11px] opacity-75">
                Edificios, aulas y clasificación
              </span>
            </div>
          </button>

          <button
            onClick={() => setFormularioActivo('bd-normalizada')}
            className={`p-3.5 rounded-2xl text-left transition-all border flex items-start gap-3 ${
              formularioActivo === 'bd-normalizada'
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'bg-white/5 text-indigo-100 border-white/10 hover:bg-white/10'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                formularioActivo === 'bd-normalizada'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-500/20 text-amber-200'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-75 block">
                Esquema Relacional
              </span>
              <span className="font-extrabold text-sm block">Monitor SQLite (3FN)</span>
              <span className="text-[11px] opacity-75">
                9 Tablas y relaciones activas
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Notificación flotante de éxito o error */}
      {notificacion && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-sm ${
            notificacion.tipo === 'exito'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            {notificacion.tipo === 'exito' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notificacion.texto}</span>
          </div>
          <button
            onClick={() => setNotificacion(null)}
            className="text-xs font-bold underline opacity-75 hover:opacity-100"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* =====================================================================
          FORMULARIO CRUD #1: OBJETOS REPORTADOS
      ===================================================================== */}
      {formularioActivo === 'form1-objetos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Formulario Insertar / Actualizar con Validación */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {editandoObjetoId ? `Modo Actualizar (ID #${editandoObjetoId})` : 'Modo Insertar (CREATE)'}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {editandoObjetoId ? 'Editar Objeto Reportado' : 'Registrar Nuevo Objeto'}
                </h2>
              </div>

              {editandoObjetoId && (
                <button
                  type="button"
                  onClick={limpiarFormularioObjeto}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>

            <form onSubmit={handleGuardarObjeto} className="space-y-4">
              {/* Campo 1: Título */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="crud-obj-titulo" className="text-xs font-bold text-slate-700 uppercase">
                    Título del Objeto *
                  </label>
                  <span
                    className={`text-[11px] font-bold flex items-center gap-0.5 ${
                      !validacionObjeto.errores.titulo ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {!validacionObjeto.errores.titulo ? (
                      <>
                        <Check className="w-3 h-3" /> Formato válido
                      </>
                    ) : (
                      '4 a 150 caracteres'
                    )}
                  </span>
                </div>
                <input
                  id="crud-obj-titulo"
                  type="text"
                  required
                  minLength={4}
                  maxLength={150}
                  value={objTitulo}
                  onChange={(e) => setObjTitulo(e.target.value)}
                  placeholder="Ej. Calculadora Científica Casio FX-991EX"
                  className="cf-input w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 outline-none"
                />
                {objTitulo.length > 0 && validacionObjeto.errores.titulo && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validacionObjeto.errores.titulo}</span>
                  </p>
                )}
              </div>

              {/* Campo 2 y 3: Estado y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="crud-obj-estado" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Estado (FK) *
                  </label>
                  <select
                    id="crud-obj-estado"
                    value={objEstadoId}
                    onChange={(e) => setObjEstadoId(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-700 outline-none font-semibold"
                  >
                    <option value={1}>1 - Perdido</option>
                    <option value={2}>2 - Encontrado</option>
                    <option value={3}>3 - Recuperado</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="crud-obj-fecha" className="text-xs font-bold text-slate-700 uppercase">
                      Fecha Reporte *
                    </label>
                    <span className="text-[10px] text-slate-400">Máx: Hoy</span>
                  </div>
                  <input
                    id="crud-obj-fecha"
                    type="date"
                    required
                    max={fechaHoyISO}
                    value={objFecha}
                    onChange={(e) => setObjFecha(e.target.value)}
                    className="cf-input w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 outline-none"
                  />
                  {validacionObjeto.errores.fecha && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      {validacionObjeto.errores.fecha}
                    </p>
                  )}
                </div>
              </div>

              {/* Campo 4 y 5: Categoría (FK) y Ubicación (FK) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="crud-obj-cat" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoría (FK 3FN) *
                  </label>
                  <select
                    id="crud-obj-cat"
                    value={objCategoriaId}
                    onChange={(e) => setObjCategoriaId(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-700 outline-none"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="crud-obj-ubi" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ubicación (FK 3FN) *
                  </label>
                  <select
                    id="crud-obj-ubi"
                    value={objUbicacionId}
                    onChange={(e) => setObjUbicacionId(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-700 outline-none"
                  >
                    {ubicaciones.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.edificio} - {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campo 6: Descripción detallada */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="crud-obj-desc" className="text-xs font-bold text-slate-700 uppercase">
                    Descripción y Señas Particulares *
                  </label>
                  <span
                    className={`text-[11px] font-bold ${
                      objDescripcion.trim().length >= 10 ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {objDescripcion.trim().length}/10+ car.
                  </span>
                </div>
                <textarea
                  id="crud-obj-desc"
                  required
                  minLength={10}
                  rows={3}
                  value={objDescripcion}
                  onChange={(e) => setObjDescripcion(e.target.value)}
                  placeholder="Describe color, marca, estado físico y lugar exacto..."
                  className="cf-input w-full text-sm p-3 rounded-xl border border-slate-300 focus:border-blue-700 outline-none"
                />
                {objDescripcion.length > 0 && validacionObjeto.errores.descripcion && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validacionObjeto.errores.descripcion}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={guardandoObjeto || !validacionObjeto.esValido}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-white text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 ${
                    editandoObjetoId
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-700 hover:bg-blue-800'
                  }`}
                >
                  {editandoObjetoId ? (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>{guardandoObjeto ? 'Actualizando...' : 'Actualizar Registro (PUT)'}</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>{guardandoObjeto ? 'Insertando...' : 'Insertar Objeto (POST)'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Columna Derecha: Búsqueda Interactiva + Tabla CRUD (Leer / Editar / Eliminar) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                  Búsqueda Interactiva en Vivo (READ + FILTER)
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Registros de Objetos en SQLite ({objetos.length})
                </h3>
              </div>
              {busquedaObjTexto ||
              busquedaObjCategoria !== 'todas' ||
              busquedaObjUbicacion !== 'todas' ||
              busquedaObjEstado !== 'todos' ? (
                <button
                  onClick={() => {
                    setBusquedaObjTexto('');
                    setBusquedaObjCategoria('todas');
                    setBusquedaObjUbicacion('todas');
                    setBusquedaObjEstado('todos');
                  }}
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Limpiar filtros
                </button>
              ) : null}
            </div>

            {/* Barra de Búsqueda Interactiva */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaObjTexto}
                  onChange={(e) => setBusquedaObjTexto(e.target.value)}
                  placeholder="Buscar al escribir por título o descripción..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:border-blue-700 outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={busquedaObjCategoria}
                  onChange={(e) => setBusquedaObjCategoria(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl bg-white border border-slate-300 text-xs outline-none"
                >
                  <option value="todas">Categoría: Todas</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <select
                  value={busquedaObjUbicacion}
                  onChange={(e) => setBusquedaObjUbicacion(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl bg-white border border-slate-300 text-xs outline-none"
                >
                  <option value="todas">Lugar: Todos</option>
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={String(u.id)}>
                      {u.edificio} - {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <select
                  value={busquedaObjEstado}
                  onChange={(e) => setBusquedaObjEstado(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl bg-white border border-slate-300 text-xs outline-none"
                >
                  <option value="todos">Estado: Todos</option>
                  <option value="1">Perdido</option>
                  <option value="2">Encontrado</option>
                  <option value="3">Recuperado</option>
                </select>
              </div>
            </div>

            {/* Listado interactivo con botones Editar y Eliminar */}
            {cargandoObjetos ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Filtrando registros en tiempo real...
              </div>
            ) : objetos.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No se encontraron objetos que coincidan con tu búsqueda interactiva.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto pr-1">
                {objetos.map((obj) => (
                  <div
                    key={obj.id}
                    className={`py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl transition-colors ${
                      editandoObjetoId === obj.id
                        ? 'bg-amber-50/80 border border-amber-300'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          ID #{obj.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            obj.estado_id === 1
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : obj.estado_id === 2
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {obj.estado?.nombre || (obj.estado_id === 1 ? 'perdido' : obj.estado_id === 2 ? 'encontrado' : 'recuperado')}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {obj.categoria?.nombre}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{obj.titulo}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{obj.descripcion}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {obj.ubicacion?.edificio} - {obj.ubicacion?.nombre}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(obj.fecha_reporte).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onVerDetalleObjeto(obj)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold"
                        title="Leer detalle completo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => seleccionarObjetoParaEditar(obj)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarObjeto(obj)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          FORMULARIO CRUD #2: USUARIOS DE LA COMUNIDAD
      ===================================================================== */}
      {formularioActivo === 'form2-usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Formulario Insertar / Actualizar Usuario */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {editandoUsuarioId ? `Modo Actualizar Usuario #${editandoUsuarioId}` : 'Modo Insertar (CREATE)'}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {editandoUsuarioId ? 'Editar Usuario Universitario' : 'Registrar Nuevo Usuario'}
                </h2>
              </div>

              {editandoUsuarioId && (
                <button
                  type="button"
                  onClick={limpiarFormularioUsuario}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>

            <form onSubmit={handleGuardarUsuario} className="space-y-4">
              {/* Nombre Completo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="crud-usu-nombre" className="text-xs font-bold text-slate-700 uppercase">
                    Nombre Completo *
                  </label>
                  <span className="text-[10px] text-slate-400">Solo letras (3-100 car.)</span>
                </div>
                <input
                  id="crud-usu-nombre"
                  type="text"
                  required
                  value={usuNombre}
                  onChange={(e) => setUsuNombre(e.target.value)}
                  placeholder="Ej. Andrea Carolina Salazar"
                  className="cf-input w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                />
                {usuNombre.length > 0 && validacionUsuario.errores.nombre && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validacionUsuario.errores.nombre}</span>
                  </p>
                )}
              </div>

              {/* Correo Institucional */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="crud-usu-correo" className="text-xs font-bold text-slate-700 uppercase">
                    Correo Electrónico (UNIQUE) *
                  </label>
                  <span className="text-[10px] text-slate-400">usuario@dominio.edu</span>
                </div>
                <input
                  id="crud-usu-correo"
                  type="email"
                  required
                  value={usuCorreo}
                  onChange={(e) => setUsuCorreo(e.target.value)}
                  placeholder="andrea.salazar@campusfind.edu"
                  className="cf-input w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                />
                {usuCorreo.length > 0 && validacionUsuario.errores.correo && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validacionUsuario.errores.correo}</span>
                  </p>
                )}
              </div>

              {/* Teléfono y Rol (FK) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="crud-usu-tel" className="text-xs font-bold text-slate-700 uppercase">
                      Teléfono
                    </label>
                    <span className="text-[10px] text-slate-400">7-20 dígitos</span>
                  </div>
                  <input
                    id="crud-usu-tel"
                    type="tel"
                    value={usuTelefono}
                    onChange={(e) => setUsuTelefono(e.target.value)}
                    placeholder="Ej. 555-0145"
                    className="cf-input w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                  {usuTelefono.length > 0 && validacionUsuario.errores.telefono && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      {validacionUsuario.errores.telefono}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="crud-usu-rol" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tipo Usuario (FK 3FN) *
                  </label>
                  <select
                    id="crud-usu-rol"
                    value={usuTipoId}
                    onChange={(e) => setUsuTipoId(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-600 outline-none capitalize"
                  >
                    {tiposUsuario.length > 0 ? (
                      tiposUsuario.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id} - {t.nombre}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={1}>1 - estudiante</option>
                        <option value={2}>2 - docente</option>
                        <option value={3}>3 - personal</option>
                        <option value={4}>4 - administrador</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="crud-usu-pass" className="text-xs font-bold text-slate-700 uppercase">
                    {editandoUsuarioId ? 'Nueva Contraseña (Opcional)' : 'Contraseña (Bcrypt) *'}
                  </label>
                  <span className="text-[10px] text-slate-400">Mínimo 6 caracteres</span>
                </div>
                <input
                  id="crud-usu-pass"
                  type="password"
                  value={usuPassword}
                  onChange={(e) => setUsuPassword(e.target.value)}
                  placeholder={
                    editandoUsuarioId
                      ? 'Dejar en blanco para conservar la actual'
                      : 'Mínimo 6 caracteres (por defecto: password123)'
                  }
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                />
                {validacionUsuario.errores.password && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    {validacionUsuario.errores.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={guardandoUsuario || !validacionUsuario.esValido}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 ${
                  editandoUsuarioId
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {editandoUsuarioId ? (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>{guardandoUsuario ? 'Actualizando...' : 'Actualizar Usuario (PUT)'}</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>{guardandoUsuario ? 'Registrando...' : 'Insertar Usuario (POST)'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Columna Derecha: Búsqueda Interactiva + Listado CRUD de Usuarios */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Búsqueda Interactiva en Vivo (READ + FILTER)
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Usuarios Registrados en SQLite ({usuariosLista.length})
                </h3>
              </div>
              {(busquedaUsuTexto || busquedaUsuRol !== 'todos') && (
                <button
                  onClick={() => {
                    setBusquedaUsuTexto('');
                    setBusquedaUsuRol('todos');
                  }}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Limpiar filtros
                </button>
              )}
            </div>

            {/* Buscador interactivo de usuarios */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaUsuTexto}
                  onChange={(e) => setBusquedaUsuTexto(e.target.value)}
                  placeholder="Buscar interactivamente por nombre, correo o teléfono..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={busquedaUsuRol}
                  onChange={(e) => setBusquedaUsuRol(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-xs outline-none"
                >
                  <option value="todos">Todos los roles</option>
                  <option value="1">Estudiante</option>
                  <option value="2">Docente</option>
                  <option value="3">Personal</option>
                  <option value="4">Administrador</option>
                </select>
              </div>
            </div>

            {cargandoUsuarios ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Consultando usuarios en SQLite...
              </div>
            ) : usuariosLista.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No se encontraron usuarios con ese criterio de búsqueda.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto pr-1">
                {usuariosLista.map((u) => {
                  const rolNombre = u.tipo_usuario?.nombre || u.rol || 'estudiante';
                  return (
                    <div
                      key={u.id}
                      className={`py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl transition-colors ${
                        editandoUsuarioId === u.id
                          ? 'bg-amber-50/80 border border-amber-300'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            ID #{u.id}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {rolNombre}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{u.nombre}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {u.correo}
                          </span>
                          {u.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {u.telefono}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => seleccionarUsuarioParaEditar(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarUsuario(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          FORMULARIO CRUD #3: UBICACIONES DEL CAMPUS Y CATEGORÍAS
      ===================================================================== */}
      {formularioActivo === 'form3-ubicaciones' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda: Formulario Insertar / Actualizar Ubicación */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    {editandoUbicacionId
                      ? `Modo Actualizar Ubicación #${editandoUbicacionId}`
                      : 'Modo Insertar (CREATE)'}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-1">
                    {editandoUbicacionId ? 'Editar Ubicación del Campus' : 'Registrar Nueva Ubicación'}
                  </h2>
                </div>

                {editandoUbicacionId && (
                  <button
                    type="button"
                    onClick={limpiarFormularioUbicacion}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleGuardarUbicacion} className="space-y-4">
                {/* Edificio / Facultad */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="crud-ubi-edificio" className="text-xs font-bold text-slate-700 uppercase">
                      Edificio o Facultad *
                    </label>
                    <span className="text-[10px] text-slate-400">2 a 50 caracteres</span>
                  </div>
                  <input
                    id="crud-ubi-edificio"
                    type="text"
                    required
                    minLength={2}
                    maxLength={50}
                    value={ubiEdificio}
                    onChange={(e) => setUbiEdificio(e.target.value)}
                    placeholder="Ej. Facultad de Ingeniería / Edificio B"
                    className="cf-input w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-700 outline-none"
                  />
                  {ubiEdificio.length > 0 && validacionUbicacion.errores.edificio && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      {validacionUbicacion.errores.edificio}
                    </p>
                  )}
                </div>

                {/* Nombre del Aula o Espacio */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="crud-ubi-nombre" className="text-xs font-bold text-slate-700 uppercase">
                      Nombre del Aula / Laboratorio / Área *
                    </label>
                    <span className="text-[10px] text-slate-400">3 a 100 caracteres</span>
                  </div>
                  <input
                    id="crud-ubi-nombre"
                    type="text"
                    required
                    minLength={3}
                    maxLength={100}
                    value={ubiNombre}
                    onChange={(e) => setUbiNombre(e.target.value)}
                    placeholder="Ej. Laboratorio de Redes 204"
                    className="cf-input w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-700 outline-none"
                  />
                  {ubiNombre.length > 0 && validacionUbicacion.errores.nombre && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      {validacionUbicacion.errores.nombre}
                    </p>
                  )}
                </div>

                {/* Descripción / Referencia */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="crud-ubi-desc" className="text-xs font-bold text-slate-700 uppercase">
                      Descripción o Referencia Física
                    </label>
                    <span className="text-[10px] text-slate-400">{ubiDescripcion.length}/300</span>
                  </div>
                  <textarea
                    id="crud-ubi-desc"
                    rows={3}
                    maxLength={300}
                    value={ubiDescripcion}
                    onChange={(e) => setUbiDescripcion(e.target.value)}
                    placeholder="Ej. Segundo piso, junto a las escaleras de emergencia..."
                    className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:border-purple-700 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardandoUbicacion || !validacionUbicacion.esValido}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-white text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 ${
                    editandoUbicacionId
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-purple-700 hover:bg-purple-800'
                  }`}
                >
                  {editandoUbicacionId ? (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>{guardandoUbicacion ? 'Actualizando...' : 'Actualizar Ubicación (PUT)'}</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>{guardandoUbicacion ? 'Insertando...' : 'Insertar Ubicación (POST)'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Columna Derecha: Búsqueda Interactiva + Tabla CRUD de Ubicaciones */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
                    Búsqueda Interactiva en Vivo (READ + FILTER)
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    Ubicaciones del Campus en SQLite ({ubicacionesFiltradas.length})
                  </h3>
                </div>
                {(busquedaUbiTexto || busquedaUbiEdificio !== 'todos') && (
                  <button
                    onClick={() => {
                      setBusquedaUbiTexto('');
                      setBusquedaUbiEdificio('todos');
                    }}
                    className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Limpiar filtros
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="sm:col-span-8 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busquedaUbiTexto}
                    onChange={(e) => setBusquedaUbiTexto(e.target.value)}
                    placeholder="Buscar al escribir por salón, edificio o descripción..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:border-purple-700 outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={busquedaUbiEdificio}
                    onChange={(e) => setBusquedaUbiEdificio(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-xs outline-none"
                  >
                    <option value="todos">Todos los edificios</option>
                    {edificiosUnicos.map((ed) => (
                      <option key={ed} value={ed}>
                        {ed}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {cargandoUbicaciones ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Consultando ubicaciones...
                </div>
              ) : ubicacionesFiltradas.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No hay ubicaciones que coincidan con tu búsqueda interactiva.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
                  {ubicacionesFiltradas.map((u) => (
                    <div
                      key={u.id}
                      className={`py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl transition-colors ${
                        editandoUbicacionId === u.id
                          ? 'bg-amber-50/80 border border-amber-300'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            ID #{u.id}
                          </span>
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            {u.edificio}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{u.nombre}</h4>
                        </div>
                        {u.descripcion && (
                          <p className="text-xs text-slate-500">{u.descripcion}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => seleccionarUbicacionParaEditar(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarUbicacion(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sub-módulo CRUD adicional: Categorías de Objetos */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
                  Catálogo Relacional Adicional (CRUD Completo)
                </span>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>Gestión de Categorías de Objetos ({categoriasFiltradas.length})</span>
                </h3>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaCatTexto}
                  onChange={(e) => setBusquedaCatTexto(e.target.value)}
                  placeholder="Filtrar categorías..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs outline-none"
                />
              </div>
            </div>

            <form onSubmit={handleGuardarCategoria} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                required
                minLength={3}
                maxLength={50}
                value={catNombre}
                onChange={(e) => setCatNombre(e.target.value)}
                placeholder="Nombre de la categoría (ej. Instrumentos de Laboratorio)"
                className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0"
              >
                {editandoCatId ? `Actualizar Categoría #${editandoCatId}` : 'Insertar Categoría'}
              </button>
              {editandoCatId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditandoCatId(null);
                    setCatNombre('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancelar
                </button>
              )}
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
              {categoriasFiltradas.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="text-[10px] font-mono text-slate-400 block">ID #{c.id}</span>
                    <span className="text-xs font-bold text-slate-800 truncate">{c.nombre}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoCatId(c.id);
                        setCatNombre(c.nombre);
                      }}
                      className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                      title="Editar categoría"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarCategoria(c)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PESTAÑA #4: BASE DE DATOS NORMALIZADA (1FN, 2FN, 3FN) Y POO EN VIVO
      ===================================================================== */}
      {formularioActivo === 'bd-normalizada' && (
        <div className="space-y-6">
          {/* Explicación de las 3 Formas Normales + POO */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Primera Forma Normal (1FN)
              </span>
              <h3 className="font-extrabold text-sm text-slate-900">Atomicidad de Atributos</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Todos los campos contienen valores atómicos indivisibles. No existen listas separadas por comas ni columnas repetidas en ninguna tabla.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Segunda Forma Normal (2FN)
              </span>
              <h3 className="font-extrabold text-sm text-slate-900">Dependencia Funcional Total</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cada tabla posee una clave primaria única (<code className="text-[11px] bg-slate-100 px-1 rounded">id PK</code>) y todos sus atributos no-clave dependen completamente de dicha clave.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Tercera Forma Normal (3FN)
              </span>
              <h3 className="font-extrabold text-sm text-slate-900">Cero Dependencias Transitivas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Roles, categorías, edificios/ubicaciones y estados están separados en sus propias tablas catálogo vinculadas por claves foráneas (<code className="text-[11px] bg-slate-100 px-1 rounded">FK</code>).
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Arquitectura POO
              </span>
              <h3 className="font-extrabold text-sm text-slate-900">Herencia y Polimorfismo</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                La clase abstracta <code className="text-[11px] bg-slate-100 px-1 rounded">EntidadBase</code> define métodos polimórficos (<code className="text-[11px] bg-slate-100 px-1 rounded">validarDominio()</code>) heredados por cada modelo Sequelize.
              </p>
            </div>
          </div>

          {/* Listado en vivo de las 9 tablas SQLite */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-700" />
                  <span>Inspección en Vivo del Esquema Relacional SQLite (9 Tablas en 3FN)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Conteo de registros y claves foráneas consultados en tiempo real desde <code className="font-mono">campus_find.db</code>
                </p>
              </div>
              <button
                onClick={cargarEsquema3FN}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Actualizar Conteo SQLite
              </button>
            </div>

            {cargandoEsquema ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Consultando metadatos de SQLite...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tablasEsquema.map((t, idx) => (
                  <div
                    key={t.nombre}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-blue-900 bg-blue-100/80 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {idx + 1}. {t.nombre}
                        </span>
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {t.registros} reg.
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-purple-700 font-semibold flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{t.clasePOO}</span>
                      </div>

                      <p className="text-xs text-slate-600">{t.descripcion}</p>

                      <div className="space-y-1 pt-1">
                        <div className="text-[11px] font-semibold text-slate-700">
                          🔑 PK: <code className="text-slate-900">{t.pk}</code>
                        </div>
                        {t.fks.length > 0 && (
                          <div className="text-[11px] text-slate-600 space-y-0.5">
                            <span className="font-semibold text-slate-700 block">🔗 Claves Foráneas (FK):</span>
                            {t.fks.map((fk) => (
                              <div key={fk} className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200">
                                {fk}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-1">
                      {t.columnas.map((col) => (
                        <span
                          key={col}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudCenterPage;
