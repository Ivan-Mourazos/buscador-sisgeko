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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchResults(query, filters);
    }, 200); // Reducido de 300ms a 200ms para mayor agilidad

    return () => clearTimeout(timeoutId);
  }, [query, filters, fetchResults]);

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

  // Filtrado local para asegurar consistencia (especialmente si el backend no ha reiniciado)
  const displayResults = results.filter(item => {
    if (filters.tipo_origen && filters.tipo_origen.length > 0) {
      if (item._type !== 'insight') return false;
      return filters.tipo_origen.includes(item.id_tipo_origen);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50/30 text-gray-800 font-sans selection:bg-yellow-100">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group">
             <img 
               src="/Logosisgekotgm.svg" 
               alt="SISGEKO" 
               className="h-11 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
             />
          </div>

          <form onSubmit={handleSearch} className="w-full md:w-[32rem] relative group">
            <input 
              type="text" 
              className="w-full pl-6 pr-14 py-3.5 bg-white border border-gray-200 rounded-full focus:bg-white focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 transition-all outline-none text-[15px] text-gray-700 placeholder:text-gray-400 shadow-sm group-hover:border-gray-300 group-hover:shadow-md"
              placeholder="Procurar termo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute right-1.5 top-1.5 p-2.5 bg-yellow-500 rounded-full text-white shadow-lg shadow-yellow-500/20 hover:bg-yellow-600 active:scale-90 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 flex flex-col lg:flex-row gap-12 items-start">
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
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              Resultados
            </h2>
            <div className="h-px flex-grow ml-4 bg-gray-100" />
          </div>

          {loading && displayResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Procurando información...</p>
            </div>
          ) : displayResults.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">Non se atoparon resultados para esta combinación.</p>
              <button onClick={clearAll} className="mt-4 text-yellow-600 font-bold hover:underline">Limpar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {displayResults.map((item, idx) => (
                <ResultCard 
                  key={`${item._type}-${idx}`} 
                  item={item} 
                  onClick={() => openDetails(item)} 
                />
              ))}
            </div>
          )}
        </section>
      </main>

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
