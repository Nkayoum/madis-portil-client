import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { Building2, Calendar, Euro, ArrowRight, Loader2, Plus, HardHat, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../lib/utils';

export default function ProjectsList() {
    // const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('CONSTRUCTION'); // 'CONSTRUCTION' or 'MAINTENANCE'

    const fetchProjects = useCallback(async () => {
        try {
            const response = await api.get('/projects/');
            setProjects(response.data.results || response.data || []);
        } catch (err) {
            setError(t('projects.load_error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'EN_COURS': return 'bg-blue-500 text-white';
            case 'TERMINE': return 'bg-emerald-500 text-white';
            case 'ANNULE': return 'bg-rose-500 text-white';
            case 'PLANIFIE': return 'bg-orange-500 text-white';
            default: return 'bg-black text-white';
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-black opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('projects.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 rounded-[2rem] bg-rose-500/10 text-rose-600 border border-rose-500/20 font-black uppercase text-[10px] tracking-widest text-center animate-fade-in shadow-xl">
                {error}
            </div>
        );
    }

    const filteredProjects = projects.filter(p => p.category === activeTab);

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto px-4 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="space-y-0.5">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase leading-none">
                        {activeTab === 'CONSTRUCTION' ? t('projects.list_title_construction') : t('projects.list_title_maintenance')}
                    </h1>
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-40 leading-relaxed">
                        {activeTab === 'CONSTRUCTION'
                            ? t('projects.list_subtitle_construction')
                            : t('projects.list_subtitle_maintenance')}
                    </p>
                </div>
            </div>
            {/* Tabs Solaris Style */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="-mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
                <div style={{ display: 'flex', width: 'max-content', gap: '16px' }} className="items-center mb-6 md:mb-8 border-none">
                    <button
                        onClick={() => setActiveTab('CONSTRUCTION')}
                        className={cn(
                            "pb-2 md:pb-2.5 text-[9px] font-bold uppercase tracking-widest transition-all px-1 flex items-center gap-2 relative whitespace-nowrap",
                            activeTab === 'CONSTRUCTION'
                                ? 'text-black dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-black dark:after:bg-white after:rounded-full after:shadow-sm'
                                : 'text-muted-foreground dark:text-white/40 opacity-40 hover:opacity-100 dark:hover:text-white'
                        )}
                    >
                        <HardHat className="h-3.5 w-3.5" />
                        {t('projects.tab_construction')}
                        <span className={cn(
                            "ml-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[7px] font-bold shadow-sm",
                            activeTab === 'CONSTRUCTION' ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/5 dark:bg-white/10 text-black dark:text-white"
                        )}>
                            {projects.filter(p => p.category === 'CONSTRUCTION').length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('MAINTENANCE')}
                        className={cn(
                            "pb-2 md:pb-2.5 text-[9px] font-bold uppercase tracking-widest transition-all px-1 flex items-center gap-2 relative whitespace-nowrap",
                            activeTab === 'MAINTENANCE'
                                ? 'text-black dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-black dark:after:bg-white after:rounded-full after:shadow-sm'
                                : 'text-muted-foreground dark:text-white/40 opacity-40 hover:opacity-100 dark:hover:text-white'
                        )}
                    >
                        <ClipboardList className="h-3.5 w-3.5" />
                        {t('projects.tab_maintenance')}
                        <span className={cn(
                            "ml-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[7px] font-bold shadow-sm",
                            activeTab === 'MAINTENANCE' ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/5 dark:bg-white/10 text-black dark:text-white"
                        )}>
                            {projects.filter(p => p.category === 'MAINTENANCE').length}
                        </span>
                    </button>
                </div>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="solaris-glass rounded-[1.5rem] p-16 text-center border-none shadow-sm animate-in zoom-in-95 duration-500">
                    <div className="mx-auto h-16 w-16 rounded-[1.25rem] bg-white shadow-md flex items-center justify-center mb-6 transform rotate-12">
                        {activeTab === 'CONSTRUCTION' ? (
                            <HardHat className="h-8 w-8 text-black/10" />
                        ) : (
                            <ClipboardList className="h-8 w-8 text-black/10" />
                        )}
                    </div>
                    <h3 className="text-xl font-bold tracking-tight uppercase mb-2">
                        {activeTab === 'CONSTRUCTION' ? t('projects.no_projects') : t('projects.no_maintenance')}
                    </h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 max-w-sm mx-auto">
                        {t('projects.empty_register')}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <Link
                            key={project.id}
                            to={`/dashboard/projects/${project.id}`}
                            className="group relative solaris-glass rounded-[1.2rem] p-4 border-none shadow-sm hover:shadow-lg transition-all duration-500 bg-white/40 overflow-hidden flex flex-col hover:scale-[1.01] hover:-translate-y-0.5"
                        >
                            <div className="mb-4">
                                <div className="flex items-start gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black shadow-sm transition-transform group-hover:rotate-6 duration-500 flex-shrink-0">
                                        {project.category === 'CONSTRUCTION' ? <HardHat className="h-3 w-3" /> : <ClipboardList className="h-3 w-3" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-[11px] font-bold tracking-tight group-hover:text-primary transition-colors leading-tight line-clamp-2 uppercase">
                                            {project.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-0.5 opacity-40">
                                            <Building2 className="h-2.5 w-2.5 flex-shrink-0" />
                                            <span className="text-[7.5px] font-bold uppercase tracking-widest truncate">{project.property_name || t('projects.not_defined')}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={cn(
                                    "inline-block px-2 py-0.5 rounded-[4px] text-[7.5px] font-bold uppercase tracking-widest shadow-sm whitespace-nowrap",
                                    getStatusColor(project.status)
                                )}>
                                    {project.status_display || project.status}
                                </span>
                            </div>

                            <p className="text-[9.5px] font-medium text-muted-foreground dark:text-white/70 mb-4 line-clamp-2 leading-relaxed opacity-60">
                                {project.description}
                            </p>

                            <div className="grid grid-cols-2 gap-3 mt-auto pt-3 border-t border-black/5 dark:border-white/5">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[7px] font-bold uppercase tracking-widest opacity-30 text-[6.5px]">{t('projects.budget')}</span>
                                    <div className="flex items-center gap-1 font-bold text-[9.5px] tracking-tight text-black dark:text-white">
                                        <div className="p-0.5 rounded bg-emerald-500/10 text-emerald-600">
                                            <Euro className="h-2.5 w-2.5" />
                                        </div>
                                        <span className="whitespace-nowrap">{formatCurrency(project.budget, true)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[7px] font-bold uppercase tracking-widest opacity-30 text-[6.5px]">{t('projects.launch')}</span>
                                    <div className="flex items-center gap-1 font-bold text-[9.5px] tracking-tight text-black dark:text-white">
                                        <div className="p-0.5 rounded bg-blue-500/10 text-blue-600">
                                            <Calendar className="h-2.5 w-2.5" />
                                        </div>
                                        <span>{project.start_date ? format(new Date(project.start_date), 'd MMM yy', { locale: i18n.language === 'en' ? enUS : fr }).toUpperCase() : '---'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-4 right-5 p-2 rounded-lg bg-black/5 dark:bg-white/10 text-black dark:text-white opacity-0 group-hover:opacity-100 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all transform translate-x-2 group-hover:translate-x-0 duration-500 shadow-sm">
                                <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
