import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { HardHat, Calendar, MapPin, ArrowRight, Loader2, Camera, Plus, ClipboardList, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
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
            case 'EN_COURS': return 'bg-primary/10 text-primary';
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
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">
                        {activeTab === 'CONSTRUCTION' ? 'Suivi de Chantier' : 'Suivi des Interventions'}
                    </h1>
                    <p className="text-muted-foreground">
                        {activeTab === 'CONSTRUCTION'
                            ? "Visualisez l'avancement de vos travaux de développement en temps réel."
                            : "Suivez les interventions de maintenance et d'entretien sur vos biens."}
                    </p>
                </div>
                {(user?.role === 'ADMIN_MADIS' || user?.role === 'CHEF_CHANTIER') && (
                    <Link
                        to="/dashboard/construction/new"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {activeTab === 'CONSTRUCTION' ? 'Nouveau Chantier' : 'Nouvelle Intervention'}
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
                    Chantiers
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
                        {sites.filter(s => s.project_category === 'CONSTRUCTION').length}
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
                    Maintenance & Entretien
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
                        {sites.filter(s => s.project_category === 'MAINTENANCE').length}
                    </span>
                </button>
            </div>

            {sites.filter(s => s.project_category === activeTab).length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-dashed">
                    <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        {activeTab === 'CONSTRUCTION' ? (
                            <HardHat className="h-8 w-8 text-muted-foreground" />
                        ) : (
                            <ClipboardList className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                        {activeTab === 'CONSTRUCTION' ? 'Aucun chantier' : 'Aucune intervention'}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto text-sm">
                        {activeTab === 'CONSTRUCTION'
                            ? "Il n'y a pas de chantier de développement actif pour le moment."
                            : "Il n'y a pas d'interventions de maintenance prévues pour le moment."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sites
                        .filter(s => s.project_category === activeTab)
                        .map((site) => (
                            <Link
                                key={site.id}
                                to={`/dashboard/construction/${site.id}`}
                                className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group"
                            >
                                {/* Progress bar at top */}
                                {site.status !== 'SUSPENDU' && (
                                    <div className="h-1 bg-muted w-full">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-700",
                                                activeTab === 'MAINTENANCE' ? "bg-blue-500" : "bg-primary"
                                            )}
                                            style={{ width: `${site.progress_percentage}%` }}
                                        />
                                    </div>
                                )}

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{site.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(site.status)}`}>
                                            {site.status_display || site.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 mb-3">
                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-bold text-muted-foreground uppercase">{site.property_name || 'Bien non défini'}</span>
                                    </div>

                                    <div className="space-y-2 mb-4 flex-1 text-sm text-muted-foreground">
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                                            <span className="truncate">{site.address}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                                            <span>Début : {site.start_date ? format(new Date(site.start_date), 'd MMM yyyy', { locale: fr }) : 'Non défini'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Camera className="h-4 w-4 mr-2 text-green-500" />
                                            <span>{site.photos_count || 0} photos</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-3 border-t">
                                        {site.status !== 'SUSPENDU' && (
                                            <>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progression</span>
                                                    <span className="text-sm font-bold">{site.progress_percentage}%</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-1.5">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-700",
                                                            activeTab === 'MAINTENANCE' ? "bg-blue-500" : "bg-primary"
                                                        )}
                                                        style={{ width: `${site.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div className="mt-4 flex justify-end">
                                            <span className="inline-flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                                                Accéder au journal
                                                <ArrowRight className="ml-2 h-4 w-4" />
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
