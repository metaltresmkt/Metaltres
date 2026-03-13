import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
    Search,
    FileText,
    History,
    Plus,
    Upload,
    Download,
    ExternalLink,
    User,
    Calendar,
    Scale,
    Ruler,
    AlertCircle,
    Stethoscope,
    MoreVertical,
    Filter,
    Loader2,
    Trash2,
    Edit2,
    X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";
import { usePatients, useMedicalRecords, useDoctors, Patient, MedicalRecord } from "../hooks/useSupabase";
import { PatientModal } from "./PatientModal";

export function MedicalRecords() {
    const { userRole } = useAuth();
    const { data: patients, loading: patientsLoading, create: createPatient, update: updatePatient, remove: removePatient, refetch: refetchPatients } = usePatients();
    const { data: doctors } = useDoctors();
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { data: records, loading: recordsLoading, create: createRecord, update: updateRecord, remove: removeRecord } = useMedicalRecords(selectedPatient?.id || null);
    
    // Patient Modals/State
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [patientModalMode, setPatientModalMode] = useState<'create' | 'edit'>('create');
    const [patientFormData, setPatientFormData] = useState({
        name: '', phone: '', cpf: '', birth_date: '', gender: '', weight: '', height: '', allergies: [] as string[]
    });
    const [showDeletePatientConfirm, setShowDeletePatientConfirm] = useState(false);

    // Record Modals/State
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
    const [recordFormData, setRecordFormData] = useState({
        type: 'consulta' as any,
        description: '',
        diagnosis: '',
        prescription: '',
        doctor_id: '',
    });
    const [showDeleteRecordConfirm, setShowDeleteRecordConfirm] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (patients.length > 0 && !selectedPatient) {
            setSelectedPatient(patients[0]);
        }
    }, [patients]);

    const filteredPatients = patients.filter(p => {
        const term = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(term) || 
               p.cpf?.includes(term) || 
               p.phone?.includes(term);
    });

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const getAge = (birthDate: string | null) => {
        if (!birthDate) return '—';
        const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return `${years} anos`;
    };

    // Patient Actions
    const handleOpenCreatePatient = () => {
        setPatientModalMode('create');
        setPatientFormData({ name: '', phone: '', cpf: '', birth_date: '', gender: '', weight: '', height: '', allergies: [] });
        setShowPatientModal(true);
    };

    const handleOpenEditPatient = () => {
        if (!selectedPatient) return;
        setPatientModalMode('edit');
        setPatientFormData({
            name: selectedPatient.name,
            phone: selectedPatient.phone || '',
            cpf: selectedPatient.cpf || '',
            birth_date: selectedPatient.birth_date || '',
            gender: selectedPatient.gender || '',
            weight: selectedPatient.weight?.toString() || '',
            height: selectedPatient.height?.toString() || '',
            allergies: selectedPatient.allergies || []
        });
        setShowPatientModal(true);
    };

    const handleDeletePatient = async () => {
        if (!selectedPatient) return;
        setSubmitting(true);
        await removePatient(selectedPatient.id);
        setSelectedPatient(null);
        setShowDeletePatientConfirm(false);
        setSubmitting(false);
    };

    const handlePatientSuccess = (patient: Patient) => {
        if (patientModalMode === 'create') {
            setSelectedPatient(patient);
        }
        refetchPatients();
    };

    // Medical Record Actions
    const handleOpenCreateRecord = () => {
        if (!selectedPatient) return;
        setSelectedRecord(null);
        setRecordFormData({
            type: 'consulta',
            description: '',
            diagnosis: '',
            prescription: '',
            doctor_id: doctors[0]?.id || '',
        });
        setShowRecordModal(true);
    };

    const handleOpenEditRecord = (record: MedicalRecord) => {
        setSelectedRecord(record);
        setRecordFormData({
            type: record.type,
            description: record.description || '',
            diagnosis: record.diagnosis || '',
            prescription: record.prescription || '',
            doctor_id: record.doctor_id || '',
        });
        setShowRecordModal(true);
    };

    const handleRecordSubmit = async () => {
        if (!selectedPatient || !recordFormData.doctor_id) return;
        setSubmitting(true);
        const payload = {
            ...recordFormData,
            patient_id: selectedPatient.id,
        };
        if (selectedRecord) await updateRecord(selectedRecord.id, payload);
        else await createRecord(payload);
        setShowRecordModal(false);
        setSubmitting(false);
    };

    const handleDeleteRecord = async () => {
        if (!selectedRecord) return;
        setSubmitting(true);
        await removeRecord(selectedRecord.id);
        setShowDeleteRecordConfirm(false);
        setSelectedRecord(null);
        setSubmitting(false);
    };

    if (patientsLoading && patients.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-full gap-6 overflow-hidden">
            {/* Sidebar - Patient List */}
            <div className="w-72 flex flex-col gap-4 h-full shrink-0">
                <Button variant="outline" className="w-full justify-start h-11 px-4 gap-2 border-dashed border-teal-200 hover:border-teal-400 hover:bg-teal-50 text-teal-700 font-bold" onClick={handleOpenCreatePatient}>
                    <Plus className="w-4 h-4" />
                    Novo Paciente
                </Button>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                    <input type="text" placeholder="Buscar paciente..." className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg border border-slate-200 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 outline-none font-bold text-slate-700 placeholder:text-slate-400 transition-all text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                    {filteredPatients.map((patient) => (
                        <motion.button key={patient.id} whileHover={{ x: 3 }} onClick={() => setSelectedPatient(patient)} className={cn("w-full flex items-center gap-3 p-3 rounded-lg transition-all border text-left", selectedPatient?.id === patient.id ? "bg-white border-teal-200 shadow-sm" : "bg-white/50 border-transparent hover:bg-white hover:border-slate-200")}>
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600 uppercase">
                                {getInitials(patient.name)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-bold text-slate-700 text-sm leading-tight truncate">{patient.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{patient.phone || 'Sem telefone'}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Main Content - Patient Detail */}
            {selectedPatient ? (
                <div className="flex-1 overflow-y-auto pr-2 pb-8 custom-scrollbar space-y-6">
                    <Card className="border border-slate-200 shadow-sm relative overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center text-2xl font-bold text-slate-600 border border-slate-200 shrink-0 uppercase">
                                    {getInitials(selectedPatient.name)}
                                </div>
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedPatient.name}</h2>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100 uppercase">{selectedPatient.is_active ? 'Ativo' : 'Inativo'}</span>
                                                {selectedPatient.cpf && <span className="bg-teal-50 text-teal-700 px-3 py-0.5 rounded-md text-[10px] font-bold border border-teal-100 uppercase">CPF: {selectedPatient.cpf}</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" className="h-8 font-bold text-[10px] uppercase" onClick={handleOpenEditPatient}>Editar</Button>
                                            <Button variant="outline" size="sm" className="h-8 font-bold text-[10px] uppercase text-rose-500 border-rose-100 hover:bg-rose-50" onClick={() => setShowDeletePatientConfirm(true)}>Excluir</Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        {[{ icon: User, label: "Idade", val: getAge(selectedPatient.birth_date) }, { icon: Scale, label: "Peso", val: selectedPatient.weight ? `${selectedPatient.weight}kg` : '—' }, { icon: Ruler, label: "Altura", val: selectedPatient.height ? `${selectedPatient.height}m` : '—' }, { icon: Calendar, label: "Gênero", val: selectedPatient.gender || '—' }].map(it => (
                                            <div key={it.label} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                                <it.icon className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 leading-none">{it.label}</p>
                                                <p className="text-base font-bold text-slate-900 capitalize">{it.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <AnimatePresence>
                            {showDeletePatientConfirm && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-6 text-center">
                                    <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                                    <h4 className="text-lg font-bold text-slate-900 mb-1">Deseja excluir este paciente?</h4>
                                    <p className="text-sm text-slate-500 mb-6">Todos os prontuários vinculados também serão removidos. Esta ação é irreversível.</p>
                                    <div className="flex gap-4">
                                        <Button variant="outline" className="px-8 font-bold" onClick={() => setShowDeletePatientConfirm(false)}>Cancelar</Button>
                                        <Button className="px-8 font-bold bg-rose-600 hover:bg-rose-700" onClick={handleDeletePatient} disabled={submitting}>
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Confirmar Exclusão
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <History className="w-5 h-5 text-teal-600" /> Histórico Clínico
                            </h3>
                            <Button onClick={handleOpenCreateRecord} variant="outline" size="sm" className="h-8 font-bold text-[10px] uppercase gap-2 bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100">
                                <Plus className="w-4 h-4" /> Novo Registro
                            </Button>
                        </div>

                        {recordsLoading ? (
                            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-teal-600 animate-spin" /></div>
                        ) : records.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p className="font-bold text-lg">Nenhum prontuário</p>
                                <p className="text-sm mt-1">Este paciente ainda não possui registros médicos.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 before:rounded-full">
                                {records.map((item, i) => (
                                    <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative group pb-1">
                                        <div className="absolute -left-[22px] top-4 w-4 h-4 rounded-full bg-white border-2 border-teal-600 transition-transform group-hover:scale-110 z-10" />
                                        <Card className="border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(parseISO(item.created_at), 'dd MMM yyyy', { locale: ptBR })}</p>
                                                        <h4 className="text-base font-bold text-slate-900 mt-1 capitalize">{item.type}</h4>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleOpenEditRecord(item)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-all"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => { setSelectedRecord(item); setShowDeleteRecordConfirm(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                                {item.description && <p className="text-slate-600 font-medium text-sm leading-relaxed mb-4 whitespace-pre-wrap">{item.description}</p>}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                    {item.diagnosis && <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Diagnóstico</p><p className="text-sm font-bold text-slate-700">{item.diagnosis}</p></div>}
                                                    {item.prescription && <div className="p-3 bg-teal-50/30 rounded-lg border border-teal-100/50"><p className="text-[10px] font-bold text-teal-600 uppercase mb-1">Prescrição</p><p className="text-sm font-bold text-teal-800">{item.prescription}</p></div>}
                                                </div>
                                                {item.doctor?.name && (
                                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                                        <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                                                        <span className="text-xs font-bold text-slate-400 uppercase">Médico: <span className="text-slate-700">{item.doctor.name}</span></span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Card className="border border-slate-200 shadow-sm bg-slate-900 p-6 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-teal-500/20 transition-colors" />
                        <div className="relative z-10 space-y-4">
                            <AlertCircle className="w-6 h-6 text-white opacity-40" />
                            <div>
                                <h4 className="text-xl font-bold text-white leading-tight">Alergias & Alertas</h4>
                                <p className="text-white/60 font-bold mt-2 text-sm">{selectedPatient.allergies && selectedPatient.allergies.length > 0 ? selectedPatient.allergies.join(', ') : 'Nenhuma alergia registrada.'}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200">
                    <User className="w-16 h-16 mb-4 text-slate-200" />
                    <h3 className="text-xl font-bold text-slate-900">Selecione um Paciente</h3>
                    <p className="text-sm mt-1 max-w-xs text-center font-medium">Escolha um paciente na lista ao lado para visualizar e gerenciar seu prontuário médico.</p>
                </div>
            )}

            {/* Patient Modal */}
            <PatientModal
                isOpen={showPatientModal}
                onClose={() => setShowPatientModal(false)}
                onSuccess={handlePatientSuccess}
                initialData={selectedPatient}
                mode={patientModalMode}
            />

            {/* Medical Record Modal */}
            <AnimatePresence>
                {showRecordModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRecordModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900">{selectedRecord ? 'Editar Registro' : 'Nova Evolução Clínica'}</h3>
                                <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Tipo de Registro</label>
                                        <select value={recordFormData.type} onChange={e => setRecordFormData(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 font-bold text-sm">
                                            <option value="consulta">Consulta</option>
                                            <option value="retorno">Retorno</option>
                                            <option value="exame">Exame</option>
                                            <option value="procedimento">Procedimento</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Médico Responsável *</label>
                                        <select value={recordFormData.doctor_id} onChange={e => setRecordFormData(p => ({ ...p, doctor_id: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 font-bold text-sm">
                                            <option value="">Selecione um médico</option>
                                            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Evolução / Descrição *</label>
                                    <textarea rows={5} value={recordFormData.description} onChange={e => setRecordFormData(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 font-medium text-sm resize-none" placeholder="Descreva os sintomas, observações e anamnese..." />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1 text-teal-600">Diagnóstico Principal</label>
                                        <input type="text" value={recordFormData.diagnosis} onChange={e => setRecordFormData(p => ({ ...p, diagnosis: e.target.value }))} className="w-full px-4 py-2.5 bg-teal-50/30 border border-teal-100 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 font-bold text-sm" placeholder="Ex: CID-10, Nome da patologia" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1 text-emerald-600">Prescrição / Tratamento</label>
                                        <input type="text" value={recordFormData.prescription} onChange={e => setRecordFormData(p => ({ ...p, prescription: e.target.value }))} className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-200 font-bold text-sm" placeholder="Ex: Medicamentos, doses, repouso" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50">
                                <Button variant="outline" className="flex-1 font-bold" onClick={() => setShowRecordModal(false)}>Cancelar</Button>
                                <Button className="flex-1 font-bold bg-teal-600 hover:bg-teal-700" onClick={handleRecordSubmit} disabled={!recordFormData.description || !recordFormData.doctor_id || submitting}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : selectedRecord ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {selectedRecord ? 'Atualizar Registro' : 'Salvar Evolução'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Record Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteRecordConfirm && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowDeleteRecordConfirm(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 text-center">
                                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-6 h-6 text-rose-600" /></div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Registro</h3>
                                <p className="text-slate-500 font-medium">Tem certeza que deseja excluir esta evolução clínica? Esta ação não pode ser desfeita.</p>
                                {selectedRecord && (
                                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-left border border-slate-100">
                                        <p className="font-bold text-slate-700 uppercase text-[10px] mb-1">{selectedRecord.type} - {format(parseISO(selectedRecord.created_at), 'dd/MM/yyyy')}</p>
                                        <p className="text-slate-500 line-clamp-2 italic">"{selectedRecord.description}"</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50">
                                <Button variant="outline" className="flex-1 font-bold" onClick={() => setShowDeleteRecordConfirm(false)}>Cancelar</Button>
                                <Button variant="destructive" className="flex-1 font-bold" onClick={handleDeleteRecord} disabled={submitting}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Excluir
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
