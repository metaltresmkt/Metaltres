import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Hammer, Clock, CheckCircle2, AlertCircle, MoreVertical, Play, Pause, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useProductionOrders, ProductionOrder } from '../hooks/useSupabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './ui/badge';

const STAGES = [
  { id: 'aguardando', label: 'Aguardando', color: 'bg-slate-100 text-slate-600', icon: Clock },
  { id: 'corte', label: 'Corte', color: 'bg-blue-50 text-blue-600', icon: Hammer },
  { id: 'montagem', label: 'Montagem', color: 'bg-amber-50 text-amber-600', icon: Hammer },
  { id: 'pronto', label: 'Pronto', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
  { id: 'entregue', label: 'Entregue', color: 'bg-teal-50 text-teal-700', icon: CheckCircle2 },
  { id: 'pausado', label: 'Pausado', color: 'bg-rose-50 text-rose-600', icon: Pause },
];

export function ProductionOrders() {
  const { data: orders, loading, updateStatus } = useProductionOrders();

  const getOrdersByStage = (stageId: string) => orders.filter(o => o.status === stageId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Produção</h2>
          <p className="text-slate-500 font-medium italic text-sm">Acompanhe o fluxo de fabricação em tempo real.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 gap-1.5 py-1.5 px-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             Live Sync
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 h-[calc(100vh-250px)] overflow-hidden">
        {STAGES.map((stage) => (
          <div key={stage.id} className="flex flex-col gap-3 h-full">
            <div className={`p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-white shadow-sm`}>
              <div className="flex items-center gap-2">
                <stage.icon className={`w-4 h-4 ${stage.color.split(' ')[1]}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{stage.label}</span>
              </div>
              <Badge variant="secondary" className="rounded-md font-bold">{getOrdersByStage(stage.id).length}</Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              <AnimatePresence mode='popLayout'>
                {getOrdersByStage(stage.id).map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="group hover:border-teal-300 transition-all cursor-grab active:cursor-grabbing border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-3 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                            {order.quote?.customer?.name || 'Pedido sem cliente'}
                          </h4>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                          <span>#{order.id.slice(0, 8)}</span>
                          <span className={`${order.priority === 'urgente' ? 'text-rose-500 font-bold' : ''}`}>
                            {order.priority}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-50 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] flex-1 gap-1 border-slate-100 hover:bg-slate-50 transition-colors"
                            onClick={() => {
                              const nextStage = STAGES[STAGES.findIndex(s => s.id === stage.id) + 1];
                              if (nextStage) updateStatus(order.id, nextStage.id as any);
                            }}
                          >
                             Avançar <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
