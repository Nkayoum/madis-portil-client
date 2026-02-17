import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    Wallet, ArrowLeft, Loader2, Save,
    Building2, Euro, Calendar, FileText,
    TrendingUp, TrendingDown, HardHat
} from 'lucide-react';

export default function EditTransaction() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [properties, setProperties] = useState([]);

    const [formData, setFormData] = useState({
        property: '',
        type: 'INFLOW',
        category: 'RENT',
        amount: '',
        date: '',
        period_month: '',
        period_year: '',
        description: '',
        site: '',
        invoice: null
    });
    const [sites, setSites] = useState([]);

    const urlParams = new URLSearchParams(window.location.search);
    const siteIdFromUrl = urlParams.get('site');
    const returnPath = siteIdFromUrl
        ? `/dashboard/construction/${siteIdFromUrl}?tab=finance`
        : '/dashboard/finance/transactions';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [propsRes, sitesRes, transRes] = await Promise.all([
                    api.get('/properties/'),
                    api.get('/construction/sites/'),
                    api.get(`/finance/transactions/${id}/`)
                ]);

                setProperties(propsRes.data.results || []);
                setSites(sitesRes.data.results || sitesRes.data || []);

                const t = transRes.data;
                setFormData({
                    property: t.property,
                    type: t.type,
                    category: t.category,
                    amount: t.amount,
                    date: t.date,
                    period_month: t.period_month || '',
                    period_year: t.period_year || '',
                    description: t.description || '',
                    site: t.site || '',
                    invoice: null
                });
            } catch (err) {
                console.error(err);
                showToast({ message: 'Erreur lors du chargement des données.', type: 'error' });
                navigate(returnPath);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, returnPath]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-update property when site changes
            if (name === 'site' && value) {
                const site = sites.find(s => s.id === parseInt(value));
                if (site && site.property_id) {
                    newData.property = site.property_id.toString();
                }
            }

            return newData;
        });
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, invoice: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'invoice' && formData[key] === null) return;
            if (formData[key] !== null && formData[key] !== '') {
                data.append(key, formData[key]);
            }
        });

        try {
            await api.patch(`/finance/transactions/${id}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast({ message: 'Transaction mise à jour.', type: 'success' });
            navigate(returnPath);
        } catch (err) {
            console.error(err);
            let errorMessage = 'Erreur lors de la mise à jour.';
            if (err.response?.data) {
                const errorData = err.response.data;
                errorMessage = Object.values(errorData).flat().join('\n');
            }
            showToast({ message: errorMessage, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Link to={returnPath} className="p-2 hover:bg-muted font-bold rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Modifier la <span className="text-primary">Transaction</span></h1>
                    <p className="text-muted-foreground">Mettez à jour les informations financières.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                    {/* Property Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Bien immobilier
                        </label>
                        <select
                            name="property"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.property}
                            onChange={handleChange}
                        >
                            <option value="">Sélectionnez un bien...</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                Type de mouvement
                            </label>
                            <select
                                name="type"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.type}
                                onChange={handleChange}
                            >
                                <option value="INFLOW">Entrée (Revenu)</option>
                                <option value="OUTFLOW">Sortie (Dépense)</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Catégorie
                            </label>
                            <select
                                name="category"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="RENT">Loyer perçu</option>
                                <option value="COMMISSION">Commission MaDis</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="MATERIAUX">Chantier: Matériaux</option>
                                <option value="MAIN_D_OEUVRE">Chantier: Main d'œuvre</option>
                                <option value="SERVICES">Chantier: Services</option>
                                <option value="TAX">Taxe / Impôt</option>
                                <option value="INSURANCE">Assurance</option>
                                <option value="OTHER">Autre</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Euro className="h-4 w-4 text-muted-foreground" />
                                Montant (€)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="amount"
                                required
                                placeholder="0.00"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.amount}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Date de Transaction */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Date de paiement
                            </label>
                            <input
                                type="date"
                                name="date"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Performance Period */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Performance : Mois concerné</label>
                            <select
                                name="period_month"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.period_month}
                                onChange={handleChange}
                            >
                                <option value="">Non spécifié</option>
                                {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(2000, i).toLocaleString('fr-FR', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Performance : Année concernée</label>
                            <select
                                name="period_year"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.period_year}
                                onChange={handleChange}
                            >
                                <option value="">Non spécifiée</option>
                                {[...Array(10)].map((_, i) => {
                                    const y = new Date().getFullYear() - 5 + i;
                                    return <option key={y} value={y}>{y}</option>;
                                })}
                            </select>
                        </div>
                    </div>

                    {/* Site (Conditional) */}
                    {formData.property && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <HardHat className="h-4 w-4 text-muted-foreground" />
                                Chantier associé (optionnel)
                            </label>
                            <select
                                name="site"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.site}
                                onChange={handleChange}
                            >
                                <option value="">Aucun chantier...</option>
                                {sites
                                    .filter(s => s.property === parseInt(formData.property) || s.project_property === parseInt(formData.property))
                                    .map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description (optionnel)</label>
                        <textarea
                            name="description"
                            rows="3"
                            placeholder="Détails de la transaction..."
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    {/* Invoice Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Justificatif / Facture (optionnel - remplacer)</label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="flex w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link
                        to={returnPath}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Mettre à jour
                    </button>
                </div>
            </form>
        </div>
    );
}
