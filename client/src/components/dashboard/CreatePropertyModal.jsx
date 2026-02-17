import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { ArrowLeft, Building, Loader2, Save, Ruler, Bed, Hash, MapPin, Image as ImageIcon, X, Tag, ShoppingBag, Briefcase, Euro, Settings, HardHat, Home, Percent, User, Calendar, Wrench, Sofa, Shield, Check, ShieldCheck, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function CreatePropertyModal({ isOpen, onClose, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
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

    const isMandat = formData.management_type === 'MANDAT';
    const isGestion = formData.management_type === 'GESTION';
    const isConstruction = formData.management_type === 'CONSTRUCTION';
    const showPricing = !isConstruction;

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users/');
            setUsers(response.data.results || []);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            const firstType = PROPERTY_TYPES_BY_CATEGORY[value]?.[0]?.value || 'AUTRE';
            setFormData(prev => ({ ...prev, [name]: value, property_type: firstType }));
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
            setFormData(prev => ({
                ...prev,
                management_type: 'CONSTRUCTION',
                transaction_nature: 'VENTE',
                status: 'EN_COURS',
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                management_type: 'MANDAT',
                transaction_nature: 'VENTE',
                status: 'DISPONIBLE',
            }));
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

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index]);
            return newPreviews;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'owner') {
                if (formData[key] && formData[key] !== '') {
                    data.append(key, formData[key]);
                }
            } else if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
                data.append(key, formData[key]);
            }
        });

        images.forEach(image => {
            data.append('uploaded_images', image);
        });

        try {
            await api.post('/properties/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast({ message: 'Bien immobilier créé avec succès !', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            showToast({ message: 'Impossible de créer le bien immobilier.', type: 'error' });
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
                            <h2 className="text-xl font-bold tracking-tight">Nouveau <span className="text-primary tracking-tight">Bien Immobilier</span></h2>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Ajouter au portefeuille</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-8">
                    <form id="create-property-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* ═══ NATURE DU PROJET ═══ */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Settings className="h-4 w-4 text-primary" />
                                Nature du Projet
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

                            {mainCategory === 'MANAGED' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto pt-2">
                                    {MANAGEMENT_TYPES.map(mt => {
                                        const isActive = formData.management_type === mt.value;
                                        return (
                                            <button
                                                key={mt.value}
                                                type="button"
                                                onClick={() => handleChange({ target: { name: 'management_type', value: mt.value } })}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg border-2 transition-all p-3 text-left",
                                                    isActive ? "border-blue-500 bg-blue-50/50" : "border-muted"
                                                )}
                                            >
                                                <mt.icon className="h-4 w-4 text-primary" />
                                                <span className="text-xs font-bold">{mt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* GENERAL INFO */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    Propriétaire & Identification
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
                                    <input type="text" name="name" required className={inputClasses} placeholder="Ex: Résidence Les Lilas" value={formData.name} onChange={handleChange} />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Adresse *</label>
                                    <input type="text" name="address" required className={inputClasses} value={formData.address} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Ville *</label>
                                        <input type="text" name="city" required className={inputClasses} value={formData.city} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Code Postal</label>
                                        <input type="text" name="postal_code" className={inputClasses} value={formData.postal_code} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Devise d'origine</label>
                                    <select name="devise_origine" className={inputClasses} value={formData.devise_origine} onChange={handleChange}>
                                        <option value="EUR">Euro (€)</option>
                                        <option value="USD">Dollar ($)</option>
                                        <option value="AED">Dirham (AED)</option>
                                        <option value="XOF">Franc CFA (XOF)</option>
                                    </select>
                                </div>
                            </div>

                            {/* CARACTERISTIQUES */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Ruler className="h-4 w-4 text-primary" />
                                    Caractéristiques & État
                                </h3>
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Catégorie</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PROPERTY_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => handleChange({ target: { name: 'category', value: cat.value } })}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-2 rounded-lg border-2 text-[10px] font-bold uppercase gap-1",
                                                    formData.category === cat.value ? "border-primary bg-primary/5 text-primary" : "border-muted"
                                                )}
                                            >
                                                <cat.icon className="h-4 w-4" /> {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Type de bien</label>
                                        <select name="property_type" className={inputClasses} value={formData.property_type} onChange={handleChange}>
                                            {(PROPERTY_TYPES_BY_CATEGORY[formData.category] || []).map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                            {PROPERTY_TYPES_BY_CATEGORY.GLOBAL.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Surface (m²)</label>
                                        <input type="number" name="surface" className={inputClasses} value={formData.surface} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Pièces</label>
                                        <input type="number" name="room_count" className={inputClasses} value={formData.room_count} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Chambres</label>
                                        <input type="number" name="bedroom_count" className={inputClasses} value={formData.bedroom_count} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 border rounded-xl bg-muted/20">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                    <div className="flex-1 text-xs font-medium">Vérification Foncière ?</div>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_verified_fonciere}
                                        onChange={e => setFormData(p => ({ ...p, is_verified_fonciere: e.target.checked }))}
                                        className="h-5 w-5 accent-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* FINANCES & PHOTOS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Euro className="h-4 w-4 text-primary" />
                                    Données Financières
                                </h3>
                                {formData.transaction_nature === 'VENTE' ? (
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Prix de vente (€) *</label>
                                            <input type="number" name="prix_vente" required className={inputClasses} value={formData.prix_vente} onChange={handleChange} />
                                        </div>
                                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                            <input type="checkbox" checked={formData.negociable} onChange={e => setFormData(p => ({ ...p, negociable: e.target.checked }))} className="accent-primary h-4 w-4" />
                                            Prix négociable
                                        </label>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Loyer (€) *</label>
                                            <input type="number" name="loyer_mensuel" required className={inputClasses} value={formData.loyer_mensuel} onChange={handleChange} />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Nuitée (€)</label>
                                            <input type="number" name="prix_nuitee" className={inputClasses} value={formData.prix_nuitee} onChange={handleChange} />
                                        </div>
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Type de Commission</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, commission_type: 'POURCENTAGE' }))} className={cn("p-2 rounded-md border text-xs font-bold", formData.commission_type === 'POURCENTAGE' ? "bg-primary text-white" : "bg-muted")}>%</button>
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, commission_type: 'FIXE' }))} className={cn("p-2 rounded-md border text-xs font-bold", formData.commission_type === 'FIXE' ? "bg-primary text-white" : "bg-muted")}>FIXE</button>
                                    </div>
                                </div>
                                {formData.commission_type === 'POURCENTAGE' ? (
                                    <input type="number" name="commission_rate" placeholder="Taux (%)" className={inputClasses} value={formData.commission_rate} onChange={handleChange} />
                                ) : (
                                    <input type="number" name="commission_fixe" placeholder="Montant (€)" className={inputClasses} value={formData.commission_fixe} onChange={handleChange} />
                                )}
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-primary" />
                                    Média & Photos
                                </h3>
                                <div className="flex items-center justify-center border-2 border-dashed rounded-xl h-24 bg-muted/20 relative cursor-pointer hover:bg-muted/40 transition-colors">
                                    <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                                    <div className="text-center">
                                        <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Ajouter des photos</span>
                                    </div>
                                </div>
                                {previews.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {previews.map((p, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg border overflow-hidden">
                                                <img src={p} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                            <textarea name="description" rows="2" className={`${inputClasses} h-auto py-2`} value={formData.description} onChange={handleChange} />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-muted/30 shrink-0">
                    <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6">
                        Annuler
                    </button>
                    <button form="create-property-form" type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4" /> Créer le bien</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
