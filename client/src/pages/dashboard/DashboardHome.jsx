import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import AdminDashboard from './AdminDashboard';
import FinancialDashboard from '@/components/dashboard/FinancialDashboard';
import DecisionModal from '@/components/dashboard/DecisionModal';
import {
    Building, FileText, MessageSquare, HardHat,
    ArrowRight, Clock, Activity, Wallet, History,
    AlertCircle, ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardHome() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [statsData, setStatsData] = useState({
        propertiesCount: 0,
        documentsCount: 0,
        ticketsCount: 0,
        constructionCount: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);

    if (user?.role === 'ADMIN_MADIS') {
        return <AdminDashboard />;
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
        { label: 'Mes Biens', value: statsData.propertiesCount, icon: Building, color: 'text-primary', bg: 'bg-primary/10', link: '/dashboard/properties' },
        { label: 'Documents', value: statsData.documentsCount, icon: FileText, color: 'text-primary', bg: 'bg-primary/10', link: '/dashboard/documents' },
        { label: 'Tickets', value: statsData.ticketsCount, icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/20', link: '/dashboard/tickets' },
        { label: 'Chantiers', value: statsData.constructionCount, icon: HardHat, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/20', link: '/dashboard/construction' },
    ];

    return (
        <div className="space-y-6">
            {/* Hero Welcome Section */}
            <div className="bg-card rounded-xl border p-6 shadow-sm">
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        Bonjour, <span className="text-primary">{user?.first_name || 'Client'}</span>
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        Voici un aperçu en temps réel de votre patrimoine immobilier et de vos activités en cours.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/contact" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                            Contacter l'agence
                        </Link>
                        {user?.role !== 'CLIENT' && (
                            <Link to="/dashboard/properties/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                                Ajouter un bien
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* No Properties Alert for Clients */}
            {user?.role === 'CLIENT' && statsData.propertiesCount === 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-foreground">Bienvenue sur votre espace MaDis</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Vous n'avez pas encore de bien immobilier associé à votre compte.
                                Pour commencer à gérer votre patrimoine ou suivre vos investissements, vous pouvez :
                            </p>
                            <div className="flex flex-wrap gap-3 mt-4">
                                <Link
                                    to="/dashboard/marketplace"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    Explorer le Marketplace
                                </Link>
                                <Link
                                    to="/dashboard/tickets/new"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-input rounded-lg text-sm font-bold hover:bg-accent transition-all shadow-sm"
                                >
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    Signaler un oubli
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex border-b mb-6">
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
                        Ma Finance
                    </div>
                    {activeTab === 'finance' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />}
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat, idx) => (
                            <Link key={idx} to={stat.link}
                                className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 p-6"
                            >
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                                <div className="flex items-baseline justify-between pt-4">
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <div className={`p-2 rounded-full ${stat.bg}`}>
                                        <ArrowRight className={`h-4 w-4 ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 mt-8">
                        {/* Recent Activity */}
                        <div className="md:col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6">
                                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Activité Récente
                                </h3>
                            </div>
                            <div className="p-6 pt-0 grid gap-4">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${activity.bg} ${activity.color}`}>
                                                <activity.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{activity.title}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {activity.date}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                                        <History className="h-10 w-10 mb-3 opacity-20" />
                                        <p className="text-sm">Aucune activité récente pour le moment.</p>
                                        <p className="text-xs mt-1">Retrouvez ici les mises à jour de vos dossiers.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Help */}
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center text-center justify-center">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Besoin d'aide ?</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Notre équipe est disponible pour répondre à vos questions.
                            </p>
                            <Link to="/dashboard/tickets/new" className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                                Ouvrir un ticket
                            </Link>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-card rounded-xl border p-6 shadow-sm animate-in fade-in zoom-in-95">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">Finances & Rendements</h2>
                        <p className="text-muted-foreground">Suivez vos revenus locatifs et la performance de votre patrimoine.</p>
                    </div>
                    <FinancialDashboard />
                </div>
            )}

            {user?.role !== 'ADMIN_MADIS' && <DecisionModal />}
        </div>
    );
}
