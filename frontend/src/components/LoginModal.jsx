import React, { useState, useEffect } from 'react';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');

    // Bloquear scroll ao abrir o modal
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (data.success) {
                onLogin(data.user);
                onClose();
            } else {
                setError(data.message || 'Error de acceso');
            }
        } catch (err) {
            setError('Non se puido conectar co servidor');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#21212f] w-full max-w-md rounded-3xl shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] border dark:border-white/[0.12] overflow-hidden transform transition-all animate-scale-in">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Acceso Admin</h2>
                            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Introduce as túas credenciais para continuar</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm font-medium animate-shake">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Usuario</label>
                            <input 
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-yellow-50 dark:focus:ring-yellow-950/20 focus:border-yellow-400 dark:focus:border-yellow-500 transition-all outline-none text-gray-700 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                                placeholder="ex: admin"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Contrasinal</label>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-yellow-50 dark:focus:ring-yellow-950/20 focus:border-yellow-400 dark:focus:border-yellow-500 transition-all outline-none text-gray-700 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        


                        <button 
                            type="submit"
                            className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-2xl shadow-lg shadow-yellow-500/30 transition-all active:scale-[0.98] mt-4"
                        >
                            Iniciar Sesión
                        </button>
                    </form>
                </div>
                
                <div className="bg-gray-50 dark:bg-zinc-950/40 p-6 text-center border-t border-gray-100 dark:border-zinc-800">
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                        Solo persoal autorizado. Se tes problemas contacta con IT.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
