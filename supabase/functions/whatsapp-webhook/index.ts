import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const clinic_id = url.searchParams.get('clinic_id')

    if (!clinic_id) {
      throw new Error('clinic_id é obrigatório na URL do webhook.')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log(`Webhook recebido: ${body.event} para clinic_id: ${clinic_id}`)

    // Suporta Evolution API v1 e v2
    if (body.event === 'messages.upsert' || body.event === 'MESSAGES_UPSERT') {
      const message = body.data?.message || body.data?.[0]?.message
      const key = body.data?.key || body.data?.[0]?.key
      const pushName = body.data?.pushName || body.data?.[0]?.pushName
      
      if (!message || !key) return new Response('Ignored: No message data', { status: 200 })

      const remoteJid = key.remoteJid
      const phone = remoteJid.split('@')[0]
      const isFromMe = key.fromMe
      
      let text = ""
      if (message.conversation) text = message.conversation
      else if (message.extendedTextMessage?.text) text = message.extendedTextMessage.text
      else if (message.imageMessage?.caption) text = message.imageMessage.caption
      else if (message.videoMessage?.caption) text = message.videoMessage.caption
      
      if (!text && !isFromMe) {
        console.log("Mensagem sem texto ou tipo não suportado ainda.")
        return new Response('ok', { status: 200 })
      }

      // 1. Buscar ou cadastrar Lead/Cliente
      // Primeiro tentamos buscar em Customers (Clientes)
      const { data: customer } = await supabaseClient
        .from('customers')
        .select('id, name')
        .eq('clinic_id', clinic_id)
        .ilike('phone', `%${phone}%`)
        .maybeSingle()

      let leadId = null
      let customerId = customer?.id || null

      if (!customerId) {
        // Se não for cliente, buscamos em Leads
        const { data: lead } = await supabaseClient
          .from('leads')
          .select('id, name')
          .eq('clinic_id', clinic_id)
          .ilike('phone', `%${phone}%`)
          .maybeSingle()

        if (lead) {
          leadId = lead.id
        } else if (!isFromMe) {
          // Se não existir nada, criamos um novo lead
          const { data: newLead } = await supabaseClient
            .from('leads')
            .insert({
              clinic_id,
              phone,
              name: pushName || phone,
              status: 'novo',
              source: 'whatsapp'
            })
            .select()
            .single()
          leadId = newLead?.id
        }
      }

      // 2. Salvar Mensagem
      await supabaseClient
        .from('chat_messages')
        .insert({
          clinic_id,
          lead_id: leadId,
          customer_id: customerId,
          content: text,
          message: { role: isFromMe ? 'assistant' : 'user', content: text },
          direction: isFromMe ? 'outbound' : 'inbound',
          sender: isFromMe ? 'ai' : 'user',
          phone: phone
        })

      // 3. Atualizar última interação no Lead/Cliente
      if (leadId) {
        await supabaseClient
          .from('leads')
          .update({ 
            last_interaction_at: new Date().toISOString(),
            last_message_preview: text.substring(0, 100),
            last_message_by: isFromMe ? 'ai' : 'user'
          })
          .eq('id', leadId)
      } else if (customerId) {
        await supabaseClient
          .from('customers')
          .update({ 
            last_interaction_at: new Date().toISOString()
          })
          .eq('id', customerId)
      }

      // 4. Se for inbound, disparar o agendador de IA
      if (!isFromMe) {
          console.log("Disparando AI Scheduler...")
          fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-scheduler`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              },
              body: JSON.stringify({
                  clinic_id,
                  lead_id: leadId,
                  customer_id: customerId,
                  message: text
              })
          }).catch(err => console.error("Erro ao chamar AI Scheduler:", err))
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(`Erro: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
