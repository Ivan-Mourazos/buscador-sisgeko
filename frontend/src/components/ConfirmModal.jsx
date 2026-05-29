import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Aceptar", cancelText = "Cancelar", type = "danger" }) => {
    if (!isOpen) return null;

    const bgClasses = type === 'danger' 
        ? 'bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400' 
        : 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500 dark:text-yellow-400';

    const btnClasses = type === 'danger'
        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
        : 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/75 backdrop-blur-[3px] animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden transform transition-all animate-scale-in border border-gray-100/50 dark:border-zinc-700">
                <div className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-sm ${bgClasses}`}>
                        {type === 'danger' ? (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>
                    
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight px-2">{title}</h3>
                    <p className="text-sm text-gray-400 dark:text-zinc-500 font-medium leading-relaxed px-4">{message}</p>
                </div>

                <div className="p-6 bg-gray-50/50 dark:bg-zinc-950/20 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onCancel}
                        className="w-full px-6 py-3.5 text-gray-400 dark:text-zinc-500 font-bold hover:text-gray-600 dark:hover:text-zinc-300 transition-colors uppercase text-[10px] tracking-[0.2em]"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`w-full px-8 py-3.5 ${btnClasses} text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase text-[10px] tracking-[0.2em]`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
