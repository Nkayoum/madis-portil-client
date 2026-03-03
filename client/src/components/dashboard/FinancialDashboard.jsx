import { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Sector
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Calendar, Loader2, Building, Percent, Filter, Wallet, History, Globe, Hammer, Box, Users, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { cn, formatCurrency } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import AnnualReport from './AnnualReport';

export default function FinancialDashboard({ isAdmin = false }) {
    const { theme } = useTheme();
    const { t } = useTranslation();
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



    const fetchWallets = useCallback(async () => {
        setLoadingWallets(true);
        try {
            const response = await api.get('/finance/wallets/');
            setWallets(response.data.results || []);
        } catch (err) {
            console.error("Failed to fetch wallets", err);
        } finally {
            setLoadingWallets(false);
        }
    }, []);

    const fetchStats = useCallback(async (propertyId, year) => {
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
    }, [showToast]);

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
    }, [isAdmin, fetchWallets, fetchStats, selectedYear]);

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
    /*
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
    */

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
            label_main: t('dashboard.stats.construction_volume'),
            label_volume: t('dashboard.stats.materials'),
            label_performance: t('dashboard.stats.labor')
        };
    } else if (dashboardMode === 'transactional') {
        const roi = trans.roi || 0;
        stats = {
            main_value: isEffectiveAdmin ? trans.net_capital_gain : trans.net_capital_gain, // Net Gain is prioritized
            volume: trans.sales_volume || 0,
            performance: roi,
            label_main: isEffectiveAdmin ? t('dashboard.stats.commissions') : t('dashboard.stats.capital_gain'),
            label_volume: isEffectiveAdmin ? t('dashboard.stats.sales_volume') : t('dashboard.stats.invested'), // Note: Investment is the "volume" here for the owner
            label_performance: isEffectiveAdmin ? t('dashboard.stats.marge') : t('dashboard.stats.roi')
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
            label_main: isEffectiveAdmin ? t('dashboard.stats.commissions') : t('dashboard.stats.net_cashflow'),
            label_volume: isEffectiveAdmin ? t('dashboard.stats.sales_volume') : t('dashboard.stats.total_revenue'),
            label_performance: isEffectiveAdmin ? t('dashboard.stats.marge') : t('dashboard.stats.yield')
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
    // const liquidityRatio = globalTotal > 0 ? (totalLiquidity / globalTotal) * 100 : 0;
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
                            {t('dashboard.modes.rental')}
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
                            {t('dashboard.modes.transactional')}
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
                                {t('dashboard.modes.construction')}
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
                            {t('dashboard.modes.reports')}
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
                            <option value="">{isEffectiveAdmin ? t('dashboard.filters.all_properties_admin') : t('dashboard.filters.all_my_properties')}</option>
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
                                <ShieldCheck className="h-3 w-3" /> {t('dashboard.stats.secure_data')}
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
                                <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-tighter">{t('dashboard.stats.optimal_performance')}</p>
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
                                        <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest opacity-60">{t('dashboard.charts.asset')}</span>
                                    </div>
                                </div>
                                <div className="w-full space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-primary" />
                                            <span className="text-xs font-bold">{t('dashboard.charts.real_estate')}</span>
                                        </div>
                                        <span className="text-xs font-black whitespace-nowrap">{formatCurrency(totalAssetValue, true)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10" />
                                            <span className="text-xs font-bold">{t('dashboard.charts.liquidity')}</span>
                                        </div>
                                        <span className="text-xs font-black whitespace-nowrap">{formatCurrency(totalLiquidity, true)}</span>
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
                                        {t('dashboard.charts.financial_evolution')}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase mt-1">{t('dashboard.charts.consolidated_data')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span className="text-[10px] font-bold text-primary uppercase">{t('dashboard.charts.global_volume')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[300px] sm:h-[400px] w-full">
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
                                {t('dashboard.charts.distribution')}
                            </h3>
                            <div className="flex-1 flex flex-col justify-center items-center">
                                <div className="relative w-48 h-48 mb-8">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100 dark:text-white/5" />
                                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray="502.4" strokeDashoffset={502.4 * (1 - (assetsRatio / 100))} className="text-primary dark:text-[#00f2ff] dark:filter dark:drop-shadow-[0_0_12px_rgba(0,242,255,0.4)]" strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold dark:text-white">{assetsRatio.toFixed(0)}%</span>
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest opacity-60">{t('dashboard.charts.asset')}</span>
                                    </div>
                                </div>
                                <div className="w-full space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-primary dark:bg-[#00f2ff]" />
                                            <span className="text-xs font-bold dark:text-white">{t('dashboard.charts.real_estate')}</span>
                                        </div>
                                        <span className="text-xs font-black dark:text-white">{formatCurrency(totalAssetValue)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10" />
                                            <span className="text-xs font-bold dark:text-white">{t('dashboard.charts.liquidity')}</span>
                                        </div>
                                        <span className="text-xs font-black dark:text-white">{formatCurrency(totalLiquidity)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Global Wallets Overview Section (Admin Only) */}
            {isAdmin && (
                <div className="solaris-glass border dark:border-white/5 dark:bg-black/40 rounded-[2rem] overflow-hidden shadow-sm animate-fade-in mt-8">
                    <div className="p-6 sm:p-8 border-b dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg tracking-tight">{t('dashboard.treasury.title')}</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40 leading-none mt-1">Surveillance des mandats</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 shrink-0 bg-white/40 dark:bg-white/5 p-3 sm:p-0 rounded-2xl sm:bg-transparent">
                            <div className="text-left sm:text-right">
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-tight mb-1">{t('dashboard.treasury.total_liquidity')}</p>
                                <p className="text-lg font-black text-primary whitespace-nowrap">
                                    {formatCurrency(wallets.reduce((sum, w) => sum + Number(w.balance), 0))}
                                </p>
                            </div>
                            <button
                                onClick={fetchWallets}
                                disabled={loadingWallets}
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50 shadow-sm"
                            >
                                <History className={cn("h-4 w-4", loadingWallets && "animate-spin")} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Card View (shown only on mobile) */}
                    <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
                        {wallets.length > 0 ? (
                            wallets.map((w) => {
                                const bal = Number(w.balance);
                                return (
                                    <div key={w.id} className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-black text-xs uppercase tracking-tight">{w.property_name}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">{t('dashboard.treasury.mandate')}{w.id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "font-black text-sm",
                                                    bal < 0 ? "text-[#ff0048]" : bal === 0 ? "text-muted-foreground" : "text-foreground"
                                                )}>
                                                    {formatCurrency(bal)}
                                                </p>
                                                <div className="mt-1">
                                                    {bal < 0 ? (
                                                        <span className="text-[8px] font-black uppercase text-[#ff0048] flex items-center gap-1 justify-end animate-pulse">
                                                            <AlertCircle className="h-2.5 w-2.5" /> {t('dashboard.treasury.critical_deficit')}
                                                        </span>
                                                    ) : (
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase tracking-widest",
                                                            bal === 0 ? "text-muted-foreground" : "text-emerald-500"
                                                        )}>
                                                            {bal === 0 ? t('dashboard.treasury.empty_account') : t('dashboard.treasury.creditor_balance')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                to={`/dashboard/properties/${w.property}`}
                                                className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-white/5 border dark:border-white/10 text-[9px] font-black uppercase tracking-widest"
                                            >
                                                <Building className="h-3.5 w-3.5" />
                                                Voir Bien
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setSelectedPropertyId(w.property.toString());
                                                    fetchStats(w.property.toString(), selectedYear);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="flex-1 h-10 rounded-xl bg-black dark:bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg"
                                            >
                                                Filtrer
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-12 text-center opacity-30">
                                <Wallet className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Aucun mandat</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View (hidden on mobile) */}
                    <div className="hidden md:block overflow-x-auto no-scrollbar">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b dark:border-white/5 bg-muted/10">
                                    <th className="px-6 py-4 text-left font-black text-muted-foreground text-[10px] uppercase tracking-[0.2em]">{t('dashboard.treasury.property_col')}</th>
                                    <th className="px-6 py-4 text-right font-black text-muted-foreground text-[10px] uppercase tracking-[0.2em]">{t('dashboard.treasury.balance_col')}</th>
                                    <th className="px-6 py-4 text-center font-black text-muted-foreground text-[10px] uppercase tracking-[0.2em]">{t('dashboard.treasury.status_col')}</th>
                                    <th className="px-6 py-4 text-right font-black text-muted-foreground text-[10px] uppercase tracking-[0.2em]">{t('dashboard.treasury.actions_col')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wallets.length > 0 ? (
                                    wallets.map((w) => {
                                        const bal = Number(w.balance);
                                        return (
                                            <tr key={w.id} className="border-b last:border-0 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/[0.03] transition-colors group">
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground">{w.property_name}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5 opacity-40">{t('dashboard.treasury.mandate')}{w.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <span className={cn(
                                                        "font-black text-base transition-colors",
                                                        bal < 0 ? "text-[#ff0048]" : bal === 0 ? "text-muted-foreground" : "text-foreground"
                                                    )}>
                                                        {formatCurrency(bal)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    {bal < 0 ? (
                                                        <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-[#ff0048] text-[9px] font-black uppercase flex items-center gap-1.5 justify-center w-fit mx-auto border border-rose-100 dark:border-rose-500/20 animate-pulse">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {t('dashboard.treasury.critical_deficit')}
                                                        </span>
                                                    ) : bal === 0 ? (
                                                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-muted-foreground text-[9px] font-black uppercase tracking-widest w-fit mx-auto border border-slate-200 dark:border-white/5">
                                                            {t('dashboard.treasury.empty_account')}
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest w-fit mx-auto border border-emerald-100 dark:border-emerald-500/10">
                                                            {t('dashboard.treasury.creditor_balance')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                                                        <Link
                                                            to={`/dashboard/properties/${w.property}`}
                                                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border dark:border-white/10 text-primary hover:bg-white hover:shadow-md transition-all"
                                                            title={t('dashboard.treasury.access_property')}
                                                        >
                                                            <Building className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPropertyId(w.property.toString());
                                                                fetchStats(w.property.toString(), selectedYear);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            className="h-9 px-4 rounded-xl bg-black dark:bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-zinc-800 transition-all"
                                                        >
                                                            {t('dashboard.treasury.filter_stats')}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground">
                                            {loadingWallets ? (
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto opacity-10" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-4 opacity-20">
                                                    <Wallet className="h-12 w-12" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('dashboard.treasury.no_wallets')}</p>
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
