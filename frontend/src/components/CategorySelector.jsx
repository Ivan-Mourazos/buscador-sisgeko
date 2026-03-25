import React from 'react';

const CategorySelector = ({ onSelect, query, onQueryChange, onSearch, facets }) => {
  const categories = [
    {
      id: 'insight',
      title: 'Insights',
      description: 'Análise, procesos e coñecemento técnico acumulado.',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'from-purple-600 to-indigo-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      id: 'articulo',
      title: 'Artigos',
      description: 'Consulta de productos, características e variantes.',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    {
      id: 'definicion',
      title: 'Definicións',
      description: 'Glosario de termos, conceptos e vocabulario técnico.',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-8 py-20 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
          Benvido ao <span className="text-yellow-500">Buscador Sisgeko</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
          Selecciona unha categoría para comezar ou busca directamente.
        </p>
      </div>

      {/* Google-style Search Bar */}
      <div className="max-w-3xl mx-auto mb-20 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <form onSubmit={onSearch} className="relative group">
          <input 
            type="text" 
            autoFocus
            placeholder="Que estás a buscar hoxe?"
            className="w-full pl-8 pr-32 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-2xl shadow-gray-200/60 focus:ring-4 focus:ring-yellow-50 focus:border-yellow-400 focus:shadow-yellow-100/50 transition-all outline-none text-xl font-medium placeholder:text-gray-300 group-hover:border-gray-200"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-2.5 top-2.5 bottom-2.5 px-8 bg-yellow-500 rounded-[1.5rem] text-white font-black shadow-lg shadow-yellow-500/20 hover:bg-yellow-600 transition-all flex items-center gap-2 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map((cat, idx) => {
          const catFacet = facets?.categories?.find(c => c.id === cat.id);
          const count = catFacet?.count || 0;
          
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              style={{ animationDelay: `${idx * 150}ms` }}
              className="group relative bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-transparent transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden flex flex-col items-center text-center animate-slide-up cursor-pointer"
            >
              {/* Background Gradient on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Count Badge - Always Visible */}
              <div className="absolute top-6 right-8 z-20">
                <div className={`px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100 ${cat.textColor} text-[11px] font-black group-hover:bg-white group-hover:scale-110 transition-all duration-300`}>
                  {count} resultados
                </div>
              </div>

              {/* Icon Circle */}
              <div className={`relative z-10 w-24 h-24 ${cat.bgLight} rounded-3xl flex items-center justify-center ${cat.textColor} mb-8 group-hover:bg-white/20 group-hover:text-white transition-all duration-500 transform group-hover:rotate-6 shadow-sm`}>
                {cat.icon}
              </div>

              <h3 className="relative z-10 text-2xl font-black text-gray-800 mb-4 group-hover:text-white transition-colors duration-500">
                {cat.title}
              </h3>
              
              <p className="relative z-10 text-gray-500 font-medium leading-relaxed group-hover:text-white/80 transition-colors duration-500">
                {cat.description}
              </p>

              {/* Bottom Arrow Indicator */}
              <div className="relative z-10 mt-8 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-20 text-center opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Toldos Gómez S.L. · Sistema de Xestión de Coñecemento</p>
      </div>
    </div>
  );
};

export default CategorySelector;
