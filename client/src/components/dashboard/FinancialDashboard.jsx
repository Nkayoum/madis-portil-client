import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Sector
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Calendar, Loader2, Building, Percent, Filter, Wallet, History, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

export default function FinancialDashboard({ isAdmin = false }) {
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(false);
    const [data, setData] = useState(null);
    const [wallets, setWallets] = useState([]);
    const [loadingWallets, setLoadingWallets] = useState(false);
    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

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

    return (
        <div className="space-y-6">
            {/* Mode Switcher & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex bg-muted p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setDashboardMode('rental')}
                        className={cn(
                            "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
                            dashboardMode === 'rental'
                                ? "bg-background shadow-sm text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Calendar className="h-4 w-4" />
                        Gestion Locative
                    </button>
                    <button
                        onClick={() => setDashboardMode('transactional')}
                        className={cn(
                            "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
                            dashboardMode === 'transactional'
                                ? "bg-background shadow-sm text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <TrendingUp className="h-4 w-4" />
                        Investissement Achat-Revente
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/30 p-2 rounded-xl border">
                    <div className="flex items-center gap-3 px-2 border-r border-muted last:border-0">
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
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <div className="flex gap-1">
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => handleYearChange({ target: { value: year } })}
                                    className={cn(
                                        "px-2.5 py-1 text-[10px] font-black rounded-md transition-all",
                                        selectedYear === year
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted'
                                    )}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats - Dynamic based on mode & role */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {dashboardMode === 'rental' ? (
                    <>
                        <div className="bg-card border rounded-xl p-6 shadow-sm border-l-4 border-l-primary">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-black text-muted-foreground">
                                    {isEffectiveAdmin ? "CA MaDis (Commissions)" : "Cashflow Net"}
                                </span>
                                <TrendingUp className={cn("h-4 w-4", rental.net_revenue >= 0 ? "text-emerald-500" : "text-[#ff0048]")} />
                            </div>
                            <div className={cn("text-2xl font-black", rental.net_revenue >= 0 ? "text-emerald-500" : "text-[#ff0048]")}>
                                {rental.net_revenue?.toLocaleString()}€
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {isEffectiveAdmin ? "Recettes brutes de gestion" : "Après frais de gestion & charges"}
                            </p>
                        </div>

                        <div className="bg-card border rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-black text-muted-foreground">
                                    {isEffectiveAdmin ? "Volume Loyers Managés" : "Loyers Bruts"}
                                </span>
                                <DollarSign className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-2xl font-black">{rental.total_inflow?.toLocaleString()}€</div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {isEffectiveAdmin ? "Flux total collecté via MaDis" : "Recettes totales sur la période"}
                            </p>
                        </div>

                        <div className="bg-card border rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-black text-muted-foreground">
                                    {isEffectiveAdmin ? "Marge d'Intermédiation" : "Rendement Locatif"}
                                </span>
                                <Percent className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-2xl font-black text-primary">
                                {isEffectiveAdmin ? ((rental.net_revenue / (rental.total_inflow || 1)) * 100).toFixed(1) : rental.yield}%
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {isEffectiveAdmin ? "Part MaDis sur le volume de loyers" : `Annuel proratisé (Objectif: ${rental.theoretical_yield}%)`}
                            </p>
                        </div>

                        <div className="bg-card border rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-black text-muted-foreground">
                                    {isEffectiveAdmin ? "Dépenses de Maintenance" : "Charges de Gestion"}
                                </span>
                                <TrendingDown className="h-4 w-4 text-[#ff0048]" />
                            </div>
                            <div className="text-2xl font-black text-[#ff0048]">{rental.total_outflow?.toLocaleString()}€</div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {isEffectiveAdmin ? "Entretien & Taxes (Volume Global)" : "Entretien, Taxes & MaDis"}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-card border rounded-xl p-6 shadow-sm border-l-4 border-l-emerald-500">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-black text-muted-foreground">
                                    {isEffectiveAdmin ? "Commissions sur Ventes" : "Plus-value Nette"}
                                </span>
                                <TrendingUp className={cn("h-4 w-4", trans.net_capital_gain >= 0 ? "text-emerald-500" : "text-[#ff0048]")} />
                            </div>
                            <div className={cn("text-2xl font-black", trans.net_capital_gain >= 0 ? "text-emerald-500" : "text-[#ff0048]")}>
                                {trans.net_capital_gain?.toLocaleString()}€
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {isEffectiveAdmin ? "Revenu MaDis sur transactions" : "Bénéfice réalisé ou potentiel sur vente"}
                            </p>
                        </div>

                        <div className="bg-card border rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-black text-muted-foreground">
                                    {isEffectiveAdmin ? "Volume de Vente Global" : "Capital Investi"}
                                </span>
                                <Building className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-2xl font-black">{isEffectiveAdmin ? trans.sales_volume?.toLocaleString() : trans.investment_total?.toLocaleString()}€</div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {isEffectiveAdmin ? "Montant total des transactions" : "Valeur d'acquisition totale"}
                            </p>
                        </div>

                        <div className="bg-card border rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-black text-muted-foreground">
                                    {isEffectiveAdmin ? "Commissions Encaissées" : "Volume de Revente"}
                                </span>
                                <Globe className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-2xl font-black text-primary">
                                {isEffectiveAdmin ? trans.net_capital_gain?.toLocaleString() : trans.sales_volume?.toLocaleString()}€
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {isEffectiveAdmin ? "Total des gains transactionnels" : "Prix de revente total réalisé"}
                            </p>
                        </div>

                        <div className="bg-card border rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-black text-muted-foreground">
                                    {isEffectiveAdmin ? "Taux de Commission Moyen" : "ROI Transactionnel"}
                                </span>
                                <Percent className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-black text-emerald-500">{trans.roi}%</div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {isEffectiveAdmin ? "Marge moyenne sur volume" : "Marge nette sur investissement"}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Evolution Chart */}
                <div className="bg-card border rounded-xl p-6 shadow-sm lg:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Évolution Financière
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <div className="flex items-center gap-1.5">
                                <div className="h-3 w-3 rounded-full bg-[#10B981]" />
                                <span className="text-[#10B981]">Revenus</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-3 w-3 rounded-full bg-[#ff0048]" />
                                <span className="text-[#ff0048]">Dépenses</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.monthly_data}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff0048" stopOpacity={0.05} />
                                        <stop offset="95%" stopColor="#ff0048" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748B' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748B' }}
                                    tickFormatter={(value) => `${value}€`}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#64748B', strokeWidth: 1, strokeDasharray: '5 5' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 border rounded-lg shadow-lg text-xs space-y-1">
                                                    <p className="font-bold mb-1">{p.month}</p>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">
                                                            {isEffectiveAdmin
                                                                ? (dashboardMode === 'rental' ? 'Comm. Gestion:' : 'Comm. Vente:')
                                                                : 'Recettes:'}
                                                        </span>
                                                        <span className="font-bold text-blue-500">{payload[0].value.toLocaleString()}€</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">
                                                            {isEffectiveAdmin
                                                                ? (dashboardMode === 'rental' ? 'Dépenses Gérés:' : 'Frais Vente:')
                                                                : 'Dépenses:'}
                                                        </span>
                                                        <span className="font-bold text-[#ff0048]">{payload[1]?.value?.toLocaleString()}€</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4 border-t pt-1">
                                                        <span className="text-muted-foreground">MARGE MaDis:</span>
                                                        <span className={cn("font-bold", (payload[0].value - (payload[1]?.value || 0)) >= 0 ? "text-emerald-500" : "text-[#ff0048]")}>
                                                            {(payload[0].value - (payload[1]?.value || 0)).toLocaleString()}€
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={dashboardMode === 'rental' ? 'rental_revenues' : 'trans_revenues'}
                                    stroke={isEffectiveAdmin ? "#3b82f6" : "#10B981"}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                    name={isEffectiveAdmin
                                        ? (dashboardMode === 'rental' ? "Commissions Gestion" : "Commissions Vente")
                                        : "Recettes"}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={dashboardMode === 'rental' ? 'rental_expenses' : 'trans_expenses'}
                                    stroke="#ff0048"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorExp)"
                                    name={isEffectiveAdmin
                                        ? (dashboardMode === 'rental' ? "Dépenses Opérationnelles" : "Frais de Transition")
                                        : "Dépenses"}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-8 flex items-center gap-2">
                        {dashboardMode === 'rental' ? (
                            <TrendingUp className="h-5 w-5 text-primary" />
                        ) : (
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                        )}
                        {dashboardMode === 'rental' ? 'Rentabilité Locative par Bien' : 'ROI Transactionnel par Bien'}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.property_stats} layout="vertical" margin={{ left: -20, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fontSize: 10, fill: '#64748B' }}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 border rounded-lg shadow-lg text-xs space-y-1">
                                                    <p className="font-bold mb-1">{p.name}</p>
                                                    {dashboardMode === 'rental' ? (
                                                        <>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">Rendement Réel:</span>
                                                                <span className="font-bold text-[#10B981]">{p.yield}%</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">Objectif (Cible):</span>
                                                                <span className="font-bold text-blue-500">{p.theoretical_yield}%</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">{isEffectiveAdmin ? 'Marge sur Volume:' : 'ROI Transactionnel:'}</span>
                                                                <span className="font-bold text-emerald-500">{p.transactional_roi}%</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">{isEffectiveAdmin ? 'Commission MaDis:' : 'Plus-value:'}</span>
                                                                <span className="font-bold text-emerald-500">{p.capital_gain?.toLocaleString()}€</span>
                                                            </div>
                                                        </>
                                                    )}
                                                    <p className="text-muted-foreground mt-1 border-t pt-1 italic">
                                                        {isEffectiveAdmin ? 'Volume de Vente:' : 'Investi:'} {p.investment.toLocaleString()}€
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }}
                                />
                                {dashboardMode === 'rental' ? (
                                    <>
                                        <Bar
                                            dataKey="yield"
                                            name="Rendement Réel"
                                            fill="#10B981"
                                            radius={[0, 4, 4, 0]}
                                            barSize={12}
                                        />
                                        <Bar
                                            dataKey="theoretical_yield"
                                            name="Objectif (Théorique)"
                                            fill="#3b82f6"
                                            radius={[0, 4, 4, 0]}
                                            barSize={12}
                                        />
                                    </>
                                ) : (
                                    <Bar
                                        dataKey="transactional_roi"
                                        name="ROI Transactionnel"
                                        fill="#10B981"
                                        radius={[0, 4, 4, 0]}
                                        barSize={18}
                                    />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {data.property_stats?.length === 0 && (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border border-dashed rounded-lg">
                            Pas de données disponibles.
                        </div>
                    )}
                </div>
            </div>

            {/* Global Wallets Overview Section (Admin Only) */}
            {isAdmin && (
                <div className="bg-card border rounded-xl overflow-hidden shadow-sm animate-fade-in">
                    <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold text-lg">Suivi des Mandats (Trésorerie Régie)</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-black text-muted-foreground leading-tight">Liquidité Totale</p>
                                <p className="text-sm font-black text-primary">
                                    {wallets.reduce((sum, w) => sum + Number(w.balance), 0).toLocaleString()}€
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
                    <div className="overflow-x-auto">
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
                                                        "font-black text-base",
                                                        bal < 0 ? "text-[#ff0048]" : bal === 0 ? "text-muted-foreground" : "text-foreground"
                                                    )}>
                                                        {bal.toLocaleString()}€
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {bal < 0 ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-[#ff0048] text-[10px] font-black uppercase flex items-center gap-1 justify-center w-fit mx-auto animate-pulse">
                                                            Déficit critique
                                                        </span>
                                                    ) : bal === 0 ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase w-fit mx-auto">
                                                            Compte vide
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase w-fit mx-auto">
                                                            Solde Créditeur
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <div className="p-4 bg-muted/10 border-t border-dashed text-center">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                            La liquidité totale représente la somme des fonds propres appartenant aux propriétaires et détenus par MaDis.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
