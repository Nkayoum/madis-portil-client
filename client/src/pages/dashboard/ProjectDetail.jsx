import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import {
    Building2, Calendar, Euro, ArrowLeft, Plus, HardHat, Edit, Trash2,
    Loader2, ClipboardList, Clock, CheckCircle2, AlertCircle, XCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../lib/utils';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
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
            setError(t('project_detail.load_error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm(t('project_detail.delete_confirm'))) {
            return;
        }

        try {
            await api.delete(`/projects/${id}/`);
            navigate('/dashboard/projects');
        } catch (err) {
            console.error(err);
            alert(t('project_detail.delete_error'));
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
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('project_detail.loading_data')}</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="space-y-8 max-w-[1400px] mx-auto px-6 py-8">
                <Link to="/dashboard/projects" className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black transition-all group">
                    <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                    {t('project_detail.back_to_list')}
                </Link>
                <div className="p-8 rounded-[1.5rem] solaris-glass text-rose-600 border border-rose-500/20 font-bold uppercase text-[10px] tracking-widest text-center shadow-xl">
                    {error || t('project_detail.not_found')}
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
        <div className="space-y-6 md:space-y-12 animate-fade-in max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 w-full">
            <Link to="/dashboard/projects" className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black transition-all group">
                <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                {t('project_detail.back_to_projects')}
            </Link>

            <div className="solaris-glass rounded-[1.5rem] p-5 sm:p-8 border-none shadow-lg relative overflow-hidden w-full">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight uppercase leading-tight break-words max-w-full">{project.name}</h1>
                            <span className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[8px] md:text-[9px] font-bold uppercase tracking-widest shadow-md whitespace-nowrap w-fit",
                                getStatusColor(project.status)
                            )}>
                                {getStatusIcon(project.status)}
                                {project.status_display || project.status}
                            </span>
                        </div>
                        <Link
                            to={`/dashboard/properties/${project.property}`}
                            className="flex items-center gap-2.5 text-muted-foreground hover:text-black transition-all group bg-black/5 hover:bg-black/10 px-3 py-1.5 rounded-lg border border-black/5 w-fit max-w-full overflow-hidden"
                        >
                            <Building2 className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                            <span className="text-[9px] font-bold uppercase tracking-widest truncate">{t('project_detail.associated_property')} {project.property_name}</span>
                        </Link>
                    </div>
                    {user?.role === 'ADMIN_MADIS' && (
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center justify-center rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border border-rose-500/20 text-rose-600 bg-rose-500/5 shadow-sm hover:bg-rose-600 hover:text-white h-10 px-5 shadow-rose-500/10"
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                {t('project_detail.delete_button')}
                            </button>
                            <Link
                                to={`/dashboard/projects/${id}/edit`}
                                className="inline-flex items-center justify-center rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border border-black/10 bg-black text-white shadow-lg hover:bg-zinc-800 h-10 px-6"
                            >
                                <Edit className="mr-2 h-3.5 w-3.5" />
                                {t('project_detail.edit_button')}
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-8 md:gap-12 lg:grid-cols-3 w-full min-w-0">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6 md:space-y-12 w-full min-w-0">
                    <div className="solaris-glass rounded-[1.5rem] p-5 sm:p-8 border-none shadow-md w-full overflow-hidden">
                        <h3 className="text-base md:text-lg font-bold tracking-tight uppercase mb-5 md:mb-6 flex items-center gap-3">
                            <div className="p-2 md:p-2.5 rounded-xl bg-black text-white shadow-lg">
                                <ClipboardList className="h-4 w-4 md:h-5 w-5" />
                            </div>
                            {t('project_detail.description')}
                        </h3>
                        <p className="text-[11px] md:text-[12px] font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap opacity-70 break-words">
                            {project.description || t('project_detail.no_description')}
                        </p>
                    </div>

                    <div className="solaris-glass rounded-[1.5rem] p-5 sm:p-8 border-none shadow-md w-full overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 md:mb-8 w-full min-w-0">
                            <h3 className="text-base md:text-lg font-bold tracking-tight uppercase flex items-center gap-3">
                                <div className="p-2 md:p-2.5 rounded-xl bg-black text-white shadow-lg">
                                    <HardHat className="h-4 w-4 md:h-5 w-5" />
                                </div>
                                {t('project_detail.construction_tracking')}
                            </h3>
                            {user?.role === 'ADMIN_MADIS' && (
                                <Link
                                    to={`/dashboard/construction/new?projectId=${id}`}
                                    className="inline-flex items-center justify-center rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all bg-black text-white hover:bg-zinc-800 h-9 px-5 shadow-lg whitespace-nowrap w-full sm:w-auto"
                                >
                                    <Plus className="mr-2 h-3.5 w-3.5" />
                                    {t('project_detail.start_construction')}
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
                                        className="group block p-5 md:p-6 solaris-glass bg-white/40 hover:bg-white/60 border-none rounded-[1rem] transition-all hover:scale-[1.01] shadow-sm hover:shadow-lg w-full overflow-hidden"
                                    >
                                        <div className="flex justify-between items-center gap-4 mb-4">
                                            <span className="text-sm md:text-base font-bold tracking-tight group-hover:text-primary transition-colors pr-2">{site.name}</span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-[10px] md:text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg shadow-sm">{site.progress_percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-black/5 rounded-full h-1.5 md:h-2 mb-4 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-1000 relative"
                                                style={{ width: `${site.progress_percentage}%` }}
                                            />
                                        </div>
                                        <div className="flex flex-row justify-between items-center gap-4 text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                                    <span>{site.status_display || site.status}</span>
                                                </div>
                                                {site.end_date && (
                                                    <div className="flex items-center gap-1.5 opacity-60 font-mono whitespace-nowrap">
                                                        <Calendar className="h-2.5 w-2.5" />
                                                        <span>FIN: {format(new Date(site.end_date), 'd MMM yy', { locale: i18n.language === 'en' ? enUS : fr }).toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 group-hover:translate-x-1.5 transition-all group-hover:text-black shrink-0">
                                                {t('project_detail.journal')} <ArrowRight className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {associatedChantiers.length === 0 && (
                                    <div className="text-center py-12 bg-black/[0.02] rounded-[2rem] border-2 border-dashed border-black/5 opacity-40">
                                        <p className="text-[11px] font-black uppercase tracking-widest">{t('project_detail.no_active_construction')}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="solaris-glass rounded-[1.5rem] p-5 sm:p-8 border-none shadow-md w-full overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 md:mb-8 w-full min-w-0">
                            <h3 className="text-base md:text-lg font-bold tracking-tight uppercase flex items-center gap-3">
                                <div className="p-2 md:p-2.5 rounded-xl bg-black text-white shadow-lg">
                                    <Euro className="h-4 w-4 md:h-5 w-5" />
                                </div>
                                {t('project_detail.transactions')}
                            </h3>
                            {user?.role === 'ADMIN_MADIS' && (
                                <Link
                                    to={`/dashboard/finance/transactions/new?projectId=${id}`}
                                    className="inline-flex items-center justify-center rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all bg-black text-white hover:bg-zinc-800 h-9 px-5 shadow-lg whitespace-nowrap w-full sm:w-auto"
                                >
                                    <Plus className="mr-2 h-3.5 w-3.5" />
                                    {t('project_detail.new_transaction')}
                                </Link>
                            )}
                        </div>

                        {loadingTransactions ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-10 w-10 animate-spin text-black opacity-10" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-12 bg-black/[0.02] rounded-[2rem] border-2 border-dashed border-black/5 opacity-40">
                                <p className="text-[11px] font-black uppercase tracking-widest">{t('project_detail.no_transaction')}</p>
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto no-scrollbar rounded-xl border border-black/5 shadow-inner bg-white/10">
                                <table className="w-full min-w-[400px]">
                                    <thead>
                                        <tr className="border-b border-black/5 text-left bg-black/[0.02]">
                                            <th className="px-4 py-3 text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40">{t('project_detail.date_col')}</th>
                                            <th className="px-4 py-3 text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40">{t('project_detail.label_col')}</th>
                                            <th className="px-4 py-3 text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40 text-right">{t('project_detail.amount_col')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5 bg-white/20">
                                        {transactions.slice(0, 5).map((tx) => (
                                            <tr key={tx.id} className="hover:bg-black/[0.02] transition-colors group">
                                                <td className="px-4 py-2.5 whitespace-nowrap text-[10px] font-bold font-mono opacity-60">
                                                    {format(new Date(tx.date), 'dd/MM/yyyy')}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] md:text-[12px] font-bold leading-tight group-hover:text-primary transition-colors truncate max-w-[150px] md:max-w-[200px]">{tx.description || tx.category_display}</span>
                                                        <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest opacity-30">{tx.category_display}</span>
                                                    </div>
                                                </td>
                                                <td className={cn(
                                                    "px-4 py-2.5 text-right font-bold text-xs tracking-tight",
                                                    tx.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'
                                                )}>
                                                    <span className="whitespace-nowrap">{tx.type === 'INFLOW' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {transactions.length > 5 && (
                                    <div className="p-4 text-center bg-black/[0.01] border-t border-black/5">
                                        <Link to="/dashboard/finance/transactions" className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-black hover:text-primary transition-all flex items-center justify-center gap-2">
                                            {t('project_detail.full_statement')} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6 md:space-y-12 w-full min-w-0">
                    <div className="solaris-glass rounded-[1.5rem] p-5 sm:p-8 border-none shadow-md w-full overflow-hidden">
                        <h3 className="text-sm md:text-base font-bold tracking-tight uppercase mb-6 md:mb-8 flex items-center gap-3">
                            <div className="p-2 md:p-2.5 rounded-xl bg-black text-white shadow-lg">
                                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </div>
                            {t('project_detail.key_dates')}
                        </h3>
                        <div className="space-y-6 md:space-y-8">
                            <div className="grid gap-5">
                                <div className="flex items-start gap-4 group">
                                    <div className="p-2.5 md:p-3 rounded-xl bg-black/5 text-black group-hover:bg-black group-hover:text-white group-hover:shadow-lg transition-all duration-500">
                                        <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">{t('project_detail.start_date')}</div>
                                        <div className="text-[11px] md:text-xs font-bold tracking-tight uppercase">
                                            {project.start_date ? format(new Date(project.start_date), 'd MMMM yyyy', { locale: i18n.language === 'en' ? enUS : fr }) : t('project_detail.not_planned')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 group">
                                    <div className="p-2.5 md:p-3 rounded-xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-lg transition-all duration-500">
                                        <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">{t('project_detail.estimated_end')}</div>
                                        <div className="text-[11px] md:text-xs font-bold tracking-tight uppercase text-amber-600 group-hover:text-inherit transition-colors">
                                            {project.estimated_end_date ? format(new Date(project.estimated_end_date), 'd MMMM yyyy', { locale: i18n.language === 'en' ? enUS : fr }) : t('project_detail.not_defined')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="solaris-glass rounded-[1.5rem] p-5 sm:p-8 border-none shadow-md w-full overflow-hidden">
                        <h3 className="text-sm md:text-base font-bold tracking-tight uppercase mb-6 md:mb-8 flex items-center gap-3">
                            <div className="p-2 md:p-2.5 rounded-xl bg-black text-white shadow-lg">
                                <Euro className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </div>
                            {t('project_detail.finances')}
                        </h3>
                        <div className="space-y-6 md:space-y-8">
                            <div className="group">
                                <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 mb-2 group-hover:opacity-100 transition-opacity">{t('project_detail.total_budget')}</div>
                                <div className="flex items-center gap-3 text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
                                    <div className="p-1.5 rounded-xl bg-black/5 text-black">
                                        <Euro className="h-4 w-4 sm:h-5 w-5" />
                                    </div>
                                    <span className="break-all">{formatCurrency(project.budget, true)}</span>
                                </div>
                            </div>

                            {project.budget > 0 && (
                                <div className="pt-6 md:pt-8 border-t border-black/5 space-y-4 md:space-y-5">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40">{t('project_detail.consumed')}</span>
                                            <span className="text-base md:text-lg font-bold tracking-tight">{formatCurrency(project.budget_spent, true)}</span>
                                        </div>
                                        <div className="px-2 py-0.5 bg-black text-white text-[8px] md:text-[9px] font-bold rounded-lg shadow-md">
                                            {project.budget_consumed_percentage}%
                                        </div>
                                    </div>
                                    <div className="w-full bg-black/5 rounded-full h-1.5 md:h-2 overflow-hidden shadow-inner">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000 relative after:absolute after:inset-0 after:bg-white/20",
                                                project.budget_consumed_percentage > 90 ? "bg-rose-500" :
                                                    project.budget_consumed_percentage > 75 ? "bg-amber-500" : "bg-emerald-500"
                                            )}
                                            style={{ width: `${Math.min(project.budget_consumed_percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex flex-row justify-between items-center text-[7px] md:text-[8px] font-bold uppercase tracking-widest opacity-40">
                                        <span>{t('project_detail.real')}</span>
                                        <span>{t('project_detail.remaining')} {formatCurrency(project.budget - project.budget_spent, true)}</span>
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
