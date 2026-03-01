import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Loader2, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CreateTicket() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: 'MEDIUM',
        category: 'GENERAL',
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'attachment') {
            setSelectedFile(files[0]);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            if (selectedFile) {
                data.append('attachment', selectedFile);
            }

            await api.post('/tickets/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            showToast({ message: t('messaging.create.success'), type: 'success' });
            navigate('/dashboard/tickets');
        } catch (err) {
            console.error(err);
            showToast({ message: t('messaging.create.error'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "flex w-full rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] px-4 py-3 text-[11px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-transparent placeholder:text-muted-foreground/30";

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
            <Link to="/dashboard/tickets" className="flex items-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group w-fit">
                <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                {t('messaging.create.back_to_list')}
            </Link>

            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">{t('messaging.create.title')}</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">{t('messaging.create.subtitle')}</p>
            </div>

            <div className="solaris-glass rounded-[2.5rem] p-8 md:p-10 shadow-xl border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 pointer-events-none">
                    <MessageSquare size={120} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="space-y-3">
                        <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2 px-1">
                            {t('messaging.create.subject')}
                        </label>
                        <input
                            type="text"
                            name="subject"
                            required
                            className={inputClasses}
                            placeholder={t('messaging.create.subject_placeholder')}
                            value={formData.subject}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 px-1">{t('messaging.list.priority_label')}</label>
                            <select name="priority" className={inputClasses} value={formData.priority} onChange={handleChange}>
                                <option value="LOW">{t('messaging.list.priority_low')}</option>
                                <option value="MEDIUM">{t('messaging.list.priority_medium')}</option>
                                <option value="HIGH">{t('messaging.list.priority_high')}</option>
                                <option value="URGENT">{t('messaging.list.priority_urgent')}</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 px-1">{t('messaging.create.category')}</label>
                            <select name="category" className={inputClasses} value={formData.category} onChange={handleChange}>
                                <option value="GENERAL">{t('messaging.create.cat_general')}</option>
                                <option value="TECHNIQUE">{t('messaging.create.cat_technical')}</option>
                                <option value="ADMINISTRATIF">{t('messaging.create.cat_admin')}</option>
                                <option value="FINANCIER">{t('messaging.create.cat_financial')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 px-1">{t('messaging.create.description')}</label>
                        <textarea
                            name="description"
                            required
                            rows="6"
                            className={`${inputClasses} min-h-[160px] resize-none py-4`}
                            placeholder={t('messaging.create.description_placeholder')}
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 px-1">{t('messaging.create.attachment')}</label>
                        <div className="relative group">
                            <input
                                type="file"
                                name="attachment"
                                className={`${inputClasses} cursor-pointer file:hidden`}
                                onChange={handleChange}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-40 transition-opacity">
                                {t('messaging.create.browse')}
                            </div>
                        </div>
                        <p className="text-[8px] font-bold uppercase tracking-widest opacity-20 px-1">{t('messaging.create.formats')}</p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-end gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                        <Link
                            to="/dashboard/tickets"
                            className="inline-flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 h-14 px-8"
                        >
                            {t('messaging.create.btn_cancel')}
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none h-14 px-10"
                        >
                            {loading ? (
                                <><Loader2 className="mr-3 h-4 w-4 animate-spin" /> {t('messaging.create.sending')}</>
                            ) : (
                                <><MessageSquare className="mr-3 h-4 w-4" /> {t('messaging.create.btn_send')}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
