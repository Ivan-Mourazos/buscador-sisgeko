import React, { useState, useEffect } from 'react';

const DetailsModal = ({ item, details, loading, onClose }) => {
    const [showImage, setShowImage] = useState(false);

    // Resetear imagen si cambiamos de item
    useEffect(() => {
        setShowImage(false);
    }, [item]);

    if (!item) return null;

    // Detenemos propagación del click exterior
    const handleModalClick = (e) => e.stopPropagation();

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={handleModalClick}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider ${
                            item._type === 'articulo' ? 'bg-indigo-100 text-indigo-700' :
                            item._type === 'insight' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                        }`}>
                            {item._type}
                        </span>
                        <h2 className="text-xl font-extrabold text-gray-800 line-clamp-1">
                            {item._type === 'articulo' ? item.descripcion : item.titulo}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    {/* Información Base Común */}
                    <div className="mb-8">
                        {item._type === 'articulo' && (
                            <div className="flex gap-4 mb-4">
                                {item.codigo && <div className="text-sm"><span className="text-gray-500">Cód:</span> <strong className="font-mono text-gray-700">{item.codigo}</strong></div>}
                                {item.denominacion_proveedor && <div className="text-sm"><span className="text-gray-500">Prov:</span> <strong className="text-gray-700">{item.denominacion_proveedor}</strong></div>}
                                {item.id_articulo && <div className="text-sm"><span className="text-gray-500">ID:</span> <strong className="text-gray-700">{item.id_articulo}</strong></div>}
                            </div>
                        )}
                        {item._type === 'insight' && (
                            <p className="text-gray-700 text-lg leading-relaxed mb-4">{item.insight}</p>
                        )}
                        {item._type === 'definicion' && (
                            <p className="text-gray-700 text-lg leading-relaxed mb-4">{details?.textoCompleto || item.definicion}</p>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center py-12">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-sm text-gray-500">Cargando detalles adicionales...</p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                            
                            {/* Articulo: Características */}
                            {item._type === 'articulo' && details?.caracteristicas && details.caracteristicas.length > 0 && (
                                <section>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Características Técnicas</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {details.caracteristicas.map((car, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <h4 className="text-sm font-black text-gray-700 uppercase">{car.caracteristica.trim()}</h4>
                                                <p className="text-lg font-semibold text-blue-900 mt-1">{car.valor}</p>
                                                {car.descripcion_caracteristica && <p className="text-xs text-gray-500 mt-2">{car.descripcion_caracteristica}</p>}
                                                {car.comentarios && <p className="text-xs text-gray-500 mt-1 italic">"{car.comentarios}"</p>}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Insight: Imágen e Intenciones */}
                            {item._type === 'insight' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section>
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Preguntas que responde</h3>
                                        {details?.intenciones && details.intenciones.length > 0 ? (
                                            <ul className="space-y-2">
                                                {details.intenciones.map((intencion, idx) => (
                                                    <li key={idx} className="flex gap-2 text-sm text-gray-700 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                                                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {intencion}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-400">No hay preguntas asociadas.</p>
                                        )}
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Fuente de Origen</h3>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                                            <p><strong>Tipo:</strong> {item.tipo_origen_nombre || 'N/A'}</p>
                                            {item.origen_informacion && <p className="mt-1 flex items-start gap-2"><svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> {item.origen_informacion}</p>}
                                            {item.detalle_origen_informacion && <p className="mt-1 text-gray-500 italic block pl-6">Detalle: {item.detalle_origen_informacion}</p>}
                                            
                                            {/* VISOR DE IMÁGENES */}
                                            {item.imagen && (
                                                <div className="mt-4">
                                                    <div 
                                                        onClick={() => setShowImage(true)}
                                                        className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition w-max border border-blue-100 shadow-sm"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        <span className="font-semibold text-sm">Ver Imagen</span>
                                                    </div>
                                                    
                                                    {showImage && (
                                                        <div 
                                                            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 sm:p-12 backdrop-blur-sm animate-in fade-in duration-200 cursor-zoom-out"
                                                            onClick={handleModalClick} // evitamos clicks raros
                                                        >
                                                            {/* Overlay de clic para cerrar */}
                                                            <div className="absolute inset-0" onClick={() => setShowImage(false)}></div>
                                                            
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setShowImage(false); }} 
                                                                className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full z-10 transition-colors"
                                                                title="Cerrar Imagen"
                                                            >
                                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                            <img 
                                                                src={`http://localhost:5000/api/images?imgPath=${encodeURIComponent(item.imagen)}`} 
                                                                alt="Vista Ampliada" 
                                                                className="relative z-10 max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default border border-white/10"
                                                                onClick={(e) => e.stopPropagation()} // Click en la imagen no cierra
                                                                onError={(e) => { 
                                                                    e.target.onerror = null; 
                                                                    e.target.src = 'https://via.placeholder.com/800x600?text=Imagen+No+Encontrada+en+Ruta+de+Red'; 
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;
