import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { HardHat, Calendar, MapPin, ArrowRight, Loader2, Camera, Plus, ClipboardList, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';


export default function ConstructionList() {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('CONSTRUCTION'); // 'CONSTRUCTION' or 'MAINTENANCE'
    const dateLocale = i18n.language === 'fr' ? fr : enUS;


    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = async () => {
        try {
            const response = await api.get('/construction/sites/');
            setSites(response.data.results || response.data || []);
        } catch (err) {
            setError(t('construction.list.load_error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'EN_COURS': return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary';
            case 'TERMINE': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'SUSPENDU': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
            case 'PREPARATION': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-8 md:pb-12 px-4 md:px-8">
            {/* Header Solaris Style */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-black/5 dark:border-white/5">
                <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none mb-1.5 md:mb-2">
                        {activeTab === 'CONSTRUCTION' ? t('construction.list.title_construction') : t('construction.list.title_maintenance')}
                    </h1>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider opacity-40 leading-relaxed md:leading-normal">
                        {activeTab === 'CONSTRUCTION'
                            ? t('construction.list.subtitle_construction')
                            : t('construction.list.subtitle_maintenance')}
                    </p>
                </div>
                {user?.role === 'ADMIN_MADIS' && (
                    <Link
                        to="/dashboard/construction/new"
                        className="inline-flex items-center justify-center rounded-xl text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-all bg-black text-white dark:bg-primary dark:solaris-neon-pink hover:bg-black/90 h-9 px-5 shadow-md group whitespace-nowrap"
                    >
                        <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
                        {activeTab === 'CONSTRUCTION' ? t('construction.list.new_construction') : t('construction.list.new_maintenance')}
                    </Link>
                )}
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="-mx-4 px-4 md:mx-0 md:px-0 mb-4 [&::-webkit-scrollbar]:hidden">
                <div className="solaris-glass rounded-xl md:rounded-2xl p-1 md:p-1.5 flex gap-2 md:gap-3 w-fit mb-4 shadow-sm px-2 whitespace-nowrap">
                    {[
                        { id: 'CONSTRUCTION', label: t('construction.list.tabs.construction'), icon: HardHat, count: sites.filter(s => s.project_category === 'CONSTRUCTION').length },
                        { id: 'MAINTENANCE', label: t('construction.list.tabs.maintenance'), fullLabel: t('construction.list.tabs.maintenance'), icon: ClipboardList, count: sites.filter(s => s.project_category === 'MAINTENANCE').length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-all duration-300 group",
                                activeTab === tab.id
                                    ? "bg-primary text-white shadow-md"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <tab.icon className={cn("h-3.5 w-3.5 transition-transform group-hover:scale-105", activeTab === tab.id ? "text-white" : "text-muted-foreground")} />
                            {tab.label}
                            <span className={cn(
                                "ml-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-bold tracking-normal transition-colors",
                                activeTab === tab.id ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 text-black/40 dark:text-white/40"
                            )}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {sites.filter(s => s.project_category === activeTab).length === 0 ? (
                <div className="solaris-glass rounded-[1.5rem] p-24 text-center border-none shadow-sm dark:bg-black/40">
                    <div className="mx-auto h-16 w-16 rounded-xl bg-black/[0.03] dark:bg-white/5 flex items-center justify-center mb-6">
                        {activeTab === 'CONSTRUCTION' ? (
                            <HardHat className="h-8 w-8 text-black/10 dark:text-white/10" />
                        ) : (
                            <ClipboardList className="h-8 w-8 text-black/10 dark:text-white/10" />
                        )}
                    </div>
                    <h3 className="text-[12px] font-bold uppercase tracking-widest mb-3">
                        {activeTab === 'CONSTRUCTION' ? t('construction.list.empty.title_construction') : t('construction.list.empty.title_maintenance')}
                    </h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 max-w-xs mx-auto leading-relaxed">
                        {t('construction.list.empty.subtitle')}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sites
                        .filter(s => s.project_category === activeTab)
                        .map((site) => (
                            <Link
                                key={site.id}
                                to={`/dashboard/construction/${site.id}`}
                                className="solaris-glass rounded-[1.5rem] border-none shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-500 group flex flex-col h-full dark:bg-black/40"
                            >
                                <div className="p-6 md:p-8 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold tracking-tight uppercase leading-tight group-hover:text-red-600 transition-colors truncate">
                                                {site.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <Building2 className="h-3 w-3 text-black/20 dark:text-white/20" />
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 truncate">
                                                    {site.property_name || t('construction.list.card.not_defined')}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest whitespace-nowrap shadow-sm transition-all duration-500 group-hover:scale-105",
                                            site.status === 'EN_COURS' ? "bg-black dark:bg-primary text-white" : getStatusColor(site.status)
                                        )}>
                                            {t(`construction.list.status.${site.status}`, site.status_display || site.status)}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-6 flex-1">
                                        <div className="flex items-center gap-3 text-black/60 dark:text-white/60 group/loc">
                                            <div className="p-1.5 bg-black/[0.03] dark:bg-white/5 rounded-lg transition-all group-hover/loc:bg-black dark:group-hover/loc:bg-white/20 group-hover/loc:text-white">
                                                <MapPin className="h-3 w-3" />
                                            </div>
                                            <span className="text-[10px] font-bold truncate">
                                                {site.address ? (
                                                    <>{site.address}{site.city ? `, ${site.city}` : ''}</>
                                                ) : t('construction.list.card.no_location')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-black/60 dark:text-white/60 group/cal">
                                            <div className="p-1.5 bg-black/[0.03] dark:bg-white/5 rounded-lg transition-all group-hover/cal:bg-black dark:group-hover/cal:bg-white/20 group-hover/cal:text-white">
                                                <Calendar className="h-3 w-3" />
                                            </div>
                                            <span className="text-[10px] font-bold font-mono">
                                                {site.start_date ? format(new Date(site.start_date), 'd MMM yyyy', { locale: dateLocale }) : '---'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-black/60 dark:text-white/60 group/cam">
                                            <div className="p-1.5 bg-black/[0.03] dark:bg-white/5 rounded-lg transition-all group-hover/cam:bg-black dark:group-hover/cam:bg-white/20 group-hover/cam:text-white">
                                                <Camera className="h-3 w-3" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                                {site.photos_count || 0} {t('construction.list.card.photos')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        {site.status !== 'SUSPENDU' && (
                                            <div className="space-y-2 mb-6">
                                                <div className="flex justify-between items-baseline px-0.5">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">{t('construction.list.card.progress')}</span>
                                                    <span className="text-xl font-bold tracking-tight">{site.progress_percentage}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-black/[0.03] dark:bg-white/10 rounded-full overflow-hidden p-[0.5px] border border-black/5 dark:border-white/5 shadow-inner">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000 ease-out",
                                                            activeTab === 'MAINTENANCE' ? "bg-black/60 dark:bg-white/40" : "bg-black dark:bg-white"
                                                        )}
                                                        style={{ width: `${site.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-black/5 dark:border-white/5 flex justify-end">
                                            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-black dark:text-white group-hover:text-red-600 transition-all group-hover:translate-x-1">
                                                {t('construction.list.card.details')}
                                                <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                </div>
            )}
        </div>
    );
}
