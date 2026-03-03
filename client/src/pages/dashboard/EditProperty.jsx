import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import {
    ArrowLeft, Building, Loader2, Save, Ruler, MapPin,
    Image as ImageIcon, X, Tag, ShoppingBag, Briefcase,
    Euro, Settings, HardHat, Home, Percent, User,
    Calendar, Wrench, Sofa, ShieldCheck, Globe, Coins, Hash, Bed,
    Building2, Warehouse, Store, Trees, Hotel
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const PROPERTY_CATEGORIES = (t) => [
    { value: 'RESIDENTIEL', label: t('properties.category.residentiel'), icon: Building },
    { value: 'COMMERCIAL', label: t('properties.category.commercial'), icon: ShoppingBag },
    { value: 'PROFESSIONNEL', label: t('properties.category.professionnel'), icon: Briefcase },
];

const MAIN_CATEGORIES = (t) => [
    {
        value: 'MANAGED',
        label: t('properties.main_categories.managed'),
        icon: ShieldCheck,
        description: t('properties.main_categories.managed_desc'),
        color: 'blue',
    },
    {
        value: 'CONSTRUCTION',
        label: t('properties.main_categories.construction'),
        icon: HardHat,
        description: t('properties.main_categories.construction_desc'),
        color: 'rose',
    },
];

const MANAGEMENT_TYPES = (t) => [
    {
        value: 'MANDAT',
        label: t('properties.management_types.sale'),
        icon: Tag,
        description: t('properties.management_types.sale_desc'),
    },
    {
        value: 'GESTION',
        label: t('properties.management_types.rent'),
        icon: Home,
        description: t('properties.management_types.rent_desc'),
    },
];

const PROPERTY_TYPES_BY_CATEGORY = (t) => ({
    RESIDENTIEL: [
        { value: 'APPARTEMENT', label: t('properties.property_type.appartement') },
        { value: 'MAISON', label: t('properties.property_type.maison') },
        { value: 'VILLA', label: t('properties.property_type.villa') },
    ],
    COMMERCIAL: [
        { value: 'BOUTIQUE', label: t('properties.property_type.boutique') },
        { value: 'ENTREPOT', label: t('properties.property_type.entrepot') },
        { value: 'LOCAL_ACTIVITE', label: t('properties.property_type.local_activite') },
    ],
    PROFESSIONNEL: [
        { value: 'BUREAU', label: t('properties.property_type.bureau') },
        { value: 'LOCAL_ACTIVITE', label: t('properties.property_type.local_activite') },
    ],
    GLOBAL: [
        { value: 'TERRAIN', label: t('properties.property_type.terrain') },
        { value: 'IMMEUBLE', label: t('properties.property_type.immeuble') },
        { value: 'AUTRE', label: t('properties.property_type.autre') },
    ]
});

export default function EditProperty() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [users, setUsers] = useState([]);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [mainCategory, setMainCategory] = useState('MANAGED');
    const [activeTab, setActiveTab] = useState('INFO'); // INFO, SPECS, FINANCE, MEDIA

    const TABS = [
        { id: 'INFO', label: t('properties.form_tabs.info'), shortLabel: t('properties.form_tabs.info_short'), icon: User },
        { id: 'SPECS', label: t('properties.form_tabs.specs'), shortLabel: t('properties.form_tabs.specs_short'), icon: Ruler },
        { id: 'FINANCE', label: t('properties.form_tabs.finance'), shortLabel: t('properties.form_tabs.finance_short'), icon: Euro },
        { id: 'MEDIA', label: t('properties.form_tabs.media'), shortLabel: t('properties.form_tabs.media_short'), icon: ImageIcon },
    ];

    const [formData, setFormData] = useState({
        name: '',
        category: 'RESIDENTIEL',
        transaction_nature: 'VENTE',
        management_type: 'MANDAT',
        address: '',
        city: '',
        postal_code: '',
        property_type: 'APPARTEMENT',
        surface: '',
        room_count: '',
        bedroom_count: '',
        status: 'DISPONIBLE',
        owner: '',
        description: '',
        prix_vente: '',
        negociable: false,
        frais_acquisition_annexes: '',
        loyer_mensuel: '',
        prix_nuitee: '',
        charges_mensuelles: '',
        depot_garantie: '',
        meuble: false,
        budget_total: '',
        date_debut_travaux: '',
        date_fin_prevue: '',
        nom_entrepreneur: '',
        commission_type: 'POURCENTAGE',
        commission_rate: '',
        commission_fixe: '',
        date_acquisition: '',
        prix_acquisition: '',
        devise_origine: 'EUR',
        is_verified_fonciere: false,
    });

    useEffect(() => {
        if (id && id !== 'new') {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setFetching(true);
        try {
            const [usersRes, propertyRes] = await Promise.all([
                api.get('/auth/users/'),
                api.get(`/properties/${id}/`)
            ]);

            setUsers(usersRes.data.results || []);

            const prop = propertyRes.data;
            setFormData({
                name: prop.name || '',
                category: prop.category || 'RESIDENTIEL',
                transaction_nature: prop.transaction_nature || 'VENTE',
                management_type: prop.management_type || 'MANDAT',
                address: prop.address || '',
                city: prop.city || '',
                postal_code: prop.postal_code || '',
                property_type: prop.property_type || 'APPARTEMENT',
                surface: prop.surface || '',
                room_count: prop.room_count || '',
                bedroom_count: prop.bedroom_count || '',
                status: prop.status || 'DISPONIBLE',
                owner: prop.owner || '',
                description: prop.description || '',
                prix_vente: prop.prix_vente || '',
                negociable: prop.negociable || false,
                frais_acquisition_annexes: prop.frais_acquisition_annexes || '',
                loyer_mensuel: prop.loyer_mensuel || '',
                prix_nuitee: prop.prix_nuitee || '',
                charges_mensuelles: prop.charges_mensuelles || '',
                depot_garantie: prop.depot_garantie || '',
                meuble: prop.meuble || false,
                budget_total: prop.budget_total || '',
                date_debut_travaux: prop.date_debut_travaux || '',
                date_fin_prevue: prop.date_fin_prevue || '',
                nom_entrepreneur: prop.nom_entrepreneur || '',
                commission_type: prop.commission_type || 'POURCENTAGE',
                commission_rate: prop.commission_rate || '',
                commission_fixe: prop.commission_fixe || '',
                date_acquisition: prop.date_acquisition || '',
                prix_acquisition: prop.prix_acquisition || '',
                devise_origine: prop.devise_origine || 'EUR',
                is_verified_fonciere: prop.is_verified_fonciere || false,
            });
            setMainCategory(prop.management_type === 'CONSTRUCTION' ? 'CONSTRUCTION' : 'MANAGED');
            setExistingImages(prop.images || []);
        } catch (err) {
            console.error('Failed to fetch data', err);
            showToast({ message: 'Impossible de charger les données du bien.', type: 'error' });
            navigate('/dashboard/properties');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            const compat = [...(PROPERTY_TYPES_BY_CATEGORY(t)[value] || []).map(t => t.value), ...PROPERTY_TYPES_BY_CATEGORY(t).GLOBAL.map(t => t.value)];
            const update = { [name]: value };
            if (!compat.includes(formData.property_type)) {
                update.property_type = PROPERTY_TYPES_BY_CATEGORY(t)[value]?.[0]?.value || 'AUTRE';
            }
            setFormData(prev => ({ ...prev, ...update }));
        } else if (name === 'management_type') {
            const isVente = value === 'MANDAT';
            setFormData(prev => ({
                ...prev,
                management_type: value,
                transaction_nature: isVente ? 'VENTE' : 'LOCATION',
                status: isVente ? 'DISPONIBLE' : 'LOUE',
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleMainCategorySelect = (val) => {
        setMainCategory(val);
        if (val === 'CONSTRUCTION') {
            setFormData(prev => ({ ...prev, management_type: 'CONSTRUCTION', transaction_nature: 'VENTE', status: 'EN_COURS' }));
        } else {
            setFormData(prev => ({ ...prev, management_type: 'MANDAT', transaction_nature: 'VENTE', status: 'DISPONIBLE' }));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setImages(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeNewImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index]);
            return newPreviews;
        });
    };

    const removeExistingImage = async (imageId) => {
        if (window.confirm('Supprimer cette photo ?')) {
            try {
                await api.delete(`/properties/images/${imageId}/`);
                setExistingImages(prev => prev.filter(img => img.id !== imageId));
                showToast({ message: 'Photo supprimée', type: 'success' });
            } catch (err) {
                showToast({ message: 'Erreur lors de la suppression', type: 'error' });
            }
        }
    };

    const validateStep = (step) => {
        if (mainCategory === 'CONSTRUCTION' && step === 'FINANCE') return true; // Construction has its own optional fields

        const requiredFields = {
            INFO: ['name', 'owner', 'address', 'city'],
            SPECS: ['surface'],
            FINANCE: formData.transaction_nature === 'VENTE' ? ['prix_vente'] : ['loyer_mensuel']
        };

        const fieldsToValidate = requiredFields[step] || [];
        const missingFields = fieldsToValidate.filter(field => !formData[field] || formData[field] === '');

        if (missingFields.length > 0) {
            const fieldLabels = {
                name: t('properties.details.name') || 'Nom du bien',
                owner: t('properties.owner') || 'Propriétaire',
                address: t('property_detail.details.address') || 'Adresse',
                city: t('property_detail.details.city') || 'Ville',
                surface: t('property_detail.details.surface') || 'Surface',
                prix_vente: t('property_detail.details.sale_price') || 'Prix de vente',
                loyer_mensuel: t('property_detail.details.rent') || 'Loyer mensuel'
            };
            const labels = missingFields.map(f => fieldLabels[f]).join(', ');
            showToast({
                message: `${t('common.error_required_fields') || 'Champs obligatoires manquants'} : ${labels}`,
                type: 'error'
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation of all required steps before final submission
        if (!validateStep('INFO') || !validateStep('SPECS') || !validateStep('FINANCE')) {
            return;
        }

        // Double security: prevent submission if not on final tab
        if (activeTab !== 'MEDIA') return;

        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                data.append(key, formData[key]);
            }
        });

        images.forEach(image => {
            data.append('uploaded_images', image);
        });

        try {
            await api.patch(`/properties/${id}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast({ message: t('properties.messages.update_success') || 'Bien mis à jour avec succès !', type: 'success' });
            navigate(`/dashboard/properties/${id}`);
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de la mise à jour.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleNextTab = () => {
        if (validateStep(activeTab)) {
            const currentIndex = TABS.findIndex(t => t.id === activeTab);
            if (currentIndex < TABS.length - 1) {
                setActiveTab(TABS[currentIndex + 1].id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const handlePrevTab = () => {
        const currentIndex = TABS.findIndex(t => t.id === activeTab);
        if (currentIndex > 0) {
            setActiveTab(TABS[currentIndex - 1].id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const inputClasses = "flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/50 hover:bg-accent/5";

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12 animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/dashboard/properties')}
                    className="p-3 bg-card border border-border/50 rounded-full hover:bg-muted/80 transition-all group shadow-sm"
                >
                    <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                        {t('common.edit') || 'Modifier'} <span className="text-primary relative inline-block">
                            {formData.name || t('properties.property_singular') || 'Bien Immobilier'}
                            <svg className="absolute -bottom-2 left-0 w-full h-2 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2 flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-primary/50 rounded-full inline-block"></span>
                        {t('properties.update_subtitle') || 'Mettre à jour les informations du bien'}
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>

                {/* Tab Navigation */}
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="flex border-b border-border/50 bg-muted/20 [&::-webkit-scrollbar]:hidden">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    const targetIndex = TABS.findIndex(t => t.id === tab.id);
                                    const currentIndex = TABS.findIndex(t => t.id === activeTab);

                                    // Always allowed to go backwards
                                    if (targetIndex < currentIndex) {
                                        setActiveTab(tab.id);
                                        return;
                                    }

                                    // Check all steps from current up to target-1
                                    for (let i = currentIndex; i < targetIndex; i++) {
                                        if (!validateStep(TABS[i].id)) {
                                            setActiveTab(TABS[i].id);
                                            return;
                                        }
                                    }

                                    setActiveTab(tab.id);
                                }}
                                className={cn(
                                    "flex-none px-4 md:px-6 flex items-center justify-center gap-2 md:gap-3 py-4 md:py-6 text-[9px] md:text-xs font-black uppercase tracking-wider md:tracking-widest transition-all relative group whitespace-nowrap",
                                    isActive ? "text-primary bg-background/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 md:p-2 rounded-lg transition-all duration-300 hidden md:flex",
                                    isActive ? "bg-primary/10 text-primary scale-110" : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:scale-105"
                                )}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span>
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.shortLabel}</span>
                                </span>
                                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_-2px_10px_rgba(var(--primary),0.5)]" />}
                            </button>
                        );
                    })}
                </div>

                <div className="p-4 sm:p-8 lg:p-12 min-h-[500px] sm:min-h-[600px] flex flex-col">
                    <form id="edit-property-form" onSubmit={handleSubmit} className="h-full flex flex-col">
                        <div className="flex-1">
                            {activeTab === 'INFO' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* ═══ NATURE DU PROJET ═══ */}
                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-3">
                                            <span className="p-1.5 bg-primary/10 rounded-md"><Settings className="h-3.5 w-3.5 text-primary" /></span>
                                            {t('properties.project_nature') || 'Nature du Projet'}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {MAIN_CATEGORIES(t).map(cat => {
                                                const isActive = mainCategory === cat.value;
                                                const activeStyle = cat.color === 'blue'
                                                    ? "border-blue-500/50 bg-blue-500/5 ring-2 ring-blue-500/20"
                                                    : "border-primary/50 bg-primary/5 ring-2 ring-primary/20";

                                                return (
                                                    <button
                                                        key={cat.value}
                                                        type="button"
                                                        onClick={() => handleMainCategorySelect(cat.value)}
                                                        className={cn(
                                                            "group flex items-center gap-6 rounded-2xl border transition-all p-6 text-left relative overflow-hidden hover:border-foreground/20",
                                                            isActive ? activeStyle : "border-border/50 bg-muted/20"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "p-4 rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                                                            isActive
                                                                ? (cat.color === 'blue' ? "bg-blue-500 text-white shadow-blue-500/20" : "bg-primary text-white shadow-primary/20")
                                                                : "bg-background border border-border/50 text-muted-foreground"
                                                        )}>
                                                            <cat.icon className="h-8 w-8" />
                                                        </div>
                                                        <div className="flex-1 z-10">
                                                            <div className="text-lg font-black uppercase tracking-tight mb-1">{cat.label}</div>
                                                            <div className="text-sm text-muted-foreground font-medium opacity-80">{cat.description}</div>
                                                        </div>
                                                        {isActive && <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px]" />}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {mainCategory === 'MANAGED' && (
                                            <div className="flex flex-wrap gap-4 pt-2">
                                                {MANAGEMENT_TYPES(t).map(mt => {
                                                    const isActive = formData.management_type === mt.value;
                                                    return (
                                                        <button
                                                            key={mt.value}
                                                            type="button"
                                                            onClick={() => handleChange({ target: { name: 'management_type', value: mt.value } })}
                                                            className={cn(
                                                                "flex items-center gap-3 rounded-xl border transition-all px-5 py-3 shadow-sm",
                                                                isActive
                                                                    ? "border-primary/50 bg-primary/10 text-primary ring-1 ring-primary/20"
                                                                    : "border-border/50 bg-background hover:bg-accent/50 text-muted-foreground"
                                                            )}
                                                        >
                                                            <mt.icon className={cn("h-4 w-4", isActive && "fill-primary/20")} />
                                                            <span className="text-xs font-black uppercase tracking-widest">{mt.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full h-px bg-border/50" />

                                    {/* GENERAL INFO */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {/* Sub-Card: IDENTITY */}
                                        <div className="space-y-6">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-3">
                                                <span className="p-1.5 bg-primary/10 rounded-md"><User className="h-3.5 w-3.5 text-primary" /></span>
                                                Identification
                                            </h3>

                                            <div className="bg-muted/10 rounded-3xl p-8 space-y-8 border border-border/50 relative overflow-hidden group hover:border-primary/20 transition-colors">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />

                                                {/* Owner Selection - Premium Card Style */}
                                                <div className="relative z-10">
                                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <User className="h-3 w-3 text-primary" /> Propriétaire <span className="text-primary">*</span>
                                                    </label>
                                                    <div className="relative group/select">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary z-20 pointer-events-none group-focus-within/select:bg-primary group-focus-within/select:text-white transition-colors">
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                        <select
                                                            name="owner"
                                                            required
                                                            className={cn(
                                                                inputClasses,
                                                                "h-16 pl-16 pr-10 text-base font-bold appearance-none cursor-pointer hover:bg-muted/50 transition-colors border-dashed border-2 bg-muted/5 focus:border-solid focus:bg-background"
                                                            )}
                                                            value={formData.owner}
                                                            onChange={handleChange}
                                                        >
                                                            <option value="">{t('properties.select_client') || 'Sélectionner un client...'}</option>
                                                            {users.filter(u => u.role === 'CLIENT').map(u => (
                                                                <option key={u.id} value={u.id}>{u.last_name?.toUpperCase()} {u.first_name} ({u.email})</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-focus-within/select:opacity-100 transition-opacity">
                                                            <ArrowLeft className="h-5 w-5 -rotate-90 text-primary" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid gap-6 relative z-10">
                                                    <div className="grid gap-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                            <Tag className="h-3 w-3 text-primary" /> {t('properties.details.name') || 'Nom du bien'} <span className="text-primary">*</span>
                                                        </label>
                                                        <input type="text" name="name" required className={inputClasses} placeholder={t('properties.details.name_ph') || "Ex: Résidence Les Lilas..."} value={formData.name} onChange={handleChange} />
                                                    </div>

                                                    <div className="grid gap-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                            <Coins className="h-3 w-3 text-primary" /> {t('finance.add_transaction.currency') || 'Devise'}
                                                        </label>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            {['EUR', 'USD', 'GNF', 'XAF', 'AED', 'CNY', 'GBP'].map((curr) => (
                                                                <button
                                                                    key={curr}
                                                                    type="button"
                                                                    onClick={() => handleChange({ target: { name: 'devise_origine', value: curr } })}
                                                                    className={cn(
                                                                        "flex items-center justify-center py-3 rounded-xl border text-xs font-black transition-all",
                                                                        formData.devise_origine === curr
                                                                            ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                                            : "border-border/50 bg-background hover:bg-muted text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {curr}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sub-Card: LOCATION */}
                                        <div className="space-y-6">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-3">
                                                <span className="p-1.5 bg-primary/10 rounded-md"><MapPin className="h-3.5 w-3.5 text-primary" /></span>
                                                {t('construction.detail.overview.location') || 'Localisation'}
                                            </h3>

                                            <div className="bg-muted/10 rounded-3xl p-8 space-y-6 border border-border/50 relative overflow-hidden group hover:border-primary/20 transition-colors">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />

                                                <div className="grid gap-3 relative z-10">
                                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                        <MapPin className="h-3 w-3 text-primary" /> {t('construction_modal.label_address')} <span className="text-primary">*</span>
                                                    </label>
                                                    <input type="text" name="address" required className={inputClasses} placeholder={t('construction_modal.ph_address')} value={formData.address} onChange={handleChange} />
                                                </div>

                                                <div className="grid grid-cols-2 gap-5 relative z-10">
                                                    <div className="grid gap-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                            <Building className="h-3 w-3 text-primary" /> {t('construction_modal.label_city')} <span className="text-primary">*</span>
                                                        </label>
                                                        <input type="text" name="city" required className={inputClasses} placeholder={t('construction_modal.ph_city')} value={formData.city} onChange={handleChange} />
                                                    </div>
                                                    <div className="grid gap-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                            <Hash className="h-3 w-3 text-primary" /> {t('construction_modal.label_postal')}
                                                        </label>
                                                        <input type="text" name="postal_code" className={inputClasses} placeholder={t('construction_modal.ph_postal')} value={formData.postal_code} onChange={handleChange} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'SPECS' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-3">
                                                <span className="p-1.5 bg-primary/10 rounded-md"><Ruler className="h-3.5 w-3.5 text-primary" /></span>
                                                {t('property_detail.tabs.details') || 'Spécifications'}
                                            </h3>

                                            <div className="space-y-6">
                                                <div className="grid gap-3">
                                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('properties.category_label') || 'Catégorie'}</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {PROPERTY_CATEGORIES(t).map(cat => (
                                                            <button
                                                                key={cat.value}
                                                                type="button"
                                                                onClick={() => handleChange({ target: { name: 'category', value: cat.value } })}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                                                                    formData.category === cat.value
                                                                        ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5"
                                                                        : "border-border/50 bg-background hover:bg-muted/50 hover:border-foreground/20 text-muted-foreground"
                                                                )}
                                                            >
                                                                <cat.icon className="h-5 w-5" />
                                                                <span className="text-[10px] font-black uppercase">{cat.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="grid gap-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.surface')} (m²) <span className="text-primary">*</span></label>
                                                        <input type="number" name="surface" required className={inputClasses} placeholder="0.00" value={formData.surface} onChange={handleChange} />
                                                    </div>
                                                </div>

                                                <div className="grid gap-3">
                                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.type') || 'Type de bien'}</label>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                                        {[...(PROPERTY_TYPES_BY_CATEGORY(t)[formData.category] || []), ...PROPERTY_TYPES_BY_CATEGORY(t).GLOBAL].map(type => {
                                                            const Icon = {
                                                                APPARTEMENT: Building2,
                                                                MAISON: Home,
                                                                VILLA: Hotel,
                                                                BOUTIQUE: Store,
                                                                ENTREPOT: Warehouse,
                                                                LOCAL_ACTIVITE: Briefcase,
                                                                BUREAU: Briefcase,
                                                                TERRAIN: Trees,
                                                                IMMEUBLE: Building,
                                                                AUTRE: Settings
                                                            }[type.value] || Building;

                                                            const isSelected = formData.property_type === type.value;

                                                            return (
                                                                <button
                                                                    key={type.value}
                                                                    type="button"
                                                                    onClick={() => handleChange({ target: { name: 'property_type', value: type.value } })}
                                                                    className={cn(
                                                                        "relative flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all hover:scale-[1.02] min-h-[90px]",
                                                                        isSelected
                                                                            ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10"
                                                                            : "border-border/50 bg-background text-muted-foreground hover:bg-muted/30 hover:border-border"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "p-2 rounded-full transition-colors",
                                                                        isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                                                    )}>
                                                                        <Icon className="h-4 w-4" />
                                                                    </div>
                                                                    <span className="text-[9px] font-bold uppercase text-center leading-tight tracking-tighter px-0.5">{type.label}</span>
                                                                    {isSelected && (
                                                                        <div className="absolute top-1.5 right-1.5">
                                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-3">
                                                <span className="p-1.5 bg-primary/10 rounded-md"><Bed className="h-3.5 w-3.5 text-primary" /></span>
                                                {t('property_detail.tabs.photos') || 'Médias'}
                                            </h3>

                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="grid gap-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.rooms') || 'Pièces (Total)'}</label>
                                                        <input type="number" name="room_count" className={inputClasses} placeholder="0" value={formData.room_count} onChange={handleChange} />
                                                    </div>
                                                    <div className="grid gap-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.bedrooms') || 'Chambres'}</label>
                                                        <input type="number" name="bedroom_count" className={inputClasses} placeholder="0" value={formData.bedroom_count} onChange={handleChange} />
                                                    </div>
                                                </div>

                                                <label className={cn(
                                                    "flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all group",
                                                    formData.is_verified_fonciere
                                                        ? "bg-emerald-500/10 border-emerald-500/50"
                                                        : "bg-muted/10 border-border/50 hover:border-primary/30"
                                                )}>
                                                    <div className={cn(
                                                        "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                                                        formData.is_verified_fonciere ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        <ShieldCheck className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={cn("text-sm font-black uppercase tracking-wide", formData.is_verified_fonciere ? "text-emerald-500" : "text-foreground")}>{t('property_detail.details.land_verification') || 'Vérification Foncière'}</div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">{t('property_detail.details.land_verification_desc') || 'Le titre foncier a été vérifié par MaDis'}</div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.is_verified_fonciere}
                                                        onChange={e => setFormData(p => ({ ...p, is_verified_fonciere: e.target.checked }))}
                                                        className="h-6 w-6 accent-emerald-500 rounded cursor-pointer"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'FINANCE' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-3">
                                                <span className="p-1.5 bg-primary/10 rounded-md"><Euro className="h-3.5 w-3.5 text-primary" /></span>
                                                {t('property_detail.tabs.finance') || 'Données Financières'}
                                            </h3>

                                            <div className="bg-muted/10 rounded-3xl p-8 border border-border/50">
                                                {formData.management_type === 'CONSTRUCTION' ? (
                                                    <div className="grid gap-6">
                                                        <div className="grid gap-3">
                                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.budget_travaux') || 'Budget Travaux (Estimé)'}</label>
                                                            <div className="relative">
                                                                <input type="number" name="budget_total" className={cn(inputClasses, "pl-12 text-lg font-bold shadow-inner")} placeholder="0.00" value={formData.budget_total} onChange={handleChange} />
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-sm flex items-center gap-1">
                                                                    <Euro className="h-4 w-4" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div className="grid gap-3">
                                                                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.date_start') || 'Date Début'}</label>
                                                                <input type="date" name="date_debut_travaux" className={inputClasses} value={formData.date_debut_travaux} onChange={handleChange} />
                                                            </div>
                                                            <div className="grid gap-3">
                                                                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.date_end_est') || 'Fin Prévue'}</label>
                                                                <input type="date" name="date_fin_prevue" className={inputClasses} value={formData.date_fin_prevue} onChange={handleChange} />
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-3">
                                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.contractor') || 'Entrepreneur Principal'}</label>
                                                            <input type="text" name="nom_entrepreneur" className={inputClasses} placeholder={t('property_detail.details.contractor_ph') || "Nom de l'entreprise ou de l'entrepreneur"} value={formData.nom_entrepreneur} onChange={handleChange} />
                                                        </div>
                                                    </div>
                                                ) : formData.transaction_nature === 'VENTE' ? (
                                                    <div className="grid gap-6">
                                                        <div className="grid gap-3">
                                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.sale_price')} <span className="text-primary">*</span></label>
                                                            <div className="relative">
                                                                <input type="number" name="prix_vente" required className={cn(inputClasses, "pl-12 text-lg font-bold shadow-inner")} placeholder="0.00" value={formData.prix_vente} onChange={handleChange} />
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-sm flex items-center gap-1">
                                                                    <Euro className="h-4 w-4" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:bg-muted/20 cursor-pointer group transition-all">
                                                            <input type="checkbox" checked={formData.negociable} onChange={e => setFormData(p => ({ ...p, negociable: e.target.checked }))} className="accent-primary h-5 w-5 rounded" />
                                                            <span className="text-xs font-black uppercase tracking-wider group-hover:text-primary transition-colors">{t('property_detail.details.negotiable') || 'Prix négociable'}</span>
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-6">
                                                        <div className="grid gap-3">
                                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.rent')} <span className="text-primary">*</span></label>
                                                            <div className="relative">
                                                                <input type="number" name="loyer_mensuel" required className={cn(inputClasses, "pl-12 text-lg font-bold shadow-inner")} placeholder="0.00" value={formData.loyer_mensuel} onChange={handleChange} />
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-sm flex items-center gap-1">
                                                                    <Euro className="h-4 w-4" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-3">
                                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('property_detail.details.night_price') || 'Prix Nuitée (Optionnel)'}</label>
                                                            <div className="relative">
                                                                <input type="number" name="prix_nuitee" className={cn(inputClasses, "pl-12")} placeholder="0.00" value={formData.prix_nuitee} onChange={handleChange} />
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm flex items-center gap-1">
                                                                    <Euro className="h-4 w-4" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-3">
                                                <span className="p-1.5 bg-primary/10 rounded-md"><Percent className="h-3.5 w-3.5 text-primary" /></span>
                                                {t('property_detail.details.commission') || 'Commission MaDis'}
                                            </h3>

                                            <div className="bg-muted/10 rounded-3xl p-8 border border-border/50 space-y-6">
                                                <div className="p-1 bg-background border border-border/50 rounded-xl flex gap-1">
                                                    <button type="button" onClick={() => setFormData(p => ({ ...p, commission_type: 'POURCENTAGE' }))} className={cn("flex-1 py-2.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all", formData.commission_type === 'POURCENTAGE' ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:bg-muted")}>{t('property_detail.details.percentage') || 'Pourcentage'}</button>
                                                    <button type="button" onClick={() => setFormData(p => ({ ...p, commission_type: 'FIXE' }))} className={cn("flex-1 py-2.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all", formData.commission_type === 'FIXE' ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:bg-muted")}>{t('property_detail.details.fixed_amount') || 'Montant Fixe'}</button>
                                                </div>

                                                {formData.commission_type === 'POURCENTAGE' ? (
                                                    <div className="relative">
                                                        <input type="number" name="commission_rate" placeholder="0.0" className={cn(inputClasses, "pl-12 text-lg font-bold")} value={formData.commission_rate} onChange={handleChange} />
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-sm">%</div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input type="number" name="commission_fixe" placeholder="0.00" className={cn(inputClasses, "pl-12 text-lg font-bold")} value={formData.commission_fixe} onChange={handleChange} />
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-sm"><Euro className="h-4 w-4" /></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-border/50 space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-3">
                                            <span className="p-1.5 bg-primary/10 rounded-md"><Tag className="h-3.5 w-3.5 text-primary" /></span>
                                            {t('property_detail.details.commercial_presentation') || 'Présentation Commerciale'}
                                        </h3>
                                        <textarea name="description" rows="6" className={cn(inputClasses, "h-auto py-4 leading-relaxed resize-none")} placeholder={t('property_detail.details.commercial_desc_ph') || "Rédigez une description captivante pour les futurs acquéreurs ou locataires..."} value={formData.description} onChange={handleChange} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'MEDIA' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div
                                        className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl h-80 bg-muted/5 relative cursor-pointer hover:bg-muted/10 hover:border-primary/50 transition-all group overflow-hidden"
                                    >
                                        <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={handleImageChange} />
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity z-0" />

                                        <div className="relative z-10 text-center transform group-hover:scale-110 transition-transform duration-300">
                                            <div className="h-20 w-20 bg-background rounded-full shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:shadow-primary/20">
                                                <ImageIcon className="h-8 w-8 text-primary" />
                                            </div>
                                            <span className="text-lg font-black text-foreground uppercase tracking-widest block">{t('property_detail.details.drag_drop_photos') || 'Glisser-déposer vos photos'}</span>
                                            <span className="text-xs text-muted-foreground font-medium mt-3 block px-4 py-1.5 bg-background/50 rounded-full border border-border/50 inline-block">JPG, PNG, WEBP • Max 10MB</span>
                                        </div>
                                    </div>

                                    {(previews.length > 0 || existingImages.length > 0) && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                            {existingImages.map(img => (
                                                <div key={img.id} className="relative aspect-[4/3] rounded-2xl border border-border/50 overflow-hidden group shadow-md hover:shadow-xl transition-all">
                                                    <img src={img.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                        <button type="button" onClick={() => removeExistingImage(img.id)} className="bg-white/10 hover:bg-red-500 text-white p-3 rounded-full backdrop-blur-md transition-all transform hover:scale-110 hover:rotate-90">
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {previews.map((p, i) => (
                                                <div key={i} className="relative aspect-[4/3] rounded-2xl border border-border/50 overflow-hidden group shadow-md hover:shadow-xl transition-all">
                                                    <img src={p} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                        <button type="button" onClick={() => removeNewImage(i)} className="bg-white/10 hover:bg-red-500 text-white p-3 rounded-full backdrop-blur-md transition-all transform hover:scale-110 hover:rotate-90">
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer Navigation - Sticky on mobile */}
                <div className="sticky bottom-0 flex items-center justify-between p-4 sm:p-6 border-t border-border/50 bg-background/80 dark:bg-zinc-900/90 backdrop-blur-md z-30">
                    <div>
                        {activeTab !== 'INFO' && (
                            <button
                                type="button"
                                onClick={handlePrevTab}
                                className="inline-flex items-center justify-center rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest bg-background border border-input shadow-sm hover:bg-accent hover:text-accent-foreground transition-all h-10 sm:h-12 px-4 sm:px-8"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2 sm:hidden" />
                                <span className="hidden sm:inline">{t('common.back') || 'Précédent'}</span>
                                <span className="sm:hidden">{t('common.return') || 'Retour'}</span>
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/properties')}
                            className="hidden sm:inline-flex items-center justify-center rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all h-12 px-6"
                        >
                            {t('common.cancel') || 'Annuler'}
                        </button>
                        {activeTab !== 'MEDIA' ? (
                            <button
                                type="button"
                                onClick={handleNextTab}
                                className="inline-flex items-center justify-center rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest bg-foreground text-background dark:bg-primary dark:text-white hover:bg-foreground/90 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all h-10 sm:h-12 px-6 sm:px-10"
                            >
                                {t('common.next') || 'Suivant'}
                            </button>
                        ) : (
                            <button form="edit-property-form" type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:bg-primary/90 hover:translate-y-[-2px] transition-all h-10 sm:h-12 px-6 sm:px-12 disabled:opacity-50 disabled:translate-y-0">
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.uploading') || 'Transfert...'}</> : <><Save className="mr-2 h-4 w-4" /> {t('common.save') || 'Enregistrer'}</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
