import React from 'react';

const Badge = ({ children, colorClass }) => (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm ${colorClass}`}>
        {children}
    </span>
);

export const ResultCard = ({ item, onClick }) => {
    // Renderizado según el tipo
    switch (item._type) {
        case 'articulo':
            return (
                <div onClick={onClick} className="cursor-pointer bg-white hover:bg-blue-50/40 p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md flex flex-col gap-3 group">
                    <div className="flex justify-between items-start">
                        <Badge colorClass="bg-indigo-50 text-indigo-700 border-indigo-100">Artículo</Badge>
                        <span className="text-xs font-medium text-gray-400">ID: {item.id_articulo}</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {item.descripcion}
                        </h3>
                        {item.codigo && (
                            <p className="text-sm font-mono text-gray-500 mt-1">{item.codigo}</p>
                        )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {item.familia_nombre && <Badge colorClass="bg-gray-50 text-gray-600 border-gray-200">{item.familia_nombre}</Badge>}
                        {item.subfamilia && <Badge colorClass="bg-gray-50 text-gray-600 border-gray-200">{item.subfamilia}</Badge>}
                        {item.denominacion_proveedor && <Badge colorClass="bg-amber-50 text-amber-700 border-amber-100">Prov: {item.denominacion_proveedor}</Badge>}
                    </div>
                </div>
            );
            
        case 'insight':
            return (
                <div onClick={onClick} className="cursor-pointer bg-gradient-to-br from-white to-blue-50/30 p-5 rounded-2xl shadow-sm border border-blue-100 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md flex flex-col gap-3 group">
                    <div className="flex justify-between items-start">
                        <Badge colorClass="bg-blue-100 text-blue-800 border-blue-200">Insight</Badge>
                        <span className="text-xs font-medium text-gray-400">ID: {item.id_insight}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition-colors line-clamp-2">
                            {item.titulo}
                        </h3>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {item.tipo_origen_nombre && <Badge colorClass="bg-emerald-50 text-emerald-700 border-emerald-100">Origen: {item.tipo_origen_nombre}</Badge>}
                        {item.origen_informacion && <span className="text-xs text-gray-400 mt-1 italic">{item.origen_informacion}</span>}
                    </div>
                </div>
            );

        case 'definicion':
            return (
                <div onClick={onClick} className="cursor-pointer bg-white hover:bg-purple-50/30 p-5 rounded-2xl shadow-sm border border-purple-100 hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md flex flex-col gap-3 group">
                    <div className="flex justify-between items-start">
                        <Badge colorClass="bg-purple-50 text-purple-700 border-purple-100">Definición</Badge>
                        <span className="text-xs font-medium text-gray-400">ID: {item.id_definicion}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-purple-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                            {item.titulo}
                        </h3>
                    </div>
                </div>
            );

        default:
            return null;
    }
};
