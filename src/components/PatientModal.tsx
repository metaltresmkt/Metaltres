import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { usePatients, Patient } from "../hooks/useSupabase";

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: Patient) => void;
  initialData?: Patient | null;
  mode?: 'create' | 'edit';
}

export function PatientModal({ isOpen, onClose, onSuccess, initialData, mode = 'create' }: PatientModalProps) {
  const { create, update } = usePatients();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cpf: '',
    birth_date: '',
    gender: '',
    weight: '',
    height: '',
    allergies: [] as string[]
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        cpf: initialData.cpf || '',
        birth_date: initialData.birth_date || '',
        gender: initialData.gender || '',
        weight: initialData.weight?.toString() || '',
        height: initialData.height?.toString() || '',
        allergies: initialData.allergies || []
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        cpf: '',
        birth_date: '',
        gender: '',
        weight: '',
        height: '',
        allergies: []
      });
    }
    setError(null);
  }, [initialData, mode, isOpen]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      // Sanitize payload: convert empty strings to null for nullable/date columns
      // and keep weight/height as strings to match DB and preserve commas/formatting.
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        cpf: formData.cpf.trim() || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        weight: formData.weight || null,
        height: formData.height || null,
        allergies: formData.allergies,
        is_active: true
      };

      let result;
      if (mode === 'edit' && initialData) {
        const success = await update(initialData.id, payload);
        if (success) result = { ...initialData, ...payload } as Patient;
      } else {
        result = await create(payload);
      }

      if (result) {
        if (onSuccess) onSuccess(result);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Erro ao salvar paciente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                {mode === 'create' ? 'Novo Paciente' : 'Editar Paciente'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Nome Completo */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400 font-bold text-slate-700 transition-all"
                    placeholder="Nome do Paciente"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400 font-bold text-slate-700 transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={e => setFormData(p => ({ ...p, cpf: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400 font-bold text-slate-700 transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>

                {/* Data Nascimento */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Data Nascimento
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={e => setFormData(p => ({ ...p, birth_date: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400 font-medium text-slate-700 transition-all appearance-none"
                    />
                  </div>
                </div>

                {/* Gênero */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Gênero
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400 font-bold text-slate-700 transition-all appearance-none"
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                {/* Peso */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Peso (KG)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400 font-bold text-slate-700 transition-all"
                    placeholder="70.5"
                  />
                </div>

                {/* Altura */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Altura (M)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.height}
                    onChange={e => setFormData(p => ({ ...p, height: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400 font-bold text-slate-700 transition-all"
                    placeholder="1.75"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3 text-rose-600 text-sm font-bold">
                  <X className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-4 p-8 border-t border-slate-100 bg-slate-50/50">
              <Button
                variant="outline"
                className="flex-1 h-12 font-bold text-slate-600 hover:bg-slate-100 border-slate-200"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-12 font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98]"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    {mode === 'create' ? 'Cadastrar' : 'Salvar Alterações'}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
