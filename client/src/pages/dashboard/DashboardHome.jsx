import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import AdminDashboard from './AdminDashboard';
import ChefChantierDashboard from './ChefChantierDashboard';
import FinancialDashboard from '../../components/dashboard/FinancialDashboard';
import DecisionModal from '../../components/dashboard/DecisionModal';
import {
    Building, FileText, MessageSquare, HardHat,
    ArrowRight, Clock, Activity, Wallet, History,
    AlertCircle, ShoppingBag, Plus, LayoutDashboard, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export default function DashboardHome() {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [statsData, setStatsData] = useState({
        propertiesCount: 0,
        documentsCount: 0,
        ticketsCount: 0,
        constructionCount: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 gap-6 animate-fade-in">
                <Loader2 className="h-12 w-12 animate-spin text-black opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Initialisation de votre espace...</p>
            </div>
        );
    }

    if (user?.role === 'ADMIN_MADIS') {
        return <AdminDashboard />;
    }

    if (user?.role === 'CHEF_CHANTIER') {
        return <ChefChantierDashboard />;
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [props, docs, tickets, sites] = await Promise.all([
                    api.get('/properties/'),
                    api.get('/documents/'),
                    api.get('/tickets/'),
                    api.get('/construction/sites/')
                ]);

                setStatsData({
                    propertiesCount: props.data.count || props.data.results?.length || 0,
                    documentsCount: docs.data.count || docs.data.results?.length || 0,
                    ticketsCount: tickets.data.count || tickets.data.results?.length || 0,
                    constructionCount: sites.data.count || sites.data.results?.length || 0
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
                        icon: FileText,
                        color: 'text-primary',
                        bg: 'bg-primary/10'
                    });
                });

                (sites.data.results || []).slice(0, 3).forEach(s => {
                    activities.push({
                        id: `site-${s.id}`,
                        title: `Chantier "${s.name}": ${s.progress_percentage}%`,
                        rawDate: s.updated_at || s.created_at,
                        icon: HardHat,
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
                            date: `Il y a ${formatDistanceToNow(act.dateObj, { locale: fr })}`
                        }))
                );

            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            }
        };

        if (user && user.role !== 'ADMIN_MADIS') {
            fetchDashboardData();
        }
    }, [user]);

    const stats = [
        { label: 'Mes Biens', value: statsData.propertiesCount, icon: Building, color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20', link: '/dashboard/properties' },
        { label: 'Documents', value: statsData.documentsCount, icon: FileText, color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20', link: '/dashboard/documents' },
        { label: 'Tickets', value: statsData.ticketsCount, icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/40', link: '/dashboard/tickets' },
        { label: 'Chantiers', value: statsData.constructionCount, icon: HardHat, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/40', link: '/dashboard/construction' },
    ];

    return (
        <div className="space-y-12 pb-24 animate-fade-in">
            {/* Solaris Hero Welcome Section */}
            <div className="relative overflow-hidden rounded-[3rem] solaris-glass p-12 border border-white/20 dark:border-white/5 dark:bg-black/40 shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Activity className="h-64 w-64 text-black dark:text-white" />
                </div>

                <div className="relative z-10 max-w-3xl">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-4 py-1.5 rounded-full bg-black dark:bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em]">
                            Tableau de bord
                        </span>
                        <div className="h-px w-12 bg-black/10 dark:bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-[0.9]">
                        {statsData.propertiesCount > 0 ? (
                            <>Votre <span className="text-primary">Patrimoine</span></>
                        ) : (
                            <>Bienvenue, <span className="text-primary">{user?.first_name || 'Partenaire'}</span></>
                        )}
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed mb-10">
                        {statsData.propertiesCount > 0
                            ? "Analyse en temps réel de vos actifs immobiliers et de la performance de vos investissements MaDis."
                            : "Votre écosystème immobilier MaDis est prêt. Voici l'état actuel de vos futures opérations."
                        }
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link to="/contact" className="h-12 px-8 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center">
                            Assistance Directe
                        </Link>
                        {user?.role !== 'CLIENT' && (
                            <Link to="/dashboard/properties/new" className="h-12 px-8 rounded-2xl bg-black dark:bg-primary dark:solaris-neon-pink text-white text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                                <Plus className="h-4 w-4" />
                                Nouveau Bien
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* No Properties Alert for Clients (High Fidelity) */}
            {user?.role === 'CLIENT' && statsData.propertiesCount === 0 && (
                <div className="solaris-glass rounded-[2.5rem] p-10 border-2 border-primary/20 dark:bg-primary/10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner">
                            <AlertCircle className="h-10 w-10 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black tracking-tighter mb-3">Portfolio en attente d'activation</h3>
                            <p className="text-muted-foreground font-medium leading-relaxed max-w-2xl">
                                Votre espace est prêt, mais aucun actif n'est encore lié à votre compte.
                                Parcourez nos opportunités ou contactez-nous pour l'intégration de vos mandats existants.
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
                                <Link
                                    to="/dashboard/marketplace"
                                    className="h-11 px-8 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    Investir maintenant
                                </Link>
                                <Link
                                    to="/dashboard/tickets/new"
                                    className="h-11 px-8 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                                >
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    Signaler un oubli
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="flex justify-start no-scrollbar [&::-webkit-scrollbar]:hidden shrink-0"
            >
                <div style={{ display: 'flex', width: 'max-content' }} className="p-1.5 solaris-glass dark:bg-black/60 dark:border-white/5 rounded-[1.5rem] border border-white/40 shadow-xl flex">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={cn(
                            "px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 flex items-center gap-2",
                            activeTab === 'overview'
                                ? "bg-black text-white shadow-2xl dark:solaris-neon-blue dark:bg-white/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/40"
                        )}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Vue d'ensemble
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={cn(
                            "px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 flex items-center gap-2",
                            activeTab === 'finance'
                                ? "bg-black text-white shadow-2xl dark:solaris-neon-blue dark:bg-white/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/40"
                        )}
                    >
                        <Wallet className="h-4 w-4" />
                        Intelligence Financière
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div className="space-y-12 animate-in fade-in duration-500">
                    {/* Stats Grid - Premium Solaris Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat, idx) => (
                            <Link key={idx} to={stat.link}
                                className="group relative overflow-hidden rounded-[2.5rem] solaris-glass border border-white/20 dark:border-white/5 dark:bg-black/40 p-8 shadow-sm transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl hover:border-primary/20 dark:hover:solaris-neon-blue"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className={cn("p-4 rounded-[1.25rem] shadow-inner", stat.bg)}>
                                        <stat.icon className={cn("h-6 w-6", stat.color)} />
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
                                    <div className="text-4xl font-black tracking-tighter">{stat.value}</div>
                                </div>
                                <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                    <stat.icon className="h-32 w-32 text-black" />
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="grid gap-12 md:grid-cols-3">
                        {/* Recent Activity - Solaris Industrial Feed */}
                        <div className="md:col-span-2 space-y-6">
                            <h3 className="text-xl font-black tracking-tighter flex items-center gap-3 px-2">
                                <Activity className="h-5 w-5 text-primary" />
                                FLUX OPÉRATIONNEL
                            </h3>
                            <div className="solaris-glass rounded-[2.5rem] border border-white/20 dark:border-white/5 dark:bg-white/[0.02] overflow-hidden shadow-sm divide-y divide-black/5 dark:divide-white/5">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((act) => (
                                        <div key={act.id} className="flex items-center gap-6 p-6 transition-colors hover:bg-white/40 dark:hover:bg-white/5 group">
                                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform font-mono font-black", act.bg, act.color)}>
                                                <act.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm tracking-tight mb-0.5 truncate uppercase">{act.title}</p>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 font-mono opacity-60">
                                                        <Clock className="h-3 w-3" />
                                                        {act.date}
                                                    </span>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-black/10 dark:bg-white/10" />
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">Signal Système</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
                                        <History className="h-12 w-12 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Registre Statique</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Help Card - Premium Solaris Style */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black tracking-tighter px-2 uppercase">Assistance</h3>
                            <div className="solaris-glass rounded-[2.5rem] border border-white/20 dark:border-white/5 dark:bg-zinc-900 shadow-sm flex flex-col items-center text-center justify-center p-8 relative overflow-hidden group dark:solaris-neon-pink">
                                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                    <MessageSquare className="h-24 w-24" />
                                </div>

                                <div className="h-16 w-16 rounded-[1.25rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                                    <MessageSquare className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tighter mb-4 relative z-10 dark:text-white">Besoin d'expertise ?</h3>
                                <p className="text-sm text-muted-foreground font-medium mb-8 leading-relaxed relative z-10">
                                    Un conseiller MaDis est prêt à vous accompagner dans vos projets.
                                </p>
                                <Link to="/contact" className="w-full h-12 rounded-2xl bg-black dark:bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-primary/90 transition-all shadow-xl relative z-10 flex items-center justify-center">
                                    Ouvrir un ticket
                                </Link>

                                <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 w-full">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Temps de réponse estimé : &lt; 2h</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="solaris-glass rounded-[3rem] border border-white/20 dark:border-white/5 p-12 shadow-2xl animate-in fade-in zoom-in-95 duration-700">
                    <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Intelligence MaDis</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter">Flux Financier Holistique</h2>
                        </div>
                        <p className="text-muted-foreground font-medium max-w-sm">
                            Performance temps réel de votre portfolio consolidé.
                        </p>
                    </div>
                    <FinancialDashboard />
                </div>
            )}

            {user?.role !== 'ADMIN_MADIS' && <DecisionModal />}
        </div>
    );
}
