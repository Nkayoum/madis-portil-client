import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { FileText, Download, Search, Loader2, File } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function DocumentsList() {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'fr' ? fr : enUS;
    const { showToast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [selectedPropertyId, setSelectedPropertyId] = useState('ALL');
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchDocuments();
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await api.get('/properties/');
            setProperties(response.data.results || []);
        } catch (err) {
            console.error('Failed to fetch properties', err);
        }
    };

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents/');
            setDocuments(response.data.results || []);
        } catch (err) {
            setError(t('documents.list.load_error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(t('documents.list.confirm_delete', { title }))) return;

        setDeletingId(id);
        try {
            await api.delete(`/documents/${id}/`);
            showToast({ message: t('documents.list.delete_success'), type: 'success' });
            setDocuments(prev => prev.filter(doc => doc.id !== id));
        } catch (err) {
            console.error('Failed to delete document', err);
            showToast({ message: t('documents.list.delete_error'), type: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesCategory = filter === 'ALL' || doc.category === filter;
        const matchesProperty = selectedPropertyId === 'ALL' || doc.property.toString() === selectedPropertyId;
        const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesProperty && matchesSearch;
    });

    const categories = [
        { value: 'ALL', label: t('documents.list.cat_all') },
        { value: 'CONTRAT', label: t('documents.list.cat_contract') },
        { value: 'FACTURE', label: t('documents.list.cat_invoice') },
        { value: 'PLAN', label: t('documents.list.cat_plan') },
        { value: 'PHOTO', label: t('documents.list.cat_photo') },
        { value: 'VERIF_FONCIERE', label: t('documents.list.cat_verif') },
        { value: 'ADMINISTRATIF', label: t('documents.list.cat_admin') },
    ];

    const getCategoryStyles = (category) => {
        const styles = {
            CONTRAT: 'bg-black dark:bg-primary text-white shadow-lg shadow-black/10',
            FACTURE: 'bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:border-primary/40',
            PLAN: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-400/20',
            PHOTO: 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-400/20',
            VERIF_FONCIERE: 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-400/20',
            ADMINISTRATIF: 'bg-neutral-50 text-neutral-600 border border-neutral-100 dark:bg-white/5 dark:text-white/60 dark:border-white/10',
            AUTRE: 'bg-neutral-100 text-neutral-400 dark:bg-white/5 dark:text-white/20',
        };
        return styles[category] || styles.AUTRE;
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 md:py-12 px-4 max-w-[1600px] animate-fade-in pb-32">
            {/* Solaris Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-8 md:mb-12 pb-6 border-b border-black/5 dark:border-white/5">
                <div>
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight uppercase leading-tight md:leading-none mb-1.5">{t('documents.list.title')}</h1>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">{t('documents.list.subtitle')}</p>
                </div>

                <Link
                    to="/dashboard/documents/new"
                    className="h-10 md:h-11 px-6 md:px-7 bg-primary dark:solaris-neon-pink text-white rounded-xl flex items-center justify-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all group w-full md:w-auto shrink-0"
                >
                    <FileText className="h-4 w-4" />
                    {t('documents.list.btn_new')}
                </Link>
            </div>

            {/* Industrial Command Bar */}
            <div className="solaris-glass rounded-[1.5rem] p-3 flex flex-col lg:flex-row items-center gap-3 mb-8 shadow-sm border-none">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/20 dark:text-white/20 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder={t('documents.list.search_placeholder')}
                        className="w-full h-11 pl-14 pr-6 bg-black/[0.02] dark:bg-black/40 border dark:border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:bg-white dark:focus:bg-black/60 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="w-full lg:w-[220px]">
                    <select
                        className="w-full h-11 px-5 bg-black/[0.02] dark:bg-white/5 border-none rounded-xl text-[10px] font-bold uppercase tracking-widest focus:bg-primary/10 transition-all outline-none appearance-none"
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                    >
                        <option value="ALL">{t('documents.list.property_all')}</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                <div className="h-10 w-px bg-black/5 dark:bg-white/5 hidden lg:block" />

                <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto px-1 no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setFilter(cat.value)}
                            className={cn(
                                "px-4 h-10 rounded-lg text-[8px] md:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300",
                                filter === cat.value
                                    ? "bg-primary text-white shadow-md"
                                    : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Documents Industrial Grid */}
            <div className="min-h-[400px]">
                {filteredDocuments.length === 0 ? (
                    <div className="text-center py-24 bg-black/[0.01] dark:bg-white/[0.01] rounded-[2rem] border-2 border-dashed border-black/5 dark:border-white/5">
                        <div className="mx-auto h-16 w-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
                            <File className="h-8 w-8 text-black/10 dark:text-white/10" />
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-tight opacity-20">{t('documents.list.empty_title')}</h3>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-20 mt-1">
                            {t('documents.list.empty_desc')}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredDocuments.map((doc) => (
                            <div key={doc.id} className="group flex flex-col solaris-glass rounded-[1.25rem] md:rounded-[1.5rem] border-none shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 overflow-hidden dark:bg-black/40">
                                <div className="p-5 md:p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={cn(
                                            "h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-500 shrink-0",
                                            getCategoryStyles(doc.category)
                                        )}>
                                            <FileText className="h-6 w-6 md:h-7 md:w-7" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={doc.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-black dark:bg-white/10 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                                                title={t('documents.list.btn_download')}
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                            {user?.role === 'ADMIN_MADIS' && (
                                                <button
                                                    onClick={() => handleDelete(doc.id, doc.title)}
                                                    disabled={deletingId === doc.id}
                                                    className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                    title={t('documents.list.btn_delete')}
                                                >
                                                    {deletingId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-base md:text-lg font-bold uppercase tracking-tight leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                        {doc.title}
                                    </h3>

                                    {doc.property_name && (
                                        <div className="flex flex-col gap-1 mb-5">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                                <div className="h-1 w-1 rounded-full bg-primary" />
                                                {doc.property_name}
                                            </div>
                                            {doc.project_name && (
                                                <div className="text-[8px] font-semibold uppercase tracking-widest text-black/30 ml-3">
                                                    Projet: {doc.project_name}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest",
                                                getCategoryStyles(doc.category)
                                            )}>
                                                {doc.category_display || doc.category}
                                            </span>
                                        </div>
                                        <div className="text-[9px] font-mono tracking-tighter font-bold opacity-30 uppercase">
                                            {format(new Date(doc.uploaded_at), 'dd/MM/yyyy', { locale: dateLocale })}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-primary translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-1000" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
