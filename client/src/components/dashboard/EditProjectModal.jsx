import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import {
    X, Loader2, Save, Building2,
    Calendar, Euro, ClipboardList, LayoutDashboard, Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EditProjectModal({ isOpen, onClose, projectId, onSuccess }) {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [properties, setProperties] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        property: '',
        status: 'PLANIFIE',
        category: 'CONSTRUCTION',
        start_date: '',
        estimated_end_date: '',
        budget: ''
    });

    useEffect(() => {
        if (isOpen && projectId) {
            fetchData();
        }
    }, [isOpen, projectId]);

    const fetchData = async () => {
        setFetching(true);
        try {
            const [propsRes, projectRes] = await Promise.all([
                api.get('/properties/'),
                api.get(`/projects/${projectId}/`)
            ]);

            setProperties(propsRes.data.results || []);

            const proj = projectRes.data;
            setFormData({
                name: proj.name || '',
                description: proj.description || '',
                property: proj.property || '',
                status: proj.status || 'PLANIFIE',
                category: proj.category || 'CONSTRUCTION',
                start_date: proj.start_date || '',
                estimated_end_date: proj.estimated_end_date || '',
                budget: proj.budget || ''
            });
        } catch (err) {
            console.error('Failed to fetch data', err);
            showToast({ message: t('project_modal.toast_load_error'), type: 'error' });
            onClose();
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (formData.property && properties.length > 0) {
            const selectedProp = properties.find(p => String(p.id) === String(formData.property));
            if (selectedProp) {
                const newCategory = selectedProp.management_type === 'GESTION' ? 'MAINTENANCE' : 'CONSTRUCTION';
                if (formData.category !== newCategory) {
                    setFormData(prev => ({ ...prev, category: newCategory }));
                }
            }
        }
    }, [formData.property, properties, formData.category]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const cleanedData = { ...formData };
        ['start_date', 'estimated_end_date', 'budget', 'description'].forEach(field => {
            if (cleanedData[field] === '') {
                cleanedData[field] = null;
            }
        });

        try {
            await api.patch(`/projects/${projectId}/`, cleanedData);
            showToast({ message: t('project_modal.toast_update_success'), type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || t('project_modal.toast_update_error');
            showToast({ message: errorMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const ic = "flex h-12 w-full rounded-2xl border-none bg-black/[0.03] px-4 py-3 text-[12px] font-bold outline-none ring-0 placeholder:text-muted-foreground focus:bg-black/[0.05] transition-all duration-300";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="solaris-glass rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-10 border-b border-black/5 bg-white/10 sticky top-0 z-20">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-black text-white rounded-2xl shadow-xl">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">{t('project_modal.title_edit')} {t('project_modal.title_highlight')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-1.5">{t('project_modal.subtitle_edit')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-black/5 rounded-full transition-all duration-300 group"
                    >
                        <X className="h-6 w-6 text-muted-foreground group-hover:text-black transition-colors" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {fetching ? (
                        <div className="p-32 flex flex-col items-center justify-center gap-6">
                            <Loader2 className="h-12 w-12 animate-spin text-black opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Chargement des données...</p>
                        </div>
                    ) : (
                        <form id="edit-project-form" onSubmit={handleSubmit} className="p-10 space-y-10">
                            <div className="grid gap-10 md:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t('project_modal.label_name')}</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className={ic}
                                            placeholder={t('project_modal.ph_name')}
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="grid gap-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t('project_modal.label_property')}</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-[14px] h-5 w-5 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
                                            <select
                                                name="property"
                                                required
                                                className={cn(ic, "pl-11 appearance-none")}
                                                value={formData.property}
                                                onChange={handleChange}
                                            >
                                                <option value="">{t('project_modal.select_property')}</option>
                                                {properties.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" /> {t('project_modal.label_status')}
                                        </label>
                                        <select
                                            name="status"
                                            className={cn(ic, "appearance-none")}
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="PLANIFIE">{t('project_modal.status_planned')}</option>
                                            <option value="EN_COURS">{t('project_modal.status_in_progress')}</option>
                                            <option value="TERMINE">{t('project_modal.status_completed')}</option>
                                            <option value="ANNULE">{t('project_modal.status_cancelled')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid gap-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t('project_modal.label_category')}</label>
                                        <div className="relative group">
                                            <ClipboardList className="absolute left-4 top-[14px] h-5 w-5 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
                                            <select
                                                name="category"
                                                required
                                                className={cn(ic, "pl-11 appearance-none")}
                                                value={formData.category}
                                                onChange={handleChange}
                                            >
                                                <option value="CONSTRUCTION">{t('project_modal.cat_construction')}</option>
                                                <option value="MAINTENANCE">{t('project_modal.cat_maintenance')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t('project_modal.label_budget')}</label>
                                        <div className="relative group">
                                            <Euro className="absolute left-4 top-[14px] h-5 w-5 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
                                            <input
                                                type="number"
                                                name="budget"
                                                className={cn(ic, "pl-11")}
                                                placeholder="0.00"
                                                value={formData.budget}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-3">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t('project_modal.label_start')}</label>
                                            <input
                                                type="date"
                                                name="start_date"
                                                className={cn(ic, "font-mono")}
                                                value={formData.start_date}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t('project_modal.label_end')}</label>
                                            <input
                                                type="date"
                                                name="estimated_end_date"
                                                className={cn(ic, "font-mono text-amber-600")}
                                                value={formData.estimated_end_date}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t('project_modal.label_desc')}</label>
                                <textarea
                                    name="description"
                                    rows="4"
                                    className={cn(ic, "h-auto py-4 min-h-[120px] leading-relaxed")}
                                    placeholder={t('project_modal.ph_desc')}
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </form>
                    )}
                </div>

                <div className="flex justify-end items-center gap-6 p-10 border-t border-black/5 bg-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-black transition-all px-4"
                    >
                        {t('project_modal.btn_cancel')}
                    </button>
                    <button
                        form="edit-project-form"
                        type="submit"
                        disabled={loading || fetching}
                        className="inline-flex items-center justify-center rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-black text-white hover:bg-black/90 h-14 px-10 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] disabled:opacity-50 group"
                    >
                        {loading ? (
                            <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> {t('project_modal.btn_updating')}</>
                        ) : (
                            <><Save className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" /> {t('project_modal.btn_update')}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
