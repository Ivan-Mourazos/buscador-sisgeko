import React, { useState, useMemo } from 'react';

const TreeItem = ({ item, label, count, isSelected, level = 0, onToggle, children }) => {
    return (
        <div className={`select-none ${level > 0 ? 'ml-4 border-l border-gray-100 pl-4' : ''}`}>
            <div 
                className={`flex items-center gap-2 py-2 px-2 rounded-xl transition-all ${
                    onToggle ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
                } group ${level === 0 ? 'mt-2' : 'mt-0.5'}`}
                onClick={onToggle}
            >
                {/* Yellow Square Icon */}
                <div className={`w-4 h-4 rounded-[4px] border-2 flex-shrink-0 transition-all ${
                    isSelected 
                    ? 'bg-yellow-500 border-yellow-500 shadow-sm' 
                    : 'bg-white border-gray-200 group-hover:border-yellow-300'
                }`}>
                    {isSelected && (
                        <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </div>
                
                <span className={`text-[13px] leading-tight transition-colors flex-grow ${
                    isSelected ? 'text-gray-900 font-black' : 'text-gray-600 font-medium group-hover:text-gray-900'
                }`}>
                    {label}
                </span>

                {count > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border transition-all ${
                        isSelected 
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-100' 
                        : 'bg-gray-50 text-gray-500 border-gray-100 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100'
                    }`}>
                        {count}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
};

const SidebarFilters = ({ facets, filters, onFilterChange, onClearAll, hasActiveFilters, results }) => {
    const [expandedFamilies, setExpandedFamilies] = useState({});

    const toggleFamily = (id) => {
        setExpandedFamilies(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleFilter = (category, value) => {
        const currentSelected = filters[category] || [];
        const newSelected = currentSelected.includes(value)
            ? currentSelected.filter(v => v !== value)
            : [...currentSelected, value];
            
        let updatedFilters = { ...filters, [category]: newSelected };
        
        // Si desactivamos 'insight', limpiar filtros que dependen de él
        if (category === 'categories' && !newSelected.includes('insight')) {
            updatedFilters.procesos = [];
            updatedFilters.tipo_origen = [];
        }

        onFilterChange(updatedFilters);
    };

    // Optimizamos la agrupación de subfamilias
    const subfamiliasByFamilia = useMemo(() => {
        const subToFamMap = {};
        if (results) {
            results.forEach(r => {
                if (r.subfamilia && r.id_familia !== undefined) {
                    subToFamMap[r.subfamilia] = r.id_familia;
                }
            });
        }

        return (facets.subfamilias ?? []).reduce((acc, sub) => {
            let fid = sub.id_familia ?? subToFamMap[sub.nombre];
            const fidStr = String(fid);
            if (fidStr !== "undefined" && fidStr !== "null") {
                if (!acc[fidStr]) acc[fidStr] = [];
                acc[fidStr].push(sub);
            }
            return acc;
        }, {});
    }, [facets.subfamilias, results]);

    // Filtrado preventivo de facetas visibles para optimizar renderizado
    const visibleFamilies = useMemo(() => {
        return (facets.familias ?? []).filter(f => f.count > 0 || (filters.familias ?? []).map(String).includes(String(f.id_familia)));
    }, [facets.familias, filters.familias]);

    const visibleProcesos = useMemo(() => {
        if (!filters.categories?.includes('insight')) return [];
        return (facets.procesos ?? []).filter(p => p.count > 0 || filters.procesos.includes(p.id_proceso));
    }, [facets.procesos, filters.categories, filters.procesos]);

    const visibleOrigins = useMemo(() => {
        if (!filters.categories?.includes('insight')) return [];
        return (facets.tipo_origen ?? []).filter(o => o.count > 0 || filters.tipo_origen.includes(o.id_tipo_origen));
    }, [facets.tipo_origen, filters.categories, filters.tipo_origen]);

    return (
        <div className="w-full bg-transparent py-4 pr-4 sticky top-8">
            <div className="mb-10">
                {/* ... Header ... */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Filtros</h3>
                    {hasActiveFilters && (
                        <button 
                            onClick={() => {
                                onClearAll();
                                setExpandedFamilies({});
                            }}
                            className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">Categoría</h4>
                    </div>
                    <div className="space-y-1">
                        {facets.categories.map(cat => {
                            const isSelected = filters.categories?.includes(cat.id);
                            return (
                                <TreeItem 
                                    key={cat.id}
                                    label={cat.nombre}
                                    count={cat.count}
                                    isSelected={isSelected}
                                    onToggle={() => {
                                        const isCurrentlySelected = filters.categories?.includes(cat.id);
                                        const updatedFilters = { 
                                            familias: [], 
                                            subfamilias: [], 
                                            procesos: [], 
                                            tipo_origen: [], 
                                            categories: isCurrentlySelected ? [] : [cat.id] 
                                        };
                                        onFilterChange(updatedFilters);
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
                
                {visibleFamilies.length > 0 && (
                    <div className="mb-4 animate-sweep-staggered" style={{ animationDelay: '400ms' }}>
                        <h4 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide mb-2">Familia</h4>
                        <div className="space-y-1">
                            {visibleFamilies.map(familia => {
                                const fidStr = String(familia.id_familia);
                                const isSelected = (filters.familias || []).map(String).includes(fidStr);
                                const isExpanded = !!expandedFamilies[fidStr] || isSelected;
                                const subfamilias = (subfamiliasByFamilia[fidStr] || []).filter(s => s.count > 0 || filters.subfamilias.includes(s.nombre));
                                
                                return (
                                    <TreeItem 
                                        key={fidStr}
                                        label={familia.codigo}
                                        count={familia.count}
                                        isSelected={isSelected}
                                        onToggle={() => {
                                            toggleFilter('familias', familia.id_familia);
                                            toggleFamily(fidStr);
                                        }}
                                    >
                                        {(isExpanded) && subfamilias.length > 0 && (
                                            <div className="mb-2">
                                                {subfamilias.map(sub => {
                                                    const isSubSelected = filters.subfamilias.includes(sub.nombre);
                                                    return (
                                                        <TreeItem 
                                                            key={`${fidStr}-${sub.nombre}`}
                                                            label={sub.nombre}
                                                            count={sub.count}
                                                            isSelected={isSubSelected}
                                                            level={1}
                                                            onToggle={() => toggleFilter('subfamilias', sub.nombre)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </TreeItem>
                                );
                            })}
                        </div>
                    </div>
                )}

                {visibleProcesos.length > 0 && (
                    <div className="mb-4 animate-sweep-staggered" style={{ animationDelay: '500ms' }}>
                        <h4 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide mb-2">Procesos</h4>
                        <div className="space-y-1">
                            {visibleProcesos.map(proceso => (
                                <TreeItem 
                                    key={proceso.id_proceso}
                                    label={proceso.proceso}
                                    count={proceso.count}
                                    isSelected={filters.procesos.includes(proceso.id_proceso)}
                                    onToggle={() => toggleFilter('procesos', proceso.id_proceso)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {visibleOrigins.length > 0 && (
                    <div className="mt-8 border-t border-gray-50 pt-6 animate-sweep-staggered" style={{ animationDelay: '600ms' }}>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Orixe</h4>
                        <div className="space-y-1">
                            {visibleOrigins.map(tipo => (
                                <TreeItem 
                                    key={tipo.id_tipo_origen}
                                    label={tipo.tipo_origen}
                                    isSelected={filters.tipo_origen.includes(tipo.id_tipo_origen)}
                                    onToggle={() => toggleFilter('tipo_origen', tipo.id_tipo_origen)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {hasActiveFilters && (
                <button 
                    onClick={() => {
                        onClearAll();
                        setExpandedFamilies({});
                    }}
                    className="mt-4 w-full py-2.5 px-4 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-100 transition-all duration-200 cursor-pointer"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpiar Filtros
                </button>
            )}
        </div>
    );
};

export default SidebarFilters;
