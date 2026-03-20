import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { FileText, Plus, Search, Calendar, User, DollarSign, Clock, Trash2, Edit2, CheckCircle2, XCircle, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import { useQuotes, useCustomers, useProducts, useQuoteItems, Quote, Product, Customer } from '../hooks/useSupabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Quotes() {
  const { data: quotes, loading: quotesLoading, create, update, remove } = useQuotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const filteredQuotes = quotes.filter(q => 
    q.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    rascunho: "secondary",
    enviado: "default",
    aprovado: "default", // will use a custom color if needed
    rejeitado: "destructive",
    cancelado: "destructive"
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Orçamentos</h2>
          <p className="text-slate-500 font-medium italic text-sm">Crie e gerencie propostas comerciais.</p>
        </div>
        <Button 
          onClick={() => { setEditingQuote(null); setIsModalOpen(true); }}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-100"
        >
          <Plus className="w-4 h-4" /> Novo Orçamento
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <Input 
          placeholder="Buscar por cliente ou observação..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode='popLayout'>
          {quotesLoading ? (
             Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse h-20 bg-slate-50 border-slate-100" />
            ))
          ) : filteredQuotes.length > 0 ? (
            filteredQuotes.map((quote) => (
              <motion.div
                key={quote.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="group hover:border-teal-200 transition-all duration-200">
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{quote.customer?.name || 'Cliente não identificado'}</h3>
                          <Badge variant={statusColors[quote.status]} className="capitalize text-[10px] px-2 py-0">
                            {quote.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(quote.created_at), "dd 'de' MMM", { locale: ptBR })}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {quote.seller?.name || 'Vendedor'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total_amount)}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Valor Total</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-teal-600" onClick={() => { setEditingQuote(quote); setIsModalOpen(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-600" onClick={async () => { if(confirm('Excluir orçamento?')) await remove(quote.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">Nenhum orçamento emitido</p>
              <p className="text-slate-400 text-sm">Comece clicando em "Novo Orçamento".</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {isModalOpen && (
        <QuoteModal 
          quote={editingQuote} 
          onClose={() => setIsModalOpen(false)}
          onSave={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function QuoteModal({ quote, onClose, onSave }: { quote: Quote | null, onClose: () => void, onSave: () => void }) {
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { create, update } = useQuotes();
  
  const [customerId, setCustomerId] = useState(quote?.customer_id || '');
  const [status, setStatus] = useState<Quote['status']>(quote?.status || 'rascunho');
  const [notes, setNotes] = useState(quote?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const data = {
      customer_id: customerId,
      status,
      notes,
      total_amount: 0 // Will normally be calculated from items, but for now just saving header
    };

    if (quote) {
      await update(quote.id, data);
    } else {
      await create(data);
    }
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{quote ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Informações Gerais</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-900">&times;</Button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</label>
              <select 
                value={customerId} 
                onChange={e => setCustomerId(e.target.value)}
                className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Selecione um cliente...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as any)}
                className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="rascunho">Rascunho</option>
                <option value="enviado">Enviado</option>
                <option value="aprovado">Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observações / Detalhes</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Entrega em 5 dias, instalação inclusa..."
                className="w-full min-h-[100px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {quote && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
               <div className="flex justify-between items-center">
                 <h4 className="font-bold text-slate-800 flex items-center gap-2">
                   Itens do Pedido
                   <Badge variant="secondary" className="rounded-md">Beta</Badge>
                 </h4>
                 <Button size="sm" variant="outline" className="text-xs gap-1 border-teal-200 text-teal-700 hover:bg-teal-50">
                    <Plus className="w-3 h-3" /> Adicionar Item
                 </Button>
               </div>
               <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-400 text-xs italic">
                 Funcionalidade de edição de itens em desenvolvimento.
               </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 font-bold">Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!customerId || loading}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg shadow-teal-100"
          >
            {loading ? 'Processando...' : quote ? 'Salvar Alterações' : 'Criar Orçamento'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
