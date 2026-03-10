import { useState, useEffect, useCallback } from 'react';
/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from 'framer-motion';
/* eslint-enable no-unused-vars */
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    Search, Building, MapPin, Bed, Ruler, Filter, X, Send,
    ShoppingBag, Briefcase, Home, ChevronDown, Loader2,
    Euro, CheckCircle, ArrowRight, Eye, Phone, Mail, User, MessageSquare,
    ShieldCheck, FileText, Download
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

const API = 'http://192.168.31.85:8000/api/v1';

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

    const fetchProperties = useCallback(async () => {
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
    }, [category, nature, search]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);


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
            return formatCurrency(p.prix_vente, true);
        if (p.transaction_nature === 'LOCATION' && p.loyer_mensuel)
            return `${formatCurrency(p.loyer_mensuel, true)}/mois`;
        return null;
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#020817]">
            {/* Hero Banner */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-primary/5 rounded-full blur-[150px]" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
                </div>
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-5xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/40 dark:bg-white/5 border border-white/20 backdrop-blur-md text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-sm">
                            <Building className="h-3.5 w-3.5" />
                            Marketplace Immobilier
                        </div>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-6 px-2">
                            Trouvez votre <br className="hidden sm:block" />
                            <span className="text-primary italic">bien idéal</span>
                        </h1>
                        <p className="text-base sm:text-xl text-muted-foreground/60 mb-8 sm:mb-12 max-w-2xl mx-auto font-medium tracking-tight px-4">
                            Parcourez nos biens disponibles et faites une offre directement en ligne via notre plateforme sécurisée.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto p-1 sm:p-2 solaris-glass rounded-3xl sm:rounded-full shadow-2xl mx-4 sm:mx-auto">
                            <div className="flex items-center bg-foreground/5 dark:bg-white/5 rounded-2xl sm:rounded-full border border-foreground/10 dark:border-white/5 px-4 sm:px-6 py-1 sm:py-2">
                                <Search className="h-5 w-5 text-muted-foreground/60 mr-3 sm:mr-4 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="flex-1 h-10 sm:h-12 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/40 min-w-0"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Filters + Grid */}
            <section className="container mx-auto px-4 pb-32">
                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 overflow-hidden">
                        <div className="flex p-1.5 solaris-glass rounded-2xl shadow-lg max-w-full overflow-x-auto no-scrollbar scroll-smooth">
                            <div className="flex min-w-max">
                                {CATEGORIES.map(c => {
                                    const Icon = c.icon;
                                    return (
                                        <button
                                            key={c.value}
                                            onClick={() => setCategory(c.value)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all whitespace-nowrap",
                                                category === c.value
                                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                            )}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            {c.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex p-1.5 solaris-glass rounded-2xl shadow-lg max-w-full overflow-x-auto no-scrollbar scroll-smooth">
                            <div className="flex min-w-max">
                                {NATURES.map(n => (
                                    <button
                                        key={n.value}
                                        onClick={() => setNature(n.value)}
                                        className={cn(
                                            "px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all whitespace-nowrap",
                                            nature === n.value
                                                ? "bg-black text-white shadow-lg scale-105"
                                                : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                        )}
                                    >
                                        {n.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-2">
                        {properties.length} bien{properties.length > 1 ? 's' : ''} répertorié{properties.length > 1 ? 's' : ''}
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-center ml-2">Initialisation du catalogue...</span>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-32 solaris-glass rounded-[3rem] border border-dashed border-white/20">
                        <Building className="h-24 w-24 mx-auto text-muted-foreground/10 mb-6" />
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Aucun bien disponible</h3>
                        <p className="text-muted-foreground/60 text-sm font-medium">Modifiez vos filtres pour explorer d'autres opportunités.</p>
                    </div>
                ) : (
                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                        {properties.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                onClick={() => openDetail(p)}
                                className="group cursor-pointer flex flex-col overflow-hidden rounded-[2.5rem] solaris-glass shadow-xl hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] hover:-translate-y-2 transition-all duration-500"
                            >
                                {/* Image */}
                                <div className="aspect-[16/11] w-full bg-muted relative overflow-hidden">
                                    {p.images && p.images.length > 0 ? (
                                        <img
                                            src={p.images[0].image}
                                            alt={p.name}
                                            className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-accent/5">
                                            <Building className="h-16 w-16 text-muted-foreground/10" />
                                        </div>
                                    )}

                                    {/* Badges Overlay */}
                                    <div className="absolute top-6 left-6 flex flex-wrap gap-2 pr-12">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] text-white shadow-2xl backdrop-blur-md border border-white/20",
                                            p.category === 'RESIDENTIEL' ? "bg-blue-600/80" :
                                                p.category === 'COMMERCIAL' ? "bg-orange-600/80" : "bg-purple-600/80"
                                        )}>
                                            {p.category_display}
                                        </span>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] text-white shadow-2xl backdrop-blur-md border border-white/20",
                                            p.transaction_nature === 'VENTE' ? "bg-emerald-600/80" : "bg-indigo-600/80"
                                        )}>
                                            {p.transaction_nature_display}
                                        </span>
                                    </div>

                                    {/* Verification Badge */}
                                    {p.is_verified_fonciere && (
                                        <div className="absolute top-6 right-6">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-lg backdrop-blur-md border border-white/20">
                                                <ShieldCheck className="h-4 w-4" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Price Card */}
                                    {getPrice(p) && (
                                        <div className="absolute bottom-6 right-6 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                                            <span className="text-sm font-black text-white tracking-tight">{getPrice(p)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Details Region */}
                                <div className="flex flex-col flex-1 p-8">
                                    <h3 className="text-xl font-black uppercase tracking-tight line-clamp-1 mb-2 group-hover:text-primary transition-colors duration-300">
                                        {p.name}
                                    </h3>
                                    <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-6">
                                        <MapPin className="h-3 w-3 mr-2 text-primary" />
                                        {p.city} <span className="mx-2 opacity-20">|</span> {p.postal_code}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-8">
                                        {p.surface && (
                                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10">
                                                <Ruler className="h-4 w-4 mb-2 text-primary/40" />
                                                <span className="text-[11px] font-black">{p.surface} <span className="text-[8px] opacity-40 uppercase tracking-widest ml-0.5">m²</span></span>
                                            </div>
                                        )}
                                        {p.room_count && (
                                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10">
                                                <Home className="h-4 w-4 mb-2 text-primary/40" />
                                                <span className="text-[11px] font-black">{p.room_count} <span className="text-[8px] opacity-40 uppercase tracking-widest ml-0.5">PCS</span></span>
                                            </div>
                                        )}
                                        {p.bedroom_count && (
                                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10">
                                                <Bed className="h-4 w-4 mb-2 text-primary/40" />
                                                <span className="text-[11px] font-black">{p.bedroom_count} <span className="text-[8px] opacity-40 uppercase tracking-widest ml-0.5">CH.</span></span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary group-hover:tracking-[0.4em] transition-all duration-500">
                                            Consulter le protocole
                                        </span>
                                        <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl">
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Property Detail Modal */}
            <AnimatePresence>
                {selectedProp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-start justify-center pt-8 pb-8 bg-[#020817]/80 backdrop-blur-xl overflow-y-auto"
                        onClick={closeDetail}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                            className="bg-card solaris-glass border-white/10 border rounded-[3rem] shadow-2xl w-full max-w-4xl mx-4 overflow-hidden relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={closeDetail}
                                className="absolute top-6 right-6 z-10 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10"
                            >
                                <X className="h-6 w-6" />
                            </button>

                            <div className="flex flex-col lg:flex-row">
                                {/* Image Section */}
                                <div className="lg:w-1/2 aspect-video lg:aspect-auto bg-muted relative">
                                    {selectedProp.images && selectedProp.images.length > 0 ? (
                                        <img src={selectedProp.images[0].image} alt={selectedProp.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-accent/5">
                                            <Building className="h-24 w-24 text-muted-foreground/10" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-8 right-8 px-6 py-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                                        <span className="text-2xl font-black text-white tracking-tighter">{getPrice(selectedProp)}</span>
                                    </div>
                                    {selectedProp.prix_nuitee && selectedProp.transaction_nature === 'LOCATION' && (
                                        <div className="absolute top-8 left-8 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md shadow-lg border border-white/10">
                                            <span className="text-sm font-black text-foreground uppercase tracking-tight">{formatCurrency(selectedProp.prix_nuitee, true)}/nuit</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div className="lg:w-1/2 p-6 sm:p-10 space-y-8 overflow-y-auto max-h-[70vh] lg:max-h-[80vh] custom-scrollbar">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                selectedProp.category === 'RESIDENTIEL' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" :
                                                    selectedProp.category === 'COMMERCIAL' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" :
                                                        "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                                            )}>
                                                {selectedProp.category_display}
                                            </span>
                                            <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                selectedProp.transaction_nature === 'VENTE' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                                                    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
                                            )}>
                                                {selectedProp.transaction_nature_display}
                                            </span>
                                        </div>
                                        <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">{selectedProp.name}</h2>
                                        <div className="flex items-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                                            <MapPin className="h-4 w-4 mr-3 text-primary" />
                                            {selectedProp.address}, {selectedProp.city} {selectedProp.postal_code}
                                        </div>
                                    </div>

                                    {/* Detailed Specs Grid */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                                            <Ruler className="h-5 w-5 mx-auto mb-3 text-primary" />
                                            <div className="text-xl font-black">{selectedProp.surface}</div>
                                            <div className="text-[9px] uppercase text-muted-foreground font-black tracking-widest mt-1">m² habitable</div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                                            <Home className="h-5 w-5 mx-auto mb-3 text-primary" />
                                            <div className="text-xl font-black">{selectedProp.room_count}</div>
                                            <div className="text-[9px] uppercase text-muted-foreground font-black tracking-widest mt-1">Pièces</div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                                            <Bed className="h-5 w-5 mx-auto mb-3 text-primary" />
                                            <div className="text-xl font-black">{selectedProp.bedroom_count}</div>
                                            <div className="text-[9px] uppercase text-muted-foreground font-black tracking-widest mt-1">Chambres</div>
                                        </div>
                                    </div>

                                    {selectedProp.description && (
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Le Manifeste</h4>
                                            <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium">{selectedProp.description}</p>
                                        </div>
                                    )}

                                    {/* Verification Docs Section */}
                                    {selectedProp.is_verified_fonciere && (
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                                    <ShieldCheck className="h-5 w-5" />
                                                    Certification Foncière
                                                </h3>
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                                            </div>

                                            {selectedProp.verification_documents?.length > 0 ? (
                                                <div className="grid gap-3">
                                                    {selectedProp.verification_documents.map(doc => (
                                                        <a
                                                            key={doc.id}
                                                            href={doc.file}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-[1.5rem] hover:bg-white/10 transition-all group"
                                                        >
                                                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                                <FileText className="h-6 w-6" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-bold text-foreground truncate">{doc.title}</div>
                                                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Certifié MaDis Foncière</div>
                                                            </div>
                                                            <Download className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-6 rounded-[1.5rem] bg-emerald-500/5 border border-dashed border-emerald-500/20 text-center">
                                                    <p className="text-xs text-emerald-600/60 font-medium italic">
                                                        Documents de certification scellés. Consultation disponible sur demande exclusive.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Area */}
                                    <div className="pt-6">
                                        {!showOffer && !offerSent && user?.role !== 'ADMIN_MADIS' && user?.id !== selectedProp?.owner && (
                                            <button
                                                onClick={() => setShowOffer(true)}
                                                className="w-full py-5 rounded-[1.5rem] bg-black text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98]"
                                            >
                                                <Send className="h-4 w-4" />
                                                Initier une offre
                                            </button>
                                        )}

                                        {/* Offer Form Overlay */}
                                        <AnimatePresence>
                                            {showOffer && !offerSent && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-6 overflow-hidden pt-4"
                                                >
                                                    <div className="p-6 rounded-[2rem] bg-primary/[0.03] border border-primary/10">
                                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-6 flex items-center gap-3">
                                                            <Euro className="h-5 w-5" />
                                                            Protocole d'offre
                                                        </h3>
                                                        <div className="grid grid-cols-1 gap-5">
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Prénom & Nom du Prospect</label>
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    value={offerForm.prospect_name}
                                                                    onChange={e => setOfferForm(f => ({ ...f, prospect_name: e.target.value }))}
                                                                    className="w-full h-14 px-6 rounded-2xl border border-foreground/10 dark:border-white/5 bg-foreground/5 dark:bg-white/5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Montant de l'offre (€)</label>
                                                                <input
                                                                    type="number"
                                                                    required
                                                                    value={offerForm.asking_price}
                                                                    onChange={e => setOfferForm(f => ({ ...f, asking_price: e.target.value }))}
                                                                    className="w-full h-14 px-6 rounded-2xl border border-foreground/10 dark:border-white/5 bg-foreground/5 dark:bg-white/5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Email</label>
                                                                    <input
                                                                        type="email"
                                                                        value={offerForm.prospect_email}
                                                                        onChange={e => setOfferForm(f => ({ ...f, prospect_email: e.target.value }))}
                                                                        className="w-full h-14 px-6 rounded-2xl border border-foreground/10 dark:border-white/5 bg-foreground/5 dark:bg-white/5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Téléphone</label>
                                                                    <input
                                                                        type="tel"
                                                                        value={offerForm.prospect_phone}
                                                                        onChange={e => setOfferForm(f => ({ ...f, prospect_phone: e.target.value }))}
                                                                        className="w-full h-14 px-6 rounded-2xl border border-foreground/10 dark:border-white/5 bg-foreground/5 dark:bg-white/5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Note au vendeur (optionnel)</label>
                                                                <textarea
                                                                    rows={3}
                                                                    value={offerForm.notes}
                                                                    onChange={e => setOfferForm(f => ({ ...f, notes: e.target.value }))}
                                                                    className="w-full p-6 rounded-2xl border border-foreground/10 dark:border-white/5 bg-foreground/5 dark:bg-white/5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm resize-none"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-4 mt-8">
                                                            <button
                                                                onClick={() => setShowOffer(false)}
                                                                className="flex-1 py-4 rounded-xl border border-black/5 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black/5 transition-colors"
                                                            >
                                                                Abandonner
                                                            </button>
                                                            <button
                                                                onClick={submitOffer}
                                                                disabled={sending || !offerForm.prospect_name || !offerForm.asking_price}
                                                                className="flex-1 py-4 rounded-xl bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                                            >
                                                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                                Envoyer
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
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-10 text-center shadow-2xl"
                                                >
                                                    <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                                                        <CheckCircle className="h-8 w-8 text-white" />
                                                    </div>
                                                    <h3 className="font-black text-2xl uppercase tracking-tighter text-emerald-600 mb-2">Offre Transmise</h3>
                                                    <p className="text-xs text-emerald-600/70 font-semibold uppercase tracking-widest">
                                                        Protocole envoyé avec succès. Notre équipe prendra contact avec vous.
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
