import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Building, MapPin, Ruler, ArrowRight, Loader2, Plus, Filter, Tag, LayoutGrid, User, ShoppingBag, Briefcase, Trash2, CheckCircle2, Square, CheckSquare, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PropertiesList() {
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, []);

    const [filter, setFilter] = useState('ALL'); // 'ALL', 'MANDATES', 'CLIENTS'

    const fetchProperties = async () => {
        try {
            const response = await api.get('/properties/');
            setProperties(response.data.results || []);
        } catch (err) {
            setError('Impossible de charger les biens immobiliers.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProperties = properties.filter(p => {
        if (filter === 'MANDATES') return !p.owner;
        if (filter === 'CLIENTS') return !!p.owner;
        return true;
    });

    const toggleSelect = (id, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === filteredProperties.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProperties.map(p => p.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} bien(s) ? Cette action est irréversible.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.post('/properties/bulk_delete/', { ids: selectedIds });
            setSelectedIds([]);
            fetchProperties();
        } catch (err) {
            console.error('Bulk delete failed', err);
            alert('Erreur lors de la suppression groupée.');
        } finally {
            setIsDeleting(false);
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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                            filter === 'ALL' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Tous ({properties.length})
                    </button>
                    <button
                        onClick={() => setFilter('MANDATES')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                            filter === 'MANDATES' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Mandats ({properties.filter(p => !p.owner).length})
                    </button>
                    <button
                        onClick={() => setFilter('CLIENTS')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                            filter === 'CLIENTS' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Biens Clients ({properties.filter(p => !!p.owner).length})
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    {user?.role === 'ADMIN_MADIS' && selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 pr-4 border-r mr-2 animate-in fade-in slide-in-from-right-2">
                            <span className="text-xs font-bold text-muted-foreground">
                                {selectedIds.length} sélectionné(s)
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md text-xs font-bold transition-colors"
                            >
                                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                Supprimer
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {user?.role === 'ADMIN_MADIS' && (
                        <>
                            <button
                                onClick={selectAll}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                            >
                                {selectedIds.length === filteredProperties.length ? 'Tout déselectionner' : 'Tout sélectionner'}
                            </button>
                            <Link
                                to="/dashboard/properties/new"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Ajouter un bien
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {properties.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-xl border border-dashed flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <Building className="h-10 w-10 text-primary opacity-40" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Aucun bien immobilier</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                        {user?.role === 'CLIENT'
                            ? "Vous n'avez pas encore de bien immobilier associé à votre compte. Contactez l'agence pour plus d'informations."
                            : "Aucun bien immobilier n'a été créé pour le moment."}
                    </p>
                    {user?.role === 'CLIENT' && (
                        <div className="mt-8 flex gap-4">
                            <Link to="/dashboard/marketplace" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-md">
                                <ShoppingBag className="h-4 w-4" />
                                Visiter le Marketplace
                            </Link>
                            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-2.5 bg-background border border-input rounded-lg font-bold text-sm hover:bg-accent transition-all">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                Nous contacter
                            </Link>
                        </div>
                    )}
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-dashed">
                    <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Filter className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Aucun bien ne correspond</h3>
                    <p className="text-muted-foreground text-sm">Ajustez vos filtres pour voir plus de résultats.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProperties.map((property) => {
                        console.debug(`Rendering property card: ${property.name} (ID: ${property.id})`);
                        return (
                            <div
                                key={property.id}
                                className={cn(
                                    "group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200",
                                    selectedIds.includes(property.id) && "ring-2 ring-primary border-primary bg-primary/5"
                                )}
                            >
                                <Link to={`/dashboard/properties/${property.id}`} className="absolute inset-0 z-0" />

                                {/* Selection Checkbox Overlay */}
                                {user?.role === 'ADMIN_MADIS' && (
                                    <button
                                        onClick={(e) => toggleSelect(property.id, e)}
                                        className={cn(
                                            "absolute top-3 left-3 z-10 p-1.5 rounded-lg border shadow-sm transition-all duration-200",
                                            selectedIds.includes(property.id)
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-white/80 dark:bg-black/50 text-transparent hover:text-muted-foreground backdrop-blur-sm border-white/20 opacity-0 group-hover:opacity-100"
                                        )}
                                    >
                                        {selectedIds.includes(property.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                    </button>
                                )}
                                <div className="aspect-video w-full bg-muted relative overflow-hidden">
                                    {property.images && property.images.length > 0 ? (
                                        <img
                                            src={property.images[0].image}
                                            alt={property.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Building className="h-12 w-12 text-muted-foreground/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                                        {property.status === 'VENDU' ? (
                                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm border border-slate-700">
                                                Vendu
                                            </span>
                                        ) : (
                                            <>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white shadow-sm",
                                                    property.category === 'RESIDENTIEL' ? "bg-blue-600" :
                                                        property.category === 'COMMERCIAL' ? "bg-orange-600" : "bg-purple-600"
                                                )}>
                                                    {property.category_display}
                                                </span>
                                                {property.management_type !== 'CONSTRUCTION' ? (
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white shadow-sm",
                                                        property.transaction_nature === 'VENTE' ? "bg-emerald-600" :
                                                            property.status === 'LOUE' ? "bg-indigo-600" : "bg-blue-600"
                                                    )}>
                                                        {property.transaction_nature_display}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                        Chantier
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                        <h3 className="font-bold text-lg text-white line-clamp-1 group-hover:text-primary transition-colors">
                                            {property.name}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-xs text-white/80">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                <span className="truncate">{property.city}</span>
                                            </div>
                                            {property.management_type !== 'CONSTRUCTION' && (
                                                <>
                                                    {property.transaction_nature === 'VENTE' && property.prix_vente && (
                                                        <span className="text-sm font-black text-white">{Number(property.prix_vente).toLocaleString('fr-FR')} €</span>
                                                    )}
                                                    {property.transaction_nature === 'LOCATION' && property.loyer_mensuel && (
                                                        <span className="text-sm font-black text-white">{Number(property.loyer_mensuel).toLocaleString('fr-FR')} €/mois</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col flex-1 p-4">
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">Propriétaire</span>
                                            <div className="flex items-center gap-1.5 text-xs font-semibold mt-0.5">
                                                {property.owner ? (
                                                    <>
                                                        <User className="h-3 w-3 text-primary" />
                                                        <span className="truncate">{property.owner_name}</span>
                                                    </>
                                                ) : property.management_type === 'CONSTRUCTION' ? (
                                                    <>
                                                        <User className="h-3 w-3 text-rose-500" />
                                                        <span className="text-rose-600 italic font-bold">Client / Projet</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Tag className="h-3 w-3 text-emerald-500" />
                                                        <span className="text-emerald-600 italic">À Transaction</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">Type</span>
                                            <div className="flex items-center gap-1.5 text-xs font-semibold mt-0.5 capitalize">
                                                {property.category === 'RESIDENTIEL' ? <Building className="h-3 w-3" /> :
                                                    property.category === 'COMMERCIAL' ? <ShoppingBag className="h-3 w-3" /> :
                                                        <Briefcase className="h-3 w-3" />}
                                                <span className="truncate">{property.property_type_display}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-3 border-t flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-primary group-hover:translate-x-1 transition-transform">
                                        Consulter le bien
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
