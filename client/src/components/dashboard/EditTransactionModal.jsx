import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import {
    X, Loader2, Save, Building2,
    Euro, Calendar, FileText, TrendingUp,
    TrendingDown, HardHat, Wallet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EditTransactionModal({ isOpen, onClose, transactionId, onSuccess }) {
    const { showToast } = useToast();
    const { t, i18n } = useTranslation();
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
    }, [isOpen, transactionId, fetchData]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [propsRes, sitesRes, transRes] = await Promise.all([
                api.get('/properties/'),
                api.get('/construction/sites/'),
                api.get(`/finance/transactions/${transactionId}/`)
            ]);

            setProperties(propsRes.data.results || []);
            setSites(sitesRes.data.results || sitesRes.data || []);

            const t_data = transRes.data;
            setFormData({
                property: t_data.property,
                type: t_data.type,
                category: t_data.category,
                amount: t_data.amount,
                date: t_data.date,
                period_month: t_data.period_month || '',
                period_year: t_data.period_year || '',
                description: t_data.description || '',
                site: t_data.site || '',
                invoice: null
            });
        } catch (err) {
            console.error(err);
            showToast({ message: t('finance.edit_transaction.errors.load_error'), type: 'error' });
            onClose();
        } finally {
            setLoading(false);
        }
    }, [transactionId, t, showToast, onClose]);

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
            showToast({ message: t('finance.edit_transaction.errors.update_success'), type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            showToast({ message: t('finance.edit_transaction.errors.update_error'), type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const inputClasses = "flex w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-3 text-[11px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/30 shadow-sm";
    const labelClasses = "text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2 px-1";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 py-12 md:py-20 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#050a14] rounded-[2.5rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.2)] w-full max-w-2xl animate-in zoom-in-95 duration-300 border border-black/5 dark:border-white/5 relative my-auto overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 pointer-events-none text-primary">
                    <Wallet size={160} />
                </div>

                <div className="flex items-center justify-between p-8 md:p-10 pb-6 relative z-10 border-b border-black/[0.03] dark:border-white/[0.03]">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase" dangerouslySetInnerHTML={{ __html: t('finance.edit_transaction.title') }}></h2>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1">{t('finance.edit_transaction.subtitle')}</p>
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
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-20">{t('finance.edit_transaction.loading')}</p>
                        </div>
                    ) : (
                        <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-8 py-4">
                            <div className="grid gap-8 md:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className={labelClasses}>
                                            <Building2 size={10} /> {t('finance.edit_transaction.property')}
                                        </label>
                                        <select name="property" required className={inputClasses} value={formData.property} onChange={handleChange}>
                                            <option value="">{t('finance.edit_transaction.select_property')}</option>
                                            {properties.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className={labelClasses}>
                                            <TrendingUp size={10} /> {t('finance.edit_transaction.movement_type')}
                                        </label>
                                        <select name="type" className={inputClasses} value={formData.type} onChange={handleChange}>
                                            <option value="INFLOW">{t('finance.add_transaction.inflow')}</option>
                                            <option value="OUTFLOW">{t('finance.add_transaction.outflow')}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className={labelClasses}>
                                            <FileText size={10} /> {t('finance.edit_transaction.category')}
                                        </label>
                                        <select name="category" className={inputClasses} value={formData.category} onChange={handleChange}>
                                            <option value="RENT">{t('finance.add_transaction.cat_rent')}</option>
                                            <option value="COMMISSION">{t('finance.add_transaction.cat_commission')}</option>
                                            <option value="MAINTENANCE">{t('finance.add_transaction.cat_maintenance')}</option>
                                            <option value="MATERIAUX">{t('finance.add_transaction.cat_materials')}</option>
                                            <option value="MAIN_D_OEUVRE">{t('finance.add_transaction.cat_labor')}</option>
                                            <option value="SERVICES">{t('finance.add_transaction.cat_services')}</option>
                                            <option value="TAX">{t('finance.add_transaction.cat_tax')}</option>
                                            <option value="INSURANCE">{t('finance.add_transaction.cat_insurance')}</option>
                                            <option value="OTHER">{t('finance.add_transaction.cat_other')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className={labelClasses}>
                                            <Euro size={10} /> {t('finance.edit_transaction.amount')}
                                        </label>
                                        <input type="number" step="0.01" name="amount" required placeholder="0.00" className={inputClasses} value={formData.amount} onChange={handleChange} />
                                    </div>

                                    <div className="space-y-3">
                                        <label className={labelClasses}>
                                            <Calendar size={10} /> {t('finance.edit_transaction.payment_date')}
                                        </label>
                                        <input type="date" name="date" required className={inputClasses} value={formData.date} onChange={handleChange} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <label className={labelClasses}>{t('finance.edit_transaction.month_label')}</label>
                                            <select name="period_month" className={inputClasses} value={formData.period_month} onChange={handleChange}>
                                                <option value="">N/A</option>
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' })}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className={labelClasses}>{t('finance.edit_transaction.year_label')}</label>
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
                                        <HardHat size={10} /> {t('finance.edit_transaction.associated_site')}
                                    </label>
                                    <select name="site" className={inputClasses} value={formData.site} onChange={handleChange}>
                                        <option value="">{t('finance.edit_transaction.no_site')}</option>
                                        {sites
                                            .filter(s => s.property === parseInt(formData.property) || s.project_property === parseInt(formData.property))
                                            .map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className={labelClasses}>{t('finance.edit_transaction.replace_file')}</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className={`${inputClasses} cursor-pointer file:hidden`}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-40 transition-opacity">
                                            {t('finance.edit_transaction.browse')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className={labelClasses}>{t('finance.edit_transaction.description')}</label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    className={`${inputClasses} h-auto py-4 resize-none`}
                                    placeholder={t('finance.edit_transaction.description_placeholder')}
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </form>
                    )}
                </div>

                <div className="flex flex-col md:flex-row justify-end gap-4 p-8 md:p-10 border-t border-black/[0.03] dark:border-white/[0.03] relative z-10 bg-white dark:bg-[#050a14]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 h-11 px-8"
                    >
                        {t('finance.edit_transaction.cancel')}
                    </button>
                    <button
                        form="edit-transaction-form"
                        type="submit"
                        disabled={saving || loading}
                        className="inline-flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none h-11 px-10"
                    >
                        {saving ? (
                            <><Loader2 className="mr-3 h-4 w-4 animate-spin" /> {t('finance.edit_transaction.saving')}</>
                        ) : (
                            <><Save className="mr-3 h-4 w-4" /> {t('finance.edit_transaction.save_changes')}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
