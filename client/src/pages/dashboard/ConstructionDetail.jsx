import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/axios';
import {
    ArrowLeft, HardHat, Calendar, MapPin, Map as MapIcon,
    Image, FileText, Loader2, CheckCircle2, Clock,
    AlertCircle, Edit, User as UserIcon, Sun, Cloud,
    CloudRain, Wind, Snowflake, Zap, Plus,
    DollarSign, Trash2, Ban, Pause, Download, Upload, File
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';

export default function ConstructionDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [site, setSite] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get initial tab from URL query param
    const queryTab = new URLSearchParams(location.search).get('tab');
    const [activeTab, setActiveTab] = useState(queryTab || 'overview');

    useEffect(() => {
        fetchSiteDetails();
    }, [id]);

    const fetchSiteDetails = async () => {
        try {
            const [siteRes, milestonesRes, journalRes, docsRes, transRes] = await Promise.all([
                api.get(`/construction/sites/${id}/`),
                api.get(`/construction/milestones/?site=${id}`),
                api.get(`/construction/journal/?site=${id}`),
                api.get(`/documents/?site=${id}`),
                api.get(`/finance/transactions/?site=${id}`)
            ]);
            setSite(siteRes.data);
            setMilestones(milestonesRes.data.results || milestonesRes.data || []);
            setJournalEntries(journalRes.data.results || journalRes.data || []);
            setDocuments(docsRes.data.results || docsRes.data || []);
            setTransactions(transRes.data.results || transRes.data || []);
        } catch (err) {
            setError('Impossible de charger le chantier.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'EN_COURS': return { color: 'text-primary', bg: 'bg-primary/10', label: 'En cours', icon: Clock };
            case 'TERMINE': return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20', label: 'Terminé', icon: CheckCircle2 };
            case 'SUSPENDU': return { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/20', label: 'Suspendu', icon: Pause };
            case 'PREPARATION': return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20', label: 'Préparation', icon: HardHat };
            case 'ANNULE': return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20', label: 'Annulé', icon: Ban };
            default: return { color: 'text-muted-foreground', bg: 'bg-muted', label: status, icon: HardHat };
        }
    };

    const getWeatherIcon = (weather) => {
        switch (weather) {
            case 'ENSOLEILLE': return Sun;
            case 'NUAGEUX': return Cloud;
            case 'PLUIE': return CloudRain;
            case 'VENT': return Wind;
            case 'NEIGE': return Snowflake;
            case 'ORAGE': return Zap;
            default: return Cloud;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !site) {
        return (
            <div className="space-y-4">
                <Link to="/dashboard/construction" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux chantiers
                </Link>
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                    {error || "Chantier non trouvé."}
                </div>
            </div>
        );
    }

    const status = getStatusConfig(site.status);

    return (
        <div className="space-y-6 animate-fade-in">
            <Link to="/dashboard/construction" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group w-fit">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour aux chantiers
            </Link>

            {/* Header */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{site.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{site.address}, {site.city} {site.postal_code}</span>
                            </div>
                            <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                <status.icon className="h-3 w-3" />
                                <span>{status.label}</span>
                            </span>
                        </div>
                    </div>
                    {site.status !== 'SUSPENDU' && (
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-muted-foreground mb-2">
                                Progression globale
                            </span>
                            <div className="flex items-center gap-3">
                                <div className="w-48 h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                                        style={{ width: `${site.progress_percentage}%` }}
                                    />
                                </div>
                                <span className="font-bold text-xl">{site.progress_percentage}%</span>
                            </div>
                        </div>
                    )}
                    {site.status === 'ANNULE' ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm">
                            <Ban className="h-4 w-4" />
                            CHANTIER ANNULÉ
                        </div>
                    ) : (user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && (
                        <div className="flex flex-wrap gap-2">
                            {site.status === 'EN_COURS' && (
                                <button
                                    onClick={async () => {
                                        if (window.confirm('Voulez-vous vraiment suspendre ce chantier ?')) {
                                            await api.patch(`/construction/sites/${id}/`, { status: 'SUSPENDU' });
                                            fetchSiteDetails();
                                        }
                                    }}
                                    className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 h-9 px-3"
                                >
                                    <Pause className="mr-2 h-3 w-3" /> Suspendre
                                </button>
                            )}
                            {(site.status === 'SUSPENDU' || site.status === 'PREPARATION') && (
                                <button
                                    onClick={async () => {
                                        await api.patch(`/construction/sites/${id}/`, { status: 'EN_COURS' });
                                        fetchSiteDetails();
                                    }}
                                    className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 h-9 px-3"
                                >
                                    <Clock className="mr-2 h-3 w-3" /> (Re)Démarrer
                                </button>
                            )}
                            <button
                                onClick={async () => {
                                    if (window.confirm('Voulez-vous vraiment annuler ce chantier ? Cette action est irréversible.')) {
                                        await api.patch(`/construction/sites/${id}/`, { status: 'ANNULE' });
                                        fetchSiteDetails();
                                    }
                                }}
                                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 h-9 px-3"
                            >
                                <Ban className="mr-2 h-3 w-3" /> Annuler
                            </button>
                            <button
                                onClick={async () => {
                                    if (window.confirm('ATTENTION: Voulez-vous vraiment SUPPRIMER définitivement ce chantier et toutes ses données associées ?')) {
                                        await api.delete(`/construction/sites/${id}/`);
                                        showToast({ message: 'Chantier supprimé.', type: 'success' });
                                        navigate('/dashboard/construction');
                                    }
                                }}
                                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-9 px-3 shadow-sm"
                            >
                                <Trash2 className="mr-2 h-3 w-3" /> Supprimer
                            </button>
                            <Link
                                to={`/dashboard/construction/${id}/edit`}
                                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3"
                            >
                                <Edit className="mr-1.5 h-3.5 w-3.5" />
                                Modifier
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex gap-6">
                    {['overview', 'journal', 'photos', 'documents', 'finance'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-medium border-b-2 transition-all px-1 ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                }`}
                        >
                            {tab === 'overview' ? 'Vue d\'ensemble' : tab === 'journal' ? 'Journal' : tab === 'photos' ? 'Photos' : tab === 'documents' ? 'Documents' : 'Finance'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-2">
                {activeTab === 'overview' && (
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-6">
                            {/* Description */}
                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Description
                                </h3>
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {site.description || "Aucune description fournie pour ce chantier."}
                                </p>
                            </div>

                            {/* Milestones (Jalons) */}
                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    Jalons du chantier
                                </h3>

                                {user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER' ? (
                                    <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                                        <div className="text-sm text-muted-foreground italic">
                                            Dates obligatoires et responsables assignés.
                                        </div>
                                        {site.status !== 'SUSPENDU' && (
                                            <Link
                                                to={`/dashboard/construction/${id}/milestones`}
                                                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 py-1"
                                            >
                                                <Edit className="mr-1.5 h-3.5 w-3.5" />
                                                Gérer les jalons
                                            </Link>
                                        )}
                                    </div>
                                ) : null}

                                <div className="space-y-3">
                                    {milestones.length > 0 ? (
                                        milestones.map((milestone) => {
                                            const isOverdue = !milestone.completed && new Date(milestone.end_date) < new Date().setHours(0, 0, 0, 0);
                                            return (
                                                <div
                                                    key={milestone.id}
                                                    className={cn(
                                                        "flex items-start gap-3 p-4 rounded-lg border bg-muted/5 transition-all",
                                                        milestone.completed ? "opacity-60" : "hover:border-primary/30",
                                                        isOverdue && !milestone.completed && "border-red-500/30 bg-red-500/5"
                                                    )}
                                                >
                                                    <button
                                                        onClick={async () => {
                                                            if (user?.role !== 'ADMIN_MADIS' && user?.role !== 'CHEF_CHANTIER') return;
                                                            if (site.status === 'SUSPENDU') return;
                                                            try {
                                                                await api.patch(`/construction/milestones/${milestone.id}/`, {
                                                                    completed: !milestone.completed
                                                                });
                                                                fetchSiteDetails();
                                                            } catch (err) {
                                                                console.error('Failed to toggle milestone', err);
                                                            }
                                                        }}
                                                        disabled={user?.role !== 'ADMIN_MADIS' && user?.role !== 'CHEF_CHANTIER' || site.status === 'SUSPENDU'}
                                                        className={cn(
                                                            "h-5 w-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0",
                                                            milestone.completed
                                                                ? 'bg-primary border-primary text-white'
                                                                : site.status === 'SUSPENDU'
                                                                    ? 'border-muted-foreground/20 cursor-not-allowed'
                                                                    : 'border-muted-foreground/30 hover:border-primary cursor-pointer'
                                                        )}
                                                    >
                                                        {milestone.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={cn("text-sm font-semibold leading-tight", milestone.completed ? 'text-muted-foreground line-through' : 'text-foreground')}>
                                                                {milestone.description}
                                                            </p>
                                                            {isOverdue && !milestone.completed && (
                                                                <span className="text-[10px] font-bold text-red-600 bg-red-600/10 px-1.5 py-0.5 rounded shrink-0">RETARD</span>
                                                            )}
                                                            {milestone.completed && (
                                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">TERMINE</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {milestone.end_date ? format(new Date(milestone.end_date), 'd MMM yyyy', { locale: fr }) : 'Non déterm.'}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <UserIcon className="h-3 w-3" />
                                                                {milestone.responsible || 'Non renseigné'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic p-4 text-center border border-dashed rounded-lg">
                                            Aucun jalon défini pour ce chantier.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Budget Card */}
                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Suivi Budgétaire
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Budget consommé</p>
                                            <p className="text-2xl font-bold">
                                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(site.budget_spent || 0)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Budget total</p>
                                            <p className="font-semibold">
                                                {site.budget ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(site.budget) : 'Non défini'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden border">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-1000 ease-out rounded-full",
                                                    site.budget_consumed_percentage > 90 ? "bg-red-500" : site.budget_consumed_percentage > 70 ? "bg-yellow-500" : "bg-green-500"
                                                )}
                                                style={{ width: `${Math.min(100, site.budget_consumed_percentage || 0)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            <span>0%</span>
                                            <span>{site.budget_consumed_percentage || 0}% UTILISÉ</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                    {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && (
                                        <div className="pt-2">
                                            <Link
                                                to={`/dashboard/finance/transactions/new?site=${id}`}
                                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                            >
                                                <Plus className="h-3 w-3" /> Ajouter une dépense pour ce chantier
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <MapIcon className="h-5 w-5 text-primary" />
                                    Détails logistiques
                                </h3>
                                <dl className="space-y-4 text-sm">
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <dt className="text-muted-foreground">Chef de chantier</dt>
                                        <dd className="font-semibold text-primary text-right">
                                            {site.chef_de_chantier_name || 'Non assigné'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <dt className="text-muted-foreground">Date de début</dt>
                                        <dd className="font-medium">
                                            {site.start_date ? format(new Date(site.start_date), 'd MMM yyyy', { locale: fr }) : '-'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <dt className="text-muted-foreground">Date de fin prévue</dt>
                                        <dd className="font-medium">
                                            {site.end_date ? format(new Date(site.end_date), 'd MMM yyyy', { locale: fr }) : '-'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <dt className="text-muted-foreground">Ville</dt>
                                        <dd className="font-medium">{site.city || '-'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'journal' && (
                    <div className="space-y-6">
                        {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && site.status !== 'SUSPENDU' && (
                            <div className="flex justify-end">
                                <Link
                                    to={`/dashboard/construction/${id}/journal/new`}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouvelle entrée
                                </Link>
                            </div>
                        )}

                        {journalEntries.length > 0 ? (
                            <div className="space-y-4">
                                {journalEntries.map((entry) => {
                                    const WeatherIcon = getWeatherIcon(entry.weather);
                                    return (
                                        <div key={entry.id} className="bg-card border rounded-xl overflow-hidden shadow-sm">
                                            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold capitalize">
                                                            {format(new Date(entry.date), 'EEEE d MMMM yyyy', { locale: fr })}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <UserIcon className="h-3 w-3" /> Par {entry.author_name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && site.status !== 'SUSPENDU' && (
                                                        <Link
                                                            to={`/dashboard/construction/journal/${entry.id}/edit`}
                                                            className="text-muted-foreground hover:text-primary transition-colors p-1"
                                                            title="Modifier le rapport"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    )}
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border text-xs font-medium">
                                                        <WeatherIcon className="h-3.5 w-3.5 text-primary" />
                                                        <span className="capitalize">{entry.weather?.toLowerCase() || 'Météo'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border text-xs font-medium">
                                                        <UserIcon className="h-3.5 w-3.5 text-primary" />
                                                        <span>{entry.workers_count} ouvriers</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                    {entry.content}
                                                </p>
                                                {entry.photos && entry.photos.length > 0 && (
                                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {entry.photos.map((photo) => (
                                                            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border">
                                                                <img
                                                                    src={photo.image}
                                                                    alt={photo.caption || "Photo de chantier"}
                                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                                                    onClick={() => window.open(photo.image, '_blank')}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-card border border-dashed rounded-xl p-12 text-center">
                                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Journal vide</h3>
                                <p className="text-muted-foreground max-w-md mx-auto text-sm">
                                    Aucune entrée n'a encore été ajoutée au journal de ce chantier.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'photos' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {journalEntries.flatMap(e => e.photos || []).length > 0 ? (
                                journalEntries.flatMap(e => e.photos || []).map((photo) => (
                                    <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-all">
                                        <img
                                            src={photo.image}
                                            alt={photo.caption}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-white text-[10px] font-medium line-clamp-1">{photo.caption || "Sans légende"}</p>
                                            <p className="text-white/70 text-[8px]">{format(new Date(photo.created_at), 'd MMM yyyy', { locale: fr })}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full bg-card border border-dashed rounded-xl p-12 text-center">
                                    <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <Image className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Galerie Photos vide</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto text-sm">
                                        Les photos ajoutées via le journal de chantier apparaîtront ici.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-6">
                        {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && (
                            <div className="flex justify-end">
                                <Link
                                    to={`/dashboard/documents/new?siteId=${id}&propertyId=${site?.property_id || site?.project_property_id}`}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Ajouter un document
                                </Link>
                            </div>
                        )}

                        {documents.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="bg-card border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-colors group">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                                <File className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold truncate mb-1">{doc.title}</h4>
                                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{doc.description || "Aucune description"}</p>
                                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span className="capitalize px-1.5 py-0.5 rounded bg-muted font-medium">
                                                        {doc.category?.toLowerCase() || 'Document'}
                                                    </span>
                                                    <span>{format(new Date(doc.uploaded_at), 'd MMM yyyy', { locale: fr })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t flex justify-end">
                                            <button
                                                onClick={() => window.open(doc.file, '_blank')}
                                                className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                                            >
                                                <Download className="h-3 w-3" /> Télécharger
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-card border border-dashed rounded-xl p-12 text-center">
                                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <File className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Aucun document technique</h3>
                                <p className="text-muted-foreground max-w-md mx-auto text-sm">
                                    Les plans, factures et autres documents techniques apparaîtront ici.
                                </p>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'finance' && (
                    <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Budget Breakdown Chart */}
                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Répartition des Dépenses
                                </h3>
                                <div className="h-[300px] w-full">
                                    {Object.keys(site.budget_by_category || {}).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(site.budget_by_category).map(([key, value]) => ({
                                                        name: key === 'MATERIAUX' ? 'Matériaux' : key === 'MAIN_D_OEUVRE' ? 'Main d\'œuvre' : key === 'SERVICES' ? 'Services' : key,
                                                        value: parseFloat(value)
                                                    }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {[
                                                        '#0ea5e9', // Blue (Matériaux)
                                                        '#f59e0b', // Amber (Main d'œuvre)
                                                        '#10b981', // Emerald (Services)
                                                        '#6366f1', // Indigo (Other)
                                                        '#a855f7'  // Purple (Other)
                                                    ].map((color, index) => (
                                                        <Cell key={`cell-${index}`} fill={color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    formatter={(value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                                            <DollarSign className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">Aucune donnée de dépense</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Budget Summary Card */}
                            <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-center">
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-bold">Budget Consommé</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-primary">
                                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(site.budget_spent || 0)}
                                            </span>
                                            <span className="text-lg text-muted-foreground font-medium">
                                                / {site.budget ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(site.budget) : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {Object.entries(site.budget_by_category || {}).map(([key, value], index) => {
                                            const label = key === 'MATERIAUX' ? 'Matériaux' : key === 'MAIN_D_OEUVRE' ? 'Main d\'œuvre' : key === 'SERVICES' ? 'Services' : key;
                                            const colors = ['bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-purple-500'];
                                            const percentage = site.budget_spent > 0 ? (parseFloat(value) / site.budget_spent) * 100 : 0;

                                            return (
                                                <div key={key} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs font-bold uppercase">
                                                        <span>{label}</span>
                                                        <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)}</span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-1000", colors[index % colors.length])}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transactions List */}
                        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Historique des Transactions</h3>
                                {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && (
                                    <Link
                                        to={`/dashboard/finance/transactions/new?site=${id}`}
                                        className="inline-flex items-center justify-center rounded-md text-xs font-bold uppercase transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4"
                                    >
                                        <Plus className="mr-2 h-3.5 w-3.5" /> Ajouter une dépense
                                    </Link>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Catégorie</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4 text-right">Montant</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y border-t">
                                        {transactions.length > 0 ? (
                                            transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                        {format(new Date(tx.date), 'dd/MM/yyyy')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-muted border">
                                                            {tx.category_display || tx.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground line-clamp-1">
                                                        {tx.description || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400">
                                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(tx.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && (
                                                            <Link
                                                                to={`/dashboard/finance/transactions/${tx.id}/edit?site=${id}`}
                                                                className="text-primary hover:text-primary/80 transition-colors p-1"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground italic">
                                                    Aucune transaction enregistrée pour ce chantier.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
