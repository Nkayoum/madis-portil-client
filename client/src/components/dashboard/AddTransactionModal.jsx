import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import {
    Wallet, Loader2, Save,
    Building2, Euro, Calendar, FileText,
    TrendingUp, HardHat, X, Info
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AddTransactionModal({ isOpen, onClose, site, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        property: '',
        type: 'OUTFLOW',
        category: 'MATERIAUX',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        period_month: new Date().getMonth() + 1,
        period_year: new Date().getFullYear(),
        description: '',
        site: '',
        invoice: null
    });

    useEffect(() => {
        if (site && isOpen) {
            setFormData(prev => ({
                ...prev,
                site: site.id.toString(),
                property: (site.property_id || site.project_property_id || '').toString(),
            }));
        }
    }, [site, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, invoice: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '') {
                data.append(key, formData[key]);
            }
        });

        try {
            await api.post('/finance/transactions/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast({ message: 'Transaction enregistrée avec succès.', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            let errorMessage = 'Erreur lors de l\'enregistrement.';
            if (err.response?.data) {
                const errorData = err.response.data;
                errorMessage = Object.values(errorData).flat().join('\n');
            }
            showToast({ message: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Nouvelle <span className="text-primary">Dépense</span></h2>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Pour : {site?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div className="space-y-1.5 text-left">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                Catégorie
                            </label>
                            <select
                                name="category"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="MATERIAUX">Chantier: Matériaux</option>
                                <option value="MAIN_D_OEUVRE">Chantier: Main d'œuvre</option>
                                <option value="SERVICES">Chantier: Services</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="OTHER">Autre</option>
                            </select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-1.5 text-left">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Euro className="h-3 w-3" />
                                Montant (€)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="amount"
                                required
                                placeholder="0.00"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                                value={formData.amount}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-1.5 text-left">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
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

                        {/* Performance Period */}
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                Période de l'activité
                                <Info className="h-3 w-3 text-primary/60" />
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <select
                                    name="period_month"
                                    className="col-span-2 flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.period_month}
                                    onChange={handleChange}
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(2000, i).toLocaleString('fr-FR', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    name="period_year"
                                    className="col-span-1 flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.period_year}
                                    onChange={handleChange}
                                >
                                    {[...Array(3)].map((_, i) => {
                                        const y = new Date().getFullYear() - 1 + i;
                                        return <option key={y} value={y}>{y}</option>;
                                    })}
                                </select>
                            </div>
                            <p className="text-[9px] leading-tight text-muted-foreground/80 mt-1 italic">
                                Indiquez quand la commande ou la prestation a eu lieu (ex: commande en janvier, payée en février).
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description (optionnel)</label>
                        <textarea
                            name="description"
                            rows="2"
                            placeholder="Détails de la dépense..."
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    {/* Invoice Upload */}
                    <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Justificatif / Facture (optionnel)</label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 flex items-center justify-center h-10 rounded-md border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-xs font-medium text-primary">
                                <FileText className="h-4 w-4 mr-2" />
                                {formData.invoice ? formData.invoice.name : "Choisir un fichier"}
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            {formData.invoice && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, invoice: null }))}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
