import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import api from '../api';
import { useTranslation } from '../context/LanguageContext';

export default function Chatbot() {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'bot'|'user', text: string}[]>([
    { role: 'bot', text: t('Hello! I am the FARM2U Support Bot. How can I help you today?') }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const role = localStorage.getItem('role') || 'consumer';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const res = await api.post('/chat', { message: userMessage, role, lang: language });
      if (res.data.success) {
        // Small delay for natural feel
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'bot', text: res.data.response }]);
          setIsTyping(false);
        }, 600);
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting to the server. Please try again later." }]);
        setIsTyping(false);
      }, 600);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 hover:scale-110 bg-green-500 hover:bg-green-400'
        }`}
        style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}
      >
        <MessageSquare className="w-7 h-7 text-white" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-8 w-80 sm:w-96 rounded-3xl overflow-hidden transition-all duration-500 z-50 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'
        }`}
        style={{
          background: 'rgba(10, 25, 20, 0.95)',
          border: '1px solid rgba(34,197,94,0.3)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.1)'
        }}
      >
        {/* Header */}
        <div className="bg-[#114232] p-4 border-b border-green-500/20 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-shimmer" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-xl relative">
              <Bot className="w-5 h-5 text-green-400" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full animate-ping" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">{t('FARM2U Assistant')}</h3>
              <p className="text-green-400/80 text-xs">{t('Online')}</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="p-4 h-80 overflow-y-auto flex flex-col gap-4 scrollbar-thin">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-[#22c55e] text-white rounded-br-sm' 
                  : 'bg-[#0f3d2b] text-gray-100 rounded-bl-sm border border-green-900/50'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#0f3d2b] p-3 rounded-2xl rounded-bl-sm border border-green-900/50 shadow-lg flex gap-1 items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-[#114232] border-t border-slate-800/50 flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('Ask something...')}
            className="flex-1 bg-[#0a1914] text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-green-500 transition-all placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-green-500/20 disabled:hover:text-green-400"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
}
