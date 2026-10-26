/**
 * @file DeliveryModal.tsx
 * @description Modal de registro oficial de entrega de objeto recuperado (Panel Administrador).
 */

import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';
import { Reclamacion } from '../types';
import { api } from '../services/api';

interface DeliveryModalProps {
  reclamacion: Reclamacion | null;
  onCerrar: () => void;
  onEntregaRegistrada: () => void;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  reclamacion,
  onCerrar,
  onEntregaRegistrada,
}) => {
  const [observaciones, setObservaciones] = useState(
    'Entrega formal realizada en caseta de seguridad central previa verificación de identidad con credencial universitaria.'
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reclamacion) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      await api.entregas.registrar({
        reclamacion_id: reclamacion.id,
        observaciones: observaciones.trim(),
      });
      onEntregaRegistrada();
      onCerrar();
    } catch (err: any) {
      setError(err.message || 'Error al registrar la entrega.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="modal-registro-entrega"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-700/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">
                Registrar Entrega Oficial
              </h3>
              <p className="text-xs text-purple-800">
                Reclamación #{reclamacion.id} - {reclamacion.objeto?.titulo}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Reclamante:</span>
              <strong className="text-slate-900">{reclamacion.usuario?.nombre} ({reclamacion.usuario?.correo})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Objeto:</span>
              <strong className="text-slate-900">{reclamacion.objeto?.titulo}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ubicación original:</span>
              <span className="text-slate-700">{reclamacion.objeto?.ubicacion?.nombre}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observaciones de Entrega y Acta de Recepción *
            </label>
            <textarea
              required
              rows={4}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Indicar documento de identidad presentado, firma de recepción o notas pertinentes..."
              className="w-full text-sm rounded-xl border border-slate-300 focus:border-purple-700 focus:ring-2 focus:ring-purple-700/20 p-3 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p>
              Al registrar la entrega, el objeto cambiará su estado automáticamente a <strong>"Recuperado"</strong> y la entrega quedará registrada en el historial del campus.
            </p>
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
              type="submit"
              disabled={cargando}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-xl shadow-md shadow-purple-700/20 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {cargando ? 'Registrando...' : 'Confirmar Entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryModal;
