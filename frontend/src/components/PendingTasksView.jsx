import React, { useState, useEffect } from 'react';

function PendingTasksView({ onClose, onRefresh, showToast, askConfirm }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

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
    const actionText = action === 'approve' ? 'aprobar' : 'rexeitar';
    
    askConfirm(
      `${action === 'approve' ? 'Aprobar' : 'Rexeitar'} cambio`,
      `Estás seguro de que queres ${actionText} este cambio en "${task.titulo || 'Sen título'}"?`,
      async () => {
        try {
          const res = await fetch(`/api/approve-task/${task.ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
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

  const formatDiff = (diffStr) => {
    if (!diffStr) return null;
    try {
      const diff = typeof diffStr === 'string' ? JSON.parse(diffStr) : diffStr;
      return (
        <div className="space-y-2 mt-4 text-[11px] sm:text-xs">
          {Object.keys(diff).map(key => {
            if (key.startsWith('_')) return null;
            const label = key.replace(/_/g, ' ').toUpperCase();
            const val = diff[key];
            if (val === null || val === undefined) return null;
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                <span className="font-black text-gray-400 min-w-[120px] uppercase tracking-tighter">{label}:</span>
                <span className="text-gray-700 font-medium break-words leading-relaxed">{String(val)}</span>
              </div>
            );
          })}
        </div>
      );
    } catch (e) { return <p className="text-xs text-gray-500 italic mt-2">{String(diffStr)}</p>; }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-12 h-12 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Cargando tarefas...</p>
    </div>
  );

  return (
    <div className="animate-reveal">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Tarefas Pendentes</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Sistema de aprobación "Catro Ollos"</p>
        </div>
        <button onClick={onClose} className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-gray-900 transition-all hover:shadow-sm">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-16 text-center border border-dashed border-gray-200 shadow-sm animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-gray-500 font-bold text-lg">Todo ao día!</p>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-black text-[9px]">Non hai cambios pendentes de revisión</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:gap-8">
          {tasks.map((task) => {
             const canApprove = currentUser && (currentUser.username !== task.editor);
             return (
              <div key={task.ID} className="premium-card group bg-white border border-gray-100 rounded-[2rem] p-6 sm:p-8 hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        task.operation === 'CREATE' ? 'bg-green-100 text-green-700' :
                        task.operation === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {task.operation === 'CREATE' ? 'Creación' : task.operation === 'UPDATE' ? 'Edición' : 'Borrado'}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {task.type === 'definicion' ? 'Definición' : 'Insight'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold ml-auto">{new Date(task.date || Date.now()).toLocaleDateString()}</span>
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-yellow-600 transition-colors capitalize">{task.titulo || 'Sen título'}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-tight mb-6">
                      <div className="w-5 h-5 bg-yellow-400 rounded-lg flex items-center justify-center text-[9px] text-black font-black">
                        {task.editor ? task.editor[0].toUpperCase() : 'U'}
                      </div>
                      Solicitado por <span className="text-gray-800">{task.editor || 'Usuario'}</span>
                    </div>
                    
                    <div className="bg-gray-50/30 rounded-2xl p-4 sm:p-6 border border-gray-100/50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Detalles do cambio</p>
                      {formatDiff(task.change || task.comentario_cambio)}
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col gap-3 flex-shrink-0 mt-4 sm:mt-0">
                    <button 
                      onClick={() => handleAction(task, 'approve')}
                      disabled={!canApprove}
                      className={`flex-1 sm:w-16 h-12 sm:h-16 flex items-center justify-center rounded-2xl shadow-lg transition-all active:scale-95 group/btn ${
                        canApprove ? 'bg-[#8c6508] text-white shadow-[#8c6508]/20 hover:bg-[#b08b3a] hover:-translate-y-1' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      }`}
                      title={canApprove ? "Aprobar" : "Non podes aprobar o teu propio cambio"}
                    >
                      <svg className="w-6 h-6 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button 
                      onClick={() => handleAction(task, 'reject')}
                      className="flex-1 sm:w-16 h-12 sm:h-16 flex items-center justify-center bg-white border-2 border-red-50 text-red-400 rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95 group/btn"
                      title="Rexeitar"
                    >
                      <svg className="w-6 h-6 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
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
