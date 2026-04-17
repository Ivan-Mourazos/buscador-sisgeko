import React, { useState, useEffect } from 'react';

const PendingTasksView = ({ onClose, onRefresh }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/pending-tasks');
            const data = await res.json();
            if (data.success) {
                setTasks(data.tasks);
            }
        } catch (err) {
            console.error("Error fetching tasks:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const safeParse = (str, fallbackTitle = 'Sen título') => {
        if (!str) return { titulo: fallbackTitle, resumen_edicion: '' };
        try {
            // Intentamos parsear si es JSON
            const parsed = typeof str === 'string' ? JSON.parse(str) : str;
            return {
                titulo: parsed.titulo || parsed.descripcion || fallbackTitle,
                resumen_edicion: parsed.resumen_edicion || ''
            };
        } catch (e) {
            // Si no es JSON, devolvemos el texto como título
            return { titulo: str, resumen_edicion: '' };
        }
    };

    const handleAction = async (taskId, type, action) => {
        const confirmMsg = action === 'approve' 
            ? '¿Confirmas a aprobación deste cambio?' 
            : '¿Confirmas o rexeitamento deste cambio?';
            
        if (!window.confirm(confirmMsg)) return;
        
        setProcessingId(taskId);
        try {
            const res = await fetch('/api/approve-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, type, action })
            });
            const data = await res.json();
            
            if (data.success) {
                alert(action === 'approve' ? 'Cambio aprobado con éxito' : 'Cambio rexeitado');
                fetchTasks();
                if (onRefresh) onRefresh();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (err) {
            alert('Error de conexión');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="flex flex-col animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tarefas Pendentes</h2>
                    <p className="text-gray-500 font-medium italic">Sistema de Revisión e Aprobación (Catro Ollos)</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-24">
                    <div className="w-12 h-12 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-gray-400">Cargando tarefas...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-bold text-lg">Todo ao día. Non hai cambios pendentes de revisar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tasks.map(task => (
                        <div key={`${task._type}-${task.ID}`} className="group bg-white border border-gray-100 p-6 rounded-[2rem] shadow-xl hover:shadow-2xl hover:border-yellow-200 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    task._type === 'definicion' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                    {task._type === 'definicion' ? 'Definición' : 'Insight'}
                                </span>
                                <span className="text-[10px] text-gray-300 font-bold">#{task.ID}</span>
                            </div>

                        {(() => {
                            const data = safeParse(task.comentario_cambio, task._type === 'definicion' ? 'Nova Definición' : 'Novo Insight');
                            return (
                                <>
                                    <h3 className="text-xl font-bold text-gray-900 leading-tight mb-4 line-clamp-2">
                                        {data.titulo}
                                    </h3>

                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 border border-white shadow-sm">
                                            {(task.editor || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Proposto por</p>
                                            <p className="text-sm text-gray-700 font-bold">{task.editor || 'Usuario'}</p>
                                        </div>
                                    </div>

                                    {data.resumen_edicion && (
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 relative">
                                            <svg className="absolute -top-2 -left-2 w-6 h-6 text-yellow-400/20" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V5C14.017 3.89543 14.9124 3 16.017 3H19.017C21.2261 3 23.017 4.79086 23.017 7V15C23.017 18.866 19.883 22 16.017 22H14.017V21ZM5.017 21V18C5.017 16.8954 5.91243 16 7.017 16H10.017C10.5693 16 11.017 15.5523 11.017 15V9C11.017 8.44772 10.5693 8 10.017 8H7.017C5.91243 8 5.017 7.10457 5.017 6V5C5.017 3.89543 5.91243 3 7.017 3H10.017C12.2261 3 14.017 4.79086 14.017 7V15C14.017 18.866 10.8831 22 7.017 22H5.017V21Z"/></svg>
                                            <p className="text-xs text-gray-500 italic leading-relaxed">
                                                {data.resumen_edicion}
                                            </p>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handleAction(task.ID, task._type, 'approve')}
                                    disabled={processingId === task.ID}
                                    className="flex-grow flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {processingId === task.ID ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    Aprobar
                                </button>
                                <button 
                                    onClick={() => handleAction(task.ID, task._type, 'reject')}
                                    disabled={processingId === task.ID}
                                    className="px-4 py-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-95 disabled:opacity-50 border border-red-100"
                                    title="Rexeitar"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingTasksView;
