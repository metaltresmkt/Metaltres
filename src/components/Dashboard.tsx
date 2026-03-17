import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users, CalendarCheck, TrendingUp, MessageSquare, Activity, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/src/lib/utils";
import { motion } from "framer-motion";
import { useDashboardStats } from "../hooks/useSupabase";

export function Dashboard() {
  const { data: stats, loading } = useDashboardStats();

  const chartData = [
    { name: "Seg", agendamentos: 0 },
    { name: "Ter", agendamentos: 0 },
    { name: "Qua", agendamentos: 0 },
    { name: "Qui", agendamentos: 0 },
    { name: "Sex", agendamentos: 0 },
    { name: "Sáb", agendamentos: 0 },
    { name: "Dom", agendamentos: 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Painel <span className="text-teal-600">Administrativo</span>
          </h2>
          <p className="text-slate-500 font-medium text-base">
            Visão geral do desempenho clínico e conversas.
          </p>
        </motion.div>
        <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-600 font-semibold text-sm">
          <Activity className="w-4 h-4 text-teal-600" />
          <span>Sistemas operantes</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Agendamentos", value: stats.totalAppointments.toString(), trend: "Este mês", icon: CalendarCheck, color: "bg-teal-50 text-teal-600" },
          { title: "Faturamento", value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, trend: "Este mês", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
          { title: "Conversas Digitais", value: stats.totalMessages.toString(), trend: "Conversas", icon: MessageSquare, color: "bg-slate-50 text-slate-600" },
          { title: "Novos Pacientes", value: `+${stats.newPatients}`, trend: "Este mês", icon: Users, color: "bg-teal-50 text-teal-700" },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="overflow-hidden border border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</CardTitle>
                <div className={cn("p-1.5 rounded-lg", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-[10px] font-medium text-slate-400">{stat.trend}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              Volume de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={14} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={14} fontWeight="bold" tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#f0f9ff", radius: 10 }} contentStyle={{ borderRadius: "20px", border: "2px solid #e0f2fe", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: "bold" }} />
                  <Bar dataKey="agendamentos" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              Resumo do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="font-semibold text-lg">Comece a cadastrar dados</p>
                <p className="text-sm mt-1">Os dados do sistema aparecerão aqui conforme você cadastrar pacientes, agendamentos e leads.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
