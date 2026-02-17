import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
    Search, Building, MapPin, Bed, Ruler, Filter, X, Send,
    ShoppingBag, Briefcase, Home, Loader2,
    Euro, CheckCircle, ArrowRight, Phone, Mail, User, MessageSquare,
    ShieldCheck, FileText, Download
} from 'lucide-react';

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

export default function DashboardMarketplace() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [nature, setNature] = useState('');
    const [selectedProp, setSelectedProp] = useState(null);
    const [showOffer, setShowOffer] = useState(false);
    const [offerSent, setOfferSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [offerForm, setOfferForm] = useState({ asking_price: '', notes: '' });

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
            const res = await api.get('/marketplace/', { params });
            setProperties(res.data.results || res.data || []);
        } catch (err) {
            console.error('fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    const submitOffer = async () => {
        if (!offerForm.asking_price) return;
        setSending(true);
        try {
            await api.post('/marketplace/offer/', {
                property: selectedProp.id,
                asking_price: offerForm.asking_price,
                notes: offerForm.notes,
                prospect_name: `${user.first_name} ${user.last_name}`.trim() || user.email,
                prospect_email: user.email,
                prospect_phone: user.phone || '',
            });
            setOfferSent(true);
            showToast({ message: 'Votre offre a été envoyée avec succès !', type: 'success' });
        } catch (err) {
            console.error('offer error', err);
            showToast({ message: "Erreur lors de l'envoi de l'offre.", type: 'error' });
        } finally {
            setSending(false);
        }
    };

    const openDetail = (prop) => {
        setSelectedProp(prop);
        setShowOffer(false);
        setOfferSent(false);
        setOfferForm({ asking_price: '', notes: '' });
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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Marketplace</h1>
                    <p className="text-sm text-muted-foreground">Parcourez les biens disponibles et faites une offre.</p>
                </div>
                <div className="flex items-center bg-card border rounded-full shadow-sm overflow-hidden max-w-sm w-full">
                    <Search className="h-4 w-4 text-muted-foreground ml-4 shrink-0" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 h-9 px-3 bg-transparent text-sm outline-none"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
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
                <span className="ml-auto text-xs text-muted-foreground font-medium">
                    {properties.length} bien{properties.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : properties.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-dashed">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Aucun bien disponible</h3>
                    <p className="text-muted-foreground text-sm">Modifiez vos filtres ou revenez plus tard.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {properties.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => openDetail(p)}
                            className="group cursor-pointer flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div className="aspect-[16/10] w-full bg-muted relative overflow-hidden">
                                {p.images && p.images.length > 0 ? (
                                    <img src={p.images[0].image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Building className="h-10 w-10 text-muted-foreground/20" />
                                    </div>
                                )}
                                <div className="absolute top-2 left-2 flex gap-1">
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white",
                                        p.category === 'RESIDENTIEL' ? "bg-blue-600" : p.category === 'COMMERCIAL' ? "bg-orange-600" : "bg-purple-600"
                                    )}>{p.category_display}</span>
                                    {p.management_type !== 'CONSTRUCTION' ? (
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white",
                                            p.transaction_nature === 'VENTE' ? "bg-emerald-600" : "bg-indigo-600"
                                        )}>{p.transaction_nature_display}</span>
                                    ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white bg-rose-600">Chantier</span>
                                    )}
                                </div>
                                {getPrice(p) && (
                                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                        {p.is_verified_fonciere && (
                                            <div className="px-1.5 py-1 rounded bg-emerald-500/90 backdrop-blur-sm text-white flex items-center gap-1 shadow-sm">
                                                <ShieldCheck className="h-3 w-3" />
                                                <span className="text-[8px] font-black uppercase">Vérifié</span>
                                            </div>
                                        )}
                                        <div className="px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm">
                                            <span className="text-xs font-black text-white">{getPrice(p)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col flex-1 p-3">
                                <h3 className="font-bold text-sm line-clamp-1 mb-0.5 group-hover:text-primary transition-colors">{p.name}</h3>
                                <div className="flex items-center text-[11px] text-muted-foreground mb-2">
                                    <MapPin className="h-3 w-3 mr-1 text-primary" />
                                    {p.city}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                    {p.surface && <span className="flex items-center gap-0.5"><Ruler className="h-3 w-3" />{p.surface} m²</span>}
                                    {p.room_count && <span className="flex items-center gap-0.5"><Home className="h-3 w-3" />{p.room_count} pcs</span>}
                                    {p.bedroom_count && <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" />{p.bedroom_count} ch.</span>}
                                </div>
                                {user?.role !== 'ADMIN_MADIS' && user?.id !== p.owner && (
                                    <div className="mt-auto pt-2 flex items-center justify-between text-[10px] font-bold text-primary uppercase tracking-wider">
                                        Faire une offre
                                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Detail / Offer Modal */}
            <AnimatePresence>
                {selectedProp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4"
                        onClick={closeDetail}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.97 }}
                            className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Image */}
                            <div className="aspect-video w-full bg-muted relative">
                                {selectedProp.images?.length > 0 ? (
                                    <img src={selectedProp.images[0].image} alt={selectedProp.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Building className="h-12 w-12 text-muted-foreground/20" />
                                    </div>
                                )}
                                <button onClick={closeDetail} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                                {getPrice(selectedProp) && (
                                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm">
                                        <span className="text-lg font-black text-white">{getPrice(selectedProp)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                            selectedProp.category === 'RESIDENTIEL' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                selectedProp.category === 'COMMERCIAL' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                                    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                        )}>{selectedProp.category_display}</span>
                                        {selectedProp.management_type !== 'CONSTRUCTION' && (
                                            <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                                selectedProp.transaction_nature === 'VENTE' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                            )}>{selectedProp.transaction_nature_display}</span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-black tracking-tight">{selectedProp.name}</h2>
                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                        <MapPin className="h-3.5 w-3.5 mr-1 text-primary" />
                                        {selectedProp.address}, {selectedProp.city} {selectedProp.postal_code}
                                    </div>
                                </div>

                                {/* Specs */}
                                <div className="grid grid-cols-3 gap-2">
                                    {selectedProp.surface && (
                                        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                                            <Ruler className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
                                            <div className="text-sm font-black">{selectedProp.surface} m²</div>
                                        </div>
                                    )}
                                    {selectedProp.room_count && (
                                        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                                            <Home className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
                                            <div className="text-sm font-black">{selectedProp.room_count} Pièces</div>
                                        </div>
                                    )}
                                    {selectedProp.bedroom_count && (
                                        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                                            <Bed className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
                                            <div className="text-sm font-black">{selectedProp.bedroom_count} Ch.</div>
                                        </div>
                                    )}
                                </div>

                                {selectedProp.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed">{selectedProp.description}</p>
                                )}

                                {/* Verification Docs Section */}
                                {selectedProp.is_verified_fonciere && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                <ShieldCheck className="h-4 w-4" />
                                                Vérification Foncière
                                            </h3>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">
                                                Titre Vérifié MaDis
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
                                                        className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group"
                                                    >
                                                        <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-bold text-foreground truncate">{doc.title}</div>
                                                            <div className="text-[10px] text-muted-foreground">Document officiel certifié</div>
                                                        </div>
                                                        <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800 text-center">
                                                <p className="text-xs text-muted-foreground italic">
                                                    Ce bien est certifié par nos services, mais aucun document n'est publié pour le moment.
                                                    Nos agents peuvent vous les présenter sur demande.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Connected user info */}
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg text-xs">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {user?.first_name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <div className="font-bold">{user?.first_name} {user?.last_name}</div>
                                        <div className="text-muted-foreground">{user?.email}</div>
                                    </div>
                                    <span className="ml-auto text-[9px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
                                        Votre compte
                                    </span>
                                </div>

                                {/* CTA / Offer */}
                                {!showOffer && !offerSent && user?.role !== 'ADMIN_MADIS' && user?.id !== selectedProp?.owner && (
                                    <button
                                        onClick={() => setShowOffer(true)}
                                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Send className="h-4 w-4" />
                                        Faire une offre
                                    </button>
                                )}

                                <AnimatePresence>
                                    {showOffer && !offerSent && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t pt-4 space-y-3">
                                                <h3 className="text-xs font-bold flex items-center gap-1.5">
                                                    <Euro className="h-3.5 w-3.5 text-primary" />
                                                    Votre proposition
                                                </h3>
                                                <div className="grid gap-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        Montant proposé (€) *
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
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        Message (optionnel)
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        value={offerForm.notes}
                                                        onChange={e => setOfferForm(f => ({ ...f, notes: e.target.value }))}
                                                        placeholder="Je suis intéressé par ce bien..."
                                                        className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setShowOffer(false)}
                                                        className="flex-1 py-2.5 rounded-xl border font-bold text-sm hover:bg-muted transition-colors"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        onClick={submitOffer}
                                                        disabled={sending || !offerForm.asking_price}
                                                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                        Envoyer
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {offerSent && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center"
                                        >
                                            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                            <h3 className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">Offre envoyée !</h3>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-500">
                                                Notre équipe vous recontactera rapidement.
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
