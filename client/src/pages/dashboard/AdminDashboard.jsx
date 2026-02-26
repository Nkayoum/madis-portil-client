import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import {
    Users, Building, FileText, MessageSquare,
    ArrowRight, Activity, TrendingUp, Wallet,
    Clock, HardHat, Plus, LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FinancialDashboard from '../../components/dashboard/FinancialDashboard';
import { formatDistanceToNow, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        usersCount: 0,
        propertiesCount: 0,
        ticketsCount: 0,
        documentsCount: 0
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [users, props, tickets, docs] = await Promise.all([
                    api.get('/auth/users/'),
                    api.get('/properties/'),
                    api.get('/tickets/'),
                    api.get('/documents/')
                ]);

                // Update Stats
                setStats({
                    usersCount: users.data.count || users.data.results?.length || 0,
                    propertiesCount: props.data.count || props.data.results?.length || 0,
                    ticketsCount: tickets.data.count || tickets.data.results?.length || 0,
                    documentsCount: docs.data.count || docs.data.results?.length || 0,
                });

                // Recent Users (last 5)
                const allUsers = users.data.results || [];
                setRecentUsers(
                    [...allUsers]
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 5)
                );

                // Process Recent Activity (Combine Tickets, Docs, Properties)
                const activities = [];

                (tickets.data.results || []).slice(0, 5).forEach(t => {
                    activities.push({
                        id: `ticket-${t.id}`,
                        title: `Ticket: ${t.subject}`,
                        subtitle: `Mis à jour par ${t.created_by_name || 'Admin'}`,
                        rawDate: t.updated_at || t.created_at,
                        icon: MessageSquare,
                        color: 'text-orange-500',
                        bg: 'bg-orange-100 dark:bg-orange-900/20'
                    });
                });

                (docs.data.results || []).slice(0, 5).forEach(d => {
                    activities.push({
                        id: `doc-${d.id}`,
                        title: `Nouveau document: ${d.title}`,
                        subtitle: `Ajouté pour ${d.property_name || 'Général'}`,
                        rawDate: d.created_at,
                        icon: FileText,
                        color: 'text-primary',
                        bg: 'bg-primary/10'
                    });
                });

                (props.data.results || []).slice(0, 5).forEach(p => {
                    activities.push({
                        id: `prop-${p.id}`,
                        title: `Propriété: ${p.name}`,
                        subtitle: `Statut: ${p.status_display || p.status}`,
                        rawDate: p.created_at,
                        icon: Building,
                        color: 'text-green-500',
                        bg: 'bg-green-100 dark:bg-green-900/20'
                    });
                });

                setRecentActivity(
                    activities
                        .filter(act => act.rawDate)
                        .map(act => ({ ...act, dateObj: new Date(act.rawDate) }))
                        .filter(act => isValid(act.dateObj))
                        .sort((a, b) => b.dateObj - a.dateObj)
                        .slice(0, 6)
                        .map(act => ({
                            ...act,
                            date: `Il y a ${formatDistanceToNow(act.dateObj, { locale: fr })}`
                        }))
                );

            } catch (err) {
                console.error("Failed to fetch admin stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const statCards = [
        { label: 'Clients', value: stats.usersCount, icon: Users, color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20', link: '/dashboard/users' },
        { label: 'Biens', value: stats.propertiesCount, icon: Building, color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20', link: '/dashboard/properties' },
        { label: 'Tickets', value: stats.ticketsCount, icon: MessageSquare, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40', link: '/dashboard/tickets' },
        { label: 'Documents', value: stats.documentsCount, icon: FileText, color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20', link: '/dashboard/documents' },
    ];

    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-12 pb-24 animate-fade-in">
            {/* Standard Solaris Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-black/5 dark:border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Administration MaDis</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-tight md:leading-none">
                        Portail <span className="opacity-40">Global</span>
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/dashboard/users/new" className="h-11 md:h-12 px-6 md:px-8 rounded-2xl solaris-glass border border-slate-200 dark:border-white/10 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-sm">
                        <Users className="h-4 w-4" />
                        Inscrire Client
                    </Link>
                    <Link to="/dashboard/properties/new" className="h-11 md:h-12 px-6 md:px-8 rounded-2xl bg-black text-white dark:bg-primary dark:solaris-neon-pink text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-2xl">
                        <Plus className="h-4 w-4" />
                        Nouveau Bien
                    </Link>
                </div>
            </div>

            {/* Solaris Tab Switcher */}
            <div className="flex justify-center md:justify-start overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex p-1.5 solaris-glass dark:bg-black/40 dark:border-white/5 rounded-[1.5rem] border border-white/40 shadow-xl whitespace-nowrap">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={cn(
                            "px-4 sm:px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 flex items-center gap-2",
                            activeTab === 'overview'
                                ? "bg-black text-white shadow-2xl dark:solaris-neon-blue dark:bg-white/10 dark:text-white"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5"
                        )}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Aperçu Holistique
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={cn(
                            "px-4 sm:px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 flex items-center gap-2",
                            activeTab === 'finance'
                                ? "bg-black text-white shadow-2xl dark:solaris-neon-blue dark:bg-white/5 dark:text-white"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5"
                        )}
                    >
                        <Wallet className="h-4 w-4" />
                        Gestion Commerciale
                    </button>
                </div>
            </div>

            {
                activeTab === 'overview' ? (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        {/* Stats Grid - Premium Solaris Cards */}
                        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {statCards.map((card, idx) => (
                                <Link key={idx} to={card.link}
                                    className="group relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] solaris-glass border border-white/20 dark:border-white/5 p-6 md:p-8 shadow-sm transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl hover:border-primary/20 dark:hover:solaris-neon-blue"
                                >
                                    <div className="flex justify-between items-start mb-6 md:mb-8">
                                        <div className={cn("p-3 md:p-4 rounded-[1rem] md:rounded-[1.25rem] shadow-inner", card.bg)}>
                                            <card.icon className={cn("h-5 w-5 md:h-6 md:w-6", card.color)} />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{card.label}</p>
                                        <div className="text-3xl md:text-4xl font-black tracking-tighter">{card.value}</div>
                                    </div>
                                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                        <card.icon className="h-24 w-24 md:h-32 md:w-32 text-black" />
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="grid gap-8 md:gap-12 grid-cols-1 lg:grid-cols-2">
                            {/* Recent Activity - Solaris Industrial Style */}
                            <div className="space-y-6">
                                <h3 className="text-lg md:text-xl font-black tracking-tighter flex items-center gap-3 px-2">
                                    <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                                    FLUX OPÉRATIONNEL
                                </h3>
                                <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] border border-white/20 dark:border-white/5 overflow-hidden shadow-sm divide-y divide-black/5 dark:divide-white/5">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.map((act) => (
                                            <div key={act.id} className="flex items-center gap-4 md:gap-6 p-4 md:p-6 transition-colors hover:bg-white/40 dark:hover:bg-white/[0.03] group">
                                                <div className={cn("h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform font-mono font-black", act.bg, act.color)}>
                                                    <act.icon className="h-4.5 w-4.5 md:h-5 md:w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-xs md:text-sm tracking-tight mb-0.5 truncate uppercase">{act.title}</p>
                                                    <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase opacity-60 truncate">{act.subtitle}</p>
                                                </div>
                                                <div className="text-[9px] md:text-[10px] font-black text-muted-foreground/40 whitespace-nowrap flex items-center gap-1 md:gap-1.5 font-mono">
                                                    <Clock className="h-3 w-3" />
                                                    {act.date.split(' ').slice(-2).join(' ')}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
                                            <Activity className="h-12 w-12 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Aucun événement critique</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Users - Premium Solaris Contacts */}
                            <div className="space-y-6">
                                <h3 className="text-lg md:text-xl font-black tracking-tighter flex items-center gap-3 px-2">
                                    <Users className="h-4 w-4 md:h-5 md:w-5 text-primary dark:text-[#ff00e5]" />
                                    NOUVEAUX ENTRANTS
                                </h3>
                                <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] border border-white/20 dark:border-white/5 overflow-hidden shadow-sm divide-y divide-black/5 dark:divide-white/5">
                                    {recentUsers.length > 0 ? (
                                        recentUsers.map((u) => (
                                            <Link
                                                key={u.id}
                                                to={`/dashboard/users/${u.id}/edit`}
                                                className="flex items-center gap-4 md:gap-6 p-4 md:p-6 transition-all hover:bg-white/40 dark:hover:bg-white/[0.03] group"
                                            >
                                                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-zinc-900 flex items-center justify-center font-black text-white text-xs md:text-sm shadow-xl group-hover:scale-110 transition-transform">
                                                    {u.first_name?.[0] || u.username?.[0] || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-xs md:text-sm tracking-tight mb-0.5 truncate">{u.first_name} {u.last_name}</p>
                                                    <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase opacity-60 truncate font-mono">{u.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2 md:gap-4">
                                                    <div className="px-2 md:px-3 py-1 rounded-full bg-primary/10 text-primary text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-primary/10">
                                                        {u.role === 'ADMIN_MADIS' ? 'Admin' : u.role === 'CHEF_CHANTIER' ? 'Chantier' : 'Client'}
                                                    </div>
                                                    <ArrowRight className="h-3.5 w-3.5 md:h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all -translate-x-1 md:-translate-x-2 group-hover:translate-x-0" />
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
                                            <Users className="h-12 w-12 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Registre statique</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="solaris-glass rounded-[2rem] md:rounded-[3rem] border border-white/20 dark:border-white/5 dark:bg-black/60 p-6 md:p-12 shadow-2xl animate-in fade-in zoom-in-95 duration-700">
                        <div className="mb-8 md:mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="h-4 w-4 text-primary" />
                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-primary">Intelligence MaDis</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Flux Financier Holistique</h2>
                            </div>
                            <p className="text-sm md:text-base text-muted-foreground font-medium max-w-sm">
                                Consolidation de tous les actifs sous gestion et commissions agence.
                            </p>
                        </div>
                        <FinancialDashboard isAdmin={true} />
                    </div>
                )
            }
        </div >
    );
}
