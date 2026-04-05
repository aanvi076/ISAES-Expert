import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, WS_BASE_URL } from '../config';

// SESSION_ID is now handled dynamically within the component to prevent cross-student history leaks

const ChatWidget = ({ studentId }: { studentId: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed' | 'rest_fallback'>('closed');
  const [lastErrorCode, setLastErrorCode] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchInitialGreeting = async () => {
    const studentSession = `admin-session-${studentId}`;
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}`);
        const sData = await res.json();
        const greeting = `Hello ${sData.name.split()[0]}, I'm ISAES. I've initialized a secure REST-fallback session for you. How can I help?`;
        setMessages([{ role: "assistant", content: greeting }]);
    } catch (e) {
        console.error("Fallback greeting failed", e);
    }
  };

  // Close and wipe chat completely whenever the active student ID changes
  useEffect(() => {
    setIsOpen(false);
    setMessages([]);
    if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
    }
  }, [studentId]);

  const connectWebSocket = () => {
    if (wsRef.current) wsRef.current.close();
    
    setConnectionStatus('connecting');
    const studentSession = `admin-session-${studentId}`;
    const wsUrl = `${WS_BASE_URL}/api/v1/chat/ws/${studentId}/${studentSession}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log("WebSocket Connected Successfully");
      setConnectionStatus('open');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
      setIsTyping(false);
    };

    ws.onclose = (event) => {
      console.log("WebSocket Disconnected:", event.code, event.reason);
      setConnectionStatus('rest_fallback'); // Switch to fallback immediately on fail
      if (messages.length === 0) fetchInitialGreeting();
      setLastErrorCode(event.code);
      wsRef.current = null;
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error Detected:", err);
      setConnectionStatus('closed');
    };
  };

  useEffect(() => {
    if (isOpen && !wsRef.current) {
        connectWebSocket();
    }
  }, [isOpen, studentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    // 1. Update UI immediately
    const userMsg = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // 2. Decide Transport
    if (connectionStatus === 'open' && wsRef.current) {
        wsRef.current.send(inputValue);
    } else {
        // REST FALLBACK MODE
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    session_id: `admin-session-${studentId}`,
                    message: inputValue
                })
            });
            const data = await res.json();
            setMessages((prev) => [...prev, data]);
        } catch (e) {
            setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble reaching the Intelligent Core via REST. Please check your connection." }]);
        } finally {
            setIsTyping(false);
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-8 z-50 font-sans">
      {/* Structural Minimalist Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest group"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Ask ISAES AI
          <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        </button>
      )}

      {/* Modern, Clean Chat Window */}
      {isOpen && (
        <div className="glass border border-white/40 w-80 sm:w-[420px] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden h-[600px] max-h-[85vh] animate-in fade-in slide-in-from-bottom-8 duration-500">
          
          {/* Header */}
          <div className="bg-slate-900/5 backdrop-blur-md border-b border-black/5 p-6 shrink-0 flex justify-between items-center z-10">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
               </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight">ISAES Copilot</h3>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'open' ? 'bg-emerald-500 animate-pulse' : connectionStatus === 'connecting' ? 'bg-amber-500 animate-bounce' : connectionStatus === 'rest_fallback' ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                    {connectionStatus === 'open' ? 'Secure Node Active' : connectionStatus === 'connecting' ? 'Relaying Context...' : connectionStatus === 'rest_fallback' ? 'Intelligence Hub (REST Fallback)' : (
                        <button onClick={connectWebSocket} className="hover:text-indigo-600 transition-colors underline decoration-rose-500/30 underline-offset-2">
                            Node Offline {lastErrorCode ? `(Code ${lastErrorCode})` : ''} - Click to Retry
                        </button>
                    )}
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/40 scroll-smooth">
            {messages.length === 0 && !isTyping && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner">
                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center opacity-50">Initializing Secure Context...</p>
                </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] px-5 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-3xl rounded-tr-none shadow-slate-200' 
                    : 'bg-white text-slate-700 rounded-3xl rounded-tl-none border border-slate-200/60 shadow-slate-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center w-16 h-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse delay-75" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse delay-150" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Buttons */}
          <div className="px-6 py-3 border-t border-black/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {["How to calculate CGPA?", "Honors Program requirements?", "Book an Advisor Meeting?"].map((q) => (
                  <button 
                      key={q} 
                      onClick={() => { setInputValue(q); }}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                  >
                      {q}
                  </button>
              ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900 shrink-0 flex gap-3 shadow-[0_-10px_20px_rgba(15,23,42,0.1)]">
            <textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query the ISAES system..."
              className="flex-1 max-h-32 bg-slate-800 text-slate-100 placeholder-slate-500 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-[44px]"
            />
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl px-5 h-[44px] flex items-center justify-center font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
