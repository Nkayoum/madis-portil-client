import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import AdminDashboard from './AdminDashboard';
import ChefChantierDashboard from './ChefChantierDashboard';
import {
    Building, TrendingUp, HelpCircle, ArrowRight, Loader2, Plus, LayoutDashboard, ShoppingBag, FolderOpen, MessageSquare, Construction, History, MoreHorizontal, Landmark, Wallet, Globe, Sparkles, Activity, Clock
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, isValid } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import DecisionModal from '../../components/dashboard/DecisionModal';
import FinancialDashboard from '../../components/dashboard/FinancialDashboard';

export default function DashboardHome() {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [properties, setProperties] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showDecisionModal, setShowDecisionModal] = useState(false);

    const dateLocale = i18n.language === 'fr' ? fr : enUS;
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        if (user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') {
            setLoading(false); // Set local loading to false if role is admin/chef
            return;
        }

        const fetchDashboardData = async () => {
            try {
                const [props, docs, tickets, sites] = await Promise.all([
                    api.get('/properties/'),
                    api.get('/documents/'),
                    api.get('/tickets/'),
                    api.get('/construction/sites/')
                ]);

                setProperties(props.data.results || []);
                setStats({
                    properties_count: props.data.count || props.data.results?.length || 0,
                    docs_count: docs.data.count || docs.data.results?.length || 0,
                    tickets_count: tickets.data.count || tickets.data.results?.length || 0,
                    construction_count: sites.data.count || sites.data.results?.length || 0
                });

                // Process Recent Activity
                const activities = [];

                (tickets.data.results || []).slice(0, 3).forEach(t => {
                    activities.push({
                        id: `ticket-${t.id}`,
                        title: `Ticket "${t.subject}" mis à jour`,
                        rawDate: t.updated_at || t.created_at,
                        icon: MessageSquare,
                        color: 'text-orange-500',
                        bg: 'bg-orange-100 dark:bg-orange-900/20'
                    });
                });

                (docs.data.results || []).slice(0, 3).forEach(d => {
                    activities.push({
                        id: `doc-${d.id}`,
                        title: `Document "${d.title}" ajouté`,
                        rawDate: d.created_at,
                        icon: FolderOpen,
                        color: 'text-primary',
                        bg: 'bg-primary/10'
                    });
                });

                (sites.data.results || []).slice(0, 3).forEach(s => {
                    activities.push({
                        id: `site-${s.id}`,
                        title: `Chantier "${s.name}": ${s.progress_percentage}%`,
                        rawDate: s.updated_at || s.created_at,
                        icon: Construction,
                        color: 'text-yellow-500',
                        bg: 'bg-yellow-100 dark:bg-yellow-900/20'
                    });
                });

                setRecentActivity(
                    activities
                        .filter(act => act.rawDate)
                        .map(act => ({ ...act, dateObj: new Date(act.rawDate) }))
                        .filter(act => isValid(act.dateObj))
                        .sort((a, b) => b.dateObj - a.dateObj)
                        .slice(0, 5)
                        .map(act => ({
                            ...act,
                            date: `Il y a ${formatDistanceToNow(act.dateObj, { locale: dateLocale })}`
                        }))
                );

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, i18n.language]);

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 animate-in fade-in duration-700">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                    {t('common.initialization')}
                </p>
            </div>
        );
    }

    if (user?.role === 'ADMIN_MADIS') {
        return <AdminDashboard />;
    }

    if (user?.role === 'CHEF_CHANTIER') {
        return <ChefChantierDashboard />;
    }


    return (
        <div className="space-y-8 md:space-y-10 pb-16 animate-fade-in">
            {/* Solaris Hero Welcome Section */}
            <div className="relative overflow-hidden rounded-[2rem] solaris-glass p-6 md:p-10 border border-white/20 dark:border-white/5 dark:bg-black/40 shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none hidden sm:block">
                    <Activity className="h-48 w-48 text-black dark:text-white" />
                </div>

                <div className="relative z-10 max-w-3xl">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-6 animate-slide-up">
                            <div className="h-[1px] w-8 bg-primary/30" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
                                {t('nav.dashboard')}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight leading-[0.9] mb-4 md:mb-6 animate-slide-up">
                            <Trans i18nKey="dashboard.home.hero.title_wealth" components={{ primary: <span className="text-primary" /> }} />
                        </h1>

                        <div className="max-w-2xl animate-slide-up [animation-delay:200ms]">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                                <Trans
                                    i18nKey="dashboard.home.hero.welcome"
                                    values={{ name: user?.first_name }}
                                    components={{
                                        br: <br className="sm:hidden" />,
                                        primary: <span className="text-primary" />
                                    }}
                                />
                            </h2>
                            <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                                {properties.length > 0
                                    ? t('dashboard.home.hero.subtitle_realtime')
                                    : t('dashboard.home.hero.subtitle_ready')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 md:pt-0 animate-slide-up [animation-delay:400ms]">
                        <button className="h-14 px-8 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-2xl flex items-center gap-3 active:scale-95">
                            <Sparkles className="h-4 w-4" />
                            {t('dashboard.home.hero.help_btn')}
                        </button>
                        <Link to="/dashboard/properties/new" className="h-14 px-8 rounded-2xl solaris-glass border border-white/20 font-black text-xs uppercase tracking-widest transition-all hover:bg-primary hover:text-white flex items-center gap-3 active:scale-95">
                            <Plus className="h-4 w-4" />
                            {t('properties.add_new')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* No Properties Alert for Clients (High Fidelity) */}
            {user?.role === 'CLIENT' && properties.length === 0 && (
                <div className="text-center py-20 px-6 solaris-glass rounded-[3rem] border-dashed flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-8 relative">
                        <LayoutDashboard className="h-10 w-10 text-primary/40" />
                        <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping duration-[3000ms]" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter mb-4">{t('dashboard.home.no_assets.title')}</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed font-medium opacity-70 mb-10">
                        {t('dashboard.home.no_assets.desc')}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/dashboard/marketplace" className="h-12 px-8 bg-black text-white dark:bg-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            {t('properties.visit_marketplace')}
                        </Link>
                        <button className="h-12 px-8 solaris-glass border border-primary/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-primary/5 flex items-center gap-2">
                            <Landmark className="h-3.5 w-3.5" />
                            {t('common.invest')}
                        </button>
                        <button className="h-12 px-8 solaris-glass border border-primary/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-primary/5 flex items-center gap-2">
                            <HelpCircle className="h-3.5 w-3.5" />
                            {t('common.report')}
                        </button>
                    </div>
                </div>
            )}

            <div
                style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="flex justify-start no-scrollbar [&::-webkit-scrollbar]:hidden shrink-0"
            >
                <div className="flex items-center gap-4 p-1.5 solaris-glass rounded-2xl w-fit mb-4 md:mb-8 animate-slide-up [animation-delay:600ms]">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'overview' ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t('dashboard.home.tabs.overview')}
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'finance' ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t('dashboard.home.tabs.finance')}
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div className="space-y-10 animate-in fade-in duration-500">
                    {/* Stats Grid - Premium Solaris Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up [animation-delay:800ms]">
                        {[
                            { label: t('nav.properties'), value: properties.length, icon: Building, color: 'text-primary' },
                            { label: t('dashboard.stats.documents'), value: stats?.docs_count || 0, icon: FolderOpen, color: 'text-amber-500' },
                            { label: t('nav.messaging'), value: stats?.tickets_count || 0, icon: MessageSquare, color: 'text-blue-500' },
                            { label: t('nav.construction'), value: properties.filter(p => p.management_type === 'CONSTRUCTION').length, icon: Construction, color: 'text-emerald-500' },
                        ].map((item, i) => (
                            <div key={i} className="solaris-glass p-5 md:p-6 rounded-[2rem] border-white/10 relative group overflow-hidden transition-all hover:scale-[1.02]">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 opacity-50">{item.label}</span>
                                    <div className="flex items-end justify-between">
                                        <span className="text-3xl font-black tracking-tight">{item.value}</span>
                                        <div className={cn("p-2 rounded-xl bg-slate-50 dark:bg-white/5 transition-all group-hover:scale-110", item.color)}>
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {/* Recent Activity - Solaris Industrial Feed */}
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-lg font-bold tracking-tight flex items-center gap-2.5 px-1 uppercase">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                {t('dashboard.home.recent_activity.title')}
                            </h3>
                            <div className="solaris-glass rounded-[1.5rem] border border-white/20 dark:border-white/5 overflow-hidden shadow-sm divide-y divide-black/5 dark:divide-white/5">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((act) => (
                                        <div key={act.id} className="flex items-center gap-4 p-5 transition-colors hover:bg-white/40 dark:hover:bg-white/5 group">
                                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform", act.bg, act.color)}>
                                                <act.icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[13px] tracking-tight mb-0.5 truncate uppercase">{act.title}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1 font-mono opacity-60">
                                                        <Clock className="h-3 w-3" />
                                                        {act.date}
                                                    </span>
                                                    <span className="h-1 w-1 rounded-full bg-black/10 dark:bg-white/10" />
                                                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest opacity-60">{t('common.system')}</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                                        <History className="h-10 w-10 mb-3" />
                                        <p className="text-[9px] font-bold uppercase tracking-widest">{t('dashboard.home.recent_activity.no_activity')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Help Card - Premium Solaris Style */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold tracking-tight px-1 uppercase">{t('dashboard.home.assistance.title')}</h3>
                            <div className="solaris-glass rounded-[1.5rem] border border-white/20 dark:border-white/5 dark:bg-zinc-900 shadow-sm flex flex-col items-center text-center justify-center p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                    <MessageSquare className="h-20 w-20" />
                                </div>

                                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/20">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight mb-3 relative z-10 dark:text-white">{t('dashboard.home.assistance.need_expertise')}</h3>
                                <p className="text-[13px] text-muted-foreground font-medium mb-6 leading-relaxed relative z-10">
                                    {t('dashboard.home.assistance.description')}
                                </p>
                                <Link to="/contact" className="w-full h-11 rounded-xl bg-black dark:bg-primary text-white text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md relative z-10 flex items-center justify-center">
                                    {t('dashboard.home.assistance.open_ticket_btn')}
                                </Link>

                                <div className="mt-5 pt-5 border-t border-black/5 dark:border-white/5 w-full">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">{t('dashboard.home.assistance.estimated_response')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">{t('dashboard.home.finance.badge')}</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t('dashboard.home.finance.title')}</h2>
                            <p className="text-muted-foreground font-medium">{t('dashboard.home.finance.subtitle')}</p>
                        </div>
                    </div>
                    <FinancialDashboard />
                </div>
            )}

            {user?.role !== 'ADMIN_MADIS' && <DecisionModal />}
        </div>
    );
}
