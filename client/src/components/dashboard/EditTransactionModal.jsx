import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import {
    X, Loader2, Save, Building2,
    Euro, Calendar, FileText, TrendingUp,
    TrendingDown, HardHat, Wallet
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EditTransactionModal({ isOpen, onClose, transactionId, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [properties, setProperties] = useState([]);
    const [sites, setSites] = useState([]);

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

    useEffect(() => {
        if (isOpen && transactionId) {
            fetchData();
        }
    }, [isOpen, transactionId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [propsRes, sitesRes, transRes] = await Promise.all([
                api.get('/properties/'),
                api.get('/construction/sites/'),
                api.get(`/finance/transactions/${transactionId}/`)
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
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
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
            await api.patch(`/finance/transactions/${transactionId}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast({ message: 'Transaction mise à jour.', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de la mise à jour.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const ic = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all outline-none";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b bg-muted/30 sticky top-0 bg-card z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Modifier <span className="text-primary tracking-tight">Transaction</span></h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <form id="edit-transaction-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Bien immobilier *</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <select name="property" required className={cn(ic, "pl-9")} value={formData.property} onChange={handleChange}>
                                            <option value="">Sélectionnez un bien...</option>
                                            {properties.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Type de mouvement</label>
                                    <div className="relative">
                                        <TrendingUp className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <select name="type" className={cn(ic, "pl-9")} value={formData.type} onChange={handleChange}>
                                            <option value="INFLOW">Entrée (Revenu)</option>
                                            <option value="OUTFLOW">Sortie (Dépense)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Catégorie</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <select name="category" className={cn(ic, "pl-9")} value={formData.category} onChange={handleChange}>
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
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Montant (€) *</label>
                                    <div className="relative">
                                        <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input type="number" step="0.01" name="amount" required placeholder="0.00" className={cn(ic, "pl-9")} value={formData.amount} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Date de paiement *</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input type="date" name="date" required className={cn(ic, "pl-9")} value={formData.date} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Mois</label>
                                        <select name="period_month" className={ic} value={formData.period_month} onChange={handleChange}>
                                            <option value="">N/A</option>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('fr-FR', { month: 'short' })}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Année</label>
                                        <select name="period_year" className={ic} value={formData.period_year} onChange={handleChange}>
                                            <option value="">N/A</option>
                                            {[...Array(5)].map((_, i) => {
                                                const y = new Date().getFullYear() - 2 + i;
                                                return <option key={y} value={y}>{y}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Chantier associé</label>
                                <div className="relative">
                                    <HardHat className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <select name="site" className={cn(ic, "pl-9")} value={formData.site} onChange={handleChange}>
                                        <option value="">Aucun...</option>
                                        {sites
                                            .filter(s => s.property === parseInt(formData.property) || s.project_property === parseInt(formData.property))
                                            .map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Justificatif (remplacer)</label>
                                <input type="file" onChange={handleFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                            <textarea name="description" rows="2" className={cn(ic, "h-auto py-2 resize-none")} placeholder="Détails..." value={formData.description} onChange={handleChange}></textarea>
                        </div>
                    </form>
                )}

                <div className="flex justify-end gap-3 p-6 border-t bg-muted/30">
                    <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                        Annuler
                    </button>
                    <button form="edit-transaction-form" type="submit" disabled={saving || loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 disabled:opacity-50 transition-all font-bold">
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
