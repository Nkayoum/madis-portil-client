import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Upload, Loader2, ArrowLeft, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export default function UploadDocument() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const propertyId = searchParams.get('propertyId');
    const { showToast } = useToast();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [propertyName, setPropertyName] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        category: 'AUTRE',
        property: propertyId || '',
        project: '',
        site: ''
    });
    const [file, setFile] = useState(null);
    const [properties, setProperties] = useState([]);
    const [projects, setProjects] = useState([]);
    const [sites, setSites] = useState([]);

    useEffect(() => {
        // Fetch all properties for the dropdown if not pre-filled
        api.get('/properties/')
            .then(res => setProperties(res.data.results || []))
            .catch(err => console.error('Failed to fetch properties', err));

        if (propertyId) {
            setFormData(prev => ({ ...prev, property: propertyId }));
            api.get(`/properties/${propertyId}/`)
                .then(res => setPropertyName(res.data.name))
                .catch(err => console.error('Failed to fetch property name', err));

            fetchContexts(propertyId);
        }
    }, [propertyId]);

    const fetchContexts = async (id) => {
        try {
            const [projRes, siteRes] = await Promise.all([
                api.get(`/finance/projects/?property=${id}`),
                api.get(`/construction/sites/?property=${id}`)
            ]);
            setProjects(projRes.data.results || []);
            setSites(siteRes.data.results || []);
        } catch (err) {
            console.error('Failed to fetch context info', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { showToast({ message: t('documents.upload.error_no_file'), type: 'error' }); return; }
        if (!formData.property) { showToast({ message: t('documents.upload.error_no_property'), type: 'error' }); return; }
        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('category', formData.category);
            data.append('file', file);
            data.append('property', formData.property);
            if (formData.project) data.append('project', formData.project);
            if (formData.site) data.append('site', formData.site);

            await api.post('/documents/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            showToast({ message: t('documents.upload.success'), type: 'success' });
            navigate(propertyId ? `/dashboard/properties/${propertyId}` : '/dashboard/documents');
        } catch (err) {
            console.error(err);
            showToast({ message: t('documents.upload.error'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };


    return (
        <div className="container mx-auto py-8 md:py-12 px-4 max-w-4xl animate-fade-in pb-12 md:pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 mb-10 md:mb-16 pb-6 md:pb-8 border-b border-black/5 dark:border-white/5">
                <div className="space-y-4">
                    <Link
                        to={propertyId ? `/dashboard/properties/${propertyId}` : "/dashboard/documents"}
                        className="group flex items-center gap-3 text-[10px] font-black text-black/40 dark:text-white/40 hover:text-primary transition-all uppercase tracking-[0.2em]"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        {propertyId ? t('documents.upload.back_property') : t('documents.upload.back_list')}
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-3">{t('documents.upload.title')}</h1>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">
                            {propertyName ? t('documents.upload.subtitle_property', { property: propertyName.toUpperCase() }) : t('documents.upload.subtitle_default')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="solaris-glass rounded-[2.5rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.08)] border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Context Section */}
                        <div className="space-y-8">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-3 mb-6">
                                <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
                                {t('documents.upload.section_context')}
                            </h3>

                            {propertyName ? (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('documents.upload.label_property_locked')}</label>
                                    <div className="w-full h-16 px-6 flex items-center bg-black/5 dark:bg-white/5 rounded-2xl text-[12px] font-bold text-black dark:text-white border border-black/5 dark:border-white/5 opacity-60">
                                        {propertyName.toUpperCase()}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('documents.upload.label_property')}</label>
                                    <select
                                        name="property"
                                        required
                                        className="w-full h-16 px-6 bg-black/[0.03] dark:bg-white/5 border-none rounded-2xl text-[12px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none dark:text-white"
                                        value={formData.property}
                                        onChange={(e) => {
                                            handleChange(e);
                                            if (e.target.value) fetchContexts(e.target.value);
                                            else { setProjects([]); setSites([]); }
                                        }}
                                    >
                                        <option value="">{t('documents.upload.select_property')}</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {(projects.length > 0 || sites.length > 0) && (
                                <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5 animate-fade-in">
                                    {projects.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('documents.upload.label_project')}</label>
                                            <select name="project" className="w-full h-16 px-6 bg-black/[0.03] dark:bg-white/5 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none dark:text-white" value={formData.project} onChange={handleChange}>
                                                <option value="">{t('documents.upload.select_project')}</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {sites.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('documents.upload.label_site')}</label>
                                            <select name="site" className="w-full h-16 px-6 bg-black/[0.03] dark:bg-white/5 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none dark:text-white" value={formData.site} onChange={handleChange}>
                                                <option value="">{t('documents.upload.select_site')}</option>
                                                {sites.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Metadata Section */}
                        <div className="space-y-8">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-3 mb-6">
                                <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
                                {t('documents.upload.section_specs')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('documents.upload.label_title')}</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        className="w-full h-16 px-6 bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-[12px] font-bold text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        placeholder={t('documents.upload.placeholder_title')}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('documents.upload.label_category')}</label>
                                    <select
                                        name="category"
                                        className="w-full h-16 px-6 bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-black dark:text-white focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                                        onChange={handleChange}
                                    >
                                        <option value="CONTRAT">{t('documents.upload.cat_contract')}</option>
                                        <option value="FACTURE">{t('documents.upload.cat_invoice')}</option>
                                        <option value="PLAN">{t('documents.upload.cat_plan')}</option>
                                        <option value="PHOTO">{t('documents.upload.cat_photo')}</option>
                                        <option value="VERIF_FONCIERE">{t('documents.upload.cat_verif')}</option>
                                        <option value="ADMINISTRATIF">{t('documents.upload.cat_admin')}</option>
                                        <option value="AUTRE">{t('documents.upload.cat_other')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('documents.upload.label_file')}</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        required
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                    <div className={cn(
                                        "w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-12 text-center transition-all bg-black/[0.02] dark:bg-white/[0.02] group-hover:bg-primary/5",
                                        file ? "border-primary/50 text-primary" : "border-black/10 dark:border-white/10 text-black/40 dark:text-white/40"
                                    )}>
                                        {file ? (
                                            <>
                                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                                    <FileText className="h-8 w-8 text-primary" />
                                                </div>
                                                <p className="text-[12px] font-bold mb-1">{file.name}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t('documents.upload.file_ready')}</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="h-16 w-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <Upload className="h-8 w-8 text-black/20 dark:text-white/20 group-hover:text-primary transition-colors" />
                                                </div>
                                                <h4 className="text-xl font-black uppercase tracking-tighter mb-2 group-hover:text-primary transition-colors">{t('documents.upload.import_start')}</h4>
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">{t('documents.upload.formats')}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-12 mt-12 border-t border-black/5 dark:border-white/5">
                        <button
                            type="button"
                            onClick={() => navigate(propertyId ? `/dashboard/properties/${propertyId}` : "/dashboard/documents")}
                            className="flex-1 h-16 rounded-2xl bg-black/5 dark:bg-white/5 text-black dark:text-white font-black uppercase tracking-widest text-[11px] hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                        >
                            {t('documents.upload.btn_cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "flex-[2] h-16 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[11px] flex items-center justify-center transition-all group hover:scale-[1.02] active:scale-[0.98] shadow-xl",
                                loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-2xl hover:shadow-primary/20"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('documents.upload.submitting')}
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-3 h-4 w-4 group-hover:-translate-y-1 transition-transform" />
                                    {t('documents.upload.btn_submit')}
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-12 text-center pb-12">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-20">
                        {t('documents.upload.footer_text')}
                    </p>
                </div>
            </div>

            {/* Security Footer */}
            <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 opacity-30">
                <div className="h-px w-32 bg-black dark:bg-white" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-center italic">
                    Cryptage de protocole Solaris 2.0 • Espace documentaire sécurisé MaDis
                </p>
            </div>
        </div>
    );
}
