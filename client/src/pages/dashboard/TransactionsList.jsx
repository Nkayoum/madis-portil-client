import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    History, Search, MoreHorizontal, Filter,
    ArrowLeft, Plus, Trash2, Download,
    TrendingUp, TrendingDown, Clock, Loader2, Pencil
} from 'lucide-react';
import { fr } from 'date-fns/locale';

export default function TransactionsList() {
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/finance/transactions/');
            setTransactions(response.data.results || []);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
            showToast({ message: 'Erreur lors du chargement des transactions.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette transaction ?')) return;
        try {
            await api.delete(`/finance/transactions/${id}/`);
            setTransactions(transactions.filter(t => t.id !== id));
            showToast({ message: 'Transaction supprimée.', type: 'success' });
        } catch (err) {
            showToast({ message: 'Erreur lors de la suppression.', type: 'error' });
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.property_name?.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryStyles = (category) => {
        switch (category) {
            case 'RENT': return { bg: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', label: 'Loyer' };
            case 'COMMISSION': return { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', label: 'Commission' };
            case 'MAINTENANCE': return { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', label: 'Maintenance' };
            case 'TAX': return { bg: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', label: 'Taxe' };
            default: return { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400', label: 'Autre' };
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
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard/finance" className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1">Historique</h1>
                        <p className="text-muted-foreground">Toutes les transactions financières du portail.</p>
                    </div>
                </div>
                <Link
                    to="/dashboard/finance/transactions/new"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Transaction
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="ALL">Toutes les catégories</option>
                        <option value="RENT">Loyers</option>
                        <option value="COMMISSION">Commissions</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="TAX">Taxes</option>
                        <option value="OTHER">Autre</option>
                    </select>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto pb-24">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Période</th>
                                <th className="px-6 py-4">Date Paiement</th>
                                <th className="px-6 py-4">Bien / Description</th>
                                <th className="px-6 py-4">Catégorie</th>
                                <th className="px-6 py-4">Montant</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-semibold">
                                        {t.period_month && t.period_year ? (
                                            `${new Date(2000, t.period_month - 1).toLocaleString('fr-FR', { month: 'short' })} ${t.period_year}`
                                        ) : (
                                            'N/A'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                        {format(new Date(t.date), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground">{t.property_name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">{t.description || 'Sans description'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryStyles(t.category).bg}`}>
                                            {getCategoryStyles(t.category).label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold">
                                        <div className="flex items-center gap-1.5">
                                            {t.type === 'INFLOW'
                                                ? <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                                : <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                            }
                                            <span className={t.type === 'INFLOW' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                                {t.type === 'INFLOW' ? '+' : '-'}{Number(t.amount).toLocaleString()}€
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {t.invoice && (
                                                <a href={t.invoice} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors" title="Télécharger facture">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            )}
                                            <Link
                                                to={`/dashboard/finance/transactions/${t.id}/edit`}
                                                className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                                                title="Modifier"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="p-2 hover:bg-destructive/10 rounded-md text-destructive transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (
                        <div className="text-center py-20">
                            <History className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold mb-1">Aucune transaction</h3>
                            <p className="text-muted-foreground text-sm">Ajustez vos filtres ou ajoutez une transaction.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
