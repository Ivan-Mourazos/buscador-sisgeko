import React, { useRef } from 'react';

const Badge = ({ children, colorClass }) => (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm ${colorClass}`}>
        {children}
    </span>
);

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

    const cardClasses = "relative cursor-pointer bg-white p-4 sm:p-5 rounded-2xl shadow-md border border-gray-200 hover:border-yellow-400 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex flex-col gap-2 sm:gap-3 group animate-fade-in mb-2";

    // Renderizado según el tipo
    switch (item._type) {
        case 'articulo':
            return (
                <div 
                    onClick={onClick} 
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className={cardClasses}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-black uppercase tracking-widest text-yellow-600">Artigo</span>
                            {item._isDraft && <Badge colorClass="bg-orange-50 text-orange-700 border-orange-200">Borrador pendente</Badge>}
                        </div>
                    </div>
                    <div className="min-h-[3rem]">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-yellow-700 transition-colors">
                            {item.descripcion}
                        </h3>
                        {item.codigo && (
                            <p className="text-sm font-mono text-gray-500 mt-1">{item.codigo}</p>
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
                    className={cardClasses}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">Insight</span>
                                {item._isDraft && <Badge colorClass="bg-orange-50 text-orange-700 border-orange-200">Borrador pendente</Badge>}
                            </div>
                            {item.procesos_lista && (
                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-purple-500 mt-1">
                                    {item.procesos_lista}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="min-h-[3rem]">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-yellow-700 transition-colors line-clamp-2">
                            {item.titulo}
                        </h3>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-1.5">
                        {item.tipo_origen_nombre && (
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter w-12">Orixe</span>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">{item.tipo_origen_nombre}</span>
                            </div>
                        )}
                        {item.origen_informacion && (
                            <div className="flex items-start gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter w-12 shrink-0 mt-0.5">Ref</span>
                                <span className="text-[10px] text-gray-500 italic line-clamp-1">{item.origen_informacion}</span>
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
                    className={cardClasses}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-black uppercase tracking-widest text-purple-600">Definición</span>
                            {item._isDraft && <Badge colorClass="bg-orange-50 text-orange-700 border-orange-200">Borrador pendente</Badge>}
                        </div>
                    </div>
                    <div className="min-h-[3rem]">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors line-clamp-2">
                            {item.titulo}
                        </h3>
                    </div>
                    {item.familias_lista && (
                        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter w-12 shrink-0">Familias</span>
                            <span className="text-[10px] font-bold text-purple-600 uppercase line-clamp-1">{item.familias_lista}</span>
                        </div>
                    )}
                </div>
            );

        default:
            return null;
    }
};
