import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import {
    Tag, X, DollarSign, StickyNote, UserPlus, CheckCircle, XCircle, MessageSquare, ChevronDown, Settings, Percent, Home, Calendar, Wrench, Sofa, Shield, Check,
    ArrowLeft, Building, Loader2, Plus, Trash2, Edit, MapPin, Ruler, FileText, Euro, Clock, ArrowRight, ChevronLeft, ChevronRight, HardHat,
    TrendingUp, TrendingDown, Activity, AlertTriangle, Globe, RefreshCw, Download, ShieldCheck, History, LayoutDashboard, ClipboardList, CheckCircle2, Users, Upload
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn, formatCurrency } from '../../lib/utils';
import WalletCard from '../../components/dashboard/WalletCard';
import CashCallModal from '../../components/dashboard/CashCallModal';
import SettlementModal from '../../components/dashboard/SettlementModal';


export default function PropertyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN_MADIS';
    const { showToast } = useToast();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [associatedProjects, setAssociatedProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [perfData, setPerfData] = useState(null);
    const [loadingPerf, setLoadingPerf] = useState(false);
    // Transaction Pipeline State
    const [showTxModal, setShowTxModal] = useState(false);
    const [txLoading, setTxLoading] = useState(false);
    const [txForm, setTxForm] = useState({ buyer_tenant: '', asking_price: '', notes: '' });
    const [users, setUsers] = useState([]);
    const [statusDropdown, setStatusDropdown] = useState(null);
    const [showCashCallModal, setShowCashCallModal] = useState(false);
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [cashCalls, setCashCalls] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [loadingOps, setLoadingOps] = useState(false);
    const [showFinalPriceModal, setShowFinalPriceModal] = useState(false);
    const [finalPriceTxId, setFinalPriceTxId] = useState(null);
    const [finalPriceValue, setFinalPriceValue] = useState('');
    const [showProofModal, setShowProofModal] = useState(false);
    const [proofOp, setProofOp] = useState(null); // { type, opId, newStatus }


    // Diaspora / Converted Currency State
    const [currencyRate, setCurrencyRate] = useState(null);
    const [loadingCurrency, setLoadingCurrency] = useState(false);

    // Documents State
    const [documents, setDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [documentFilter, setDocumentFilter] = useState('all'); // 'all', 'TITRE_PROPRIETE', etc.
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const TX_STATUSES = [
        { value: 'DISPONIBLE', label: 'Disponible', color: 'bg-blue-500', icon: Tag },
        { value: 'NEGOCIATION', label: 'En négociation', color: 'bg-amber-500', icon: MessageSquare },
        { value: 'SIGNE', label: 'Signé / Conclu', color: 'bg-emerald-500', icon: CheckCircle },
        { value: 'ANNULE', label: 'Annulé', color: 'bg-red-500', icon: XCircle },
    ];

    const fetchCurrencyRate = async (targetCurrency) => {
        if (!targetCurrency || targetCurrency === 'EUR') return;
        setLoadingCurrency(true);
        try {
            // Using a public API for demo purposes. In production, cache this backend-side.
            const res = await fetch('https://open.er-api.com/v6/latest/EUR');
            const data = await res.json();
            if (data && data.rates) {
                setCurrencyRate(data.rates[targetCurrency]);
            }
        } catch (err) {
            console.error('Failed to fetch currency rate', err);
        } finally {
            setLoadingCurrency(false);
        }
    };

    const fetchProperty = async () => {
        try {
            const response = await api.get(`/properties/${id}/`);
            setProperty(response.data);
        } catch (err) {
            console.error('Property fetch error:', err);
            const status = err.response?.status;
            const message = status === 404
                ? `Le bien immobilier (ID: ${id}) n'a pas été trouvé.`
                : 'Impossible de charger le bien immobilier.';

            setError(message);

            // If client and 404, redirect after a short delay or allow them to see the error
            if (user?.role === 'CLIENT' && status === 404) {
                setTimeout(() => {
                    navigate('/dashboard/properties');
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPerfData = async () => {
        setLoadingPerf(true);
        try {
            const perfRes = await api.get(`/finance/transactions/dashboard-stats/?property=${id}`);

            // Stats specifically for this property
            const summary = perfRes.data.property_stats.find(p => p.id === parseInt(id));
            const recentTx = perfRes.data.recent_transactions; // Backend already filters by property

            setPerfData({
                ...perfRes.data,
                property_summary: {
                    ...perfRes.data.property_summary,
                    ...summary
                }
            });
        } catch (err) {
            console.error('Failed to fetch performance data', err);
        } finally {
            setLoadingPerf(false);
        }
    };

    useEffect(() => {
        if (id && id !== 'new') {
            fetchProperty();
        }
    }, [id]);

    useEffect(() => {
        if (property?.devise_origine && property.devise_origine !== 'EUR') {
            fetchCurrencyRate(property.devise_origine);
        }
    }, [property]);

    const handleDelete = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bien ? Tous les projets et chantiers associés seront également supprimés.')) {
            return;
        }

        try {
            await api.delete(`/properties/${id}/`);
            navigate('/dashboard/properties');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la suppression du bien.');
        }
    };

    const fetchOperations = async () => {
        setLoadingOps(true);
        try {
            const [ccRes, sRes] = await Promise.all([
                api.get(`/finance/cash-calls/?property=${id}`),
                api.get(`/finance/settlements/?property=${id}`)
            ]);
            setCashCalls(ccRes.data.results || []);
            setSettlements(sRes.data.results || []);
        } catch (err) {
            console.error('Failed to fetch operations', err);
        } finally {
            setLoadingOps(false);
        }
    };

    const fetchDocuments = async () => {
        setLoadingDocuments(true);
        try {
            const response = await api.get(`/documents/?property=${id}`);
            setDocuments(response.data.results || []);
        } catch (err) {
            console.error('Failed to fetch documents', err);
        } finally {
            setLoadingDocuments(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
        try {
            await api.delete(`/documents/${docId}/`);
            showToast({ message: 'Document supprimé avec succès', type: 'success' });
            fetchDocuments();
        } catch (err) {
            console.error('Failed to delete document', err);
            showToast({ message: 'Erreur lors de la suppression', type: 'error' });
        }
    };

    const handleDeleteSelectedDocuments = async () => {
        if (!window.confirm(`Voulez-vous supprimer les ${selectedDocuments.length} documents sélectionnés ?`)) return;
        try {
            await Promise.all(selectedDocuments.map(docId => api.delete(`/documents/${docId}/`)));
            showToast({ message: `${selectedDocuments.length} documents supprimés`, type: 'success' });
            setSelectedDocuments([]);
            setIsSelectionMode(false);
            fetchDocuments();
        } catch (err) {
            console.error('Failed to delete some documents', err);
            showToast({ message: 'Erreur lors de la suppression de certains documents', type: 'error' });
        }
    };

    const toggleDocumentSelection = (docId) => {
        setSelectedDocuments(prev =>
            prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
        );
    };

    const selectAllFiltered = () => {
        const allIds = filteredDocuments.map(d => d.id);
        setSelectedDocuments(allIds);
    };

    const updateOpStatus = async (type, opId, newStatus) => {
        if (newStatus === 'PAID' || newStatus === 'PENDING') {
            setProofOp({ type, opId, newStatus });
            setShowProofModal(true);
            return;
        }

        try {
            const endpoint = type === 'CASH_CALL' ? `/finance/cash-calls/${opId}/` : `/finance/settlements/${opId}/`;
            await api.patch(endpoint, { status: newStatus });
            fetchOperations();
            fetchPerfData();
            if (window.refreshWallet) window.refreshWallet();
        } catch (err) {
            console.error('Failed to update operation status', err);
            alert('Erreur lors de la mise à jour du statut.');
        }
    };

    const confirmOpWithProof = async (proofFile) => {
        if (!proofOp) return;
        const { type, opId, newStatus } = proofOp;
        const endpoint = type === 'CASH_CALL' ? `/finance/cash-calls/${opId}/` : `/finance/settlements/${opId}/`;

        try {
            const formData = new FormData();
            formData.append('status', newStatus);
            if (proofFile) {
                formData.append('proof', proofFile);
            }

            await api.patch(endpoint, formData, {
                headers: {
                    'Content-Type': undefined
                }
            });

            setShowProofModal(false);
            setProofOp(null);
            fetchOperations();
            fetchPerfData();
            if (window.refreshWallet) window.refreshWallet();
            showToast({ message: 'Opération confirmée avec succès', type: 'success' });
        } catch (err) {
            console.error('Failed to confirm operation with proof', err);
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de la confirmation.';
            showToast({ message: errorMsg, type: 'error' });
        }
    };

    useEffect(() => {
        if (activeTab === 'projects') {
            const fetchProjects = async () => {
                setLoadingProjects(true);
                try {
                    const response = await api.get(`/projects/?property=${id}`);
                    setAssociatedProjects(response.data.results || []);
                } catch (err) {
                    console.error('Failed to fetch associated projects', err);
                } finally {
                    setLoadingProjects(false);
                }
            };
            fetchProjects();
        }
        if (activeTab === 'transactions' && users.length === 0) {
            api.get('/users/').then(r => setUsers(r.data.results || [])).catch(() => { });
        }
        if (activeTab === 'performance') {
            fetchPerfData();
            fetchOperations();
        }
        if (activeTab === 'documents') {
            fetchDocuments();
        }
    }, [id, activeTab]);

    const createTransaction = async () => {
        setTxLoading(true);
        try {
            const payload = { property: id, status: 'DISPONIBLE' };
            if (txForm.buyer_tenant) payload.buyer_tenant = txForm.buyer_tenant;
            if (txForm.asking_price) payload.asking_price = txForm.asking_price;
            if (txForm.notes) payload.notes = txForm.notes;
            await api.post('/transactions/', payload);
            setShowTxModal(false);
            setTxForm({ buyer_tenant: '', asking_price: '', notes: '' });
            fetchProperty(); // Refresh to get updated transactions
        } catch (err) {
            console.error('Error creating transaction', err);
            if (err.response?.data) {
                // Handle dict of errors (Django Rest Framework style)
                const errorData = err.response.data;
                const messages = Object.values(errorData).flat().join('\n');
                alert(messages || 'Erreur lors de la création de la transaction.');
            } else {
                alert('Erreur lors de la création de la transaction.');
            }
        } finally {
            setTxLoading(false);
        }
    };

    const updateTxStatus = async (txId, newStatus) => {
        if (newStatus === 'SIGNE') {
            const tx = property.transactions.find(t => t.id === txId);
            setFinalPriceTxId(txId);
            setFinalPriceValue(tx?.asking_price || '');
            setStatusDropdown(null);
            setShowFinalPriceModal(true);
            return;
        }

        try {
            await api.patch(`/transactions/${txId}/`, { status: newStatus });
            setStatusDropdown(null);
            fetchProperty();
        } catch (err) {
            console.error('Error updating transaction status', err);
        }
    };

    const confirmFinalPrice = async () => {
        if (!finalPriceTxId) return;
        try {
            await api.patch(`/transactions/${finalPriceTxId}/`, {
                status: 'SIGNE',
                final_price: finalPriceValue
            });
            setShowFinalPriceModal(false);
            fetchProperty();
        } catch (err) {
            console.error('Error confirming final price', err);
        }
    };
    const deleteTx = async (txId) => {
        if (!window.confirm('Supprimer cette transaction ?')) return;
        try {
            await api.delete(`/transactions/${txId}/`);
            fetchProperty();
        } catch (err) {
            console.error('Error deleting transaction', err);
        }
    };
    const filteredDocuments = documents.filter(doc =>
        documentFilter === 'all' || doc.category === documentFilter
    );

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="space-y-4">
                <Link to="/dashboard/properties" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux biens
                </Link>
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                    {error || "Bien non trouvé."}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 md:space-y-12 animate-fade-in pb-40 px-4 md:px-8 py-8">
            <Link to="/dashboard/properties" className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all group w-fit">
                <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                Retour au Portfolio
            </Link>

            {/* Header / Hero Section */}
            <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden solaris-glass border-none shadow-2xl">
                {/* Image Gallery High-End */}
                {property.images && property.images.length > 0 && (
                    <div className="relative aspect-square md:aspect-[21/9] bg-slate-900 overflow-hidden">
                        <img
                            src={property.images[activeImageIndex].image}
                            alt={property.name}
                            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 opacity-90"
                        />

                        {/* Elegant Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {property.images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)}
                                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/10 text-white backdrop-blur-xl hover:bg-white/20 transition-all border border-white/10"
                                >
                                    <ChevronLeft className="h-5 w-5 md:h-6 w-6" />
                                </button>
                                <button
                                    onClick={() => setActiveImageIndex((prev) => (prev + 1) % property.images.length)}
                                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/10 text-white backdrop-blur-xl hover:bg-white/20 transition-all border border-white/10"
                                >
                                    <ChevronRight className="h-5 w-5 md:h-6 w-6" />
                                </button>

                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                                    {property.images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={cn(
                                                "h-1.5 rounded-full transition-all duration-500",
                                                idx === activeImageIndex ? "bg-white w-12 shadow-lg" : "bg-white/30 w-3 hover:bg-white/50"
                                            )}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Property Brand Info Overlay */}
                        <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4 pointer-events-none">
                                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                    <span className={cn(
                                        "px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest backdrop-blur-md border",
                                        property.category === 'RESIDENTIEL' ? "bg-white/90 text-black border-white" :
                                            property.category === 'COMMERCIAL' ? "bg-amber-400/90 text-black border-amber-300" : "bg-blue-400/90 text-black border-blue-300"
                                    )}>
                                        {property.category_display}
                                    </span>
                                    <span className="px-3 md:px-5 py-1.5 md:py-2 rounded-full bg-black/60 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20">
                                        {property.management_type === 'CONSTRUCTION' ? "Projet Chantier" : property.transaction_nature_display}
                                    </span>
                                    <span className={cn(
                                        "px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest backdrop-blur-md border",
                                        property.status === 'DISPONIBLE' ? "bg-emerald-400/90 text-black border-emerald-300" :
                                            property.status === 'VENDU' ? "bg-black text-white border-white/20" : "bg-amber-400/90 text-black border-amber-300"
                                    )}>
                                        {property.status_display}
                                    </span>
                                    {property.is_foncier_verified && (
                                        <span className="px-3 md:px-5 py-1.5 md:py-2 rounded-full bg-white/90 text-emerald-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white flex items-center gap-2">
                                            <ShieldCheck className="h-3 w-3" />
                                            Vérifié
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-2xl leading-none">
                                    {property.name}
                                </h1>
                                <div className="flex items-center gap-2 md:gap-3 text-white/80 font-bold uppercase tracking-widest text-[9px] md:text-[11px]">
                                    <MapPin className="h-3.5 w-3.5 md:h-4 w-4 text-primary" />
                                    {property.address}, {property.city}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={handleDelete}
                                            className="h-10 md:h-12 px-5 md:px-8 bg-white/10 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest backdrop-blur-xl border border-white/10 hover:bg-rose-500 hover:border-rose-400 transition-all flex items-center gap-2 md:gap-3"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 md:h-4 w-4" />
                                            <span className="hidden sm:inline">Supprimer</span>
                                        </button>
                                        <Link
                                            to={`/dashboard/properties/${id}/edit`}
                                            className="h-10 md:h-12 px-6 md:px-10 bg-white text-black rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-100 transition-all flex items-center gap-2 md:gap-3"
                                        >
                                            <Edit className="h-3.5 w-3.5 md:h-4 w-4" />
                                            Modifier
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {property.transaction_nature === 'LOCATION' && property.status !== 'VENDU' && (property.loyer_mensuel || property.prix_nuitee) && (
                    <div className="px-6 md:px-10 pb-8 md:pb-10 flex flex-wrap items-center gap-6 md:gap-10">
                        {property.loyer_mensuel && (
                            <div className="flex flex-col gap-0.5 md:gap-1">
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Loyer mensuel</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl md:text-3xl font-bold tracking-tight">{formatCurrency(property.loyer_mensuel, true)}</span>
                                </div>
                            </div>
                        )}
                        {property.prix_nuitee && (
                            <div className="flex flex-col gap-0.5 md:gap-1">
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Nuitée</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl md:text-3xl font-bold tracking-tight">{formatCurrency(property.prix_nuitee, true)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sub-Navigation Tabs — scrollable */}
            <div
                style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="w-full border-b border-slate-100 pb-0 [&::-webkit-scrollbar]:hidden"
            >
                <div style={{ display: 'flex', gap: '24px', width: 'max-content', paddingLeft: '4px', paddingRight: '4px' }}>
                    {[
                        { id: 'details', label: 'Détails Principaux', icon: Building, show: true },
                        { id: 'projects', label: property.management_type === 'GESTION' ? 'Entretien & Maintenance' : 'Projets', icon: HardHat, show: property.management_type === 'CONSTRUCTION' || property.management_type === 'GESTION' },
                        { id: 'transactions', label: 'Pipeline Commercial', icon: TrendingUp, show: property.management_type === 'MANDAT' },
                        { id: 'performance', label: 'Performance & Finance', icon: Activity, show: true },
                        { id: 'documents', label: 'Documents & Archive', icon: FileText, show: true }
                    ].filter(t => t.show).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 pb-6 border-b-2 transition-all group relative",
                                activeTab === tab.id
                                    ? "border-black text-black"
                                    : "border-transparent text-muted-foreground hover:text-black"
                            )}
                        >
                            <tab.icon className={cn("h-4 w-4 shrink-0", activeTab === tab.id ? "text-primary" : "text-muted-foreground opacity-40 group-hover:opacity-100")} />
                            <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-black animate-in fade-in slide-in-from-bottom-1" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Currency Context for International Investors */}
            {
                property.devise_origine !== 'EUR' && (
                    <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground -mt-4 italic">
                        <Globe className="h-3 w-3" />
                        Affichage principal en Euro (€). Conversion {property.devise_origine} à titre indicatif.
                    </div>
                )
            }

            {/* Tab Content */}
            <div className="mt-2">
                {activeTab === 'details' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid gap-8 lg:grid-cols-2">
                            <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl">
                                <h3 className="font-black text-lg md:text-xl mb-6 md:mb-8 flex items-center gap-4 tracking-tighter uppercase">
                                    <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                        <Building className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    Informations Générales
                                </h3>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 md:gap-y-8 text-sm">
                                    <div className="space-y-1">
                                        <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Type de bien</dt>
                                        <dd className="font-black text-base md:text-lg tracking-tight">{property.property_type_display || property.property_type}</dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Surface Totale</dt>
                                        <dd className="font-black text-base md:text-lg tracking-tight flex items-center gap-2">
                                            <Ruler className="h-3.5 w-3.5 md:h-4 w-4 text-primary" />
                                            {property.surface ? `${property.surface} m²` : 'N/A'}
                                        </dd>
                                    </div>
                                    {property.category === 'RESIDENTIEL' && (
                                        <>
                                            <div className="space-y-1">
                                                <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Nombre de pièces</dt>
                                                <dd className="font-black text-base md:text-lg tracking-tight">{property.room_count || 'N/A'}</dd>
                                            </div>
                                            <div className="space-y-1">
                                                <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Nombre de chambres</dt>
                                                <dd className="font-black text-base md:text-lg tracking-tight">{property.bedroom_count || 'N/A'}</dd>
                                            </div>
                                        </>
                                    )}
                                    <div className="space-y-1">
                                        <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Statut Actuel</dt>
                                        <dd className="mt-1.5 md:mt-2">
                                            <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-black text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                                                <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-primary animate-pulse" />
                                                {property.status_display || property.status}
                                            </span>
                                        </dd>
                                    </div>
                                    {property.prix_acquisition && (
                                        <div className="space-y-1">
                                            <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary">Investissement Initial</dt>
                                            <dd className="font-black text-xl md:text-2xl tracking-tighter text-primary">
                                                {formatCurrency(Number(property.prix_acquisition) + Number(property.frais_acquisition_annexes || 0), true)}
                                            </dd>
                                        </div>
                                    )}
                                    <div className="sm:col-span-2 space-y-2 md:space-y-3">
                                        <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Détenteur de l'Actif</dt>
                                        <dd className="font-black">
                                            {property.owner ? (
                                                <div className="flex items-center gap-2.5 md:gap-3 p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-white/50 border border-slate-100 w-fit">
                                                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg md:rounded-xl bg-black flex items-center justify-center text-[9px] md:text-[11px] text-white font-black uppercase">
                                                        {property.owner_name?.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <span className="text-xs md:text-sm tracking-tight">{property.owner_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-emerald-500 font-black uppercase tracking-widest text-[9px] md:text-[11px] italic">Actif Disponible (Mandat)</span>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl">
                                <h3 className="font-black text-lg md:text-xl mb-6 md:mb-8 flex items-center gap-4 tracking-tighter uppercase">
                                    <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                        <FileText className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    Notes & Description
                                </h3>
                                <p className="text-[12px] md:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
                                    {property.description || "Aucune description détaillée n'a été fournie pour ce bien d'exception."}
                                </p>
                            </div>
                        </div>

                        {/* Specific Details Based on Property Type Solaris Style */}
                        <div className="grid gap-8 lg:grid-cols-2">
                            {property.management_type === 'MANDAT' && (
                                <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl">
                                    <h3 className="font-black text-lg md:text-xl mb-6 md:mb-8 flex items-center gap-4 tracking-tighter uppercase">
                                        <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                            <Euro className="h-4 w-4 md:h-5 md:w-5" />
                                        </div>
                                        Structure de la Vente
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end pb-4 border-b border-slate-100">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Prix de mise en vente</span>
                                            <span className="text-xl md:text-2xl font-black tracking-tighter">{formatCurrency(property.prix_acquisition, true)}</span>
                                        </div>
                                        <div className="flex justify-between items-end pb-4 border-b border-slate-100">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Honoraires & Frais annexes</span>
                                            <span className="text-base md:text-lg font-black text-muted-foreground tracking-tight">+{formatCurrency(property.frais_acquisition_annexes, true)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 pt-2">
                                            <div className={cn("p-1.5 md:p-2 rounded-lg md:rounded-xl", property.negociable ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-slate-100 text-slate-400")}>
                                                <Check className="h-3.5 w-3.5 md:h-4 w-4" />
                                            </div>
                                            <span className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest", property.negociable ? "text-emerald-600" : "text-slate-400 opacity-60")}>Opportunité Négociable</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {property.management_type === 'GESTION' && (
                                <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl">
                                    <h3 className="font-black text-lg md:text-xl mb-6 md:mb-8 flex items-center gap-4 tracking-tighter uppercase">
                                        <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                            <Home className="h-4 w-4 md:h-5 md:w-5" />
                                        </div>
                                        Conditions Locatives
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end pb-4 border-b border-slate-100">
                                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Loyer Principal</span>
                                            <span className="text-2xl md:text-3xl font-bold text-primary tracking-tight">{formatCurrency(property.loyer_mensuel, true)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 md:gap-10">
                                            <div className="space-y-1">
                                                <dt className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Charges Mensuelles</dt>
                                                <dd className="font-bold text-base md:text-lg tracking-tight">{formatCurrency(property.charges_mensuelles, true)}</dd>
                                            </div>
                                            <div className="space-y-1">
                                                <dt className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Dépôt de Garantie</dt>
                                                <dd className="font-bold text-base md:text-lg tracking-tight">{formatCurrency(property.depot_garantie, true)}</dd>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {property.management_type === 'CONSTRUCTION' && (
                                <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl">
                                    <h3 className="font-black text-lg md:text-xl mb-6 md:mb-8 flex items-center gap-4 tracking-tighter uppercase">
                                        <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                            <Wrench className="h-4 w-4 md:h-5 md:w-5" />
                                        </div>
                                        Paramètres du Chantier
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-1 pb-4 border-b border-slate-100">
                                            <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Enveloppe Budgétaire Globale</dt>
                                            <dd className="font-black text-2xl md:text-4xl tracking-tighter text-black">{formatCurrency(property.budget_total, true)}</dd>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Wallet / Regie Section - ONLY for Rentals or Admin tracking expenses. For construction, we might hide the explanatory block if requested. */}
                        {((property.management_type === 'GESTION') ||
                            (user?.role === 'ADMIN_MADIS' && property.transaction_nature !== 'VENTE')) && (
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="md:col-span-1">
                                        <WalletCard
                                            propertyId={id}
                                            onCashCall={() => setShowCashCallModal(true)}
                                            onSettlement={() => setShowSettlementModal(true)}
                                        />
                                    </div>
                                    <div className="md:col-span-2 bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                            <ShieldCheck className="h-32 w-32 rotate-12" />
                                        </div>
                                        <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                            À propos de la Gestion Mandat
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                                            Ce solde représente les fonds actuellement détenus par MaDis pour la gestion de votre bien.
                                            Il est alimenté par vos <strong>Appels de fonds</strong> et les <strong>loyers perçus</strong>,
                                            et débité lors des <strong>dépenses de maintenance</strong> ou de vos <strong>reversements</strong>.
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-4 relative z-10">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                                                <div className="h-1 w-1 rounded-full bg-emerald-600" />
                                                Mandat Certifié MaDis
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-primary bg-primary/5 px-2 py-1 rounded">
                                                <div className="h-1 w-1 rounded-full bg-primary" />
                                                Flux Financiers Sécurisés
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {(property.management_type === 'CONSTRUCTION' && user?.role !== 'ADMIN_MADIS') && (
                            <div className="grid gap-6 md:grid-cols-1">
                                <WalletCard
                                    propertyId={id}
                                    onCashCall={() => setShowCashCallModal(true)}
                                    onSettlement={() => setShowSettlementModal(true)}
                                />
                            </div>
                        )}

                        {loadingPerf ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (!perfData || !perfData.property_summary) && property.transaction_nature !== 'VENTE' ? (
                            <div className="bg-card border border-dashed rounded-xl p-12 text-center">
                                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Pas encore de données de performance</h3>
                                <p className="text-muted-foreground text-sm">Veuillez enregistrer des revenus ou des dépenses pour voir l'analyse.</p>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-fade-in">
                                {/* Stats Cards Solaris Style */}
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    {(() => {
                                        const isSale = property.transaction_nature === 'VENTE' || property.status === 'VENDU';

                                        if (property.management_type === 'CONSTRUCTION') {
                                            const budget = Number(property.budget_total || 0);
                                            const spent = Math.abs(Number(perfData?.property_summary?.total_outflow || 0));
                                            const remaining = Math.max(0, budget - spent);
                                            const progress = budget > 0 ? (spent / budget) * 100 : 0;

                                            return (
                                                <>
                                                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Budget Travaux</span>
                                                            <div className="p-2 rounded-xl bg-black text-white"><Wrench className="h-4 w-4" /></div>
                                                        </div>
                                                        <div className="text-2xl md:text-3xl font-black tracking-tighter">{budget.toLocaleString()}€</div>
                                                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Enveloppe Prévisionnelle</p>
                                                    </div>
                                                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Déjà Consommé</span>
                                                            <div className="p-2 rounded-xl bg-rose-500 text-white"><TrendingDown className="h-4 w-4" /></div>
                                                        </div>
                                                        <div className="text-2xl md:text-3xl font-black tracking-tighter text-rose-500">{spent.toLocaleString()}€</div>
                                                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">{progress.toFixed(1)}% Consommé</p>
                                                    </div>
                                                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Reste à Engager</span>
                                                            <div className="p-2 rounded-xl bg-emerald-500 text-white"><Euro className="h-4 w-4" /></div>
                                                        </div>
                                                        <div className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-500">{remaining.toLocaleString()}€</div>
                                                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Solde Disponible</p>
                                                    </div>
                                                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Progression</span>
                                                            <div className="p-2 rounded-xl bg-blue-500 text-white"><Activity className="h-4 w-4" /></div>
                                                        </div>
                                                        <div className="text-2xl md:text-3xl font-black tracking-tighter text-blue-600">{progress.toFixed(0)}%</div>
                                                        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mt-3">
                                                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(100, progress)}%` }} />
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        } else if (isSale) {
                                            const signedTx = property.transactions?.find(t => t.status === 'SIGNE');
                                            const price = signedTx ? Number(signedTx.final_price) : Number(property.prix_vente);
                                            const acqPrice = Number(property.prix_acquisition || 0);
                                            const costs = Number(property.frais_acquisition_annexes || 0);
                                            const totalInvest = acqPrice + costs;

                                            let commissionAmount = 0;
                                            if (property.commission_type === 'POURCENTAGE' && property.commission_rate) {
                                                commissionAmount = (price * Number(property.commission_rate)) / 100;
                                            } else if (property.commission_type === 'FIXE' && property.commission_fixe) {
                                                commissionAmount = Number(property.commission_fixe);
                                            }

                                            const isBuyerOfThisSignedSale = signedTx && Number(signedTx.buyer_tenant) === Number(user?.id);
                                            const effectiveCommission = isBuyerOfThisSignedSale ? 0 : commissionAmount;
                                            const grossPlusValue = price - totalInvest;

                                            const netPlusValue = perfData?.property_summary?.net !== undefined && perfData.property_summary.net !== 0
                                                ? perfData.property_summary.net
                                                : (totalInvest > 0 ? (grossPlusValue - effectiveCommission) : null);

                                            const roi = perfData?.property_summary?.roi !== undefined && perfData.property_summary.roi !== 0
                                                ? perfData.property_summary.roi
                                                : (totalInvest > 0 ? (netPlusValue / totalInvest) * 100 : null);

                                            const isPlusValueNegative = netPlusValue < 0;
                                            const isRoiNegative = roi < 0;

                                            return (
                                                <>
                                                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-xl lg:col-span-2">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                                                Plus-value nette {signedTx ? '(Réelle)' : '(Estimée)'}
                                                            </span>
                                                            <div className={cn("p-2 rounded-xl text-white shadow-lg", isPlusValueNegative ? "bg-rose-500" : "bg-emerald-500")}>
                                                                <TrendingUp className="h-4 w-4" />
                                                            </div>
                                                        </div>
                                                        <div className={cn("text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none", isPlusValueNegative ? "text-rose-600" : "text-emerald-500")}>
                                                            {netPlusValue !== null ? `${netPlusValue.toLocaleString()}€` : 'N/A'}
                                                        </div>
                                                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-3 font-bold uppercase tracking-widest max-w-[200px]">
                                                            Position nette après achat, frais et commissions
                                                        </p>
                                                    </div>
                                                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-xl lg:col-span-2">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                                                ROI de l'Actif {signedTx ? '(Net)' : '(Estimé)'}
                                                            </span>
                                                            <div className={cn("p-2 rounded-xl text-white shadow-lg", isRoiNegative ? "bg-rose-500" : "bg-emerald-500")}>
                                                                <Percent className="h-4 w-4" />
                                                            </div>
                                                        </div>
                                                        <div className={cn("text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none", isRoiNegative ? "text-rose-600" : "text-emerald-500")}>
                                                            {roi !== null ? `${roi.toFixed(1)}%` : 'N/A'}
                                                        </div>
                                                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-3 font-bold uppercase tracking-widest max-w-[200px]">
                                                            Rendement sur l'ensemble des fonds investis
                                                        </p>
                                                    </div>
                                                </>
                                            );
                                        } else {
                                            return (
                                                <>
                                                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Rendement Annuel</span>
                                                            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200"><TrendingUp className="h-4 w-4" /></div>
                                                        </div>
                                                        <div className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-600">{perfData?.property_summary?.theoretical_yield || 0}%</div>
                                                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Objectif Cible</p>
                                                    </div>
                                                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Rendement Réel</span>
                                                            <div className="p-2 rounded-xl bg-black text-white shadow-lg"><Activity className="h-4 w-4" /></div>
                                                        </div>
                                                        <div className="text-2xl md:text-3xl font-black tracking-tighter">{perfData?.property_summary?.yield || 0}%</div>
                                                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Performance 12m</p>
                                                    </div>
                                                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Cashflow Net</span>
                                                            <div className={cn("p-2 rounded-xl text-white shadow-lg", (perfData?.property_summary?.net || 0) >= 0 ? "bg-emerald-500" : "bg-rose-500")}><Euro className="h-4 w-4" /></div>
                                                        </div>
                                                        <div className={cn("text-2xl md:text-3xl font-black tracking-tighter", (perfData?.property_summary?.net || 0) >= 0 ? "text-emerald-500" : "text-rose-600")}>
                                                            {(perfData?.property_summary?.net || 0).toLocaleString()}€
                                                        </div>
                                                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Solde Encaissé</p>
                                                    </div>
                                                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Encaïssement</span>
                                                            <div className="p-2 rounded-xl bg-blue-500 text-white shadow-lg"><Activity className="h-4 w-4" /></div>
                                                        </div>
                                                        <div className={cn(
                                                            "text-2xl md:text-3xl font-black tracking-tighter",
                                                            (perfData.property_summary?.collection_rate || 0) >= 90 ? "text-emerald-500" :
                                                                (perfData.property_summary?.collection_rate || 0) >= 50 ? "text-orange-500" : "text-rose-600"
                                                        )}>
                                                            {perfData.property_summary?.collection_rate !== null && perfData.property_summary?.collection_rate !== undefined ? `${perfData.property_summary.collection_rate}%` : 'N/A'}
                                                        </div>
                                                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Loyer Collecté</p>
                                                    </div>
                                                </>
                                            );
                                        }
                                    })()}
                                </div>

                                {
                                    (property.management_type === 'CONSTRUCTION' || (property.transaction_nature !== 'VENTE' && property.status !== 'VENDU')) && (
                                        <div className="grid gap-8 lg:grid-cols-3">
                                            {/* Evolution Chart Solaris Style */}
                                            <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl lg:col-span-2">
                                                <h3 className="font-black text-lg md:text-xl mb-6 md:mb-10 flex items-center gap-4 tracking-tighter uppercase">
                                                    <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                                        <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                                                    </div>
                                                    Évolution des Flux
                                                </h3>
                                                <div className="h-[250px] md:h-[300px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        {perfData?.monthly_data ? (
                                                            <AreaChart data={perfData.monthly_data}>
                                                                <defs>
                                                                    <linearGradient id="colorRevPerf" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" strokeOpacity={0.05} />
                                                                <XAxis
                                                                    dataKey="month"
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                                                    tickFormatter={str => {
                                                                        const [y, m] = str.split('-');
                                                                        return new Date(y, m - 1).toLocaleString('fr-FR', { month: 'short' }).toUpperCase();
                                                                    }}
                                                                />
                                                                <YAxis
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                                                    tickFormatter={v => `${v}€`}
                                                                    domain={[0, dataMax => Math.max(dataMax, (perfData?.expected_monthly_rent || 0) * 1.2)]}
                                                                />
                                                                <Tooltip
                                                                    content={({ active, payload }) => {
                                                                        if (active && payload && payload.length) {
                                                                            const d = payload[0].payload;
                                                                            const dateObj = new Date(d.month.split('-')[0], d.month.split('-')[1] - 1);
                                                                            return (
                                                                                <div className="solaris-glass rounded-3xl shadow-2xl p-6 text-[11px] space-y-3 min-w-[200px] border-none backdrop-blur-xl">
                                                                                    <p className="font-black border-b border-black/5 pb-2 mb-2 uppercase tracking-widest text-muted-foreground opacity-60">
                                                                                        {dateObj.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                                                                                    </p>
                                                                                    {property.management_type === 'CONSTRUCTION' ? (
                                                                                        <div className="flex justify-between items-center gap-4">
                                                                                            <span className="font-black uppercase tracking-widest opacity-60">Dépenses</span>
                                                                                            <span className="font-black text-rose-500 text-lg tracking-tighter">{d.expenses.toLocaleString()}€</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <div className="flex justify-between items-center gap-4">
                                                                                                <span className="font-black uppercase tracking-widest opacity-60 text-emerald-600">Revenus</span>
                                                                                                <span className="font-black text-emerald-600 text-lg tracking-tighter">{d.revenues.toLocaleString()}€</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between items-center gap-4">
                                                                                                <span className="font-black uppercase tracking-widest opacity-40">Loyers</span>
                                                                                                <span className="font-black text-black/40 text-sm tracking-tight">{d.actual_rent.toLocaleString()}€</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between items-center gap-4 border-t border-black/5 pt-3 mt-1 underline-offset-4 decoration-2">
                                                                                                <span className="font-black uppercase tracking-widest opacity-60">Taux</span>
                                                                                                <span className={cn(
                                                                                                    "font-black text-lg tracking-tighter",
                                                                                                    d.collection_rate >= 90 ? "text-emerald-500" : d.collection_rate >= 50 ? "text-orange-500" : "text-rose-600"
                                                                                                )}>
                                                                                                    {d.collection_rate}%
                                                                                                </span>
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    }}
                                                                />
                                                                {perfData?.expected_monthly_rent > 0 && (
                                                                    <ReferenceLine
                                                                        y={perfData.expected_monthly_rent}
                                                                        label={{ position: 'top', value: `OBJC : ${perfData.expected_monthly_rent}€`, fontSize: 9, fill: '#000000', fontWeight: 900, tracking: '0.1em' }}
                                                                        stroke="#000000"
                                                                        strokeDasharray="5 5"
                                                                        strokeOpacity={0.2}
                                                                    />
                                                                )}
                                                                {property.management_type === 'CONSTRUCTION' ? (
                                                                    <Area type="monotone" dataKey="expenses" stroke="#ff0048" strokeWidth={4} fillOpacity={0.1} fill="#ff0048" name="Dépenses" />
                                                                ) : (
                                                                    <>
                                                                        <Area type="monotone" dataKey="revenues" stroke="#10B981" strokeWidth={4} fill="url(#colorRevPerf)" name="Total Revenus" />
                                                                        <Area type="monotone" dataKey="actual_rent" stroke="#3b82f6" strokeWidth={2} fill="transparent" strokeDasharray="5 5" name="Loyers Reçus" />
                                                                        <Area type="monotone" dataKey="expenses" stroke="#ff0048" strokeWidth={2} fill="transparent" name="Dépenses" />
                                                                    </>
                                                                )}
                                                            </AreaChart>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10 opacity-40">
                                                                <TrendingUp className="h-12 w-12 mb-4" />
                                                                <p className="text-[10px] font-black uppercase tracking-widest">Initialisation des données...</p>
                                                            </div>
                                                        )}
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Distribution Solaris Style */}
                                            <div className="solaris-glass rounded-[2.5rem] p-10 border-none shadow-xl">
                                                <h3 className="font-black text-xl mb-10 flex items-center gap-4 tracking-tighter uppercase">
                                                    <div className="p-3 rounded-2xl bg-black text-white shadow-lg">
                                                        <Activity className="h-5 w-5" />
                                                    </div>
                                                    Répartition
                                                </h3>
                                                <div className="space-y-8">
                                                    {perfData?.category_stats?.map((cat) => (
                                                        <div key={cat.category} className="space-y-3">
                                                            <div className="flex justify-between items-end">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{cat.label || cat.category}</span>
                                                                <span className="font-black tracking-tighter">{Number(cat.total).toLocaleString()}€</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn("h-full transition-all duration-1000", property.management_type === 'CONSTRUCTION' ? "bg-rose-500" : "bg-black")}
                                                                    style={{ width: `${Math.min(100, (cat.total / (Math.abs(property.management_type === 'CONSTRUCTION' ? perfData?.total_outflow : perfData?.total_inflow) || 1)) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!perfData || !perfData.category_stats || perfData.category_stats.length === 0) && (
                                                        <p className="text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest py-20 opacity-40">Aucune donnée disponible</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }

                                {/* Operations Table Solaris Style */}
                                {
                                    (user?.role === 'ADMIN_MADIS' || cashCalls.length > 0 || settlements.length > 0) && (
                                        <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-none shadow-xl">
                                            <div className="p-6 md:p-10 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/30 backdrop-blur-md">
                                                <div className="space-y-1">
                                                    <h3 className="font-black text-lg md:text-xl flex items-center gap-4 tracking-tighter uppercase">
                                                        <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                                            <History className="h-4 w-4 md:h-5 md:w-5" />
                                                        </div>
                                                        {property.transaction_nature === 'VENTE' ? "Opérations Financières" : "Opérations de Régie"}
                                                    </h3>
                                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-0 md:ml-14">Appels de fonds & Reversements en cours</p>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-black text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest w-fit">
                                                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-primary animate-pulse" />
                                                    Traitement en cours
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-black text-[10px] font-black uppercase tracking-widest text-white/60">
                                                            <th className="px-10 py-5 text-left font-black">Type de Flux</th>
                                                            <th className="px-10 py-5 text-left font-black">Libellé / Période</th>
                                                            <th className="px-10 py-5 text-left font-black text-white">Montant (EUR)</th>
                                                            <th className="px-10 py-5 text-left font-black">Status</th>
                                                            <th className="px-10 py-5 text-right font-black">Intervention</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-black/5">
                                                        {cashCalls.filter(cc => cc.status !== 'PAID' && cc.status !== 'CANCELLED').map((cc) => (
                                                            <tr key={`cc-${cc.id}`} className="hover:bg-white/50 transition-colors group">
                                                                <td className="px-10 py-8">
                                                                    <span className="font-black text-[11px] uppercase tracking-widest text-emerald-600 block px-4 py-1.5 rounded-full bg-emerald-50 w-fit">Appel de Fonds</span>
                                                                </td>
                                                                <td className="px-10 py-8">
                                                                    <div className="font-black text-sm tracking-tight">{cc.reason}</div>
                                                                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 opacity-40">Référence #{cc.id.toString().padStart(6, '0')}</div>
                                                                </td>
                                                                <td className="px-10 py-8 font-black text-xl tracking-tighter">{Number(cc.amount).toLocaleString('fr-FR')} €</td>
                                                                <td className="px-10 py-8">
                                                                    <span className={cn(
                                                                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                                        cc.status === 'SENT' ? "bg-blue-500 text-white" :
                                                                            cc.status === 'PENDING' ? "bg-amber-500 text-white" :
                                                                                cc.status === 'REJECTED' ? "bg-rose-500 text-white" :
                                                                                    "bg-black text-white"
                                                                    )}>
                                                                        <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                                                        {cc.status_display || cc.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-10 py-8 text-right">
                                                                    <div className="flex justify-end gap-3 translate-x-2 opacity-80 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                                        {(cc.status === 'SENT' || cc.status === 'REJECTED') && !isAdmin && (
                                                                            <button
                                                                                onClick={() => updateOpStatus('CASH_CALL', cc.id, 'PENDING')}
                                                                                className="px-6 py-2.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                                                                            >
                                                                                {cc.status === 'REJECTED' ? 'Renvoyer Justificatif' : 'Initier Paiement'}
                                                                            </button>
                                                                        )}
                                                                        {cc.status === 'PENDING' && isAdmin && (
                                                                            <div className="flex items-center gap-3">
                                                                                {cc.proof && (
                                                                                    <a
                                                                                        href={cc.proof}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="p-3 bg-black/5 text-black rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm"
                                                                                        title="Voir Justificatif"
                                                                                    >
                                                                                        <FileText className="h-4 w-4" />
                                                                                    </a>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => updateOpStatus('CASH_CALL', cc.id, 'PAID')}
                                                                                    className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                                                                                    title="Valider"
                                                                                >
                                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        if (window.confirm('Voulez-vous rejeter ce justificatif ?')) {
                                                                                            updateOpStatus('CASH_CALL', cc.id, 'REJECTED');
                                                                                        }
                                                                                    }}
                                                                                    className="p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
                                                                                    title="Rejeter"
                                                                                >
                                                                                    <XCircle className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {settlements.filter(s => s.status !== 'PAID' && s.status !== 'CANCELLED').map((s) => (
                                                            <tr key={`s-${s.id}`} className="hover:bg-white/50 transition-colors group">
                                                                <td className="px-10 py-8">
                                                                    <span className="font-black text-[11px] uppercase tracking-widest text-rose-500 block px-4 py-1.5 rounded-full bg-rose-50 w-fit">Reversement Client</span>
                                                                </td>
                                                                <td className="px-10 py-8">
                                                                    <div className="font-black text-sm tracking-tight">Période du {format(new Date(s.period_start), 'dd/MM/yy')} au {format(new Date(s.period_end), 'dd/MM/yy')}</div>
                                                                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 opacity-40">REGLEMENT SOLDE</div>
                                                                </td>
                                                                <td className="px-10 py-8 font-black text-xl tracking-tighter text-rose-600">{Number(s.amount).toLocaleString('fr-FR')} €</td>
                                                                <td className="px-10 py-8">
                                                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest">
                                                                        <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                                                        {s.status_display || s.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-10 py-8 text-right">
                                                                    <button
                                                                        onClick={() => updateOpStatus('SETTLEMENT', s.id, 'PAID')}
                                                                        className="px-6 py-2.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg opacity-80 group-hover:opacity-100"
                                                                    >
                                                                        Valider le Virement
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {loadingOps && (
                                                            <tr>
                                                                <td colSpan={5} className="text-center py-20">
                                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-black" />
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                }

                                {/* Financial Flows Solaris Style */}
                                <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-none shadow-xl mt-8">
                                    <div className="p-6 md:p-10 border-b border-black/5 bg-white/30 backdrop-blur-md">
                                        <div className="space-y-1">
                                            <h3 className="font-black text-lg md:text-xl flex items-center gap-4 tracking-tighter uppercase">
                                                <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                                    <Activity className="h-4 w-4 md:h-5 md:w-5" />
                                                </div>
                                                Historique des Flux Financiers
                                            </h3>
                                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-0 md:ml-14">Dernières transactions validées sur ce bien</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-black text-[10px] font-black uppercase tracking-widest text-white/60">
                                                    <th className="px-10 py-5 text-left font-black">Type</th>
                                                    <th className="px-10 py-5 text-left font-black">Catégorie Analytique</th>
                                                    <th className="px-10 py-5 text-left font-black text-white">Montant net</th>
                                                    <th className="px-10 py-5 text-left font-black">Période / Cycle</th>
                                                    <th className="px-10 py-5 text-right font-black">Date Valeur</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black/5">
                                                {perfData?.recent_transactions?.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-white/50 transition-colors group">
                                                        <td className="px-10 py-6">
                                                            <span className={cn(
                                                                "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                                tx.type === 'INFLOW' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                            )}>
                                                                {tx.type === 'INFLOW' ? 'Revenu' : 'Dépense'}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-6 font-black text-sm tracking-tight">{tx.category}</td>
                                                        <td className={cn(
                                                            "px-10 py-6 font-black text-lg tracking-tighter",
                                                            tx.type === 'INFLOW' ? "text-emerald-500" : "text-rose-500"
                                                        )}>
                                                            {tx.type === 'INFLOW' ? '+' : '-'}{Number(tx.amount).toLocaleString('fr-FR')} €
                                                        </td>
                                                        <td className="px-10 py-6 font-black text-[11px] uppercase tracking-widest text-muted-foreground opacity-60">
                                                            {tx.period_month && tx.period_year ? (
                                                                `${new Date(2000, tx.period_month - 1).toLocaleString('fr-FR', { month: 'long' }).toUpperCase()} ${tx.period_year}`
                                                            ) : (
                                                                'REGULARISATION'
                                                            )}
                                                        </td>
                                                        <td className="px-10 py-6 text-right font-black text-xs tracking-tight">
                                                            {format(new Date(tx.date), 'dd MMM yyyy', { locale: fr }).toUpperCase()}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!perfData || !perfData.recent_transactions || perfData.recent_transactions.length === 0) && (
                                                    <tr>
                                                        <td colSpan={5} className="px-10 py-20 text-center opacity-40">
                                                            <div className="flex flex-col items-center gap-4">
                                                                <Activity className="h-10 w-10 opacity-20" />
                                                                <p className="text-[10px] font-black uppercase tracking-widest">Aucune transaction enregistrée</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-10 bg-black/5 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 max-w-[400px]">
                                            Les flux affichés ici correspondent aux données financières exportées du grand livre. Pour une vision exhaustive, consultez le module Finance.
                                        </div>
                                        <div className="flex flex-wrap items-center gap-6">
                                            {isAdmin && (
                                                <Link
                                                    to={`/dashboard/finance/transactions/new?propertyId=${id}&returnToProperty=true`}
                                                    className="inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-black text-white shadow-xl hover:scale-105 active:scale-95 h-12 px-10"
                                                >
                                                    <Plus className="mr-3 h-4 w-4" />
                                                    Nouvelle Transaction
                                                </Link>
                                            )}
                                            <Link to="/dashboard/finance/transactions" className="text-[10px] font-black uppercase tracking-widest text-black hover:underline underline-offset-4 decoration-2">
                                                Accéder au module Finance
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {activeTab === 'projects' && (
                    <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                            <div className="space-y-1">
                                <h3 className="font-black text-lg md:text-xl flex items-center gap-4 tracking-tighter uppercase">
                                    <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                        <HardHat className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    {property.management_type === 'GESTION' ? 'Entretien & Maintenance' : 'Suivi des Projets'}
                                </h3>
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-0 md:ml-14">
                                    {property.management_type === 'GESTION' ? 'Interventions techniques et maintenance préventive' : 'Projets de développement et travaux en cours'}
                                </p>
                            </div>
                            {user?.role === 'ADMIN_MADIS' && (
                                <Link
                                    to={`/dashboard/projects/new?propertyId=${id}`}
                                    className="inline-flex items-center justify-center rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-black text-white shadow-xl hover:scale-105 active:scale-95 h-10 md:h-12 px-6 md:px-10"
                                >
                                    <Plus className="mr-2 md:mr-3 h-3.5 w-3.5 md:h-4 w-4" />
                                    {property.management_type === 'GESTION' ? 'Nouvelle Intervention' : 'Nouveau Projet'}
                                </Link>
                            )}
                        </div>

                        {loadingProjects ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-black" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Chargement des projets...</p>
                            </div>
                        ) : associatedProjects.filter(p => {
                            if (property.management_type === 'CONSTRUCTION') return p.category === 'CONSTRUCTION';
                            if (property.management_type === 'GESTION') return p.category === 'MAINTENANCE';
                            return false;
                        }).length === 0 ? (
                            <div className="bg-black/[0.02] border-2 border-dashed border-black/5 rounded-[2rem] p-20 text-center">
                                <div className="mx-auto h-20 w-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6">
                                    {property.management_type === 'GESTION' ? (
                                        <ClipboardList className="h-10 w-10 text-black/20" />
                                    ) : (
                                        <HardHat className="h-10 w-10 text-black/20" />
                                    )}
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">
                                    {property.management_type === 'GESTION' ? 'Aucune intervention' : 'Aucun projet associé'}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 max-w-sm mx-auto">
                                    {property.management_type === 'GESTION'
                                        ? "Il n'y a pas encore d'interventions de maintenance pour ce bien."
                                        : "Il n'y a pas encore de projets de développement pour ce bien."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {associatedProjects
                                    .filter(p => {
                                        if (property.management_type === 'CONSTRUCTION') return p.category === 'CONSTRUCTION';
                                        if (property.management_type === 'GESTION') return p.category === 'MAINTENANCE';
                                        return false;
                                    })
                                    .map((project) => (
                                        <Link
                                            key={project.id}
                                            to={`/dashboard/projects/${project.id}`}
                                            className="group relative solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col bg-white/40"
                                        >
                                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                                <h4 className="font-black text-base md:text-lg tracking-tighter group-hover:text-primary transition-colors pr-2 line-clamp-1 truncate">{project.name}</h4>
                                                <span className="shrink-0 px-3 md:px-4 py-1.5 rounded-full bg-black text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-lg">
                                                    {project.status_display || project.status}
                                                </span>
                                            </div>

                                            <p className="text-[10px] md:text-[11px] font-medium text-muted-foreground line-clamp-2 mb-6 md:mb-8 leading-relaxed opacity-70">
                                                {project.description || "Aucune description détaillée."}
                                            </p>

                                            <div className="mt-auto pt-4 md:pt-6 border-t border-black/5 flex items-center justify-between">
                                                <div className="flex items-center gap-4 md:gap-6">
                                                    <div className="flex flex-col gap-0.5 md:gap-1">
                                                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-40">Budget</span>
                                                        <div className="flex items-center gap-1 font-black text-[10px] md:text-xs tracking-tight">
                                                            <Euro className="h-2.5 w-2.5 md:h-3 w-3 text-emerald-500" />
                                                            <span>{project.budget ? `${Number(project.budget).toLocaleString('fr-FR')} €` : 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 md:gap-1">
                                                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-40">Début</span>
                                                        <div className="flex items-center gap-1 font-black text-[10px] md:text-xs tracking-tight">
                                                            <Clock className="h-2.5 w-2.5 md:h-3 w-3 text-blue-500" />
                                                            <span>{project.start_date ? format(new Date(project.start_date), 'd MMM yy', { locale: fr }).toUpperCase() : 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black/5 text-black opacity-0 group-hover:opacity-100 group-hover:bg-black group-hover:text-white transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <ArrowRight className="h-3.5 w-3.5 md:h-4 w-4" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl animate-fade-in pb-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                            <div className="space-y-1">
                                <h3 className="font-black text-lg md:text-xl flex items-center gap-4 tracking-tighter uppercase">
                                    <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    Pipeline Commercial
                                </h3>
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-0 md:ml-14">
                                    Suivi des offres, candidatures et cycle de vente
                                </p>
                            </div>
                            {user?.role === 'ADMIN_MADIS' && (
                                <button
                                    onClick={() => setShowTxModal(true)}
                                    className="inline-flex items-center justify-center rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-black text-white shadow-xl hover:scale-105 active:scale-95 h-10 md:h-12 px-6 md:px-10"
                                >
                                    <Plus className="mr-2 md:mr-3 h-3.5 w-3.5 md:h-4 w-4" />
                                    Ajouter une offre
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
                            {['DISPONIBLE', 'NEGOCIATION', 'SIGNE', 'ANNULE'].map((status) => {
                                const count = property.transactions?.filter(t => t.status === status).length || 0;
                                const icon = status === 'DISPONIBLE' ? <ClipboardList className="h-3.5 w-3.5 md:h-4 w-4" /> :
                                    status === 'NEGOCIATION' ? <MessageSquare className="h-3.5 w-3.5 md:h-4 w-4" /> :
                                        status === 'SIGNE' ? <CheckCircle2 className="h-3.5 w-3.5 md:h-4 w-4" /> :
                                            <XCircle className="h-3.5 w-3.5 md:h-4 w-4" />;

                                const colorClass = status === 'DISPONIBLE' ? "bg-blue-500" :
                                    status === 'NEGOCIATION' ? "bg-orange-500" :
                                        status === 'SIGNE' ? "bg-emerald-500" :
                                            "bg-rose-500";

                                return (
                                    <div key={status} className="relative solaris-glass rounded-2xl md:rounded-3xl p-4 md:p-6 border-none shadow-lg overflow-hidden group hover:scale-[1.05] transition-all duration-500">
                                        <div className={cn("absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 -mt-4 md:-mt-8 -mr-4 md:-mr-8 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity rounded-full", colorClass)} />
                                        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                                            <div className={cn("p-2 md:p-2.5 rounded-lg md:rounded-xl text-white shadow-lg", colorClass)}>
                                                {icon}
                                            </div>
                                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-40">{status === 'DISPONIBLE' ? 'Offres' : status === 'NEGOCIATION' ? 'Négos' : status === 'SIGNE' ? 'Signées' : 'Annulées'}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1.5 md:gap-2">
                                            <span className="text-2xl md:text-4xl font-black tracking-tighter">{count}</span>
                                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-20">Dossiers</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-8 border-b border-black/5 pb-4">Historique des Offres Récentes</h4>
                            {property.transactions && property.transactions.length > 0 ? (
                                <div className="grid gap-6">
                                    {property.transactions
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .map((tx) => (
                                            <div key={tx.id} className="group solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border-none shadow-lg hover:shadow-2xl transition-all bg-white/40">
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                                                    <div className="flex items-center gap-4 md:gap-6">
                                                        <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl md:rounded-3xl bg-black text-white flex items-center justify-center font-black text-lg md:text-xl shadow-xl">
                                                            {tx.buyer_tenant_name?.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-lg md:text-xl tracking-tighter flex items-center gap-2 md:gap-3">
                                                                {tx.buyer_tenant_name}
                                                                {tx.status === 'SIGNE' && <div className="p-1 rounded-full bg-emerald-500 text-white"><ShieldCheck className="h-2.5 w-2.5 md:h-3 w-3" /></div>}
                                                            </div>
                                                            <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-1.5 md:gap-2 mt-1 md:mt-2">
                                                                <Clock className="h-2.5 w-2.5 md:h-3 w-3" />
                                                                Reçue le {format(new Date(tx.created_at), 'dd MMM yyyy', { locale: fr }).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-row md:items-center justify-between lg:justify-end gap-6 md:gap-10">
                                                        <div className="text-left md:text-right">
                                                            <div className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5 md:mb-1">Montant de l'offre</div>
                                                            <div className="text-xl md:text-2xl font-black tracking-tighter text-black">{Number(tx.asking_price).toLocaleString('fr-FR')} €</div>
                                                            {tx.final_price && tx.status === 'SIGNE' && (
                                                                <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-0.5 md:mt-1">Prix acté: {Number(tx.final_price).toLocaleString('fr-FR')} €</div>
                                                            )}
                                                        </div>

                                                        {user?.role === 'ADMIN_MADIS' && (
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setStatusDropdown(statusDropdown === tx.id ? null : tx.id)}
                                                                    className={cn(
                                                                        "h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 transition-all shadow-xl",
                                                                        tx.status === 'SIGNE' ? "bg-emerald-500 text-white" :
                                                                            tx.status === 'NEGOCIATION' ? "bg-orange-500 text-white" :
                                                                                tx.status === 'ANNULE' ? "bg-rose-500 text-white" :
                                                                                    "bg-black text-white hover:scale-105"
                                                                    )}
                                                                >
                                                                    {tx.status_display || tx.status}
                                                                    <ChevronDown className="h-3.5 w-3.5 md:h-4 w-4" />
                                                                </button>

                                                                {statusDropdown === tx.id && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-[110]" onClick={() => setStatusDropdown(null)} />
                                                                        <div className="absolute right-0 mt-4 w-56 solaris-glass border-none shadow-2xl z-[120] py-3 animate-in fade-in zoom-in-95 duration-200 rounded-[1.5rem] overflow-hidden">
                                                                            {['DISPONIBLE', 'NEGOCIATION', 'SIGNE', 'ANNULE'].map((s) => (
                                                                                <button
                                                                                    key={s}
                                                                                    onClick={() => updateTxStatus(tx.id, s)}
                                                                                    className={cn(
                                                                                        "w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-black hover:text-white",
                                                                                        tx.status === s ? "bg-black/5 text-black" : "text-muted-foreground"
                                                                                    )}
                                                                                >
                                                                                    {s}
                                                                                </button>
                                                                            ))}
                                                                            <div className="border-t border-black/5 mt-3 pt-3 px-3">
                                                                                <button
                                                                                    onClick={() => deleteTx(tx.id)}
                                                                                    className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all flex items-center gap-3"
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                                    Supprimer
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {tx.notes && (
                                                    <div className="mt-8 p-6 bg-black/[0.02] rounded-2xl border border-dashed border-black/10">
                                                        <p className="text-[11px] font-medium text-muted-foreground italic leading-relaxed opacity-70">"{tx.notes}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="bg-black/[0.02] border-2 border-dashed border-black/5 rounded-[2rem] p-20 text-center">
                                    <div className="mx-auto h-20 w-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6">
                                        <ClipboardList className="h-10 w-10 text-black/20" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Aucune transaction</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Il n'y a pas encore d'offres ou de transactions pour ce bien.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="solaris-glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-xl animate-fade-in pb-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                            <div className="space-y-1">
                                <h3 className="font-black text-lg md:text-xl flex items-center gap-4 tracking-tighter uppercase">
                                    <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-black text-white shadow-lg">
                                        <FileText className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    Coffre-Fort Numérique
                                </h3>
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-0 md:ml-14">
                                    Documents légaux, plans et justificatifs sécurisés
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {user?.role === 'ADMIN_MADIS' && (
                                    <>
                                        {isSelectionMode ? (
                                            <div className="flex items-center gap-2 md:gap-4 animate-in fade-in slide-in-from-right-2">
                                                <button
                                                    onClick={() => { setIsSelectionMode(false); setSelectedDocuments([]); }}
                                                    className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-black px-2 md:px-4 py-2"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={selectAllFiltered}
                                                    className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black hover:underline underline-offset-4 decoration-2 px-2 md:px-4 py-2"
                                                >
                                                    Tout
                                                </button>
                                                <button
                                                    onClick={handleDeleteSelectedDocuments}
                                                    disabled={selectedDocuments.length === 0}
                                                    className="bg-black text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl shadow-xl hover:scale-105 active:scale-95 disabled:opacity-30 flex items-center gap-2 md:gap-3 transition-all"
                                                >
                                                    <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                    {selectedDocuments.length}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsSelectionMode(true)}
                                                className="inline-flex items-center justify-center rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-white text-black border-2 border-black/5 hover:border-black/20 h-10 md:h-12 px-4 md:px-8"
                                            >
                                                <CheckCircle2 className="mr-2 md:mr-3 h-3.5 w-3.5 md:h-4 w-4" />
                                                Sélectionner
                                            </button>
                                        )}
                                        <Link
                                            to={`/dashboard/documents/new?propertyId=${id}`}
                                            className="inline-flex items-center justify-center rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-black text-white shadow-xl hover:scale-105 active:scale-95 h-10 md:h-12 px-6 md:px-10"
                                        >
                                            <Plus className="mr-2 md:mr-3 h-3.5 w-3.5 md:h-4 w-4" />
                                            Ajouter
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-12">
                            {[
                                { id: 'all', label: 'Tous' },
                                { id: 'TITRE_PROPRIETE', label: 'Titres' },
                                { id: 'DIAGNOSTIC', label: 'Diags' },
                                { id: 'PLANS', label: 'Plans' },
                                { id: 'VERIF_FONCIERE', label: 'Vérification' },
                                { id: 'AUTRE', label: 'Autres' }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setDocumentFilter(f.id)}
                                    className={cn(
                                        "px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                                        documentFilter === f.id
                                            ? "bg-black text-white border-black shadow-xl scale-105"
                                            : "bg-white text-black/40 border-black/5 hover:border-black/20"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {loadingDocuments ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-black" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Accès au coffre...</p>
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="bg-black/[0.02] border-2 border-dashed border-black/5 rounded-[2rem] p-20 text-center">
                                <div className="mx-auto h-20 w-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6">
                                    <FileText className="h-10 w-10 text-black/20" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Aucun document</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Il n'y a pas encore de documents pour cette catégorie.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredDocuments.map((doc) => (
                                    <div key={doc.id} className="group relative solaris-glass rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border-none shadow-lg hover:shadow-2xl transition-all bg-white/40 flex flex-col">
                                        <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                                            {isSelectionMode && (
                                                <div
                                                    onClick={() => toggleDocumentSelection(doc.id)}
                                                    className={cn(
                                                        "mt-1 w-5 h-5 md:w-6 md:h-6 rounded-lg md:rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all",
                                                        selectedDocuments.includes(doc.id)
                                                            ? "bg-black border-black text-white shadow-lg"
                                                            : "bg-white border-black/10 hover:border-black/30"
                                                    )}
                                                >
                                                    {selectedDocuments.includes(doc.id) && <Check className="h-3 md:h-4 w-3 md:w-4 stroke-[4]" />}
                                                </div>
                                            )}
                                            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-black/5 text-black shadow-sm group-hover:bg-black group-hover:text-white transition-all duration-500">
                                                <FileText className="h-4 md:h-5 w-4 md:w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-black text-xs md:text-sm tracking-tight truncate pr-4">{doc.title}</h4>
                                                    {!isSelectionMode && user?.role === 'ADMIN_MADIS' && (
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); handleDeleteDocument(doc.id); }}
                                                            className="text-muted-foreground hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 md:mt-2">
                                                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-black bg-black/5 px-2 py-0.5 rounded-lg">
                                                        {doc.category_display || doc.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-4 md:pt-6 border-t border-black/5 flex items-center justify-between">
                                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-40">{format(new Date(doc.uploaded_at || new Date()), 'dd/MM/yy', { locale: fr })}</span>
                                            <a
                                                href={doc.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-black hover:underline underline-offset-4 decoration-2 transition-all"
                                            >
                                                <Download className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                Télécharger
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div >

            {/* Modals */}
            {
                showTxModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowTxModal(false)}>
                        <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b">
                                <h3 className="text-lg font-bold">Nouvelle Offre / Candidature</h3>
                                <button onClick={() => setShowTxModal(false)} className="p-1 rounded-full hover:bg-muted transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Identité / Tiers</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Nom de l'acheteur ou locataire..."
                                            value={txForm.buyer_tenant}
                                            onChange={e => setTxForm({ ...txForm, buyer_tenant: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Montant de l'offre (€)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="number"
                                            placeholder="Ex: 250000"
                                            value={txForm.asking_price}
                                            onChange={e => setTxForm({ ...txForm, asking_price: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Notes / Conditions</label>
                                    <textarea
                                        placeholder="Commentaires particuliers, conditions suspensives..."
                                        value={txForm.notes}
                                        onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
                                        className="w-full p-4 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/20">
                                <button onClick={() => setShowTxModal(false)} className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-muted transition-colors">
                                    Annuler
                                </button>
                                <button
                                    onClick={createTransaction}
                                    disabled={txLoading || !txForm.buyer_tenant || !txForm.asking_price}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {txLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    Enregistrer l'offre
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showCashCallModal && (
                    <CashCallModal
                        propertyId={id}
                        onClose={() => setShowCashCallModal(false)}
                        onSuccess={() => {
                            fetchPerfData();
                            if (window.refreshWallet) window.refreshWallet();
                        }}
                    />
                )
            }

            {
                showSettlementModal && (
                    <SettlementModal
                        propertyId={id}
                        onClose={() => setShowSettlementModal(false)}
                        onSuccess={() => {
                            fetchPerfData();
                            if (window.refreshWallet) window.refreshWallet();
                        }}
                    />
                )
            }

            {
                showFinalPriceModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowFinalPriceModal(false)}>
                        <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b">
                                <h3 className="text-lg font-bold">Conclusion de la Vente</h3>
                                <button onClick={() => setShowFinalPriceModal(false)} className="p-1 rounded-full hover:bg-muted transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm mb-4 flex gap-3">
                                    <CheckCircle className="h-5 w-5 shrink-0" />
                                    <p>Félicitations ! Vous êtes sur le point de valider cette transaction.</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                        <DollarSign className="h-3 w-3 inline mr-1" />
                                        Prix Final Acté (€)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Montant final..."
                                        value={finalPriceValue}
                                        onChange={e => setFinalPriceValue(e.target.value)}
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-lg"
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Ce montant sera enregistré comme prix de vente définitif.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/20">
                                <button onClick={() => setShowFinalPriceModal(false)} className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-muted transition-colors">
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmFinalPrice}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                                >
                                    <Check className="h-4 w-4" />
                                    Confirmer la signature
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showProofModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowProofModal(false)}>
                        <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Upload className="h-4 w-4 text-primary" />
                                    Justificatif de Paiement
                                </h3>
                                <button onClick={() => setShowProofModal(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {proofOp?.newStatus === 'PENDING'
                                        ? "Le téléchargement d'une preuve de paiement est obligatoire pour valider votre demande."
                                        : "Veuillez joindre une preuve du transfert ou de la réception pour confirmer cette opération."
                                    }
                                </p>
                                <input
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            confirmOpWithProof(file);
                                        }
                                    }}
                                    className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                                />
                            </div>
                            {proofOp?.newStatus !== 'PENDING' && proofOp?.newStatus !== 'PAID' && (
                                <div className="p-4 bg-muted/20 border-t flex justify-end gap-3">
                                    <button
                                        onClick={() => confirmOpWithProof(null)}
                                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Continuer sans fichier
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
