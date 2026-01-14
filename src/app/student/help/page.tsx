'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Terminal,
    Send,
    Trash2,
    Bot,
    User,
    ChevronRight,
    Command,
    Loader2,
    ArrowLeft,
    Monitor
} from 'lucide-react';
import Link from 'next/link';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIHelpPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "SYSTEM INITIALIZED... WELCOME TO LEVELONE CORE COMMAND (POWERED BY GROQ LPU). I AM YOUR STRATEGIC AI ASSISTANT. HOW CAN I OPTIMIZE YOUR LEARNING JOURNEY TODAY?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare history for API call
            const history = currentMessages
                .filter((_, index) => index > 0)
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: history }),
            });

            const result = await response.json();

            if (result.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: result.text || "",
                    timestamp: new Date()
                }]);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error('AI Error:', error);

            let errorMessage = `CRITICAL SYSTEM ERROR: ${error?.message?.toUpperCase() || "UNABLE TO ACCESS GENERATIVE CORE"}. PLEASE CHECK YOUR UPLINK OR TRY AGAIN LATER.`;

            if (error?.message?.includes('429')) {
                errorMessage = "SYSTEM OVERLOAD: GROQ RATE LIMIT REACHED (429). PLEASE WAIT A MOMENT BEFORE YOUR NEXT COMMAND.";
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMessage,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: "DELETING LOCAL LOGS... SYSTEM REBOOTED. READY FOR NEW INSTRUCTIONS.",
                timestamp: new Date()
            }
        ]);
    };

    return (
        <div className="h-screen bg-black text-[#00ff41] font-mono selection:bg-[#00ff41] selection:text-black relative overflow-hidden flex flex-col">
            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>

            {/* CRT Flicker Effect (Stabilized) */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.015] bg-white"></div>

            {/* Header */}
            <div className="border-b border-[#003b11] p-4 flex items-center justify-between bg-black/80 backdrop-blur-xl relative z-20">
                <div className="flex items-center gap-4">
                    <Link
                        href="/student"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#003b11]/30 border border-[#00ff41]/30 hover:bg-[#00ff41]/10 hover:border-[#00ff41] transition-all text-[#00ff41] group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Back to Command Center</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest sm:hidden">Back</span>
                    </Link>
                    <div className="h-4 w-[1px] bg-[#003b11] hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 opacity-70" />
                        <span className="font-black text-sm tracking-widest uppercase opacity-90">Levelone.core.ai</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-[10px] opacity-70 text-[#00ff41]">
                        <span className="h-2 w-2 rounded-full bg-[#00ff41] shadow-[0_0_8px_#00ff41]"></span>
                        CORE ONLINE
                    </div>
                    <button
                        onClick={clearChat}
                        className="p-2 hover:bg-[#003b11]/50 rounded-lg text-[#00ff41]/60 transition-all hover:text-white"
                        title="Clear Buffer"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative z-0 custom-scrollbar"
            >
                <div className="max-w-4xl mx-auto space-y-8">
                    {messages.map((msg, i) => (
                        <div key={i} className={`group flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] uppercase font-bold tracking-tighter">
                                {msg.role === 'assistant' ? (
                                    <>
                                        <Bot className="h-3 w-3" />
                                        <span>LEVELONE_AI_v2.0</span>
                                    </>
                                ) : (
                                    <>
                                        <span>SYSTEM_USER</span>
                                        <User className="h-3 w-3" />
                                    </>
                                )}
                                <span>•</span>
                                <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>

                            <div className={`relative px-4 py-3 rounded-xl max-w-[90%] sm:max-w-[80%] border transition-all duration-300
                                ${msg.role === 'user'
                                    ? 'bg-[#003b11]/20 border-[#00ff41]/30 text-emerald-100 shadow-[0_0_15px_-5px_#00ff41]'
                                    : 'bg-black/50 border-[#003b11] text-[#00ff41] shadow-[0_0_20px_-10px_#003b11]'
                                }
                            `}>
                                <div className="prose prose-invert prose-emerald max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] uppercase font-bold tracking-tighter">
                                <Bot className="h-3 w-3" />
                                <span>LEVELONE_AI</span>
                                <span className="animate-pulse">_PROCESSING...</span>
                            </div>
                            <div className="bg-black/50 border border-[#003b11] p-4 rounded-xl shadow-[0_0_20px_-10px_#003b11]">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-[#003b11] bg-black relative z-20">
                <form
                    onSubmit={handleSendMessage}
                    className="max-w-4xl mx-auto relative group"
                >
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <ChevronRight className="h-5 w-5 text-[#00ff41] group-focus-within:animate-pulse" />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="ENTER_COMMAND..."
                        className="w-full bg-[#003b11]/10 border border-[#003b11] rounded-xl py-4 pl-12 pr-12 focus:outline-none focus:ring-1 focus:ring-[#00ff41] focus:border-[#00ff41] text-[#00ff41] placeholder:text-[#003b11] transition-all"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute inset-y-0 right-4 flex items-center text-[#00ff41] disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 transition-transform"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
                <div className="max-w-4xl mx-auto mt-2 flex justify-between items-center text-[8px] opacity-40 font-bold uppercase tracking-[0.2em]">
                    <span>Secure Uplink: AES-256</span>
                    <span className="flex items-center gap-1">
                        <Command className="h-2 w-2" /> made by aayush sharma
                    </span>
                    <span>Lat: 0.00ms</span>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #000;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #003b11;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #00ff41;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
