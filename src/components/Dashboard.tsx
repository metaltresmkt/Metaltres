import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users, CalendarCheck, TrendingUp, MessageSquare, Activity } from "lucide-react";
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

const data = [
  { name: "Seg", agendamentos: 24 },
  { name: "Ter", agendamentos: 32 },
  { name: "Qua", agendamentos: 28 },
  { name: "Qui", agendamentos: 41 },
  { name: "Sex", agendamentos: 39 },
  { name: "Sáb", agendamentos: 15 },
  { name: "Dom", agendamentos: 8 },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Painel <span className="text-teal-600">Administrativo</span>
          </h2>
          <p className="text-slate-500 font-medium text-base">
            Visão geral do desempenho clínico e atendimentos.
          </p>
        </motion.div>

        <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-600 font-semibold text-sm">
          <Activity className="w-4 h-4 text-teal-600" />
          <span>Sistemas operantes</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Agendamentos", value: "152", trend: "+18% mensal", icon: CalendarCheck, color: "bg-teal-50 text-teal-600" },
          { title: "Faturamento", value: "R$ 38.200", trend: "+15% mensal", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
          { title: "Atendimentos Digitais", value: "142", trend: "92% de eficiência", icon: MessageSquare, color: "bg-slate-50 text-slate-600" },
          { title: "Novos Pacientes", value: "+31", trend: "Este mês", icon: Users, color: "bg-teal-50 text-teal-700" },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden border border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-1.5 rounded-lg", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-[10px] font-medium text-slate-400">
                    {stat.trend}
                  </p>
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
                <BarChart data={data}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#79C2D9" />
                      <stop offset="100%" stopColor="#A3D8F4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="8 8"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={14}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={14}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: "#f0f9ff", radius: 10 }}
                    contentStyle={{
                      borderRadius: "20px",
                      border: "2px solid #e0f2fe",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontWeight: "bold",
                    }}
                  />
                  <Bar
                    dataKey="agendamentos"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              Atendimentos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: "Maria Silva",
                  status: "Agendado",
                  time: "Há 5 min",
                  doctor: "Dr. Carlos",
                  initials: "MS",
                  color: "bg-blue-100"
                },
                {
                  name: "João Pedro",
                  status: "Dúvida",
                  time: "Há 12 min",
                  doctor: "-",
                  initials: "JP",
                  color: "bg-yellow-100"
                },
                {
                  name: "Ana Costa",
                  status: "Agendado",
                  time: "Há 25 min",
                  doctor: "Dra. Julia",
                  initials: "AC",
                  color: "bg-pink-100"
                },
                {
                  name: "Roberto Alves",
                  status: "Humano",
                  time: "Há 1 hora",
                  doctor: "-",
                  initials: "RA",
                  color: "bg-purple-100"
                },
              ].map((chat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-slate-700 shadow-sm", chat.color)}>
                      {chat.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none">
                        {chat.name}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        {chat.doctor !== "-"
                          ? `Para: ${chat.doctor}`
                          : "Atendimento Geral"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                        chat.status === "Agendado"
                          ? "bg-emerald-100 text-emerald-700"
                          : chat.status === "Humano"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-teal-50 text-teal-700",
                      )}
                    >
                      {chat.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{chat.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
