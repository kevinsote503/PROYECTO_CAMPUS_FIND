/**
 * @file App.tsx
 * @description Componente raíz de Campus Find con enrutador de vistas, gestión de modales y contexto de usuario.
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ObjectDetailModal } from './components/ObjectDetailModal';
import { ClaimModal } from './components/ClaimModal';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ReportPage } from './pages/ReportPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { MyClaimsPage } from './pages/MyClaimsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CrudCenterPage } from './pages/CrudCenterPage';
import { Objeto } from './types';
import { School, Heart, Shield } from 'lucide-react';

function CampusFindApp() {
  const [vistaActual, setVistaActual] = useState<string>('inicio');
  const [tipoReporteSeleccionado, setTipoReporteSeleccionado] = useState<'perdido' | 'encontrado'>('perdido');

  // Filtros pasados desde la Home a la búsqueda
  const [filtroTextoBusqueda, setFiltroTextoBusqueda] = useState<string>('');
  const [filtroCategoriaBusqueda, setFiltroCategoriaBusqueda] = useState<string>('todas');

  // Estados de Modales
  const [objetoParaDetalle, setObjetoParaDetalle] = useState<Objeto | null>(null);
  const [objetoParaReclamar, setObjetoParaReclamar] = useState<Objeto | null>(null);

  // Manejador para abrir formulario de reporte
  const handleAbrirReporte = (tipo: 'perdido' | 'encontrado' = 'perdido') => {
    setTipoReporteSeleccionado(tipo);
    setVistaActual('reportar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Manejador para ir a la vista de búsqueda con filtros
  const handleIrABuscar = (texto?: string, categoriaId?: string) => {
    setFiltroTextoBusqueda(texto || '');
    setFiltroCategoriaBusqueda(categoriaId || 'todas');
    setVistaActual('buscar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Barra de navegación superior */}
      <Navbar
        vistaActual={vistaActual}
        setVistaActual={(vista) => {
          setVistaActual(vista);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        abrirFormularioReporte={handleAbrirReporte}
      />

      {/* Contenido principal según la vista seleccionada */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {vistaActual === 'inicio' && (
          <HomePage
            onIrABuscar={handleIrABuscar}
            onAbrirReporte={handleAbrirReporte}
            onIrACrud={() => {
              setVistaActual('crud');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onVerDetalle={(obj) => setObjetoParaDetalle(obj)}
            onReclamar={(obj) => setObjetoParaReclamar(obj)}
          />
        )}

        {vistaActual === 'crud' && (
          <CrudCenterPage
            onVerDetalleObjeto={(obj) => setObjetoParaDetalle(obj)}
            onIrAPanelAdmin={() => {
              setVistaActual('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {vistaActual === 'buscar' && (
          <SearchPage
            key={`${filtroTextoBusqueda}-${filtroCategoriaBusqueda}`}
            filtroTextoInicial={filtroTextoBusqueda}
            filtroCategoriaInicial={filtroCategoriaBusqueda}
            onVerDetalle={(obj) => setObjetoParaDetalle(obj)}
            onReclamar={(obj) => setObjetoParaReclamar(obj)}
          />
        )}

        {vistaActual === 'reportar' && (
          <ReportPage
            key={tipoReporteSeleccionado}
            tipoInicial={tipoReporteSeleccionado}
            onReporteCreado={() => {
              setVistaActual('mis-reportes');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onVerDetalleObjeto={(obj) => setObjetoParaDetalle(obj)}
          />
        )}

        {vistaActual === 'mis-reportes' && (
          <MyReportsPage
            onAbrirReporte={() => handleAbrirReporte('perdido')}
            onVerDetalle={(obj) => setObjetoParaDetalle(obj)}
          />
        )}

        {vistaActual === 'mis-reclamaciones' && (
          <MyClaimsPage
            onVerDetalleObjeto={(obj) => setObjetoParaDetalle(obj)}
            onIrABuscar={() => handleIrABuscar()}
          />
        )}

        {vistaActual === 'admin' && (
          <AdminDashboardPage
            onVerDetalleObjeto={(obj) => setObjetoParaDetalle(obj)}
            onIrACrud={() => {
              setVistaActual('crud');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Pie de página institucional */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-blue-700" />
            <span className="font-bold text-slate-800">Campus Find</span>
            <span>— Sistema Universitario de Objetos Perdidos y Encontrados</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Oficina de Seguridad y Vigilancia del Campus</span>
            <span>•</span>
            <span>Atención: Lunes a Viernes 08:00 - 18:00</span>
          </div>
        </div>
      </footer>

      {/* Modales globales */}
      <AuthModal />

      <ObjectDetailModal
        objeto={objetoParaDetalle}
        onCerrar={() => setObjetoParaDetalle(null)}
        onReclamar={(obj) => {
          setObjetoParaDetalle(null);
          setObjetoParaReclamar(obj);
        }}
      />

      <ClaimModal
        objeto={objetoParaReclamar}
        onCerrar={() => setObjetoParaReclamar(null)}
        onReclamacionCreada={() => {
          setVistaActual('mis-reclamaciones');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CampusFindApp />
    </AuthProvider>
  );
}
