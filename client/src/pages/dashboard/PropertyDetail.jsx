import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/lib/axios';
import {
    Tag, X, DollarSign, StickyNote, UserPlus, CheckCircle, XCircle, MessageSquare, ChevronDown, Settings, Percent, Home, Calendar, Wrench, Sofa, Shield, Check,
    ArrowLeft, Building, Loader2, Plus, Trash2, Edit, MapPin, Ruler, FileText, Euro, Clock, ArrowRight, ChevronLeft, ChevronRight, HardHat,
    TrendingUp, TrendingDown, Activity, AlertTriangle, Globe, RefreshCw, Download, ShieldCheck, History, LayoutDashboard, ClipboardList, CheckCircle2, Users
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import WalletCard from '@/components/dashboard/WalletCard';
import CashCallModal from '@/components/dashboard/CashCallModal';
import SettlementModal from '@/components/dashboard/SettlementModal';


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
        <div className="space-y-6 animate-fade-in pb-60">
            <Link to="/dashboard/properties" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour aux biens
            </Link>

            {/* Header */}
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                {/* Image Gallery */}
                {property.images && property.images.length > 0 && (
                    <div className="relative aspect-[21/9] bg-muted overflow-hidden">
                        <img
                            src={property.images[activeImageIndex].image}
                            alt={property.name}
                            className="w-full h-full object-cover transition-all duration-500"
                        />

                        {property.images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 transition-colors"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={() => setActiveImageIndex((prev) => (prev + 1) % property.images.length)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 transition-colors"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>

                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {property.images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    property.category === 'RESIDENTIEL' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                        property.category === 'COMMERCIAL' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                            "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                )}>
                                    {property.category_display || property.category}
                                </span>
                                {property.management_type !== 'CONSTRUCTION' && (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                        property.transaction_nature === 'VENTE' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                            "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                    )}>
                                        {property.transaction_nature_display || property.transaction_nature}
                                    </span>
                                )}
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    property.management_type === 'MANDAT' ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" :
                                        property.management_type === 'GESTION' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                )}>
                                    {property.management_type_display || property.management_type}
                                </span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    property.status === 'EN_COURS' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                        property.status === 'LIVRE' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                            property.status === 'DISPONIBLE' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                property.status === 'VENDU' ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200" :
                                                    property.status === 'LOUE' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                                                        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                )}>
                                    {property.status_display || property.status}
                                </span>

                                {property.is_verified_fonciere && (
                                    <button
                                        onClick={() => {
                                            setActiveTab('documents');
                                            setDocumentFilter('VERIF_FONCIERE');
                                        }}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer border border-emerald-200"
                                    >
                                        <ShieldCheck className="h-3 w-3" />
                                        Vérifié Foncièrement
                                    </button>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{property.name}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{property.address}, {property.city} {property.postal_code}</span>
                            </div>

                            {/* Price Display */}
                            {(property.transaction_nature === 'VENTE' || property.status === 'VENDU') && property.prix_vente && (
                                <div className="mt-3 flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-primary">{Number(property.prix_vente).toLocaleString('fr-FR')}</span>
                                    <span className="text-sm font-bold text-primary">€</span>
                                    {currencyRate && property?.devise_origine !== 'EUR' && (
                                        <div className="ml-3 flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md border text-xs text-muted-foreground font-medium">
                                            <Globe className="h-3 w-3" />
                                            ≈ {(Number(property.prix_vente) * currencyRate).toLocaleString('fr-FR', { style: 'currency', currency: property.devise_origine })}
                                            <span className="text-[10px] opacity-70 scale-90">(taux indicatif)</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {property.transaction_nature === 'LOCATION' && property.status !== 'VENDU' && (property.loyer_mensuel || property.prix_nuitee) && (
                                <div className="mt-3 flex items-center gap-4">
                                    {property.loyer_mensuel && (
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-primary">{Number(property.loyer_mensuel).toLocaleString('fr-FR')}</span>
                                            <span className="text-sm font-bold text-primary">€/mois</span>
                                        </div>
                                    )}
                                    {property.prix_nuitee && (
                                        <div className="flex items-baseline gap-1 text-muted-foreground">
                                            <span className="text-lg font-bold">{Number(property.prix_nuitee).toLocaleString('fr-FR')}</span>
                                            <span className="text-xs font-bold">€/nuit</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Commission MaDis */}
                            {user?.role === 'ADMIN_MADIS' && (property.commission_rate || property.commission_fixe) && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Settings className="h-3.5 w-3.5" />
                                    <span className="font-medium">Commission MaDis :</span>
                                    {property.commission_type === 'POURCENTAGE' && property.commission_rate && (
                                        <span className="font-bold text-foreground">{property.commission_rate}%</span>
                                    )}
                                    {property.commission_type === 'FIXE' && property.commission_fixe && (
                                        <span className="font-bold text-foreground">{Number(property.commission_fixe).toLocaleString('fr-FR')} €</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 w-full md:w-auto">
                            {user?.role === 'ADMIN_MADIS' && property.management_type === 'CONSTRUCTION' && (
                                <Link
                                    to={`/dashboard/projects/new?propertyId=${id}`}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 md:h-9 px-4 py-2 w-full sm:w-auto"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouveau Projet
                                </Link>
                            )}
                            {user?.role === 'ADMIN_MADIS' && (
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={handleDelete}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-destructive text-destructive bg-background shadow-sm hover:bg-destructive hover:text-destructive-foreground h-10 md:h-9 px-4 py-2 w-full sm:w-auto"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </button>
                                    <Link
                                        to={`/dashboard/properties/${id}/edit`}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 md:h-9 px-4 py-2 w-full sm:w-auto"
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b overflow-x-auto scrollbar-hide">
                <div className="flex gap-6 min-w-max">
                    {['details', 'projects', 'transactions', 'performance', 'documents'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-medium border-b-2 transition-all px-1 whitespace-nowrap ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                } ${tab === 'transactions' && property.management_type !== 'MANDAT' ? 'hidden' : ''} ${tab === 'projects' && (property.management_type !== 'CONSTRUCTION' && property.management_type !== 'GESTION') ? 'hidden' : ''}`}
                        >
                            {tab === 'details' ? 'Détails' :
                                tab === 'projects' ? (property.management_type === 'GESTION' ? 'Entretien & Maintenance' : 'Projets') :
                                    tab === 'transactions' ? 'Pipeline Commercial' :
                                        tab === 'performance' ? 'Performance' :
                                            'Documents'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Currency Context for International Investors */}
            {property.devise_origine !== 'EUR' && (
                <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground -mt-4 italic">
                    <Globe className="h-3 w-3" />
                    Affichage principal en Euro (€). Conversion {property.devise_origine} à titre indicatif.
                </div>
            )}

            {/* Tab Content */}
            <div className="mt-2">
                {activeTab === 'details' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-5 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Building className="h-5 w-5 text-primary" />
                                    </div>
                                    Informations Générales
                                </h3>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 text-sm">
                                    <div>
                                        <dt className="text-muted-foreground mb-1">Type de bien</dt>
                                        <dd className="font-medium">{property.property_type_display || property.property_type}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground mb-1">Surface</dt>
                                        <dd className="font-medium flex items-center gap-1">
                                            <Ruler className="h-3 w-3 text-primary" />
                                            {property.surface ? `${property.surface} m²` : 'N/A'}
                                        </dd>
                                    </div>
                                    {property.category === 'RESIDENTIEL' && (
                                        <>
                                            <div>
                                                <dt className="text-muted-foreground mb-1">Nombre de pièces</dt>
                                                <dd className="font-medium">{property.room_count || 'N/A'}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-muted-foreground mb-1">Nombre de chambres</dt>
                                                <dd className="font-medium">{property.bedroom_count || 'N/A'}</dd>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <dt className="text-muted-foreground mb-1">Statut</dt>
                                        <dd className="font-medium mt-1">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                {property.status_display || property.status}
                                            </span>
                                        </dd>
                                    </div>
                                    {property.prix_acquisition && (
                                        <div>
                                            <dt className="text-muted-foreground mb-1 font-semibold text-primary">Investissement Total</dt>
                                            <dd className="font-black text-primary text-xl">
                                                {(Number(property.prix_acquisition) + Number(property.frais_acquisition_annexes || 0)).toLocaleString('fr-FR')} €
                                            </dd>
                                            <p className="text-[10px] text-muted-foreground italic">(Prix + Frais d'acquisition)</p>
                                        </div>
                                    )}
                                    <div className="sm:col-span-2">
                                        <dt className="text-muted-foreground mb-1">Propriétaire / Client</dt>
                                        <dd className="font-medium">
                                            {property.owner ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                                                        {property.owner_name?.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    {property.owner_name}
                                                </div>
                                            ) : (
                                                <span className="text-emerald-600 font-bold italic">Disponible (Mandat)</span>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-5 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/20">
                                        <FileText className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    Description
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {property.description || "Aucune description disponible pour ce bien."}
                                </p>
                            </div>
                        </div>

                        {/* Specific Details Based on Property Type */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {property.management_type === 'MANDAT' && (
                                <div className="bg-card border rounded-xl p-6 shadow-sm border-l-4 border-l-emerald-500">
                                    <h3 className="font-semibold text-lg mb-5 flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                                            <Euro className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        Détails de la Vente
                                    </h3>
                                    <dl className="space-y-4 text-sm">
                                        <div className="flex justify-between items-center py-2">
                                            <dt className="text-muted-foreground">Prix d'achat</dt>
                                            <dd className="font-bold">{property.prix_acquisition ? `${Number(property.prix_acquisition).toLocaleString('fr-FR')} €` : 'N/A'}</dd>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-t border-dashed">
                                            <dt className="text-muted-foreground">Frais annexes</dt>
                                            <dd className="font-medium text-muted-foreground">+{property.frais_acquisition_annexes ? `${Number(property.frais_acquisition_annexes).toLocaleString('fr-FR')} €` : '0 €'}</dd>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <div className={cn("p-1 rounded-full", property.negociable ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground")}>
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span className={cn(property.negociable ? "font-medium" : "text-muted-foreground")}>Prix négociable</span>
                                        </div>
                                    </dl>
                                </div>
                            )}

                            {property.management_type === 'GESTION' && (
                                <div className="bg-card border rounded-xl p-6 shadow-sm border-l-4 border-l-blue-500">
                                    <h3 className="font-semibold text-lg mb-5 flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                            <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        Détails de la Location
                                    </h3>
                                    <dl className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                                            <dt className="text-muted-foreground">Loyer mensuel</dt>
                                            <dd className="font-bold text-lg text-blue-600">{property.loyer_mensuel ? `${Number(property.loyer_mensuel).toLocaleString('fr-FR')} €` : 'N/A'}</dd>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 py-2">
                                            <div>
                                                <dt className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Charges mensuelles</dt>
                                                <dd className="font-medium">{property.charges_mensuelles ? `${Number(property.charges_mensuelles).toLocaleString('fr-FR')} €` : 'N/A'}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Caution / Dépôt</dt>
                                                <dd className="font-medium">{property.depot_garantie ? `${Number(property.depot_garantie).toLocaleString('fr-FR')} €` : 'N/A'}</dd>
                                            </div>
                                        </div>
                                    </dl>
                                </div>
                            )}

                            {property.management_type === 'CONSTRUCTION' && (
                                <div className="bg-card border rounded-xl p-6 shadow-sm border-l-4 border-l-rose-500">
                                    <h3 className="font-semibold text-lg mb-5 flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/20">
                                            <Wrench className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                        </div>
                                        Détails du Chantier
                                    </h3>
                                    <dl className="space-y-4 text-sm">
                                        <div className="py-2 border-b border-dashed">
                                            <dt className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Budget Total du Projet</dt>
                                            <dd className="font-black text-xl text-rose-600">{property.budget_total ? `${Number(property.budget_total).toLocaleString('fr-FR')} €` : 'Non défini'}</dd>
                                        </div>
                                    </dl>
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
                            <>
                                {/* Stats Cards */}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {(() => {
                                        const isSale = property.transaction_nature === 'VENTE' || property.status === 'VENDU';

                                        if (property.management_type === 'CONSTRUCTION') {
                                            const budget = Number(property.budget_total || 0);
                                            const spent = Math.abs(Number(perfData?.property_summary?.total_outflow || 0));
                                            const remaining = Math.max(0, budget - spent);
                                            const progress = budget > 0 ? (spent / budget) * 100 : 0;

                                            return (
                                                <>
                                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Budget Travaux</span>
                                                            <Wrench className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="text-2xl font-black">{budget.toLocaleString()}€</div>
                                                        <p className="text-[10px] text-muted-foreground mt-1">Enveloppe globale prévisionnelle</p>
                                                    </div>
                                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Déjà Consommé</span>
                                                            <TrendingDown className="h-4 w-4 text-rose-500" />
                                                        </div>
                                                        <div className="text-2xl font-black text-rose-500">{spent.toLocaleString()}€</div>
                                                        <p className="text-[10px] text-muted-foreground mt-1">{progress.toFixed(1)}% du budget total</p>
                                                    </div>
                                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reste à Spend</span>
                                                            <Euro className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        <div className="text-2xl font-black text-emerald-600">{remaining.toLocaleString()}€</div>
                                                        <p className="text-[10px] text-muted-foreground mt-1">Solde disponible pour la suite</p>
                                                    </div>
                                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Progression Financière</span>
                                                            <Activity className="h-4 w-4 text-blue-500" />
                                                        </div>
                                                        <div className="text-2xl font-black text-blue-600">{progress.toFixed(0)}%</div>
                                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2">
                                                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
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

                                            // Calculate MaDis Commission
                                            let commissionAmount = 0;
                                            if (property.commission_type === 'POURCENTAGE' && property.commission_rate) {
                                                commissionAmount = (price * Number(property.commission_rate)) / 100;
                                            } else if (property.commission_type === 'FIXE' && property.commission_fixe) {
                                                commissionAmount = Number(property.commission_fixe);
                                            }

                                            // User logic: If I am the buyer of the signed transaction, I start at 0 gain (price == acqPrice).
                                            // I shouldn't see -Commission because the SELLER paid it.
                                            const isBuyerOfThisSignedSale = signedTx && Number(signedTx.buyer_tenant) === Number(user?.id);
                                            const effectiveCommission = isBuyerOfThisSignedSale ? 0 : commissionAmount;

                                            const grossPlusValue = price - totalInvest;

                                            // Determine correct value (prioritize backend data which includes construction costs)
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
                                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                Plus-value nette {signedTx ? '(Réelle)' : '(Estimée)'}
                                                            </span>
                                                            <TrendingUp className={cn("h-4 w-4", isPlusValueNegative ? "text-[#ff0048]" : "text-[#10B981]")} />
                                                        </div>
                                                        <div className={cn("text-2xl font-black", isPlusValueNegative ? "text-[#ff0048]" : "text-[#10B981]")}>
                                                            {netPlusValue !== null ? `${netPlusValue.toLocaleString()}€` : 'N/A'}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-1">
                                                            Position nette finale après achat, frais, travaux et commissions
                                                        </p>
                                                    </div>
                                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                ROI Projet {signedTx ? '(Net)' : '(Estimé)'}
                                                            </span>
                                                            <Percent className={cn("h-4 w-4", isRoiNegative ? "text-[#ff0048]" : "text-[#10B981]")} />
                                                        </div>
                                                        <div className={cn("text-2xl font-black", isRoiNegative ? "text-[#ff0048]" : "text-[#10B981]")}>
                                                            {roi !== null ? `${roi.toFixed(1)}%` : 'N/A'}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-1">
                                                            Rendement sur l'ensemble des fonds investis
                                                        </p>
                                                    </div>
                                                </>
                                            );
                                        } else {
                                            return (
                                                <>
                                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rendement Annuel</span>
                                                            <TrendingUp className="h-4 w-4 text-[#10B981]" />
                                                        </div>
                                                        <div className="text-2xl font-black text-[#10B981]">{perfData?.property_summary?.theoretical_yield || 0}%</div>
                                                        <p className="text-[10px] text-muted-foreground mt-1">Objectif basé sur loyer cible</p>
                                                    </div>
                                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rendement Réel (12m)</span>
                                                            <Activity className={cn("h-4 w-4", (perfData?.property_summary?.yield || 0) >= 0 ? "text-[#10B981]" : "text-rose-500")} />
                                                        </div>
                                                        <div className={cn("text-2xl font-black", (perfData?.property_summary?.yield || 0) >= 0 ? "text-foreground" : "text-rose-500")}>
                                                            {perfData?.property_summary?.yield || 0}%
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-1">Basé sur les revenus perçus</p>
                                                    </div>
                                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cashflow Net</span>
                                                            <Euro className={cn("h-4 w-4", (perfData?.property_summary?.net || 0) >= 0 ? "text-[#10B981]" : "text-rose-500")} />
                                                        </div>
                                                        <div className={cn("text-2xl font-black", (perfData?.property_summary?.net || 0) >= 0 ? "text-foreground" : "text-rose-500")}>
                                                            {(perfData?.property_summary?.net || 0).toLocaleString()}€
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-1">Solde encaissé / décaissé</p>
                                                    </div>
                                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Taux d'Encaïssement</span>
                                                            <Activity className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className={cn(
                                                            "text-2xl font-black",
                                                            (perfData.property_summary?.collection_rate || 0) >= 90 ? "text-[#10B981]" :
                                                                (perfData.property_summary?.collection_rate || 0) >= 50 ? "text-orange-500" : "text-rose-600"
                                                        )}>
                                                            {perfData.property_summary?.collection_rate !== null && perfData.property_summary?.collection_rate !== undefined ? `${perfData.property_summary.collection_rate}%` : 'N/A'}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-1">
                                                            {(perfData.property_summary?.shortfall || 0) > 0
                                                                ? `Manque : ${perfData.property_summary.shortfall.toLocaleString()}€`
                                                                : "Loyer complet reçu"}
                                                        </p>
                                                    </div>
                                                </>
                                            );
                                        }
                                    })()}
                                </div >

                                {
                                    (property.management_type === 'CONSTRUCTION' || (property.transaction_nature !== 'VENTE' && property.status !== 'VENDU')) && (
                                        <div className="grid gap-6 lg:grid-cols-3">
                                            {/* Evolution Chart */}
                                            <div className="bg-card border rounded-xl p-6 shadow-sm lg:col-span-2">
                                                <h3 className="font-semibold mb-6 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    Évolution des Flux
                                                </h3>
                                                <div className="h-[250px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        {perfData?.monthly_data ? (
                                                            <AreaChart data={perfData.monthly_data}>
                                                                <defs>
                                                                    <linearGradient id="colorRevPerf" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                                <XAxis
                                                                    dataKey="month"
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tick={{ fontSize: 10 }}
                                                                    tickFormatter={str => {
                                                                        const [y, m] = str.split('-');
                                                                        return new Date(y, m - 1).toLocaleString('fr-FR', { month: 'short' });
                                                                    }}
                                                                />
                                                                <YAxis
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tick={{ fontSize: 10 }}
                                                                    tickFormatter={v => `${v}€`}
                                                                    domain={[0, dataMax => Math.max(dataMax, (perfData?.expected_monthly_rent || 0) * 1.2)]}
                                                                />
                                                                <Tooltip
                                                                    content={({ active, payload, label }) => {
                                                                        if (active && payload && payload.length) {
                                                                            const d = payload[0].payload;
                                                                            const dateObj = new Date(d.month.split('-')[0], d.month.split('-')[1] - 1);
                                                                            return (
                                                                                <div className="bg-card border rounded-xl shadow-xl p-3 text-[11px] space-y-1.5 min-w-[140px] border-primary/20">
                                                                                    <p className="font-bold border-b border-border pb-1 mb-1 uppercase tracking-wider text-muted-foreground">
                                                                                        {dateObj.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                                                                                    </p>
                                                                                    {property.management_type === 'CONSTRUCTION' ? (
                                                                                        <div className="flex justify-between items-center gap-4">
                                                                                            <span className="text-muted-foreground italic">Dépenses :</span>
                                                                                            <span className="font-bold text-rose-500">{d.expenses.toLocaleString()}€</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <div className="flex justify-between items-center gap-4">
                                                                                                <span className="text-muted-foreground italic">Revenus totaux :</span>
                                                                                                <span className="font-bold text-[#10B981]">{d.revenues.toLocaleString()}€</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between items-center gap-4">
                                                                                                <span className="text-muted-foreground italic">Loyers reçus :</span>
                                                                                                <span className="font-bold text-[#3b82f6] text-[12px]">{d.actual_rent.toLocaleString()}€</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between items-center gap-4 border-t border-dashed pt-1 mt-1 font-bold">
                                                                                                <span className="text-muted-foreground">Taux :</span>
                                                                                                <span className={cn(
                                                                                                    d.collection_rate >= 90 ? "text-[#10B981]" : d.collection_rate >= 50 ? "text-orange-500" : "text-rose-600"
                                                                                                )}>
                                                                                                    {d.collection_rate}%
                                                                                                </span>
                                                                                            </div>
                                                                                            {d.shortfall > 0 && (
                                                                                                <p className="text-rose-600 font-medium text-[10px] text-right">Manque: -{d.shortfall.toLocaleString()}€</p>
                                                                                            )}
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
                                                                        label={{ position: 'top', value: `Loyers attendus : ${perfData.expected_monthly_rent}€`, fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
                                                                        stroke="#64748b"
                                                                        strokeDasharray="5 5"
                                                                    />
                                                                )}
                                                                {property.management_type === 'CONSTRUCTION' ? (
                                                                    <Area type="monotone" dataKey="expenses" stroke="#ff0048" strokeWidth={3} fillOpacity={0.1} fill="#ff0048" name="Dépenses de Chantier" />
                                                                ) : (
                                                                    <>
                                                                        <Area type="monotone" dataKey="revenues" stroke="#10B981" strokeWidth={3} fill="url(#colorRevPerf)" name="Total Revenus" />
                                                                        <Area type="monotone" dataKey="actual_rent" stroke="#3b82f6" strokeWidth={2} fill="transparent" name="Loyers Reçus" />
                                                                        <Area type="monotone" dataKey="expenses" stroke="#ff0048" strokeWidth={2} fill="transparent" name="Dépenses" />
                                                                    </>
                                                                )}
                                                            </AreaChart>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                                                                <TrendingUp className="h-10 w-10 mb-2 opacity-20" />
                                                                <p className="text-sm font-bold italic">Aucune donnée mensuelle disponible</p>
                                                            </div>
                                                        )}
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                                <h3 className="font-semibold mb-6 flex items-center gap-2">
                                                    <Activity className="h-4 w-4 text-primary" />
                                                    Répartition Catégories
                                                </h3>
                                                <div className="space-y-4">
                                                    {perfData?.category_stats?.map((cat) => (
                                                        <div key={cat.category} className="space-y-1.5">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="font-medium">{cat.label || cat.category}</span>
                                                                <span>{Number(cat.total).toLocaleString()}€</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn("h-full", property.management_type === 'CONSTRUCTION' ? "bg-rose-500" : "bg-primary")}
                                                                    style={{ width: `${Math.min(100, (cat.total / (Math.abs(property.management_type === 'CONSTRUCTION' ? perfData?.total_outflow : perfData?.total_inflow) || 1)) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!perfData || !perfData.category_stats || perfData.category_stats.length === 0) && (
                                                        <p className="text-center text-muted-foreground text-xs py-10 italic">Aucune donnée disponible</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                {
                                    user?.role === 'ADMIN_MADIS' && (cashCalls.length > 0 || settlements.length > 0) && (
                                        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                                            <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
                                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                                    <History className="h-4 w-4 text-primary" />
                                                    {property.transaction_nature === 'VENTE' ? "Opérations Financières (Frais & Recettes)" : "Opérations de Régie (Appels & Reversements)"}
                                                </h3>
                                                <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">En attente / Traitement</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-muted/10">
                                                            <th className="px-6 py-3 text-left font-medium text-muted-foreground text-[10px] uppercase">Type</th>
                                                            <th className="px-6 py-3 text-left font-medium text-muted-foreground text-[10px] uppercase">Motif / Période</th>
                                                            <th className="px-6 py-3 text-left font-medium text-muted-foreground text-[10px] uppercase">Montant</th>
                                                            <th className="px-6 py-3 text-left font-medium text-muted-foreground text-[10px] uppercase">Statut</th>
                                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground text-[10px] uppercase">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {cashCalls.filter(cc => cc.status !== 'PAID' && cc.status !== 'CANCELLED').map((cc) => (
                                                            <tr key={`cc-${cc.id}`} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <span className="text-emerald-600 font-bold text-[11px]">APPEL DE FONDS</span>
                                                                </td>
                                                                <td className="px-6 py-4 font-medium">{cc.reason}</td>
                                                                <td className="px-6 py-4 font-black">{Number(cc.amount).toLocaleString()}€</td>
                                                                <td className="px-6 py-4">
                                                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
                                                                        {cc.status_display || cc.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button
                                                                        onClick={() => updateOpStatus('CASH_CALL', cc.id, 'PAID')}
                                                                        className="px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold uppercase hover:bg-emerald-700 transition-colors"
                                                                    >
                                                                        Marquer comme reçu
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {settlements.filter(s => s.status !== 'PAID' && s.status !== 'CANCELLED').map((s) => (
                                                            <tr key={`s-${s.id}`} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <span className="text-rose-600 font-bold text-[11px]">REVERSEMENT</span>
                                                                </td>
                                                                <td className="px-6 py-4 font-medium">Période du {format(new Date(s.period_start), 'dd/MM/yy')} au {format(new Date(s.period_end), 'dd/MM/yy')}</td>
                                                                <td className="px-6 py-4 font-black text-rose-600">{Number(s.amount).toLocaleString()}€</td>
                                                                <td className="px-6 py-4">
                                                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                                                                        {s.status_display || s.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button
                                                                        onClick={() => updateOpStatus('SETTLEMENT', s.id, 'PAID')}
                                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-bold uppercase hover:bg-blue-700 transition-colors"
                                                                    >
                                                                        Valider le virement
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {loadingOps && (
                                                            <tr>
                                                                <td colSpan={5} className="text-center py-6">
                                                                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                }
                                <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-6 border-b bg-muted/30">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            Derniers Flux Financiers
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/10">
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Type</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Catégorie</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Montant</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Période</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date Paiement</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {perfData?.recent_transactions?.map((tx) => (
                                                    <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                                tx.type === 'INFLOW' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                            )}>
                                                                {tx.type === 'INFLOW' ? 'Revenu' : 'Dépense'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium">{tx.category}</td>
                                                        <td className={cn(
                                                            "px-6 py-4 font-bold",
                                                            tx.type === 'INFLOW' ? "text-emerald-600" : "text-rose-600"
                                                        )}>
                                                            {tx.type === 'INFLOW' ? '+' : '-'}{Number(tx.amount).toLocaleString()}€
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-muted-foreground">
                                                            {tx.period_month && tx.period_year ? (
                                                                `${new Date(2000, tx.period_month - 1).toLocaleString('fr-FR', { month: 'long' })} ${tx.period_year}`
                                                            ) : (
                                                                'N/A'
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground">
                                                            {format(new Date(tx.date), 'dd MMM yyyy', { locale: fr })}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!perfData || !perfData.recent_transactions || perfData.recent_transactions.length === 0) && (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                                            Aucune transaction enregistrée pour ce bien.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 bg-muted/10 border-t text-center">
                                        <Link to="/dashboard/finance/transactions" className="text-xs font-bold text-primary hover:underline">
                                            Voir toutes les transactions dans le module Finance
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}


                {activeTab === 'projects' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                {property.management_type === 'GESTION' ? 'Interventions pour ce bien' : 'Projets pour ce bien'}
                            </h3>
                            {user?.role === 'ADMIN_MADIS' && (
                                <Link
                                    to={`/dashboard/projects/new?propertyId=${id}`}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20 h-8 px-3"
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    {property.management_type === 'GESTION' ? 'Nouvelle Intervention' : 'Nouveau Projet'}
                                </Link>
                            )}
                        </div>

                        {loadingProjects ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : associatedProjects.filter(p => {
                            if (property.management_type === 'CONSTRUCTION') return p.category === 'CONSTRUCTION';
                            if (property.management_type === 'GESTION') return p.category === 'MAINTENANCE';
                            return false;
                        }).length === 0 ? (
                            <div className="bg-card border border-dashed rounded-xl p-12 text-center">
                                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    {property.management_type === 'GESTION' ? (
                                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                                    ) : (
                                        <HardHat className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {property.management_type === 'GESTION' ? 'Aucune intervention' : 'Aucun projet associé'}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {property.management_type === 'GESTION'
                                        ? "Il n'y a pas encore d'interventions de maintenance pour ce bien."
                                        : "Il n'y a pas encore de projets de développement pour ce bien."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
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
                                            className="group p-5 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-semibold group-hover:text-primary transition-colors pr-2 line-clamp-1">{project.name}</h4>
                                                <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                                    {project.status_display || project.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                                                {project.description || "Pas de description."}
                                            </p>
                                            <div className="mt-auto pt-3 border-t flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Euro className="h-3 w-3 text-green-500" />
                                                        <span>{project.budget ? `${Number(project.budget).toLocaleString('fr-FR')} €` : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-primary" />
                                                        <span>{project.start_date ? format(new Date(project.start_date), 'd MMM yy', { locale: fr }) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </Link>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="space-y-4 animate-fade-in pb-40">
                        <section>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <LayoutDashboard className="h-5 w-5 text-primary" />
                                        Pipeline Commercial
                                    </h3>
                                    <p className="text-xs text-muted-foreground italic">Suivi des offres et candidatures pour ce bien.</p>
                                </div>
                                {user?.role === 'ADMIN_MADIS' && (
                                    <button
                                        onClick={() => setShowTxModal(true)}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter une offre hors ligne
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {['DISPONIBLE', 'NEGOCIATION', 'SIGNE', 'ANNULE'].map((status) => {
                                    const count = property.transactions?.filter(t => t.status === status).length || 0;
                                    const icon = status === 'DISPONIBLE' ? <ClipboardList className="h-4 w-4" /> :
                                        status === 'NEGOCIATION' ? <MessageSquare className="h-4 w-4" /> :
                                            status === 'SIGNE' ? <CheckCircle2 className="h-4 w-4" /> :
                                                <XCircle className="h-4 w-4" />;

                                    const color = status === 'DISPONIBLE' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                        status === 'NEGOCIATION' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                            status === 'SIGNE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                "bg-rose-500/10 text-rose-500 border-rose-500/20";

                                    return (
                                        <div key={status} className={cn("p-4 rounded-xl border flex items-center justify-between shadow-sm", color)}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-background/50">
                                                    {icon}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{status === 'DISPONIBLE' ? 'Offres' : status === 'NEGOCIATION' ? 'Négos' : status === 'SIGNE' ? 'Signées' : 'Annulées'}</span>
                                            </div>
                                            <span className="text-xl font-black">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid gap-4">
                                {property.transactions && property.transactions.length > 0 ? (
                                    property.transactions
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .map((tx) => (
                                            <div key={tx.id} className="bg-card border rounded-xl p-5 shadow-sm hover:border-primary/30 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                            {tx.buyer_tenant_name?.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold flex items-center gap-2">
                                                                {tx.buyer_tenant_name}
                                                                {tx.status === 'SIGNE' && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <Clock className="h-3 w-3" />
                                                                Reçue le {format(new Date(tx.created_at), 'dd MMMM yyyy', { locale: fr })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right mr-4">
                                                            <div className="text-sm font-black text-primary">{Number(tx.asking_price).toLocaleString()}€</div>
                                                            {tx.final_price && tx.status === 'SIGNE' && (
                                                                <div className="text-[10px] font-bold text-emerald-600 italic">Prix acté: {Number(tx.final_price).toLocaleString()}€</div>
                                                            )}
                                                        </div>

                                                        {user?.role === 'ADMIN_MADIS' && (
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setStatusDropdown(statusDropdown === tx.id ? null : tx.id)}
                                                                    className={cn(
                                                                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all",
                                                                        tx.status === 'SIGNE' ? "bg-emerald-500 text-white" :
                                                                            tx.status === 'NEGOCIATION' ? "bg-orange-500 text-white" :
                                                                                tx.status === 'ANNULE' ? "bg-rose-500 text-white" :
                                                                                    "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border"
                                                                    )}
                                                                >
                                                                    {tx.status_display || tx.status}
                                                                    <ChevronDown className="h-3 w-3" />
                                                                </button>

                                                                {statusDropdown === tx.id && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-10" onClick={() => setStatusDropdown(null)} />
                                                                        <div className="absolute right-0 mt-2 w-48 bg-card border rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                                                                            {['DISPONIBLE', 'NEGOCIATION', 'SIGNE', 'ANNULE'].map((s) => (
                                                                                <button
                                                                                    key={s}
                                                                                    onClick={() => updateTxStatus(tx.id, s)}
                                                                                    className={cn(
                                                                                        "w-full text-left px-4 py-2 text-[10px] font-bold uppercase transition-colors hover:bg-muted truncate",
                                                                                        tx.status === s ? "text-primary bg-primary/5" : "text-muted-foreground"
                                                                                    )}
                                                                                >
                                                                                    {s}
                                                                                </button>
                                                                            ))}
                                                                            <div className="border-t mt-2 pt-2 px-2">
                                                                                <button
                                                                                    onClick={() => deleteTx(tx.id)}
                                                                                    className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
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
                                                    <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-dashed">
                                                        <p className="text-xs text-muted-foreground italic leading-relaxed">"{tx.notes}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                ) : (
                                    <div className="bg-card border border-dashed rounded-xl p-12 text-center">
                                        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <ClipboardList className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-md font-semibold mb-1">Aucune transaction</h3>
                                        <p className="text-muted-foreground text-xs">Il n'y a pas encore d'offres ou de transactions pour ce bien.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Documents associés</h3>
                            <div className="flex items-center gap-2">
                                {user?.role === 'ADMIN_MADIS' && (
                                    <>
                                        {isSelectionMode ? (
                                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                                <button
                                                    onClick={() => { setIsSelectionMode(false); setSelectedDocuments([]); }}
                                                    className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-2 py-1"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={selectAllFiltered}
                                                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline px-2 py-1"
                                                >
                                                    Tout sélectionner
                                                </button>
                                                <button
                                                    onClick={handleDeleteSelectedDocuments}
                                                    disabled={selectedDocuments.length === 0}
                                                    className="bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow-sm hover:bg-destructive/90 disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Supprimer ({selectedDocuments.length})
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsSelectionMode(true)}
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
                                            >
                                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                                Sélectionner
                                            </button>
                                        )}
                                        <Link
                                            to={`/dashboard/documents/new?propertyId=${id}`}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20 h-8 px-3"
                                        >
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            Ajouter un document
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {[
                                { id: 'all', label: 'Tous' },
                                { id: 'TITRE_PROPRIETE', label: 'Titres' },
                                { id: 'DIAGNOSTIC', label: 'Diags' },
                                { id: 'PLANS', label: 'Plans' },
                                { id: 'VERIF_FONCIERE', label: 'Vérification Foncière' },
                                { id: 'AUTRE', label: 'Autres' }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setDocumentFilter(f.id)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                                        documentFilter === f.id
                                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                            : "bg-background text-muted-foreground hover:border-primary/50"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {loadingDocuments ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="bg-card border border-dashed rounded-xl p-12 text-center">
                                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Aucun document</h3>
                                <p className="text-muted-foreground text-sm">Il n'y a pas encore de documents pour cette catégorie.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredDocuments.map((doc) => (
                                    <div key={doc.id} className="group p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col">
                                        <div className="flex items-start gap-3 mb-4">
                                            {isSelectionMode && (
                                                <div
                                                    onClick={() => toggleDocumentSelection(doc.id)}
                                                    className={cn(
                                                        "mt-1 w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors",
                                                        selectedDocuments.includes(doc.id)
                                                            ? "bg-primary border-primary text-white"
                                                            : "bg-background border-input"
                                                    )}
                                                >
                                                    {selectedDocuments.includes(doc.id) && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                                </div>
                                            )}
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{doc.title}</h4>
                                                    {!isSelectionMode && user?.role === 'ADMIN_MADIS' && (
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); handleDeleteDocument(doc.id); }}
                                                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{doc.category_display || doc.category}</p>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-3 border-t flex items-center justify-between">
                                            <span className="text-[10px] text-muted-foreground">{format(new Date(doc.uploaded_at || new Date()), 'dd/MM/yy', { locale: fr })}</span>
                                            <a
                                                href={doc.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-primary hover:underline transition-all"
                                            >
                                                <Download className="h-3 w-3" />
                                                Télécharger
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

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

        </div>
    );
}
