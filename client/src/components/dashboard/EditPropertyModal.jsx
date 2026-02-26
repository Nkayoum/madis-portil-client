import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Building, Loader2, Save, Ruler, MapPin, Image as ImageIcon, X, Tag, ShoppingBag, Briefcase, Euro, Settings, HardHat, Home, Percent, User, Calendar, Wrench, Sofa, ShieldCheck, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

const PROPERTY_CATEGORIES = [
    { value: 'RESIDENTIEL', label: 'Résidentiel', icon: Building },
    { value: 'COMMERCIAL', label: 'Commercial', icon: ShoppingBag },
    { value: 'PROFESSIONNEL', label: 'Professionnel', icon: Briefcase },
];

const MAIN_CATEGORIES = [
    {
        value: 'MANAGED',
        label: 'Gestion de Patrimoine',
        icon: ShieldCheck,
        description: 'Actifs immobiliers sous gestion (Vente ou Location).',
        color: 'blue',
    },
    {
        value: 'CONSTRUCTION',
        label: 'Suivi de chantier',
        icon: HardHat,
        description: 'Bien avec un projet de construction en cours.',
        color: 'rose',
    },
];

const MANAGEMENT_TYPES = [
    {
        value: 'MANDAT',
        label: 'À Vendre (Mandat)',
        icon: Tag,
        description: 'Mandat MaDis pour la vente du bien.',
    },
    {
        value: 'GESTION',
        label: 'À Louer (Gestion)',
        icon: Home,
        description: 'Confier le bien pour la gestion locative.',
    },
];

const PROPERTY_TYPES_BY_CATEGORY = {
    RESIDENTIEL: [
        { value: 'APPARTEMENT', label: 'Appartement' },
        { value: 'MAISON', label: 'Maison' },
        { value: 'VILLA', label: 'Villa' },
    ],
    COMMERCIAL: [
        { value: 'BOUTIQUE', label: 'Boutique / Commerce' },
        { value: 'ENTREPOT', label: 'Entrepôt' },
        { value: 'LOCAL_ACTIVITE', label: "Local d'activité" },
    ],
    PROFESSIONNEL: [
        { value: 'BUREAU', label: 'Bureau' },
        { value: 'LOCAL_ACTIVITE', label: "Local d'activité" },
    ],
    GLOBAL: [
        { value: 'TERRAIN', label: 'Terrain' },
        { value: 'IMMEUBLE', label: 'Immeuble' },
        { value: 'AUTRE', label: 'Autre' },
    ]
};

export default function EditPropertyModal({ isOpen, onClose, propertyId, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [users, setUsers] = useState([]);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [mainCategory, setMainCategory] = useState('MANAGED');

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
        if (isOpen && propertyId) {
            fetchData();
        }
    }, [isOpen, propertyId]);

    const fetchData = async () => {
        setFetching(true);
        try {
            const [usersRes, propertyRes] = await Promise.all([
                api.get('/auth/users/'),
                api.get(`/properties/${propertyId}/`)
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
            onClose();
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            const compat = [...(PROPERTY_TYPES_BY_CATEGORY[value] || []).map(t => t.value), ...PROPERTY_TYPES_BY_CATEGORY.GLOBAL.map(t => t.value)];
            const update = { [name]: value };
            if (!compat.includes(formData.property_type)) {
                update.property_type = PROPERTY_TYPES_BY_CATEGORY[value]?.[0]?.value || 'AUTRE';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            await api.patch(`/properties/${propertyId}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast({ message: 'Bien mis à jour !', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de la mise à jour.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Modifier <span className="text-primary tracking-tight">le Bien</span></h2>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{formData.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-8">
                    {fetching ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <form id="edit-property-form" onSubmit={handleSubmit} className="space-y-8">
                            {/* Nature du projet */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-primary" />
                                    Phase du Projet
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {MAIN_CATEGORIES.map(cat => {
                                        const isActive = mainCategory === cat.value;
                                        const c = cat.color === 'blue' ? { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' } : { border: 'border-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' };
                                        return (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => handleMainCategorySelect(cat.value)}
                                                className={cn(
                                                    "flex items-center gap-4 rounded-xl border-2 transition-all p-4 text-left",
                                                    isActive ? `${c.border} ${c.bg}` : "border-muted hover:border-muted-foreground/30"
                                                )}
                                            >
                                                <div className={cn("p-3 rounded-lg", isActive ? "bg-white dark:bg-muted" : "bg-muted")}>
                                                    <cat.icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold">{cat.label}</div>
                                                    <div className="text-[10px] text-muted-foreground">{cat.description}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" />
                                        Identification
                                    </h3>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Propriétaire *</label>
                                        <select name="owner" required className={inputClasses} value={formData.owner} onChange={handleChange}>
                                            <option value="">-- Sélectionner un client --</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Nom du bien *</label>
                                        <input type="text" name="name" required className={inputClasses} value={formData.name} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Adresse *</label>
                                        <input type="text" name="address" required className={inputClasses} value={formData.address} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Ruler className="h-4 w-4 text-primary" />
                                        Caractéristiques
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Catégorie</label>
                                            <select name="category" className={inputClasses} value={formData.category} onChange={handleChange}>
                                                {PROPERTY_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Type</label>
                                            <select name="property_type" className={inputClasses} value={formData.property_type} onChange={handleChange}>
                                                {(PROPERTY_TYPES_BY_CATEGORY[formData.category] || []).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                {PROPERTY_TYPES_BY_CATEGORY.GLOBAL.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Surface (m²)</label>
                                            <input type="number" name="surface" className={inputClasses} value={formData.surface} onChange={handleChange} />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Chambres</label>
                                            <input type="number" name="bedroom_count" className={inputClasses} value={formData.bedroom_count} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-4 border-t">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-primary" />
                                    Galerie Photos
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    {existingImages.map(img => (
                                        <div key={img.id} className="relative aspect-square rounded-lg border overflow-hidden group">
                                            <img src={img.image} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 cursor-pointer">
                                        <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                                        <ImageIcon className="h-5 w-5 text-muted-foreground mb-1" />
                                        <span className="text-[8px] font-bold uppercase text-muted-foreground">Ajouter</span>
                                    </div>
                                    {previews.map((p, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg border border-primary/30 overflow-hidden">
                                            <img src={p} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-muted/30 shrink-0">
                    <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6">
                        Annuler
                    </button>
                    <button form="edit-property-form" type="submit" disabled={loading || fetching} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4" /> Sauvegarder</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
