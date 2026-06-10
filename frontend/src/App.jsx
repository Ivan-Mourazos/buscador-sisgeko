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
import ConfirmModal from './components/ConfirmModal';
import Chatbot from './components/Chatbot';

function App() {

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
  const [totalCount, setTotalCount] = useState(0);

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [modalReadOnly, setModalReadOnly] = useState(false);

  const searchInputRef = useRef(null);
  const detailsCache = useRef(new Map());
  const abortControllerRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [confirmData, setConfirmData] = useState(null); // { title: '', message: '', onConfirm: () => {} }

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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

  // Búsqueda en vivo con DEBOUNCE
  useEffect(() => {
    // Solo buscamos si estamos en la vista de búsqueda
    if (currentView !== 'search') return;
    
    // Si no hay query ni filtros activos, y estamos en modo hero, no disparamos nada
    // Pero si el usuario borra todo, queremos volver al estado inicial o mostrar resultados vacíos
    
    const delayDebounceFn = setTimeout(() => {
      fetchResults(query, filters, 0, false);
    }, 400); // 400ms de retraso

    return () => clearTimeout(delayDebounceFn);
  }, [query, filters, currentView]);

  // Infinite Scroll listener
  useEffect(() => {
    const handleInfiniteScroll = () => {
      if (loading || results.length >= totalCount || currentView !== 'search') return;

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200) {
        fetchResults(query, filters, results.length, true);
      }
    };

    window.addEventListener('scroll', handleInfiniteScroll);
    return () => window.removeEventListener('scroll', handleInfiniteScroll);
  }, [loading, results.length, totalCount, query, filters, currentView]);

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

  const fetchResults = async (q, f, offset = 0, append = false) => {
    if (!append && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    if (!append) {
      abortControllerRef.current = controller;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ query: q, filters: f, limit: 50, offset })
      });
      const data = await res.json();
      if (data.success) {
        if (append) {
          setResults(prev => [...prev, ...data.results]);
        } else {
          setResults(data.results);
        }
        setFacets(data.facets);
        setTotalCount(data.total);
        setError(null);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError("Error ao conectar co servidor");
    } finally {
      if (abortControllerRef.current === controller || append) {
        setLoading(false);
      }
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setCurrentView('search');
    // fetchResults ahora se maneja por el useEffect de query/filters
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
    // fetchResults ahora se maneja por el useEffect de query/filters
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // fetchResults ahora se maneja por el useEffect de query/filters
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
        // Limpiar caché de detalles para forzar recarga
        if (id) {
          const type = newItem._type === 'definicion' ? 'definicion' : newItem._type;
          detailsCache.current.delete(`${type}-${id}`);
        }
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
    fetchResults(query, defaultFilters, 0, false);
    setQuery('');
    setViewMode('hero');
    setCurrentView('search');
    setResults([]);
    setTotalCount(0);
  };

  const goHome = () => {
    clearAll();
  };

  // Pre-carga y caché para detalles
  const fetchDetailsForCache = async (type, id) => {
    const cacheKey = `${type}-${id}`;
    if (detailsCache.current.has(cacheKey)) {
      return detailsCache.current.get(cacheKey);
    }
    
    if (!fetchDetailsForCache.activePromises) {
      fetchDetailsForCache.activePromises = new Map();
    }
    if (fetchDetailsForCache.activePromises.has(cacheKey)) {
      return fetchDetailsForCache.activePromises.get(cacheKey);
    }

    const promise = (async () => {
      try {
        const res = await fetch(`/api/details?type=${type}&id=${id}`);
        const data = await res.json();
        if (data.success) {
          detailsCache.current.set(cacheKey, data.details);
          return data.details;
        }
      } catch (err) {
        console.error(err);
      } finally {
        fetchDetailsForCache.activePromises.delete(cacheKey);
      }
      return null;
    })();

    fetchDetailsForCache.activePromises.set(cacheKey, promise);
    return promise;
  };

  const handlePrefetchItem = useCallback((item) => {
    const type = item._type === 'definicion' ? 'definicion' : item._type;
    const id = item.id_articulo || item.id_insight || item.id_definicion;
    if (!id) return;
    fetchDetailsForCache(type, id);
  }, []);

  const handleSelectItem = async (item) => {
    setSelectedItem(item);
    const type = item._type === 'definicion' ? 'definicion' : item._type;
    const id = item.id_articulo || item.id_insight || item.id_definicion;
    if (!id) return;

    const cacheKey = `${type}-${id}`;
    if (detailsCache.current.has(cacheKey)) {
      const cached = detailsCache.current.get(cacheKey);
      setItemDetails(cached);
      // Enrich item if it came in sparse (e.g. from PendingTasksView)
      if (!item.titulo && !item.insight && !item.definicion) {
        setSelectedItem(prev => ({ ...prev, ...cached }));
      }
      setDetailsLoading(false);
      return;
    }

    setItemDetails(null);
    setDetailsLoading(true);
    const details = await fetchDetailsForCache(type, id);
    if (details) {
      setItemDetails(details);
      // Enrich item if it came in sparse (e.g. from PendingTasksView)
      if (!item.titulo && !item.insight && !item.definicion) {
        setSelectedItem(prev => ({ ...prev, ...details }));
      }
    }
    setDetailsLoading(false);
  };


  const handleDeleteItem = async (item) => {
    try {
      const typeKey = item._type === 'definicion' ? 'definiciones' : item._type === 'articulo' ? 'articulos' : 'insights';
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
        // Limpiar de la caché de detalles
        const type = item._type === 'definicion' ? 'definicion' : item._type;
        detailsCache.current.delete(`${type}-${id}`);
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
    <div className="min-h-screen bg-gray-100/70 dark:bg-transparent text-gray-800 dark:text-zinc-200 font-sans selection:bg-yellow-100 dark:selection:bg-yellow-900/40 overflow-x-hidden">
      <header className="bg-white dark:bg-[#111119] border-b border-gray-100 dark:border-[#1d1d2a] sticky top-0 z-50 shadow-sm dark:shadow-[0_1px_0_rgba(255,255,255,0.05)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-5 flex flex-wrap md:flex-nowrap gap-4 md:gap-8 items-center justify-between">
          <div onClick={goHome} className="flex items-center justify-start cursor-pointer group order-1 flex-shrink-0 min-w-[148px] md:min-w-[180px] -my-4 md:-my-6 overflow-visible">
             <img 
               src="/Logosisgekotgm.png" 
               alt="SISGEKO" 
               className="h-16 md:h-20 w-auto object-contain scale-[3.2] md:scale-[2.8] group-hover:scale-[3.4] md:group-hover:scale-[3.0] origin-left transition-all duration-300 ml-8 md:ml-4 dark:invert dark:hue-rotate-180 dark:brightness-115" 
             />
          </div>

          <form onSubmit={handleSearch} className={`w-full md:w-48 lg:w-72 xl:w-[28rem] order-3 md:order-2 md:ml-14 flex-grow md:flex-grow-0 relative z-20 group transition-all duration-700 min-w-0 ${showHero || ['pending', 'history'].includes(currentView) ? 'hidden md:block opacity-0 scale-95 pointer-events-none -translate-y-2' : 'block opacity-100 scale-100 translate-y-0 mt-5 md:mt-0'}`}>
            <input 
              ref={searchInputRef}
              type="text"
              className="w-full pl-6 pr-14 py-3 md:py-3.5 bg-white dark:bg-[#1a1a26] border border-gray-300 dark:border-[#252538] rounded-full shadow-sm focus:ring-4 focus:ring-yellow-50 dark:focus:ring-yellow-950/30 focus:border-yellow-400 dark:focus:border-yellow-500/70 transition-all outline-none text-[14px] md:text-[15px] text-gray-700 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
              placeholder="Procurar termo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-1.5 top-1.5 p-2 bg-yellow-500 rounded-full text-black shadow-lg shadow-yellow-500/20 hover:bg-yellow-600 active:scale-90 transition-all cursor-pointer">
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>

          <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-4 flex-nowrap order-2 md:order-3 relative z-20">
            {/* Desktop Navigation Group */}
            <div className="hidden md:flex items-center gap-2 sm:gap-4">
              {user && (user.rol === 'admin' || user.rol === 'editor' || user.role === 'admin' || user.role === 'editor' || user.username === 'ivan') && (
                <div className="flex items-center bg-gray-100/50 dark:bg-[#1a1a26]/70 p-1 rounded-2xl border border-gray-200/50 dark:border-[#252538]/80 mr-2">
                  <button 
                    onClick={() => { setViewMode('results'); setCurrentView('pending'); }} 
                    className={`relative px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${currentView === 'pending' ? 'bg-white dark:bg-[#252538] text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                  >
                    Pendentes
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white dark:ring-zinc-900 animate-in zoom-in duration-300">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => { setViewMode('results'); setCurrentView('history'); }} 
                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${currentView === 'history' ? 'bg-white dark:bg-[#252538] text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                  >
                    Historial
                  </button>
                </div>
              )}

              {/* Theme Toggle Button (Desktop) */}
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className="p-2 sm:p-2.5 rounded-full bg-gray-100 dark:bg-[#1e1e2c] text-gray-600 dark:text-yellow-400/90 hover:bg-gray-200 dark:hover:bg-[#252538] transition-all cursor-pointer flex-shrink-0"
                title={darkMode ? "Modo claro" : "Modo escuro"}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  {(user.rol === 'admin' || user.rol === 'editor' || user.role === 'admin' || user.role === 'editor' || user.username === 'ivan') && (
                    <button onClick={() => { setEditingItem(null); setIsCreateModalOpen(true); }} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-2 sm:py-2.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-lg shadow-yellow-400/20 active:scale-95 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                      <span>Novo</span>
                    </button>
                  )}
                  <div className="flex items-center gap-2 border-l border-gray-100 dark:border-[#252538] pl-2 sm:pl-4">
                    <div className="flex flex-col items-end leading-none">
                      <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{user.rol || user.role}</span>
                      <span className="text-[11px] sm:text-xs font-bold text-gray-900 dark:text-zinc-100">{user.username || user.name || 'Usuario'}</span>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer" title="Saír">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full text-[11px] sm:text-[13px] font-bold text-gray-600 dark:text-zinc-300 hover:border-yellow-500 dark:hover:border-yellow-400 transition-all cursor-pointer">Acceder</button>
              )}
            </div>

            {/* Mobile Header Elements (Hamburger) */}
            <div className="flex md:hidden items-center gap-2">
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)} 
                className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
                aria-label="Menú"
              >
                {showMobileMenu ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu Panel */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 dark:border-[#1d1d2a] bg-white dark:bg-[#111119] shadow-xl px-6 py-6 flex flex-col gap-6 animate-slide-down relative z-40">
            {/* 1. Admin Tabs */}
            {user && (user.rol === 'admin' || user.rol === 'editor' || user.role === 'admin' || user.role === 'editor' || user.username === 'ivan') && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Administración</span>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-zinc-800/40 p-1.5 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <button 
                    onClick={() => { setViewMode('results'); setCurrentView('pending'); setShowMobileMenu(false); }} 
                    className={`relative py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center cursor-pointer ${currentView === 'pending' ? 'bg-white dark:bg-zinc-800 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-gray-400 dark:text-zinc-500'}`}
                  >
                    Pendentes
                    {pendingCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-[8px] font-black text-white">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => { setViewMode('results'); setCurrentView('history'); setShowMobileMenu(false); }} 
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center cursor-pointer ${currentView === 'history' ? 'bg-white dark:bg-zinc-800 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-gray-400 dark:text-zinc-500'}`}
                  >
                    Historial
                  </button>
                </div>
              </div>
            )}

            {/* 2. Novo Button */}
            {user && (user.rol === 'admin' || user.rol === 'editor' || user.role === 'admin' || user.role === 'editor' || user.username === 'ivan') && (
              <button 
                onClick={() => { setEditingItem(null); setIsCreateModalOpen(true); setShowMobileMenu(false); }} 
                className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-yellow-400/20 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                Novo Rexistro
              </button>
            )}

            {/* 3. Theme Toggle (Segmented) */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Aspecto</span>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-zinc-800/40 p-1.5 rounded-2xl border border-gray-100 dark:border-zinc-800">
                <button 
                  onClick={() => { setDarkMode(false); setShowMobileMenu(false); }} 
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${!darkMode ? 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 shadow-sm' : 'text-gray-400 dark:text-zinc-500'}`}
                >
                  <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  Claro
                </button>
                <button 
                  onClick={() => { setDarkMode(true); setShowMobileMenu(false); }} 
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${darkMode ? 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 shadow-sm' : 'text-gray-400 dark:text-zinc-500'}`}
                >
                  <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Escuro
                </button>
              </div>
            </div>

            {/* 4. User Session / Auth */}
            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 flex items-center justify-between">
              {user ? (
                <>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">{user.rol || user.role}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">{user.username || user.name || 'Usuario'}</span>
                  </div>
                  <button 
                    onClick={() => { handleLogout(); setShowMobileMenu(false); }} 
                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer font-bold text-xs"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Saír
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setIsLoginModalOpen(true); setShowMobileMenu(false); }} 
                  className="w-full flex items-center justify-center gap-1.5 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full text-xs font-bold text-gray-600 dark:text-zinc-300 hover:border-yellow-500 transition-all cursor-pointer"
                >
                  Acceder
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {showHero ? (
        <CategorySelector onSelect={handleCategorySelect} query={query} onQueryChange={setQuery} onSearch={handleSearch} facets={facets} />
      ) : (
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start animate-sweep-in">
          {currentView === 'search' && (
            <aside className="w-full lg:w-72 flex-shrink-0 lg:border-r border-gray-200 dark:border-[#1d1d2a] lg:pr-8">
               <div className={`lg:block transition-all duration-300 animate-fade-in ${showMobileFilters ? 'block' : 'hidden'}`}>
                <SidebarFilters facets={facets} filters={filters} onFilterChange={handleFilterChange} onClearAll={clearAll} hasActiveFilters={hasActiveFilters} results={results} />
              </div>
            </aside>
          )}

          <section className="flex-grow w-full">
            {currentView === 'pending' ? (
              <PendingTasksView 
                onClose={() => setCurrentView('search')} 
                onRefresh={() => fetchResults(query, filters)} 
                showToast={showToast} 
                askConfirm={askConfirm}
                onOpenItem={(item) => { setModalReadOnly(true); handleSelectItem(item); }}
              />
            ) : currentView === 'activity-log' ? (
              <ActivityLogView onClose={() => setCurrentView('search')} />
            ) : currentView === 'history' ? (
              <HistoryView onClose={() => setCurrentView('search')} />
            ) : (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-[11px] font-bold text-gray-400 dark:text-zinc-550 uppercase tracking-[0.2em] flex items-center gap-3">Resultados 
                  {totalCount > 0 && <span className="bg-gray-100 dark:bg-[#15151e] text-gray-500 dark:text-yellow-450 px-2 py-0.5 rounded-full text-[9px] font-black border dark:border-zinc-800/80"> {totalCount} </span>}</h2>
                  <div className="h-px flex-grow ml-4 bg-gray-100 dark:bg-zinc-800" />
                </div>

                {loading && displayResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50"><div className="w-10 h-10 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin mb-4" /></div>
                ) : displayResults.length === 0 ? (
                  <div className="bg-white dark:bg-[#13131c] rounded-3xl p-12 text-center border border-dashed border-gray-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-gray-500 dark:text-zinc-400 text-lg">Non se atoparon resultados.</p>
                    <button onClick={clearAll} className="mt-4 text-yellow-600 dark:text-yellow-400 font-bold hover:underline">Limpar filtros</button>
                  </div>
                ) : (
                  <div className="pb-20">
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${loading && results.length === 0 ? 'opacity-40' : 'opacity-100'}`}>
                      {displayResults.map((item, idx) => (
                        <ResultCard 
                          key={`${item._type}-${item.id_articulo || item.id_insight || item.id_definicion}-${idx}`} 
                          item={item} 
                          onClick={() => handleSelectItem(item)} 
                          onPrefetch={() => handlePrefetchItem(item)}
                        />
                      ))}
                    </div>
                    {loading && results.length > 0 && (
                      <div className="flex justify-center py-6">
                        <div className="w-8 h-8 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin" />
                      </div>
                    )}
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

      <ConfirmModal
        isOpen={!!confirmData}
        title={confirmData?.title || 'Aprobar cambio'}
        message={confirmData?.message || 'Estás seguro de que queres realizar esta acción?'}
        confirmText="Confirmar"
        cancelText="Cancelar"
        type="warning"
        onConfirm={() => {
          confirmData?.onConfirm();
          setConfirmData(null);
        }}
        onCancel={() => setConfirmData(null)}
      />

      <DetailsModal 
        isOpen={!!selectedItem} 
        onClose={() => { setSelectedItem(null); setModalReadOnly(false); }} 
        item={selectedItem} details={itemDetails} loading={detailsLoading} 
        isEditable={!modalReadOnly && (user?.role === 'admin' || user?.role === 'editor' || user?.rol === 'admin' || user?.rol === 'editor')}
        onEdit={() => handleEditItem({ ...selectedItem, ...itemDetails })}
        user={user}
      />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />
      <CreateItemModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingItem(null); }} onSave={handleSaveItem} onDelete={handleDeleteItem} initialData={editingItem} />

      <Chatbot />

      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
        className={`fixed bottom-8 right-8 p-4 bg-yellow-500 text-white rounded-full shadow-[0_10px_25px_rgba(234,179,8,0.4)] transition-all z-[80] cursor-pointer hover:bg-yellow-600 hover:scale-110 active:scale-95 hover:shadow-[0_15px_35px_rgba(234,179,8,0.5)] ${showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        title="Volver arriba"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>
    </div>
  );
}

export default App;
