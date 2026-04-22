import React, { useState, useEffect } from 'react';

const HistoryView = ({ onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/history');
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            const data = await res.json();
            if (data.success) {
                setHistory(data.history);
            } else {
                throw new Error(data.message || 'Erro descoñecido');
            }
        } catch (err) {
            console.error("Error fetching history:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const safeParse = (str, fallbackTitle = 'Sen título') => {
        if (!str) return { titulo: fallbackTitle };
        try {
            const parsed = typeof str === 'string' ? JSON.parse(str) : str;
            let op = parsed._operation || 'UPDATE';
            if (op === 'CREATE') op = 'CREACIÓN';
            if (op === 'UPDATE') op = 'EDICIÓN';
            if (op === 'DELETE') op = 'BORRADO';
            if (op === 'HISTO') op = 'HISTÓRICO';
            return {
                titulo: parsed.titulo || parsed.descripcion || parsed.insight || fallbackTitle,
                operation: op,
                resumen: parsed.resumen_edicion || parsed.comentario || parsed.motivo || 'Sen motivo ou xustificación rexistrada.'
            };
        } catch (e) {
            return { titulo: str, operation: 'EDICIÓN', resumen: 'Sen motivo rexistrado.' };
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleString('gl-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredHistory = history.filter(item => {
        if (!searchTerm) return true;
        const info = safeParse(item.comentario_cambio);
        const searchLower = searchTerm.toLowerCase();
        
        return (
            info.titulo.toLowerCase().includes(searchLower) ||
            item.editor?.toLowerCase().includes(searchLower) ||
            item.aprobador?.toLowerCase().includes(searchLower) ||
            info.operation.toLowerCase().includes(searchLower) ||
            item.estado.toLowerCase().includes(searchLower) ||
            item._type.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="flex flex-col animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Historial de Cambios</h2>
                    <p className="text-gray-500 font-medium italic">Rexistro completo de auditoría das accións realizadas</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                    title="Volver á busca"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="mb-8 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 transition-colors ${searchTerm ? 'text-yellow-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Buscar por título, autor, estado ou tipo de acción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-[2rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 transition-all shadow-sm group-hover:shadow-md font-medium"
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        title="Limpar busca"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {error ? (
                <div className="bg-red-50 border-2 border-dashed border-red-100 rounded-[2.5rem] p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-red-100/50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-red-900 font-black text-xl mb-2">Erro ao cargar o historial</h3>
                    <p className="text-red-600/70 font-medium mb-8 max-w-md mx-auto">{error}</p>
                    <button 
                        onClick={fetchHistory}
                        className="px-8 py-3 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95"
                    >
                        Tentar de novo
                    </button>
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center py-24">
                    <div className="w-12 h-12 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-gray-400">Cargando historial...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-bold text-lg">
                        {searchTerm ? 'Non se atoparon resultados para a túa busca.' : 'Ainda non hai movementos no historial.'}
                    </p>
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="mt-4 text-yellow-600 font-black uppercase text-[10px] tracking-widest hover:text-yellow-700 transition-colors"
                        >
                            Ver todo o historial
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Item</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Acción</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Pedida o</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Resolta o</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Usuarios</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredHistory.map(item => {
                                    const info = safeParse(item.comentario_cambio);
                                    const rowKey = `${item._type}-${item.ID}`;
                                    const isExpanded = expandedId === rowKey;
                                    
                                    return (
                                        <React.Fragment key={rowKey}>
                                            <tr 
                                                onClick={() => setExpandedId(isExpanded ? null : rowKey)}
                                                className={`hover:bg-gray-50/80 transition-all cursor-pointer ${isExpanded ? 'bg-yellow-50/30 shadow-sm border-l-2 border-l-yellow-400' : 'border-l-2 border-l-transparent'}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-yellow-500' : ''}`}>
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`w-fit px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-1 border ${
                                                                item._type === 'definicion' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                                            }`}>
                                                                {item._type === 'definicion' ? 'Definición' : 'Insight'}
                                                            </span>
                                                            <span className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[180px]" title={info.titulo}>
                                                                {info.titulo}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                        info.operation === 'BORRADO' ? 'text-red-500' : 
                                                        info.operation === 'CREACIÓN' ? 'text-emerald-500' : 'text-gray-400'
                                                    }`}>
                                                        {info.operation}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                                                        item.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                        {item.estado === 'aprobado' ? '✓ Aprobado' : '✕ Rexeitado'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-0.5">Solicitude</span>
                                                        <span className="text-[11px] text-gray-700 font-bold">
                                                            {formatDate(item.fecha_cambio)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-0.5">Resolución</span>
                                                        <span className="text-[11px] text-gray-700 font-bold">
                                                            {formatDate(item.fecha_aprobacion)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase w-6">Edi:</span>
                                                            <span className="text-xs text-gray-600 font-bold">{item.editor}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase w-6">Apr:</span>
                                                            <span className="text-xs text-gray-600 font-bold">{item.aprobador || 'Pendente'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-yellow-50/10 border-b border-gray-100/50">
                                                    <td colSpan="6" className="px-12 py-6">
                                                        <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                                            <div className="flex items-center gap-2 text-yellow-600 mb-1">
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <h4 className="text-xs font-black uppercase tracking-widest">Motivo do Cambio</h4>
                                                            </div>
                                                            <div className="bg-white rounded-2xl p-5 border border-yellow-100 shadow-sm text-sm text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
                                                                {info.resumen}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryView;
