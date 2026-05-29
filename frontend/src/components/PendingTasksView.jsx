import React, { useState, useEffect } from 'react';

function PendingTasksView({ onClose, onRefresh, showToast, askConfirm, onOpenItem }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [rejectTask, setRejectTask] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingTasks = async () => {
    // Recuperar usuario actual
    const storedUser = localStorage.getItem('sisgeko_user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    
    setLoading(true);
    try {
      const res = await fetch(`/api/pending-tasks?t=${new Date().getTime()}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTasks();
  }, []);

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
          if (data.success) {
            showToast(data.message);
            onRefresh();
            fetchPendingTasks();
          } else {
            showToast(data.message, 'error');
          }
        } catch (err) {
          showToast("Erro de conexión", 'error');
        }
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
      if (data.success) {
        showToast(data.message);
        setRejectTask(null);
        onRefresh();
        fetchPendingTasks();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast("Erro de conexión", 'error');
    }
  };

  const formatDiff = (diffStr) => {
    if (!diffStr) return null;
    try {
      const diff = typeof diffStr === 'string' ? JSON.parse(diffStr) : diffStr;
      const ignoredKeys = ['id_insight', 'id_definicion', 'activo', 'eliminado', 'id_tipo_origen', 'procesos_lista', 'familias_lista', 'id_articulo'];
      return (
        <div className="space-y-2 mt-4 text-[11px] sm:text-xs">
          {Object.keys(diff).map(key => {
            if (key.startsWith('_') || ignoredKeys.includes(key)) return null;
            const label = key.replace(/_/g, ' ').toUpperCase();
            const val = diff[key];
            if (val === null || val === undefined) return null;
            let displayVal = String(val);
            if (Array.isArray(val)) {
              if (val.length === 0) return null;
              displayVal = val.join(', ');
            }
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 p-3 bg-gray-50/50 dark:bg-zinc-800/40 rounded-xl border border-gray-100 dark:border-zinc-800">
                <span className="font-black text-gray-400 dark:text-zinc-500 min-w-[120px] uppercase tracking-tighter">{label}:</span>
                <span className="text-gray-700 dark:text-zinc-300 font-medium break-words leading-relaxed">{displayVal}</span>
              </div>
            );
          })}
        </div>
      );
    } catch (e) { return <p className="text-xs text-gray-500 dark:text-zinc-400 italic mt-2">{String(diffStr)}</p>; }
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
             return (
              <div key={task.ID} className="premium-card group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-4">
                {/* Card body */}
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      task.operation === 'CREATE' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                      task.operation === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                      'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    }`}>
                      {task.operation === 'CREATE' ? 'Creación' : task.operation === 'UPDATE' ? 'Edición' : 'Borrado'}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {task.type === 'definicion' ? 'Definición' : 'Insight'}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold ml-auto">{new Date(task.date || Date.now()).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="flex-grow text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors capitalize">{task.titulo || 'Sen título'}</h3>
                    {onOpenItem && (() => {
                      const realId = task._type === 'definicion' ? task.id_definicion : task.id_insight;
                      if (!realId || realId <= 0) return null;
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const itemObj = {
                              _type: task._type,
                              ...(task._type === 'definicion'
                                ? { id_definicion: realId }
                                : { id_insight: realId }
                              )
                            };
                            onOpenItem(itemObj);
                          }}
                          title="Ver rexistro actual"
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

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-tight mb-4">
                    <div className="w-5 h-5 bg-yellow-400 rounded-lg flex items-center justify-center text-[9px] text-black font-black">
                      {task.editor ? task.editor[0].toUpperCase() : 'U'}
                    </div>
                    Solicitado por <span className="text-gray-800 dark:text-zinc-200">{task.editor || 'Usuario'}</span>
                  </div>

                  {task.comentario_cambio && (() => {
                    let descripcion = task.comentario_cambio;
                    try {
                      const parsed = typeof task.comentario_cambio === 'string'
                        ? JSON.parse(task.comentario_cambio)
                        : task.comentario_cambio;
                      descripcion = parsed.resumen_edicion || parsed.comentario || parsed.motivo || null;
                    } catch (e) { /* usar el string original si no es JSON */ }
                    if (!descripcion) return null;
                    return (
                      <div className="bg-yellow-50/20 dark:bg-yellow-950/10 rounded-2xl p-4 border border-yellow-100 dark:border-yellow-900/30 text-xs text-yellow-800 dark:text-yellow-400 font-medium">
                        <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Descrición do cambio:</span>
                        {descripcion}
                      </div>
                    );
                  })()}

                  {/* Reject textarea inline */}
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
