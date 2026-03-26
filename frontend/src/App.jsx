import { useState, useEffect, useCallback, useRef } from 'react';
import SidebarFilters from './components/SidebarFilters';
import { ResultCard } from './components/ResultCard';
import DetailsModal from './components/DetailsModal';
import LoginModal from './components/LoginModal';
import CreateItemModal from './components/CreateItemModal';
import CategorySelector from './components/CategorySelector';

function App() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ familias: [], subfamilias: [], procesos: [], tipo_origen: [], categories: [] });
  const [facets, setFacets] = useState({ categories: [], familias: [], subfamilias: [], procesos: [], tipo_origen: [] });
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

  const searchInputRef = useRef(null);

  // Load session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('sisgeko_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hasActiveFilters = query.trim() !== '' || Object.values(filters).some(arr => arr.length > 0);
  const showHero = viewMode === 'hero';

  // Focus transition logic: Cuando desaparece el Hero, enfocamos la barra del header
  useEffect(() => {
    if (!showHero && query.trim() !== '' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showHero, query]);

  useEffect(() => {
    if (query.trim() !== '' || filters.categories.length > 0) {
      setViewMode('results');
    }
  }, [query, filters.categories]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('sisgeko_user', JSON.stringify(userData));
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sisgeko_user');
  };

  const handleSaveNewItem = (newItem) => {
    console.log("Gardando elemento:", newItem);
    const action = editingItem ? "actualizado" : "gardado";
    alert(`Elemento ${action} localmente (Simulación). En breve estará dispoñible na base de datos.`);
    setEditingItem(null);
    setIsCreateModalOpen(false);
  };

  const handleDeleteItem = (item) => {
    console.log("Eliminando elemento:", item);
    alert("Elemento eliminado localmente (Simulación).");
    setEditingItem(null);
    setIsCreateModalOpen(false);
  };

  const handleEditItem = (item) => {
    setSelectedItem(null);
    setEditingItem(item);
    setIsCreateModalOpen(true);
  };

  const fetchResults = useCallback(async (currentQuery, currentFilters) => {
    // Permitimos el fetch si estamos en el Hero (para cargar contadores)
    // En modo resultados siempre fetch para reflejar cambios en filtros (incluyendo limpiar tudo)
    if (showHero && currentFilters.categories.length === 0 && currentQuery.trim() === '') return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery, filters: currentFilters })
      });
      
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      
      const data = await response.json();
      if (data.success) {
        setResults(data.results || []);
        if (data.facets) setFacets(data.facets);
      } else {
        throw new Error(data.message || 'Error desconocido');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchResults(query, filters);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, filters, fetchResults]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    fetchResults(query, filters);
  };

  const clearAll = () => {
    setQuery('');
    setFilters({ familias: [], subfamilias: [], procesos: [], tipo_origen: [], categories: [] });
  };

  const handleCategorySelect = (categoryId) => {
    setFilters({ 
      familias: [], 
      subfamilias: [], 
      procesos: [], 
      tipo_origen: [], 
      categories: [categoryId] 
    });
    setViewMode('results');
  };

  const goHome = () => {
    setQuery('');
    setFilters({ familias: [], subfamilias: [], procesos: [], tipo_origen: [], categories: [] });
    setViewMode('hero');
  };

  const openDetails = async (item) => {
    setSelectedItem(item);
    setItemDetails(null);
    setDetailsLoading(true);

    try {
      const id = item.id_articulo || item.id_insight || item.id_definicion;
      if (!id) throw new Error("ID no encontrado");
      
      const res = await fetch(`/api/details?type=${item._type}&id=${id}`);
      const data = await res.json();
      if (data.success) {
        setItemDetails(data.details);
      }
    } catch (err) {
      console.error("Error cargando detalles:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const displayResults = results.filter(item => {
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(item._type)) return false;
    }
    const isSpecificFilterActive = (filters.tipo_origen?.length > 0) || (filters.procesos?.length > 0);
    if (isSpecificFilterActive) {
      if (item._type !== 'insight') return false;
      if (filters.tipo_origen?.length > 0 && !filters.tipo_origen.includes(item.id_tipo_origen)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50/30 text-gray-800 font-sans selection:bg-yellow-100 overflow-x-hidden">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div onClick={goHome} className="flex items-center gap-2 cursor-pointer group">
             <img 
               src="/Logosisgekotgm.svg" 
               alt="SISGEKO" 
               className="h-11 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
             />
          </div>

          <form onSubmit={handleSearch} className={`w-full md:w-[32rem] relative group transition-all duration-700 ${showHero ? 'opacity-0 scale-95 pointer-events-none -translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
            <input 
              ref={searchInputRef}
              type="text" 
              className="w-full pl-6 pr-14 py-3.5 bg-white border border-gray-200 rounded-full focus:bg-white focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-[15px] text-gray-700 placeholder:text-gray-400 shadow-sm group-hover:border-gray-300 group-hover:shadow-md"
              placeholder="Procurar termo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute right-1.5 top-1.5 p-2.5 bg-yellow-500 rounded-full text-white shadow-lg shadow-yellow-500/20 hover:bg-yellow-600 active:scale-90 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          <div className="flex items-center gap-4">
            {user && (
              <button 
                onClick={() => {
                  setEditingItem(null);
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-[13px] font-bold hover:bg-black hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                Novo
              </button>
            )}
            
            {user ? (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 py-1.5 pl-1.5 pr-4 rounded-full shadow-sm">
                <div className="w-9 h-9 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-gray-800 leading-tight">{user.name}</span>
                  <button 
                    onClick={handleLogout}
                    className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors text-left cursor-pointer"
                  >
                    Saír
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] font-bold text-gray-600 hover:border-yellow-500 hover:text-yellow-600 hover:shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Acceder
              </button>
            )}
          </div>
        </div>
      </header>

      {showHero ? (
        <CategorySelector 
          onSelect={handleCategorySelect} 
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          facets={facets}
        />
      ) : (
        <main className="max-w-7xl mx-auto px-8 py-10 flex flex-col lg:flex-row gap-12 items-start animate-sweep-in">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <SidebarFilters 
              facets={facets} 
              filters={filters} 
              onFilterChange={setFilters} 
              onClearAll={clearAll}
              hasActiveFilters={hasActiveFilters}
              results={results}
            />
          </aside>

          <section className="flex-grow w-full">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                Resultados
                {displayResults.length > 0 && (
                  <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[9px] font-black border border-gray-100 shadow-sm animate-fade-in">
                    {displayResults.length}
                  </span>
                )}
              </h2>
              <div className="h-px flex-grow ml-4 bg-gray-100" />
            </div>

              {loading && displayResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in opacity-50">
                <div className="w-10 h-10 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Actualizando resultados...</p>
              </div>
            ) : displayResults.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 shadow-sm animate-fade-in">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">Non se atoparon resultados para esta combinación.</p>
                <button onClick={clearAll} className="mt-4 text-yellow-600 font-bold hover:underline cursor-pointer">Limpar filtros</button>
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                {displayResults.slice(0, 50).map((item, idx) => (
                  <ResultCard 
                    key={`${item._type}-${item.id_articulo || item.id_insight || item.id_definicion}-${idx}`} 
                    item={item} 
                    onClick={() => openDetails(item)} 
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      <DetailsModal 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        item={selectedItem}
        details={itemDetails} 
        loading={detailsLoading} 
        isEditable={user?.role === 'admin'}
        onEdit={() => handleEditItem({ ...selectedItem, ...itemDetails })}
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleLogin}
      />

      <CreateItemModal 
        isOpen={isCreateModalOpen} 
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingItem(null);
        }} 
        onSave={handleSaveNewItem}
        onDelete={handleDeleteItem}
        initialData={editingItem}
      />

      {/* Botón Volver Arriba */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 p-4 bg-yellow-500 text-white rounded-full shadow-2xl shadow-yellow-500/40 transition-all duration-500 transform z-[60] hover:bg-yellow-600 hover:-translate-y-1 active:scale-90 cursor-pointer ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
}

export default App;
