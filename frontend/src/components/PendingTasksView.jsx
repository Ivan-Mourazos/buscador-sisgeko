import React, { useState, useEffect } from 'react';

// ─── Etiquetas legibles por tipo ────────────────────────────────────────────
const FIELD_LABELS = {
  // Insight
  titulo:                    'Título',
  insight:                   'Contido',
  origen_informacion:        'Fonte de referencia',
  detalle_origen_informacion:'Nota adicional',
  tipo_origen_nombre:        'Tipoloxía',
  procesos_lista:            'Procesos',
  // Definición
  definicion:                'Definición',
  familias_lista:            'Familias vinculadas',
  // Artigo
  descripcion:               'Descrición / Nome',
  codigo:                    'Código',
  denominacion_proveedor:    'Denominación provedor',
  subfamilia:                'Subfamilia',
  familia_codigo:            'Familia (código)',
  familia_descripcion:       'Familia (nome)',
};

// Campos a comparar por tipo
const DIFF_FIELDS = {
  insight:   ['titulo', 'insight', 'origen_informacion', 'detalle_origen_informacion', 'procesos_lista'],
  definicion:['titulo', 'definicion', 'familias_lista'],
  articulo:  ['descripcion', 'codigo', 'denominacion_proveedor', 'subfamilia', 'familia_codigo', 'familia_descripcion'],
};

// Truncar texto largo
const truncate = (str, max = 280) => {
  if (!str || typeof str !== 'string') return str;
  return str.length > max ? str.slice(0, max) + '…' : str;
};

// ─── Componente diff campo a campo ──────────────────────────────────────────
function FieldDiff({ field, oldVal, newVal, procesosMap }) {
  const label = FIELD_LABELS[field] || field.replace(/_/g, ' ');

  // Resolver IDs de procesos a nomes
  const resolveVal = (v) => {
    if (field === 'procesos_lista' && procesosMap && v) {
      const ids = String(v).split(',').map(s => s.trim()).filter(Boolean);
      const allNums = ids.every(id => !isNaN(id));
      if (allNums) return ids.map(id => procesosMap[id] || id).join(', ');
    }
    return v;
  };

  const displayOld = resolveVal(oldVal);
  const displayNew = resolveVal(newVal);
  const changed = String(displayOld ?? '') !== String(displayNew ?? '');
  if (!changed && !displayNew) return null;

  const isLong = (v) => v && String(v).length > 120;

  return (
    <div className={`rounded-xl border text-[11px] overflow-hidden ${
      changed
        ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/10'
        : 'border-gray-100 dark:border-zinc-800/60 bg-gray-50/30 dark:bg-zinc-800/20'
    }`}>
      <div className="px-3 py-1.5 border-b border-inherit flex items-center gap-1.5">
        <span className="font-black uppercase tracking-widest text-[9px] text-gray-400 dark:text-zinc-500">{label}</span>
        {changed && (
          <span className="ml-auto px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded text-[8px] font-black uppercase tracking-widest">
            Cambiado
          </span>
        )}
      </div>
      {changed ? (
        <div className={`grid ${isLong(displayOld) || isLong(displayNew) ? 'grid-cols-1' : 'grid-cols-2'} divide-x divide-inherit`}>
          <div className="px-3 py-2">
            <span className="block text-[8px] font-black uppercase tracking-widest text-red-400 dark:text-red-500 mb-1">Antes</span>
            <p className="text-red-700 dark:text-red-400 line-through opacity-70 leading-relaxed break-words">
              {truncate(String(displayOld ?? '—'))}
            </p>
          </div>
          <div className="px-3 py-2">
            <span className="block text-[8px] font-black uppercase tracking-widest text-green-500 dark:text-green-400 mb-1">Agora</span>
            <p className="text-green-700 dark:text-green-400 font-medium leading-relaxed break-words">
              {truncate(String(displayNew ?? '—'))}
            </p>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2">
          <p className="text-gray-600 dark:text-zinc-300 font-medium leading-relaxed break-words">
            {truncate(String(displayNew ?? '—'))}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Panel de detalles expandible ───────────────────────────────────────────
function TaskDetails({ task, procesosMap }) {
  const { operation, _type, _newData = {}, _current } = task;

  // Para CREATE: mostrar campos principales del nuevo elemento
  if (operation === 'CREATE') {
    const previewField = _type === 'articulo' ? 'descripcion' : _type === 'definicion' ? 'definicion' : 'insight';
    const previewText = _newData[previewField];
    const resumen = _newData.resumen_edicion;

    return (
      <div className="space-y-3 mt-4">
        {resumen && (
          <div className="flex gap-2 p-3 bg-blue-50/40 dark:bg-blue-950/15 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <svg className="w-3.5 h-3.5 text-blue-400 dark:text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="block text-[8px] font-black uppercase tracking-widest text-blue-400 dark:text-blue-500 mb-0.5">Motivo</span>
              <p className="text-blue-800 dark:text-blue-300 text-[11px] font-medium leading-relaxed">{resumen}</p>
            </div>
          </div>
        )}
        {previewText && (
          <div className="p-3 bg-gray-50/50 dark:bg-zinc-800/30 rounded-xl border border-gray-100 dark:border-zinc-800/60">
            <span className="block text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1">
              {_type === 'articulo' ? 'Descrición' : _type === 'definicion' ? 'Definición' : 'Contido'}
            </span>
            <p className="text-gray-700 dark:text-zinc-300 text-[11px] leading-relaxed">
              {truncate(previewText, 400)}
            </p>
          </div>
        )}
        {/* Metadatos: chips en flex-wrap (nunca deixa oco baleiro) */}
        {(() => {
          const chips = [];
          if (_type === 'articulo') {
            if (_newData.descripcion)              chips.push({ label: 'Descrición / Nome',        val: _newData.descripcion });
            if (_newData.codigo)                   chips.push({ label: 'Código',                   val: _newData.codigo });
            if (_newData.denominacion_proveedor)   chips.push({ label: 'Denominación provedor',    val: _newData.denominacion_proveedor });
            if (_newData.subfamilia)               chips.push({ label: 'Subfamilia',                val: _newData.subfamilia });
          }
          if (_type === 'insight') {
            if (_newData.origen_informacion)         chips.push({ label: 'Fonte de referencia', val: _newData.origen_informacion });
            if (_newData.detalle_origen_informacion)  chips.push({ label: 'Nota adicional',      val: _newData.detalle_origen_informacion });
            if (_newData.tipo_origen_nombre)          chips.push({ label: 'Tipoloxía',          val: _newData.tipo_origen_nombre });
            // procesos: pode vir como string (procesos_lista) ou como array (procesos_vinculados)
            const procsRaw = _newData.procesos_lista
              || (Array.isArray(_newData.procesos_vinculados) && _newData.procesos_vinculados.length > 0
                  ? _newData.procesos_vinculados.join(', ')
                  : null);
            // Resolver IDs a nomes si procesosMap dispoñible
            const procsText = procsRaw && procesosMap
              ? procsRaw.split(',').map(s => s.trim()).map(id => (!isNaN(id) ? (procesosMap[id] || id) : id)).join(', ')
              : procsRaw;
            if (procsText)                           chips.push({ label: 'Procesos',            val: procsText });
          }
          if (_type === 'definicion') {
            if (_newData.familias_lista)            chips.push({ label: 'Familias',   val: _newData.familias_lista });
          }
          if (chips.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-2">
              {chips.map(({ label, val }) => (
                <div key={label} className="flex-1 min-w-[140px] p-2.5 bg-gray-50/50 dark:bg-zinc-800/30 rounded-xl border border-gray-100 dark:border-zinc-800/60">
                  <span className="block text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-0.5">{label}</span>
                  <p className="text-gray-700 dark:text-zinc-300 text-[11px] font-medium break-words">{val}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    );
  }

  // Para DELETE: aviso claro
  if (operation === 'DELETE') {
    return (
      <div className="mt-4 flex items-start gap-3 p-4 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/40">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">Solicitude de eliminación</p>
          <p className="text-red-700 dark:text-red-300 text-xs font-medium">
            Aprobar eliminará permanentemente este rexistro da base de datos. Esta acción non se pode deshacer.
          </p>
        </div>
      </div>
    );
  }

  // Para UPDATE: diff campo a campo
  const fields = DIFF_FIELDS[_type] || [];
  const resumen = _newData.resumen_edicion;

  // Mapear valores actuais do artigo (los campos de _current pueden tener nombres distintos)
  const getCurrentVal = (field) => {
    if (!_current) return null;
    return _current[field] ?? null;
  };

  const getNewVal = (field) => {
    // Para artigos, el campo descripcion está en _newData.descripcion
    return _newData[field] ?? null;
  };

  const hasChanges = fields.some(f => String(getCurrentVal(f) ?? '') !== String(getNewVal(f) ?? '') && getNewVal(f) !== null);

  return (
    <div className="space-y-3 mt-4">
      {resumen && (
        <div className="flex gap-2 p-3 bg-blue-50/40 dark:bg-blue-950/15 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <svg className="w-3.5 h-3.5 text-blue-400 dark:text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="block text-[8px] font-black uppercase tracking-widest text-blue-400 dark:text-blue-500 mb-0.5">Motivo do cambio</span>
            <p className="text-blue-800 dark:text-blue-300 text-[11px] font-medium leading-relaxed">{resumen}</p>
          </div>
        </div>
      )}

      {!_current && !resumen && (
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 italic text-center py-2">
          Non hai información detallada dispoñible para este cambio.
        </p>
      )}

      {hasChanges || _current ? (
        <div className="space-y-2">
          {_current && (
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
              Campos modificados:
            </p>
          )}
          {fields.map(field => {
            const oldVal = getCurrentVal(field);
            const newVal = getNewVal(field);
            if (newVal === null && oldVal === null) return null;
            return (
              <FieldDiff
                key={field}
                field={field}
                oldVal={oldVal}
                newVal={newVal}
                procesosMap={procesosMap}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
function PendingTasksView({ onClose, onRefresh, showToast, askConfirm, onOpenItem }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [rejectTask, setRejectTask] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [procesosMap, setProcesosMap] = useState({});  // id -> nome

  // Cargar mapa de procesos para resolver IDs a nomes
  useEffect(() => {
    fetch('/api/form-options', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.procesos) {
          const map = {};
          d.procesos.forEach(p => { map[String(p.id_proceso)] = p.nombre; });
          setProcesosMap(map);
        }
      })
      .catch(() => {});
  }, []);

  const fetchPendingTasks = async () => {
    const storedUser = localStorage.getItem('sisgeko_user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    setLoading(true);
    try {
      const res = await fetch(`/api/pending-tasks?t=${new Date().getTime()}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setTasks(data.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingTasks(); }, []);

  const toggleExpanded = (taskId) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  const handleAction = async (task, action) => {
    if (action === 'reject') {
      setRejectTask(task.ID);
      setRejectReason('');
      return;
    }
    askConfirm(
      'Aprobar cambio',
      `Estás seguro de que queres aprobar este cambio en "${task.titulo || 'Sen título'}"?`,
      async () => {
        try {
          const res = await fetch(`/api/pending-tasks/${task._type}/${task.ID}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          const data = await res.json();
          if (data.success) { showToast(data.message); onRefresh(); fetchPendingTasks(); }
          else showToast(data.message, 'error');
        } catch (err) { showToast("Erro de conexión", 'error'); }
      }
    );
  };

  const confirmReject = async (task) => {
    if (!rejectReason || rejectReason.trim().length < 5) {
      showToast("O motivo de rexeitamento debe ter polo menos 5 caracteres", "error");
      return;
    }
    try {
      const res = await fetch(`/api/pending-tasks/${task._type}/${task.ID}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); setRejectTask(null); onRefresh(); fetchPendingTasks(); }
      else showToast(data.message, 'error');
    } catch (err) { showToast("Erro de conexión", 'error'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-12 h-12 border-4 border-yellow-100 dark:border-yellow-950/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest text-[10px]">Cargando tarefas...</p>
    </div>
  );

  return (
    <div className="animate-reveal">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Tarefas Pendentes</h2>
          <p className="text-gray-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Sistema de aprobación "Catro Ollos"</p>
        </div>
        <button onClick={onClose} className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-250 transition-all hover:shadow-sm">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-16 text-center border border-dashed border-gray-200 dark:border-zinc-800 shadow-sm animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-gray-500 dark:text-zinc-400 font-bold text-lg">Todo ao día!</p>
          <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1 uppercase tracking-widest font-black text-[9px]">Non hai cambios pendentes de revisión</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:gap-8">
          {tasks.map((task) => {
            const canApprove = currentUser && (currentUser.username !== task.editor);
            const isExpanded = expandedTasks.has(task.ID);
            const typeLabel = task._type === 'definicion' ? 'Definición' : task._type === 'insight' ? 'Insight' : 'Artigo';

            return (
              <div key={task.ID} className="premium-card group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-4">
                {/* Card body */}
                <div className="p-6 sm:p-8">
                  {/* Header badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      task.operation === 'CREATE' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                      task.operation === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                      'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    }`}>
                      {task.operation === 'CREATE' ? 'Creación' : task.operation === 'UPDATE' ? 'Edición' : 'Borrado'}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {typeLabel}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold ml-auto">
                      {new Date(task.fecha_cambio || task.date || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Título + botón ver actual */}
                  <div className="flex items-start gap-3 mb-3">
                    <h3 className="flex-grow text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors capitalize">
                      {task.titulo || 'Sen título'}
                    </h3>
                    {onOpenItem && (() => {
                      const realId = task._type === 'definicion' ? task.id_definicion : task._type === 'insight' ? task.id_insight : task.id_articulo;
                      if (!realId || realId <= 0) return null;
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const itemObj = {
                              _type: task._type,
                              ...(task._type === 'definicion' ? { id_definicion: realId } : task._type === 'insight' ? { id_insight: realId } : { id_articulo: realId })
                            };
                            onOpenItem(itemObj);
                          }}
                          title="Ver rexistro actual na BD"
                          className="flex-shrink-0 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-400 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      );
                    })()}
                  </div>

                  {/* Editor */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-tight mb-4">
                    <div className="w-5 h-5 bg-yellow-400 rounded-lg flex items-center justify-center text-[9px] text-black font-black">
                      {task.editor ? task.editor[0].toUpperCase() : 'U'}
                    </div>
                    Solicitado por <span className="text-gray-800 dark:text-zinc-200">{task.editor || 'Usuario'}</span>
                  </div>

                  {/* Botón expandir detalles */}
                  <button
                    onClick={() => toggleExpanded(task.ID)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      isExpanded
                        ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/40 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {isExpanded ? 'Agochar detalles' : 'Ver detalles do cambio'}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Panel expandible */}
                  {isExpanded && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                      <TaskDetails task={task} procesosMap={procesosMap} />
                    </div>
                  )}

                  {/* Textarea rexeitamento */}
                  {rejectTask === task.ID && (
                    <div className="mt-4 flex flex-col gap-2 bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-bottom-2">
                      <label className="text-[9px] font-black uppercase text-red-800 dark:text-red-400 tracking-widest">Motivo do rexeitamento (obrigatorio):</label>
                      <textarea
                        autoFocus
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Por que rexeitas este cambio?"
                        className="w-full text-xs p-3 rounded-xl border border-red-200 dark:border-red-900/40 outline-none focus:border-red-400 resize-none h-20 bg-white dark:bg-zinc-900 dark:text-zinc-200"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRejectTask(null)}
                          className="flex-1 py-2.5 text-[10px] font-bold text-red-400 hover:text-red-600 dark:hover:text-red-300 uppercase tracking-widest transition-colors border border-red-200 dark:border-red-900/40 rounded-xl"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => confirmReject(task)}
                          className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95"
                        >
                          Confirmar rexeitamento
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action footer */}
                <div className="border-t border-gray-100 dark:border-zinc-800 px-6 sm:px-8 py-4 bg-gray-50/50 dark:bg-zinc-950/20 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleAction(task, 'approve')}
                    disabled={!canApprove || rejectTask === task.ID}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 ${
                      canApprove && rejectTask !== task.ID
                        ? 'bg-[#8c6508] text-white shadow-lg shadow-[#8c6508]/20 hover:bg-[#b08b3a] hover:-translate-y-0.5'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-300 dark:text-zinc-600 cursor-not-allowed'
                    }`}
                    title={canApprove ? 'Aprobar cambio' : 'Non podes aprobar o teu propio cambio'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    {canApprove ? 'Aprobar cambio' : 'Non podes aprobar o propio'}
                  </button>
                  <button
                    onClick={() => handleAction(task, 'reject')}
                    disabled={rejectTask === task.ID}
                    className="flex-1 sm:flex-none sm:w-48 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 border-red-100 dark:border-red-900/40 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-800/50 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    Rexeitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PendingTasksView;
