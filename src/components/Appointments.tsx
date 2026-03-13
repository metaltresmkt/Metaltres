import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Bot,
  Phone,
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  Loader2,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";
import { useAppointments, useDoctors, usePatients } from "../hooks/useSupabase";
import { DoctorScheduleSettings } from "./DoctorScheduleSettings";

export function Appointments() {
  const { userRole, profile } = useAuth();
  const { data: appointments, loading, create, update, remove } = useAppointments();
  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();
  const [filter, setFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState<"all" | "today">("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [formData, setFormData] = useState({ patient_id: '', doctor_id: '', date: '', time: '', notes: '', status: 'pendente' as any });
  const [submitting, setSubmitting] = useState(false);
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [doctorToConfigure, setDoctorToConfigure] = useState<any>(null);

  const currentDoctor = useMemo(() => {
    return doctors.find(d => d.user_id === profile?.id);
  }, [doctors, profile?.id]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const patientName = apt.patient?.name || '';
      const doctorName = apt.doctor?.name || '';

      const matchesSearch = !searchTerm || patientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDoctor = filter === "Todos" || doctorName.includes(filter);
      const matchesDate = dateFilter === "today" ? apt.date === format(new Date(), 'yyyy-MM-dd') : true;
      return matchesSearch && matchesDoctor && matchesDate;
    });
  }, [appointments, filter, dateFilter, searchTerm]);

  const handleSubmit = async () => {
    if (!formData.patient_id || !formData.doctor_id || !formData.date || !formData.time) return;
    setSubmitting(true);
    
    if (selectedAppointment) {
      await update(selectedAppointment.id, formData);
    } else {
      await create({
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        date: formData.date,
        time: formData.time,
        notes: formData.notes || null,
        status: formData.status,
        source: 'manual',
      });
    }

    setFormData({ patient_id: '', doctor_id: '', date: '', time: '', notes: '', status: 'pendente' });
    setSelectedAppointment(null);
    setShowModal(false);
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    setSubmitting(true);
    await remove(selectedAppointment.id);
    setShowDeleteConfirm(false);
    setSelectedAppointment(null);
    setSubmitting(false);
  };

  const openEditModal = (apt: any) => {
    setSelectedAppointment(apt);
    setFormData({
      patient_id: apt.patient_id,
      doctor_id: apt.doctor_id,
      date: apt.date,
      time: apt.time,
      notes: apt.notes || '',
      status: apt.status
    });
    setShowModal(true);
  };

  const openDeleteConfirm = (apt: any) => {
    setSelectedAppointment(apt);
    setShowDeleteConfirm(true);
  };

  const statusLabel: Record<string, string> = {
    pendente: 'Pendente', confirmado: 'Confirmado', realizado: 'Realizado', cancelado: 'Cancelado', faltou: 'Faltou'
  };
  const statusColor: Record<string, string> = {
    confirmado: "bg-emerald-50 text-emerald-700 border-emerald-100",
    pendente: "bg-amber-50 text-amber-700 border-amber-100",
    realizado: "bg-teal-50 text-teal-700 border-teal-100",
    cancelado: "bg-rose-50 text-rose-600 border-rose-100",
    faltou: "bg-slate-50 text-slate-600 border-slate-100",
  };

  const uniqueDoctorNames = Array.from(new Set(appointments.map(a => a.doctor?.name).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {userRole === 'medico' ? 'Minha ' : 'Agenda de '}<span className="text-teal-600">Consultas</span>
          </h2>
          <p className="text-slate-500 font-medium text-base">
            {dateFilter === "today" ? "Consultas agendadas para hoje." : "Acompanhe todos os agendamentos."}
          </p>
        </motion.div>
        <div className="flex items-center gap-3">
          {userRole === 'medico' && currentDoctor && (
             <Button variant="outline" className="py-5 px-6 font-bold" onClick={() => { setDoctorToConfigure(currentDoctor); setShowScheduleSettings(true); }}>
               <Settings className="w-5 h-5 mr-2 text-slate-500" /> Configurar Agenda
             </Button>
          )}
          <Button className="py-5 px-6 group" onClick={() => { setSelectedAppointment(null); setFormData({ patient_id: '', doctor_id: '', date: '', time: '', notes: '', status: 'pendente' }); setShowModal(true); }}>
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            Nova Consulta
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-200 pb-4 px-6 bg-slate-50/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all font-medium text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <button onClick={() => setDateFilter("all")} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", dateFilter === "all" ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-900")}>Tudo</button>
                <button onClick={() => setDateFilter("today")} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", dateFilter === "today" ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-900")}>Hoje</button>
              </div>

              {userRole !== 'medico' && uniqueDoctorNames.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 max-w-2xl">
                  <button onClick={() => setFilter("Todos")} className={cn("px-2 py-1 text-[10px] font-semibold rounded-md transition-all whitespace-nowrap", filter === "Todos" ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-900")}>Todos</button>
                  {uniqueDoctorNames.map(name => (
                    <button key={name} onClick={() => setFilter(name!)} className={cn("px-2 py-1 text-[10px] font-semibold rounded-md transition-all whitespace-nowrap", filter === name ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-900")}>{name}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex bg-white p-1 rounded-lg border border-slate-200 w-fit">
              <button onClick={() => setViewMode("list")} className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-all", viewMode === "list" ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-900")}>Lista</button>
              <button onClick={() => setViewMode("calendar")} className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-all", viewMode === "calendar" ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-900")}>Calendário</button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {viewMode === "list" ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-x-auto">
                {filteredAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <CalendarIcon className="w-12 h-12 mb-4 text-slate-300" />
                    <p className="font-semibold text-lg">Nenhum agendamento encontrado</p>
                    <p className="text-sm mt-1">Clique em "Nova Consulta" para agendar.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-6 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">Paciente</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">Médico</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">Data</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">Origem</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">Status</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[10px] text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAppointments.map((apt, i) => (
                        <motion.tr key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-slate-50 group transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center"><User className="w-5 h-5 text-slate-600" /></div>
                              <span className="font-semibold text-slate-800">{apt.patient?.name || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600">
                            <div className="flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5 text-teal-600" />{apt.doctor?.name || '—'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="flex items-center text-slate-700 font-semibold text-sm"><CalendarIcon className="w-3.5 h-3.5 mr-2 text-teal-600" />{format(parseISO(apt.date), 'dd/MM/yyyy')}</span>
                              <span className="flex items-center text-slate-400 font-medium text-xs mt-0.5"><Clock className="w-3 h-3 mr-1.5" />{apt.time?.substring(0, 5)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {apt.source === "ia" ? (
                              <span className="inline-flex items-center text-[10px] font-semibold tracking-wider uppercase text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-100"><Bot className="w-3 h-3 mr-1" /> IA</span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-semibold tracking-wider uppercase text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Phone className="w-3 h-3 mr-1" /> Manual</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border", statusColor[apt.status] || statusColor.pendente)}>
                              {statusLabel[apt.status] || apt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(apt)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => openDeleteConfirm(apt)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            ) : (
              <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                <CalendarView currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} appointments={filteredAppointments} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-slate-200">
            <p className="text-sm font-medium text-slate-400">Mostrando {filteredAppointments.length} agendamentos.</p>
          </div>
        </CardContent>
      </Card>

      {/* Create Appointment Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">{selectedAppointment ? 'Editar Consulta' : 'Nova Consulta'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Paciente *</label>
                  <select value={formData.patient_id} onChange={e => setFormData(p => ({ ...p, patient_id: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium text-sm">
                    <option value="">Selecione...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Médico *</label>
                  <select value={formData.doctor_id} onChange={e => setFormData(p => ({ ...p, doctor_id: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium text-sm">
                    <option value="">Selecione...</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Data *</label>
                    <input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Horário *</label>
                    <input type="time" value={formData.time} onChange={e => setFormData(p => ({ ...p, time: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium text-sm">
                    {Object.entries(statusLabel).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Observações</label>
                  <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium text-sm resize-none" placeholder="Observações opcionais..." />
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={!formData.patient_id || !formData.doctor_id || !formData.date || !formData.time || submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : selectedAppointment ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {selectedAppointment ? 'Atualizar' : 'Agendar'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-6 h-6 text-rose-600" /></div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Agendamento</h3>
                <p className="text-slate-500">Tem certeza que deseja excluir esta consulta? Esta ação não pode ser desfeita.</p>
                {selectedAppointment && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-left border border-slate-100">
                    <p className="font-semibold text-slate-700">{selectedAppointment.patient?.name}</p>
                    <p className="text-slate-500 text-xs">{format(parseISO(selectedAppointment.date), 'dd/MM/yyyy')} às {selectedAppointment.time?.substring(0, 5)}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Excluir
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScheduleSettings && doctorToConfigure && (
          <DoctorScheduleSettings 
            doctor={doctorToConfigure} 
            onClose={() => {
              setShowScheduleSettings(false);
              setDoctorToConfigure(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CalendarView({ currentMonth, setCurrentMonth, appointments }: {
  currentMonth: Date, setCurrentMonth: (d: Date) => void, appointments: any[]
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-lg hover:bg-white"><ChevronLeft className="w-5 h-5 text-slate-600" /></Button>
        <h3 className="text-xl font-bold text-slate-900 capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-lg hover:bg-white"><ChevronRight className="w-5 h-5 text-slate-600" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{day}</div>
        ))}
        {calendarDays.map((date, i) => {
          const dayApts = appointments.filter(apt => apt.date === format(date, 'yyyy-MM-dd'));
          const isCurrentMonth = isSameMonth(date, monthStart);
          const isTodayDate = isToday(date);
          return (
            <div key={date.toString()} className={cn("min-h-[90px] p-2 rounded-lg border transition-all", isCurrentMonth ? "bg-white border-slate-100" : "bg-slate-50/50 border-transparent opacity-40", isTodayDate && "ring-2 ring-teal-500/30 border-teal-500 shadow-sm")}>
              <div className="flex justify-between items-start mb-1">
                <span className={cn("w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold", isTodayDate ? "bg-teal-600 text-white" : "text-slate-400")}>{format(date, 'd')}</span>
                {dayApts.length > 0 && isCurrentMonth && <span className="w-2 h-2 rounded-full bg-teal-500" />}
              </div>
              <div className="space-y-1 mt-1">
                {dayApts.slice(0, 3).map(apt => (
                  <div key={apt.id} className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded truncate", apt.status === "confirmado" ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700")}>
                    {apt.time?.substring(0, 5)} - {apt.patient?.name?.split(' ')[0] || '?'}
                  </div>
                ))}
                {dayApts.length > 3 && <div className="text-[10px] font-bold text-slate-400">+{dayApts.length - 3} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
