import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Upload, Loader2, FileText, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function UploadDocumentModal({ isOpen, onClose, propertyId, siteId, onSuccess }) {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [propertyName, setPropertyName] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        category: 'AUTRE',
        property: propertyId || '',
        site: siteId || ''
    });
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: '',
                category: 'AUTRE',
                property: propertyId || '',
                site: siteId || ''
            });
            setFile(null);

            if (propertyId) {
                api.get(`/properties/${propertyId}/`)
                    .then(res => setPropertyName(res.data.name))
                    .catch(err => console.error('Failed to fetch property name', err));
            }
        }
    }, [isOpen, propertyId, siteId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { showToast({ message: t('upload_document_modal.toast_no_file'), type: 'error' }); return; }
        if (!formData.property && !formData.site) {
            showToast({ message: t('upload_document_modal.toast_no_link'), type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('category', formData.category);
            data.append('file', file);
            if (formData.property) data.append('property', formData.property);
            if (formData.site) data.append('site', formData.site);

            await api.post('/documents/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            showToast({ message: t('upload_document_modal.toast_success'), type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            showToast({ message: t('upload_document_modal.toast_error'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const ic = "flex h-12 w-full rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-2 text-[13px] font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/10 outline-none transition-all dark:text-white";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card dark:bg-[#0a0a12] border border-black/5 dark:border-white/[0.06] rounded-[2rem] shadow-2xl dark:shadow-[0_0_60px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">{t('upload_document_modal.title')}<span className="text-primary">{t('upload_document_modal.title_highlight')}</span></h2>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                                {propertyName ? t('upload_document_modal.subtitle_for', { name: propertyName }) : t('upload_document_modal.subtitle_import')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('upload_document_modal.label_title')}</label>
                        <input type="text" name="title" required className={`${ic} dark:placeholder:text-white/30`} placeholder={t('upload_document_modal.ph_title')} value={formData.title} onChange={handleChange} />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('upload_document_modal.label_category')}</label>
                        <select name="category" className={ic} value={formData.category} onChange={handleChange}>
                            <option value="CONTRAT">{t('upload_document_modal.cat_contract')}</option>
                            <option value="FACTURE">{t('upload_document_modal.cat_invoice')}</option>
                            <option value="PLAN">{t('upload_document_modal.cat_plan')}</option>
                            <option value="PHOTO">{t('upload_document_modal.cat_photo')}</option>
                            <option value="VERIF_FONCIERE">{t('upload_document_modal.cat_verif')}</option>
                            <option value="ADMINISTRATIF">{t('upload_document_modal.cat_admin')}</option>
                            <option value="AUTRE">{t('upload_document_modal.cat_other')}</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('upload_document_modal.label_file')}</label>
                        <div
                            className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                            onClick={() => document.getElementById('modal-file-input').click()}
                        >
                            <input id="modal-file-input" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                            <div className="mx-auto h-12 w-12 rounded-full bg-black/5 dark:bg-white/10 group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
                                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            {file ? (
                                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary">
                                    <FileText className="h-4 w-4" />
                                    {file.name}
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-bold mb-1">{t('upload_document_modal.click_to_select')}</p>
                                    <p className="text-xs text-muted-foreground">{t('upload_document_modal.file_formats')}</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/[0.06]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 shadow-sm hover:bg-black/5 dark:hover:bg-white/20 h-11 px-6 dark:text-white active:scale-95 transition-all"
                        >
                            {t('upload_document_modal.btn_cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-black text-white shadow-lg hover:bg-zinc-800 h-11 px-8 disabled:opacity-50 active:scale-95 transition-all"
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('upload_document_modal.btn_sending')}</>
                            ) : (
                                <><Upload className="mr-2 h-4 w-4" /> {t('upload_document_modal.btn_send')}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
