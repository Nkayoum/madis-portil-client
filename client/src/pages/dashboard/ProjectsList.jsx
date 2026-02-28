import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { Building2, Calendar, Euro, ArrowRight, Loader2, Plus, HardHat, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { cn, formatCurrency } from '../../lib/utils';

export default function ProjectsList() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('CONSTRUCTION'); // 'CONSTRUCTION' or 'MAINTENANCE'

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/');
            setProjects(response.data.results || response.data || []);
        } catch (err) {
            setError('Impossible de charger les projets.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Chargement des chantiers...</p>
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
        <div className="space-y-12 animate-fade-in max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 md:mb-16">
                <div className="space-y-1.5 md:space-y-2">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none">
                        {activeTab === 'CONSTRUCTION' ? 'Mes Projets de Développement' : 'Entretien & Maintenance'}
                    </h1>
                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground dark:text-white/60 opacity-60 leading-relaxed">
                        {activeTab === 'CONSTRUCTION'
                            ? "Suivez vos projets de développement immobilier de haut standing."
                            : "Suivez les interventions d'entretien et de maintenance technique."}
                    </p>
                </div>
            </div>

            {/* Tabs Solaris Style */}
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex items-center gap-6 md:gap-10 mb-8 md:mb-12 border-none">
                    <button
                        onClick={() => setActiveTab('CONSTRUCTION')}
                        className={cn(
                            "pb-3 md:pb-4 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all px-1 md:px-2 flex items-center gap-3 md:gap-4 relative whitespace-nowrap",
                            activeTab === 'CONSTRUCTION'
                                ? 'text-black dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-black dark:after:bg-white after:rounded-full after:shadow-lg scale-105'
                                : 'text-muted-foreground dark:text-white/40 opacity-40 hover:opacity-100 dark:hover:text-white hover:scale-105'
                        )}
                    >
                        <HardHat className="h-4 w-4 md:h-5 md:w-5" />
                        Développement
                        <span className={cn(
                            "ml-1.5 md:ml-2 min-w-[20px] md:min-w-[24px] h-[20px] md:h-[24px] flex items-center justify-center rounded-full text-[8px] md:text-[10px] font-black shadow-sm",
                            activeTab === 'CONSTRUCTION' ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/5 dark:bg-white/10 text-black dark:text-white"
                        )}>
                            {projects.filter(p => p.category === 'CONSTRUCTION').length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('MAINTENANCE')}
                        className={cn(
                            "pb-3 md:pb-4 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all px-1 md:px-2 flex items-center gap-3 md:gap-4 relative whitespace-nowrap",
                            activeTab === 'MAINTENANCE'
                                ? 'text-black dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-black dark:after:bg-white after:rounded-full after:shadow-lg scale-105'
                                : 'text-muted-foreground dark:text-white/40 opacity-40 hover:opacity-100 dark:hover:text-white hover:scale-105'
                        )}
                    >
                        <ClipboardList className="h-4 w-4 md:h-5 md:w-5" />
                        Maintenance
                        <span className={cn(
                            "ml-1.5 md:ml-2 min-w-[20px] md:min-w-[24px] h-[20px] md:h-[24px] flex items-center justify-center rounded-full text-[8px] md:text-[10px] font-black shadow-sm",
                            activeTab === 'MAINTENANCE' ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/5 dark:bg-white/10 text-black dark:text-white"
                        )}>
                            {projects.filter(p => p.category === 'MAINTENANCE').length}
                        </span>
                    </button>
                </div>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="solaris-glass rounded-[3rem] p-24 text-center border-none shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="mx-auto h-24 w-24 rounded-[2.5rem] bg-white shadow-lg flex items-center justify-center mb-8 transform rotate-12">
                        {activeTab === 'CONSTRUCTION' ? (
                            <HardHat className="h-12 w-12 text-black/10" />
                        ) : (
                            <ClipboardList className="h-12 w-12 text-black/10" />
                        )}
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">
                        {activeTab === 'CONSTRUCTION' ? 'Aucun projet' : 'Aucune intervention'}
                    </h3>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground dark:text-white/40 opacity-40 max-w-sm mx-auto">
                        {activeTab === 'CONSTRUCTION'
                            ? "Vous n'avez pas de projets de développement actifs répertoriés."
                            : "Aucune intervention de maintenance n'est enregistrée pour le moment."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <Link
                            key={project.id}
                            to={`/dashboard/projects/${project.id}`}
                            className="group relative solaris-glass rounded-[2.5rem] p-8 border-none shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/40 overflow-hidden flex flex-col hover:scale-[1.02] hover:-translate-y-2"
                        >
                            <div className="mb-6">
                                <div className="flex items-start gap-4 mb-3">
                                    <div className="p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] bg-black dark:bg-white text-white dark:text-black shadow-xl transition-transform group-hover:rotate-6 duration-500 flex-shrink-0">
                                        {project.category === 'CONSTRUCTION' ? <HardHat className="h-5 w-5 sm:h-6 sm:w-6" /> : <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg sm:text-xl font-black tracking-tighter group-hover:text-primary transition-colors leading-tight break-words">
                                            {project.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <Building2 className="h-3 w-3 flex-shrink-0" />
                                            <span className="text-[10px] font-black uppercase tracking-widest truncate">{project.property_name || 'Bien non défini'}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={cn(
                                    "inline-block px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap",
                                    getStatusColor(project.status)
                                )}>
                                    {project.status_display || project.status}
                                </span>
                            </div>

                            <p className="text-[12px] font-medium text-muted-foreground dark:text-white/70 mb-10 line-clamp-3 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                                {project.description}
                            </p>

                            <div className="grid grid-cols-2 gap-8 mt-auto pt-8 border-t border-black/5 dark:border-white/5">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Budget</span>
                                    <div className="flex items-center gap-2 font-black text-sm tracking-tight text-black dark:text-white">
                                        <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600">
                                            <Euro className="h-3 w-3" />
                                        </div>
                                        <span className="whitespace-nowrap">{formatCurrency(project.budget, true)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Lancement</span>
                                    <div className="flex items-center gap-2 font-black text-sm tracking-tight text-black dark:text-white">
                                        <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600">
                                            <Calendar className="h-3 w-3" />
                                        </div>
                                        <span>{project.start_date ? format(new Date(project.start_date), 'd MMM yy', { locale: fr }).toUpperCase() : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-6 right-8 p-3.5 rounded-[1.2rem] bg-black/5 dark:bg-white/10 text-black dark:text-white opacity-0 group-hover:opacity-100 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all transform translate-x-4 group-hover:translate-x-0 duration-500 shadow-xl">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
