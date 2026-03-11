import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Plus, Construction, HardHat, Calendar, ClipboardList, Clock, ArrowRight, Loader2, LayoutDashboard, History, MoreHorizontal, Camera, MapPin, AlertCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export default function ChefChantierDashboard() {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [sites, setSites] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [milestones, setMilestones] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);

    const dateLocale = i18n.language === 'fr' ? fr : enUS;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Individual fetches to be more resilient
                const [sitesRes, milestonesRes, logsRes] = await Promise.allSettled([
                    api.get('/construction/sites/'),
                    api.get('/construction/milestones/?completed=false'),
                    api.get('/construction/journal/')
                ]);

                const sitesData = sitesRes.status === 'fulfilled' ? (sitesRes.value.data.results || []) : [];
                const milestonesData = milestonesRes.status === 'fulfilled' ? (milestonesRes.value.data.results || []) : [];
                const logsData = logsRes.status === 'fulfilled' ? (logsRes.value.data.results || []) : [];

                setSites(sitesData);
                setMilestones(milestonesData
                    .sort((a, b) => new Date(a.end_date || a.start_date) - new Date(b.end_date || b.start_date))
                    .slice(0, 5));
                setRecentLogs(logsData.slice(0, 5));

            } catch (err) {
                console.error("Failed to fetch Chef Chantier data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 animate-in fade-in duration-700">
                <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                    {t('common.sync_ops')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Sites Overview */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-black/5 dark:border-white/5 animate-slide-up">
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase leading-none mb-1.5">
                                {t('construction.foreman.active_sites')}
                            </h1>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                                    {sites.length} {t('construction.active_sites_count', { count: sites.length })}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                to="/dashboard/construction/new"
                                className="h-9 px-5 rounded-xl bg-black text-white dark:bg-primary dark:solaris-neon-pink text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {t('construction.list.new_construction')}
                            </Link>
                        </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                        {sites.length > 0 ? (
                            sites.map(site => (
                                <Link
                                    key={site.id}
                                    to={`/dashboard/construction/${site.id}`}
                                    className="group solaris-glass p-8 border border-white/20 dark:border-white/5 dark:bg-black/40 rounded-[2.5rem] transition-all hover:scale-[1.02] hover:shadow-2xl"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <h4 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">{site.name}</h4>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{site.project_name}</p>
                                        </div>
                                        <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-xl">{site.progress_percentage}%</span>
                                    </div>
                                    <div className="w-full bg-black/5 dark:bg-white/10 h-2.5 rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000"
                                            style={{ width: `${site.progress_percentage}%` }}
                                        />
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 opacity-20">
                                <Construction className="h-10 w-10 mb-3" />
                                <p className="text-[9px] font-bold uppercase tracking-widest">{t('construction.foreman.no_active_sites')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-black tracking-tighter flex items-center gap-3 px-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {t('construction.foreman.upcoming_milestones')}
                    </h3>
                    <div className="solaris-glass rounded-[2.5rem] border border-white/20 dark:border-white/5 p-6 space-y-4">
                        {milestones.length > 0 ? (
                            milestones.map(milestone => {
                                const date = milestone.end_date || milestone.start_date;
                                const isOverdue = date && new Date(date) < new Date();
                                return (
                                    <div key={milestone.id} className="flex gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5">
                                        <div className={cn(
                                            "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center",
                                            isOverdue ? "bg-red-100 text-red-500" : "bg-primary/10 text-primary"
                                        )}>
                                            {isOverdue ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-xs uppercase tracking-tight truncate">{milestone.description}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground">
                                                {date ? format(new Date(date), 'dd MMM', { locale: dateLocale }) : t('common.date_undefined')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-[10px] font-black uppercase tracking-widest text-center py-8 opacity-40">{t('construction.foreman.all_up_to_date')}</p>
                        )}
                        <Link to="/dashboard/construction" className="block text-center text-[10px] font-black uppercase tracking-widest text-primary hover:underline pt-2">
                            {t('construction.foreman.view_all_planning')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-6">
                <h3 className="text-xl font-black tracking-tighter flex items-center gap-3 px-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    {t('construction.foreman.recent_journal_entries')}
                </h3>
                <div className="solaris-glass rounded-[3rem] border border-white/20 dark:border-white/5 overflow-hidden divide-y divide-black/5 dark:divide-white/5">
                    {recentLogs.length > 0 ? (
                        recentLogs.map(log => (
                            <div key={log.id} className="p-8 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <ClipboardList className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{log.site_name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                                {format(new Date(log.created_at), 'PPP', { locale: dateLocale })}
                                            </p>
                                        </div>
                                    </div>
                                    <Link to={`/dashboard/construction/${log.site}/journal`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                    </Link>
                                </div>
                                <p className="text-sm font-medium leading-relaxed text-muted-foreground line-clamp-2 italic">
                                    "{log.content}"
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="py-24 text-center opacity-30">
                            <History className="h-12 w-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{t('construction.foreman.no_recent_activity')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
