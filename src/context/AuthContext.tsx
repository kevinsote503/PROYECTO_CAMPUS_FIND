/**
 * @file AuthContext.tsx
 * @description Contexto global de autenticación de usuario y manejo de sesiones.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  esAdmin: boolean;
  login: (correo: string, pass: string) => Promise<void>;
  registro: (datos: {
    nombre: string;
    correo: string;
    contraseña: string;
    telefono?: string;
    tipo_usuario_id: number;
  }) => Promise<void>;
  logout: () => void;
  quickLogin: (rol: 'administrador' | 'estudiante' | 'docente' | 'personal') => Promise<void>;
  mostrarModalAuth: boolean;
  abrirModalAuth: () => void;
  cerrarModalAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('campus_find_token'));
  const [cargando, setCargando] = useState<boolean>(true);
  const [mostrarModalAuth, setMostrarModalAuth] = useState<boolean>(false);

  // Cargar perfil si existe token en localStorage
  useEffect(() => {
    async function verificarSesion() {
      const storedToken = localStorage.getItem('campus_find_token');
      if (!storedToken) {
        setCargando(false);
        return;
      }

      try {
        const res = await api.auth.perfil();
        if (res.success && res.usuario) {
          setUsuario(res.usuario);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Sesión expirada o token inválido:', err);
        logout();
      } finally {
        setCargando(false);
      }
    }

    verificarSesion();
  }, []);

  const login = async (correo: string, pass: string) => {
    setCargando(true);
    try {
      const res = await api.auth.login(correo, pass);
      if (res.success && res.token) {
        localStorage.setItem('campus_find_token', res.token);
        setToken(res.token);
        setUsuario(res.usuario);
        setMostrarModalAuth(false);
      }
    } finally {
      setCargando(false);
    }
  };

  const registro = async (datos: {
    nombre: string;
    correo: string;
    contraseña: string;
    telefono?: string;
    tipo_usuario_id: number;
  }) => {
    setCargando(true);
    try {
      const res = await api.auth.registro(datos);
      if (res.success && res.token) {
        localStorage.setItem('campus_find_token', res.token);
        setToken(res.token);
        setUsuario(res.usuario);
        setMostrarModalAuth(false);
      }
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('campus_find_token');
    setToken(null);
    setUsuario(null);
  };

  // Acceso rápido demo con 1 clic para testing
  const quickLogin = async (rol: 'administrador' | 'estudiante' | 'docente' | 'personal') => {
    const credenciales = {
      administrador: 'admin@campusfind.edu',
      estudiante: 'estudiante@campusfind.edu',
      docente: 'docente@campusfind.edu',
      personal: 'personal@campusfind.edu',
    };
    await login(credenciales[rol], 'password123');
  };

  const esAdmin = usuario?.rol === 'administrador';

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        esAdmin,
        login,
        registro,
        logout,
        quickLogin,
        mostrarModalAuth,
        abrirModalAuth: () => setMostrarModalAuth(true),
        cerrarModalAuth: () => setMostrarModalAuth(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
