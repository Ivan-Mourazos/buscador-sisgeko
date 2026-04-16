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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-scale-in">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Acceso Admin</h2>
                            <p className="text-sm text-gray-500 mt-1">Introduce as túas credenciais para continuar</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium animate-shake">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Usuario</label>
                            <input 
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-gray-700 placeholder:text-gray-400"
                                placeholder="ex: admin"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Contrasinal</label>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-gray-700 placeholder:text-gray-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        
                        <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100/50">
                            <p className="text-[11px] text-yellow-700 font-medium leading-relaxed">
                                <span className="font-bold uppercase mr-1">Acesso:</span> 
                                usuario: <code className="bg-yellow-100 px-1 rounded">angel</code> / contrasinal: <code className="bg-yellow-100 px-1 rounded">8613</code>
                            </p>
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-2xl shadow-lg shadow-yellow-500/30 transition-all active:scale-[0.98] mt-4"
                        >
                            Iniciar Sesión
                        </button>
                    </form>
                </div>
                
                <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Solo persoal autorizado. Se tes problemas contacta con IT.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
