import React, { useState, useEffect } from 'react';

const HistoryView = ({ onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            if (data.success) {
                setHistory(data.history);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <div className="flex flex-col animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Historial de Cambios</h2>
                    <p className="text-gray-500 font-medium">Rexistro de auditoría de todas as accións realizadas</p>
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

            {loading ? (
                <div className="flex flex-col items-center py-24">
                    <div className="w-12 h-12 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-gray-400">Cargando historial...</p>
                </div>
            ) : history.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-bold text-lg">Ainda non hai movementos no historial.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Item</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Acción</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Autor</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Aprobador</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.map(item => {
                                    const draftData = JSON.parse(item.comentario_cambio || '{}');
                                    return (
                                        <tr key={`${item._type}-${item.ID}`} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`w-fit px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-1 border ${
                                                        item._type === 'definicion' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                        {item._type === 'definicion' ? 'Definición' : 'Insight'}
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[200px]" title={draftData.titulo}>
                                                        {draftData.titulo}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                                                    item.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                    {item.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                        {item.editor?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs text-gray-600 font-bold">{item.editor}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-yellow-50 rounded-full flex items-center justify-center text-[10px] font-bold text-yellow-600 border border-yellow-100">
                                                        {item.aprobador?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs text-gray-600 font-bold">{item.aprobador}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-[11px] text-gray-400 font-medium">
                                                    {new Date(item.fecha_aprobacion).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
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
