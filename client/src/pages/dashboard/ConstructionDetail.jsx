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
                <Link to="/dashboard/construction" className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all mb-8 group">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Retour aux chantiers
                </Link>
                <div className="solaris-glass rounded-[2.5rem] p-10 border-none shadow-xl text-red-600 flex items-center gap-4">
                    <AlertCircle className="h-6 w-6" />
                    <span className="font-bold">{error || "Chantier non trouvé."}</span>
                </div>
            </div>
        );
    }

    const status = getStatusConfig(site.status);

    return (
        <div className="space-y-10 animate-fade-in pb-8 md:pb-16">
            <Link to="/dashboard/construction" className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all group w-fit">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour aux chantiers
            </Link>

            {/* Header Solaris Style */}
            <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-x-clip overflow-y-visible">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8">
                        <div className="p-4 md:p-5 bg-black text-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl relative group shrink-0">
                            <HardHat className="h-6 w-6 md:h-8 md:w-8 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute -inset-2 bg-black/5 rounded-[2.2rem] -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-2">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase leading-tight">Chantier: {site.name}</h1>
                                <span className={cn(
                                    "flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm whitespace-nowrap w-fit",
                                    status.bg, status.color
                                )}>
                                    <status.icon className="h-3 w-3 shrink-0" />
                                    <span>{status.label}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <div className="flex items-center gap-1.5 font-bold text-[10px] md:text-[11px] uppercase tracking-wider opacity-60">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{site.address}, {site.city}</span>
                                </div>
                            </div>

                            {site.status === 'SUSPENDU' && site.suspension_reason && (
                                <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 animate-in slide-in-from-top-2 duration-500">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle className="h-3 md:h-3.5 w-3 md:w-3.5" />
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Motif de suspension</span>
                                    </div>
                                    <p className="text-[11px] md:text-[12px] font-bold leading-relaxed">{site.suspension_reason}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col lg:items-end gap-6 lg:border-l lg:pl-10 border-black/5 dark:border-white/5">
                        <div className="flex flex-col items-start lg:items-end">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-2 md:mb-3">
                                Progression globale
                            </span>
                            <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto">
                                <div className="flex-1 lg:w-64 h-3 bg-black/[0.03] dark:bg-white/10 rounded-full overflow-hidden p-[2px] border border-black/5 dark:border-white/5 shadow-inner">
                                    <div
                                        className="h-full bg-black dark:bg-white rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-all duration-1000 ease-out"
                                        style={{ width: `${site.progress_percentage}%` }}
                                    />
                                </div>
                                <span className="font-black text-2xl md:text-3xl tracking-tighter leading-none">{site.progress_percentage}%</span>
                            </div>
                        </div>

                        {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && site.status !== 'ANNULE' && (
                            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="flex items-center gap-2 md:gap-3 w-full lg:w-auto pb-1 lg:pb-0 [&::-webkit-scrollbar]:hidden">
                                {site.status === 'EN_COURS' && (
                                    <button
                                        onClick={() => setIsSuspensionModalOpen(true)}
                                        className="inline-flex items-center justify-center rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 h-8 md:h-11 px-2.5 md:px-6 shadow-sm whitespace-nowrap"
                                    >
                                        <Pause className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> Suspendre
                                    </button>
                                )}
                                {(site.status === 'SUSPENDU' || site.status === 'PREPARATION') && (
                                    <button
                                        onClick={async () => {
                                            await api.patch(`/construction/sites/${id}/`, { status: 'EN_COURS' });
                                            fetchSiteDetails();
                                        }}
                                        className="inline-flex items-center justify-center rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 h-8 md:h-11 px-2.5 md:px-6 shadow-sm whitespace-nowrap"
                                    >
                                        <Clock className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> Relancer
                                    </button>
                                )}

                                {user?.role === 'ADMIN_MADIS' && (
                                    <>
                                        <Link
                                            to={`/dashboard/construction/${id}/edit`}
                                            className="inline-flex items-center justify-center rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm hover:bg-black/5 dark:hover:bg-white/20 h-8 md:h-11 px-2.5 md:px-6 dark:text-white whitespace-nowrap"
                                        >
                                            <Edit className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> Modifier
                                        </Link>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('ATTENTION: Voulez-vous vraiment SUPPRIMER définitivement ce chantier et toutes ses données associées ?')) {
                                                    await api.delete(`/construction/sites/${id}/`);
                                                    showToast({ message: 'Chantier supprimé.', type: 'success' });
                                                    navigate('/dashboard/construction');
                                                }
                                            }}
                                            className="inline-flex items-center justify-center rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-red-500 text-white hover:bg-red-600 h-8 md:h-11 px-2.5 md:px-6 shadow-[0_4px_15_rgba(239,68,68,0.4)] dark:shadow-[0_0_20px_rgba(239,68,68,0.6)] whitespace-nowrap"
                                        >
                                            <Trash2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> Supprimer
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Solaris Style */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="mb-8 [&::-webkit-scrollbar]:hidden">
                <div style={{ width: 'max-content' }} className="solaris-glass rounded-full p-2 flex gap-2 md:gap-4 shadow-lg px-3 whitespace-nowrap">
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
                                "flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-3.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-500 group",
                                activeTab === tab.id
                                    ? "bg-black text-white shadow-xl scale-105"
                                    : "text-muted-foreground hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                            )}
                        >
                            <tab.icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-white" : "text-muted-foreground")} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-2">
                {activeTab === 'overview' && (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Description Solaris Style */}
                            <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl">
                                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                                    <FileText className="h-4 w-4" />
                                    Description Technique
                                </h3>
                                <p className="text-[12px] md:text-[13px] font-bold text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {site.description || "Aucune description fournie pour ce chantier."}
                                </p>
                            </div>

                            {/* Milestones (Jalons) Solaris Style */}
                            <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
                                    <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-30 flex items-center gap-2 md:gap-3">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Jalons Industriels
                                    </h3>

                                    {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && site.status !== 'SUSPENDU' && (
                                        <Link
                                            to={`/dashboard/construction/${id}/milestones`}
                                            className="inline-flex items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-widest transition-all bg-black text-white hover:bg-black/90 h-9 px-4 md:px-5 shadow-lg w-fit"
                                        >
                                            <Edit className="mr-2 h-3.5 w-3.5" />
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
                                                        "flex items-start md:items-center gap-4 md:gap-6 p-4 md:p-5 rounded-2xl border border-black/[0.03] dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.02] transition-all duration-300 group",
                                                        milestone.completed ? "opacity-50" : "hover:bg-black/[0.02] dark:hover:bg-white/5 hover:border-black/5 dark:hover:border-white/10"
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
                                                            "mt-1 md:mt-0 h-5 w-5 md:h-6 md:w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                                                            milestone.completed
                                                                ? 'bg-black border-black text-white'
                                                                : 'border-black/10 dark:border-white/20 hover:border-black/30 dark:hover:border-white/40 bg-white dark:bg-white/10 shadow-sm'
                                                        )}
                                                    >
                                                        {milestone.completed && <CheckCircle2 className="h-3 md:h-4 w-3 md:w-4" />}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4">
                                                            <p className={cn("text-[11px] md:text-[12px] font-black uppercase tracking-tight", milestone.completed ? 'text-muted-foreground line-through' : 'text-black dark:text-white')}>
                                                                {milestone.description}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                {isOverdue && !milestone.completed && (
                                                                    <span className="text-[8px] md:text-[9px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-[4px] border border-red-100 dark:border-red-800 uppercase tracking-widest transition-all">RETARD</span>
                                                                )}
                                                                {milestone.completed && (
                                                                    <span className="text-[8px] md:text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-[4px] border border-emerald-100 dark:border-emerald-800 uppercase tracking-widest">TERMINE</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 md:mt-2">
                                                            <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold text-muted-foreground opacity-60">
                                                                <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                                {milestone.end_date ? format(new Date(milestone.end_date), 'd MMM yyyy', { locale: fr }) : 'Non déterm.'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold text-muted-foreground opacity-60">
                                                                <UserIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                                {milestone.responsible || 'Non renseigné'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-8 md:p-12 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Aucun jalon défini</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Budget Card Solaris Style */}
                                <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl">
                                    <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-6 md:mb-8 flex items-center gap-3">
                                        <DollarSign className="h-4 w-4" />
                                        Suivi Financier
                                    </h3>
                                    <div className="space-y-6 md:space-y-8">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0">
                                            <div>
                                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Budget consommé</p>
                                                <p className="text-xl md:text-3xl font-black tracking-tighter">
                                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(site.budget_spent || 0)}
                                                </p>
                                            </div>
                                            <div className="sm:text-right">
                                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total</p>
                                                <p className="font-bold text-[10px] md:text-[12px]">
                                                    {site.budget ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(site.budget) : 'Non défini'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:space-y-3">
                                            <div className="w-full h-2.5 md:h-3 bg-black/[0.03] dark:bg-white/10 rounded-full overflow-hidden p-[2px] border border-black/5 dark:border-white/5 shadow-inner">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                                                        site.budget_consumed_percentage > 90 ? "bg-red-500" : site.budget_consumed_percentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                                                    )}
                                                    style={{ width: `${Math.min(100, site.budget_consumed_percentage || 0)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[7px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                                <span>0%</span>
                                                <span>{site.budget_consumed_percentage || 0}% UTILISÉ</span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                        {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && (
                                            <div className="pt-4 border-t border-black/5 dark:border-white/5">
                                                <Link
                                                    to={`/dashboard/finance/transactions/new?site=${id}`}
                                                    className="inline-flex items-center justify-center gap-2 h-10 px-4 md:px-5 rounded-xl md:rounded-2xl bg-primary text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 dark:shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all w-full lg:w-auto"
                                                >
                                                    <Plus className="h-3.5 w-3.5" /> Dépense
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Logistic Details Solaris Style */}
                                <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl">
                                    <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-6 md:mb-8 flex items-center gap-3">
                                        <MapIcon className="h-4 w-4" />
                                        Paramètres Logistiques
                                    </h3>
                                    <dl className="space-y-4 md:space-y-6">
                                        <div className="flex justify-between items-center pb-3 md:pb-4 border-b border-black/[0.03] dark:border-white/5">
                                            <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chef de chantier</dt>
                                            <dd className="text-[10px] md:text-[12px] font-black uppercase tracking-tighter text-black dark:text-white">
                                                {site.chef_de_chantier_name || 'Non assigné'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 md:pb-4 border-b border-black/[0.03] dark:border-white/5">
                                            <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date de début</dt>
                                            <dd className="text-[10px] md:text-[12px] font-bold font-mono">
                                                {site.start_date ? format(new Date(site.start_date), 'd MMM yyyy', { locale: fr }) : '-'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 md:pb-4 border-b border-black/[0.03] dark:border-white/5">
                                            <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fin prévue</dt>
                                            <dd className="text-[10px] md:text-[12px] font-bold font-mono text-amber-600">
                                                {site.end_date ? format(new Date(site.end_date), 'd MMM yyyy', { locale: fr }) : '-'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 md:pb-4 border-b border-black/[0.03] dark:border-white/5">
                                            <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Géolocalisation</dt>
                                            <dd className="text-[10px] md:text-[12px] font-bold text-right max-w-[120px] md:max-w-[150px] truncate">{site.city || '-'}</dd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Code Postal</dt>
                                            <dd className="text-[10px] md:text-[12px] font-bold font-mono">{site.postal_code || '-'}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'journal' && (
                    <div className="space-y-6">
                        {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && site.status !== 'SUSPENDU' && (
                            <div className="flex justify-end mb-8">
                                <button
                                    onClick={() => setIsJournalModalOpen(true)}
                                    className="inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-primary text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] h-12 px-8 shadow-lg shadow-primary/20 dark:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                                >
                                    <Plus className="mr-3 h-5 w-5" />
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
                            <div className="flex justify-end mb-8">
                                <button
                                    onClick={() => setIsDocumentModalOpen(true)}
                                    className="inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-primary text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] h-12 px-8 shadow-lg shadow-primary/20 dark:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                                >
                                    <Plus className="mr-3 h-5 w-5" />
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
                            <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl">
                                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-8 md:mb-10 flex items-center gap-3">
                                    <DollarSign className="h-4 w-4" />
                                    Répartition Analytique
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
                                                    formatter={(value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)}
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
                            <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl flex flex-col justify-center">
                                <div className="space-y-8 md:space-y-10">
                                    <div>
                                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 md:mb-3 opacity-40">Compteur Consommation</p>
                                        <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
                                            <span className="text-3xl md:text-5xl font-black tracking-tighter text-black dark:text-white">
                                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(site.budget_spent || 0)}
                                            </span>
                                            <span className="text-[10px] md:text-[12px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
                                                / {site.budget ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(site.budget) : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 md:space-y-6">
                                        {Object.entries(site.budget_by_category || {}).map(([key, value], index) => {
                                            const label = key === 'MATERIAUX' ? 'Matériaux' : key === 'MAIN_D_OEUVRE' ? 'Main d\'œuvre' : key === 'SERVICES' ? 'Services' : key;
                                            const tints = ['bg-primary', 'bg-cyan-400', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500'];
                                            const percentage = site.budget_spent > 0 ? (parseFloat(value) / site.budget_spent) * 100 : 0;

                                            return (
                                                <div key={key} className="space-y-1.5 md:space-y-2.5">
                                                    <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                                        <span>{label}</span>
                                                        <span className="text-black/40 dark:text-white/40">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)}</span>
                                                    </div>
                                                    <div className="h-2 bg-black/[0.03] dark:bg-white/10 rounded-full overflow-hidden p-[1px]">
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
                        <div className="solaris-glass rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl overflow-hidden border-none mt-6 md:mt-8">
                            <div className="p-5 md:p-8 border-b border-black/[0.03] bg-black/[0.01] flex items-center justify-between">
                                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-30 flex items-center gap-3">
                                    <Clock className="h-4 w-4" />
                                    Registre des Flux
                                </h3>
                            </div>
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left min-w-[600px] md:min-w-full">
                                    <thead className="bg-black/[0.02] dark:bg-white/5 text-muted-foreground uppercase text-[8px] md:text-[9px] font-black tracking-[0.15em]">
                                        <tr>
                                            <th className="px-5 md:px-8 py-4 md:py-5">Horodatage</th>
                                            <th className="px-5 md:px-8 py-4 md:py-5">Classification</th>
                                            <th className="px-5 md:px-8 py-4 md:py-5">Détails Techniques</th>
                                            <th className="px-5 md:px-8 py-4 md:py-5 text-right">Montant HT</th>
                                            <th className="px-5 md:px-8 py-4 md:py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/[0.03] dark:divide-white/5">
                                        {transactions.length > 0 ? (
                                            transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.03] transition-colors group">
                                                    <td className="px-5 md:px-8 py-4 md:py-6 whitespace-nowrap text-[10px] md:text-[11px] font-bold font-mono">
                                                        {format(new Date(tx.date), 'dd/MM/yyyy')}
                                                    </td>
                                                    <td className="px-5 md:px-8 py-4 md:py-6">
                                                        <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-black text-white shadow-sm">
                                                            {tx.category_display || tx.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 md:px-8 py-4 md:py-6 text-[10px] md:text-[11px] font-bold text-muted-foreground opacity-60 max-w-[150px] md:max-w-xs truncate">
                                                        {tx.description || '-'}
                                                    </td>
                                                    <td className="px-5 md:px-8 py-4 md:py-6 text-right font-black text-[11px] md:text-[12px] tracking-tighter">
                                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(tx.amount)}
                                                    </td>
                                                    <td className="px-5 md:px-8 py-4 md:py-6 text-right">
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
            {isSuspensionModalOpen && (
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
            )}
        </div>
    );
}
