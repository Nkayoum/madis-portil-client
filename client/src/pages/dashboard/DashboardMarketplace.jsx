import { useState, useEffect, useCallback } from 'react';
/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from 'framer-motion';
/* eslint-enable no-unused-vars */
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
    Search, Building, MapPin, Bed, Ruler, Filter, X, Send,
    ShoppingBag, Briefcase, Home, Loader2,
    Euro, CheckCircle, ArrowRight, Phone, Mail, User, MessageSquare,
    ShieldCheck, FileText, Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../lib/utils';

const CATEGORIES = [
    { value: '', labelKey: 'marketplace.cat_all', icon: Filter },
    { value: 'RESIDENTIEL', labelKey: 'marketplace.cat_residential', icon: Home },
    { value: 'COMMERCIAL', labelKey: 'marketplace.cat_commercial', icon: ShoppingBag },
    { value: 'PROFESSIONNEL', labelKey: 'marketplace.cat_professional', icon: Briefcase },
];

const NATURES = [
    { value: '', labelKey: 'marketplace.nature_all' },
    { value: 'VENTE', labelKey: 'marketplace.nature_sale' },
    { value: 'LOCATION', labelKey: 'marketplace.nature_rent' },
];

export default function DashboardMarketplace() {
    const { t } = useTranslation();
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

    const fetchProperties = useCallback(async () => {
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
    }, [category, nature, search]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

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
            showToast({ message: t('marketplace.toast_offer_success'), type: 'success' });
        } catch (err) {
            console.error('offer error', err);
            showToast({ message: t('marketplace.toast_offer_error'), type: 'error' });
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-3 border-b border-black/5 dark:border-white/5">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase leading-tight md:leading-none mb-1.5">{t('marketplace.title')}</h1>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">{t('marketplace.subtitle')}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative group w-full sm:w-[280px]">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="h-3.5 w-3.5 text-black/20 dark:text-white/20 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('marketplace.search_placeholder')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-11 pl-12 pr-6 rounded-xl bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:opacity-30 dark:text-white"
                        />
                    </div>

                    <div className="hidden sm:flex items-center gap-2.5 px-5 h-11 rounded-xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/5">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-30">{t('marketplace.total')}</span>
                        <span className="text-[12px] font-bold">{properties.length}</span>
                    </div>
                </div>
            </div>

            {/* Solaris Filter Navigation */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="lg:mx-0 lg:px-0 w-full lg:w-auto [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-center gap-1.5 p-1 bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl md:rounded-[1.25rem] w-fit whitespace-nowrap">
                        {CATEGORIES.map(c => {
                            const Icon = c.icon;
                            const isActive = category === c.value;
                            return (
                                <button
                                    key={c.value}
                                    onClick={() => setCategory(c.value)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
                                        isActive
                                            ? "bg-black text-white shadow-md"
                                            : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-black/20 dark:text-white/20")} />
                                    {t(c.labelKey)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="lg:mx-0 lg:px-0 w-full lg:w-auto [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-center gap-1.5 p-1 bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl w-fit whitespace-nowrap">
                        {NATURES.map(n => {
                            const isActive = nature === n.value;
                            return (
                                <button
                                    key={n.value}
                                    onClick={() => setNature(n.value)}
                                    className={cn(
                                        "px-4 py-2 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                        isActive
                                            ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm"
                                            : "text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    {isActive && <span className="inline-block w-1 h-1 rounded-full bg-primary mr-1.5 animate-pulse" />}
                                    {t(n.labelKey)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Industrial Property Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">{t('marketplace.syncing')}</span>
                </div>
            ) : properties.length === 0 ? (
                <div className="text-center py-24 solaris-glass rounded-[2rem] border-dashed border-2 border-black/5">
                    <Building className="h-16 w-16 mx-auto text-black/5 mb-4" />
                    <h3 className="text-xl font-bold uppercase tracking-tight mb-2">{t('marketplace.empty_title')}</h3>
                    <p className="text-[9px] font-semibold uppercase tracking-widest opacity-40">{t('marketplace.empty_desc')}</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {properties.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => openDetail(p)}
                            className="group cursor-pointer flex flex-col overflow-hidden solaris-glass rounded-[1.5rem] border-none shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500"
                        >
                            {/* Card Media */}
                            <div className="aspect-[16/11] w-full bg-black/5 relative overflow-hidden">
                                {p.images && p.images.length > 0 ? (
                                    <img src={p.images[0].image} alt={p.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Building className="h-10 w-10 text-black/5" />
                                    </div>
                                )}

                                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest text-white shadow-md backdrop-blur-md",
                                        p.category === 'RESIDENTIEL' ? "bg-black/60" : p.category === 'COMMERCIAL' ? "bg-primary/80" : "bg-black/80"
                                    )}>{p.category_display}</span>

                                    {p.management_type !== 'CONSTRUCTION' ? (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest text-white shadow-md backdrop-blur-md",
                                            p.transaction_nature === 'VENTE' ? "bg-white/90 text-black" : "bg-primary/90"
                                        )}>{p.transaction_nature_display}</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest text-white bg-red-600 shadow-md">{t('marketplace.badge_prototype')}</span>
                                    )}
                                </div>

                                {p.is_verified_fonciere && (
                                    <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border border-white/20 animate-pulse">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                    </div>
                                )}

                                {getPrice(p) && (
                                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-xl text-white shadow-lg">
                                        <span className="text-[14px] font-bold tracking-tight">{getPrice(p)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Card Details */}
                            <div className="flex flex-col flex-1 p-5 space-y-3">
                                <div>
                                    <h3 className="text-lg font-bold uppercase tracking-tight leading-none mb-1.5 group-hover:text-primary transition-colors">{p.name}</h3>
                                    <div className="flex items-center text-[9px] font-bold uppercase tracking-widest opacity-40">
                                        <MapPin className="h-3 w-3 mr-1.5 text-primary" />
                                        {p.city}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 border-y border-black/5 py-3">
                                    <div className="text-center">
                                        <div className="text-[12px] font-bold leading-none mb-0.5">{p.surface || '---'}</div>
                                        <div className="text-[7px] font-bold uppercase tracking-tighter opacity-30">{t('marketplace.surface_label')}</div>
                                    </div>
                                    <div className="text-center border-x border-black/5">
                                        <div className="text-[12px] font-bold leading-none mb-0.5">{p.room_count || '---'}</div>
                                        <div className="text-[7px] font-bold uppercase tracking-tighter opacity-30">{t('marketplace.room_label')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[12px] font-bold leading-none mb-0.5">{p.bedroom_count || '---'}</div>
                                        <div className="text-[7px] font-bold uppercase tracking-tighter opacity-30">{t('marketplace.bed_label')}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex -space-x-1.5">
                                        <div className="h-7 w-7 rounded-full bg-black/5 border-2 border-white flex items-center justify-center text-[9px] font-bold">M</div>
                                        <div className="h-7 w-7 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[9px] font-bold text-primary">D</div>
                                    </div>

                                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
                                        {t('marketplace.btn_analyze')}
                                        <ArrowRight className="h-3.5 w-3.5 text-primary" />
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
                            className="bg-white dark:bg-[rgba(2,4,10,0.98)] rounded-[1.5rem] md:rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden border border-black/5 dark:border-white/5"
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
                                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                                        <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest">{selectedProp.category_display}</span>
                                        <span className="px-2 py-0.5 rounded-lg bg-primary/80 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest">{selectedProp.transaction_nature_display}</span>
                                    </div>
                                    <button onClick={closeDetail} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black hover:bg-primary text-white flex items-center justify-center transition-all shadow-lg z-10">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Content Section */}
                                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col min-h-0 overflow-y-auto">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-30">{t('marketplace.detail_id')}</span>
                                            <span className="text-[8px] md:text-[9px] font-mono tracking-tight opacity-100 font-bold bg-black/5 px-2 py-0.5 rounded">MADIS-{selectedProp.id}</span>
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight leading-tight mb-3">{selectedProp.name}</h2>
                                        <div className="flex items-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-40">
                                            <MapPin className="h-3.5 w-3.5 mr-2 text-primary" />
                                            {selectedProp.city}
                                        </div>
                                    </div>

                                    {/* Financial Focus */}
                                    <div className="p-4 md:p-5 bg-black text-white rounded-[1.25rem] shadow-xl mb-6">
                                        <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">{t('marketplace.detail_value')}</div>
                                        <div className="text-xl md:text-2xl font-bold tracking-tight">{getPrice(selectedProp) || t('marketplace.detail_on_demand')}</div>
                                    </div>

                                    {/* Specs Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-black/[0.03] p-3 rounded-xl flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary shrink-0"><Ruler className="h-4 w-4" /></div>
                                            <div className="min-w-0">
                                                <div className="text-[12px] font-bold truncate">{selectedProp.surface} m²</div>
                                                <div className="text-[7px] font-bold uppercase opacity-30">{t('marketplace.spec_surface')}</div>
                                            </div>
                                        </div>
                                        <div className="bg-black/[0.03] p-3 rounded-xl flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary shrink-0"><Home className="h-4 w-4" /></div>
                                            <div className="min-w-0">
                                                <div className="text-[12px] font-bold truncate">{selectedProp.room_count} Pcs</div>
                                                <div className="text-[7px] font-bold uppercase opacity-30">{t('marketplace.spec_type')}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advanced Documents Integration */}
                                    {selectedProp.is_verified_fonciere && (
                                        <div className="space-y-3 mb-6">
                                            <h3 className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 opacity-100">
                                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                                {t('marketplace.cert_title')}
                                            </h3>
                                            <div className="space-y-1.5">
                                                {selectedProp.verification_documents?.map(doc => (
                                                    <a
                                                        key={doc.id}
                                                        href={doc.file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 rounded-xl border border-black/5 hover:bg-black/5 transition-all group"
                                                    >
                                                        <FileText className="h-3.5 w-3.5 text-black/20 group-hover:text-primary" />
                                                        <span className="text-[9px] font-bold uppercase tracking-tight flex-1 truncate">{doc.title}</span>
                                                        <Download className="h-3.5 w-3.5 text-black/20 group-hover:text-black" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Offer Management Flow */}
                                    {!offerSent && user?.id !== selectedProp?.owner && (
                                        <div className="mt-auto pt-4 border-t border-black/5">
                                            {!showOffer ? (
                                                <button
                                                    onClick={() => setShowOffer(true)}
                                                    className="w-full h-12 md:h-14 rounded-xl bg-primary text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Send className="h-4 w-4" />
                                                    {t('marketplace.btn_offer')}
                                                </button>
                                            ) : (
                                                <div className="space-y-4 animate-in slide-in-from-bottom-5">
                                                    <div className="space-y-2">
                                                        <label className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40">{t('marketplace.offer_amount')}</label>
                                                        <input
                                                            type="number"
                                                            value={offerForm.asking_price}
                                                            onChange={e => setOfferForm(f => ({ ...f, asking_price: e.target.value }))}
                                                            className="w-full h-12 px-5 rounded-xl bg-black/[0.03] dark:bg-white/5 border-none text-[16px] font-bold focus:bg-white transition-all outline-none dark:text-white"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <textarea
                                                        value={offerForm.notes}
                                                        onChange={e => setOfferForm(f => ({ ...f, notes: e.target.value }))}
                                                        className="w-full p-4 rounded-xl bg-black/[0.03] dark:bg-white/5 border-none text-[11px] font-medium min-h-[70px] outline-none transition-all focus:bg-white dark:text-white"
                                                        placeholder={t('marketplace.offer_notes')}
                                                    />
                                                    <div className="flex gap-2.5">
                                                        <button onClick={() => setShowOffer(false)} className="h-12 px-6 rounded-xl border border-black/5 dark:border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-black/5 transition-all">{t('marketplace.offer_cancel')}</button>
                                                        <button
                                                            disabled={sending || !offerForm.asking_price}
                                                            onClick={submitOffer}
                                                            className="h-12 flex-1 rounded-xl bg-black text-white text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50 transition-all"
                                                        >
                                                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5 text-primary" />}
                                                            {t('marketplace.offer_submit')}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {offerSent && (
                                        <div className="mt-auto p-6 rounded-[1.25rem] bg-emerald-500 text-white text-center shadow-xl">
                                            <CheckCircle className="h-8 w-8 mx-auto mb-3" />
                                            <div className="text-[10px] font-bold uppercase tracking-widest mb-1">{t('marketplace.offer_success_title')}</div>
                                            <div className="text-[9px] opacity-70 font-bold uppercase tracking-tight">{t('marketplace.offer_success_desc')}</div>
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
