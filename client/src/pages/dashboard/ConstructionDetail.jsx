import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/axios';
import {
    ArrowLeft, HardHat, Calendar, MapPin, Map as MapIcon,
    Image, FileText, Loader2, CheckCircle2, Clock,
    AlertCircle, Edit, User as UserIcon, Sun, Cloud,
    CloudRain, Wind, Snowflake, Zap, Plus,
    DollarSign, Trash2, Ban, Pause, Download, Upload, File,
    Layout, Users, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import UploadDocumentModal from '../../components/dashboard/UploadDocumentModal';
import JournalEntryModal from '../../components/dashboard/JournalEntryModal';
import EditJournalEntryModal from '../../components/dashboard/EditJournalEntryModal';

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
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const [isEditJournalModalOpen, setIsEditJournalModalOpen] = useState(false);
    const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState('');
    const [selectedEntryId, setSelectedEntryId] = useState(null);

    // Get initial tab from URL query param
    const queryTab = new URLSearchParams(location.search).get('tab');
    const [activeTab, setActiveTab] = useState(queryTab || 'overview');

    const formatCurrency = (value, includeCurrency = true) => {
        if (typeof value !== 'number') value = parseFloat(value) || 0;
        return new Intl.NumberFormat('fr-FR', {
            style: includeCurrency ? 'currency' : 'decimal',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

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
            <div className="flex flex-col items-center justify-center p-32 gap-6 animate-fade-in">
                <Loader2 className="h-12 w-12 animate-spin text-black opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Chargement de la console de supervision...</p>
            </div>
        );
    }

    if (error || !site) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
                <Link to="/dashboard/construction" className="flex items-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black transition-all mb-6 group">
                    <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                    Retour aux chantiers
                </Link>
                <div className="solaris-glass rounded-[1.5rem] p-8 border-none shadow-lg text-red-600 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-bold text-[11px] uppercase tracking-widest">{error || "Chantier non trouvé."}</span>
                </div>
            </div>
        );
    }

    const status = getStatusConfig(site.status);

    return (
        <div className="space-y-10 animate-fade-in pb-8 md:pb-16">
            <Link to="/dashboard/construction" className="flex items-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black transition-all group w-fit">
                <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                Retour aux chantiers
            </Link>

            {/* Header Solaris Style */}
            <div className="solaris-glass rounded-[1.5rem] p-4 md:p-6 border-none shadow-md relative overflow-x-clip overflow-y-visible">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 md:gap-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-5 flex-1 min-w-0">
                        <div className="p-2.5 md:p-3 bg-black text-white rounded-xl shadow-lg relative group shrink-0">
                            <HardHat className="h-5 w-5 md:h-6 md:w-6 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute -inset-1 bg-black/5 rounded-[1.5rem] -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-1">
                                <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight uppercase leading-tight">Chantier: {site.name}</h1>
                                <span className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest shadow-sm whitespace-nowrap w-fit",
                                    status.bg, status.color
                                )}>
                                    <status.icon className="h-2.5 w-2.5 shrink-0" />
                                    <span>{status.label}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="flex items-center gap-1.5 font-bold text-[8px] md:text-[9px] uppercase tracking-widest opacity-60">
                                    <MapPin className="h-3 w-3 opacity-40" />
                                    <span>{site.address}, {site.city}</span>
                                </div>
                            </div>

                            {site.status === 'SUSPENDU' && site.suspension_reason && (
                                <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 animate-in slide-in-from-top-2 duration-500">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle className="h-3 w-3 opacity-60" />
                                        <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Motif de suspension</span>
                                    </div>
                                    <p className="text-[10px] md:text-[11px] font-medium leading-relaxed">{site.suspension_reason}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col xl:items-end gap-3 xl:border-l xl:pl-8 border-black/5 dark:border-white/5">
                        <div className="flex flex-col items-start lg:items-end w-full">
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-30 mb-1 text-left lg:text-right">
                                Progression
                            </span>
                            <div className="flex items-center gap-3 w-full lg:w-auto">
                                <div className="flex-1 lg:w-40 h-1.5 bg-black/[0.03] dark:bg-white/10 rounded-full overflow-hidden p-[1px] border border-black/5 dark:border-white/5 shadow-inner">
                                    <div
                                        className="h-full bg-black dark:bg-white rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${site.progress_percentage}%` }}
                                    />
                                </div>
                                <span className="font-bold text-lg md:text-xl tracking-tight leading-none">{site.progress_percentage}%</span>
                            </div>
                        </div>

                        {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && site.status !== 'ANNULE' && (
                            <div className="flex items-center justify-start lg:justify-end gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1">
                                {site.status === 'EN_COURS' && (
                                    <button
                                        onClick={() => setIsSuspensionModalOpen(true)}
                                        className="inline-flex items-center justify-center rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-all bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 h-8 md:h-9 px-3 md:px-4 shadow-sm whitespace-nowrap"
                                    >
                                        <Pause className="mr-1.5 h-3 w-3" /> Suspendre
                                    </button>
                                )}
                                {(site.status === 'SUSPENDU' || site.status === 'PREPARATION') && (
                                    <button
                                        onClick={async () => {
                                            await api.patch(`/construction/sites/${id}/`, { status: 'EN_COURS' });
                                            fetchSiteDetails();
                                        }}
                                        className="inline-flex items-center justify-center rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-all bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 h-8 md:h-9 px-3 md:px-4 shadow-sm whitespace-nowrap"
                                    >
                                        <Clock className="mr-1.5 h-3 w-3" /> Relancer
                                    </button>
                                )}

                                {user?.role === 'ADMIN_MADIS' && (
                                    <>
                                        <Link
                                            to={`/dashboard/construction/${id}/edit`}
                                            className="inline-flex items-center justify-center rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-all bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm hover:bg-black/5 dark:hover:bg-white/20 h-8 md:h-9 px-3 md:px-4 dark:text-white whitespace-nowrap"
                                        >
                                            <Edit className="mr-1.5 h-3 w-3" /> Modifier
                                        </Link>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('ATTENTION: Voulez-vous vraiment SUPPRIMER définitivement ce chantier et toutes ses données associées ?')) {
                                                    await api.delete(`/construction/sites/${id}/`);
                                                    showToast({ message: 'Chantier supprimé.', type: 'success' });
                                                    navigate('/dashboard/construction');
                                                }
                                            }}
                                            className="inline-flex items-center justify-center rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-all bg-red-500 text-white hover:bg-red-600 h-8 md:h-9 px-3 md:px-4 shadow-md whitespace-nowrap"
                                        >
                                            <Trash2 className="mr-1.5 h-3 w-3" /> Supprimer
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Solaris Style */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="mb-6 md:mb-8 [&::-webkit-scrollbar]:hidden">
                <div style={{ width: 'max-content' }} className="solaris-glass rounded-xl p-1.5 flex gap-2 md:gap-3 shadow-md px-2 md:px-3 whitespace-nowrap border-none">
                    {[
                        { id: 'overview', label: "Vue d'ensemble", icon: Layout },
                        { id: 'journal', label: "Journal", icon: FileText },
                        { id: 'photos', label: "Photos", icon: Image },
                        { id: 'documents', label: "Documents", icon: File },
                        { id: 'finance', label: "Finance", icon: DollarSign }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 md:gap-2.5 px-4 md:px-5 py-2 md:py-2 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all duration-300 group",
                                activeTab === tab.id
                                    ? "bg-black text-white shadow-lg"
                                    : "text-muted-foreground hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                            )}
                        >
                            <tab.icon className={cn("h-3 w-3 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-white" : "text-muted-foreground")} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-2">
                {activeTab === 'overview' && (
                    <div className="grid gap-6 grid-cols-1">
                        <div className="space-y-6">
                            {/* Description Solaris Style */}
                            <div className="solaris-glass rounded-[1.2rem] p-5 md:p-6 border-none shadow-sm">
                                <h3 className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-30 mb-3 flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 opacity-40" />
                                    Description Technique
                                </h3>
                                <p className="text-[11px] font-medium text-muted-foreground whitespace-pre-wrap leading-relaxed opacity-70">
                                    {site.description || "Aucune description fournie pour ce chantier."}
                                </p>
                            </div>

                            {/* Milestones (Jalons) Solaris Style */}
                            <div className="solaris-glass rounded-[1.2rem] p-5 md:p-6 border-none shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 md:mb-6">
                                    <h3 className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-30 flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 opacity-40" />
                                        Jalons
                                    </h3>

                                    {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && site.status !== 'SUSPENDU' && (
                                        <Link
                                            to={`/dashboard/construction/${id}/milestones`}
                                            className="inline-flex items-center justify-center rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all bg-black text-white hover:bg-zinc-800 h-8 px-4 shadow-md w-fit"
                                        >
                                            <Edit className="mr-1.5 h-3 w-3" />
                                            Configurer
                                        </Link>
                                    )}
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                    {milestones.length > 0 ? (
                                        milestones.map((milestone) => {
                                            const isOverdue = !milestone.completed && new Date(milestone.end_date) < new Date().setHours(0, 0, 0, 0);
                                            return (
                                                <div
                                                    key={milestone.id}
                                                    className={cn(
                                                        "flex items-start md:items-center gap-3 md:gap-4 p-3.5 md:p-4 rounded-xl border border-black/[0.03] dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.02] transition-all duration-300 group",
                                                        milestone.completed ? "opacity-40" : "hover:bg-black/[0.02] dark:hover:bg-white/5"
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
                                                            "mt-0.5 md:mt-0 h-4 w-4 md:h-5 md:w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                                                            milestone.completed
                                                                ? 'bg-black border-black text-white'
                                                                : 'border-black/10 dark:border-white/20 hover:border-black/30 bg-white dark:bg-white/10 shadow-sm'
                                                        )}
                                                    >
                                                        {milestone.completed && <CheckCircle2 className="h-3 w-3" />}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <p className={cn("text-[10px] md:text-[11px] font-bold uppercase tracking-tight leading-snug", milestone.completed ? 'text-muted-foreground line-through' : 'text-black dark:text-white')}>
                                                                {milestone.description}
                                                            </p>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {isOverdue && !milestone.completed && (
                                                                    <span className="text-[7px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-widest">RETARD</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-muted-foreground opacity-40">
                                                                <Calendar className="h-2.5 w-2.5" />
                                                                {milestone.end_date ? format(new Date(milestone.end_date), 'd MMM yy', { locale: fr }).toUpperCase() : 'NON DÉT.'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-muted-foreground opacity-40">
                                                                <UserIcon className="h-2.5 w-2.5" />
                                                                {milestone.responsible || 'Non assigné'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-8 md:p-12 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-20">Aucun jalon défini</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Budget Card Solaris Style */}
                            <div className="solaris-glass rounded-[1.2rem] p-5 md:p-6 border-none shadow-sm">
                                <h3 className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-30 mb-5 flex items-center gap-2">
                                    <DollarSign className="h-3.5 w-3.5 opacity-40" />
                                    Budget
                                </h3>
                                <div className="space-y-4 md:space-y-5">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                                        <div>
                                            <p className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Dépenses réelles</p>
                                            <p className="text-base md:text-xl font-bold tracking-tight">
                                                {formatCurrency(site.budget_spent || 0)}
                                            </p>
                                        </div>
                                        <div className="sm:text-right">
                                            <p className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Cible</p>
                                            <p className="font-bold text-[9px] md:text-[10px] opacity-40">
                                                {formatCurrency(site.budget || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="w-full h-1.5 bg-black/[0.03] dark:bg-white/10 rounded-full overflow-hidden p-[1px] border border-black/5 shadow-inner">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000 ease-out",
                                                    site.budget_consumed_percentage > 90 ? "bg-rose-500" : site.budget_consumed_percentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                                                )}
                                                style={{ width: `${Math.min(100, site.budget_consumed_percentage || 0)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[7px] font-bold uppercase tracking-widest text-muted-foreground opacity-30">
                                            <span>0%</span>
                                            <span>{site.budget_consumed_percentage || 0}%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                    {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && (
                                        <div className="pt-3 border-t border-black/5">
                                            <Link
                                                to={`/dashboard/finance/transactions/new?site=${id}`}
                                                className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-black text-white text-[8px] md:text-[9px] font-bold uppercase tracking-widest shadow-md hover:bg-zinc-800 transition-all w-full lg:w-auto"
                                            >
                                                <Plus className="h-3 w-3" /> Nouvelle dépense
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Logistic Details Solaris Style */}
                            <div className="solaris-glass rounded-[1.2rem] p-5 md:p-6 border-none shadow-sm">
                                <h3 className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-30 mb-5 flex items-center gap-2">
                                    <MapIcon className="h-3.5 w-3.5 opacity-40" />
                                    Logistique
                                </h3>
                                <dl className="space-y-3.5">
                                    <div className="flex justify-between items-center pb-2.5 border-b border-black/[0.03]">
                                        <dt className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Chef de chantier</dt>
                                        <dd className="text-[10px] font-bold uppercase tracking-tight text-black">
                                            {site.chef_de_chantier_name || 'Non assigné'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between items-center pb-2.5 border-b border-black/[0.03]">
                                        <dt className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Début</dt>
                                        <dd className="text-[10px] font-bold font-mono opacity-60 uppercase">
                                            {site.start_date ? format(new Date(site.start_date), 'd MMM yy', { locale: fr }) : '-'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between items-center pb-2.5 border-b border-black/[0.03]">
                                        <dt className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Fin prévue</dt>
                                        <dd className="text-[10px] font-bold font-mono text-amber-600 uppercase">
                                            {site.end_date ? format(new Date(site.end_date), 'd MMM yy', { locale: fr }) : '-'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <dt className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">CP / Ville</dt>
                                        <dd className="text-[10px] font-bold uppercase tracking-tight text-right opacity-60">{site.postal_code || '-'} / {site.city || '-'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'journal' && (
                    <div className="space-y-6">
                        {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && site.status !== 'SUSPENDU' && (
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => setIsJournalModalOpen(true)}
                                    className="inline-flex items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-widest transition-all bg-primary text-white hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] h-9 px-6 shadow-md shadow-primary/20 dark:shadow-[0_0_15px_rgba(236,72,153,0.2)]"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouveau Rapport
                                </button>
                            </div>
                        )}

                        {journalEntries.length > 0 ? (
                            <div className="space-y-4 md:space-y-6">
                                {journalEntries.map((entry) => {
                                    const WeatherIcon = getWeatherIcon(entry.weather);
                                    return (
                                        <div key={entry.id} className="solaris-glass rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-none shadow-xl">
                                            <div className="p-5 md:p-8 border-b border-black/[0.03] dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 md:gap-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] md:text-[12px] font-black uppercase tracking-tighter">
                                                            {format(new Date(entry.date), 'EEEE d MMMM yyyy', { locale: fr })}
                                                        </span>
                                                        <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-2 mt-1">
                                                            <UserIcon className="h-3 w-3" /> {entry.author_name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                                                    <div className="flex items-center gap-2 px-2.5 py-1 md:py-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                                        <WeatherIcon className="h-3 md:h-3.5 w-3 md:w-3.5 text-black/40 dark:text-white/40" />
                                                        {entry.weather?.toLowerCase()}
                                                    </div>
                                                    <div className="flex items-center gap-2 px-2.5 py-1 md:py-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                                        <Users className="h-3 md:h-3.5 w-3 md:w-3.5 text-black/40 dark:text-white/40" />
                                                        {entry.workers_count} ouvriers
                                                    </div>
                                                    {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && site.status !== 'SUSPENDU' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEntryId(entry.id);
                                                                setIsEditJournalModalOpen(true);
                                                            }}
                                                            className="p-2 hover:bg-black/5 rounded-full transition-all text-muted-foreground hover:text-black ml-auto sm:ml-0"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-5 md:p-8">
                                                <p className="text-[12px] md:text-[13px] font-bold text-muted-foreground whitespace-pre-wrap leading-relaxed mb-6 md:mb-8">
                                                    {entry.content}
                                                </p>
                                                {entry.photos && entry.photos.length > 0 && (
                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                                        {entry.photos.map((photo) => (
                                                            <div key={photo.id} className="aspect-square rounded-xl md:rounded-2xl overflow-hidden border-none bg-black/5 relative group cursor-pointer shadow-sm hover:shadow-md transition-all">
                                                                <img
                                                                    src={photo.image}
                                                                    alt={photo.caption || "Photo de chantier"}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                    onClick={() => window.open(photo.image, '_blank')}
                                                                />
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Plus className="text-white h-5 md:h-6 w-5 md:w-6 scale-75 group-hover:scale-100 transition-transform" />
                                                                </div>
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
                            <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-12 md:p-24 text-center border-none shadow-xl">
                                <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-full bg-black/[0.03] flex items-center justify-center mb-6 md:mb-8">
                                    <FileText className="h-8 w-8 md:h-10 md:w-10 text-black/10" />
                                </div>
                                <h3 className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] mb-2 md:mb-3">Journal de Supervision Vide</h3>
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-30 max-w-xs mx-auto">
                                    Aucune entrée journalière n'a été enregistrée pour ce chantier industriel.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'photos' && (
                    <div className="space-y-10">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                            {journalEntries.flatMap(e => e.photos || []).length > 0 ? (
                                journalEntries.flatMap(e => e.photos || []).map((photo) => (
                                    <div key={photo.id} className="group relative aspect-square rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-none bg-black/5 shadow-md hover:shadow-2xl transition-all duration-500 scale-95 hover:scale-100">
                                        <img
                                            src={photo.image}
                                            alt={photo.caption}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 md:p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                            <p className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest line-clamp-1 mb-1">{photo.caption || "Sans légende"}</p>
                                            <p className="text-white/40 text-[8px] font-bold uppercase">{format(new Date(photo.created_at), 'd MMM yyyy', { locale: fr })}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-12 md:p-24 text-center border-none shadow-xl">
                                    <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-full bg-black/[0.03] flex items-center justify-center mb-6 md:mb-8">
                                        <Image className="h-8 w-8 md:h-10 md:w-10 text-black/10" />
                                    </div>
                                    <h3 className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] mb-2 md:mb-3">Galerie Photos Vide</h3>
                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-30">Les visuels du chantier apparaîtront après documentation dans le journal.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-10">
                        {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && (
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => setIsDocumentModalOpen(true)}
                                    className="inline-flex items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-widest transition-all bg-primary text-white hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] h-9 px-6 shadow-md shadow-primary/20 dark:shadow-[0_0_15px_rgba(236,72,153,0.2)]"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter un Document
                                </button>
                            </div>
                        )}

                        {documents.length > 0 ? (
                            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="solaris-glass rounded-[1.5rem] md:rounded-3xl p-5 md:p-6 border-none shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <File className="h-12 w-12 md:h-16 md:w-16 -mr-2 -mt-2 md:-mr-4 md:-mt-4" />
                                        </div>
                                        <div className="flex items-start gap-4 md:gap-5 relative z-10">
                                            <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform">
                                                <FileText className="h-5 w-5 md:h-6 md:w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5 md:pt-1">
                                                <h4 className="text-[11px] md:text-[12px] font-black uppercase tracking-tight truncate mb-1">{doc.title}</h4>
                                                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground opacity-60 mb-3 md:mb-4 line-clamp-1">{doc.description || "Aucun détail technique"}</p>
                                                <div className="flex items-center justify-between text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                                                    <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60">
                                                        {doc.category || 'Document'}
                                                    </span>
                                                    <span className="opacity-40">{format(new Date(doc.uploaded_at), 'd MMM yyyy', { locale: fr })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-black/5 dark:border-white/5 flex justify-end relative z-10">
                                            <button
                                                onClick={() => window.open(doc.file, '_blank')}
                                                className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black dark:text-white hover:opacity-70 flex items-center gap-2 transition-opacity"
                                            >
                                                <Download className="h-3 md:h-3.5 w-3 md:w-3.5" /> Télécharger
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-12 md:p-24 text-center border-none shadow-xl">
                                <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-full bg-black/[0.03] flex items-center justify-center mb-6 md:mb-8">
                                    <File className="h-8 w-8 md:h-10 md:w-10 text-black/10" />
                                </div>
                                <h3 className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] mb-2 md:mb-3">Coffre-fort Documentaire Vide</h3>
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-30 max-w-xs mx-auto">Aucun plan technique ou contrat n'a été téléversé pour ce chantier.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Budget Breakdown Chart Solaris Style */}
                            <div className="solaris-glass rounded-[1.2rem] p-5 md:p-6 border-none shadow-sm">
                                <h3 className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-30 mb-5 flex items-center gap-2">
                                    <DollarSign className="h-3.5 w-3.5 opacity-40" />
                                    Répartition
                                </h3>
                                <div className="h-[250px] md:h-[300px] w-full">
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
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                >
                                                    {[
                                                        '#ff0048', // Primary pink
                                                        '#00f2ff', // Neon cyan
                                                        '#a855f7', // Purple
                                                        '#f59e0b', // Amber
                                                        '#10b981'  // Emerald
                                                    ].map((color, index) => (
                                                        <Cell key={`cell-${index}`} fill={color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(10, 10, 20, 0.9)',
                                                        borderRadius: '16px',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                                        fontSize: '9px',
                                                        fontWeight: '900',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        color: '#ffffff'
                                                    }}
                                                    formatter={(value) => formatCurrency(value, true)}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl">
                                            <DollarSign className="h-10 w-10 mb-4 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Données Insuffisantes</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Budget Summary Card Solaris Style */}
                            <div className="solaris-glass rounded-[1.2rem] p-5 md:p-6 border-none shadow-sm flex flex-col justify-center">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 opacity-40">Compteur Consommation</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl md:text-3xl font-bold tracking-tight text-black">
                                                {formatCurrency(site.budget_spent || 0, true)}
                                            </span>
                                            <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-30">
                                                / {formatCurrency(site.budget || 0, true)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3.5">
                                        {Object.entries(site.budget_by_category || {}).map(([key, value], index) => {
                                            const label = key === 'MATERIAUX' ? 'Matériaux' : key === 'MAIN_D_OEUVRE' ? 'Main d\'œuvre' : key === 'SERVICES' ? 'Services' : key;
                                            const tints = ['bg-black', 'bg-black/60', 'bg-black/40', 'bg-black/20', 'bg-black/10'];
                                            const percentage = site.budget_spent > 0 ? (parseFloat(value) / site.budget_spent) * 100 : 0;

                                            return (
                                                <div key={key} className="space-y-1.5">
                                                    <div className="flex justify-between text-[8px] md:text-[9px] font-bold uppercase tracking-widest">
                                                        <span>{label}</span>
                                                        <span className="opacity-40">{formatCurrency(value, true)}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-black/[0.03] rounded-full overflow-hidden p-[1px]">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-1000", tints[index % tints.length])}
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

                        {/* Transactions List Solaris Style */}
                        <div className="solaris-glass rounded-[1.2rem] shadow-md overflow-hidden border-none mt-6 md:mt-8">
                            <div className="p-4 md:p-5 border-b border-black/[0.03] bg-black/[0.01] flex items-center justify-between">
                                <h3 className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-30 flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 opacity-40" />
                                    Flux Financiers
                                </h3>
                            </div>
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left min-w-[600px] md:min-w-full">
                                    <thead className="bg-black/[0.02] dark:bg-white/5 text-muted-foreground uppercase text-[7px] md:text-[8px] font-bold tracking-widest">
                                        <tr>
                                            <th className="px-5 md:px-6 py-3.5">Date</th>
                                            <th className="px-5 md:px-6 py-3.5">Catégorie</th>
                                            <th className="px-5 md:px-6 py-3.5">Description</th>
                                            <th className="px-5 md:px-6 py-3.5 text-right">Montant</th>
                                            <th className="px-5 md:px-6 py-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/[0.03] dark:divide-white/5">
                                        {transactions.length > 0 ? (
                                            transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.03] transition-colors group">
                                                    <td className="px-5 md:px-6 py-3.5 whitespace-nowrap text-[9px] md:text-[10px] font-bold font-mono opacity-60">
                                                        {format(new Date(tx.date), 'dd/MM/yyyy')}
                                                    </td>
                                                    <td className="px-5 md:px-6 py-3.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[7px] md:text-[8px] font-bold uppercase tracking-widest bg-black text-white">
                                                            {tx.category_display || tx.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 md:px-6 py-3.5 text-[9px] md:text-[10px] font-bold text-muted-foreground opacity-40 max-w-[150px] md:max-w-xs truncate uppercase">
                                                        {tx.description || '-'}
                                                    </td>
                                                    <td className="px-5 md:px-6 py-3.5 text-right font-bold text-[10px] md:text-[11px] tracking-tight">
                                                        {formatCurrency(tx.amount, true)}
                                                    </td>
                                                    <td className="px-5 md:px-6 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {tx.invoice && (
                                                                <a
                                                                    href={tx.invoice}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title="Voir le justificatif"
                                                                    className="p-1.5 md:p-2 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-all inline-block opacity-60 hover:opacity-100"
                                                                >
                                                                    <Eye className="h-4 w-4 text-primary" />
                                                                </a>
                                                            )}
                                                            {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && (
                                                                <>
                                                                    <Link
                                                                        to={`/dashboard/finance/transactions/${tx.id}/edit?site=${id}`}
                                                                        className="p-1.5 md:p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all inline-block opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                        title="Modifier"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Link>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (!window.confirm('Supprimer cette transaction ? Cette action est irréversible.')) return;
                                                                            try {
                                                                                await api.delete(`/finance/transactions/${tx.id}/`);
                                                                                showToast({ message: 'Transaction supprimée.', type: 'success' });
                                                                                fetchSiteDetails();
                                                                            } catch (err) {
                                                                                console.error(err);
                                                                                showToast({ message: 'Erreur lors de la suppression.', type: 'error' });
                                                                            }
                                                                        }}
                                                                        className="p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all inline-block opacity-100 md:opacity-0 md:group-hover:opacity-100 text-red-500"
                                                                        title="Supprimer"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-8 py-20 text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Aucune transaction enregistrée</p>
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

            {/* Modal d'upload de document */}
            <UploadDocumentModal
                isOpen={isDocumentModalOpen}
                onClose={() => setIsDocumentModalOpen(false)}
                siteId={id}
                propertyId={site?.property_id || site?.project_property_id}
                onSuccess={() => {
                    fetchSiteDetails();
                    setIsDocumentModalOpen(false);
                }}
            />

            {/* Modal de journal */}
            <JournalEntryModal
                isOpen={isJournalModalOpen}
                onClose={() => setIsJournalModalOpen(false)}
                site={site}
                onOpenEdit={(entryId) => {
                    setIsJournalModalOpen(false);
                    setSelectedEntryId(entryId);
                    setIsEditJournalModalOpen(true);
                }}
                onSuccess={() => {
                    fetchSiteDetails();
                    setIsJournalModalOpen(false);
                }}
            />

            <EditJournalEntryModal
                isOpen={isEditJournalModalOpen}
                onClose={() => {
                    setIsEditJournalModalOpen(false);
                    setSelectedEntryId(null);
                }}
                entryId={selectedEntryId}
                site={site}
                onSuccess={() => {
                    fetchSiteDetails();
                    setIsEditJournalModalOpen(false);
                    setSelectedEntryId(null);
                }}
            />

            {/* Suspension Modal */}
            {
                isSuspensionModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-[#0A0A0B] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5 dark:border-white/5 animate-in zoom-in-95 duration-300">
                            <div className="p-8 md:p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black tracking-tighter uppercase">Suspendre le chantier</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Veuillez indiquer le motif de cette suspension</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsSuspensionModalOpen(false);
                                            setSuspensionReason('');
                                        }}
                                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                                    >
                                        <ArrowLeft className="h-5 w-5 rotate-90" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        value={suspensionReason}
                                        onChange={(e) => setSuspensionReason(e.target.value)}
                                        placeholder="Ex: En attente de matériaux, décision administrative, intempéries..."
                                        className="w-full h-40 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl p-6 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all border border-black/5 dark:border-white/5"
                                    />
                                </div>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <button
                                        onClick={() => {
                                            setIsSuspensionModalOpen(false);
                                            setSuspensionReason('');
                                        }}
                                        className="flex-1 h-14 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!suspensionReason.trim()) {
                                                showToast({ message: 'Veuillez saisir un motif.', type: 'error' });
                                                return;
                                            }
                                            try {
                                                await api.patch(`/construction/sites/${id}/`, {
                                                    status: 'SUSPENDU',
                                                    suspension_reason: suspensionReason
                                                });
                                                setIsSuspensionModalOpen(false);
                                                setSuspensionReason('');
                                                showToast({ message: 'Chantier suspendu.', type: 'success' });
                                                fetchSiteDetails();
                                            } catch (err) {
                                                showToast({ message: 'Erreur lors de la suspension.', type: 'error' });
                                            }
                                        }}
                                        className="flex-1 h-14 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all"
                                    >
                                        Confirmer la suspension
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
