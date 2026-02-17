import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import {
    Search, Building, MapPin, Bed, Ruler, Filter, X, Send,
    ShoppingBag, Briefcase, Home, ChevronDown, Loader2,
    Euro, CheckCircle, ArrowRight, Eye, Phone, Mail, User, MessageSquare,
    ShieldCheck, FileText, Download
} from 'lucide-react';

const API = 'http://localhost:8000/api/v1';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const CATEGORIES = [
    { value: '', label: 'Toutes', icon: Filter },
    { value: 'RESIDENTIEL', label: 'Résidentiel', icon: Home },
    { value: 'COMMERCIAL', label: 'Commercial', icon: ShoppingBag },
    { value: 'PROFESSIONNEL', label: 'Professionnel', icon: Briefcase },
];

const NATURES = [
    { value: '', label: 'Tout' },
    { value: 'VENTE', label: 'À Vendre' },
    { value: 'LOCATION', label: 'À Louer' },
];

export default function Marketplace() {
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [nature, setNature] = useState('');
    const [selectedProp, setSelectedProp] = useState(null);
    const [showOffer, setShowOffer] = useState(false);
    const [offerSent, setOfferSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [offerForm, setOfferForm] = useState({
        prospect_name: '',
        prospect_email: '',
        prospect_phone: '',
        asking_price: '',
        notes: '',
    });

    useEffect(() => {
        fetchProperties();
    }, [category, nature, search]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const params = {};
            if (category) params.category = category;
            if (nature) params.transaction_nature = nature;
            if (search) params.search = search;
            const res = await axios.get(`${API}/marketplace/`, { params });
            setProperties(res.data.results || res.data || []);
        } catch (err) {
            console.error('fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    const submitOffer = async () => {
        if (!offerForm.asking_price || !offerForm.prospect_name) return;
        setSending(true);
        try {
            await axios.post(`${API}/marketplace/offer/`, {
                property: selectedProp.id,
                ...offerForm,
            });
            setOfferSent(true);
        } catch (err) {
            console.error('offer error', err);
        } finally {
            setSending(false);
        }
    };

    const openDetail = (prop) => {
        setSelectedProp(prop);
        setShowOffer(false);
        setOfferSent(false);
        setOfferForm({ prospect_name: '', prospect_email: '', prospect_phone: '', asking_price: '', notes: '' });
    };

    const closeDetail = () => {
        setSelectedProp(null);
        setShowOffer(false);
        setOfferSent(false);
    };

    const getPrice = (p) => {
        if (p.transaction_nature === 'VENTE' && p.prix_vente)
            return `${Number(p.prix_vente).toLocaleString('fr-FR')} €`;
        if (p.transaction_nature === 'LOCATION' && p.loyer_mensuel)
            return `${Number(p.loyer_mensuel).toLocaleString('fr-FR')} €/mois`;
        return null;
    };

    return (
        <div className="min-h-screen">
            {/* Hero Banner */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px]" />
                </div>
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                            <Building className="h-3.5 w-3.5" />
                            Marketplace Immobilier
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                            Trouvez votre <span className="text-primary">bien idéal</span>
                        </h1>
                        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                            Parcourez nos biens disponibles et faites une offre directement en ligne.
                        </p>

                        {/* Search Bar */}
                        <div className="flex items-center max-w-xl mx-auto bg-card border rounded-full shadow-lg overflow-hidden">
                            <Search className="h-5 w-5 text-muted-foreground ml-5 shrink-0" />
                            <input
                                type="text"
                                placeholder="Rechercher par ville, nom, adresse..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="flex-1 h-12 px-4 bg-transparent text-sm outline-none"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Filters + Grid */}
            <section className="container mx-auto px-4 pb-24">
                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                    <div className="flex bg-muted rounded-lg p-1">
                        {CATEGORIES.map(c => {
                            const Icon = c.icon;
                            return (
                                <button
                                    key={c.value}
                                    onClick={() => setCategory(c.value)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                        category === c.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {c.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex bg-muted rounded-lg p-1">
                        {NATURES.map(n => (
                            <button
                                key={n.value}
                                onClick={() => setNature(n.value)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                    nature === n.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {n.label}
                            </button>
                        ))}
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground font-medium">
                        {properties.length} bien{properties.length > 1 ? 's' : ''} trouvé{properties.length > 1 ? 's' : ''}
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-24 bg-card rounded-2xl border border-dashed">
                        <Building className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Aucun bien disponible</h3>
                        <p className="text-muted-foreground text-sm">Essayez de modifier vos filtres.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {properties.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => openDetail(p)}
                                className="group cursor-pointer flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Image */}
                                <div className="aspect-[16/10] w-full bg-muted relative overflow-hidden">
                                    {p.images && p.images.length > 0 ? (
                                        <img
                                            src={p.images[0].image}
                                            alt={p.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Building className="h-12 w-12 text-muted-foreground/20" />
                                        </div>
                                    )}
                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pr-10">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-sm",
                                            p.category === 'RESIDENTIEL' ? "bg-blue-600/90" :
                                                p.category === 'COMMERCIAL' ? "bg-orange-600/90" : "bg-purple-600/90"
                                        )}>
                                            {p.category_display}
                                        </span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-sm",
                                            p.transaction_nature === 'VENTE' ? "bg-emerald-600/90" : "bg-indigo-600/90"
                                        )}>
                                            {p.transaction_nature_display}
                                        </span>
                                        {p.is_verified_fonciere && (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-sm bg-emerald-500/90 flex items-center gap-1">
                                                <ShieldCheck className="h-2.5 w-2.5" />
                                                Vérifié
                                            </span>
                                        )}
                                    </div>
                                    {/* Price overlay */}
                                    {getPrice(p) && (
                                        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm">
                                            <span className="text-sm font-black text-white">{getPrice(p)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex flex-col flex-1 p-4">
                                    <h3 className="font-bold text-base line-clamp-1 mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                                    <div className="flex items-center text-xs text-muted-foreground mb-3">
                                        <MapPin className="h-3 w-3 mr-1 text-primary" />
                                        {p.city}{p.postal_code ? ` — ${p.postal_code}` : ''}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        {p.surface && (
                                            <div className="flex items-center gap-1">
                                                <Ruler className="h-3 w-3" />
                                                {p.surface} m²
                                            </div>
                                        )}
                                        {p.room_count && (
                                            <div className="flex items-center gap-1">
                                                <Home className="h-3 w-3" />
                                                {p.room_count} pcs
                                            </div>
                                        )}
                                        {p.bedroom_count && (
                                            <div className="flex items-center gap-1">
                                                <Bed className="h-3 w-3" />
                                                {p.bedroom_count} ch.
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-auto pt-3 flex items-center justify-between text-[11px] font-bold text-primary uppercase tracking-wider">
                                        <span>Voir le détail</span>
                                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Property Detail / Offer Modal */}
            <AnimatePresence>
                {selectedProp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 bg-black/60 backdrop-blur-sm overflow-y-auto"
                        onClick={closeDetail}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.97 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Image */}
                            <div className="aspect-video w-full bg-muted relative">
                                {selectedProp.images && selectedProp.images.length > 0 ? (
                                    <img src={selectedProp.images[0].image} alt={selectedProp.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Building className="h-16 w-16 text-muted-foreground/20" />
                                    </div>
                                )}
                                <button onClick={closeDetail} className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm">
                                    <X className="h-5 w-5" />
                                </button>
                                {getPrice(selectedProp) && (
                                    <div className="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-black/70 backdrop-blur-sm">
                                        <span className="text-xl font-black text-white">{getPrice(selectedProp)}</span>
                                    </div>
                                )}
                                {selectedProp.prix_nuitee && selectedProp.transaction_nature === 'LOCATION' && (
                                    <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm">
                                        <span className="text-sm font-bold text-foreground">{Number(selectedProp.prix_nuitee).toLocaleString('fr-FR')} €/nuit</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                            selectedProp.category === 'RESIDENTIEL' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                selectedProp.category === 'COMMERCIAL' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                                    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                        )}>
                                            {selectedProp.category_display}
                                        </span>
                                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                            selectedProp.transaction_nature === 'VENTE' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                        )}>
                                            {selectedProp.transaction_nature_display}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight">{selectedProp.name}</h2>
                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                        <MapPin className="h-4 w-4 mr-1 text-primary" />
                                        {selectedProp.address}, {selectedProp.city} {selectedProp.postal_code}
                                    </div>
                                </div>

                                {/* Specs */}
                                <div className="grid grid-cols-3 gap-3">
                                    {selectedProp.surface && (
                                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                                            <Ruler className="h-4 w-4 mx-auto mb-1 text-primary" />
                                            <div className="text-lg font-black">{selectedProp.surface}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground font-bold">m²</div>
                                        </div>
                                    )}
                                    {selectedProp.room_count && (
                                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                                            <Home className="h-4 w-4 mx-auto mb-1 text-primary" />
                                            <div className="text-lg font-black">{selectedProp.room_count}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground font-bold">Pièces</div>
                                        </div>
                                    )}
                                    {selectedProp.bedroom_count && (
                                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                                            <Bed className="h-4 w-4 mx-auto mb-1 text-primary" />
                                            <div className="text-lg font-black">{selectedProp.bedroom_count}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground font-bold">Chambres</div>
                                        </div>
                                    )}
                                </div>

                                {selectedProp.description && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedProp.description}</p>
                                )}

                                {/* Verification Docs Section */}
                                {selectedProp.is_verified_fonciere && (
                                    <div className="space-y-3 pb-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                <ShieldCheck className="h-5 w-5" />
                                                Vérification Foncière
                                            </h3>
                                            <span className="text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-3 py-1 rounded-full font-bold uppercase">
                                                Titre Vérifié
                                            </span>
                                        </div>

                                        {selectedProp.verification_documents?.length > 0 ? (
                                            <div className="grid gap-2">
                                                {selectedProp.verification_documents.map(doc => (
                                                    <a
                                                        key={doc.id}
                                                        href={doc.file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group"
                                                    >
                                                        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-bold text-foreground truncate">{doc.title}</div>
                                                            <div className="text-xs text-muted-foreground">Document officiel certifié</div>
                                                        </div>
                                                        <Download className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-5 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800 text-center">
                                                <p className="text-sm text-muted-foreground italic">
                                                    Ce bien est certifié par nos services. Les documents de vérification sont disponibles sur demande lors de la visite.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Offer Section */}
                                {!showOffer && !offerSent && user?.role !== 'ADMIN_MADIS' && user?.id !== selectedProp?.owner && (
                                    <button
                                        onClick={() => setShowOffer(true)}
                                        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Send className="h-4 w-4" />
                                        Faire une offre
                                    </button>
                                )}

                                {/* Offer Form */}
                                <AnimatePresence>
                                    {showOffer && !offerSent && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3 overflow-hidden"
                                        >
                                            <div className="border-t pt-4">
                                                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                                    <Euro className="h-4 w-4 text-primary" />
                                                    Votre offre
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="grid gap-1.5">
                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                            <User className="h-3 w-3" /> Nom complet *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={offerForm.prospect_name}
                                                            onChange={e => setOfferForm(f => ({ ...f, prospect_name: e.target.value }))}
                                                            placeholder="Jean Dupont"
                                                            className="h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    </div>
                                                    <div className="grid gap-1.5">
                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                            <Euro className="h-3 w-3" /> Montant proposé (€) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            value={offerForm.asking_price}
                                                            onChange={e => setOfferForm(f => ({ ...f, asking_price: e.target.value }))}
                                                            placeholder={selectedProp.transaction_nature === 'VENTE' ? 'ex: 250000' : 'ex: 1200'}
                                                            className="h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    </div>
                                                    <div className="grid gap-1.5">
                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> Email
                                                        </label>
                                                        <input
                                                            type="email"
                                                            value={offerForm.prospect_email}
                                                            onChange={e => setOfferForm(f => ({ ...f, prospect_email: e.target.value }))}
                                                            placeholder="jean@email.com"
                                                            className="h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    </div>
                                                    <div className="grid gap-1.5">
                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                            <Phone className="h-3 w-3" /> Téléphone
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            value={offerForm.prospect_phone}
                                                            onChange={e => setOfferForm(f => ({ ...f, prospect_phone: e.target.value }))}
                                                            placeholder="+237 6XX XXX XXX"
                                                            className="h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-1.5 mt-3">
                                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                        <MessageSquare className="h-3 w-3" /> Message (optionnel)
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        value={offerForm.notes}
                                                        onChange={e => setOfferForm(f => ({ ...f, notes: e.target.value }))}
                                                        placeholder="Je suis intéressé par ce bien..."
                                                        className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        onClick={() => setShowOffer(false)}
                                                        className="flex-1 py-2.5 rounded-xl border font-bold text-sm hover:bg-muted transition-colors"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        onClick={submitOffer}
                                                        disabled={sending || !offerForm.prospect_name || !offerForm.asking_price}
                                                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                        Envoyer l'offre
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Success Message */}
                                <AnimatePresence>
                                    {offerSent && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center"
                                        >
                                            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                                            <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-400 mb-1">Offre envoyée !</h3>
                                            <p className="text-sm text-emerald-600 dark:text-emerald-500">
                                                Votre offre a été transmise à notre équipe. Nous vous recontacterons rapidement.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
