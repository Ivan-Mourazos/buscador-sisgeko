import React, { useState, useEffect } from 'react';

const HistoryView = ({ onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [opFilter, setOpFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

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
        if (!str) return { titulo: fallbackTitle, raw: {} };
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
                resumen: parsed.resumen_edicion || parsed.comentario || parsed.motivo || 'Sen motivo ou xustificación rexistrada.',
                raw: parsed
            };
        } catch (e) {
            return { titulo: str, operation: 'EDICIÓN', resumen: 'Sen motivo rexistrado.', raw: {} };
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
        const info = safeParse(item.comentario_cambio);
        
        // 1. Filtro por término de búsqueda
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = (
                info.titulo.toLowerCase().includes(searchLower) ||
                item.editor?.toLowerCase().includes(searchLower) ||
                item.aprobador?.toLowerCase().includes(searchLower) ||
                info.operation.toLowerCase().includes(searchLower) ||
                item.estado.toLowerCase().includes(searchLower) ||
                item._type.toLowerCase().includes(searchLower)
            );
            if (!matchesSearch) return false;
        }

        // 2. Filtro por tipo de acción (Operación)
        if (opFilter !== 'ALL' && info.operation !== opFilter) {
            return false;
        }

        // 3. Filtro por tipo de registro (Definición / Insight)
        if (typeFilter !== 'ALL' && item._type !== typeFilter) {
            return false;
        }

        // 4. Filtro por estado (Aprobado / Rexeitado)
        if (statusFilter !== 'ALL' && item.estado !== statusFilter) {
            return false;
        }

        return true;
    });

    return (
        <div className="flex flex-col animate-fade-in-up">
            <div className="flex items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">Historial de Cambios</h2>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-zinc-400 font-medium italic">Rexistro completo de auditoría das accións realizadas</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 flex-shrink-0"
                    title="Volver á busca"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="mb-6 relative group">
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
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 transition-all shadow-sm group-hover:shadow-md font-medium"
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

            {/* Filtros rápidos (Móvil - Selectores compactos) */}
            <div className="md:hidden mb-6 bg-gray-50/50 dark:bg-zinc-950/20 p-4 rounded-3xl border border-gray-100/80 dark:border-zinc-800/80 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Filtros rápidos</span>
                    {(opFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                        <button
                            onClick={() => {
                                setOpFilter('ALL');
                                setTypeFilter('ALL');
                                setStatusFilter('ALL');
                            }}
                            className="text-[10px] font-black uppercase tracking-wider text-yellow-600 hover:text-yellow-700 transition-colors"
                        >
                            Limpar
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <select
                        value={opFilter}
                        onChange={(e) => setOpFilter(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-2 pr-6 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-600 dark:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 transition-all appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%236B7280%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222.5%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-no-repeat bg-[right_0.4rem_center] bg-[length:0.8rem_0.8rem] text-center"
                    >
                        <option value="ALL">Acción (Todas)</option>
                        <option value="CREACIÓN">Creación</option>
                        <option value="EDICIÓN">Edición</option>
                        <option value="BORRADO">Borrado</option>
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-2 pr-6 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-600 dark:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 transition-all appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%236B7280%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222.5%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-no-repeat bg-[right_0.4rem_center] bg-[length:0.8rem_0.8rem] text-center"
                    >
                        <option value="ALL">Tipo (Todos)</option>
                        <option value="definicion">Definición</option>
                        <option value="insight">Insight</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-2 pr-6 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-600 dark:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 transition-all appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%236B7280%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222.5%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-no-repeat bg-[right_0.4rem_center] bg-[length:0.8rem_0.8rem] text-center"
                    >
                        <option value="ALL">Estado (Todos)</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rexeitado</option>
                    </select>
                </div>
            </div>

            {/* Filtros rápidos (Desktop - Pills) */}
            <div className="hidden md:flex flex-wrap gap-6 items-start bg-gray-50/50 dark:bg-zinc-950/20 p-6 rounded-[2rem] border border-gray-100/80 dark:border-zinc-800/80 mb-8">
                {/* Cabecera de filtros con opción de limpiar */}
                <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Filtros activos</span>
                    {(opFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                        <button
                            onClick={() => {
                                setOpFilter('ALL');
                                setTypeFilter('ALL');
                                setStatusFilter('ALL');
                            }}
                            className="text-xs font-black uppercase tracking-wider text-yellow-600 hover:text-yellow-700 transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Limpar filtros
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Acción</span>
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            { key: 'ALL', label: 'Todas' },
                            { key: 'CREACIÓN', label: 'Creación' },
                            { key: 'EDICIÓN', label: 'Edición' },
                            { key: 'BORRADO', label: 'Borrado' }
                        ].map(op => (
                            <button
                                key={op.key}
                                onClick={() => setOpFilter(op.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                    opFilter === op.key 
                                        ? 'bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-500/20' 
                                        : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:text-gray-900 dark:hover:text-zinc-250'
                                }`}
                            >
                                {op.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tipo</span>
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            { key: 'ALL', label: 'Todos' },
                            { key: 'definicion', label: 'Definición' },
                            { key: 'insight', label: 'Insight' }
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTypeFilter(t.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                    typeFilter === t.key 
                                        ? 'bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-500/20' 
                                        : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:text-gray-900 dark:hover:text-zinc-250'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</span>
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            { key: 'ALL', label: 'Todos' },
                            { key: 'aprobado', label: 'Aprobado' },
                            { key: 'rechazado', label: 'Rexeitado' }
                        ].map(s => (
                            <button
                                key={s.key}
                                onClick={() => setStatusFilter(s.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                    statusFilter === s.key 
                                        ? 'bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-500/20' 
                                        : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:text-gray-900 dark:hover:text-zinc-250'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
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
                    <div className="w-12 h-12 border-4 border-yellow-100 dark:border-yellow-950/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Cargando historial...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-zinc-800 p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border dark:border-zinc-800">
                        <svg className="w-10 h-10 text-gray-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 dark:text-zinc-400 font-bold text-lg">
                        Non se atoparon resultados para os filtros activos.
                    </p>
                    {(searchTerm || opFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                        <button 
                            onClick={() => {
                                setSearchTerm('');
                                setOpFilter('ALL');
                                setTypeFilter('ALL');
                                setStatusFilter('ALL');
                            }}
                            className="mt-4 text-yellow-600 font-black uppercase text-[10px] tracking-widest hover:text-yellow-700 transition-colors"
                        >
                            Limpar todos os filtros
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 dark:bg-zinc-950/20 border-b border-gray-100 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Item</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Acción</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Pedida o</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Resolta o</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Usuarios</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                                    {filteredHistory.map(item => {
                                        const info = safeParse(item.comentario_cambio);
                                        const rowKey = `${item._type}-${item.ID}`;
                                        const isExpanded = expandedId === rowKey;
                                        
                                        return (
                                            <React.Fragment key={rowKey}>
                                                <tr 
                                                    onClick={() => setExpandedId(isExpanded ? null : rowKey)}
                                                    className={`hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-all cursor-pointer ${isExpanded ? 'bg-yellow-50/30 dark:bg-yellow-950/10 shadow-sm border-l-2 border-l-yellow-400' : 'border-l-2 border-l-transparent'}`}
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
                                                                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100 leading-tight truncate max-w-[180px]" title={info.titulo}>
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
                                                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-tighter mb-0.5">Solicitude</span>
                                                            <span className="text-[11px] text-gray-700 dark:text-zinc-300 font-bold">
                                                                {formatDate(item.fecha_cambio)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-tighter mb-0.5">Resolución</span>
                                                            <span className="text-[11px] text-gray-700 dark:text-zinc-300 font-bold">
                                                                {formatDate(item.fecha_aprobacion)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase w-6">Edi:</span>
                                                                <span className="text-xs text-gray-600 dark:text-zinc-300 font-bold">{item.editor}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase w-6">Apr:</span>
                                                                <span className="text-xs text-gray-600 dark:text-zinc-300 font-bold">{item.aprobador || 'Pendente'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-gray-50/20 dark:bg-zinc-950/10 border-b border-gray-100/50 dark:border-zinc-800/50">
                                                        <td colSpan="6" className="px-8 py-6">
                                                            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 p-6 shadow-sm flex flex-col md:flex-row gap-6 animate-in slide-in-from-top-2 fade-in duration-200">
                                                                {/* Columna Principal: Contido Editado */}
                                                                <div className="flex-grow flex flex-col gap-4">
                                                                    <div className="flex items-center gap-2 text-gray-800">
                                                                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detalle do Rexistro Editado</h4>
                                                                    </div>
                                                                    
                                                                    <div className="space-y-4">
                                                                        {info.raw.titulo && (
                                                                            <div className="flex flex-col gap-1 bg-gray-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-gray-100/50 dark:border-zinc-800/50">
                                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Título / Termo</span>
                                                                                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100 leading-snug">{info.raw.titulo}</span>
                                                                            </div>
                                                                        )}
                                                                        {(info.raw.insight || info.raw.definicion) && (
                                                                            <div className="flex flex-col gap-1 bg-gray-50/50 dark:bg-zinc-950/20 p-4 rounded-xl border border-gray-100/50 dark:border-zinc-800/50">
                                                                                <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Texto de Versión</span>
                                                                                <p className="text-sm text-gray-700 dark:text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed">
                                                                                    {info.raw.insight || info.raw.definicion}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        {item._type === 'insight' && (info.raw.origen_informacion || info.raw.detalle_origen_informacion) && (
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                {info.raw.origen_informacion && (
                                                                                    <div className="flex flex-col gap-0.5 bg-gray-50/30 dark:bg-zinc-950/20 p-2.5 rounded-lg border border-gray-100/30 dark:border-zinc-800/50">
                                                                                        <span className="text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Fonte / Orixe</span>
                                                                                        <span className="text-[11px] font-bold text-gray-800 dark:text-zinc-200">{info.raw.origen_informacion}</span>
                                                                                    </div>
                                                                                )}
                                                                                {info.raw.detalle_origen_informacion && (
                                                                                    <div className="flex flex-col gap-0.5 bg-gray-50/30 dark:bg-zinc-950/20 p-2.5 rounded-lg border border-gray-100/30 dark:border-zinc-800/50">
                                                                                        <span className="text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Detalle da Fonte</span>
                                                                                        <span className="text-[11px] text-gray-600 dark:text-zinc-400 italic font-medium">{info.raw.detalle_origen_informacion}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Columna Lateral: Motivo */}
                                                                <div className="md:w-80 shrink-0 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-zinc-800 pt-6 md:pt-0 md:pl-6">
                                                                    <div className="flex items-center gap-2 text-gray-800 dark:text-zinc-200">
                                                                        <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Motivo do Cambio</h4>
                                                                    </div>
                                                                    <div className="bg-zinc-800/40 dark:bg-zinc-800/40 rounded-2xl p-4 border border-zinc-700/50 dark:border-zinc-700/50 text-xs text-zinc-300 dark:text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed flex-grow">
                                                                        {info.resumen}
                                                                    </div>
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

                    {/* Mobile Card List View */}
                    <div className="md:hidden flex flex-col gap-4">
                        {filteredHistory.map(item => {
                            const info = safeParse(item.comentario_cambio);
                            const rowKey = `${item._type}-${item.ID}`;
                            const isExpanded = expandedId === rowKey;

                            return (
                                <div
                                    key={rowKey}
                                    onClick={() => setExpandedId(isExpanded ? null : rowKey)}
                                    className={`bg-white dark:bg-zinc-900 rounded-[2rem] border dark:border-zinc-800 transition-all cursor-pointer p-5 flex flex-col gap-4 shadow-sm hover:shadow-md ${
                                        isExpanded ? 'border-yellow-400 ring-2 ring-yellow-400/20 dark:border-yellow-500' : 'border-gray-100 dark:border-zinc-800'
                                    }`}
                                >
                                    {/* Badges y Estado */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                item._type === 'definicion' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                                {item._type === 'definicion' ? 'Definición' : 'Insight'}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                info.operation === 'BORRADO' ? 'text-red-500' : 
                                                info.operation === 'CREACIÓN' ? 'text-emerald-500' : 'text-gray-400'
                                            }`}>
                                                {info.operation}
                                            </span>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                                            item.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                                        }`}>
                                            {item.estado === 'aprobado' ? '✓ Aprobado' : '✕ Rexeitado'}
                                        </span>
                                    </div>

                                    {/* Título y Flecha */}
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-sm font-bold text-gray-900 leading-tight">
                                            {info.titulo}
                                        </h3>
                                        <div className={`mt-0.5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-90 text-yellow-500' : ''}`}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Fechas */}
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-zinc-800/30 rounded-xl p-3 text-[11px]">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-tighter mb-0.5">Solicitude</span>
                                            <span className="text-gray-700 dark:text-zinc-300 font-bold">
                                                {formatDate(item.fecha_cambio)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-tighter mb-0.5">Resolución</span>
                                            <span className="text-gray-700 dark:text-zinc-300 font-bold">
                                                {formatDate(item.fecha_aprobacion)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Usuarios */}
                                    <div className="flex flex-wrap gap-2 items-center justify-between text-xs border-t border-gray-100 dark:border-zinc-800 pt-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase">Editor:</span>
                                            <span className="text-gray-600 dark:text-zinc-300 font-bold">{item.editor}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase">Aprobador:</span>
                                            <span className="text-gray-600 dark:text-zinc-300 font-bold">{item.aprobador || 'Pendente'}</span>
                                        </div>
                                    </div>

                                    {/* Detalle expandido móvil */}
                                    {isExpanded && (
                                        <div className="flex flex-col gap-4 mt-2 pt-3 border-t border-dashed border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                                            {/* Contenido principal editado */}
                                            <div className="flex flex-col gap-2.5">
                                                <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Contido Editado</span>
                                                {info.raw.titulo && (
                                                    <div className="bg-gray-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-gray-100/50 dark:border-zinc-700/50 text-xs">
                                                        <span className="text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase block mb-0.5">Título / Termo</span>
                                                        <strong className="text-gray-900 dark:text-zinc-100 font-bold">{info.raw.titulo}</strong>
                                                    </div>
                                                )}
                                                {(info.raw.insight || info.raw.definicion) && (
                                                    <div className="bg-gray-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-gray-100/50 dark:border-zinc-700/50 text-xs text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">
                                                        <span className="text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase block mb-1">Texto de Versión</span>
                                                        <p className="whitespace-pre-wrap">{info.raw.insight || info.raw.definicion}</p>
                                                    </div>
                                                )}
                                                {info.raw.origen_informacion && (
                                                    <div className="bg-gray-50 dark:bg-zinc-950/20 p-3 rounded-xl border border-gray-100/50 dark:border-zinc-800/50 text-xs">
                                                        <span className="text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase block mb-0.5">Orixe / Fonte</span>
                                                        <span className="text-gray-800 dark:text-zinc-200 font-semibold">{info.raw.origen_informacion}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Motivo */}
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Motivo do Cambio</h4>
                                                </div>
                                                <div className="bg-zinc-800/40 rounded-xl p-3 border border-zinc-700/50 shadow-sm text-xs text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed">
                                                    {info.resumen}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default HistoryView;
