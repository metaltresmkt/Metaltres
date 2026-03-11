import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Wallet,
  TrendingUp,
  PieChart,
  Target,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion } from "framer-motion";

const revenueData = [
  { name: "Jan", revenue: 45000, expenses: 28000 },
  { name: "Fev", revenue: 52000, expenses: 30000 },
  { name: "Mar", revenue: 48000, expenses: 29000 },
  { name: "Abr", revenue: 61000, expenses: 32000 },
  { name: "Mai", revenue: 59000, expenses: 31000 },
  { name: "Jun", revenue: 68000, expenses: 34000 },
];

export function Finance() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Painel <span className="text-teal-600">Financeiro</span>
          </h2>
          <p className="text-slate-500 font-medium text-base">
            Acompanhe o crescimento e a saúde financeira da clínica.
          </p>
        </motion.div>

        <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-lg shadow-sm border border-slate-200">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-slate-600 text-sm">Faturamento em alta</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Faturamento Mensal",
            value: "R$ 68.000",
            trend: "+15.2%",
            positive: true,
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-50"
          },
          {
            title: "Despesas Totais",
            value: "R$ 34.000",
            trend: "+9.6%",
            positive: false,
            icon: CreditCard,
            color: "text-rose-400",
            bg: "bg-rose-50"
          },
          {
            title: "Lucro Líquido",
            value: "R$ 34.000",
            trend: "+21.4%",
            positive: true,
            icon: Wallet,
            color: "text-teal-600",
            bg: "bg-teal-50"
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border border-slate-200 shadow-sm overflow-hidden group">
              <div className={cn("h-1.5 w-full", stat.positive ? "bg-emerald-400" : "bg-rose-400")} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-1.5 rounded-lg transition-transform group-hover:scale-105", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={cn(
                    "flex items-center text-xs font-semibold px-2 py-0.5 rounded-md",
                    stat.positive ? "text-emerald-600 bg-emerald-100/50" : "text-rose-500 bg-rose-100/50"
                  )}>
                    {stat.positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {stat.trend}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">mês anterior</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="col-span-2 border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" />
              Receita vs Despesas
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={12}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={12}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value / 1000}k`}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                      padding: "0.75rem",
                      fontWeight: "500"
                    }}
                    cursor={{ stroke: '#0d9488', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Receita"
                    stroke="#0d9488"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    animationBegin={300}
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Despesas"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorExpenses)"
                    animationBegin={500}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-slate-900 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-400" />
              Faturamento por Profissional
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-6 mt-2">
              {[
                { name: "Dr. Carlos (Clínico Geral)", value: 28000, percent: 41, color: "bg-teal-400" },
                { name: "Dra. Julia (Odontologia)", value: 22000, percent: 32, color: "bg-slate-400" },
                { name: "Dr. Roberto (Psicologia)", value: 18000, percent: 27, color: "bg-emerald-400" },
              ].map((doctor, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-sm opacity-90 truncate pr-2">
                      {doctor.name}
                    </span>
                    <span className="text-xs font-bold whitespace-nowrap">
                      R$ {doctor.value.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${doctor.percent}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className={cn("h-full rounded-full shadow-sm", doctor.color)}
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>

            <motion.div
              whileHover={{ y: -5 }}
              className="mt-8 p-4 bg-white/10 rounded-xl border border-white/10 text-center cursor-pointer hover:bg-white/20 transition-all"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">
                Total Acumulado
              </div>
              <div className="text-2xl font-bold">R$ 412.500</div>
              <div className="text-xs font-medium text-teal-400 mt-1">Melhor resultado do ano</div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
