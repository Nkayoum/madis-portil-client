import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import {
    HardHat,
    Calendar,
    MessageSquare,
    Clock,
    ArrowRight,
    Activity,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ChefChantierDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        sites: [],
        upcomingMilestones: [],
        recentLogs: []
    });

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

                setData({
                    sites: sitesData,
                    upcomingMilestones: milestonesData
                        .sort((a, b) => new Date(a.end_date || a.start_date) - new Date(b.end_date || b.start_date))
                        .slice(0, 5),
                    recentLogs: logsData.slice(0, 5)
                });
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
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronisation Opérationnelle...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Sites Overview */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-xl font-black tracking-tighter flex items-center gap-3 px-2">
                        <HardHat className="h-5 w-5 text-primary" />
                        MES CHANTIERS ACTIFS
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                        {data.sites.length > 0 ? (
                            data.sites.map(site => (
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
                            <div className="col-span-full py-12 solaris-glass rounded-[2rem] border border-dashed border-black/10 flex flex-col items-center justify-center text-muted-foreground">
                                <Activity className="h-8 w-8 mb-3 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Aucun chantier assigné</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-black tracking-tighter flex items-center gap-3 px-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        PROCHAINS JALONS
                    </h3>
                    <div className="solaris-glass rounded-[2.5rem] border border-white/20 dark:border-white/5 p-6 space-y-4">
                        {data.upcomingMilestones.length > 0 ? (
                            data.upcomingMilestones.map(milestone => {
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
                                                {date ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Date non définie'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-[10px] font-black uppercase tracking-widest text-center py-8 opacity-40">Tout est à jour</p>
                        )}
                        <Link to="/dashboard/construction" className="block text-center text-[10px] font-black uppercase tracking-widest text-primary hover:underline pt-2">
                            Voir tout le planning
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-6">
                <h3 className="text-xl font-black tracking-tighter flex items-center gap-3 px-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    DERNIÈRES ENTRÉES DU JOURNAL
                </h3>
                <div className="solaris-glass rounded-[3rem] border border-white/20 dark:border-white/5 overflow-hidden divide-y divide-black/5 dark:divide-white/5">
                    {data.recentLogs.length > 0 ? (
                        data.recentLogs.map(log => (
                            <div key={log.id} className="p-8 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{log.site_name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}</p>
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
                            <Clock className="h-12 w-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Aucune activité récente</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
