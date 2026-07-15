import { useEffect, useMemo, useState } from 'react';

const METRICS = [
    { key: 'visits', label: 'Visitas', detail: 'Entradas na web', color: 'bg-yellow-400', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 4-4.03 7-9 7s-9-3-9-7 4.03-7 9-7 9 3 9 7z' },
    { key: 'visitors', label: 'Navegadores', detail: 'Usuarios aproximados', color: 'bg-sky-400', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { key: 'searches', label: 'Procuras', detail: 'Consultas realizadas', color: 'bg-emerald-400', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { key: 'detailViews', label: 'Fichas abertas', detail: 'Lecturas de resultados', color: 'bg-violet-400', icon: 'M15 12H9m12 0c0 4-4.03 7-9 7s-9-3-9-7 4.03-7 9-7 9 3 9 7z' }
];

const emptySummary = { visits: 0, visitors: 0, sessions: 0, searches: 0, detailViews: 0 };

const UsageStatsView = ({ onClose }) => {
    const [days, setDays] = useState(30);
    const [data, setData] = useState({ summary: emptySummary, daily: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const loadStats = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`/api/analytics/stats?days=${days}`, { signal: controller.signal });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'Erro ao cargar os datos');
                setData({ summary: result.summary || emptySummary, daily: result.daily || [] });
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        loadStats();
        return () => controller.abort();
    }, [days]);

    const timeline = useMemo(() => {
        const byDate = new Map(data.daily.map(item => [item.date, item]));
        return Array.from({ length: days }, (_, index) => {
            const date = new Date();
            date.setUTCHours(0, 0, 0, 0);
            date.setUTCDate(date.getUTCDate() - (days - 1 - index));
            const key = date.toISOString().slice(0, 10);
            return byDate.get(key) || { date: key, visits: 0, searches: 0, detailViews: 0 };
        });
    }, [data.daily, days]);

    const chartMax = Math.max(1, ...timeline.flatMap(item => [item.visits, item.searches, item.detailViews]));
    const formatNumber = value => new Intl.NumberFormat('gl-ES').format(value || 0);
    const formatDate = value => new Intl.DateTimeFormat('gl-ES', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));

    return (
        <div className="flex flex-col animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-9 h-1 rounded-full bg-yellow-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-yellow-600 dark:text-yellow-400">Analítica interna</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-950 dark:text-white tracking-tight">Uso da ferramenta</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 font-medium">Actividade agregada desde que se activou a medición</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white dark:bg-[#171722] border border-gray-200 dark:border-zinc-800 rounded-2xl p-1 shadow-sm" aria-label="Período das estatísticas">
                        {[7, 30, 90].map(option => (
                            <button
                                key={option}
                                onClick={() => setDays(option)}
                                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${days === option ? 'bg-gray-950 dark:bg-yellow-400 text-white dark:text-black shadow-sm' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                            >
                                {option} días
                            </button>
                        ))}
                    </div>
                    <button onClick={onClose} className="p-3 bg-white dark:bg-[#171722] border border-gray-200 dark:border-zinc-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer" aria-label="Pechar estatísticas">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[360px] bg-white dark:bg-[#13131c] border border-gray-100 dark:border-zinc-800 rounded-[2rem]">
                    <div className="w-10 h-10 border-4 border-gray-100 dark:border-zinc-800 border-t-yellow-400 rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calculando actividade...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-[2rem] p-10 text-center">
                    <p className="font-bold text-red-600 dark:text-red-400">{error}</p>
                    <p className="text-sm text-red-400 dark:text-red-500 mt-2">Comproba que SQL Server permite crear a táboa de estatísticas.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5 mb-6">
                        {METRICS.map(metric => (
                            <article key={metric.key} className="relative overflow-hidden bg-white dark:bg-[#13131c] border border-gray-100 dark:border-zinc-800 rounded-[1.65rem] p-5 md:p-6 shadow-sm">
                                <div className={`absolute top-0 left-6 right-6 h-0.5 ${metric.color}`} />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 dark:text-zinc-500">{metric.label}</p>
                                        <p className="text-3xl md:text-4xl font-black tracking-tight text-gray-950 dark:text-white mt-2 tabular-nums">{formatNumber(data.summary[metric.key])}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-gray-500 dark:text-zinc-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={metric.icon} /></svg>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3">{metric.detail}</p>
                            </article>
                        ))}
                    </div>

                    <section className="bg-white dark:bg-[#13131c] border border-gray-100 dark:border-zinc-800 rounded-[2rem] p-5 md:p-8 shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Actividade diaria</h3>
                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Comparativa de entradas e accións dentro de Sisgeko</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400">
                                <span className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm bg-yellow-400" /> Visitas</span>
                                <span className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Procuras</span>
                                <span className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm bg-violet-400" /> Fichas</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto pb-2">
                            <div className="h-56 flex items-end gap-2 border-b border-gray-100 dark:border-zinc-800" style={{ minWidth: `${Math.max(620, days * 23)}px` }} role="img" aria-label={`Gráfica de actividade dos últimos ${days} días`}>
                                {timeline.map((item, index) => (
                                    <div key={item.date} className="group relative h-full flex-1 flex items-end justify-center gap-[2px] pt-8" title={`${formatDate(item.date)} · ${item.visits} visitas · ${item.searches} procuras · ${item.detailViews} fichas`}>
                                        <span className="absolute top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 z-10 whitespace-nowrap rounded-lg bg-gray-950 text-white px-2 py-1 text-[9px] font-bold transition-opacity pointer-events-none">
                                            {item.visits} · {item.searches} · {item.detailViews}
                                        </span>
                                        <i className="w-[28%] max-w-2.5 min-h-px bg-yellow-400 rounded-t-sm transition-all" style={{ height: `${(item.visits / chartMax) * 100}%` }} />
                                        <i className="w-[28%] max-w-2.5 min-h-px bg-emerald-400 rounded-t-sm transition-all" style={{ height: `${(item.searches / chartMax) * 100}%` }} />
                                        <i className="w-[28%] max-w-2.5 min-h-px bg-violet-400 rounded-t-sm transition-all" style={{ height: `${(item.detailViews / chartMax) * 100}%` }} />
                                        {(index === 0 || index === timeline.length - 1 || (days <= 7 && index % 2 === 0)) && (
                                            <span className="absolute -bottom-6 text-[9px] font-bold text-gray-400 dark:text-zinc-600 whitespace-nowrap">{formatDate(item.date)}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="mt-7 text-[11px] leading-relaxed text-gray-400 dark:text-zinc-500">
                            “Navegadores” é unha estimación anónima: un mesmo usuario pode contar máis dunha vez se cambia de dispositivo ou borra os datos do navegador. Non se gardan enderezos IP nin o contido das procuras.
                        </p>
                    </section>
                </>
            )}
        </div>
    );
};

export default UsageStatsView;
