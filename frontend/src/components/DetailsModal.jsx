import React, { useState, useEffect } from 'react';

const DetailsModal = ({ isOpen, onClose, item, details, loading, isEditable, onEdit }) => {
    const [activeImage, setActiveImage] = useState(null);

    // Resetear imagen si cambiamos de item y bloquear scroll
    useEffect(() => {
        setActiveImage(null);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [item, isOpen]);

    if (!isOpen || !item) return null;

    // Detenemos propagación del click exterior
    const handleModalClick = (e) => e.stopPropagation();

    // Helper para construir la URL de la imagen
    const getImgUrl = (path) => `/api/images?imgPath=${encodeURIComponent(path)}`;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-gray-900/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-4xl max-h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300 ring-1 ring-black/5"
                onClick={handleModalClick}
            >
                {/* Header - Más Aireado y Legible */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 backdrop-blur-xl gap-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col">
                            <span className={`text-[11px] font-black uppercase tracking-widest ${
                                item._type === 'articulo' ? 'text-yellow-600' :
                                item._type === 'insight' ? 'text-blue-600' :
                                'text-purple-600'
                            }`}>
                                {item._type === 'articulo' ? 'Artigo' : item._type === 'insight' ? 'Insight' : 'Definición'}
                            </span>
                            {item.procesos_lista && (
                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-purple-500 mt-1">
                                    {item.procesos_lista}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight pr-4">
                            {item._type === 'articulo' ? item.descripcion : item.titulo}
                        </h2>
                        
                        {/* INFORMACIÓN CRÍTICA: Con más margen para evitar saturación */}
                        {item._type === 'articulo' && (
                            <div className="flex flex-col sm:flex-row flex-wrap sm:gap-x-8 gap-y-2 mt-2">
                                {item.denominacion_proveedor && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Proveedor</span>
                                        <span className="text-base font-extrabold text-yellow-700 bg-yellow-50 px-3 py-1 rounded-md border border-yellow-100/50">{item.denominacion_proveedor}</span>
                                    </div>
                                )}
                                {item.codigo && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Código</span>
                                        <span className="text-base font-mono font-bold text-gray-800">{item.codigo}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {isEditable && (
                            <button 
                                onClick={() => onEdit(item)}
                                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-black uppercase tracking-widest text-gray-800 hover:text-black transition-all active:scale-95 group"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 group-hover:text-yellow-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span className="hidden sm:inline">Editar</span>
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group shrink-0"
                        >
                            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body - Mejorado con Scroll y Grids Claros */}
                <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex-grow bg-white">
                    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
                        
                        {/* MINIATURAS DE IMAGENES (SOLO PARA ARTÍCULOS - LOS INSIGHTS VAN ABAJO CON EL ORIGEN) */}
                        {item._type === 'articulo' && details?.imagenes?.length > 0 && (
                            <section className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                    Recursos Gráficos
                                    <span className="h-[1px] flex-grow bg-gray-100"></span>
                                </h3>
                                
                                <div className="flex flex-wrap gap-4">
                                    {details.imagenes.map((img, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => setActiveImage(img)}
                                            className="relative group cursor-zoom-in overflow-hidden rounded-2xl border-2 border-gray-100 hover:border-yellow-400 transition-all shadow-sm w-[160px] h-[100px] bg-gray-50 flex-shrink-0"
                                        >
                                            <img 
                                                src={getImgUrl(img)} 
                                                alt={`Thumb ${idx}`} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/160x100?text=Error'; }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Contenido Principal */}
                        <div className="space-y-12">
                            {item._type === 'insight' && (
                                <div className="p-8 bg-yellow-50/20 border border-yellow-100 rounded-[2rem] relative overflow-hidden ring-1 ring-yellow-50">
                                    <div className="absolute top-0 right-0 p-4 sm:p-6 text-blue-100/30">
                                        <svg className="w-16 h-16 sm:w-24 sm:h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V5C14.017 3.89543 14.9124 3 16.017 3H21.017C22.1216 3 23.017 3.89543 23.017 5V15C23.017 18.3137 20.3307 21 17.017 21H14.017ZM1 21L1 18C1 16.8954 1.89543 16 3 16H6C6.55228 16 7 15.5523 7 15V9C7 8.44772 6.55228 8 6 8H3C1.89543 8 1 7.10457 1 6V5C1 3.89543 1.89543 3 3 3H8C9.10457 3 10 3.89543 10 5V15C10 18.3137 7.31371 21 4 21H1ZM17.017 18C17.3942 18 17.7554 17.925 18.0833 17.7891C18.6477 17.5554 19.017 16.9852 19.017 16.3333V18H17.017Z" /></svg>
                                    </div>
                                    <p className="text-gray-800 text-lg sm:text-2xl font-semibold leading-relaxed relative z-10 italic">"{item.insight}"</p>
                                </div>
                            )}

                            {item._type === 'definicion' && (
                                <div className="p-6 sm:p-10 bg-amber-50/20 rounded-[2rem] sm:rounded-[2.5rem] border border-amber-100 ring-1 ring-amber-50 italic font-serif">
                                    <p className="text-gray-800 text-lg sm:text-2xl leading-relaxed">{details?.textoCompleto || item.definicion}</p>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex flex-col items-center py-20">
                                    <div className="w-12 h-12 border-4 border-gray-100 border-t-yellow-500 rounded-full animate-spin mb-6"></div>
                                    <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Cargando información...</span>
                                </div>
                            ) : (
                                <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                                    {item._type === 'articulo' && details?.caracteristicas && details.caracteristicas.length > 0 && (
                                        <section>
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                                                <span className="w-12 h-[3px] bg-indigo-500 rounded-full"></span>
                                                Información Técnica
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {details.caracteristicas.map((car, idx) => (
                                                    <div key={idx} className="bg-gray-50/50 hover:bg-white rounded-[1.5rem] p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:border-yellow-100 group">
                                                        <h4 className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.1em] mb-2 group-hover:text-yellow-600 transition-colors">{car.caracteristica.trim()}</h4>
                                                        <p className="text-lg font-bold text-gray-900 leading-tight">{car.valor}</p>
                                                        {car.descripcion_caracteristica && <p className="text-[11px] text-gray-500 mt-4 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">{car.descripcion_caracteristica}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {item._type === 'insight' && (
                                        <div className="flex flex-col gap-10">
                                            {/* SECCIÓN COMBINADA: ORIGEN + IMÁGENES */}
                                            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                                    Detalles da fonte e recursos
                                                    <span className="h-[1px] flex-grow bg-gray-100"></span>
                                                </h3>
                                                
                                                <div className="bg-gray-50/80 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 ring-1 ring-gray-200/50 shadow-sm">
                                                    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
                                                        {/* PARTE IZQUIERDA: INFORMACIÓN DE REFERENCIA (APILADO VERTICAL) */}
                                                        <div className="flex flex-col gap-4 sm:gap-6 min-w-0 sm:min-w-[300px] flex-shrink-0">
                                                            <div className="flex flex-col gap-2">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento de Referencia</span>
                                                                <span className="text-lg font-bold text-gray-900 leading-snug break-words max-w-sm">{item.origen_informacion || 'No especificado'}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipoloxía de fonte</span>
                                                                <span className="inline-flex self-start bg-gray-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-md">
                                                                    {item.tipo_origen_nombre || 'Xeral'}
                                                                </span>
                                                            </div>
                                                            {/* Procesos movidos arriba */}
                                                        </div>

                                                        {/* PARTE DERECHA: RECURSOS GRÁFICOS (PARA INSIGHTS) */}
                                                        {item.imagen && (
                                                            <div className="flex-grow flex flex-col gap-3">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vista de Página / Infografías</span>
                                                                <div className="flex flex-wrap gap-4">
                                                                    <div 
                                                                        onClick={() => setActiveImage(item.imagen)}
                                                                        className="relative group cursor-zoom-in overflow-hidden rounded-2xl border-2 border-white hover:border-yellow-400 transition-all shadow-lg hover:shadow-xl w-[200px] h-[130px] bg-white ring-1 ring-black/5"
                                                                    >
                                                                        <img 
                                                                            src={getImgUrl(item.imagen)} 
                                                                            alt="Vista previa" 
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/200x130?text=Error'; }}
                                                                        />
                                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-gray-900/5 transition-opacity">
                                                                            <div className="bg-white/95 p-2 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                                                                                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {item.detalle_origen_informacion && (
                                                        <div className="mt-8 pt-6 border-t border-gray-200/50">
                                                            <p className="text-sm text-gray-500 font-medium italic leading-relaxed">
                                                                "{item.detalle_origen_informacion}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>

                                            {/* PREGUNTAS CLAVE / FAQ - PRIORIDAD BAJA */}
                                            <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                                    Información adicional / FAQ's
                                                    <span className="h-[1px] flex-grow bg-gray-100"></span>
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {details?.intenciones?.map((int, i) => (
                                                        <div key={i} className="flex gap-4 text-base text-gray-700 bg-white p-5 rounded-2xl border border-gray-100 font-bold group shadow-sm hover:border-yellow-100 hover:shadow-md transition-all">
                                                            <div className="w-6 h-6 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0 text-xs font-black">?</div>
                                                            {int}
                                                        </div>
                                                    )) || <p className="text-gray-300 italic text-sm">No hay FAQ's asociadas.</p>}
                                                </div>
                                            </section>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX (Maximizado) */}
            {activeImage && (
                <div 
                    className="fixed inset-0 z-[200] bg-gray-900/98 flex flex-col items-center justify-center p-4 sm:p-12 backdrop-blur-3xl animate-in fade-in duration-300 cursor-zoom-out"
                    onClick={() => setActiveImage(null)}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActiveImage(null); }} 
                        className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 text-white p-5 rounded-3xl z-10 transition-all border border-white/10 shadow-2xl"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <img 
                        src={getImgUrl(activeImage)} 
                        alt="Zoom" 
                        className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-in zoom-in duration-300 ring-1 ring-white/10"
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/800x600?text=Error+Servidor+Red'; }}
                    />
                    <div className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[11px] text-white/50 font-mono tracking-widest uppercase backdrop-blur-md">
                        {activeImage}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailsModal;
