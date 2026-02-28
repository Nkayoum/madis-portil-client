import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import {
    Building2, Calendar, Euro, ArrowLeft, Plus, HardHat, Edit, Trash2,
    Loader2, ClipboardList, Clock, CheckCircle2, AlertCircle, XCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, formatCurrency } from '../../lib/utils';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [associatedChantiers, setAssociatedChantiers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingChantiers, setLoadingChantiers] = useState(false);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [error, setError] = useState(null);

    const fetchProject = async () => {
        try {
            const response = await api.get(`/projects/${id}/`);
            setProject(response.data);
        } catch (err) {
            setError('Impossible de charger les détails du projet.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Tous les chantiers associés seront également supprimés.')) {
            return;
        }

        try {
            await api.delete(`/projects/${id}/`);
            navigate('/dashboard/projects');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la suppression du projet.');
        }
    };

    useEffect(() => {
        const fetchChantiers = async () => {
            setLoadingChantiers(true);
            try {
                const response = await api.get(`/construction/sites/?project=${id}`);
                setAssociatedChantiers(response.data.results || []);
            } catch (err) {
                console.error('Failed to fetch associated chantiers', err);
            } finally {
                setLoadingChantiers(false);
            }
        };
        const fetchTransactions = async () => {
            setLoadingTransactions(true);
            try {
                const response = await api.get(`/finance/transactions/?project=${id}`);
                setTransactions(response.data.results || response.data || []);
            } catch (err) {
                console.error('Failed to fetch transactions', err);
            } finally {
                setLoadingTransactions(false);
            }
        };

        fetchChantiers();
        fetchTransactions();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-black opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Accès aux données du projet...</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="space-y-8 max-w-[1400px] mx-auto px-6 py-8">
                <Link to="/dashboard/projects" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all group">
                    <ArrowLeft className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Retour à la liste
                </Link>
                <div className="p-12 rounded-[2.5rem] solaris-glass text-rose-600 border border-rose-500/20 font-black uppercase text-[12px] tracking-widest text-center shadow-2xl">
                    {error || "Projet introuvable dans le système."}
                </div>
            </div>
        );
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PLANIFIE': return <Clock className="h-4 w-4" />;
            case 'EN_COURS': return <Loader2 className="h-4 w-4 animate-spin-slow" />;
            case 'TERMINE': return <CheckCircle2 className="h-4 w-4" />;
            case 'ANNULE': return <XCircle className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PLANIFIE': return 'bg-blue-500 text-white';
            case 'EN_COURS': return 'bg-amber-500 text-white';
            case 'TERMINE': return 'bg-emerald-500 text-white';
            case 'ANNULE': return 'bg-rose-500 text-white';
            default: return 'bg-black text-white';
        }
    };

    return (
        <div className="space-y-6 md:space-y-12 animate-fade-in max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 overflow-x-hidden w-full">
            <Link to="/dashboard/projects" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all group">
                <ArrowLeft className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour aux projets
            </Link>

            <div className="solaris-glass rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 border-none shadow-xl relative overflow-hidden w-full">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                            <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase leading-tight md:leading-none break-words max-w-full">{project.name}</h1>
                            <span className={cn(
                                "inline-flex items-center gap-2 px-4 md:px-5 py-2 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap w-fit",
                                getStatusColor(project.status)
                            )}>
                                {getStatusIcon(project.status)}
                                {project.status_display || project.status}
                            </span>
                        </div>
                        <Link
                            to={`/dashboard/properties/${project.property}`}
                            className="flex items-center gap-3 text-muted-foreground hover:text-black transition-all group bg-black/5 hover:bg-black/10 px-4 py-2 rounded-xl border border-black/5 w-fit max-w-full overflow-hidden"
                        >
                            <Building2 className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest truncate">Bien associé : {project.property_name}</span>
                        </Link>
                    </div>
                    {user?.role === 'ADMIN_MADIS' && (
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/20 text-rose-600 bg-rose-500/5 shadow-sm hover:bg-rose-600 hover:text-white h-12 px-6 shadow-rose-500/10 hover:shadow-rose-500/20"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </button>
                            <Link
                                to={`/dashboard/projects/${id}/edit`}
                                className="inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-black/10 bg-black text-white shadow-xl hover:bg-black/80 h-12 px-8"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-8 md:gap-12 lg:grid-cols-3 w-full min-w-0">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6 md:space-y-12 w-full min-w-0">
                    <div className="solaris-glass rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 border-none shadow-lg w-full overflow-hidden">
                        <h3 className="text-lg md:text-xl font-black tracking-tighter uppercase mb-6 md:mb-8 flex items-center gap-4">
                            <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-xl">
                                <ClipboardList className="h-5 w-5 md:h-6 w-6" />
                            </div>
                            Description du Projet
                        </h3>
                        <p className="text-[12px] md:text-[13px] font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap opacity-80 break-words">
                            {project.description || "Aucune description détaillée n'a été fournie pour ce projet."}
                        </p>
                    </div>

                    <div className="solaris-glass rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 border-none shadow-lg w-full overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:gap-8 mb-6 md:mb-10 w-full min-w-0">
                            <h3 className="text-lg md:text-xl font-black tracking-tighter uppercase flex items-center gap-4">
                                <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-xl">
                                    <HardHat className="h-5 w-5 md:h-6 w-6" />
                                </div>
                                Suivi de Chantier
                            </h3>
                            {user?.role === 'ADMIN_MADIS' && (
                                <Link
                                    to={`/dashboard/construction/new?projectId=${id}`}
                                    className="inline-flex items-center justify-center rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-black text-white hover:bg-black/80 h-10 px-6 shadow-xl whitespace-nowrap w-full sm:w-auto"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Démarrer un Chantier
                                </Link>
                            )}
                        </div>

                        {loadingChantiers ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-10 w-10 animate-spin text-black opacity-10" />
                            </div>
                        ) : (
                            <div className="grid gap-4 md:gap-6">
                                {associatedChantiers.map((site) => (
                                    <Link
                                        key={site.id}
                                        to={`/dashboard/construction/${site.id}`}
                                        className="group block p-5 sm:p-8 solaris-glass bg-white/40 hover:bg-white/60 border-none rounded-[1.2rem] sm:rounded-[2rem] transition-all hover:scale-[1.01] shadow-sm hover:shadow-xl w-full overflow-hidden"
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
                                            <span className="text-base md:text-lg font-black tracking-tight group-hover:text-primary transition-colors pr-2">{site.name}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs md:text-sm font-black text-primary bg-primary/10 px-2.5 md:px-3 py-1 rounded-lg shadow-sm">{site.progress_percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-black/5 rounded-full h-2 md:h-2.5 mb-4 md:mb-6 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-1000 relative after:absolute after:inset-0 after:bg-white/20 after:animate-pulse"
                                                style={{ width: `${site.progress_percentage}%` }}
                                            />
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                                <div className="flex items-center gap-2 opacity-60">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    <span>{site.status_display || site.status}</span>
                                                </div>
                                                {site.end_date && (
                                                    <div className="flex items-center gap-2 opacity-60 font-mono whitespace-nowrap">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>FIN: {format(new Date(site.end_date), 'd MMM yyyy', { locale: fr }).toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 group-hover:translate-x-2 transition-all group-hover:text-black shrink-0">
                                                Voir le journal <ArrowRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {associatedChantiers.length === 0 && (
                                    <div className="text-center py-12 bg-black/[0.02] rounded-[2rem] border-2 border-dashed border-black/5 opacity-40">
                                        <p className="text-[11px] font-black uppercase tracking-widest">Aucun chantier actif sur ce projet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="solaris-glass rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 border-none shadow-lg w-full overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:gap-8 mb-6 md:mb-10 w-full min-w-0">
                            <h3 className="text-lg md:text-xl font-black tracking-tighter uppercase flex items-center gap-4">
                                <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-xl">
                                    <Euro className="h-5 w-5 md:h-6 w-6" />
                                </div>
                                Transactions du Projet
                            </h3>
                            {user?.role === 'ADMIN_MADIS' && (
                                <Link
                                    to={`/dashboard/finance/transactions/new?projectId=${id}`}
                                    className="inline-flex items-center justify-center rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-black text-white hover:bg-black/80 h-10 px-6 shadow-lg whitespace-nowrap w-full sm:w-auto"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouvelle Transaction
                                </Link>
                            )}
                        </div>

                        {loadingTransactions ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-10 w-10 animate-spin text-black opacity-10" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-12 bg-black/[0.02] rounded-[2rem] border-2 border-dashed border-black/5 opacity-40">
                                <p className="text-[11px] font-black uppercase tracking-widest">Aucune transaction répertoriée.</p>
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto no-scrollbar rounded-xl sm:rounded-[1.5rem] border border-black/5 shadow-inner bg-white/10">
                                <table className="w-full min-w-[500px]">
                                    <thead>
                                        <tr className="border-b-2 border-black/5 text-left bg-black/[0.02]">
                                            <th className="px-5 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40">Date</th>
                                            <th className="px-5 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40">Description</th>
                                            <th className="px-5 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5 bg-white/20">
                                        {transactions.slice(0, 5).map((tx) => (
                                            <tr key={tx.id} className="hover:bg-black/[0.02] transition-colors group">
                                                <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-[11px] md:text-[12px] font-bold font-mono opacity-60">
                                                    {format(new Date(tx.date), 'dd/MM/yyyy')}
                                                </td>
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex flex-col gap-0.5 md:gap-1">
                                                        <span className="text-[12px] md:text-[13px] font-bold leading-tight group-hover:text-primary transition-colors">{tx.description || tx.category_display}</span>
                                                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30">{tx.category_display}</span>
                                                    </div>
                                                </td>
                                                <td className={cn(
                                                    "px-5 md:px-6 py-3 md:py-4 text-right font-black text-xs md:text-sm tracking-tight",
                                                    tx.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'
                                                )}>
                                                    <span className="whitespace-nowrap">{tx.type === 'INFLOW' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {transactions.length > 5 && (
                                    <div className="p-6 md:p-8 text-center bg-black/[0.01] border-t border-black/5">
                                        <Link to="/dashboard/finance/transactions" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-black hover:text-primary transition-all flex items-center justify-center gap-3">
                                            Voir le relevé complet <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6 md:space-y-12 w-full min-w-0">
                    <div className="solaris-glass rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 border-none shadow-lg w-full overflow-hidden">
                        <h3 className="text-base md:text-lg font-black tracking-tighter uppercase mb-8 md:mb-10 flex items-center gap-4">
                            <div className="p-2 md:p-2.5 rounded-xl bg-black text-white shadow-lg">
                                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            Dates Clés
                        </h3>
                        <div className="space-y-8 md:space-y-10">
                            <div className="grid gap-6 md:gap-8">
                                <div className="flex items-start gap-4 md:gap-6 group">
                                    <div className="p-3 md:p-4 rounded-[1rem] md:rounded-[1.2rem] bg-black/5 text-black group-hover:bg-black group-hover:text-white group-hover:shadow-xl transition-all duration-500">
                                        <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Date de début</div>
                                        <div className="text-[11px] sm:text-[12px] md:text-sm font-black tracking-tight uppercase">
                                            {project.start_date ? format(new Date(project.start_date), 'd MMMM yyyy', { locale: fr }) : 'Non planifiée'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 md:gap-6 group">
                                    <div className="p-3 md:p-4 rounded-[1rem] md:rounded-[1.2rem] bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-xl transition-all duration-500">
                                        <Clock className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Fin estimée</div>
                                        <div className="text-[11px] sm:text-[12px] md:text-sm font-black tracking-tight uppercase text-amber-600 group-hover:text-inherit transition-colors">
                                            {project.estimated_end_date ? format(new Date(project.estimated_end_date), 'd MMMM yyyy', { locale: fr }) : 'Non définie'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="solaris-glass rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 border-none shadow-lg w-full overflow-hidden">
                        <h3 className="text-base md:text-lg font-black tracking-tighter uppercase mb-8 md:mb-10 flex items-center gap-4">
                            <div className="p-2 md:p-2.5 rounded-xl bg-black text-white shadow-lg">
                                <Euro className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            Détails Financiers
                        </h3>
                        <div className="space-y-8 md:space-y-10">
                            <div className="group">
                                <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 mb-2 md:mb-3 group-hover:opacity-100 transition-opacity">Budget Total</div>
                                <div className="flex items-center gap-3 md:gap-4 text-xl sm:text-2xl md:text-3xl font-black tracking-tighter">
                                    <div className="p-1.5 md:p-2 rounded-xl bg-black/5 text-black">
                                        <Euro className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                                    </div>
                                    <span className="break-all">{formatCurrency(project.budget, true)}</span>
                                </div>
                            </div>

                            {project.budget > 0 && (
                                <div className="pt-8 md:pt-10 border-t border-black/5 space-y-4 md:space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-0.5 md:gap-1">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40">Consommé</span>
                                            <span className="text-lg md:text-xl font-black tracking-tight">{formatCurrency(project.budget_spent, true)}</span>
                                        </div>
                                        <div className="px-2 py-0.5 bg-black text-white text-[8px] md:text-[10px] font-black rounded-lg shadow-lg">
                                            {project.budget_consumed_percentage}%
                                        </div>
                                    </div>
                                    <div className="w-full bg-black/5 rounded-full h-2.5 md:h-3 overflow-hidden shadow-inner">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000 relative after:absolute after:inset-0 after:bg-white/20",
                                                project.budget_consumed_percentage > 90 ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" :
                                                    project.budget_consumed_percentage > 75 ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                            )}
                                            style={{ width: `${Math.min(project.budget_consumed_percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-40">
                                        <span className="whitespace-nowrap">Réelles</span>
                                        <span className="whitespace-nowrap">Reste: {formatCurrency(project.budget - project.budget_spent, true)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
