/**
 * @file Navbar.tsx
 * @description Barra de navegación institucional de Campus Find con control de acceso por roles reales (RBAC).
 */

import React, { useState } from 'react';
import {
  Search,
  PlusCircle,
  FolderHeart,
  FileCheck2,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  School,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  vistaActual: string;
  setVistaActual: (vista: string) => void;
  abrirFormularioReporte: (tipo: 'perdido' | 'encontrado') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  vistaActual,
  setVistaActual,
  abrirFormularioReporte,
}) => {
  const { usuario, esAdmin, logout, abrirModalAuth } = useAuth();
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  // Etiqueta visual según el rol institucional
  const getRolBadge = (rol?: string) => {
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
  };

  const handleCerrarSesion = () => {
    logout();
    setMenuUsuarioAbierto(false);
    if (['mis-reportes', 'mis-reclamaciones', 'admin', 'crud'].includes(vistaActual)) {
      setVistaActual('inicio');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo institucional */}
          <div
            id="nav-logo"
            onClick={() => setVistaActual('inicio')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-700/20 group-hover:bg-blue-800 transition-colors">
              <School className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Campus<span className="text-blue-700">Find</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Uni
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Objetos Perdidos y Encontrados
              </p>
            </div>
          </div>

          {/* Enlaces de Navegación Principal (visibles según permisos del usuario) */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-link-inicio"
              onClick={() => setVistaActual('inicio')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                vistaActual === 'inicio'
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Inicio
            </button>

            <button
              id="nav-link-buscar"
              onClick={() => setVistaActual('buscar')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                vistaActual === 'buscar'
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              Buscar Objetos
            </button>

            {usuario && (
              <>
                <button
                  id="nav-link-mis-reportes"
                  onClick={() => setVistaActual('mis-reportes')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vistaActual === 'mis-reportes'
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FolderHeart className="w-4 h-4" />
                  Mis Reportes
                </button>

                <button
                  id="nav-link-mis-reclamaciones"
                  onClick={() => setVistaActual('mis-reclamaciones')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vistaActual === 'mis-reclamaciones'
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                  Mis Reclamaciones
                </button>
              </>
            )}

            {/* Exclusivo para el rol Administrador */}
            {esAdmin && (
              <>
                <button
                  id="nav-link-admin"
                  onClick={() => setVistaActual('admin')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    vistaActual === 'admin'
                      ? 'text-purple-700 bg-purple-50 border border-purple-200'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Panel Admin
                </button>

                <button
                  id="nav-link-crud"
                  onClick={() => setVistaActual('crud')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    vistaActual === 'crud'
                      ? 'text-indigo-700 bg-indigo-50 border border-indigo-200'
                      : 'text-indigo-700 hover:bg-indigo-50/80'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Base de Datos (CRUD)</span>
                </button>
              </>
            )}
          </nav>

          {/* Acciones de reporte y sesión de usuario */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botones rápidos para reportar objeto */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                id="btn-reportar-perdido-nav"
                onClick={() => abrirFormularioReporte('perdido')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Perdí algo
              </button>
              <button
                id="btn-reportar-encontrado-nav"
                onClick={() => abrirFormularioReporte('encontrado')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Encontré algo
              </button>
            </div>

            {/* Usuario autenticado o botón de inicio de sesión */}
            {usuario ? (
              <div className="relative">
                <button
                  id="btn-usuario-menu"
                  onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
                  className="flex items-center gap-2.5 p-1.5 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {usuario.nombre.substring(0, 2)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                      {usuario.nombre.split(' ')[0]}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border capitalize ${getRolBadge(
                        usuario.rol
                      )}`}
                    >
                      {usuario.rol}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {menuUsuarioAbierto && (
                  <div
                    id="menu-desplegable-usuario"
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{usuario.nombre}</p>
                      <p className="text-[11px] text-slate-500 truncate">{usuario.correo}</p>
                      <div className="mt-1.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${getRolBadge(
                            usuario.rol
                          )}`}
                        >
                          Rol institucional: {usuario.rol}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setVistaActual('mis-reportes');
                        setMenuUsuarioAbierto(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FolderHeart className="w-4 h-4 text-slate-400" />
                      Mis Objetos Reportados
                    </button>

                    <button
                      onClick={() => {
                        setVistaActual('mis-reclamaciones');
                        setMenuUsuarioAbierto(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FileCheck2 className="w-4 h-4 text-slate-400" />
                      Mis Reclamaciones
                    </button>

                    {esAdmin && (
                      <>
                        <div className="border-t border-slate-100 my-1"></div>
                        <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                          Administración del Campus
                        </div>
                        <button
                          onClick={() => {
                            setVistaActual('admin');
                            setMenuUsuarioAbierto(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          Panel de Administración
                        </button>
                        <button
                          onClick={() => {
                            setVistaActual('crud');
                            setMenuUsuarioAbierto(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                        >
                          <Database className="w-4 h-4 text-indigo-600" />
                          Gestión de Base de Datos (CRUD)
                        </button>
                      </>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      id="btn-logout"
                      onClick={handleCerrarSesion}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-abrir-login"
                onClick={abrirModalAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra móvil inferior */}
      <div className="flex md:hidden border-t border-slate-200 bg-slate-50 px-3 py-2 justify-around text-xs font-medium text-slate-600">
        <button
          onClick={() => setVistaActual('inicio')}
          className={`px-2 py-1 rounded ${vistaActual === 'inicio' ? 'text-blue-700 font-bold' : ''}`}
        >
          Inicio
        </button>
        <button
          onClick={() => setVistaActual('buscar')}
          className={`px-2 py-1 rounded ${vistaActual === 'buscar' ? 'text-blue-700 font-bold' : ''}`}
        >
          Buscar
        </button>
        <button
          onClick={() => abrirFormularioReporte('perdido')}
          className="px-2 py-1 rounded text-rose-700 font-bold"
        >
          + Perdí
        </button>
        {usuario && (
          <button
            onClick={() => setVistaActual('mis-reportes')}
            className={`px-2 py-1 rounded ${vistaActual === 'mis-reportes' ? 'text-blue-700 font-bold' : ''}`}
          >
            Mis Reportes
          </button>
        )}
        {esAdmin && (
          <>
            <button
              onClick={() => setVistaActual('admin')}
              className={`px-2 py-1 rounded ${vistaActual === 'admin' ? 'text-purple-700 font-bold' : 'text-purple-600'}`}
            >
              Admin
            </button>
            <button
              onClick={() => setVistaActual('crud')}
              className={`px-2 py-1 rounded ${vistaActual === 'crud' ? 'text-indigo-700 font-bold' : 'text-indigo-600 font-semibold'}`}
            >
              BD CRUD
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
