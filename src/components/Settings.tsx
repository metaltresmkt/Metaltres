import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
    Palette,
    Bot,
    Building2,
    Bell,
    Lock,
    Globe,
    Camera,
    Check,
    Info,
    Volume2,
    Trash2,
    CloudUpload,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Settings() {
    const [activeTab, setActiveTab] = useState<"branding" | "ai" | "clinic">("branding");

    const tabs = [
        { id: "branding", label: "Branding", icon: Palette, color: "text-teal-600" },
        { id: "ai", label: "Assistente IA", icon: Bot, color: "text-teal-600" },
        { id: "clinic", label: "Dados da Clínica", icon: Building2, color: "text-emerald-600" },
    ];

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        Configurações <span className="text-teal-600">do Sistema</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-base">
                        Personalize o ambiente e o comportamento do sistema.
                    </p>
                </motion.div>

                <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm border border-slate-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-md transition-all",
                                    isActive
                                        ? "bg-teal-600 text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-white" : tab.color)} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-8 custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {activeTab === "branding" && <BrandingSettings />}
                        {activeTab === "ai" && <AISettings />}
                        {activeTab === "clinic" && <ClinicSettings />}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/80 backdrop-blur-md sticky bottom-0 z-20">
                <Button variant="outline" className="px-8 h-10">
                    Descartar
                </Button>
                <Button className="px-8 h-10">
                    Salvar Alterações
                </Button>
            </div>
        </div>
    );
}

function BrandingSettings() {
    return (
        <div className="grid gap-8 md:grid-cols-2">
            <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-teal-600" />
                        Paleta de Cores
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cor Principal</label>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-lg bg-teal-600 shadow-sm border border-slate-200" />
                            <input type="text" value="#0d9488" className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cor Secundária</label>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-lg bg-slate-900 shadow-sm border border-slate-200" />
                            <input type="text" value="#0f172a" className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-teal-600" />
                        Identidade Visual
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-4 hover:bg-slate-50 transition-colors group">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                            <CloudUpload className="w-8 h-8 text-teal-600" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-900">Enviar Logotipo</p>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">PNG ou SVG (Máx 2MB)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="p-1.5 bg-white rounded-md shadow-sm">
                            <Info className="w-4 h-4 text-teal-600" />
                        </div>
                        <p className="text-xs font-medium text-slate-600">O logo aparecerá no topo da barra lateral e em todos os relatórios.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function AISettings() {
    return (
        <Card className="border border-slate-200 shadow-sm max-w-3xl mx-auto">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-6 px-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Bot className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Assistente Virtual</CardTitle>
                        <p className="text-slate-500 font-medium">Configure o comportamento da assistente automática.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Volume2 className="w-4 h-4" /> Tom de Voz
                        </label>
                        <span className="text-teal-600 font-semibold">Profissional & Cordial</span>
                    </div>
                    <input type="range" className="w-full accent-teal-600 h-2 rounded-full bg-slate-100" min="0" max="100" defaultValue="70" />
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        <span>Formal</span>
                        <span>Casual</span>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estilo de Resposta</label>
                        <select className="w-full px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 bg-white">
                            <option>Técnica & Precisa</option>
                            <option>Objetiva</option>
                            <option>Cordial & Informativa</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Velocidade de Resposta</label>
                        <select className="w-full px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 bg-white">
                            <option>Instantânea</option>
                            <option>Cadenciada (Natural)</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex gap-4">
                    <Info className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                        <p className="font-bold text-slate-900 text-sm">Preview da Bio:</p>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            "Olá! Sou a assistente virtual da clínica. Estou aqui para ajudá-lo com agendamentos, informações sobre procedimentos e dúvidas gerais."
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ClinicSettings() {
    return (
        <Card className="border border-slate-200 shadow-sm max-w-4xl mx-auto">
            <CardContent className="p-8">
                <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Clínica</label>
                            <input type="text" value="Clínica Médica Padrão" className="w-full px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CNPJ</label>
                            <input type="text" value="12.345.678/0001-99" className="w-full px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone de Contato</label>
                            <input type="text" value="(11) 98765-4321" className="w-full px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Endereço</label>
                            <textarea className="w-full px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 h-[210px]" defaultValue="Rua da Saúde, 123 - Centro, São Paulo - SP" />
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-rose-50 rounded-lg border border-rose-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg text-rose-500 shadow-sm">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-700">Zona de Perigo</p>
                            <p className="text-xs font-medium text-slate-400">Apagar todos os dados da clínica permanentemente.</p>
                        </div>
                    </div>
                    <Button variant="outline" className="text-rose-500 hover:bg-rose-100 border-rose-200">Apagar Clínica</Button>
                </div>
            </CardContent>
        </Card>
    );
}
