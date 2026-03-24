import React, { useState } from 'react';

const TreeItem = ({ item, label, count, isSelected, level = 0, onToggle, children }) => {
    return (
        <div className="select-none">
            <div 
                className={`flex items-center gap-2 py-1.5 cursor-pointer group transition-all ${
                    level === 0 ? 'mt-2' : 'ml-6'
                }`}
                onClick={onToggle}
            >
                {/* Yellow Square Icon */}
                <div className={`w-3 h-3 rounded-[2px] flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-orange-400' : 'bg-orange-100 group-hover:bg-orange-200'
                }`} />
                
                <span className={`text-[13px] leading-tight transition-colors ${
                    isSelected ? 'text-gray-900 font-bold' : 'text-gray-600 group-hover:text-gray-900'
                }`}>
                    {label}
                </span>

                {count > 0 && level === 0 && (
                    <span className="text-[10px] text-gray-300 font-medium ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        ({count})
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
            
        onFilterChange({ ...filters, [category]: newSelected });
    };

    // Agrupar subfamilias por familia (con normalización de tipos)
    const subfamiliasByFamilia = facets.subfamilias.reduce((acc, sub) => {
        // FALLBACK: Si sub.id_familia es undefined, intentamos encontrarlo en los resultados
        let fid = sub.id_familia;
        if ((fid === undefined || fid === null) && results) {
            // Buscamos algún artículo en los resultados que tenga esta subfamilia y un id_familia definido
            const match = results.find(r => r.subfamilia === sub.nombre && r.id_familia !== undefined);
            if (match) fid = match.id_familia;
        }
        
        const fidStr = String(fid);
        if (fidStr !== "undefined" && fidStr !== "null") {
            if (!acc[fidStr]) acc[fidStr] = [];
            acc[fidStr].push(sub);
        }
        return acc;
    }, {});

    return (
        <div className="w-full bg-white py-4 pr-4 sticky top-8">
            <div className="mb-10">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-6">Filtros</h3>
                
                <div className="mb-4">
                    <h4 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide mb-2">Familia</h4>
                    
                    <div className="space-y-1">
                        {facets.familias.map(familia => {
                            const fidStr = String(familia.id_familia);
                            const isSelected = filters.familias.map(String).includes(fidStr);
                            const isExpanded = !!expandedFamilies[fidStr] || isSelected;
                            const subfamilias = subfamiliasByFamilia[fidStr] || [];

                            // OCULTAR FAMILIA SI: count es 0 Y no está seleccionada
                            if (familia.count === 0 && !isSelected) return null;
                            
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
                                                
                                                // OCULTAR SUBFAMILIA SI: count es 0 Y no está seleccionada
                                                if (sub.count === 0 && !isSubSelected) return null;

                                                return (
                                                    <TreeItem 
                                                        key={`${fidStr}-${sub.nombre}`}
                                                        label={sub.nombre}
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

                {facets.tipo_origen && facets.tipo_origen.length > 0 && (
                    <div className="mt-8 border-t border-gray-50 pt-6">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Origen</h4>
                        <div className="space-y-1">
                            {facets.tipo_origen.map(tipo => {
                                const isSelected = filters.tipo_origen.includes(tipo.id_tipo_origen);
                                if (tipo.count === 0 && !isSelected) return null;

                                return (
                                    <TreeItem 
                                        key={tipo.id_tipo_origen}
                                        label={tipo.tipo_origen}
                                        isSelected={isSelected}
                                        onToggle={() => toggleFilter('tipo_origen', tipo.id_tipo_origen)}
                                    />
                                );
                            })}
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
                    className="mt-4 text-[11px] font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest flex items-center gap-2 transition-colors"
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
