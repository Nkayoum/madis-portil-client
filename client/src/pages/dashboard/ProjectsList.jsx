import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { Building2, Calendar, Euro, ArrowRight, Loader2, Plus, HardHat, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

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
            case 'EN_COURS': return 'bg-primary/10 text-primary';
            case 'TERMINE': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'ANNULE': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
            case 'PLANIFIE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
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

    if (error) {
        return (
            <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                {error}
            </div>
        );
    }

    const filteredProjects = projects.filter(p => p.category === activeTab);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">
                        {activeTab === 'CONSTRUCTION' ? 'Mes Projets de Développement' : 'Entretien & Maintenance'}
                    </h1>
                    <p className="text-muted-foreground">
                        {activeTab === 'CONSTRUCTION'
                            ? "Suivez vos projets de développement immobilier."
                            : "Suivez les interventions d'entretien et de maintenance."}
                    </p>
                </div>
                {user?.role === 'ADMIN_MADIS' && (
                    <Link
                        to={`/dashboard/projects/new?category=${activeTab}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {activeTab === 'CONSTRUCTION' ? 'Nouveau Projet' : 'Nouvelle Intervention'}
                    </Link>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b mb-6 overflow-x-auto pb-px">
                <button
                    onClick={() => setActiveTab('CONSTRUCTION')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 whitespace-nowrap flex items-center gap-2 ${activeTab === 'CONSTRUCTION'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <HardHat className="h-4 w-4" />
                    Développement
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
                        {projects.filter(p => p.category === 'CONSTRUCTION').length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('MAINTENANCE')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 whitespace-nowrap flex items-center gap-2 ${activeTab === 'MAINTENANCE'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <ClipboardList className="h-4 w-4" />
                    Maintenance
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
                        {projects.filter(p => p.category === 'MAINTENANCE').length}
                    </span>
                </button>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-dashed">
                    <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        {activeTab === 'CONSTRUCTION' ? (
                            <HardHat className="h-8 w-8 text-muted-foreground" />
                        ) : (
                            <ClipboardList className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                        {activeTab === 'CONSTRUCTION' ? 'Aucun projet' : 'Aucune intervention'}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto text-sm">
                        {activeTab === 'CONSTRUCTION'
                            ? "Vous n'avez pas de projets de développement actifs pour le moment."
                            : "Aucune intervention de maintenance n'est répertoriée."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <Link
                            key={project.id}
                            to={`/dashboard/projects/${project.id}`}
                            className="group flex flex-col rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors pr-4">{project.name}</h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(project.status)}`}>
                                        {project.status_display || project.status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 mb-3">
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{project.property_name || 'Bien non défini'}</span>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                                    {project.description}
                                </p>

                                <div className="space-y-2.5 mt-auto text-sm text-muted-foreground pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <Euro className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <span className="font-mono">{project.budget ? `${Number(project.budget).toLocaleString('fr-FR')} €` : 'Non défini'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span>Début: {project.start_date ? format(new Date(project.start_date), 'd MMM yyyy', { locale: fr }) : 'Non défini'}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <span className="inline-flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform cursor-pointer">
                                        Voir les détails <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
