import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import {
    History, Search, MoreHorizontal, Filter,
    ArrowLeft, Plus, Trash2, Download,
    TrendingUp, TrendingDown, Clock, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

export default function TransactionsList() {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const isAdmin = user?.role === 'ADMIN_MADIS';
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const dateLocale = i18n.language === 'fr' ? fr : enUS;

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/finance/transactions/');
            setTransactions(response.data.results || []);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
            showToast({ message: t('finance.transactions_list.messages.load_error'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('finance.transactions_list.messages.confirm_delete'))) return;
        try {
            await api.delete(`/finance/transactions/${id}/`);
            setTransactions(transactions.filter(txn => txn.id !== id));
            showToast({ message: t('finance.transactions_list.messages.delete_success'), type: 'success' });
        } catch (err) {
            showToast({ message: t('finance.transactions_list.messages.delete_error'), type: 'error' });
        }
    };

    const handleExportCSV = () => {
        // Construct the export URL with current filters
        let url = `/finance/transactions/export-csv/?`;
        if (filterCategory !== 'ALL') url += `category=${filterCategory}&`;
        if (search) url += `search=${search}&`;

        // Use window.open or a temporary link to trigger download
        const guestLink = document.createElement('a');
        guestLink.href = url;
        // Since it's behind AUTH, we might need a different approach if simple href fails
        // But our axios interceptor handles tokens for API calls. 
        // For a direct download, we can use axios to get a blob.
        triggerBlobDownload(url);
    };

    const triggerBlobDownload = async (url) => {
        try {
            const response = await api.get(url, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("CSV Export failed", err);
            showToast({ message: t('finance.transactions_list.messages.export_error'), type: 'error' });
        }
    };

    const filteredTransactions = transactions.filter(txn => {
        const matchesSearch = txn.property_name?.toLowerCase().includes(search.toLowerCase()) ||
            txn.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || txn.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryStyles = (category) => {
        switch (category) {
            case 'RENT': return { bg: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', label: t('finance.transactions_list.category_labels.rent') };
            case 'COMMISSION': return { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', label: t('finance.transactions_list.category_labels.commission') };
            case 'MAINTENANCE': return { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', label: t('finance.transactions_list.category_labels.maintenance') };
            case 'TAX': return { bg: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', label: t('finance.transactions_list.category_labels.tax') };
            default: return { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400', label: t('finance.transactions_list.category_labels.other') };
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 md:space-y-12 animate-fade-in py-4 md:py-8 px-0 md:px-4 max-w-[1600px] mx-auto pb-8">
            {/* Solaris Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-black/5">
                <div className="flex items-start gap-6">
                    <Link to="/dashboard/finance" className="mt-2 p-3 hover:bg-black/5 rounded-full transition-all group">
                        <ArrowLeft className="h-5 w-5 text-black group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none mb-3">{t('finance.transactions_list.title')}</h1>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">{t('finance.transactions_list.subtitle')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExportCSV}
                        className="h-10 px-6 flex items-center justify-center rounded-2xl bg-black/[0.02] border border-black/5 text-[11px] font-black uppercase tracking-widest hover:bg-black/5 transition-all text-black/60"
                    >
                        <Download className="mr-3 h-4 w-4" />
                        {t('finance.transactions_list.export_csv')}
                    </button>
                    {isAdmin && (
                        <Link
                            to="/dashboard/finance/transactions/new"
                            className="h-10 px-6 flex items-center justify-center rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                        >
                            <Plus className="mr-3 h-4 w-4" />
                            {t('finance.transactions_list.init_flow')}
                        </Link>
                    )}
                </div>
            </div>

            {/* Industrial Filters Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 md:gap-6">
                <div className="relative group flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-black/20 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('finance.transactions_list.search_placeholder')}
                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-black/[0.02] border-black/5 text-[11px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:opacity-30"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4 p-1.5 bg-black/[0.02] border border-black/5 rounded-2xl w-full sm:w-fit max-w-full">
                    <Filter className="h-4 w-4 text-black/20 ml-4" />
                    <select
                        className="bg-transparent h-11 pr-8 text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer hover:text-primary transition-colors"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="ALL">{t('finance.transactions_list.all_categories')}</option>
                        <option value="RENT">{t('finance.transactions_list.category_options.rent')}</option>
                        <option value="COMMISSION">{t('finance.transactions_list.category_options.commission')}</option>
                        <option value="MAINTENANCE">{t('finance.transactions_list.category_options.maintenance')}</option>
                        <option value="TAX">{t('finance.transactions_list.category_options.tax')}</option>
                        <option value="OTHER">{t('finance.transactions_list.category_options.other')}</option>
                    </select>
                </div>
            </div>

            {/* Premium Solaris Table Container */}
            <div className="solaris-glass rounded-[2rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto pb-4 no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-black/5">
                                <th className="px-10 py-6">{t('finance.transactions_list.columns.period')}</th>
                                <th className="px-10 py-6">{t('finance.transactions_list.columns.date')}</th>
                                <th className="px-10 py-6">{t('finance.transactions_list.columns.asset_desc')}</th>
                                <th className="px-10 py-6">{t('finance.transactions_list.columns.classification')}</th>
                                <th className="px-10 py-6">{t('finance.transactions_list.columns.amount')}</th>
                                <th className="px-10 py-6 text-right">{t('finance.transactions_list.columns.registry')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {filteredTransactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-black/[0.02] transition-all duration-300 group">
                                    <td className="px-10 py-6 whitespace-nowrap">
                                        <div className="text-[12px] font-black uppercase tracking-tighter opacity-80">
                                            {txn.period_month && txn.period_year ? (
                                                `${new Date(2000, txn.period_month - 1).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' })} ${txn.period_year}`
                                            ) : (
                                                t('finance.transactions_list.archive')
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 whitespace-nowrap">
                                        <div className="text-[12px] font-mono tracking-tighter font-bold">
                                            {format(new Date(txn.date), 'dd/MM/yyyy')}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="text-[14px] font-black uppercase tracking-tight mb-1 group-hover:text-primary transition-colors">{txn.property_name}</div>
                                        <div className="text-[10px] text-black/40 font-bold uppercase tracking-widest line-clamp-1">{txn.description || t('finance.transactions_list.no_desc')}</div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className={cn(
                                            "inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors",
                                            getCategoryStyles(txn.category).bg
                                        )}>
                                            {getCategoryStyles(txn.category).label}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg transition-transform group-hover:scale-110",
                                                txn.type === 'INFLOW' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                                {txn.type === 'INFLOW'
                                                    ? <TrendingUp className="h-4 w-4" />
                                                    : <TrendingDown className="h-4 w-4" />
                                                }
                                            </div>
                                            <span className={cn(
                                                "text-[18px] font-black tracking-tighter",
                                                txn.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'
                                            )}>
                                                {txn.type === 'INFLOW' ? '+' : '-'}{Number(txn.amount).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 2 })}€
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                            {txn.invoice && (
                                                <a
                                                    href={txn.invoice}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3 bg-black text-white rounded-xl hover:bg-primary transition-all shadow-xl shadow-black/10"
                                                    title="Télécharger justificatif"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(txn.id)}
                                                    className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-900/10"
                                                    title="Supprimer l'entrée"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredTransactions.length === 0 && (
                        <div className="text-center py-32 bg-black/[0.01]">
                            <History className="mx-auto h-16 w-16 text-black/5 mb-6" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{t('finance.transactions_list.empty_title')}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('finance.transactions_list.empty_desc')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
