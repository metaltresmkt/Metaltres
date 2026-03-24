import React, { useState, useEffect, useRef } from "react";
import { X, Send, Bot, User, Loader2, MessageSquare, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { useChatMessages, ChatMessage, Lead, useLeads } from "../hooks/useSupabase";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/src/lib/utils";

interface LeadChatProps {
  lead: Lead;
  onClose: () => void;
  showInput?: boolean;
}

function stripToolCallPrefix(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  if (!text.startsWith('[Used tools:')) return text;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') {
      depth--;
      if (depth === 0) return text.slice(i + 1).trimStart();
    }
  }
  return text;
}

function extractMessageText(message: any): string {
  if (!message) return '[Mídia]';
  
  // If it's a string, it might be stringified JSON from the DB or just a string
  if (typeof message === 'string') {
    let text = message.trim();
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const parsed = JSON.parse(text);
        return extractMessageText(parsed);
      } catch (e) {
        return stripToolCallPrefix(text) || '[Mídia]';
      }
    }
    return stripToolCallPrefix(text) || '[Mídia]';
  }

  // content can be string or array
  const rawData = message.content !== undefined ? message.content : (message.output || message.text || message.message || "");
  let content = '';
  
  if (Array.isArray(rawData)) {
    content = rawData
      .map((block: any) => block?.text || block?.content || '')
      .filter(Boolean)
      .join('\n');
  } else {
    content = typeof rawData === 'object' ? JSON.stringify(rawData) : String(rawData || '');
  }

  content = stripToolCallPrefix(content);
  return content.trim() || '[Mídia]';
}

export function LeadChat({ lead, onClose, showInput = true }: LeadChatProps) {
  const { data: messages, loading, send } = useChatMessages(lead.id);
  const { update: updateLead } = useLeads();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  // Solução Definitiva: MutationObserver para observar o DOM real
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollDown = () => {
      el.scrollTop = el.scrollHeight;
    };

    scrollDown();

    const observer = new MutationObserver(() => {
      scrollDown();
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true
    });

    let pings = 0;
    const interval = setInterval(() => {
      scrollDown();
      pings++;
      if (pings > 10) clearInterval(interval);
    }, 50);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [loading]);

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    await send({ 
      message: { role: 'user', content: content.trim() }, 
      lead_id: lead.id, 
      phone: lead.phone 
    });
    setContent("");
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col border-l border-slate-200"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-lg shadow-sm">
            {lead.name ? lead.name[0] : "?"}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{lead.name || "Sem Nome"}</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <button 
                onClick={() => updateLead(lead.id, { ai_enabled: !lead.ai_enabled })}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all border outline-none",
                  lead.ai_enabled 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm" 
                    : "bg-slate-50 border-slate-200 text-slate-400"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  lead.ai_enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                )} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  IA {lead.ai_enabled ? "Ativa" : "Pausada"}
                </span>
              </button>
              {lead.phone && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />
                    {lead.phone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-slate-50/50 custom-scrollbar relative block" ref={scrollRef}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Carregando conversa...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 opacity-50">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-teal-600" />
            </div>
            <p className="text-sm font-medium text-center max-w-[200px]">Nenhuma mensagem encontrada nesta jornada.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg) => {
              const isOutbound = msg.direction === 'outbound';
              const isAI = msg.sender === 'ai';
              const messageText = extractMessageText(msg.message);
              const isMedia = messageText === '[Mídia]';
              
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%] min-w-0",
                    isOutbound ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm shadow-sm max-w-full overflow-hidden break-words",
                    isOutbound 
                      ? (isAI ? "bg-teal-600 text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-200 rounded-tr-none")
                      : "bg-slate-200 text-slate-800 rounded-tl-none",
                    isMedia && "italic opacity-70"
                  )}>
                    {isMedia ? 'Mídia' : messageText}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 px-1">
                    {isAI && <Bot className="w-3 h-3 text-teal-600" />}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {isAI ? 'Comercial' : (isOutbound ? 'Você' : lead.name)} • {format(parseISO(msg.created_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input Area */}
      {showInput && (
        <div className="p-6 border-t border-slate-100 bg-white">
          <div className="relative group">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite uma mensagem..."
              className="w-full pl-4 pr-14 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium text-sm min-h-[50px] max-h-[150px] resize-none transition-all group-hover:bg-white"
            />
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className={cn(
                "absolute right-2 bottom-2 p-2 rounded-lg transition-all",
                content.trim() && !sending 
                  ? "bg-teal-600 text-white shadow-md hover:scale-105 active:scale-95" 
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 text-center font-medium">
            As respostas enviadas aqui serão encaminhadas via WhatsApp.
          </p>
        </div>
      )}
    </motion.div>
  );
}
