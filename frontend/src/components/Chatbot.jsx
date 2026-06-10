import React, { useState, useRef, useEffect } from 'react';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'assistant',
            text: 'Ola! Son SisgekoBot, o teu asistente de intelixencia artificial. Pregúntame calquera dúbida sobre toldos, procesos ou artigos de Toldos Gómez S.L.'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const quickQuestions = [
        '¿Que é un toldo cofre?',
        '¿Brazos para toldo Xacobeo?',
        '¿Cal é o proceso comercial?'
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (textToSend) => {
        const text = textToSend || inputText;
        if (!text.trim() || loading) return;

        const userMessage = {
            id: Date.now(),
            sender: 'user',
            text: text
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: messages
                })
            });
            const data = await response.json();
            if (data.success) {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'assistant',
                    text: data.reply
                }]);
            } else {
                throw new Error(data.message || 'Erro ao comunicar co chatbot');
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'assistant',
                text: `Erro de conexión: ${error.message}. Asegúrate de que o servidor backend está en execución.`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-24 right-8 z-[90] font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[350px] sm:w-[400px] h-[500px] bg-white/95 dark:bg-[#1a1a26]/95 backdrop-blur-xl border border-gray-200 dark:border-white/[0.12] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col mb-4 animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5">
                    {/* Header */}
                    <div className="p-5 border-b border-gray-100 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#21212f] flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-yellow-500 flex items-center justify-center text-black font-black shadow-lg shadow-yellow-500/20">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-none">SisgekoBot</h4>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    En liña (RAG)
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-grow p-4 overflow-y-auto custom-scrollbar space-y-4">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                            >
                                <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                                    msg.sender === 'user' 
                                    ? 'bg-yellow-500 text-black font-semibold rounded-br-none' 
                                    : 'bg-gray-100 dark:bg-[#21212f] text-gray-800 dark:text-zinc-200 rounded-bl-none border border-gray-200/50 dark:border-white/[0.10]'
                                }`}>
                                    {msg.text.split('\n').map((line, i) => (
                                        <p key={i} className={i > 0 ? "mt-1.5" : ""}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] p-4 rounded-2xl rounded-bl-none bg-gray-100 dark:bg-[#21212f] border border-gray-200/50 dark:border-white/[0.10] flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions suggestion */}
                    {messages.length === 1 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-2 animate-in fade-in duration-500">
                            {quickQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(q)}
                                    className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-450 border border-yellow-100 dark:border-yellow-900/30 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-yellow-100 dark:hover:bg-yellow-950/40 transition-all cursor-pointer"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Footer */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#1a1a26]/80 flex gap-2">
                        <input 
                            type="text" 
                            className="flex-grow px-4 py-2.5 bg-white dark:bg-[#21212f] border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 transition-all outline-none text-xs text-gray-800 dark:text-zinc-150 placeholder-gray-400 dark:placeholder-zinc-550"
                            placeholder="Escribe a túa pregunta..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={loading || !inputText.trim()}
                            className="p-2.5 bg-yellow-500 disabled:opacity-40 text-black rounded-xl shadow-md hover:bg-yellow-600 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                        >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9-7-9-7-9 7 9 7z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <div className="flex justify-end">
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
    );
};

export default Chatbot;
