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
                            {item._type === 'definicion' && details?.familias_nombres && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                        {details.familias_nombres}
                                    </span>
                                </div>
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
                        {isEditable && item._type !== 'articulo' && (
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
                                                onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="160" height="100" fill="%23f3f4f6"/><text x="50%" y="50%" font-family="sans-serif" font-size="12" fill="%239ca3af" text-anchor="middle" dy=".3em">Sen Imaxe</text></svg>'; }}
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
                                <div className="space-y-10">
                                    <div className="p-6 sm:p-10 bg-amber-50/20 rounded-[2rem] sm:rounded-[2.5rem] border border-amber-100 ring-1 ring-amber-50 italic font-serif">
                                        <p className="text-gray-800 text-lg sm:text-2xl leading-relaxed">{details?.textoCompleto || item.definicion}</p>
                                    </div>

                                    {(details?.familias_nombres || details?.resumen_edicion || item?.resumen_edicion) && (
                                        <section className="animate-in fade-in slide-in-from-top-2 duration-500">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                                                <span className="w-8 h-[2px] bg-purple-500 rounded-full"></span>
                                                Detalles técnicos
                                            </h3>
                                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                                                <div className="divide-y divide-gray-50">
                                                    {details?.familias_nombres && (
                                                        <div className="flex flex-col sm:flex-row p-4 sm:p-5 hover:bg-gray-50/50 transition-colors group">
                                                            <span className="sm:w-48 text-[10px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0 mb-1 sm:mb-0">Familias vinculadas</span>
                                                            <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-purple-100/50">
                                                                {details.familias_nombres}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {(details?.resumen_edicion || item?.resumen_edicion) && (
                                                        <div className="flex flex-col sm:flex-row p-4 sm:p-5 hover:bg-gray-50/50 transition-colors group">
                                                            <span className="sm:w-48 text-[10px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0 mb-1 sm:mb-0">Control de cambios</span>
                                                            <span className="text-xs text-gray-500 italic leading-relaxed">
                                                                {details?.resumen_edicion || item?.resumen_edicion}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}

                            {loading ? (
                                <div className="flex flex-col items-center py-20">
                                    <div className="w-12 h-12 border-4 border-gray-100 border-t-yellow-500 rounded-full animate-spin mb-6"></div>
                                    <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Cargando información...</span>
                                </div>
                            ) : (
                                <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                                    {item._type === 'articulo' && (
                                        <section className="animate-in fade-in slide-in-from-top-2 duration-500">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-4">
                                                    <span className="w-8 h-[2px] bg-indigo-500 rounded-full"></span>
                                                    Información Técnica
                                                </h3>
                                            </div>
                                            
                                            {details?.caracteristicas && details.caracteristicas.length > 0 ? (
                                                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                                                    <div className="divide-y divide-gray-50">
                                                        {details.caracteristicas.map((car, idx) => (
                                                            <div key={idx} className="flex flex-col sm:flex-row p-4 sm:p-5 hover:bg-gray-50/50 transition-colors group">
                                                                <div className="sm:w-56 flex-shrink-0 flex flex-col gap-1 mb-2 sm:mb-0">
                                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                                                        {car.caracteristica.trim()}
                                                                    </span>
                                                                    {car.norma && (
                                                                        <span className="text-[9px] font-bold text-indigo-400/80 uppercase">
                                                                            {car.norma}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-grow flex flex-col gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[15px] font-bold text-gray-900">{car.valor}</span>
                                                                    </div>
                                                                    {car.comentarios && (
                                                                        <div className="text-[11px] text-gray-500 bg-white/50 border border-gray-100 p-2.5 rounded-xl italic leading-relaxed">
                                                                            {car.comentarios}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-100/50 p-4 rounded-2xl">
                                                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-[11px] font-medium text-gray-400 italic">Este artigo aínda non dispón de ficha técnica detallada.</span>
                                                </div>
                                            )}
                                        </section>
                                    )}

                                    {item._type === 'articulo' && details?.insights_vinculados && details.insights_vinculados.length > 0 && (
                                        <section className="animate-in fade-in slide-in-from-top-4 duration-700 mt-12">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                                                <span className="w-12 h-[3px] bg-blue-500 rounded-full"></span>
                                                Insights vinculados
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 gap-6">
                                                {details.insights_vinculados.map((ins, idx) => (
                                                    <div key={idx} className="bg-white border border-gray-100 rounded-[2rem] p-6 sm:p-8 hover:shadow-xl transition-all hover:border-blue-100 group">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100/50">
                                                                        {ins.tipo_origen_nombre || 'Información'}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                        Ref: {ins.origen_informacion || 'Doc. Xeral'}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                    {ins.titulo}
                                                                </h4>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
                                                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                                                                {ins.insight}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {item._type === 'insight' && (
                                        <div className="flex flex-col gap-10">
                                            {/* SECCIÓN COMBINADA: ORIGEN + IMÁGENES */}
                                            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                                                    <span className="w-8 h-[2px] bg-blue-500 rounded-full"></span>
                                                    Detalles da fonte e recursos
                                                </h3>
                                                
                                                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                                                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-50">
                                                        {/* PARTE IZQUIERDA: INFORMACIÓN EN LISTA (NUEVO DISEÑO) */}
                                                        <div className="flex-grow divide-y divide-gray-50">
                                                            <div className="flex flex-col sm:flex-row p-4 sm:p-5 hover:bg-gray-50/50 transition-colors group">
                                                                <span className="sm:w-48 text-[10px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0 mb-1 sm:mb-0">Fonte de referencia</span>
                                                                <span className="text-sm font-bold text-gray-900 leading-snug">{item.origen_informacion || 'No especificado'}</span>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row p-4 sm:p-5 hover:bg-gray-50/50 transition-colors group">
                                                                <span className="sm:w-48 text-[10px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0 mb-1 sm:mb-0">Tipoloxía</span>
                                                                <span className="inline-flex self-start bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                                                    {item.tipo_origen_nombre || 'Xeral'}
                                                                </span>
                                                            </div>
                                                            {item.detalle_origen_informacion && (
                                                                <div className="flex flex-col sm:flex-row p-4 sm:p-5 hover:bg-gray-50/50 transition-colors group">
                                                                    <span className="sm:w-48 text-[10px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0 mb-1 sm:mb-0">Nota adicional</span>
                                                                    <span className="text-xs text-gray-500 italic leading-relaxed">{item.detalle_origen_informacion}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* PARTE DERECHA: IMAGEN (SI EXISTE) */}
                                                        {item.imagen && (
                                                            <div className="lg:w-72 p-5 bg-gray-50/30 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-100 gap-3">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Infografía / Captura</span>
                                                                <div 
                                                                    onClick={() => setActiveImage(item.imagen)}
                                                                    className="relative group cursor-zoom-in overflow-hidden rounded-2xl border-2 border-white hover:border-blue-400 transition-all shadow-lg w-full aspect-video bg-white ring-1 ring-black/5"
                                                                >
                                                                    <img 
                                                                        src={getImgUrl(item.imagen)} 
                                                                        alt="Vista previa" 
                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                        onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f3f4f6"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="%239ca3af" text-anchor="middle" dy=".3em">Sen Imaxe</text></svg>'; }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </section>
                                            {/* ARTIGOS VINCULADOS */}
                                            {details?.articulos_vinculados && details.articulos_vinculados.length > 0 && (
                                                <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                                                        <span className="w-8 h-[2px] bg-yellow-500 rounded-full"></span>
                                                        Artigos vinculados
                                                    </h3>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {details.articulos_vinculados.map((art, idx) => {
                                                            const desc = art.descripcion || art.DESCRIPCION || art.titulo || 'Artigo sen descrición';
                                                            const code = art.codigo || art.CODIGO;
                                                            return (
                                                                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all hover:border-yellow-100 group flex justify-between items-center">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Artigo</span>
                                                                        <h4 className="text-base font-bold text-gray-900">{desc}</h4>
                                                                    </div>
                                                                    {code && (
                                                                        <span className="text-[11px] font-mono font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                                                            {code}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            )}

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
