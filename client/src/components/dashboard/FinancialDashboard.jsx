import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Sector
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Calendar, Loader2, Building, Percent, Filter, Wallet, History, Globe, Hammer, Box, Users, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { cn, formatCurrency } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import AnnualReport from './AnnualReport';

export default function FinancialDashboard({ isAdmin = false }) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(false);
    const [data, setData] = useState(null);
    const [wallets, setWallets] = useState([]);
    const [loadingWallets, setLoadingWallets] = useState(false);
    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: Math.max(1, currentYear - 2022 + 1) }, (_, i) => currentYear - i);



    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);
            try {
                // Fetch properties for the filter
                const propsRes = await api.get('/properties/');
                setProperties(propsRes.data.results || []);

                if (isAdmin) {
                    fetchWallets();
                }

                // Fetch initial stats
                await fetchStats('', selectedYear);
            } catch (err) {
                console.error("Failed to initialize finance dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        initDashboard();
    }, []);

    // fetch wallets for admin
    const fetchWallets = async () => {
        setLoadingWallets(true);
        try {
            const response = await api.get('/finance/wallets/');
            setWallets(response.data.results || []);
        } catch (err) {
            console.error("Failed to fetch wallets", err);
        } finally {
            setLoadingWallets(false);
        }
    };

    const fetchStats = async (propertyId, year) => {
        setLoadingStats(true);
        try {
            let url = '/finance/transactions/dashboard-stats/?';
            if (propertyId) url += `property=${propertyId}&`;
            if (year) url += `year=${year}`;

            const response = await api.get(url);
            setData(response.data);
        } catch (err) {
            console.error("Failed to fetch finance stats", err);
            const errorMsg = err.response?.data?.error || err.message;
            const traceback = err.response?.data?.traceback;

            showToast({
                message: `Erreur: ${errorMsg}${traceback ? ' (Voir console pour traceback)' : ''}`,
                type: 'error',
                duration: 5000
            });

            if (traceback) {
                console.group('Backend Traceback (500 Error)');
                console.log(traceback);
                console.groupEnd();
            }
        } finally {
            setLoadingStats(false);
        }
    };

    const handlePropertyChange = (e) => {
        const id = e.target.value;
        setSelectedPropertyId(id);
        fetchStats(id, selectedYear);
    };

    const handleYearChange = (e) => {
        const year = parseInt(e.target.value);
        setSelectedYear(year);
        fetchStats(selectedPropertyId, year);
    };

    // Simplified Yield Calculation using backend data
    const calculateYield = () => {
        if (!data) return 0;

        // Use backend provided ROI if available (newly implemented)
        if (data.global_roi !== undefined) return data.global_roi;

        // Fallback for specific property summary
        if (data.property_summary?.yield !== undefined) return data.property_summary.yield;

        // If a specific property is selected, use its specific yield from property_stats
        if (selectedPropertyId) {
            const propStat = data.property_stats?.find(p => p.id.toString() === selectedPropertyId);
            return propStat?.yield || 0;
        }

        // Otherwise, calculate average yield weighted by investment
        const totalInvestment = data.property_stats?.reduce((sum, p) => sum + (p.investment || 0), 0) || 0;
        if (totalInvestment === 0) return 0;

        // Return average yield
        const avgYield = data.property_stats?.reduce((sum, p) => sum + (p.yield * p.investment), 0) / totalInvestment;
        return avgYield ? avgYield.toFixed(2) : 0;
    };

    const [dashboardMode, setDashboardMode] = useState('rental'); // 'rental' or 'transactional'

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) return null;

    const isEffectiveAdmin = data.isAdmin || isAdmin;
    const rental = data.rental_performance || {};
    const trans = data.transactional_performance || {};
    const construction = data.construction_performance || {};

    // Standardized Stats object for the UI
    let stats = {
        main_value: 0,
        volume: 0,
        performance: 0,
        label_main: "",
        label_volume: "",
        label_performance: ""
    };

    if (dashboardMode === 'construction') {
        stats = {
            main_value: construction.total_volume || 0,
            volume: construction.matieriables_volume || 0,
            performance: construction.main_d_oeuvre_volume || 0,
            label_main: "Volume Chantier",
            label_volume: "Matériaux",
            label_performance: "Main d'œuvre"
        };
    } else if (dashboardMode === 'transactional') {
        const roi = trans.roi || 0;
        stats = {
            main_value: isEffectiveAdmin ? trans.net_capital_gain : trans.net_capital_gain, // Net Gain is prioritized
            volume: trans.sales_volume || 0,
            performance: roi,
            label_main: isEffectiveAdmin ? "CA Commissions" : "Plus-value Nette",
            label_volume: isEffectiveAdmin ? "Volume Ventes" : "Capital Investi", // Note: Investment is the "volume" here for the owner
            label_performance: isEffectiveAdmin ? "Marge Nette" : "ROI Projet"
        };
        // Specific adjustment for volume label if owner
        if (!isEffectiveAdmin) {
            stats.volume = trans.investment_total || 0;
        }
    } else {
        const yield_val = rental.yield || 0;
        stats = {
            main_value: isEffectiveAdmin ? rental.commission_total : rental.net_revenue,
            volume: rental.total_inflow || 0,
            performance: yield_val,
            label_main: isEffectiveAdmin ? "CA Commissions" : "Solde Portefeuille",
            label_volume: isEffectiveAdmin ? "Volume Loyers" : "Loyers Bruts",
            label_performance: isEffectiveAdmin ? "Marge Nette" : "Rendement Net"
        };
    }

    // Map monthly_data to chartData with a generic 'value' key for the AreaChart
    const chartData = (data.monthly_data || []).map(m => ({
        ...m,
        value: dashboardMode === 'construction' ? m.construction_costs :
            dashboardMode === 'transactional' ? m.trans_revenues :
                m.rental_revenues
    }));

    // Logic for Asset Distribution Card (Dynamic)
    const totalAssetValue = (data.property_stats || []).reduce((sum, p) => sum + (p.investment || 0), 0);
    const totalLiquidity = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
    const globalTotal = totalAssetValue + totalLiquidity;
    const liquidityRatio = globalTotal > 0 ? (totalLiquidity / globalTotal) * 100 : 0;
    const assetsRatio = globalTotal > 0 ? (totalAssetValue / globalTotal) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Mode Switcher & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-1" style={{ scrollbarWidth: 'none' }}>
                {/* Mode Switcher — scrollable on mobile */}
                <div
                    style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    className="w-full lg:w-fit rounded-xl bg-muted p-1 no-scrollbar [&::-webkit-scrollbar]:hidden shrink-0"
                >
                    <div style={{ display: 'flex', width: 'max-content', gap: '4px' }} className="flex">
                        <button
                            onClick={() => setDashboardMode('rental')}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
                                dashboardMode === 'rental'
                                    ? "bg-background dark:bg-white/5 shadow-sm text-primary"
                                    : "text-muted-foreground hover:text-foreground dark:hover:bg-white/5"
                            )}
                        >
                            <Calendar className="h-4 w-4" />
                            Gestion Locative
                        </button>
                        <button
                            onClick={() => setDashboardMode('transactional')}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
                                dashboardMode === 'transactional'
                                    ? "bg-background dark:bg-white/5 shadow-sm text-primary"
                                    : "text-muted-foreground hover:text-foreground dark:hover:bg-white/5"
                            )}
                        >
                            <TrendingUp className="h-4 w-4" />
                            Investissement Achat-Revente
                        </button>
                        {isEffectiveAdmin && (
                            <button
                                onClick={() => setDashboardMode('construction')}
                                className={cn(
                                    "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
                                    dashboardMode === 'construction'
                                        ? "bg-background dark:bg-white/5 shadow-sm text-primary"
                                        : "text-muted-foreground hover:text-foreground dark:hover:bg-white/5"
                                )}
                            >
                                <Hammer className="h-4 w-4" />
                                Suivi Chantier
                            </button>
                        )}
                        <button
                            onClick={() => setDashboardMode('reports')}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
                                dashboardMode === 'reports'
                                    ? "bg-background dark:bg-white/5 shadow-sm text-primary"
                                    : "text-muted-foreground hover:text-foreground dark:hover:bg-white/5"
                            )}
                        >
                            <PieIcon className="h-4 w-4" />
                            Rapports
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-muted/30 dark:bg-black/40 p-2 rounded-xl border border-black/5 dark:border-white/5 w-full lg:w-auto">
                    <div className="flex items-center gap-3 px-2 sm:border-r sm:border-muted last:border-0 py-1 sm:py-0">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <select
                            className="bg-transparent text-sm font-bold focus:outline-none min-w-[150px]"
                            value={selectedPropertyId}
                            onChange={handlePropertyChange}
                        >
                            <option value="">{isEffectiveAdmin ? "Tous les biens (Admin)" : "Tous mes biens"}</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <select
                            className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer py-1 pe-2"
                            value={selectedYear}
                            onChange={handleYearChange}
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {dashboardMode === 'reports' ? (
                <AnnualReport
                    data={data}
                    selectedYear={selectedYear}
                    isAdmin={isEffectiveAdmin}
                />
            ) : (
                <>
                    {/* Solaris Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className="solaris-glass rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 transition-all group overflow-hidden relative dark:border-white/5 dark:bg-black/40">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary dark:text-primary dark:bg-primary/20">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                {loadingStats && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                {stats.label_main}
                            </p>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight pt-1">
                                <span className="hidden xl:inline">{formatCurrency(stats.main_value)}</span>
                                <span className="xl:hidden">{formatCurrency(stats.main_value, true)}</span>
                            </h3>
                            <p className="text-[10px] font-bold text-muted-foreground mt-4 flex items-center gap-1 opacity-60">
                                <ShieldCheck className="h-3 w-3" /> Données sécurisées MaDis
                            </p>
                        </div>

                        <div className="solaris-glass rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 transition-all group overflow-hidden relative dark:border-white/5 dark:bg-black/40">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-400/10 transition-colors" />
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 rounded-2xl bg-amber-100/50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                                    {dashboardMode === 'construction' ? <Box className="h-6 w-6" /> : <Building className="h-6 w-6" />}
                                </div>
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                {stats.label_volume}
                            </p>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight pt-1">
                                <span className="hidden xl:inline">{formatCurrency(stats.volume)}</span>
                                <span className="xl:hidden">{formatCurrency(stats.volume, true)}</span>
                            </h3>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-black/40 rounded-full mt-6 overflow-hidden">
                                <div className="h-full bg-amber-500/50 rounded-full w-2/3" />
                            </div>
                        </div>

                        <div className="solaris-glass rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 transition-all group overflow-hidden relative shadow-sm dark:border-white/5 dark:bg-black/40">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-400/10 transition-colors" />
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 rounded-2xl bg-emerald-100/50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                                    {dashboardMode === 'construction' ? <Users className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
                                </div>
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                {stats.label_performance}
                            </p>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight pt-1">
                                {dashboardMode === 'rental' || dashboardMode === 'transactional'
                                    ? stats.performance.toFixed(2) + '%'
                                    : (
                                        <>
                                            <span className="hidden xl:inline">{formatCurrency(stats.performance)}</span>
                                            <span className="xl:hidden">{formatCurrency(stats.performance, true)}</span>
                                        </>
                                    )}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-4">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-tighter">Performance Optimale</p>
                            </div>
                        </div>

                        <div className="solaris-glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 transition-all flex flex-col items-center justify-center relative overflow-hidden group dark:border-white/5 dark:bg-black/60">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="relative w-24 h-24 mb-6">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-white/5" />
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (assetsRatio / 100))} className="text-primary dark:text-[#00f2ff] dark:filter dark:drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold dark:text-white">{assetsRatio.toFixed(0)}%</span>
                                        <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest opacity-60">Actif</span>
                                    </div>
                                </div>
                                <div className="w-full space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-primary" />
                                            <span className="text-xs font-bold">Immobilier</span>
                                        </div>
                                        <span className="text-xs font-bold whitespace-nowrap">{formatCurrency(totalAssetValue, true)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10" />
                                            <span className="text-xs font-bold">Liquidités</span>
                                        </div>
                                        <span className="text-xs font-bold whitespace-nowrap">{formatCurrency(totalLiquidity, true)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                        {/* High-End Solaris Chart */}
                        <div className="lg:col-span-2 solaris-glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 dark:bg-black/40">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Évolution Financière
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase mt-1">Données consolidées MaDis Solaris</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span className="text-[10px] font-bold text-primary uppercase">Volume Global</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ff0048" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ff0048" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorValueDark" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.5} />
                                                <stop offset="95%" stopColor="#00f2ff" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(5, 10, 20, 0.9)',
                                                borderRadius: '24px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                backdropFilter: 'blur(32px)',
                                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                                padding: '20px',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                                            formatter={(value) => [formatCurrency(value), 'Volume']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={theme === 'dark' ? "#00f2ff" : "#ff0048"}
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill={theme === 'dark' ? "url(#colorValueDark)" : "url(#colorValue)"}
                                            className="dark:filter dark:drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Distribution Card */}
                        <div className="solaris-glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col dark:border-white/5 dark:bg-white/[0.02]">
                            <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                                <PieIcon className="h-5 w-5 text-primary" />
                                Distribution
                            </h3>
                            <div className="flex-1 flex flex-col justify-center items-center">
                                <div className="relative w-48 h-48 mb-8">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100 dark:text-white/5" />
                                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray="502.4" strokeDashoffset={502.4 * (1 - (assetsRatio / 100))} className="text-primary dark:text-[#00f2ff] dark:filter dark:drop-shadow-[0_0_12px_rgba(0,242,255,0.4)]" strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold dark:text-white">{assetsRatio.toFixed(0)}%</span>
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest opacity-60">Actif</span>
                                    </div>
                                </div>
                                <div className="w-full space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-primary dark:bg-[#00f2ff]" />
                                            <span className="text-xs font-bold dark:text-white">Immobilier</span>
                                        </div>
                                        <span className="text-xs font-bold dark:text-white">{formatCurrency(totalAssetValue)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10" />
                                            <span className="text-xs font-bold dark:text-white">Liquidités</span>
                                        </div>
                                        <span className="text-xs font-bold dark:text-white">{formatCurrency(totalLiquidity)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Global Wallets Overview Section (Admin Only) */}
            {isAdmin && (
                <div className="bg-card border rounded-xl overflow-hidden shadow-sm animate-fade-in mt-8">
                    <div className="p-4 sm:p-6 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold text-sm sm:text-lg truncate">Suivi des Mandats (Trésorerie Régie)</h3>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                            <div className="text-left sm:text-right">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground leading-tight">Liquidité Totale</p>
                                <p className="text-sm font-bold text-primary whitespace-nowrap">
                                    {formatCurrency(wallets.reduce((sum, w) => sum + Number(w.balance), 0))}
                                </p>
                            </div>
                            <button
                                onClick={fetchWallets}
                                disabled={loadingWallets}
                                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
                            >
                                <History className={cn("h-4 w-4", loadingWallets && "animate-spin")} />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/10">
                                    <th className="px-6 py-4 text-left font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Bien Immobilier</th>
                                    <th className="px-6 py-4 text-right font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Solde Actuel (€)</th>
                                    <th className="px-6 py-4 text-center font-medium text-muted-foreground text-[10px] uppercase tracking-wider">État Trésorerie</th>
                                    <th className="px-6 py-4 text-right font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wallets.length > 0 ? (
                                    wallets.map((w) => {
                                        const bal = Number(w.balance);
                                        return (
                                            <tr key={w.id} className="border-b last:border-0 hover:bg-muted/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground">{w.property_name}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-medium">Mandat #{w.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={cn(
                                                        "font-bold text-base",
                                                        bal < 0 ? "text-[#ff0048]" : bal === 0 ? "text-muted-foreground" : "text-foreground"
                                                    )}>
                                                        {formatCurrency(bal)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {bal < 0 ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-[#ff0048] text-[10px] font-bold uppercase flex items-center gap-1 justify-center w-fit mx-auto animate-pulse">
                                                            Déficit critique
                                                        </span>
                                                    ) : bal === 0 ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold uppercase w-fit mx-auto">
                                                            Compte vide
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase w-fit mx-auto">
                                                            Solde Créditeur
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            to={`/dashboard/properties/${w.property}`}
                                                            className="p-2 rounded-lg bg-primary/5 text-primary hover:bg-primary/20 transition-colors"
                                                            title="Accéder à la gestion du bien"
                                                        >
                                                            <Building className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPropertyId(w.property.toString());
                                                                fetchStats(w.property.toString(), selectedYear);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            className="px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider hover:bg-muted transition-colors"
                                                        >
                                                            Filtrer Stats
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                            {loadingWallets ? (
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Wallet className="h-8 w-8 opacity-10" />
                                                    <p className="text-xs italic font-medium">Aucun portefeuille de régie trouvé.</p>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
