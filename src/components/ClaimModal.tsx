/**
 * @file ClaimModal.tsx
 * @description Modal para que los usuarios envíen una reclamación formal ("Creo que es mío").
 */

import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Objeto } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ClaimModalProps {
  objeto: Objeto | null;
  onCerrar: () => void;
  onReclamacionCreada: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  objeto,
  onCerrar,
  onReclamacionCreada,
}) => {
  const { usuario, abrirModalAuth } = useAuth();
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  if (!objeto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) {
      abrirModalAuth();
      return;
    }

    if (descripcion.trim().length < 10) {
      setError('Por favor detalla con mayor precisión las evidencias o marcas para validar que te pertenece (mínimo 10 caracteres).');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await api.reclamaciones.crear({
        objeto_id: objeto.id,
        descripcion: descripcion.trim(),
      });
      setExito(true);
      setTimeout(() => {
        onReclamacionCreada();
        onCerrar();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la reclamación.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="modal-formulario-reclamacion"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
      >
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-700/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">
                Reclamar Objeto
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[280px]">
                {objeto.titulo}
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        {exito ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              ¡Reclamación Enviada con Éxito!
            </h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Tu solicitud ha sido remitida a la administración universitaria.
              Revisaremos las evidencias y recibirás el estado en tu sección de "Mis Reclamaciones".
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>¿Cómo validamos la propiedad?</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Describe detalles específicos que no aparezcan en la foto o título general:
                marcas de uso particulares, calcomanías, contraseñas, número de serie o contenido interno de bolsillos/carpetas.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="input-descripcion-reclamacion"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Evidencias y Detalles Específicos *
              </label>
              <textarea
                id="input-descripcion-reclamacion"
                required
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ejemplo: Tiene un rayón en la esquina superior izquierda, la funda es de marca Spigen y dentro de la calculadora hay anotada una fórmula en lápiz..."
                className="w-full text-sm rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 p-3 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCerrar}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirmar-reclamacion"
                type="submit"
                disabled={enviando}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-md shadow-blue-700/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {enviando ? 'Enviando solicitud...' : 'Confirmar Reclamación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClaimModal;
