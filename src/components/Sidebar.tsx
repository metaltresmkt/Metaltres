import React from "react";
import {
  LayoutDashboard,
  Bot,
  CircleDollarSign,
  CalendarDays,
  ClipboardList,
  Users,
  Settings,
  Stethoscope,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion } from "framer-motion";

// Logo removed for professional medicine icon

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard, color: "text-emerald-600" },
    { id: "ai-secretary", label: "Assistente de Voz", icon: Bot, color: "text-teal-600" },
    { id: "finance", label: "Financeiro", icon: CircleDollarSign, color: "text-emerald-700" },
    { id: "appointments", label: "Agendamentos", icon: CalendarDays, color: "text-teal-700" },
    { id: "medical-records", label: "Prontuários", icon: ClipboardList, color: "text-slate-700" },
    { id: "doctors", label: "Corpo Clínico", icon: Users, color: "text-emerald-800" },
    { id: "settings", label: "Configurações", icon: Settings, color: "text-slate-500" },
  ];

  return (
    <div className="w-72 bg-white flex flex-col h-full border-r border-slate-200 shadow-sm z-10 transition-all duration-200">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-100">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-900 tracking-tight">Clinica</span>
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest -mt-1">Padrão</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 mt-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-teal-50 text-teal-900 border border-teal-100/50 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0",
                isActive ? "bg-white shadow-sm" : "bg-slate-50"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? item.color : "text-slate-300")} />
              </div>
              <span className="truncate">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-800 flex items-center justify-center text-white font-bold text-sm">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">Administrador</span>
              <span className="text-[10px] font-medium text-teal-600 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Autenticado
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
