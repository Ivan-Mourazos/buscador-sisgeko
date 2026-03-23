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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 text-gray-800 font-sans">
      {/* HEADER PúBLICO */}
      <header className="bg-white/70 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">
              Buscador Sisgeko
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-1">Plataforma Inteligente de Conocimiento</p>
          </div>

          <form onSubmit={handleSearch} className="w-full md:w-[28rem] relative group">
            <input 
              type="text" 
              className="w-full pl-5 pr-14 py-3 bg-gray-100/50 border border-gray-200 rounded-full focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none text-gray-700 shadow-inner group-hover:shadow-md"
              placeholder="Encuentra artículos, procesos, definiciones..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute right-2 top-2 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-white shadow hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR */}
        <aside className="w-full lg:w-80 flex-shrink-0 relative">
          <SidebarFilters 
            facets={facets} 
            filters={filters} 
            onFilterChange={setFilters} 
            onClearAll={clearAll}
            hasActiveFilters={hasActiveFilters}
          />
        </aside>

        {/* LISTA DE RESULTADOS */}
        <section className="flex-grow w-full">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl shadow-sm border border-red-100 flex items-center space-x-3 mb-6">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex flex-col">
                <span className="font-bold">Error de conexión</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="mb-6 flex justify-between items-end">
            <h2 className="text-2xl font-bold text-gray-800">
              Resultados
            </h2>
            <div className="text-sm font-semibold px-3 py-1 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Buscando...
                </span>
              ) : (
                <span>{results.length} coincidencias</span>
              )}
            </div>
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
