import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
    Search, Building, MapPin, Bed, Ruler, Filter, X, Send,
    ShoppingBag, Briefcase, Home, Loader2,
    Euro, CheckCircle, ArrowRight, Phone, Mail, User, MessageSquare,
    ShieldCheck, FileText, Download
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

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
            return formatCurrency(p.prix_vente, true);
        if (p.transaction_nature === 'LOCATION' && p.loyer_mensuel)
            return formatCurrency(p.loyer_mensuel) + '/mois';
        return null;
    };

    return (
        <div className="space-y-8 md:space-y-12 animate-fade-in py-8 px-4 max-w-[1600px] mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-black/5 dark:border-white/5">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight uppercase leading-tight md:leading-none mb-2">Marketplace</h1>
                    <p className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">Registre des actifs disponibles • Acquisition & Location</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group w-full sm:w-[300px] md:w-[350px]">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-black/20 dark:text-white/20 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="RECHERCHER UN ACTIF..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-12 md:h-14 pl-14 pr-6 rounded-2xl bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 text-[10px] md:text-[11px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:opacity-30 dark:text-white"
                        />
                    </div>

                    <div className="hidden sm:flex items-center gap-3 px-6 h-12 md:h-14 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Total:</span>
                        <span className="text-[12px] md:text-[14px] font-black">{properties.length}</span>
                    </div>
                </div>
            </div>

            {/* Solaris Filter Navigation */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="lg:mx-0 lg:px-0 w-full lg:w-auto [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-center gap-2 md:gap-4 p-1.5 bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl md:rounded-[1.5rem] w-fit whitespace-nowrap">
                        {CATEGORIES.map(c => {
                            const Icon = c.icon;
                            const isActive = category === c.value;
                            return (
                                <button
                                    key={c.value}
                                    onClick={() => setCategory(c.value)}
                                    className={cn(
                                        "flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300",
                                        isActive
                                            ? "bg-black text-white shadow-xl scale-[1.05]"
                                            : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <Icon className={cn("h-3.5 w-3.5 md:h-4 w-4", isActive ? "text-primary" : "text-black/20 dark:text-white/20")} />
                                    {c.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="lg:mx-0 lg:px-0 w-full lg:w-auto [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-center gap-2 p-1.5 bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl w-fit whitespace-nowrap">
                        {NATURES.map(n => {
                            const isActive = nature === n.value;
                            return (
                                <button
                                    key={n.value}
                                    onClick={() => setNature(n.value)}
                                    className={cn(
                                        "px-4 md:px-5 py-2 md:py-2.5 text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all",
                                        isActive
                                            ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-md"
                                            : "text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    {isActive && <span className="inline-block w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary mr-1.5 md:mr-2 animate-pulse" />}
                                    {n.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Industrial Property Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Synchronisation Marketplace...</span>
                </div>
            ) : properties.length === 0 ? (
                <div className="text-center py-32 solaris-glass rounded-[3rem] border-dashed border-2 border-black/5">
                    <Building className="h-20 w-20 mx-auto text-black/5 mb-6" />
                    <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">Aucun actif detecté</h3>
                    <p className="text-[10px] font-semibold uppercase tracking-widest opacity-40">Modifiez les paramètres du protocole de filtrage.</p>
                </div>
            ) : (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {properties.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => openDetail(p)}
                            className="group cursor-pointer flex flex-col overflow-hidden solaris-glass rounded-[2rem] border-none shadow-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500"
                        >
                            {/* Card Media */}
                            <div className="aspect-[16/11] w-full bg-black/5 relative overflow-hidden">
                                {p.images && p.images.length > 0 ? (
                                    <img src={p.images[0].image} alt={p.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Building className="h-12 w-12 text-black/5" />
                                    </div>
                                )}

                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white shadow-lg backdrop-blur-md",
                                        p.category === 'RESIDENTIEL' ? "bg-black/60" : p.category === 'COMMERCIAL' ? "bg-primary/80" : "bg-black/80"
                                    )}>{p.category_display}</span>

                                    {p.management_type !== 'CONSTRUCTION' ? (
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white shadow-lg backdrop-blur-md",
                                            p.transaction_nature === 'VENTE' ? "bg-white/90 text-black border border-black/5" : "bg-primary/90"
                                        )}>{p.transaction_nature_display}</span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white bg-red-600 shadow-lg">Prototype</span>
                                    )}
                                </div>

                                {p.is_verified_fonciere && (
                                    <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border border-white/20 animate-pulse">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                )}

                                {getPrice(p) && (
                                    <div className="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-black/90 backdrop-blur-xl text-white shadow-2xl">
                                        <span className="text-[16px] font-bold tracking-tight">{getPrice(p)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Card Details */}
                            <div className="flex flex-col flex-1 p-6 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold uppercase tracking-tight leading-none mb-2 group-hover:text-primary transition-colors">{p.name}</h3>
                                    <div className="flex items-center text-[10px] font-bold uppercase tracking-widest opacity-40">
                                        <MapPin className="h-3 w-3 mr-2 text-primary" />
                                        {p.city}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 border-y border-black/5 py-4">
                                    <div className="text-center">
                                        <div className="text-[14px] font-black leading-none mb-1">{p.surface || '---'}</div>
                                        <div className="text-[8px] font-black uppercase tracking-tighter opacity-30">Surface m²</div>
                                    </div>
                                    <div className="text-center border-x border-black/5">
                                        <div className="text-[14px] font-black leading-none mb-1">{p.room_count || '---'}</div>
                                        <div className="text-[8px] font-black uppercase tracking-tighter opacity-30">Pièces</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[14px] font-black leading-none mb-1">{p.bedroom_count || '---'}</div>
                                        <div className="text-[8px] font-black uppercase tracking-tighter opacity-30">Chambres</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex -space-x-2">
                                        <div className="h-8 w-8 rounded-full bg-black/5 border-2 border-white flex items-center justify-center text-[10px] font-bold">M</div>
                                        <div className="h-8 w-8 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">D</div>
                                    </div>

                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                                        Analyser
                                        <ArrowRight className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Premium Detail Modal */}
            <AnimatePresence>
                {selectedProp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-8 pt-16 md:pt-20"
                        onClick={closeDetail}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[rgba(2,4,10,0.98)] rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] w-full max-w-4xl max-h-full flex flex-col overflow-hidden border border-black/5 dark:border-white/5"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex flex-col md:flex-row min-h-0 flex-1 overflow-hidden">
                                {/* Media Section */}
                                <div className="w-full md:w-1/2 bg-black/5 relative min-h-[250px] md:min-h-0 md:max-h-none overflow-hidden">
                                    {selectedProp.images?.length > 0 ? (
                                        <img src={selectedProp.images[0].image} alt={selectedProp.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Building className="h-16 w-16 md:h-20 md:w-20 text-black/5" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 md:top-6 left-4 md:left-6 flex flex-col gap-2">
                                        <span className="px-2.5 py-1 rounded-lg md:rounded-xl bg-black/70 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">{selectedProp.category_display}</span>
                                        <span className="px-2.5 py-1 rounded-lg md:rounded-xl bg-primary/80 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">{selectedProp.transaction_nature_display}</span>
                                    </div>
                                    <button onClick={closeDetail} className="absolute top-4 md:top-6 right-4 md:right-6 h-9 w-9 md:h-10 md:w-10 rounded-full bg-black hover:bg-primary text-white flex items-center justify-center transition-all shadow-xl z-10">
                                        <X className="h-4 w-4 md:h-5 md:w-5" />
                                    </button>
                                </div>

                                {/* Content Section */}
                                <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col min-h-0 overflow-y-auto">
                                    <div className="mb-6 md:mb-8">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-30">Actif ID:</span>
                                            <span className="text-[9px] md:text-[10px] font-mono tracking-tighter opacity-100 font-bold bg-black/5 px-2 py-0.5 rounded">MADIS-{selectedProp.id}</span>
                                        </div>
                                        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-tight mb-4">{selectedProp.name}</h2>
                                        <div className="flex items-center text-[10px] md:text-[11px] font-black uppercase tracking-widest opacity-40">
                                            <MapPin className="h-3.5 w-3.5 md:h-4 w-4 mr-2 text-primary" />
                                            {selectedProp.city} • {selectedProp.address}
                                        </div>
                                    </div>

                                    {/* Financial Focus */}
                                    <div className="p-5 md:p-6 bg-black text-white rounded-[1.5rem] shadow-2xl mb-6 md:mb-8">
                                        <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Valeur Transactionnelle</div>
                                        <div className="text-2xl md:text-4xl font-black tracking-tighter">{getPrice(selectedProp) || 'PRIX SUR DEMANDE'}</div>
                                    </div>

                                    {/* Specs Grid */}
                                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                                        <div className="bg-black/[0.03] p-3 md:p-4 rounded-2xl flex items-center gap-3 md:gap-4">
                                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0"><Ruler className="h-4 w-4 md:h-5 md:w-5" /></div>
                                            <div className="min-w-0">
                                                <div className="text-[12px] md:text-[14px] font-black truncate">{selectedProp.surface} m²</div>
                                                <div className="text-[7px] md:text-[8px] font-black uppercase opacity-30">Surface</div>
                                            </div>
                                        </div>
                                        <div className="bg-black/[0.03] p-3 md:p-4 rounded-2xl flex items-center gap-3 md:gap-4">
                                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0"><Home className="h-4 w-4 md:h-5 md:w-5" /></div>
                                            <div className="min-w-0">
                                                <div className="text-[12px] md:text-[14px] font-black truncate">{selectedProp.room_count} Pcs</div>
                                                <div className="text-[7px] md:text-[8px] font-black uppercase opacity-30">Typologie</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advanced Documents Integration */}
                                    {selectedProp.is_verified_fonciere && (
                                        <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                                            <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-100">
                                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                                Certification Foncière
                                            </h3>
                                            <div className="space-y-2">
                                                {selectedProp.verification_documents?.map(doc => (
                                                    <a
                                                        key={doc.id}
                                                        href={doc.file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl border border-black/5 hover:bg-black/5 transition-all group"
                                                    >
                                                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-black/20 group-hover:text-primary" />
                                                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-tight flex-1 truncate">{doc.title}</span>
                                                        <Download className="h-3.5 w-3.5 md:h-4 w-4 text-black/20 group-hover:text-black" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Offer Management Flow */}
                                    {!offerSent && user?.id !== selectedProp?.owner && (
                                        <div className="mt-auto pt-6 border-t border-black/5">
                                            {!showOffer ? (
                                                <button
                                                    onClick={() => setShowOffer(true)}
                                                    className="w-full h-14 md:h-16 rounded-2xl bg-primary text-white text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 md:gap-4"
                                                >
                                                    <Send className="h-4 w-4 md:h-5 md:w-5" />
                                                    Engager une offre
                                                </button>
                                            ) : (
                                                <div className="space-y-6 animate-in slide-in-from-bottom-5">
                                                    <div className="space-y-4">
                                                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40">Proposition financière (€)</label>
                                                        <input
                                                            type="number"
                                                            value={offerForm.asking_price}
                                                            onChange={e => setOfferForm(f => ({ ...f, asking_price: e.target.value }))}
                                                            className="w-full h-12 md:h-14 px-6 rounded-2xl bg-black/[0.03] dark:bg-white/5 border-none text-[16px] md:text-[18px] font-black focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none dark:text-white"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <textarea
                                                        value={offerForm.notes}
                                                        onChange={e => setOfferForm(f => ({ ...f, notes: e.target.value }))}
                                                        className="w-full p-4 md:p-6 rounded-2xl bg-black/[0.03] dark:bg-white/5 border-none text-[11px] md:text-[12px] font-medium min-h-[80px] md:min-h-[100px] outline-none transition-all focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                        placeholder="Notes additionnelles..."
                                                    />
                                                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                                                        <button onClick={() => setShowOffer(false)} className="h-14 md:h-16 rounded-2xl border border-black/5 dark:border-white/10 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-all">Annuler</button>
                                                        <button
                                                            disabled={sending || !offerForm.asking_price}
                                                            onClick={submitOffer}
                                                            className="h-14 md:h-16 rounded-2xl bg-black text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-neutral-800 disabled:opacity-50 transition-all sm:flex-[2]"
                                                        >
                                                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-primary" />}
                                                            Soumettre l'offre
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {offerSent && (
                                        <div className="mt-auto p-8 rounded-3xl bg-emerald-500 text-white text-center shadow-2xl">
                                            <CheckCircle className="h-10 w-10 mx-auto mb-4" />
                                            <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-1">Offre Transmise</div>
                                            <div className="text-[11px] opacity-70 font-bold uppercase tracking-widest">Protocole de liaison activé</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
