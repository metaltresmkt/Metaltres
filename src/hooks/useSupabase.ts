import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ==========================================
// SELLERS (Vendedores)
// ==========================================
export interface Seller {
  id: string;
  loja_id: string;
  user_id: string | null;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function useSellers() {
  const { profile } = useAuth();
  const [data, setData] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!profile?.loja_id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('loja_id', profile.loja_id)
      .order('name');
    
    if (error) { setError(error.message); if (!silent) setLoading(false); return; }
    setData(data || []);
    setError(null);
    if (!silent) setLoading(false);
  }, [profile?.loja_id]);

  useEffect(() => { 
    fetch(); 
    if (!profile?.loja_id) return;

    const channel = supabase
      .channel('sellers_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sellers',
        filter: `loja_id=eq.${profile.loja_id}`
      }, () => {
        fetch(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch, profile?.loja_id]);

  const create = async (seller: Partial<Seller>) => {
    if (!profile?.loja_id) return null;
    const { data, error } = await supabase
      .from('sellers')
      .insert({ ...seller, loja_id: profile.loja_id })
      .select()
      .single();
    if (error) { setError(error.message); return null; }
    return data;
  };

  const update = async (id: string, updates: Partial<Seller>) => {
    const { error } = await supabase.from('sellers').update(updates).eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('sellers').delete().eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  return { data, loading, error, refetch: fetch, create, update, remove };
}

// ==========================================
// CUSTOMERS (Clientes)
// ==========================================
export interface Customer {
  id: string;
  loja_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export function useCustomers() {
  const { profile } = useAuth();
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!profile?.loja_id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('loja_id', profile.loja_id)
      .order('name');
    
    if (error) { setError(error.message); if (!silent) setLoading(false); return; }
    setData(data || []);
    setError(null);
    if (!silent) setLoading(false);
  }, [profile?.loja_id]);

  useEffect(() => { 
    fetch(); 
    if (!profile?.loja_id) return;

    const channel = supabase
      .channel('customers_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'customers',
        filter: `loja_id=eq.${profile.loja_id}`
      }, () => {
        fetch(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch, profile?.loja_id]);

  const create = async (c: Partial<Customer>) => {
    if (!profile?.loja_id) return null;
    const { data, error } = await supabase
      .from('customers')
      .insert({ ...c, loja_id: profile.loja_id })
      .select()
      .single();
    if (error) { setError(error.message); return null; }
    return data;
  };

  const update = async (id: string, updates: Partial<Customer>) => {
    const { error } = await supabase.from('customers').update(updates).eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  return { data, loading, error, refetch: fetch, create, update, remove };
}

// ==========================================
// QUOTES (Orçamentos)
// ==========================================
export interface Quote {
  id: string;
  loja_id: string;
  customer_id: string;
  seller_id: string;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'cancelado';
  total_amount: number;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  customer?: { name: string; phone: string | null };
  seller?: { name: string };
  items?: QuoteItem[];
}

export function useQuotes() {
  const { profile, userRole } = useAuth();
  const [data, setData] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!profile?.loja_id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    
    let query = supabase
      .from('quotes')
      .select('*, customer:customers(name, phone), seller:sellers(name)')
      .eq('loja_id', profile.loja_id);

    if (userRole === 'vendedor') {
      // No schema original de médicos, o vendedor via apenas os dele.
      // Aqui podemos decidir se gestor vê tudo e vendedor vê apenas os dele.
      query = query.eq('seller_id', profile.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) { setError(error.message); if (!silent) setLoading(false); return; }
    setData(data || []);
    setError(null);
    if (!silent) setLoading(false);
  }, [profile?.loja_id, userRole, profile?.id]);

  useEffect(() => { 
    fetch(); 
    if (!profile?.loja_id) return;

    const channel = supabase
      .channel('quotes_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'quotes',
        filter: `loja_id=eq.${profile.loja_id}`
      }, () => {
        fetch(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch, profile?.loja_id]);

  const create = async (quote: Partial<Quote>) => {
    if (!profile?.loja_id) return null;
    const { data, error } = await supabase
      .from('quotes')
      .insert({ ...quote, loja_id: profile.loja_id })
      .select('*, customer:customers(name, phone), seller:sellers(name)')
      .single();
    if (error) { setError(error.message); return null; }
    return data;
  };

  const update = async (id: string, updates: Partial<Quote>) => {
    const { error } = await supabase.from('quotes').update(updates).eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  return { data, loading, error, refetch: fetch, create, update, remove };
}

// ==========================================
// PRODUCTS (Produtos)
// ==========================================
export interface Product {
  id: string;
  loja_id: string;
  name: string;
  description: string | null;
  category: string | null;
  base_price: number;
  unit_type: 'm2' | 'linear' | 'unit';
  sku: string | null;
  current_stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
}

export function useProducts() {
  const { profile } = useAuth();
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!profile?.loja_id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('loja_id', profile.loja_id)
      .order('name');
    
    if (error) { setError(error.message); if (!silent) setLoading(false); return; }
    setData(data || []);
    setError(null);
    if (!silent) setLoading(false);
  }, [profile?.loja_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (p: Partial<Product>) => {
    if (!profile?.loja_id) return null;
    const { data, error } = await supabase
      .from('products')
      .insert({ ...p, loja_id: profile.loja_id })
      .select()
      .single();
    if (error) { setError(error.message); return null; }
    return data;
  };

  const update = async (id: string, updates: Partial<Product>) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  return { data, loading, error, refetch: fetch, create, update, remove };
}

// ==========================================
// LEADS + FUNNEL STAGES
// ==========================================
export interface FunnelStage {
  id: string;
  loja_id: string;
  name: string;
  position: number;
  color: string | null;
  is_system: boolean;
  is_fixed: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  loja_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  stage_id: string | null;
  estimated_value: number | null;
  notes: string | null;
  ai_enabled: boolean;
  converted_customer_id: string | null;
  sla_breach_count: number;
  first_response_minutes: number | null;
  max_response_minutes: number | null;
  last_message_at: string | null;
  last_outbound_at: string | null;
  last_message_preview?: string | null;
  last_message_by?: string | null;
  created_at: string;
  updated_at: string;
}


export function useFunnelStages() {
  const { profile } = useAuth();
  const [data, setData] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.loja_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('funnel_stages')
      .select('*')
      .eq('loja_id', profile.loja_id)
      .order('position');
    setData(data || []);
    setLoading(false);
  }, [profile?.loja_id]);

  useEffect(() => { 
    fetch(); 
    if (!profile?.loja_id) return;

    const channel = supabase
      .channel('funnel_stages_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'funnel_stages',
        filter: `loja_id=eq.${profile.loja_id}`
      }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch, profile?.loja_id]);

  const update = async (id: string, updates: Partial<FunnelStage>) => {
    const { error } = await supabase.from('funnel_stages').update(updates).eq('id', id);
    if (error) return false;
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('funnel_stages').delete().eq('id', id);
    if (error) return false;
    return true;
  };

  const reorder = async (stages: FunnelStage[]) => {
    const updates = stages.map((s, idx) => 
      supabase.from('funnel_stages').update({ position: idx }).eq('id', s.id)
    );
    await Promise.all(updates);
    return true;
  };

  const create = async (stage: Partial<FunnelStage>) => {
    if (!profile?.loja_id) return null;
    const { data: lastStage } = await supabase
      .from('funnel_stages')
      .select('position')
      .eq('loja_id', profile.loja_id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newPosition = (lastStage?.position ?? -1) + 1;
    const { data, error } = await supabase
      .from('funnel_stages')
      .insert({ ...stage, loja_id: profile.loja_id, position: newPosition })
      .select()
      .single();
    if (error) return null;
    return data;
  };

  return { data, loading, refetch: fetch, create, update, remove, reorder };
}

export function useLeads() {
  const { profile } = useAuth();
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!profile?.loja_id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('loja_id', profile.loja_id)
      .order('updated_at', { ascending: false, nullsFirst: false });
    
    if (error) { setError(error.message); if (!silent) setLoading(false); return; }
    setData(data || []);
    setError(null);
    if (!silent) setLoading(false);
  }, [profile?.loja_id]);

  useEffect(() => { 
    fetch(); 
    if (!profile?.loja_id) return;

    const channel = supabase
      .channel('leads_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leads',
        filter: `loja_id=eq.${profile.loja_id}`
      }, () => {
        fetch(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch, profile?.loja_id]);

  const create = async (lead: Partial<Lead>) => {
    if (!profile?.loja_id) return null;
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...lead, loja_id: profile.loja_id })
      .select()
      .single();
    if (error) { setError(error.message); return null; }
    return data;
  };

  const update = async (id: string, updates: Partial<Lead>) => {
    const { error } = await supabase.from('leads').update(updates).eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  return { data, loading, error, refetch: fetch, create, update, remove };
}

// ==========================================
// DASHBOARD STATS (Realtime automatic refetch)
// ==========================================
export interface DashboardStats {
  totalQuotes: number;
  totalRevenue: number;
  totalMessages: number;
  newCustomers: number;
}

export function useDashboardStats() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardStats>({
    totalQuotes: 0, totalRevenue: 0, totalMessages: 0, newCustomers: 0
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!profile?.loja_id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const clinicId = profile!.loja_id;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Queries adaptadas para Loja de Telas
    const [quotesRes, revenueRes, customersRes, messagesRes] = await Promise.all([
      supabase.from('quotes').select('id', { count: 'exact', head: true })
        .eq('loja_id', clinicId).gte('created_at', startOfMonth),
      supabase.from('financial_transactions').select('amount')
        .eq('loja_id', clinicId).eq('type', 'receita').eq('status', 'pago')
        .gte('date', startOfMonth).lte('date', endOfMonth),
      supabase.from('customers').select('id', { count: 'exact', head: true })
        .eq('loja_id', clinicId).gte('created_at', startOfMonth),
      supabase.from('chat_messages').select('id', { count: 'exact', head: true })
        .eq('loja_id', clinicId).gte('created_at', startOfMonth),
    ]);

    const totalRevenue = (revenueRes.data || []).reduce((sum, t) => sum + Number(t.amount || 0), 0);

    setData({
      totalQuotes: quotesRes.count || 0,
      totalRevenue,
      totalMessages: messagesRes.count || 0,
      newCustomers: customersRes.count || 0,
    });
    if (!silent) setLoading(false);
  }, [profile?.loja_id]);

  useEffect(() => {
    load();
    if (!profile?.loja_id) return;

    const channel = supabase
      .channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes', filter: `loja_id=eq.${profile.loja_id}` }, () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions', filter: `loja_id=eq.${profile.loja_id}` }, () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `loja_id=eq.${profile.loja_id}` }, () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `loja_id=eq.${profile.loja_id}` }, () => load(true))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load, profile?.loja_id]);

  return { data, loading, refetch: load };
}

// ==========================================
// FINANCIAL TRANSACTIONS
// ==========================================
export interface FinancialTransaction {
  id: string;
  loja_id: string;
  customer_id: string | null;
  quote_id: string | null;
  type: 'receita' | 'despesa';
  category: string | null;
  amount: number;
  description: string | null;
  payment_method: 'pix' | 'cartao' | 'dinheiro' | 'boleto' | null;
  status: 'pago' | 'pendente' | 'cancelado';
  date: string;
  created_at: string;
}

export function useFinancial() {
  const { profile } = useAuth();
  const [data, setData] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!profile?.loja_id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('loja_id', profile.loja_id)
      .order('date', { ascending: false });
    
    if (error) { setError(error.message); if (!silent) setLoading(false); return; }
    setData(data || []);
    setError(null);
    if (!silent) setLoading(false);
  }, [profile?.loja_id]);

  useEffect(() => { 
    fetch(); 
    if (!profile?.loja_id) return;

    const channel = supabase
      .channel('financial_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'financial_transactions',
        filter: `loja_id=eq.${profile.loja_id}`
      }, () => {
        fetch(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch, profile?.loja_id]);

  const create = async (tx: Partial<FinancialTransaction>) => {
    if (!profile?.loja_id) return null;
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert({ ...tx, loja_id: profile.loja_id })
      .select()
      .single();
    if (error) { setError(error.message); return null; }
    return data;
  };

  const update = async (id: string, updates: Partial<FinancialTransaction>) => {
    const { error } = await supabase.from('financial_transactions').update(updates).eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  };

  return { data, loading, error, refetch: fetch, create, update, remove };
}

// ==========================================
// QUOTE ITEMS (Itens do Orçamento)
// ==========================================
export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string;
  width: number | null;
  height: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  // Joined
  product?: { name: string; unit_type: string };
}

export function useQuoteItems(quoteId: string | null) {
  const [data, setData] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!quoteId) { setData([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('quote_items')
      .select('*, product:products(name, unit_type)')
      .eq('quote_id', quoteId);
    setData(data || []);
    setLoading(false);
  }, [quoteId]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (item: Partial<QuoteItem>) => {
    const { data, error } = await supabase
      .from('quote_items')
      .insert({ ...item, quote_id: quoteId })
      .select()
      .single();
    if (error) return null;
    fetch();
    return data;
  };

  const remove = async (id: string) => {
    await supabase.from('quote_items').delete().eq('id', id);
    fetch();
  };

  return { data, loading, add, remove };
}

// ==========================================
// PRODUCTION ORDERS (Ordem de Produção)
// ==========================================
export interface ProductionOrder {
  id: string;
  loja_id: string;
  quote_id: string | null;
  status: 'aguardando' | 'corte' | 'montagem' | 'pronto' | 'entregue' | 'pausado';
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  // Joined
  quote?: {
    customer: { name: string };
  };
}

export function useProductionOrders() {
  const { profile } = useAuth();
  const [data, setData] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (silent = false) => {
    if (!profile?.loja_id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from('production_orders')
      .select('*, quote:quotes(customer:customers(name))')
      .eq('loja_id', profile.loja_id)
      .order('created_at', { ascending: false });
    setData(data || []);
    setLoading(false);
  }, [profile?.loja_id]);

  useEffect(() => { 
    fetch(); 
    if (!profile?.loja_id) return;

    const channel = supabase
      .channel('production_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'production_orders',
        filter: `loja_id=eq.${profile.loja_id}`
      }, () => fetch(true))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch, profile?.loja_id]);

  const updateStatus = async (id: string, status: ProductionOrder['status']) => {
    await supabase.from('production_orders').update({ status }).eq('id', id);
    return true;
  };

  return { data, loading, updateStatus, refetch: fetch };
}

// ==========================================
// SETTINGS: CLINIC, AI & WHATSAPP
// ==========================================
export interface Clinic {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  primary_color: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  notification_group_id: string | null;
}

export interface AIConfig {
  id: string;
  loja_id: string;
  name: string | null;
  tone: number;
  response_style: 'tecnica' | 'objetiva' | 'cordial';
  response_speed: 'instantanea' | 'cadenciada';
  bio_text: string | null;
  prompt: string | null;
  phone: string | null;
  auto_schedule: boolean;
  confirm_enabled: boolean;
  confirm_message: string;
  confirm_lead_time: number;
  followup_enabled: boolean;
  followup_message: string;
  followup_delay: number;
  handoff_enabled: boolean;
  sla_minutes: number;
  business_hours: { start: string; end: string; days: number[] };
  default_ticket_value: number;
  updated_at: string;
}

export interface WhatsappInstance {
  id: string;
  loja_id: string;
  api_id?: string;
  api_token: string;
  phone_number: string | null;
  status: 'connected' | 'disconnected' | 'qr_pending' | 'connecting';
  connected_at: string | null;
  qr_code?: string;
}

export function useSettings() {
  const { profile } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null);
  const [whatsapp, setWhatsapp] = useState<WhatsappInstance | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (silent = false) => {
    if (!profile?.loja_id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);

    const [clinicRes, aiRes, waRes] = await Promise.all([
      supabase.from('lojas').select('*').eq('id', profile.loja_id).maybeSingle(),
      supabase.from('ai_config').select('*').eq('loja_id', profile.loja_id).maybeSingle(),
      supabase.from('whatsapp_instances').select('*').eq('loja_id', profile.loja_id).maybeSingle(),
    ]);

    setClinic(clinicRes.data);
    setAIConfig(aiRes.data);
    setWhatsapp(waRes.data);
    setLoading(false);
  }, [profile?.loja_id]);

  useEffect(() => { 
    fetch(); 
    if (!profile?.loja_id) return;

    const channel = supabase
      .channel('whatsapp_instances_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'whatsapp_instances',
        filter: `loja_id=eq.${profile.loja_id}`
      }, () => {
        fetch(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch, profile?.loja_id]);

  const updateClinic = async (updates: Partial<Clinic>) => {
    if (!profile?.loja_id) return false;
    const { error } = await supabase.from('lojas').update(updates).eq('id', profile.loja_id);
    if (!error) await fetch();
    return !error;
  };

  const updateAI = async (updates: Partial<AIConfig>) => {
    if (!profile?.loja_id) return false;
    const { error } = await supabase
      .from('ai_config')
      .upsert({ 
        ...updates, 
        loja_id: profile.loja_id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'loja_id' });
    if (!error) await fetch();
    return !error;
  };

  const updateWhatsapp = async (updates: Partial<WhatsappInstance>) => {
    if (!profile?.loja_id) return false;
    
    // Check if instance exists
    if (!whatsapp) {
      const { error } = await supabase.from('whatsapp_instances').insert({
        ...updates,
        loja_id: profile.loja_id
      });
      if (!error) await fetch();
      return !error;
    } else {
      const { error } = await supabase.from('whatsapp_instances').update(updates).eq('loja_id', profile.loja_id);
      if (!error) await fetch();
      return !error;
    }
  };

  return { clinic, aiConfig, whatsapp, loading, refetch: fetch, updateClinic, updateAI, updateWhatsapp };
}


// ==========================================
// CHAT MESSAGES
// ==========================================
export interface ChatMessage {
  id: string;
  loja_id: string;
  lead_id: string | null;
  direction: 'inbound' | 'outbound';
  sender: 'user' | 'ai' | 'system';
  message: {
    role?: string;
    type?: string;
    content?: string;
    text?: string;
    [key: string]: any;
  };
  phone: string | null;
  session_id: string | null;
  metadata: any;
  created_at: string;
}

export function useChatMessages(leadId?: string) {
  const { profile } = useAuth();
  const [data, setData] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clinicPhone, setClinicPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.loja_id) return;
    supabase
      .from('whatsapp_instances')
      .select('phone_number')
      .eq('loja_id', profile.loja_id)
      .maybeSingle()
      .then(({ data }) => setClinicPhone(data?.phone_number || null));
  }, [profile?.loja_id]);

  const parseMessage = (msg: any): any => {
    try {
      let data = msg;
      
      // Try to parse if it's a string
      if (typeof msg === 'string' && (msg.trim().startsWith('{') || msg.trim().startsWith('['))) {
        try { data = JSON.parse(msg); } catch { data = { content: msg }; }
      }

      // Unwrap arrays
      if (Array.isArray(data)) data = data[0] || {};

      // If it's not an object, wrap it
      if (!data || typeof data !== 'object') data = { content: String(msg || '') };

      // Handle LangChain / n8n specific object structures
      if (data.type === 'human' || data.type === 'ai' || data.type === 'system') {
        if (data.content !== undefined) {
          data = { content: data.content };
        }
      }

      // Priority extraction of content
      const rawContent = data.content !== undefined ? data.content : (data.output || data.text || data.message || "");
      
      // Strip [Used tools: ...] prefix
      let content = typeof rawContent === 'object' ? JSON.stringify(rawContent) : String(rawContent || "");
      
      // If content is STILL a stringified JSON (common in n8n pass-through), try one more parse
      if (content.trim().startsWith('{"type":') || content.trim().startsWith('{"content":')) {
        try {
          const inner = JSON.parse(content);
          if (inner.content !== undefined) content = inner.content;
        } catch {}
      }

      if (content.includes('[Used tools:')) {
        const startIdx = content.indexOf('[Used tools:');
        let depth = 0;
        let endIdx = -1;
        for (let i = startIdx; i < content.length; i++) {
          if (content[i] === '[') depth++;
          else if (content[i] === ']') {
            depth--;
            if (depth === 0) { endIdx = i; break; }
          }
        }
        if (endIdx !== -1) {
          content = (content.slice(0, startIdx) + content.slice(endIdx + 1)).trimStart();
        }
      }

      return {
        ...data,
        content: content
      };
    } catch (e) {
      return { content: String(msg || '') };
    }
  };

  const fetch = useCallback(async () => {
    if (!profile?.loja_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('loja_id', profile.loja_id);
    
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    
    if (error) { setError(error.message); setLoading(false); return; }
    
    const formattedData = (data || []).map(m => ({
      ...m,
      message: parseMessage(m.message)
    }));

    setData(formattedData);
    setError(null);
    setLoading(false);
  }, [profile?.loja_id, leadId]);

  useEffect(() => { 
    fetch(); 
    if (!profile?.loja_id) return;

    const channel = supabase
      .channel(`chat_${leadId || 'all'}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: leadId ? `lead_id=eq.${leadId}` : `loja_id=eq.${profile.loja_id}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (!leadId || newMsg.lead_id === leadId) {
          setData(prev => {
            // Evita duplicatas se o realtime mandar duas vezes ou fetch coincidir
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, {
              ...newMsg,
              message: parseMessage(newMsg.message)
            }];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch, profile?.loja_id, leadId]);

  const send = async (msg: Partial<ChatMessage>) => {
    if (!profile?.loja_id) return null;
    
    const leadPhone = msg.phone;
    const finalSessionId = msg.session_id || (clinicPhone && leadPhone ? `${clinicPhone}${leadPhone}` : null);

    // Prepare message object to ensure it matches the JSONB structure
    const messageObject = msg.message || {
      role: 'user',
      content: msg.message?.content || '' // Fallback if someone tried to pass partially
    };

    // If content was passed directly (legacy support while transitioning), wrap it
    if ((msg as any).content && !msg.message) {
      messageObject.content = (msg as any).content;
    }

    const insertData: any = { 
      loja_id: profile.loja_id, 
      direction: 'outbound', 
      sender: 'user',
      lead_id: leadId || msg.lead_id,
      session_id: finalSessionId,
      message: messageObject,
      phone: leadPhone
    };

    // Auto-create lead if missing and phone is present
    if (!insertData.lead_id && leadPhone) {
      // 1. Check if lead already exists for this phone
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('loja_id', profile.loja_id)
        .eq('phone', leadPhone)
        .maybeSingle();

      if (existingLead) {
        insertData.lead_id = existingLead.id;
      } else if (leadPhone !== clinicPhone) {
        // 2. Create new lead if not found and NOT the clinic phone
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            loja_id: profile.loja_id,
            name: `Lead ${leadPhone}`,
            phone: leadPhone,
            source: 'manual'
          })
          .select()
          .single();
        
        if (!leadError && newLead) {
          insertData.lead_id = newLead.id;
        }
      }
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(insertData)
      .select()
      .single();
    if (error) { setError(error.message); return null; }
    return data;
  };

  return { data, loading, error, refetch: fetch, send };
}

// ==========================================
// INVENTORY MOVEMENTS (Movimentações de Estoque)
// ==========================================
export interface InventoryMovement {
  id: string;
  loja_id: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: 'purchase' | 'sale' | 'adjustment' | 'production_usage' | 'return';
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  // Joined
  product?: { name: string; sku: string | null };
}

export function useInventory() {
  const { profile } = useAuth();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = useCallback(async (silent = false) => {
    if (!profile?.loja_id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*, product:products(name, sku)')
      .eq('loja_id', profile.loja_id)
      .order('created_at', { ascending: false });
    
    if (error) { setError(error.message); if (!silent) setLoading(false); return; }
    setMovements(data || []);
    setError(null);
    if (!silent) setLoading(false);
  }, [profile?.loja_id]);

  useEffect(() => { 
    fetchMovements(); 
  }, [fetchMovements]);

  const addMovement = async (movement: Partial<InventoryMovement>) => {
    if (!profile?.loja_id) return null;
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert({ 
        ...movement, 
        loja_id: profile.loja_id,
        created_by: profile.id
      })
      .select('*, product:products(name, sku)')
      .single();
    
    if (error) { setError(error.message); return null; }
    await fetchMovements(true);
    return data;
  };

  return { movements, loading, error, refetch: fetchMovements, addMovement };
}

