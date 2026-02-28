import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import { Building, MapPin, Ruler, ArrowRight, Loader2, Plus, Filter, Tag, LayoutGrid, User, ShoppingBag, Briefcase, Trash2, CheckCircle2, Square, CheckSquare, X, MessageSquare } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

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
        <div className="space-y-8 animate-fade-in p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-1 uppercase">Portfolio Immobilier</h1>
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest opacity-60">Gestion des actifs MaDis</p>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 w-full md:w-auto">
                        <div className="flex items-center gap-2 p-1.5 solaris-glass rounded-2xl w-fit whitespace-nowrap">
                            <button
                                onClick={() => setFilter('ALL')}
                                className={cn(
                                    "px-4 sm:px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                    filter === 'ALL' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground dark:hover:bg-white/5"
                                )}
                            >
                                Tous ({properties.length})
                            </button>
                            <button
                                onClick={() => setFilter('MANDATES')}
                                className={cn(
                                    "px-4 sm:px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                    filter === 'MANDATES' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground dark:hover:bg-white/5"
                                )}
                            >
                                Mandats ({properties.filter(p => !p.owner).length})
                            </button>
                            <button
                                onClick={() => setFilter('CLIENTS')}
                                className={cn(
                                    "px-4 sm:px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                    filter === 'CLIENTS' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground dark:hover:bg-white/5"
                                )}
                            >
                                Clients ({properties.filter(p => !!p.owner).length})
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user?.role === 'ADMIN_MADIS' && selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 pr-4 border-r border-slate-200 mr-2 animate-in fade-in slide-in-from-right-2">
                                <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                                    {selectedIds.length} sélectionné(s)
                                </span>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-600 shadow-[0_0_30px_rgba(220,38,38,0.4),0_0_60px_rgba(220,38,38,0.15)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6),0_0_80px_rgba(220,38,38,0.2)]"
                                >
                                    {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    Supprimer
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {user?.role === 'ADMIN_MADIS' && (
                            <>
                                <button
                                    onClick={selectAll}
                                    className="solaris-glass px-5 py-2.5 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white dark:hover:bg-primary transition-all border border-slate-200/50 dark:border-white/10"
                                >
                                    {selectedIds.length === filteredProperties.length ? 'Tout déselectionner' : 'Tout sélectionner'}
                                </button>
                                <Link
                                    to="/dashboard/properties/new"
                                    className="inline-flex items-center justify-center rounded-2xl text-[9px] font-bold uppercase tracking-widest bg-primary text-white shadow-[0_0_30px_rgba(255,0,72,0.4),0_0_60px_rgba(255,0,72,0.15)] hover:shadow-[0_0_40px_rgba(255,0,72,0.6),0_0_80px_rgba(255,0,72,0.2)] hover:scale-105 transition-all px-6 py-2.5"
                                >
                                    <Plus className="mr-2 h-3.5 w-3.5" />
                                    Ajouter un bien
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {properties.length === 0 ? (
                <div className="text-center py-32 solaris-glass rounded-[3rem] border-dashed flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="mx-auto h-24 w-24 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 shadow-inner">
                        <Building className="h-10 w-10 text-slate-300 dark:text-white/20" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter mb-3">Aucun bien immobilier</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed font-medium">
                        {user?.role === 'CLIENT'
                            ? "Vous n'avez pas encore de bien immobilier associé à votre compte. Contactez l'agence MaDis pour plus d'informations."
                            : "Votre portfolio est actuellement vide."}
                    </p>
                    {user?.role === 'CLIENT' && (
                        <div className="mt-10 flex gap-4">
                            <Link to="/dashboard/marketplace" className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl hover:scale-105">
                                <ShoppingBag className="h-4 w-4" />
                                Visiter le Marketplace
                            </Link>
                        </div>
                    )}
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="text-center py-24 solaris-glass rounded-[3rem] border-dashed">
                    <div className="mx-auto h-20 w-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6 shadow-inner">
                        <Filter className="h-8 w-8 text-slate-300 dark:text-white/20" />
                    </div>
                    <h3 className="text-xl font-black tracking-tighter mb-2">Aucun bien ne correspond</h3>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">Ajustez vos filtres</p>
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProperties.map((property) => {
                        return (
                            <div
                                key={property.id}
                                className={cn(
                                    "group relative flex flex-col overflow-hidden rounded-[2.5rem] solaris-glass transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] dark:bg-black/80",
                                    selectedIds.includes(property.id) && "ring-4 ring-black/5 dark:ring-primary/20 border-black dark:border-primary/40 bg-black/60 dark:bg-black/80"
                                )}
                            >
                                <Link to={`/dashboard/properties/${property.id}`} className="absolute inset-0 z-0" />

                                {/* Selection Checkbox */}
                                {user?.role === 'ADMIN_MADIS' && (
                                    <button
                                        onClick={(e) => toggleSelect(property.id, e)}
                                        className={cn(
                                            "absolute top-6 left-6 z-10 p-2 rounded-xl border backdrop-blur-xl transition-all duration-300",
                                            selectedIds.includes(property.id)
                                                ? "bg-black text-white border-black"
                                                : "bg-white/40 text-transparent hover:text-black/40 border-black/10 opacity-0 group-hover:opacity-100"
                                        )}
                                    >
                                        {selectedIds.includes(property.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                    </button>
                                )}

                                <div className="aspect-[4/3] w-full bg-black/20 dark:bg-white/[0.02] relative overflow-hidden">
                                    {property.images && property.images.length > 0 ? (
                                        <img
                                            src={property.images[0].image}
                                            alt={property.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Building className="h-16 w-16 text-slate-200 dark:text-white/10" />
                                        </div>
                                    )}

                                    {/* Overlay Tags */}
                                    <div className="absolute top-6 right-6 flex flex-col gap-2 items-end z-10">
                                        {property.status === 'VENDU' ? (
                                            <span className="px-4 py-1.5 rounded-full bg-black text-white text-[9px] font-black uppercase tracking-widest shadow-xl border border-white/20 backdrop-blur-md">
                                                Sold Out
                                            </span>
                                        ) : (
                                            <div className="flex gap-2">
                                                <span className={cn(
                                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg border backdrop-blur-md",
                                                    property.category === 'RESIDENTIEL' ? "bg-black/40 dark:bg-black/60 border-white/10 dark:text-white" :
                                                        property.category === 'COMMERCIAL' ? "bg-amber-900/40 border-amber-400/20 text-amber-400" : "bg-blue-900/40 border-blue-400/20 text-blue-400"
                                                )}>
                                                    {property.category_display}
                                                </span>
                                                <span className="px-4 py-1.5 rounded-full bg-black text-white text-[9px] font-black uppercase tracking-widest shadow-lg border border-white/20 backdrop-blur-sm">
                                                    {property.management_type === 'CONSTRUCTION' ? "Chantier" : property.transaction_nature_display}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Glass Info Bar */}
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                        <div className="flex items-center gap-2 text-white/60 mb-1">
                                            <MapPin className="h-3 w-3" />
                                            <span className="text-[10px] font-black uppercase tracking-widest truncate">{property.city || 'Location unavailable'}</span>
                                        </div>
                                        <h3 className="font-black text-2xl text-white tracking-tighter leading-tight group-hover:text-primary transition-colors">
                                            {property.name}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex flex-col flex-1 p-6 md:p-8 dark:bg-black/60">
                                    <div className="flex flex-col mb-6 md:mb-8">
                                        {property.management_type !== 'CONSTRUCTION' && (
                                            <div className="flex flex-col">
                                                <span className="text-[9px] md:text-[10px] uppercase text-muted-foreground font-black tracking-widest mb-1 opacity-60">
                                                    {property.transaction_nature === 'VENTE' ? "Prix de vente" : "Loyer Mensuel"}
                                                </span>
                                                <h4 className="text-2xl md:text-3xl font-black tracking-tighter">
                                                    {property.transaction_nature === 'VENTE'
                                                        ? (property.prix_vente ? formatCurrency(property.prix_vente, true) : '-- €')
                                                        : (property.loyer_mensuel ? formatCurrency(property.loyer_mensuel) + '/m' : '-- €/m')}
                                                </h4>
                                            </div>
                                        )}
                                        {property.management_type === 'CONSTRUCTION' && (
                                            <div className="flex flex-col">
                                                <span className="text-[9px] md:text-[10px] uppercase text-muted-foreground font-black tracking-widest mb-1 opacity-60">Budget Travaux</span>
                                                <h4 className="text-2xl md:text-3xl font-black tracking-tighter text-primary dark:text-[#ff00e5]">PROJET ACTIF</h4>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 border-t border-black/5 dark:border-white/5 pt-6 md:pt-8 mt-auto">
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-[8px] md:text-[9px] uppercase text-muted-foreground font-black tracking-widest opacity-60">Propriétaire</span>
                                            <div className="flex items-center gap-2 text-[10px] md:text-xs font-black mt-2 truncate">
                                                <div className="h-5 w-5 md:h-6 md:w-6 rounded-lg bg-black/20 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center shrink-0">
                                                    <User className="h-2.5 w-2.5 md:h-3 md:w-3 text-slate-400 dark:text-white/40" />
                                                </div>
                                                <span className="truncate">{property.owner_name || (property.management_type === 'CONSTRUCTION' ? "Client Privé" : "MaDis Mandat")}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-[8px] md:text-[9px] uppercase text-muted-foreground font-black tracking-widest opacity-60">Type</span>
                                            <div className="flex items-center gap-2 text-[10px] md:text-xs font-black mt-2 truncate">
                                                <div className="h-5 w-5 md:h-6 md:w-6 rounded-lg bg-black/20 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center shrink-0">
                                                    {property.category === 'RESIDENTIEL' ? <Building className="h-2.5 w-2.5 md:h-3 md:w-3 text-slate-400 dark:text-white/40" /> :
                                                        property.category === 'COMMERCIAL' ? <ShoppingBag className="h-2.5 w-2.5 md:h-3 md:w-3 text-slate-400 dark:text-white/40" /> :
                                                            <Briefcase className="h-2.5 w-2.5 md:h-3 md:w-3 text-slate-400 dark:text-white/40" />}
                                                </div>
                                                <span className="truncate">{property.property_type_display}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between group/link">
                                        <div className="h-9 md:h-10 px-4 md:px-6 rounded-2xl bg-primary text-white flex items-center justify-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all hover:gap-5 shadow-lg shadow-primary/20">
                                            Détails
                                            <ArrowRight className="h-3 w-3 transition-transform" />
                                        </div>
                                        {property.property_stats && <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-30 text-right">
                                            ID: #{property.id.toString().padStart(4, '0')}
                                        </div>}
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
