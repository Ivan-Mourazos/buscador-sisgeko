import React, { useState, useEffect, useRef } from 'react';

const CreateItemModal = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
    const [step, setStep] = useState(1); // 1: Selection, 2: Form
    const [type, setType] = useState(null); // 'articulo' | 'insight'
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    
    // Form state
    const [formData, setFormData] = useState({});
    const [newImageUrl, setNewImageUrl] = useState('');

    // Helper para previsualización (mesmo que DetailsModal)
    const getImgUrl = (path) => `http://${window.location.hostname}:5000/api/images?imgPath=${encodeURIComponent(path)}`;

    // Bloquear scroll de la página principal
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            
            // Si hay datos iniciales, saltamos directamente al paso 2
            if (initialData) {
                setStep(2);
                setType(initialData._type);
                // Aseguramos que imagenes sexa un array se é un artigo
                const data = { ...initialData };
                if (data._type === 'articulo' && !data.imagenes) {
                    data.imagenes = [];
                }
                setFormData(data);
            }
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            if (!isOpen) {
                setStep(1);
                setType(null);
                setFormData({});
                setShowDeleteConfirm(false);
                setNewImageUrl('');
            }
        };
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
            const response = await fetch(`http://${window.location.hostname}:5000/api/upload`, {
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
        onDelete(formData);
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
        onSave({ ...formData, _type: type });
        resetAndClose();
    };

    const InputField = ({ label, name, placeholder, type = "text", required = false }) => (
        <div className="space-y-1.5 flex-grow">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <input 
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-sm text-gray-700 placeholder:text-gray-300"
            />
        </div>
    );

    const TextAreaField = ({ label, name, placeholder, required = false }) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <textarea 
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                rows={3}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-sm text-gray-700 placeholder:text-gray-300 resize-none"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden transform transition-all animate-scale-in max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            {initialData ? `Editar ${type === 'articulo' ? 'Artigo' : type === 'insight' ? 'Insight' : 'Definición'}` : step === 1 ? 'Que queres engadir?' : `Novo ${type === 'articulo' ? 'Artigo' : type === 'insight' ? 'Insight' : 'Definición'}`}
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

                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 items-stretch">
                            <button 
                                onClick={() => handleNext('articulo')}
                                className="group p-8 bg-yellow-50/30 border-2 border-yellow-100/50 rounded-[2.5rem] hover:border-yellow-400 hover:bg-yellow-50 transition-all text-center flex flex-col items-center gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className="w-16 h-16 bg-yellow-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 17v-4.5" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-gray-900 leading-tight">Artigo</h3>
                                    <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-black">Fichas técnicas</p>
                                </div>
                            </button>

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
                            {type === 'articulo' ? (
                                <>
                                    <InputField label="Descrición do Artigo" name="descripcion" placeholder="Nome completo do producto" required={true} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Código / Ref" name="codigo" placeholder="ex: 12345ABC" />
                                        <InputField label="Proveedor" name="denominacion_proveedor" placeholder="Nome da empresa" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Familia" name="familia_nombre" placeholder="Categoría principal" />
                                        <InputField label="Subfamilia" name="subfamilia" placeholder="Sub-categoría" />
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Galeira de Imaxes (Rutas)</h4>
                                            <span className="text-[10px] font-bold text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-full">{formData.imagenes?.length || 0} Imaxes</span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {formData.imagenes?.map((img, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm animate-in zoom-in duration-200">
                                                    <span className="text-[11px] font-mono font-medium text-gray-600 truncate max-w-[150px]">{img}</span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-300"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                            {(!formData.imagenes || formData.imagenes.length === 0) && (
                                                <p className="text-[11px] text-gray-300 italic">Non hai imaxes engadidas aínda.</p>
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <input 
                                                type="text" 
                                                value={newImageUrl}
                                                onChange={(e) => setNewImageUrl(e.target.value)}
                                                placeholder="ex: imaxe_nova.jpg"
                                                className="flex-grow px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all"
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                                            />
                                            <button 
                                                type="button"
                                                disabled={isUploading}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-xl hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {isUploading ? 'Subindo...' : 'Subir'}
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => addImage()}
                                                className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-all active:scale-95"
                                            >
                                                Engadir
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : type === 'insight' || type === 'definicion' ? (
                                <>
                                    {type === 'insight' ? (
                                        <>
                                            <InputField label="Título do Insight" name="titulo" placeholder="Enunciado corto e directo" required={true} />
                                            <TextAreaField label="Contido do Insight" name="insight" placeholder="Explica a lección aprendida ou o dato clave..." required={true} />
                                        </>
                                    ) : (
                                        <>
                                            <InputField label="Termo / Concepto" name="titulo" placeholder="Nome da definición" required={true} />
                                            <TextAreaField label="Definición" name="definicion" placeholder="Explica o concepto de forma clara..." required={true} />
                                        </>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InputField label="Documento Fonte" name="origen_informacion" placeholder="ex: Manual de procesos V2" />
                                        <InputField label="Tipo de Fonte" name="tipo_origen_nombre" placeholder="ex: Normativa, Estudo..." />
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <div className="flex-grow">
                                            <InputField label="URL Imaxe / Icona" name="imagen" placeholder="ex: infografia_01.webp" />
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
                                    <TextAreaField label="Contexto adicional" name="detalle_origen_informacion" placeholder="Notas sobre a procedencia ou validez..." />
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
                    <div className="px-8 py-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                        <div className="flex items-center gap-4">
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
                                        <div className="flex items-center gap-2 bg-red-50 p-1 pr-3 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-left-2 transition-all">
                                            <button 
                                                type="button"
                                                onClick={handleDelete}
                                                className="px-5 py-2 bg-red-500 text-white text-xs font-black rounded-xl hover:bg-red-600 shadow-md shadow-red-500/20"
                                            >
                                                Confirmar Borrado
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest px-2"
                                            >
                                                Cancelar
                                            </button>
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
                            className="px-10 py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-2xl shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
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
