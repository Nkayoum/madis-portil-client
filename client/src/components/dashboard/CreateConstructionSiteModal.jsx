import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { HardHat, MapPin, Calendar, Loader2, X, Save, FileText } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming cn utility is available

export default function CreateConstructionSiteModal({ isOpen, onClose, onSuccess, projectId: initialProjectId }) {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [fetchingProjects, setFetchingProjects] = useState(true);

    const [formData, setFormData] = useState({
        project: initialProjectId || '',
        name: '',
        address: '',
        city: '',
        postal_code: '',
        description: '',
        start_date: '',
        end_date: '',
        budget: '',
        status: 'PREPARATION',
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                project: initialProjectId || '',
                name: '',
                address: '',
                city: '',
                postal_code: '',
                description: '',
                start_date: '',
                end_date: '',
                budget: '',
                status: 'PREPARATION',
            });
            fetchProjects();
        }
    }, [isOpen, initialProjectId]);

    const fetchProjects = async () => {
        setFetchingProjects(true);
        try {
            const res = await api.get('/projects/');
            setProjects(res.data.results || res.data || []);
        } catch (err) {
            console.error('Erreur chargement projets', err);
            showToast({ message: t('construction_modal.toast_load_proj_error'), type: 'error' });
        } finally {
            setFetchingProjects(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const cleanedData = { ...formData };
        ['start_date', 'end_date', 'budget', 'description'].forEach(field => {
            if (cleanedData[field] === '') {
                cleanedData[field] = null;
            }
        });

        try {
            await api.post('/construction-sites/', cleanedData);
            showToast({ message: t('construction_modal.toast_create_success'), type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || t('construction_modal.toast_create_error');
            showToast({ message: msg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <HardHat className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">{t('construction_modal.title_new')} <span className="text-primary">{t('construction_modal.title_highlight')}</span></h2>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{t('construction_modal.subtitle_new')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form id="create-site-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('construction_modal.label_project')}</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <select
                                            name="project"
                                            required
                                            disabled={fetchingProjects || !!initialProjectId}
                                            className={cn(inputClasses, "pl-9 appearance-none disabled:opacity-50")}
                                            value={formData.project}
                                            onChange={handleChange}
                                        >
                                            <option value="">{t('construction_modal.select_project')}</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('construction_modal.label_name')}</label>
                                    <input type="text" name="name" required className={inputClasses} placeholder={t('construction_modal.ph_name')} value={formData.name} onChange={handleChange} />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('construction_modal.label_budget')}</label>
                                    <input type="number" name="budget" className={inputClasses} placeholder={t('construction_modal.ph_budget')} value={formData.budget} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        {t('construction_modal.label_address')}
                                    </label>
                                    <input type="text" name="address" required className={inputClasses} placeholder={t('construction_modal.ph_address')} value={formData.address} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('construction_modal.label_city')}</label>
                                        <input type="text" name="city" required className={inputClasses} placeholder={t('construction_modal.ph_city')} value={formData.city} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('construction_modal.label_postal')}</label>
                                        <input type="text" name="postal_code" required className={inputClasses} placeholder={t('construction_modal.ph_postal')} value={formData.postal_code} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            {t('construction_modal.label_start')}
                                        </label>
                                        <input type="date" name="start_date" className={inputClasses} value={formData.start_date} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4 opacity-50" />
                                            {t('construction_modal.label_end')}
                                        </label>
                                        <input type="date" name="end_date" className={inputClasses} value={formData.end_date} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('construction_modal.label_desc')}</label>
                            <textarea name="description" rows="3" className={cn(inputClasses, "h-auto min-h-[80px] resize-none py-2")} placeholder={t('construction_modal.ph_desc')} value={formData.description} onChange={handleChange} />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-muted/30 shrink-0">
                    <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6">
                        {t('construction_modal.btn_cancel')}
                    </button>
                    <button form="create-site-form" type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('construction_modal.btn_creating')}</> : <><Save className="mr-2 h-4 w-4" /> {t('construction_modal.btn_create')}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
