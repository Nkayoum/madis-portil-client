import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { HardHat, Calendar, MapPin, ArrowRight, Loader2, Camera, Plus, ClipboardList, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


export default function ConstructionList() {
    const { user } = useAuth();
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('CONSTRUCTION'); // 'CONSTRUCTION' or 'MAINTENANCE'


    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = async () => {
        try {
            const response = await api.get('/construction/sites/');
            setSites(response.data.results || response.data || []);
        } catch (err) {
            setError('Impossible de charger les chantiers.');
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
        <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-8 md:pb-16 px-4 md:px-10">
            {/* Header Solaris Style */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none mb-2 md:mb-3">
                        {activeTab === 'CONSTRUCTION' ? 'Suivi de Chantier' : 'Suivi des Interventions'}
                    </h1>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider opacity-60 leading-relaxed md:leading-normal">
                        {activeTab === 'CONSTRUCTION'
                            ? "Visualisation en temps réel de l'avancement des développements opérationnels."
                            : "Gestion centralisée des interventions de maintenance et d'entretien technique."}
                    </p>
                </div>
                {user?.role === 'ADMIN_MADIS' && (
                    <Link
                        to="/dashboard/construction/new"
                        className="inline-flex items-center justify-center rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-black text-white dark:bg-primary dark:solaris-neon-pink hover:bg-black/90 h-11 md:h-14 px-6 md:px-10 shadow-xl shadow-black/10 group whitespace-nowrap"
                    >
                        <Plus className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform duration-500" />
                        {activeTab === 'CONSTRUCTION' ? 'Nouveau Chantier' : 'Nouvelle Intervention'}
                    </Link>
                )}
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="-mx-4 px-4 md:mx-0 md:px-0 mb-8 [&::-webkit-scrollbar]:hidden">
                <div className="solaris-glass rounded-full p-1.5 md:p-2 flex gap-2 md:gap-4 w-fit shadow-lg px-2 md:px-3 whitespace-nowrap">
                    {[
                        { id: 'CONSTRUCTION', label: "Chantiers", icon: HardHat, count: sites.filter(s => s.project_category === 'CONSTRUCTION').length },
                        { id: 'MAINTENANCE', label: "Maintenance", fullLabel: "Maintenance & Entretien", icon: ClipboardList, count: sites.filter(s => s.project_category === 'MAINTENANCE').length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-3.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-500 group relative",
                                activeTab === tab.id
                                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105"
                                    : "text-muted-foreground hover:text-foreground dark:hover:bg-white/5"
                            )}
                        >
                            <tab.icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-white" : "text-muted-foreground")} />
                            <span className="hidden md:inline">{tab.fullLabel || tab.label}</span>
                            <span className="md:hidden">{tab.label}</span>
                            <span className={cn(
                                "ml-1.5 md:ml-2 px-1.5 md:px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-bold tracking-normal transition-colors",
                                activeTab === tab.id ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 text-black/40 dark:text-white/40"
                            )}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {sites.filter(s => s.project_category === activeTab).length === 0 ? (
                <div className="solaris-glass rounded-[2.5rem] p-32 text-center border-none shadow-xl mt-10 dark:bg-black/40">
                    <div className="mx-auto h-24 w-24 rounded-full bg-black/[0.03] dark:bg-white/5 flex items-center justify-center mb-10">
                        {activeTab === 'CONSTRUCTION' ? (
                            <HardHat className="h-10 w-10 text-black/10 dark:text-white/10" />
                        ) : (
                            <ClipboardList className="h-10 w-10 text-black/10 dark:text-white/10" />
                        )}
                    </div>
                    <h3 className="text-[14px] font-bold uppercase tracking-[0.2em] mb-4">
                        {activeTab === 'CONSTRUCTION' ? 'Aucun Chantier Actif' : 'Zéro Intervention'}
                    </h3>
                    <p className="text-[10px] font-semibold uppercase tracking-widest opacity-30 max-w-xs mx-auto leading-relaxed">
                        {activeTab === 'CONSTRUCTION'
                            ? "Déploiement opérationnel en attente. Aucun développement actif n'est répertorié."
                            : "Protocole de maintenance vierge. Aucune intervention technique n'est planifiée."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {sites
                        .filter(s => s.project_category === activeTab)
                        .map((site) => (
                            <Link
                                key={site.id}
                                to={`/dashboard/construction/${site.id}`}
                                className="solaris-glass rounded-[2.5rem] border-none shadow-xl overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group flex flex-col h-full dark:bg-black/40"
                            >
                                <div className="p-10 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start gap-4 mb-6">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-bold tracking-tight uppercase leading-tight group-hover:text-red-600 transition-colors truncate">
                                                {site.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Building2 className="h-3.5 w-3.5 text-black/20 dark:text-white/20" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 truncate">
                                                    {site.property_name || 'Bien non défini'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm transition-all duration-500 group-hover:scale-105",
                                            site.status === 'EN_COURS' ? "bg-black dark:bg-primary text-white" : getStatusColor(site.status)
                                        )}>
                                            {site.status_display || site.status}
                                        </span>
                                    </div>

                                    <div className="space-y-4 mb-10 flex-1">
                                        <div className="flex items-center gap-4 text-black/60 dark:text-white/60 group/loc">
                                            <div className="p-2 bg-black/[0.03] dark:bg-white/5 rounded-lg group-hover/loc:bg-black dark:group-hover/loc:bg-white/20 group-hover/loc:text-white transition-all">
                                                <MapPin className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-[11px] font-bold truncate">
                                                {site.address ? (
                                                    <>{site.address}{site.city ? `, ${site.city}` : ''}</>
                                                ) : 'Localisation non définie'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-black/60 dark:text-white/60 group/cal">
                                            <div className="p-2 bg-black/[0.03] dark:bg-white/5 rounded-lg group-hover/cal:bg-black dark:group-hover/cal:bg-white/20 group-hover/cal:text-white transition-all">
                                                <Calendar className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-[11px] font-bold font-mono">
                                                {site.start_date ? format(new Date(site.start_date), 'd MMM yyyy', { locale: fr }) : 'Non défini'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-black/60 dark:text-white/60 group/cam">
                                            <div className="p-2 bg-black/[0.03] dark:bg-white/5 rounded-lg group-hover/cam:bg-black dark:group-hover/cam:bg-white/20 group-hover/cam:text-white transition-all">
                                                <Camera className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">
                                                {site.photos_count || 0} Documentation Photos
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        {site.status !== 'SUSPENDU' && (
                                            <div className="space-y-4 mb-8">
                                                <div className="flex justify-between items-baseline px-1">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Niveau de Progression</span>
                                                    <span className="text-2xl font-black tracking-tighter">{site.progress_percentage}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-black/[0.03] dark:bg-white/10 rounded-full overflow-hidden p-[1px] border border-black/5 dark:border-white/5 shadow-inner">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-out",
                                                            activeTab === 'MAINTENANCE' ? "bg-black/60 dark:bg-white/40" : "bg-black dark:bg-white"
                                                        )}
                                                        style={{ width: `${site.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-black/5 dark:border-white/5 flex justify-end">
                                            <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-black dark:text-white hover:text-red-600 dark:hover:text-primary transition-all group-hover:translate-x-1">
                                                Accéder au registre
                                                <ArrowRight className="ml-3 h-4 w-4" />
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
