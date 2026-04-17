import React, { useState, useEffect } from 'react';

const PendingTasksModal = ({ isOpen, onClose, onRefresh }) => {
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
        if (isOpen) fetchTasks();
    }, [isOpen]);

    const handleApprove = async (taskId, type) => {
        if (!window.confirm('¿Confirmas a aprobación deste cambio?')) return;
        
        setProcessingId(taskId);
        try {
            const res = await fetch('/api/approve-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, type })
            });
            const data = await res.json();
            
            if (data.success) {
                alert('Cambio aprobado con éxito');
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 leading-tight">Tarefas Pendentes</h2>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Revisión e Aprobación (4 Ollos)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center py-20 opacity-50">
                            <div className="w-8 h-8 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin mb-4" />
                            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Cargando tarefas...</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                             </div>
                             <p className="text-gray-500 font-bold">Todo ao día. Non hai cambios pendentes.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tasks.map(task => (
                                <div key={`${task._type}-${task.ID}`} className="group bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-yellow-200 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                task._type === 'definicion' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                                {task._type === 'definicion' ? 'Definición' : 'Insight'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold">#{task.ID}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-gray-800 leading-tight">
                                            {JSON.parse(task.comentario_cambio).titulo}
                                        </h3>
                                        <div className="mt-2 flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                    {task.editor?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium">{task.editor}</span>
                                            </div>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-[11px] text-gray-400">{new Date(task.fecha_cambio).toLocaleString()}</span>
                                        </div>
                                        {JSON.parse(task.comentario_cambio).resumen_edicion && (
                                            <p className="mt-3 text-xs bg-gray-50 p-3 rounded-xl text-gray-600 italic border border-gray-100">
                                                "{JSON.parse(task.comentario_cambio).resumen_edicion}"
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <button 
                                            onClick={() => handleApprove(task.ID, task._type)}
                                            disabled={processingId === task.ID}
                                            className="flex-grow sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 text-white text-xs font-black uppercase rounded-2xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PendingTasksModal;
