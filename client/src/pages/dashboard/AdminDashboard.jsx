import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import {
    Users, Building, FileText, MessageSquare,
    ArrowRight, Activity, TrendingUp, Wallet,
    Clock, HardHat
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FinancialDashboard from '@/components/dashboard/FinancialDashboard';
import { formatDistanceToNow, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

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
        { label: 'Clients', value: stats.usersCount, icon: Users, color: 'text-primary', bg: 'bg-primary/10', link: '/dashboard/users' },
        { label: 'Biens', value: stats.propertiesCount, icon: Building, color: 'text-primary', bg: 'bg-primary/10', link: '/dashboard/properties' },
        { label: 'Tickets', value: stats.ticketsCount, icon: MessageSquare, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20', link: '/dashboard/tickets' },
        { label: 'Documents', value: stats.documentsCount, icon: FileText, color: 'text-primary', bg: 'bg-primary/10', link: '/dashboard/documents' },
    ];

    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">
                        Portail <span className="text-primary">Admin</span>
                    </h1>
                    <p className="text-muted-foreground">Gestion globale et suivi financier MaDis.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/dashboard/users/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                        <Users className="mr-2 h-4 w-4" />
                        Client
                    </Link>
                    <Link to="/dashboard/properties/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                        <Building className="mr-2 h-4 w-4" />
                        Bien
                    </Link>
                </div>
            </div>

            <div className="flex border-b">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 px-6 text-sm font-medium transition-colors relative ${activeTab === 'overview' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Vue d'ensemble
                    {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />}
                </button>
                <button
                    onClick={() => setActiveTab('finance')}
                    className={`pb-4 px-6 text-sm font-medium transition-colors relative ${activeTab === 'finance' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Finance & Commissions
                    </div>
                    {activeTab === 'finance' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />}
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((card, idx) => (
                            <Link key={idx} to={card.link}
                                className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                                        <h3 className="text-3xl font-bold mt-2">{card.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-lg ${card.bg}`}>
                                        <card.icon className={`h-6 w-6 ${card.color}`} />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                    Voir la liste
                                    <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 mt-8">
                        {/* Recent Activity */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Activité récente
                            </h3>
                            <div className="space-y-4">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((act) => (
                                        <div key={act.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-all group">
                                            <div className={`h-10 w-10 min-w-[40px] rounded-lg flex items-center justify-center ${act.bg} ${act.color}`}>
                                                <act.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{act.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{act.subtitle}</p>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {act.date}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground border border-dashed rounded-lg">
                                        <Activity className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="text-sm">Aucune activité récente.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Users */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Derniers inscrits
                            </h3>
                            <div className="space-y-4">
                                {recentUsers.length > 0 ? (
                                    recentUsers.map((u) => (
                                        <Link
                                            key={u.id}
                                            to={`/dashboard/users/${u.id}/edit`}
                                            className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-all group"
                                        >
                                            <div className="h-10 w-10 min-w-[40px] rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
                                                {u.first_name?.[0] || u.username?.[0] || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{u.first_name} {u.last_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                            </div>
                                            <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                                {u.role === 'ADMIN_MADIS' ? 'Admin' : u.role === 'CHEF_CHANTIER' ? 'Chantier' : 'Client'}
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground border border-dashed rounded-lg">
                                        <Users className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="text-sm">Aucun client inscrit récemment.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-card rounded-xl border p-6 shadow-sm animate-in fade-in zoom-in-95">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">Suivi Financier Global</h2>
                        <p className="text-muted-foreground">Visualisez les performances de tous les biens et les commissions MaDis.</p>
                    </div>
                    <FinancialDashboard isAdmin={true} />
                </div>
            )}
        </div>
    );
}
