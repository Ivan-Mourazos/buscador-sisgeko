import React from 'react';

const FilterSection = ({ title, items, selectedItems, onChange, itemKey, itemLabel }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">{title}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => {
                    const id = item[itemKey];
                    const label = item[itemLabel];
                    const count = item.count;
                    const isSelected = selectedItems.includes(id);
                    const isDisabled = count === 0 && !isSelected;

                    return (
                        <label 
                            key={id} 
                            className={`flex items-center justify-between group cursor-pointer p-2 rounded-lg transition-all duration-200 ${
                                isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all duration-200 ${
                                    isSelected 
                                    ? 'bg-blue-600 border-blue-600' 
                                    : 'border-gray-300 bg-white group-hover:border-blue-400'
                                }`}>
                                    {isSelected && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                                    {label}
                                </span>
                            </div>
                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {count}
                            </span>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => {
                                    if (!isDisabled) onChange(id);
                                }}
                            />
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

const SidebarFilters = ({ facets, filters, onFilterChange, onClearAll, hasActiveFilters }) => {
    const toggleFilter = (category, value) => {
        const currentSelected = filters[category] || [];
        const newSelected = currentSelected.includes(value)
            ? currentSelected.filter(v => v !== value)
            : [...currentSelected, value];
            
        onFilterChange({ ...filters, [category]: newSelected });
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl shadow-blue-900/5 rounded-2xl p-6 sticky top-8">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtros
                </h2>
                
                <button 
                    onClick={onClearAll}
                    disabled={!hasActiveFilters}
                    title="Limpiar Búsqueda y Filtros"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                        hasActiveFilters 
                        ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 active:scale-95' 
                        : 'bg-gray-50 border border-gray-100 text-gray-400 cursor-not-allowed opacity-0 invisible'
                    }`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Limpiar
                </button>
            </div>

            <div className="space-y-2">
                <FilterSection 
                    title="Familias" 
                    items={facets.familias} 
                    selectedItems={filters.familias} 
                    onChange={(val) => toggleFilter('familias', val)}
                    itemKey="id_familia" 
                    itemLabel="codigo" 
                />
                
                <hr className="border-gray-100 my-4" />

                <FilterSection 
                    title="Subfamilias" 
                    items={facets.subfamilias} 
                    selectedItems={filters.subfamilias} 
                    onChange={(val) => toggleFilter('subfamilias', val)}
                    itemKey="nombre" 
                    itemLabel="nombre" 
                />

                <hr className="border-gray-100 my-4" />

                <FilterSection 
                    title="Procesos" 
                    items={facets.procesos} 
                    selectedItems={filters.procesos} 
                    onChange={(val) => toggleFilter('procesos', val)}
                    itemKey="id_proceso" 
                    itemLabel="proceso" 
                />

                <hr className="border-gray-100 my-4" />

                <FilterSection 
                    title="Tipo de Origen" 
                    items={facets.tipo_origen} 
                    selectedItems={filters.tipo_origen} 
                    onChange={(val) => toggleFilter('tipo_origen', val)}
                    itemKey="id_tipo_origen" 
                    itemLabel="tipo_origen" 
                />
            </div>
        </div>
    );
};

export default SidebarFilters;
