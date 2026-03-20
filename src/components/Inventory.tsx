import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { 
  Package, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  AlertTriangle, 
  MoreVertical,
  Filter,
  ArrowRightLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { useProducts, useInventory, Product, InventoryMovement } from '../hooks/useSupabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

export function Inventory() {
  const { data: products, loading: productsLoading, update: updateProduct } = useProducts();
  const { movements, loading: movementsLoading, addMovement } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'items' | 'history'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Estoque</h2>
          <p className="text-slate-500 font-medium italic text-sm">Controle de materiais, produtos e movimentações.</p>
        </div>
        <div className="flex gap-2">
           <Button 
            variant="outline"
            className="gap-2 border-slate-200 text-slate-600"
            onClick={() => setActiveTab(activeTab === 'items' ? 'history' : 'items')}
          >
            {activeTab === 'items' ? <History className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            {activeTab === 'items' ? 'Ver Histórico' : 'Ver Itens'}
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-100">
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-12 h-12 text-teal-600" />
          </div>
          <CardContent className="p-6">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total de Itens</div>
            <div className="text-3xl font-black text-slate-900">{products.length}</div>
            <div className="mt-2 text-xs text-slate-500 font-medium italic">Skus cadastrados no sistema</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
          </div>
          <CardContent className="p-6">
            <div className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-1 font-sans flex items-center gap-2">
              Estoque Baixo
              {lowStockProducts.length > 0 && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
            </div>
            <div className="text-3xl font-black text-slate-900">{lowStockProducts.length}</div>
            <div className="mt-2 text-xs text-slate-500 font-medium italic italic">Abaixo do nível mínimo de segurança</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowRightLeft className="w-12 h-12 text-teal-600" />
          </div>
          <CardContent className="p-6">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Movimentações (Mês)</div>
            <div className="text-3xl font-black text-slate-900">{movements.length}</div>
            <div className="mt-2 text-xs text-slate-500 font-medium italic">Entradas e saídas registradas</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <Input 
          placeholder="Filtrar por nome, categoria ou código..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 placeholder:text-slate-400"
        />
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-teal-600">
           <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'items' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Produto / SKU</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Estoque Atual</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Mínimo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode='popLayout'>
                  {productsLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                      </tr>
                    ))
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <motion.tr 
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs">
                              {product.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 line-clamp-1">{product.name}</div>
                              <div className="text-[10px] font-medium text-slate-400 font-mono tracking-tighter uppercase">{product.sku || 'Sem SKU'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-500 bg-white">
                            {product.category || 'Geral'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={cn(
                            "inline-flex items-center justify-center min-w-[60px] py-1 px-3 rounded-lg text-sm font-black",
                            product.current_stock <= product.min_stock 
                              ? "bg-rose-50 text-rose-600 border border-rose-100" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          )}>
                            {product.current_stock}
                            <span className="ml-1 text-[10px] font-bold opacity-60 uppercase">{product.unit_type === 'unit' ? 'un' : product.unit_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-xs font-bold text-slate-400">{product.min_stock}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-[10px] font-bold gap-1.5 border-slate-200"
                              onClick={() => { setSelectedProduct(product); setIsMovementModalOpen(true); }}
                            >
                              <ArrowRightLeft className="w-3 h-3" /> Movimentar
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Nenhum produto encontrado.</td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <History className="w-4 h-4" /> Histórico Recente de Movimentações
            </h3>
            <div className="space-y-3">
              <AnimatePresence mode='popLayout'>
                {movementsLoading ? (
                   Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                   ))
                ) : movements.length > 0 ? (
                  movements.map((mv) => (
                    <motion.div
                      key={mv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-teal-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          mv.type === 'in' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {mv.type === 'in' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{mv.product?.name}</div>
                          <div className="text-[10px] font-medium text-slate-400 flex items-center gap-2">
                             <Badge variant="outline" className="text-[9px] py-0 px-1 border-slate-100 uppercase">{mv.reason}</Badge>
                             • {format(new Date(mv.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "text-sm font-black text-right",
                        mv.type === 'in' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {mv.type === 'in' ? '+' : '-'}{mv.quantity}
                        <div className="text-[9px] font-bold uppercase opacity-60">Qtd Movimentada</div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center text-slate-400 italic">Nenhuma movimentação registrada.</div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Basic Movement Modal Mockup */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <ArrowRightLeft className="w-5 h-5 text-teal-600" /> Movimentar Estoque
              </h3>
              <p className="text-slate-500 text-xs font-medium mt-1">Alterando estoque para: <span className="font-bold text-slate-700">{selectedProduct?.name}</span></p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                 <Button variant="outline" className="h-16 flex-col gap-1 border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                    <ArrowUpRight className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-emerald-700">Entrada</span>
                 </Button>
                 <Button variant="outline" className="h-16 flex-col gap-1 border-rose-100 bg-rose-50/20 hover:bg-rose-50 hover:border-rose-200 transition-all group">
                    <ArrowDownLeft className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-rose-700">Saída</span>
                 </Button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade</label>
                <Input type="number" placeholder="0.00" className="h-12 text-lg font-bold border-slate-200 focus:border-teal-500" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</label>
                <select className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none">
                   <option>Ajuste Manual</option>
                   <option>Compra de Material</option>
                   <option>Devolução</option>
                   <option>Uso em Produção</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button variant="ghost" onClick={() => setIsMovementModalOpen(false)} className="flex-1 font-bold text-slate-500">Cancelar</Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 font-bold shadow-lg shadow-teal-100" onClick={() => setIsMovementModalOpen(false)}>Confirmar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
