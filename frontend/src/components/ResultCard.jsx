import React, { useRef } from 'react';

const Badge = ({ children, colorClass }) => {
    let darkClass = '';
    if (colorClass.includes('bg-orange-50')) {
        darkClass = ' dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50';
    } else if (colorClass.includes('bg-gray-105') || colorClass.includes('bg-gray-100')) {
        darkClass = ' dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    } else if (colorClass.includes('bg-amber-50')) {
        darkClass = ' dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
    }
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm ${colorClass}${darkClass}`}>
            {children}
        </span>
    );
};

export const ResultCard = ({ item, onClick, onPrefetch }) => {
    const prefetchTimer = useRef(null);

    const handleMouseEnter = () => {
        if (onPrefetch) {
            prefetchTimer.current = setTimeout(() => {
                onPrefetch();
            }, 100); // 100ms delay to avoid accidental triggers
        }
    };

    const handleMouseLeave = () => {
        if (prefetchTimer.current) {
            clearTimeout(prefetchTimer.current);
        }
    };

    const getCardClasses = (type) => {
        let borderAccent = " border-l-4 border-l-yellow-500 dark:border-l-yellow-500/80";
        let glowAccent = " dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(217,167,30,0.08)]";
        
        if (type === 'insight') {
            borderAccent = " border-l-4 border-l-blue-500 dark:border-l-blue-500/80";
            glowAccent = " dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(59,130,246,0.08)]";
        } else if (type === 'definicion') {
            borderAccent = " border-l-4 border-l-emerald-500 dark:border-l-emerald-500/80";
            glowAccent = " dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(16,185,129,0.08)]";
        }
        return `relative cursor-pointer bg-white dark:bg-gradient-to-br dark:from-[#1c1c28] dark:to-[#16161f] p-4 sm:p-5 rounded-2xl shadow-md border border-gray-200 dark:border-white/[0.07] hover:border-yellow-400 dark:hover:border-yellow-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex flex-col gap-2 sm:gap-3 group animate-fade-in mb-2${borderAccent}${glowAccent}`;
    };

    // Renderizado según el tipo
    switch (item._type) {
        case 'articulo':
            return (
                <div 
                    onClick={onClick} 
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className={getCardClasses('articulo')}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-500">Artigo</span>
                            {item._isDraft && <Badge colorClass="bg-orange-50 text-orange-700 border-orange-200">Borrador pendente</Badge>}
                        </div>
                    </div>
                    <div className="min-h-[3rem]">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-yellow-700 dark:group-hover:text-yellow-400 transition-colors capitalize">
                            {item.descripcion?.toLowerCase()}
                        </h3>
                        {item.codigo && (
                            <p className="text-sm font-mono text-gray-500 dark:text-zinc-400 mt-1">{item.codigo}</p>
                        )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {item.familia_nombre && <Badge colorClass="bg-gray-100/50 text-gray-600 border-gray-200">{item.familia_nombre}</Badge>}
                        {item.subfamilia && <Badge colorClass="bg-gray-100/50 text-gray-600 border-gray-200">{item.subfamilia}</Badge>}
                        {item.denominacion_proveedor && <Badge colorClass="bg-amber-50 text-amber-700 border-amber-100">Prov: {item.denominacion_proveedor}</Badge>}
                    </div>
                </div>
            );
            
        case 'insight':
            return (
                <div 
                    onClick={onClick} 
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className={getCardClasses('insight')}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Insight</span>
                                {item._isDraft && <Badge colorClass="bg-orange-50 text-orange-700 border-orange-200">Borrador pendente</Badge>}
                            </div>
                            {item.procesos_lista && (
                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-purple-500 dark:text-purple-400 mt-1">
                                    {item.procesos_lista}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="min-h-[3rem]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 group-hover:text-yellow-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 capitalize">
                            {item.titulo?.toLowerCase()}
                        </h3>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-white/[0.06] flex flex-col gap-1.5">
                        {item.tipo_origen_nombre && (
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-tighter w-12">Orixe</span>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{item.tipo_origen_nombre}</span>
                            </div>
                        )}
                        {item.origen_informacion && (
                            <div className="flex items-start gap-2">
                                <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-tighter w-12 shrink-0 mt-0.5">Ref</span>
                                <span className="text-[10px] text-gray-500 dark:text-zinc-400 italic line-clamp-1">{item.origen_informacion}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
 
        case 'definicion':
            return (
                <div 
                    onClick={onClick} 
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className={getCardClasses('definicion')}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Definición</span>
                            {item._isDraft && <Badge colorClass="bg-orange-50 text-orange-700 border-orange-200">Borrador pendente</Badge>}
                        </div>
                    </div>
                    <div className="min-h-[3rem]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-405 transition-colors line-clamp-2 capitalize">
                            {item.titulo?.toLowerCase()}
                        </h3>
                    </div>
                    {item.familias_lista && (
                        <div className="mt-3 pt-3 border-t border-gray-50 dark:border-white/[0.06] flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-tighter w-12 shrink-0">Familias</span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase line-clamp-1">{item.familias_lista}</span>
                        </div>
                    )}
                </div>
            );

        default:
            return null;
    }
};
