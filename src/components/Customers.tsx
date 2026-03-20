import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Users, Plus, Search, Phone, Mail, MapPin, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { useCustomers, Customer } from '../hooks/useSupabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

export function Customers() {
  const { data: customers, loading, create, update, remove } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.cpf?.includes(searchTerm)
  );

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await remove(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Clientes</h2>
          <p className="text-slate-500 font-medium italic text-sm">Base de clientes da Metaltres.</p>
        </div>
        <Button 
          onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-100"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <Input 
          placeholder="Buscar por nome, telefone ou CPF..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse border-slate-100">
                <div className="h-32 bg-slate-50 rounded-xl"></div>
              </Card>
            ))
          ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <motion.div
                key={customer.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border-slate-200 overflow-hidden">
                  <div className="h-1.5 bg-teal-500 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold">
                          {customer.name[0].toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-slate-800">{customer.name}</CardTitle>
                          {customer.cpf && <span className="text-[10px] text-slate-400 font-mono">{customer.cpf}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600" onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => handleDelete(customer.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <div className="space-y-2">
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {customer.email}
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>
                    {!customer.is_active && <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-0">Inativo</Badge>}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 font-bold">Nenhum cliente encontrado</p>
                <p className="text-slate-400 text-sm">Tente ajustar sua busca ou cadastre um novo cliente.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {isModalOpen && (
        <CustomerModal 
          customer={editingCustomer} 
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (val) => {
            if (editingCustomer) {
              await update(editingCustomer.id, val);
            } else {
              await create(val);
            }
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CustomerModal({ customer, onClose, onSubmit }: { customer: Customer | null, onClose: () => void, onSubmit: (val: any) => void }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    cpf: customer?.cpf || '',
    address: customer?.address || '',
    notes: customer?.notes || ''
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900">{customer ? 'Editar Cliente' : 'Novo Cliente'}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-900">&times;</Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nome do cliente" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone / WhatsApp</label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CPF</label>
              <Input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} placeholder="000.000.000-00" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</label>
              <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Endereço de Entrega</label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Rua, número, bairro, cidade..." />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observações</label>
              <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Detalhes adicionais..." />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button 
              onClick={() => onSubmit(formData)} 
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-100"
              disabled={!formData.name}
            >
              {customer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
