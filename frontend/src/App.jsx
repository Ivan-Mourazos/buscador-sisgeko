import { useState, useEffect } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const response = await fetch(`http://localhost:5000/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      const data = await response.json();
      if (data.success) {
        // En caso de que se retorne "data" o "results"
        setResults(data.data || data.results || []);
      } else {
        throw new Error(data.message || 'Error desconocido');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Para cargar resultados iniciales si se desea
    // fetchResults();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResults();
  };

  return (
    <div className="min-h-screen p-8 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm mb-2">
            Buscador Avanzado
          </h1>
          <p className="text-gray-500">Encuentra productos utilizando filtros precisos.</p>
        </header>

        <section className="bg-white p-6 rounded-2xl shadow-xl shadow-blue-900/5 ring-1 ring-gray-100">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-4">
              <label className="block text-sm font-semibold mb-1 text-gray-700">Término de Búsqueda</label>
              <input 
                type="text" 
                className="w-full border-gray-200 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="Ej. Laptop, Smartphone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Categoría</label>
              <select 
                className="w-full border-gray-200 border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="electronics">Electrónica</option>
                <option value="clothing">Ropa</option>
                <option value="home">Hogar</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Precio Mín.</label>
              <input 
                type="number" 
                className="w-full border-gray-200 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Precio Máx.</label>
              <input 
                type="number" 
                className="w-full border-gray-200 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold p-3 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95"
              >
                Buscar
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl shadow-sm ring-1 ring-red-100 flex items-center space-x-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <section className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 ring-1 ring-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">Resultados</h2>
              <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm ring-1 ring-gray-200">
                {results.length} coincidencias
              </span>
            </div>
            {results.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {results.map((item, index) => (
                  <li key={item.id || index} className="p-6 hover:bg-blue-50/30 transition-colors flex justify-between items-center group">
                    <div>
                      <h3 className="text-md font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {item.Name || item.name || 'Sin nombre'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 capitalize">
                        {item.Category || item.category || 'Sin categoría'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-gray-700">
                        ${item.Price || item.price || 0}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-12 text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg">No se encontraron productos con estos filtros.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
