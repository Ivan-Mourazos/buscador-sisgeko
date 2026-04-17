import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import SidebarFilters from './components/SidebarFilters';
import { ResultCard } from './components/ResultCard';
import DetailsModal from './components/DetailsModal';
import LoginModal from './components/LoginModal';
import CreateItemModal from './components/CreateItemModal';
import CategorySelector from './components/CategorySelector';
import PendingTasksView from './components/PendingTasksView';
import HistoryView from './components/HistoryView';
import ActivityLogView from './components/ActivityLogView';

function App() {
// ... resto de estados ...
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ familias: [], subfamilias: [], procesos: [], tipo_origen: [], categories: [] });
  const [facets, setFacets] = useState({ 
    categories: [
      { id: 'insight', nombre: 'Insights', count: 0 },
      { id: 'definicion', nombre: 'Definicións', count: 0 },
      { id: 'articulo', nombre: 'Artigos', count: 0 }
    ], 
    familias: [], 
    subfamilias: [], 
    procesos: [], 
    tipo_origen: [] 
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Auth State
  const [user, setUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState('hero');
  const [currentView, setCurrentView] = useState('search'); // 'search', 'pending', 'history'
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const searchInputRef = useRef(null);
  const detailsCache = useRef(new Map());
  const [toast, setToast] = useState(null);
  const [confirmData, setConfirmData] = useState(null); // { title: '', message: '', onConfirm: () => {} }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const askConfirm = (title, message, onConfirm) => {
    setConfirmData({ title, message, onConfirm });
  };

  // Validar sesión
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem('sisgeko_user');
          setUser(null);
        }
      } catch (e) {
        const savedUser = localStorage.getItem('sisgeko_user');
        if (savedUser) setUser(JSON.parse(savedUser));
      }
    };
    checkSession();

    // Búsqueda inicial para poblar facetas y conteos del Hero
    fetchResults('', filters);

    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPendingCount = useCallback(async () => {
    if (user && user.role === 'editor') {
      try {
        const res = await fetch('/api/pending-count');
        const data = await res.json();
        if (data.success) setPendingCount(data.count);
      } catch (e) {}
    }
  }, [user]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount, currentView]);

  const hasActiveFilters = query.trim() !== '' || Object.values(filters).some(arr => arr.length > 0);
  const showHero = viewMode === 'hero' && currentView === 'search';

  useEffect(() => {
    if (!showHero && query.trim() !== '' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showHero, query]);

  useEffect(() => {
    if ((query.trim() !== '' || filters.categories.length > 0) && currentView === 'search') {
      setViewMode('results');
    }
  }, [query, filters.categories, currentView]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('sisgeko_user', JSON.stringify(userData));
    setIsLoginModalOpen(false);
  };

  const handleLogout = async () => {
    try { await fetch('/api/logout', { method: 'POST' }); } catch (e) {}
    setUser(null);
    localStorage.removeItem('sisgeko_user');
    setCurrentView('search');
  };

  const fetchResults = async (q, f) => {
    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, filters: f })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setFacets(data.facets);
      }
    } catch (err) {
      setError("Error ao conectar co servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setCurrentView('search');
    fetchResults(query, filters);
  };

  const handleCategorySelect = (catId) => {
    // Al cambiar de categoría principal, limpiamos los filtros específicos de otras categorías
    const newFilters = { 
      familias: [], 
      subfamilias: [], 
      procesos: [], 
      tipo_origen: [], 
      categories: [catId] 
    };
    setFilters(newFilters);
    setViewMode('results');
    setCurrentView('search');
    fetchResults(query, newFilters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchResults(query, newFilters);
  };

  const handleSaveItem = async (newItem) => {
    try {
      const typeKey = newItem._type === 'definicion' ? 'definiciones' : newItem._type + 's';
      const idKey = newItem._type === 'definicion' ? 'id_definicion' : `id_${newItem._type}`;
      const isUpdate = !!newItem[idKey] && newItem[idKey] > 0;
      const id = newItem[idKey];
      
      const url = isUpdate ? `/api/${typeKey}/${id}` : `/api/${typeKey}`;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
        credentials: 'include' // IMPORTANTE: Enviar cookies de sesión
      });
      const data = await res.json();
      
      if(data.success) {
        showToast(data.message, 'success');
        setEditingItem(null);
        setIsCreateModalOpen(false);
        fetchResults(query, filters);
        fetchPendingCount();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast("Error de conexión co servidor", 'error');
    }
  };

  const clearAll = () => {
    const defaultFilters = { familias: [], subfamilias: [], procesos: [], tipo_origen: [], categories: [] };
    setFilters(defaultFilters);
    fetchResults(query, defaultFilters);
    setQuery('');
    setViewMode('hero');
    setCurrentView('search');
    setResults([]);
  };

  const goHome = () => {
    clearAll();
  };

  const handleSelectItem = async (item) => {
    setSelectedItem(item);
    setItemDetails(null);
    setDetailsLoading(true);
    try {
      const type = item._type === 'definicion' ? 'definiciones' : item._type + 's';
      const id = item.id_articulo || item.id_insight || item.id_definicion;
      if (!id) throw new Error("ID non atopado");
      const res = await fetch(`/api/${type}/${id}`);
      const data = await res.json();
      if (data.success) setItemDetails(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      const typeKey = item._type === 'definicion' ? 'definiciones' : 'insights';
      const idKey = item._type === 'definicion' ? 'id_definicion' : `id_${item._type}`;
      const id = item[idKey];
      
      if (!id) {
        showToast("Non se pode borrar un rexistro que aínda non foi gardado ou aprobado", 'info');
        setIsCreateModalOpen(false);
        return;
      }

      const titulo = encodeURIComponent(item.titulo || '');

      const res = await fetch(`/api/${typeKey}/${id}?titulo=${titulo}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchPendingCount();
        setIsCreateModalOpen(false);
        setEditingItem(null);
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast("Error de conexión co servidor", 'error');
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setSelectedItem(null);
    setIsCreateModalOpen(true);
  };

  const displayResults = results;

  return (
    <div className="min-h-screen bg-gray-50/30 text-gray-800 font-sans selection:bg-yellow-100 overflow-x-hidden">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-5 flex flex-wrap md:flex-nowrap gap-4 md:gap-8 items-center justify-between">
          <div onClick={goHome} className="flex items-center justify-start cursor-pointer group order-1 flex-shrink-0 z-10 w-auto">
             <img src="/Logosisgekotgm.png" alt="SISGEKO" className="h-10 md:h-14 w-auto object-contain scale-[2.4] md:scale-[2.2] origin-left transition-transform duration-300 ml-4 md:ml-0" />
          </div>

          <form onSubmit={handleSearch} className={`w-full md:w-[32rem] order-3 md:order-2 flex-grow md:flex-grow-0 relative group transition-all duration-700 ${showHero || currentView === 'pending' ? 'hidden md:block opacity-0 scale-95 pointer-events-none -translate-y-2' : 'block opacity-100 scale-100 translate-y-0 mt-5 md:mt-0'}`}>
            <input 
              ref={searchInputRef}
              type="text" 
              className="w-full pl-6 pr-14 py-3 md:py-3.5 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-[15px] text-gray-700"
              placeholder="Procurar termo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-1.5 top-1.5 p-2 md:p-2.5 bg-yellow-500 rounded-full text-white shadow-lg shadow-yellow-500/20 hover:bg-yellow-600 active:scale-90 transition-all">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>

          <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-4 flex-nowrap order-2 md:order-3">
            {user && (user.rol === 'admin' || user.rol === 'editor' || user.role === 'admin' || user.role === 'editor' || user.username === 'ivan') && (
              <div className="flex items-center bg-gray-100/50 p-1 rounded-2xl border border-gray-200/50 mr-2">
                <button 
                  onClick={() => { setViewMode('results'); setCurrentView('pending'); }} 
                  className={`relative px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${currentView === 'pending' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Pendentes
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white animate-in zoom-in duration-300">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button onClick={() => { setViewMode('results'); setCurrentView('history'); }} className={`px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${currentView === 'history' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Historial</button>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {(user.rol === 'admin' || user.rol === 'editor' || user.role === 'admin' || user.role === 'editor' || user.username === 'ivan') && (
                  <button onClick={() => { setEditingItem(null); setIsCreateModalOpen(true); }} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-lg shadow-yellow-400/20 active:scale-95 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    <span className="hidden sm:inline">Novo</span>
                  </button>
                )}
                <div className="flex items-center gap-2 border-l border-gray-100 pl-2 sm:pl-4">
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{user.rol || user.role}</span>
                    <span className="text-[11px] sm:text-xs font-bold text-gray-900">{user.username || user.name || 'Usuario'}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer" title="Saír">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-1.5 px-4 sm:px-6 py-2 bg-white border border-gray-200 rounded-full text-[11px] sm:text-[13px] font-bold text-gray-600 hover:border-yellow-500 transition-all cursor-pointer">Acceder</button>
            )}
          </div>
        </div>
      </header>

      {showHero ? (
        <CategorySelector onSelect={handleCategorySelect} query={query} onQueryChange={setQuery} onSearch={handleSearch} facets={facets} />
      ) : (
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start animate-sweep-in">
          {currentView === 'search' && (
            <aside className="w-full lg:w-72 flex-shrink-0">
               <div className={`lg:block transition-all duration-300 animate-fade-in ${showMobileFilters ? 'block' : 'hidden'}`}>
                <SidebarFilters facets={facets} filters={filters} onFilterChange={handleFilterChange} onClearAll={clearAll} hasActiveFilters={hasActiveFilters} results={results} />
              </div>
            </aside>
          )}

          <section className="flex-grow w-full">
            {currentView === 'pending' ? (
              <PendingTasksView onClose={() => setCurrentView('search')} onRefresh={() => fetchResults(query, filters)} />
            ) : currentView === 'activity-log' ? (
              <ActivityLogView onClose={() => setCurrentView('search')} />
            ) : currentView === 'history' ? (
              <HistoryView onClose={() => setCurrentView('search')} />
            ) : (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">Resultados 
                  {displayResults.length > 0 && <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[9px] font-black"> {displayResults.length} </span>}</h2>
                  <div className="h-px flex-grow ml-4 bg-gray-100" />
                </div>

                {loading && displayResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50"><div className="w-10 h-10 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin mb-4" /></div>
                ) : displayResults.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-lg">Non se atoparon resultados.</p>
                    <button onClick={clearAll} className="mt-4 text-yellow-600 font-bold hover:underline">Limpar filtros</button>
                  </div>
                ) : (
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`}>
                    {displayResults.slice(0, 50).map((item, idx) => (
                      <ResultCard key={`${item._type}-${item.id_articulo || item.id_insight || item.id_definicion}-${idx}`} item={item} onClick={() => handleSelectItem(item)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      )}

      {toast && (
        <div className="premium-toast-container">
          <div className={`premium-toast border-l-4 ${toast.type === 'error' ? 'border-red-500' : 'border-[#8c6508]'}`}>
            {toast.type === 'error' ? (
              <svg className="w-5 h-5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-[#8c6508]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {confirmData && (
        <div className="premium-modal-backdrop" onClick={() => setConfirmData(null)}>
          <div className="premium-modal" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#8c6508]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{confirmData.title || 'Aprobar Cambio'}</h3>
              <p className="text-gray-500 mb-8 px-4 leading-relaxed">{confirmData.message || 'Estás seguro de que queres realizar esta acción?'}</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmData(null)} className="flex-1 py-4 px-6 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]">Cancelar</button>
                <button onClick={() => { confirmData.onConfirm(); setConfirmData(null); }} className="flex-1 premium-button-gold py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[11px]">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DetailsModal 
        isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} item={selectedItem} details={itemDetails} loading={detailsLoading} 
        isEditable={user?.role === 'admin' || user?.role === 'editor' || user?.rol === 'admin' || user?.rol === 'editor'}
        onEdit={() => handleEditItem({ ...selectedItem, ...itemDetails })}
      />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />
      <CreateItemModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingItem(null); }} onSave={handleSaveItem} onDelete={handleDeleteItem} initialData={editingItem} />

      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`fixed bottom-8 right-8 p-4 bg-yellow-500 text-white rounded-full shadow-2xl transition-all z-[60] ${showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>
    </div>
  );
}

export default App;
