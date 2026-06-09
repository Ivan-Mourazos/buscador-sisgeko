import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const InputField = ({ label, name, placeholder, type = "text", required = false, value, onChange }) => (
    <div className="space-y-1.5 flex-grow">
        <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-yellow-50 dark:focus:ring-yellow-950/20 focus:border-yellow-400 dark:focus:border-yellow-500 transition-all outline-none text-sm text-gray-700 dark:text-zinc-100 placeholder:text-gray-350 dark:placeholder:text-zinc-500"
        />
    </div>
);

const TextAreaField = ({ label, name, placeholder, required = false, value, onChange }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
        <textarea
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            rows={3}
            className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-yellow-50 dark:focus:ring-yellow-950/20 focus:border-yellow-400 dark:focus:border-yellow-500 transition-all outline-none text-sm text-gray-700 dark:text-zinc-100 placeholder:text-gray-350 dark:placeholder:text-zinc-500 resize-none"
        />
    </div>
);

const CustomSelect = ({ options, value, onChange, placeholder = 'Selecciona...', compact = false, searchable = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState({});
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    const filtered = search
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    const openDropdown = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        const estHeight = Math.min(filtered.length * 38 + (searchable ? 60 : 10), 290);
        const spaceBelow = window.innerHeight - rect.bottom;
        const goUp = spaceBelow < estHeight + 16 && rect.top > estHeight;
        setDropdownStyle({
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            ...(goUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
            zIndex: 9999,
        });
        setIsOpen(true);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') { setIsOpen(false); setSearch(''); } };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen]);

    const handleSelect = (val) => { onChange(val); setIsOpen(false); setSearch(''); };
    const selectedLabel = options.find(o => String(o.value) === String(value))?.label;
    const sizeBase = compact ? 'px-4 py-2.5 rounded-xl' : 'px-5 py-3 rounded-2xl';

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => isOpen ? setIsOpen(false) : openDropdown()}
                className={`w-full ${sizeBase} text-sm bg-gray-50 dark:bg-zinc-950/40 border transition-all outline-none cursor-pointer flex items-center justify-between gap-2 ${
                    isOpen ? 'border-yellow-400 dark:border-yellow-500 ring-4 ring-yellow-50 dark:ring-yellow-950/20' : 'border-gray-200 dark:border-zinc-800'
                } ${selectedLabel ? 'text-gray-700 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500'}`}
            >
                <span className="truncate text-left">{selectedLabel || placeholder}</span>
                <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 text-gray-400 dark:text-zinc-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={dropdownStyle}
                    className="bg-white dark:bg-[#1c1c28] border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl dark:shadow-[0_16px_50px_rgba(0,0,0,0.75)] overflow-hidden"
                >
                    {searchable && (
                        <div className="p-2 border-b border-gray-100 dark:border-zinc-800">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar..."
                                autoFocus
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none focus:border-yellow-400 dark:focus:border-yellow-500 text-gray-700 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                            />
                        </div>
                    )}
                    <div className="overflow-y-auto max-h-[220px] py-1">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 dark:text-zinc-500 text-center">Sen resultados</div>
                        ) : filtered.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-amber-50 dark:hover:bg-yellow-950/25 ${
                                    String(opt.value) === String(value)
                                        ? 'bg-amber-50 dark:bg-yellow-950/25 text-yellow-700 dark:text-yellow-400 font-semibold'
                                        : 'text-gray-700 dark:text-zinc-200'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

const SelectField = ({ label, name, value, onChange, options }) => (
    <div className="space-y-1.5 flex-grow">
        <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
        <CustomSelect
            options={options}
            value={value || ''}
            onChange={(val) => onChange({ target: { name, value: val } })}
            placeholder="Selecciona unha opción..."
        />
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
    const [pendingImageFile, setPendingImageFile] = useState(null);
    const [pendingImagePreview, setPendingImagePreview] = useState(null);

    // State for DB options
    const [dbOptions, setDbOptions] = useState({
        articulos: [],
        insights: [],
        procesos: [],
        tipo_origen: [],
        familias: [],
        subfamilias: [],
        caracteristicas: []
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
                    insights: data.insights || [],
                    procesos: data.procesos || [],
                    tipo_origen: data.tipo_origen || [],
                    familias: data.familias || [],
                    subfamilias: data.subfamilias || [],
                    caracteristicas: data.caracteristicas || []
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

            if (data._type === 'articulo') {
                if (!data.imagenes) data.imagenes = [];
                // Normalizar características para el formulario de edición
                if (data.caracteristicas) {
                    data.caracteristicas = data.caracteristicas.map((c, i) => ({
                        id_caracteristica: c.id_caracteristica || '',
                        valor: c.valor || '',
                        comentarios: c.comentarios || '',
                        norma: c.norma || '',
                        orden: c.orden || i + 1
                    }));
                } else {
                    data.caracteristicas = [];
                }
                // Normalizar insights vinculados (pueden vir como obxectos dende API details)
                if (data.insights_vinculados) {
                    data.insights_vinculados = data.insights_vinculados.map(i => typeof i === 'object' ? i.id_insight : i);
                } else {
                    data.insights_vinculados = [];
                }
            }
            // Limpiar motivo edición anterior ("Aprobado por ...") para nueva edición
            data.resumen_edicion = '';
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
        if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
        setPendingImageFile(null);
        setPendingImagePreview(null);
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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        if (type === 'articulo') {
            setIsUploading(true);
            const fd = new FormData();
            fd.append('image', file);
            fetch('/api/upload', { method: 'POST', body: fd })
                .then(r => r.json())
                .then(result => {
                    if (result.success) addImage(result.filename);
                    else alert('Error na subida: ' + result.message);
                })
                .catch(() => alert('Error de conexión ao subir a imaxe.'))
                .finally(() => setIsUploading(false));
        } else {
            if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
            setPendingImageFile(file);
            setPendingImagePreview(URL.createObjectURL(file));
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

    const addCaracteristica = () => {
        setFormData(prev => ({
            ...prev,
            caracteristicas: [...(prev.caracteristicas || []), { id_caracteristica: '', valor: '', comentarios: '', norma: '', orden: (prev.caracteristicas || []).length + 1 }]
        }));
    };

    const removeCaracteristica = (idx) => {
        setFormData(prev => ({
            ...prev,
            caracteristicas: (prev.caracteristicas || []).filter((_, i) => i !== idx)
        }));
    };

    const updateCaracteristica = (idx, field, value) => {
        setFormData(prev => ({
            ...prev,
            caracteristicas: (prev.caracteristicas || []).map((c, i) => i === idx ? { ...c, [field]: value } : c)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (initialData && (type === 'insight' || type === 'definicion' || type === 'articulo')) {
            if (!formData.resumen_edicion || formData.resumen_edicion.trim().length < 5) {
                alert("Por favor, cubre o 'Motivo da edición' (mínimo 5 caracteres) antes de gardar.");
                return;
            }
        }

        let finalFormData = { ...formData };

        if (pendingImageFile) {
            setIsUploading(true);
            try {
                const fd = new FormData();
                fd.append('image', pendingImageFile);
                const response = await fetch('/api/upload', { method: 'POST', body: fd });
                const result = await response.json();
                if (!result.success) {
                    alert('Error na subida da imaxe: ' + result.message);
                    setIsUploading(false);
                    return;
                }
                finalFormData.imagen = result.filename;
            } catch {
                alert('Error de conexión ao subir a imaxe.');
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        onSave({ ...finalFormData, _type: type });
        resetAndClose();
    };


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden border dark:border-zinc-700/80 transform transition-all animate-scale-in max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-start sm:items-center bg-gray-50/50 dark:bg-zinc-950/20 gap-2">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">
                            {initialData
                            ? `Editar ${type === 'insight' ? 'Insight' : type === 'articulo' ? 'Artigo' : 'Definición'}`
                            : step === 1 ? 'Que queres engadir?'
                            : `Novo ${type === 'insight' ? 'Insight' : type === 'articulo' ? 'Artigo' : 'Definición'}`}
                        </h2>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                            {initialData ? 'Modifica os campos necesarios para actualizar a información' : 'Define un novo elemento para a base de datos'}
                        </p>
                    </div>
                    <button
                        onClick={resetAndClose}
                        className="p-2.5 hover:bg-red-50 dark:hover:bg-red-950/25 hover:text-red-500 rounded-2xl transition-all text-gray-400 dark:text-zinc-500"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar flex-grow">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 items-stretch">
                            <button
                                onClick={() => handleNext('insight')}
                                className="group p-6 bg-blue-50/30 dark:bg-blue-950/10 border-2 border-blue-100/50 dark:border-blue-900/30 rounded-[2rem] hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all text-center flex flex-col items-center gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.674a1 1 0 00.922-.617l2.108-4.742A4 4 0 1013.337 5h-2.674a4 4 0 10-3.996 6.641l2.108 4.742a1 1 0 00.922.617z" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">Insight</h3>
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] font-black">Datos clave</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleNext('articulo')}
                                className="group p-6 bg-yellow-50/30 dark:bg-yellow-950/10 border-2 border-yellow-100/50 dark:border-yellow-900/30 rounded-[2rem] hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 transition-all text-center flex flex-col items-center gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">Artigo</h3>
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] font-black">Produto / Ref.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleNext('definicion')}
                                className="group p-6 bg-purple-50/30 dark:bg-purple-950/10 border-2 border-purple-100/50 dark:border-purple-900/30 rounded-[2rem] hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all text-center flex flex-col items-center gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">Definición</h3>
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] font-black">Conceptos clave</p>
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
                                        <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Artigos vinculados</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(formData.articulos_vinculados || []).map(artId => {
                                                const art = dbOptions.articulos.find(a => a.id_articulo === artId);
                                                return (
                                                    <div key={artId} className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/20 px-3 py-1.5 rounded-xl border border-yellow-100 dark:border-yellow-900/30 shadow-sm animate-in zoom-in duration-200">
                                                        <span className="text-[11px] font-bold text-yellow-700 dark:text-yellow-400">{art?.descripcion || `ID: ${artId}`}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    articulos_vinculados: (prev.articulos_vinculados || []).filter(id => id !== artId)
                                                                }));
                                                            }}
                                                            className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-900/30 hover:text-yellow-800 dark:hover:text-yellow-300 rounded-lg transition-colors text-yellow-400 dark:text-yellow-600"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <CustomSelect
                                            options={dbOptions.articulos
                                                .filter(a => !(formData.articulos_vinculados || []).includes(a.id_articulo))
                                                .map(a => ({ value: a.id_articulo, label: a.descripcion }))}
                                            value=""
                                            onChange={(val) => {
                                                const id = parseInt(val);
                                                if (id && !(formData.articulos_vinculados || []).includes(id)) {
                                                    setFormData(prev => ({ ...prev, articulos_vinculados: [...(prev.articulos_vinculados || []), id] }));
                                                }
                                            }}
                                            placeholder={isLoadingOptions ? "Cargando..." : "Engadir artigo..."}
                                            searchable={true}
                                        />
                                    </div>

                                    {/* Vinculación a Procesos */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Procesos vinculados</label>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(formData.procesos_vinculados || []).map(procId => {
                                                const proc = dbOptions.procesos.find(p => p.id_proceso === procId);
                                                return (
                                                    <div key={procId} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm animate-in zoom-in duration-200">
                                                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">{proc?.nombre || `ID: ${procId}`}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    procesos_vinculados: (prev.procesos_vinculados || []).filter(id => id !== procId)
                                                                }));
                                                            }}
                                                            className="p-1 hover:bg-blue-200 dark:hover:bg-blue-900/30 hover:text-blue-800 dark:hover:text-blue-300 rounded-lg transition-colors text-blue-400 dark:text-blue-650"
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
                                                                : 'bg-gray-50 dark:bg-zinc-950/40 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-500 dark:hover:text-blue-400'
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
                                            className="px-4 py-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all mb-0.5 disabled:opacity-50"
                                        >
                                            {isUploading ? '...' : 'Subir'}
                                        </button>
                                        {(pendingImagePreview || formData.imagen) && (
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 flex-shrink-0 mb-1 shadow-sm">
                                                <img
                                                    src={pendingImagePreview || getImgUrl(formData.imagen)}
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
                                        <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Familias vinculadas</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(formData.familias_vinculadas || []).map(famId => {
                                                const fam = dbOptions.familias.find(f => f.value === famId);
                                                return (
                                                    <div key={famId} className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/20 px-3 py-1.5 rounded-xl border border-purple-100 dark:border-purple-900/30 shadow-sm animate-in zoom-in duration-200">
                                                        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">{fam?.label || `ID: ${famId}`}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    familias_vinculadas: (prev.familias_vinculadas || []).filter(id => id !== famId)
                                                                }));
                                                            }}
                                                            className="p-1 hover:bg-purple-200 dark:hover:bg-purple-900/30 hover:text-purple-800 dark:hover:text-purple-300 rounded-lg transition-colors text-purple-400 dark:text-purple-600"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <CustomSelect
                                            options={dbOptions.familias.filter(f => !(formData.familias_vinculadas || []).includes(f.value))}
                                            value=""
                                            onChange={(val) => {
                                                const id = parseInt(val);
                                                if (id && !(formData.familias_vinculadas || []).includes(id)) {
                                                    setFormData(prev => ({ ...prev, familias_vinculadas: [...(prev.familias_vinculadas || []), id] }));
                                                }
                                            }}
                                            placeholder={isLoadingOptions ? "Cargando..." : "Vincular a unha familia..."}
                                        />
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
                            ) : type === 'articulo' ? (
                                <>
                                    <InputField label="Descrición / Nome do artigo" name="descripcion" placeholder="ex: Toldo cofre modelo XACOBEO 350" required={true} value={formData.descripcion} onChange={handleChange} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InputField label="Código" name="codigo" placeholder="ex: TOL-XAC-350" value={formData.codigo} onChange={handleChange} />
                                        <InputField label="Denominación proveedor" name="denominacion_proveedor" placeholder="ex: XACOBEO 350 COFRE" value={formData.denominacion_proveedor} onChange={handleChange} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <SelectField
                                            label="Familia"
                                            name="id_familia"
                                            value={formData.id_familia}
                                            onChange={handleChange}
                                            options={dbOptions.familias}
                                        />
                                        <div className="space-y-1.5 flex-grow">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Subfamilia</label>
                                            <input
                                                type="text"
                                                name="subfamilia"
                                                value={formData.subfamilia || ''}
                                                onChange={handleChange}
                                                list="subfamilias-list"
                                                placeholder="ex: Cofre"
                                                className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-yellow-50 dark:focus:ring-yellow-950/20 focus:border-yellow-400 dark:focus:border-yellow-500 transition-all outline-none text-sm text-gray-700 dark:text-zinc-100 placeholder:text-gray-350 dark:placeholder:text-zinc-500"
                                            />
                                            <datalist id="subfamilias-list">
                                                {dbOptions.subfamilias.map(s => <option key={s.value} value={s.value} />)}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* Características */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Características / Valores</label>
                                            <button
                                                type="button"
                                                onClick={addCaracteristica}
                                                className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                Engadir
                                            </button>
                                        </div>
                                        {(formData.caracteristicas || []).length === 0 ? (
                                            <p className="text-[12px] text-gray-400 dark:text-zinc-500 text-center py-4 bg-gray-50 dark:bg-zinc-950/20 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                                                Sen características. Preme <strong>+ Engadir</strong> para incluír valores.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {(formData.caracteristicas || []).map((car, idx) => (
                                                    <div key={idx} className="flex gap-2 items-start bg-gray-50 dark:bg-zinc-950/30 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 animate-in zoom-in duration-150">
                                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            <CustomSelect
                                                                options={dbOptions.caracteristicas.map(c => ({ value: c.id_caracteristica, label: c.caracteristica }))}
                                                                value={car.id_caracteristica || ''}
                                                                onChange={(val) => updateCaracteristica(idx, 'id_caracteristica', parseInt(val) || '')}
                                                                placeholder="Característica..."
                                                                compact={true}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={car.valor || ''}
                                                                onChange={(e) => updateCaracteristica(idx, 'valor', e.target.value)}
                                                                placeholder="Valor"
                                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-4 focus:ring-yellow-50 dark:focus:ring-yellow-950/20 focus:border-yellow-400 dark:focus:border-yellow-500 transition-all outline-none text-sm text-gray-700 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={car.comentarios || ''}
                                                                onChange={(e) => updateCaracteristica(idx, 'comentarios', e.target.value)}
                                                                placeholder="Comentarios (opcional)"
                                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-4 focus:ring-yellow-50 dark:focus:ring-yellow-950/20 focus:border-yellow-400 dark:focus:border-yellow-500 transition-all outline-none text-sm text-gray-700 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={car.norma || ''}
                                                                onChange={(e) => updateCaracteristica(idx, 'norma', e.target.value)}
                                                                placeholder="Norma (opcional)"
                                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-4 focus:ring-yellow-50 dark:focus:ring-yellow-950/20 focus:border-yellow-400 dark:focus:border-yellow-500 transition-all outline-none text-sm text-gray-700 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCaracteristica(idx)}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-colors text-gray-400 dark:text-zinc-500 mt-1 flex-shrink-0"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Insights vinculados */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Insights vinculados</label>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-1">
                                            {(formData.insights_vinculados || []).map(insId => {
                                                const ins = dbOptions.insights.find(i => i.id_insight === insId);
                                                return (
                                                    <div key={insId} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm animate-in zoom-in duration-200">
                                                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 max-w-[200px] truncate">{ins?.titulo || `ID: ${insId}`}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, insights_vinculados: (prev.insights_vinculados || []).filter(id => id !== insId) }))}
                                                            className="p-1 hover:bg-blue-200 dark:hover:bg-blue-900/30 hover:text-blue-800 dark:hover:text-blue-300 rounded-lg transition-colors text-blue-400 dark:text-blue-600"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <CustomSelect
                                            options={dbOptions.insights
                                                .filter(i => !(formData.insights_vinculados || []).includes(i.id_insight))
                                                .map(i => ({ value: i.id_insight, label: i.titulo }))}
                                            value=""
                                            onChange={(val) => {
                                                const id = parseInt(val);
                                                if (id && !(formData.insights_vinculados || []).includes(id)) {
                                                    setFormData(prev => ({ ...prev, insights_vinculados: [...(prev.insights_vinculados || []), id] }));
                                                }
                                            }}
                                            placeholder={isLoadingOptions ? "Cargando..." : "Vincular insight..."}
                                            searchable={true}
                                        />
                                    </div>

                                    {initialData && (
                                        <TextAreaField
                                            label="Motivo da edición (Auditoría)"
                                            name="resumen_edicion"
                                            placeholder="Por que estás editando este artigo?"
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
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*"
                />

                {step === 2 && (
                    <div className="px-5 sm:px-8 py-4 sm:py-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center bg-gray-50/30 dark:bg-zinc-950/20 gap-4">
                        <div className="flex justify-center sm:justify-start items-center gap-4">
                            {!initialData && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-2 px-6 py-3 text-gray-500 dark:text-zinc-400 font-bold hover:text-gray-900 dark:hover:text-zinc-200 transition-colors"
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
                                        <div className="flex flex-col gap-2 bg-red-50 dark:bg-red-950/20 p-3 rounded-2xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-left-2 transition-all w-full sm:w-64">
                                            <label className="text-[10px] font-black uppercase text-red-800 dark:text-red-400 tracking-widest ml-1">Motivo do borrado:</label>
                                            <textarea
                                                autoFocus
                                                value={deleteReason}
                                                onChange={(e) => setDeleteReason(e.target.value)}
                                                placeholder="Xustificación obrigat..."
                                                className="w-full text-xs p-2 rounded-xl border border-red-200 dark:border-red-900/40 outline-none focus:border-red-400 resize-none h-16 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-100 placeholder-red-300 dark:placeholder-red-800/60"
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
                                                    className="flex-1 py-2 text-[10px] font-bold text-red-400 dark:text-red-450 hover:text-red-600 dark:hover:text-red-300 uppercase tracking-widest"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="flex items-center gap-2 px-6 py-3 text-red-400 dark:text-red-450 font-bold hover:text-red-600 dark:hover:text-red-350 transition-colors"
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
                            className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-2xl shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
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
