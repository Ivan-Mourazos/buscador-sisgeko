import { useState, useEffect, useCallback } from 'react';
import SidebarFilters from './components/SidebarFilters';
import { ResultCard } from './components/ResultCard';
import DetailsModal from './components/DetailsModal';

function App() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ familias: [], subfamilias: [], procesos: [], tipo_origen: [] });
  const [facets, setFacets] = useState({ familias: [], subfamilias: [], procesos: [], tipo_origen: [] });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchResults = useCallback(async (currentQuery, currentFilters) => {
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

  // Efecto de debouncing: buscar 300ms después de que el usuario deje de tipear o cambie un filtro
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchResults(query, filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filters, fetchResults]);

  // Búsqueda inmediata al pulsar enter
  const handleSearch = (e) => {
    e.preventDefault();
    fetchResults(query, filters);
  };

  const clearAll = () => {
    setQuery('');
    setFilters({ familias: [], subfamilias: [], procesos: [], tipo_origen: [] });
  };

  const openDetails = async (item) => {
    setSelectedItem(item);
    setItemDetails(null);
    setDetailsLoading(true);

    try {
      const id = item.id_articulo || item.id_insight || item.id_definicion;
      if (!id) throw new Error("ID no encontrado");
      
      const res = await fetch(`http://localhost:5000/api/details?type=${item._type}&id=${id}`);
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

  const hasActiveFilters = query.trim() !== '' || Object.values(filters).some(arr => arr.length > 0);

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-orange-100">
      {/* HEADER MOCKUP STYLE */}
      <header className="bg-white border-b border-gray-50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group">
             <div className="flex flex-col -space-y-1">
                <h1 className="text-2xl font-black italic tracking-tighter text-orange-400 group-hover:text-orange-500 transition-colors">
                  buscador <span className="text-orange-400/90 font-extrabold uppercase ml-1">SISGEKO</span>
                </h1>
                <div className="h-1 w-full bg-orange-400/20 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
             </div>
          </div>

          <form onSubmit={handleSearch} className="w-full md:w-[32rem] relative group">
            <input 
              type="text" 
              className="w-full pl-6 pr-14 py-3 bg-gray-100/80 border-transparent rounded-full focus:bg-white focus:ring-4 focus:ring-orange-50 focus:border-orange-200 transition-all outline-none text-[15px] text-gray-700 placeholder:text-gray-400 shadow-inner group-hover:bg-gray-100"
              placeholder="Procurar termo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute right-1.5 top-1.5 p-2 bg-orange-400 rounded-full text-white shadow-lg shadow-orange-500/20 hover:bg-orange-500 active:scale-90 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-8 py-10 flex flex-col lg:flex-row gap-12 items-start">
        
        {/* SIDEBAR */}
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

        {/* LISTA DE RESULTADOS */}
        <section className="flex-grow w-full">
          <div className="mb-8">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-4">
              Resultados
            </h2>
          </div>

          {loading && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-b-blue-600 border-r-indigo-600"></div>
              <p className="text-gray-400 font-medium">Analizando base de datos...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {results.map((item, index) => (
                <ResultCard key={index} item={item} onClick={() => openDetails(item)} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-16 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No se encontraron resultados</h3>
              <p className="text-gray-500 max-w-sm">Prueba ajustando los filtros laterales o utiliza otros términos de búsqueda.</p>
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE DETALLES */}
      <DetailsModal 
        item={selectedItem} 
        details={itemDetails} 
        loading={detailsLoading} 
        onClose={() => setSelectedItem(null)} 
      />
    </div>
  );
}

export default App;
