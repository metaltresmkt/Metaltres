import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
    Users,
    Plus,
    Star,
    Clock,
    Settings,
    ShieldCheck,
    Stethoscope,
    Heart,
    Activity,
    ChevronRight,
    UserCheck,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion } from "framer-motion";

const doctors = [
    { id: 1, name: "Dr. Carlos Eduardo", specialty: "Clínico Geral", crm: "CRM 12345-SP", status: "Atendendo", rating: 5.0, avatarColor: "bg-blue-50", icon: Stethoscope, tags: ["Destaque"] },
    { id: 2, name: "Dra. Julia Souza", specialty: "Odontologia", crm: "CRO 98765-SP", status: "Em Pausa", rating: 4.9, avatarColor: "bg-yellow-50", icon: UserCheck, tags: ["Cordial"] },
    { id: 3, name: "Dr. Roberto Silva", specialty: "Ortopedia", crm: "CRM 54321-SP", status: "Atendendo", rating: 5.0, avatarColor: "bg-purple-50", icon: Heart, tags: ["Especialista"] },
    { id: 4, name: "Dra. Patrícia Lima", specialty: "Cardiologia", crm: "CRM 24680-SP", status: "Atendendo", rating: 5.0, avatarColor: "bg-rose-50", icon: Heart, tags: ["Referência"] },
    { id: 5, name: "Dr. André Santos", specialty: "Oftalmologia", crm: "CRM 13579-SP", status: "Atendendo", rating: 4.8, avatarColor: "bg-emerald-50", icon: Star, tags: ["Experiente"] },
    { id: 6, name: "Dra. Fernanda Rocha", specialty: "Nutrição", crm: "CRM 97531-SP", status: "Em Pausa", rating: 4.9, avatarColor: "bg-orange-50", icon: Activity, tags: ["Especialista"] },
    { id: 7, name: "Dr. Bruno Menezes", specialty: "Fisioterapia", crm: "CRM 86420-SP", status: "Atendendo", rating: 4.7, avatarColor: "bg-indigo-50", icon: Stethoscope, tags: ["Dedicado"] },
    { id: 8, name: "Dra. Camila Alves", specialty: "Dermatologia", crm: "CRM 10293-SP", status: "Atendendo", rating: 5.0, avatarColor: "bg-pink-50", icon: Activity, tags: ["Destaque"] },
    { id: 9, name: "Dr. Tiago Oliveira", specialty: "Otorrinolaringologia", crm: "CRM 45678-SP", status: "Em Pausa", rating: 4.6, avatarColor: "bg-teal-50", icon: UserCheck, tags: ["Atencioso"] },
    { id: 10, name: "Dra. Beatriz Costa", specialty: "Endocrinologia", crm: "CRN 78901-SP", status: "Atendendo", rating: 4.9, avatarColor: "bg-lime-50", icon: Star, tags: ["Proativa"] },
];

export function DoctorsManagement() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        Corpo <span className="text-teal-600">Clínico</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-base">
                        Gerencie os profissionais e suas especialidades.
                    </p>
                </motion.div>
                <Button className="py-5 px-6 group">
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                    Adicionar Profissional
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doc, i) => (
                    <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                            <div className={cn("h-1.5 w-full", doc.status === "Atendendo" ? "bg-emerald-500" : "bg-amber-400")} />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform", doc.avatarColor)}>
                                        <doc.icon className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            <span className="text-xs font-bold text-amber-700">{doc.rating}</span>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                            doc.status === "Atendendo"
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : "bg-amber-50 text-amber-600 border-amber-100"
                                        )}>
                                            {doc.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                                        {doc.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                        <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                                        <span>{doc.specialty}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">{doc.crm}</p>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {doc.tags.map(tag => (
                                        <span key={tag} className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-3 py-0.5 rounded-md border border-teal-100">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" className="w-full h-9 flex gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        Agenda
                                    </Button>
                                    <Button variant="secondary" className="w-full h-9 flex gap-2">
                                        <Settings className="w-3.5 h-3.5" />
                                        Detalhes
                                    </Button>
                                </div>
                            </CardContent>

                            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-teal-50/30 transition-colors">
                                <span className="text-xs font-medium text-slate-400">Total de atendimentos: <span className="text-slate-700">1.2k+</span></span>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Card>
                    </motion.div>
                ))}

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: doctors.length * 0.05 }}
                >
                    <button className="w-full h-full min-h-[380px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 group hover:border-teal-300 hover:bg-teal-50/30 transition-all">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white group-hover:shadow-md transition-all">
                            <Plus className="w-8 h-8 text-teal-600" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">Novo Profissional</h4>
                        <p className="text-center text-slate-400 font-medium max-w-[200px] text-sm">
                            Adicione um novo membro ao corpo clínico.
                        </p>
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
