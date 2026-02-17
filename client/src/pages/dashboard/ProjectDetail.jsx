import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/lib/axios';
import {
    Building2, Calendar, Euro, ArrowLeft, Plus, HardHat, Edit, Trash2,
    Loader2, ClipboardList, Clock, CheckCircle2, AlertCircle, XCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="space-y-4">
                <Link to="/dashboard/projects" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux projets
                </Link>
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                    {error || "Projet non trouvé."}
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
            case 'PLANIFIE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'EN_COURS': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'TERMINE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'ANNULE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <Link to="/dashboard/projects" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour aux projets
            </Link>

            <div className="bg-card border rounded-xl p-6 shadow-sm overflow-hidden relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                                {getStatusIcon(project.status)}
                                {project.status_display || project.status}
                            </span>
                        </div>
                        <Link
                            to={`/dashboard/properties/${project.property}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors inline-block"
                        >
                            <Building2 className="h-4 w-4" />
                            <span>Bien associé : {project.property_name}</span>
                        </Link>
                    </div>
                    {user?.role === 'ADMIN_MADIS' && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-destructive text-destructive bg-background shadow-sm hover:bg-destructive hover:text-destructive-foreground h-9 px-4 py-2"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </button>
                            <Link
                                to={`/dashboard/projects/${id}/edit`}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier le projet
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            Description du Projet
                        </h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {project.description || "Aucune description détaillée n'a été fournie pour ce projet."}
                        </p>
                    </div>

                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <HardHat className="h-5 w-5 text-primary" />
                                Suivi de Chantier
                            </h3>
                            {user?.role === 'ADMIN_MADIS' && (
                                <Link
                                    to={`/dashboard/construction/new?projectId=${id}`}
                                    className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-primary text-white hover:bg-primary/90 h-8 px-3"
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Démarrer un Chantier
                                </Link>
                            )}
                        </div>

                        {loadingChantiers ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {associatedChantiers.map((site) => (
                                    <Link
                                        key={site.id}
                                        to={`/dashboard/construction/${site.id}`}
                                        className="group block p-4 bg-muted/30 hover:bg-muted/50 border rounded-lg transition-all"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium group-hover:text-primary transition-colors">{site.name}</span>
                                            <span className="text-sm font-bold text-primary">{site.progress_percentage}%</span>
                                        </div>
                                        <div className="w-full bg-background rounded-full h-1.5 mb-3">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-700"
                                                style={{ width: `${site.progress_percentage}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                                            <div className="flex items-center gap-3">
                                                <span>Statut: {site.status_display || site.status}</span>
                                                {site.end_date && (
                                                    <span>Fin: {format(new Date(site.end_date), 'd MMM yyyy', { locale: fr })}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                Voir le journal <ArrowRight className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Euro className="h-5 w-5 text-primary" />
                                Transactions du Projet
                            </h3>
                            {user?.role === 'ADMIN_MADIS' && (
                                <Link
                                    to={`/dashboard/finance/transactions/new?projectId=${id}`}
                                    className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-primary text-white hover:bg-primary/90 h-8 px-3"
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Nouvelle Transaction
                                </Link>
                            )}
                        </div>

                        {loadingTransactions ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                                <p className="text-sm text-muted-foreground">Aucune transaction enregistrée pour ce projet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-muted-foreground text-left">
                                            <th className="pb-2 font-medium">Date</th>
                                            <th className="pb-2 font-medium">Description</th>
                                            <th className="pb-2 font-medium">Catégorie</th>
                                            <th className="pb-2 font-medium text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {transactions.slice(0, 5).map((tx) => (
                                            <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="py-2.5 whitespace-nowrap">
                                                    {format(new Date(tx.date), 'dd/MM/yyyy')}
                                                </td>
                                                <td className="py-2.5 max-w-[200px] truncate">
                                                    {tx.description || tx.category_display}
                                                </td>
                                                <td className="py-2.5 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded text-[10px] bg-muted font-medium">
                                                        {tx.category_display}
                                                    </span>
                                                </td>
                                                <td className={`py-2.5 text-right font-bold ${tx.type === 'INFLOW' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.type === 'INFLOW' ? '+' : '-'}{Number(tx.amount).toLocaleString('fr-FR')} €
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {transactions.length > 5 && (
                                    <div className="mt-4 text-center">
                                        <Link to="/dashboard/finance/transactions" className="text-xs text-primary hover:underline font-medium">
                                            Voir toutes les transactions
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4">Détails Financiers</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-1">Budget Total</div>
                                <div className="flex items-center gap-2 text-2xl font-bold">
                                    <Euro className="h-5 w-5 text-muted-foreground" />
                                    {project.budget ? `${Number(project.budget).toLocaleString('fr-FR')} €` : 'N/A'}
                                </div>
                            </div>

                            {project.budget > 0 && (
                                <>
                                    <div className="pt-2 border-t">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <div className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Consommé</div>
                                            <div className="text-sm font-bold">{Number(project.budget_spent).toLocaleString('fr-FR')} €</div>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    project.budget_consumed_percentage > 90 ? "bg-red-500" :
                                                        project.budget_consumed_percentage > 75 ? "bg-orange-500" : "bg-green-500"
                                                )}
                                                style={{ width: `${Math.min(project.budget_consumed_percentage, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                                            <span>{project.budget_consumed_percentage}% utilisé</span>
                                            <span>Reste: {Number(project.budget - project.budget_spent).toLocaleString('fr-FR')} €</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4">Dates Clés</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Calendar className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground font-medium">Date de début</div>
                                    <div className="font-semibold">
                                        {project.start_date ? format(new Date(project.start_date), 'd MMMM yyyy', { locale: fr }) : 'Non planifiée'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Clock className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground font-medium">Fin estimée</div>
                                    <div className="font-semibold text-amber-600 dark:text-amber-400">
                                        {project.estimated_end_date ? format(new Date(project.estimated_end_date), 'd MMMM yyyy', { locale: fr }) : 'Non définie'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
