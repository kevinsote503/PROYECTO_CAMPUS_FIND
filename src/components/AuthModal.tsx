/**
 * @file AuthModal.tsx
 * @description Modal institucional de autenticación: Inicio de Sesión y Registro con validación de formato.
 */

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  School,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  AlertCircle,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.()'-]{3,100}$/;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const REGEX_TELEFONO = /^[0-9+\-\s()]{7,20}$/;

export const AuthModal: React.FC = () => {
  const { mostrarModalAuth, cerrarModalAuth, login, registro } = useAuth();
  const [esModoRegistro, setEsModoRegistro] = useState(false);
  const [mostrarCredenciales, setMostrarCredenciales] = useState(false);

  // Formulario Login
  const [correoLogin, setCorreoLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  // Formulario Registro
  const [nombreReg, setNombreReg] = useState('');
  const [correoReg, setCorreoReg] = useState('');
  const [passwordReg, setPasswordReg] = useState('');
  const [telefonoReg, setTelefonoReg] = useState('');
  const [tipoUsuarioReg, setTipoUsuarioReg] = useState<number>(1); // 1 = estudiante

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mostrarModalAuth) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!REGEX_CORREO.test(correoLogin.trim())) {
      setError('Por favor ingresa un correo electrónico con formato válido.');
      return;
    }

    setCargando(true);
    try {
      await login(correoLogin.trim(), passwordLogin);
      setCorreoLogin('');
      setPasswordLogin('');
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!REGEX_NOMBRE.test(nombreReg.trim())) {
      setError('El nombre completo solo debe contener letras y espacios (mínimo 3 caracteres).');
      return;
    }
    if (!REGEX_CORREO.test(correoReg.trim())) {
      setError('Ingresa un correo electrónico institucional o personal válido.');
      return;
    }
    if (passwordReg.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (telefonoReg.trim().length > 0 && !REGEX_TELEFONO.test(telefonoReg.trim())) {
      setError('El teléfono debe contener entre 7 y 20 dígitos válidos.');
      return;
    }

    setCargando(true);
    try {
      await registro({
        nombre: nombreReg.trim(),
        correo: correoReg.trim().toLowerCase(),
        contraseña: passwordReg,
        telefono: telefonoReg.trim(),
        tipo_usuario_id: tipoUsuarioReg,
      });
      setNombreReg('');
      setCorreoReg('');
      setPasswordReg('');
      setTelefonoReg('');
    } catch (err: any) {
      setError(err.message || 'Error al procesar el registro.');
    } finally {
      setCargando(false);
    }
  };

  const rellenarCredencial = (correo: string) => {
    setEsModoRegistro(false);
    setError(null);
    setCorreoLogin(correo);
    setPasswordLogin('password123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="modal-autenticacion"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
      >
        {/* Encabezado */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">
                Campus<span className="text-blue-400">Find</span>
              </h3>
              <p className="text-xs text-slate-400">Portal de Autenticación Universitaria</p>
            </div>
          </div>
          <button
            id="btn-cerrar-auth-modal"
            onClick={cerrarModalAuth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas Login vs Registro */}
        <div className="flex border-b border-slate-200">
          <button
            id="tab-iniciar-sesion"
            onClick={() => {
              setEsModoRegistro(false);
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
              !esModoRegistro
                ? 'border-blue-700 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            id="tab-registrarse"
            onClick={() => {
              setEsModoRegistro(true);
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
              esModoRegistro
                ? 'border-blue-700 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Crear Cuenta Nueva
          </button>
        </div>

        {/* Formulario */}
        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!esModoRegistro ? (
            /* Formulario de Inicio de Sesión */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="input-login-correo" className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Institucional
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-login-correo"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="usuario@campusfind.edu"
                    value={correoLogin}
                    onChange={(e) => setCorreoLogin(e.target.value)}
                    className="cf-input w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="input-login-password" className="block text-xs font-bold text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={passwordLogin}
                    onChange={(e) => setPasswordLogin(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 outline-none"
                  />
                </div>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={cargando}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition-all shadow-md shadow-blue-700/20"
              >
                {cargando ? 'Verificando credenciales...' : 'Iniciar Sesión'}
              </button>

              {/* Guía desplegable de cuentas registradas en la BD para facilitar pruebas */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarCredenciales(!mostrarCredenciales)}
                  className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 font-semibold py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ver cuentas institucionales registradas</span>
                  </span>
                  {mostrarCredenciales ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {mostrarCredenciales && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <p className="text-[11px] text-slate-500">
                      Haz clic en una cuenta para autocompletar el formulario (contraseña: <code className="font-mono font-bold text-slate-700">password123</code>):
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => rellenarCredencial('admin@campusfind.edu')}
                        className="p-2 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 flex items-center justify-between text-left transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">Administrador (Acceso Total + BD CRUD)</span>
                          <span className="text-[11px] text-slate-500 font-mono">admin@campusfind.edu</span>
                        </div>
                        <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => rellenarCredencial('estudiante@campusfind.edu')}
                        className="p-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 flex items-center justify-between text-left transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">Estudiante (Valeria Morales)</span>
                          <span className="text-[11px] text-slate-500 font-mono">estudiante@campusfind.edu</span>
                        </div>
                        <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => rellenarCredencial('docente@campusfind.edu')}
                        className="p-2 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center justify-between text-left transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">Docente (Prof. Carlos Méndez)</span>
                          <span className="text-[11px] text-slate-500 font-mono">docente@campusfind.edu</span>
                        </div>
                        <School className="w-4 h-4 text-amber-600 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => rellenarCredencial('personal@campusfind.edu')}
                        className="p-2 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 flex items-center justify-between text-left transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">Personal de Seguridad (Marta Gómez)</span>
                          <span className="text-[11px] text-slate-500 font-mono">personal@campusfind.edu</span>
                        </div>
                        <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* Formulario de Registro */
            <form onSubmit={handleRegistro} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="input-reg-nombre" className="text-xs font-bold text-slate-700">
                    Nombre Completo *
                  </label>
                  <span className="text-[10px] text-slate-400">Solo letras y espacios</span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-reg-nombre"
                    type="text"
                    required
                    placeholder="Ej. Valeria Morales"
                    value={nombreReg}
                    onChange={(e) => setNombreReg(e.target.value)}
                    className="cf-input w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:border-blue-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="input-reg-correo" className="text-xs font-bold text-slate-700">
                    Correo Electrónico *
                  </label>
                  <span className="text-[10px] text-slate-400">usuario@dominio.edu</span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-reg-correo"
                    type="email"
                    required
                    placeholder="nombre@campusfind.edu"
                    value={correoReg}
                    onChange={(e) => setCorreoReg(e.target.value)}
                    className="cf-input w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:border-blue-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="input-reg-password" className="block text-xs font-bold text-slate-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    id="input-reg-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mín. 6 caract."
                    value={passwordReg}
                    onChange={(e) => setPasswordReg(e.target.value)}
                    className="cf-input w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-700 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="input-reg-telefono" className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    id="input-reg-telefono"
                    type="tel"
                    placeholder="Ej. 555-0199"
                    value={telefonoReg}
                    onChange={(e) => setTelefonoReg(e.target.value)}
                    className="cf-input w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rol en la Comunidad Universitaria *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoUsuarioReg(1)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      tipoUsuarioReg === 1
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Estudiante</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoUsuarioReg(2)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      tipoUsuarioReg === 2
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <School className="w-4 h-4" />
                    <span>Docente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoUsuarioReg(3)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      tipoUsuarioReg === 3
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Personal</span>
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-registro"
                type="submit"
                disabled={cargando}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition-all shadow-md shadow-blue-700/20"
              >
                {cargando ? 'Registrando cuenta...' : 'Crear Cuenta Universitaria'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
