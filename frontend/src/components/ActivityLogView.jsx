import React, { useState, useEffect } from 'react';

const ActivityLogView = ({ onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/activity-log');
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (err) {
            console.error("Error fetching activity log:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const safeParse = (str, fallbackTitle = 'Sen título') => {
        if (!str) return { titulo: fallbackTitle };
        try {
            const parsed = typeof str === 'string' ? JSON.parse(str) : str;
            return {
                titulo: parsed.titulo || parsed.descripcion || fallbackTitle,
                operation: parsed._operation || 'UPDATE'
            };
        } catch (e) {
            return { titulo: str, operation: 'UPDATE' };
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString('gl-ES', {
            day: '2D', month: '2D', year: 'numeric',
            hour: '2D', minute: '2D'
        });
    };

    return (
        <div className="flex flex-col animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Historial de Actividade</h2>
                    <p className="text-gray-500 font-medium italic">Accións aprobadas e rexistradas no sistema</p>
                </div>
                <button 
                    onClick={() => onClose()}
                    className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-20">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-yellow-500 rounded-full animate-spin mb-4" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Cargando historial...</p>
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
                    <p className="text-slate-400 font-bold">Aínda non hai actividade rexistrada.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((log) => {
                        const info = safeParse(log.comentario_cambio);
                        const isDelete = info.operation === 'DELETE';
                        const isCreate = info.operation === 'CREATE';
                        
                        return (
                            <div key={`${log._type}-${log.ID}`} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group">
                                {/* Badge de Fecha */}
                                <div className="hidden sm:flex flex-col items-center justify-center min-w-[100px] border-r border-gray-100 pr-6">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                        {new Date(log.fecha_aprobacion).toLocaleDateString('gl-ES', { day: '2D', month: 'short' })}
                                    </span>
                                    <span className="text-lg font-black text-slate-800">
                                        {new Date(log.fecha_aprobacion).toLocaleTimeString('gl-ES', { hour: '2D', minute: '2D' })}
                                    </span>
                                </div>

                                {/* Icono de Acción */}
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                    isDelete ? 'bg-red-50 text-red-500' : 
                                    isCreate ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                                }`}>
                                    <i className={`fas ${isDelete ? 'fa-trash-alt' : isCreate ? 'fa-plus' : 'fa-pen-nib'}`}></i>
                                </div>

                                {/* Contenido */}
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            isDelete ? 'text-red-400' : isCreate ? 'text-emerald-400' : 'text-blue-400'
                                        }`}>
                                            {isDelete ? 'Borrado' : isCreate ? 'Novo Rexistro' : 'Edición'}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log._type}</span>
                                    </div>
                                    <h4 className="text-base font-bold text-gray-900 truncate group-hover:text-yellow-600 transition-colors">
                                        {info.titulo}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-1">
                                        <p className="text-[11px] text-gray-400 font-medium">
                                            Proposto por <span className="text-gray-600 font-bold">{log.editor}</span>
                                        </p>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                        <p className="text-[11px] text-gray-400 font-medium">
                                            Aprobado por <span className="text-gray-600 font-bold">{log.aprobador}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="text-[10px] font-black text-gray-300 pr-2">
                                    VERSIÓN {log.origId > 0 ? 'HIST' : '1'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ActivityLogView;
