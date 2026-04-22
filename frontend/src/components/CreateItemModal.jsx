import React, { useState, useEffect, useRef } from 'react';

const InputField = ({ label, name, placeholder, type = "text", required = false, value, onChange }) => (
    <div className="space-y-1.5 flex-grow">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-sm text-gray-700 placeholder:text-gray-300"
        />
    </div>
);

const TextAreaField = ({ label, name, placeholder, required = false, value, onChange }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <textarea
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            rows={3}
            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-sm text-gray-700 placeholder:text-gray-300 resize-none"
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false }) => (
    <div className="space-y-1.5 flex-grow">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <select
            name={name}
            value={value || ''}
            onChange={onChange}
            required={required}
            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-sm text-gray-700 placeholder:text-gray-400 appearance-none cursor-pointer"
        >
            <option value="" disabled>Selecciona unha opción...</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

const CreateItemModal = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
    const [step, setStep] = useState(1); // 1: Selection, 2: Form
    const [type, setType] = useState(null); // 'articulo' | 'insight'
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState({});
    const [newImageUrl, setNewImageUrl] = useState('');
    const [deleteReason, setDeleteReason] = useState('');

    // State for DB options
    const [dbOptions, setDbOptions] = useState({
        articulos: [],
        procesos: [],
        tipo_origen: [],
        familias: [],
        subfamilias: []
    });

    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    // Fetch options from DB
    const fetchOptions = async () => {
        setIsLoadingOptions(true);
        try {
            const res = await fetch('/api/form-options');
            const data = await res.json();
            if (data.success) {
                setDbOptions({
                    articulos: data.articulos || [],
                    procesos: data.procesos || [],
                    tipo_origen: data.tipo_origen || [],
                    familias: data.familias || [],
                    subfamilias: data.subfamilias || []
                });
            }
        } catch (err) {
            console.error("Error fetching form options:", err);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    // Helper para previsualización (mesmo que DetailsModal)
    const getImgUrl = (path) => `/api/images?imgPath=${encodeURIComponent(path)}`;

    // Inicializar data solo una vez al abrir o cuando cambia initialData externamente
    useEffect(() => {
        if (!isOpen) return;

        // Cargar opciones al abrir para asegurar datos frescos
        fetchOptions();

        if (initialData) {
            setStep(2);
            setType(initialData._type);
            const data = { ...initialData };
            
            // Normalizar arrays de IDs vinculados (poden vir como obxectos dende API details)
            if (data.articulos_vinculados) {
                data.articulos_vinculados = data.articulos_vinculados.map(a => typeof a === 'object' ? a.id_articulo : a);
            }
            if (data.procesos_vinculados) {
                data.procesos_vinculados = data.procesos_vinculados.map(p => typeof p === 'object' ? p.id_proceso : p);
            }
            if (data.familias_vinculadas) {
                data.familias_vinculadas = data.familias_vinculadas.map(f => typeof f === 'object' ? (f.id || f.value || f.id_familia) : f);
            }

            if (data._type === 'articulo' && !data.imagenes) {
                data.imagenes = [];
            }
            setFormData(data);
        } else {
            setFormData({});
            setStep(1);
            setType(null);
        }
    }, [isOpen, initialData]);

    // Bloquear scroll ao abrir o modal
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const resetAndClose = () => {
        setStep(1);
        setType(null);
        setFormData({});
        setShowDeleteConfirm(false);
        setNewImageUrl('');
        setDeleteReason('');
        onClose();
    };

    const addImage = (url) => {
        const val = url || newImageUrl.trim();
        if (!val) return;
        setFormData(prev => ({
            ...prev,
            imagenes: [...(prev.imagenes || []), val]
        }));
        if (!url) setNewImageUrl('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload
            });
            const result = await response.json();

            if (result.success) {
                if (type === 'articulo') {
                    addImage(result.filename);
                } else {
                    setFormData(prev => ({ ...prev, imagen: result.filename }));
                }
                alert('Imaxe subida con éxito: ' + result.filename);
            } else {
                alert('Error na subida: ' + result.message);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error de conexión ao subir a imaxe.');
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            imagenes: prev.imagenes.filter((_, i) => i !== index)
        }));
    };

    const handleDelete = () => {
        if (!deleteReason || deleteReason.trim().length < 5) {
            alert("Por favor, indica o motivo do borrado (mínimo 5 caracteres).");
            return;
        }
        onDelete({ ...formData, resumen_edicion: deleteReason });
        resetAndClose();
    };

    const handleNext = (selectedType) => {
        setType(selectedType);
        setStep(2);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validación estricta para edición
        if (initialData && (type === 'insight' || type === 'definicion')) {
            if (!formData.resumen_edicion || formData.resumen_edicion.trim().length < 5) {
                alert("Por favor, cubre o 'Motivo da edición' (mínimo 5 caracteres) antes de gardar.");
                // Hacer scroll al campo si es posible o simplemente parar
                return;
            }
        }

        onSave({ ...formData, _type: type });
        resetAndClose();
    };


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden transform transition-all animate-scale-in max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex justify-between items-start sm:items-center bg-gray-50/50 gap-2">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            {initialData ? `Editar ${type === 'insight' ? 'Insight' : 'Definición'}` : step === 1 ? 'Que queres engadir?' : `Novo ${type === 'insight' ? 'Insight' : 'Definición'}`}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {initialData ? 'Modifica os campos necesarios para actualizar a información' : 'Define un novo elemento para a base de datos'}
                        </p>
                    </div>
                    <button
                        onClick={resetAndClose}
                        className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-gray-400"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar flex-grow">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 items-stretch">
                            <button
                                onClick={() => handleNext('insight')}
                                className="group p-8 bg-blue-50/30 border-2 border-blue-100/50 rounded-[2.5rem] hover:border-blue-400 hover:bg-blue-50 transition-all text-center flex flex-col items-center gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.674a1 1 0 00.922-.617l2.108-4.742A4 4 0 1013.337 5h-2.674a4 4 0 10-3.996 6.641l2.108 4.742a1 1 0 00.922.617z" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-gray-900 leading-tight">Insight</h3>
                                    <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-black">Datos clave</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleNext('definicion')}
                                className="group p-8 bg-purple-50/30 border-2 border-purple-100/50 rounded-[2.5rem] hover:border-purple-400 hover:bg-purple-50 transition-all text-center flex flex-col items-center gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className="w-16 h-16 bg-purple-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-gray-900 leading-tight">Definición</h3>
                                    <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-black">Conceptos clave</p>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <form id="create-form" onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            {type === 'insight' ? (
                                <>
                                    <InputField label="Título do Insight" name="titulo" placeholder="Enunciado corto e directo" required={true} value={formData.titulo} onChange={handleChange} />
                                    <TextAreaField label="Contido do Insight" name="insight" placeholder="Explica a lección aprendida ou o dato clave..." required={true} value={formData.insight} onChange={handleChange} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InputField label="Orixe" name="origen_informacion" placeholder="ex: Manual de procesos V2" value={formData.origen_informacion} onChange={handleChange} />
                                        <SelectField
                                            label="Tipo de Fonte"
                                            name="id_tipo_origen"
                                            value={formData.id_tipo_origen}
                                            onChange={handleChange}
                                            options={dbOptions.tipo_origen}
                                            required={true}
                                        />
                                    </div>

                                    {/* Vinculación a Artigos */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Artigos vinculados</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(formData.articulos_vinculados || []).map(artId => {
                                                const art = dbOptions.articulos.find(a => a.id_articulo === artId);
                                                return (
                                                    <div key={artId} className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100 shadow-sm animate-in zoom-in duration-200">
                                                        <span className="text-[11px] font-bold text-yellow-700">{art?.descripcion || `ID: ${artId}`}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    articulos_vinculados: (prev.articulos_vinculados || []).filter(id => id !== artId)
                                                                }));
                                                            }}
                                                            className="p-1 hover:bg-yellow-200 hover:text-yellow-800 rounded-lg transition-colors text-yellow-400"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <select
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-sm text-gray-700"
                                            onChange={(e) => {
                                                const id = parseInt(e.target.value);
                                                if (id && !(formData.articulos_vinculados || []).includes(id)) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        articulos_vinculados: [...(prev.articulos_vinculados || []), id]
                                                    }));
                                                }
                                                e.target.value = "";
                                            }}
                                        >
                                            <option value="">{isLoadingOptions ? "Cargando..." : "Engadir artigo..."}</option>
                                            {dbOptions.articulos.filter(a => !(formData.articulos_vinculados || []).includes(a.id_articulo)).map(art => (
                                                <option key={art.id_articulo} value={art.id_articulo}>{art.descripcion}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Vinculación a Procesos */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Procesos vinculados</label>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(formData.procesos_vinculados || []).map(procId => {
                                                const proc = dbOptions.procesos.find(p => p.id_proceso === procId);
                                                return (
                                                    <div key={procId} className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm animate-in zoom-in duration-200">
                                                        <span className="text-[11px] font-bold text-blue-700">{proc?.nombre || `ID: ${procId}`}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    procesos_vinculados: (prev.procesos_vinculados || []).filter(id => id !== procId)
                                                                }));
                                                            }}
                                                            className="p-1 hover:bg-blue-200 hover:text-blue-800 rounded-lg transition-colors text-blue-400"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                                            {dbOptions.procesos.map(proc => {
                                                const isSelected = (formData.procesos_vinculados || []).includes(proc.id_proceso);
                                                return (
                                                    <button
                                                        key={proc.id_proceso}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => {
                                                                const list = prev.procesos_vinculados || [];
                                                                if (isSelected) {
                                                                    return { ...prev, procesos_vinculados: list.filter(id => id !== proc.id_proceso) };
                                                                } else {
                                                                    return { ...prev, procesos_vinculados: [...list, proc.id_proceso] };
                                                                }
                                                            });
                                                        }}
                                                        className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${isSelected
                                                                ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20'
                                                                : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500'
                                                            }`}
                                                    >
                                                        {proc.nombre}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <div className="flex-grow">
                                            <InputField label="URL Imaxe / Icona" name="imagen" placeholder="ex: infografia_01.webp" value={formData.imagen} onChange={handleChange} />
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isUploading}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-3 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-2xl hover:bg-blue-100 transition-all mb-0.5 disabled:opacity-50"
                                        >
                                            {isUploading ? '...' : 'Subir'}
                                        </button>
                                        {formData.imagen && (
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50 flex-shrink-0 mb-1 shadow-sm">
                                                <img
                                                    src={getImgUrl(formData.imagen)}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <TextAreaField label="Contexto adicional" name="detalle_origen_informacion" placeholder="Notas sobre a procedencia ou validez..." value={formData.detalle_origen_informacion} onChange={handleChange} />
                                    {initialData && (
                                        <TextAreaField 
                                            label="Motivo da edición (Auditoría)" 
                                            name="resumen_edicion" 
                                            placeholder="Por que estás editando este insight? ex: Corrección de erro en..." 
                                            value={formData.resumen_edicion} 
                                            onChange={handleChange} 
                                            required={true}
                                        />
                                    )}
                                </>
                            ) : type === 'definicion' ? (
                                <>
                                    <InputField label="Termo / Concepto" name="titulo" placeholder="Nome da definición" required={true} value={formData.titulo} onChange={handleChange} />
                                    <TextAreaField label="Definición" name="definicion" placeholder="Explica o concepto de forma clara..." required={true} value={formData.definicion} onChange={handleChange} />
                                    
                                    {/* Vinculación a Familias */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Familias vinculadas</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(formData.familias_vinculadas || []).map(famId => {
                                                const fam = dbOptions.familias.find(f => f.value === famId);
                                                return (
                                                    <div key={famId} className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 shadow-sm animate-in zoom-in duration-200">
                                                        <span className="text-[11px] font-bold text-purple-700">{fam?.label || `ID: ${famId}`}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    familias_vinculadas: (prev.familias_vinculadas || []).filter(id => id !== famId)
                                                                }));
                                                            }}
                                                            className="p-1 hover:bg-purple-200 hover:text-purple-800 rounded-lg transition-colors text-purple-400"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <select
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-sm text-gray-700"
                                            onChange={(e) => {
                                                const id = parseInt(e.target.value);
                                                if (id && !(formData.familias_vinculadas || []).includes(id)) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        familias_vinculadas: [...(prev.familias_vinculadas || []), id]
                                                    }));
                                                }
                                                e.target.value = "";
                                            }}
                                        >
                                            <option value="">{isLoadingOptions ? "Cargando..." : "Vincular a unha familia..."}</option>
                                            {dbOptions.familias.filter(f => !(formData.familias_vinculadas || []).includes(f.value)).map(fam => (
                                                <option key={fam.value} value={fam.value}>{fam.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {initialData && (
                                        <TextAreaField 
                                            label="Motivo da edición (Auditoría)" 
                                            name="resumen_edicion" 
                                            placeholder="Por que estás editando esta definición? ex: Actualización segundo nova normativa..." 
                                            value={formData.resumen_edicion} 
                                            onChange={handleChange} 
                                            required={true}
                                        />
                                    )}
                                </>
                            ) : null}
                        </form>
                    )}
                </div>

                {/* Input de ficheiros oculto */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*"
                />

                {step === 2 && (
                    <div className="px-5 sm:px-8 py-4 sm:py-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center bg-gray-50/30 gap-4">
                        <div className="flex justify-center sm:justify-start items-center gap-4">
                            {!initialData && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-2 px-6 py-3 text-gray-500 font-bold hover:text-gray-900 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Volver
                                </button>
                            )}

                            {initialData && (
                                <div className="flex items-center gap-3">
                                    {showDeleteConfirm ? (
                                        <div className="flex flex-col gap-2 bg-red-50 p-3 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-left-2 transition-all w-full sm:w-64">
                                            <label className="text-[10px] font-black uppercase text-red-800 tracking-widest ml-1">Motivo do borrado:</label>
                                            <textarea
                                                autoFocus
                                                value={deleteReason}
                                                onChange={(e) => setDeleteReason(e.target.value)}
                                                placeholder="Xustificación obrigat..."
                                                className="w-full text-xs p-2 rounded-xl border border-red-200 outline-none focus:border-red-400 resize-none h-16 bg-white placeholder-red-300"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleDelete}
                                                    className="flex-1 py-2 bg-red-500 text-white text-[10px] font-black rounded-xl hover:bg-red-600 shadow-md shadow-red-500/20 uppercase tracking-wider"
                                                >
                                                    Confirmar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowDeleteConfirm(false); setDeleteReason(''); }}
                                                    className="flex-1 py-2 text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="flex items-center gap-2 px-6 py-3 text-red-400 font-bold hover:text-red-600 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            form="create-form"
                            type="submit"
                            className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-2xl shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
                        >
                            {initialData ? 'Actualizar Elemento' : 'Gardar Elemento'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


export default CreateItemModal;
