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

    const inputClasses = "flex w-full rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] px-4 py-3 text-[11px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-transparent placeholder:text-muted-foreground/30";
    const labelClasses = "text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2 px-1";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 py-12 md:py-20 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
            <div className="solaris-glass bg-white/95 dark:bg-[#0c0c0c]/95 rounded-[2.5rem] shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-300 border-none relative my-auto">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] -rotate-12 pointer-events-none">
                    <Wallet size={160} />
                </div>

                <div className="flex items-center justify-between p-8 md:p-10 pb-4 relative z-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">
                                Modifier <span className="text-primary italic">Transaction</span>
                            </h2>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1">Mise à jour des flux financiers.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all hover:rotate-90 duration-300 group"
                    >
                        <X className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-8 md:px-10 py-4 custom-scrollbar relative z-10">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Chargement des données...</p>
                        </div>
                    ) : (
                        <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-8 py-4">
                            <div className="grid gap-8 md:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className={labelClasses}>
                                            <Building2 size={10} /> Bien immobilier *
                                        </label>
                                        <select name="property" required className={inputClasses} value={formData.property} onChange={handleChange}>
                                            <option value="">Sélectionnez un bien...</option>
                                            {properties.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className={labelClasses}>
                                            <TrendingUp size={10} /> Type de mouvement
                                        </label>
                                        <select name="type" className={inputClasses} value={formData.type} onChange={handleChange}>
                                            <option value="INFLOW">Entrée (Revenu)</option>
                                            <option value="OUTFLOW">Sortie (Dépense)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className={labelClasses}>
                                            <FileText size={10} /> Catégorie
                                        </label>
                                        <select name="category" className={inputClasses} value={formData.category} onChange={handleChange}>
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

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className={labelClasses}>
                                            <Euro size={10} /> Montant (€) *
                                        </label>
                                        <input type="number" step="0.01" name="amount" required placeholder="0.00" className={inputClasses} value={formData.amount} onChange={handleChange} />
                                    </div>

                                    <div className="space-y-3">
                                        <label className={labelClasses}>
                                            <Calendar size={10} /> Date de paiement *
                                        </label>
                                        <input type="date" name="date" required className={inputClasses} value={formData.date} onChange={handleChange} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <label className={labelClasses}>Mois</label>
                                            <select name="period_month" className={inputClasses} value={formData.period_month} onChange={handleChange}>
                                                <option value="">N/A</option>
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('fr-FR', { month: 'short' })}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className={labelClasses}>Année</label>
                                            <select name="period_year" className={inputClasses} value={formData.period_year} onChange={handleChange}>
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

                            <div className="grid gap-8 md:grid-cols-2">
                                <div className="space-y-3">
                                    <label className={labelClasses}>
                                        <HardHat size={10} /> Chantier associé
                                    </label>
                                    <select name="site" className={inputClasses} value={formData.site} onChange={handleChange}>
                                        <option value="">Aucun...</option>
                                        {sites
                                            .filter(s => s.property === parseInt(formData.property) || s.project_property === parseInt(formData.property))
                                            .map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className={labelClasses}>Justificatif (Remplacer)</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className={`${inputClasses} cursor-pointer file:hidden`}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-40 transition-opacity">
                                            Parcourir
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className={labelClasses}>Description</label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    className={`${inputClasses} h-auto py-4 resize-none`}
                                    placeholder="Ajouter des détails sur cette opération..."
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </form>
                    )}
                </div>

                <div className="flex flex-col md:flex-row justify-end gap-4 p-8 md:p-10 mt-2 border-t border-black/5 dark:border-white/5 relative z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 h-14 px-8"
                    >
                        Annuler
                    </button>
                    <button
                        form="edit-transaction-form"
                        type="submit"
                        disabled={saving || loading}
                        className="inline-flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none h-14 px-10"
                    >
                        {saving ? (
                            <><Loader2 className="mr-3 h-4 w-4 animate-spin" /> Enregistrement...</>
                        ) : (
                            <><Save className="mr-3 h-4 w-4" /> Enregistrer les modifications</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
