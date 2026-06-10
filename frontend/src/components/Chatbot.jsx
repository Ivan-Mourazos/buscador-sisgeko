import React, { useState, useRef, useEffect } from 'react';

const MessageBubble = ({ msg }) => {
    const isUser = msg.sender === 'user';
    const paragraphs = msg.text.split(/\n\n+/);

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
            <div className="max-w-[85%] flex flex-col gap-1">
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isUser
                    ? 'bg-yellow-500 text-black font-semibold rounded-br-none'
                    : 'bg-gray-100 dark:bg-[#21212f] text-gray-800 dark:text-zinc-200 rounded-bl-none border border-gray-200/50 dark:border-white/[0.10]'
                }`}>
                    {paragraphs.map((para, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>
                            {para.split('\n').map((line, j) => (
                                <span key={j} className={j > 0 ? 'block mt-1' : ''}>{line}</span>
                            ))}
                        </p>
                    ))}
                </div>
                {!isUser && msg.sources > 0 && (
                    <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest px-1 flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {msg.sources} {msg.sources === 1 ? 'rexistro' : 'rexistros'} consultados
                    </span>
                )}
            </div>
        </div>
    );
};

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'assistant',
            text: 'Ola! Son SisgekoBot, o teu asistente de intelixencia artificial. Pregúntame calquera dúbida sobre toldos, procesos ou artigos de Toldos Gómez S.L.',
            sources: 0
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const quickQuestions = [
        'Que é un toldo cofre?',
        'Brazos para toldo Xacobeo',
        'Cal é o proceso comercial?'
    ];

    useEffect(() => {
        const isMobile = window.innerWidth < 640;
        if (isOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (textToSend) => {
        const text = (textToSend || inputText).trim();
        if (!text || loading) return;

        const userMessage = { id: Date.now(), sender: 'user', text };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: messages })
            });
            const data = await response.json();
            if (data.success) {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'assistant',
                    text: data.reply,
                    sources: data.context?.filter(c => !c.startsWith('##')).length || 0
                }]);
            } else {
                throw new Error(data.message || 'Erro ao comunicar co chatbot');
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'assistant',
                text: `Erro de conexión: ${error.message}`,
                sources: 0
            }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const header = (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#21212f] flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center text-black shadow-lg shadow-yellow-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
                <div>
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-none">SisgekoBot</h4>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Asistente IA · RAG
                    </span>
                </div>
            </div>
            <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );

    const body = (
        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar space-y-3">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {loading && (
                <div className="flex justify-start">
                    <div className="p-3.5 rounded-2xl rounded-bl-none bg-gray-100 dark:bg-[#21212f] border border-gray-200/50 dark:border-white/[0.10] flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );

    const quickQ = messages.length === 1 ? (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {quickQuestions.map((q, idx) => (
                <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30 rounded-xl text-[10px] font-bold hover:bg-yellow-100 dark:hover:bg-yellow-950/40 transition-all cursor-pointer"
                >
                    {q}
                </button>
            ))}
        </div>
    ) : null;

    const footer = (
        <div className="p-3 border-t border-gray-100 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#1a1a26]/80 flex gap-2 flex-shrink-0">
            <input
                ref={inputRef}
                type="text"
                className="flex-grow px-4 py-2.5 bg-white dark:bg-[#21212f] border border-gray-200 dark:border-white/[0.10] rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all outline-none text-xs text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-500"
                placeholder="Escribe a túa pregunta..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
            />
            <button
                onClick={() => handleSend()}
                disabled={loading || !inputText.trim()}
                className="p-2.5 bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-xl shadow-md hover:bg-yellow-600 active:scale-95 transition-all cursor-pointer flex-shrink-0 flex items-center justify-center"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9-7-9-7v4l-7 3 7 3v4z" />
                </svg>
            </button>
        </div>
    );

    return (
        <>
            {/* MÓVIL: bottom sheet con backdrop */}
            {isOpen && (
                <>
                    <div
                        className="sm:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[88]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="sm:hidden fixed inset-x-0 bottom-0 z-[89] flex flex-col bg-white dark:bg-[#1a1a26] rounded-t-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300" style={{ height: '88dvh' }}>
                        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                        </div>
                        {header}
                        {body}
                        {quickQ}
                        {footer}
                    </div>
                </>
            )}

            {/* DESKTOP: burbuja flotante */}
            <div className="fixed bottom-5 right-5 sm:bottom-24 sm:right-8 z-[90] font-sans">
                {isOpen && (
                    <div className="hidden sm:flex w-[410px] h-[520px] bg-white/95 dark:bg-[#1a1a26]/95 backdrop-blur-xl border border-gray-200 dark:border-white/[0.12] rounded-[2rem] shadow-2xl overflow-hidden flex-col mb-4 animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5">
                        {header}
                        {body}
                        {quickQ}
                        {footer}
                    </div>
                )}

                <div className={`flex justify-end ${isOpen ? 'hidden sm:flex' : 'flex'}`}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-4 bg-yellow-500 text-black rounded-full shadow-[0_10px_25px_rgba(234,179,8,0.4)] hover:bg-yellow-600 hover:scale-110 active:scale-95 hover:shadow-[0_15px_35px_rgba(234,179,8,0.5)] transition-all cursor-pointer flex items-center justify-center"
                        title="Asistente SisgekoBot"
                    >
                        {isOpen ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Chatbot;
