
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import {
    Wallet,
    ChevronLeft,
    ArrowDownLeft,
    ArrowUpRight,
    Calendar,
    History,
    Download,
    Loader2,
    Building2,
    FileText,
    ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export default function MandateLedger() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [property, setProperty] = useState(null);
    const [exporting, setExporting] = useState(false);

    const handleExportCSV = async () => {
        try {
            setExporting(true);
            // We need the wallet ID, which is in data (implied or we fetch it)
            // But we already have the ledger data, we need the wallet ID from the initial fetch
            const walletRes = await api.get(`/finance/wallets/?property=${id}`);
            if (walletRes.data.results && walletRes.data.results.length > 0) {
                const walletId = walletRes.data.results[0].id;
                const response = await api.get(`/finance/wallets/${walletId}/export-ledger-csv/`, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                const filename = `releve_mandat_${property?.name?.replace(/\s+/g, '_') || 'bien'}_${format(new Date(), 'yyyyMMdd')}.csv`;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch (err) {
            console.error('Failed to export CSV', err);
            alert('Erreur lors de l\'exportation du CSV.');
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Property info
                const propRes = await api.get(`/properties/${id}/`);
                setProperty(propRes.data);

                // 2. Fetch Wallet for this property to get its ID
                const walletRes = await api.get(`/finance/wallets/?property=${id}`);
                if (walletRes.data.results && walletRes.data.results.length > 0) {
                    const walletId = walletRes.data.results[0].id;
                    // 3. Fetch Ledger for that wallet
                    const ledgerRes = await api.get(`/finance/wallets/${walletId}/ledger/`);
                    setData(ledgerRes.data);
                }
            } catch (err) {
                console.error('Failed to fetch ledger data', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Chargement du Grand Livre...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center max-w-md mx-auto">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <h2 className="text-xl font-bold mb-2">Aucun Compte Mandat</h2>
                <p className="text-sm text-muted-foreground mb-6">Ce bien ne semble pas avoir de compte de gestion actif ou vous n'avez pas les droits nécessaires.</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-white rounded-xl font-bold uppercase text-xs"> Retour </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Retour au bien
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-inner">
                            <History className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter">Grand Livre du Mandat</h1>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <Building2 className="h-4 w-4" />
                                <span className="text-sm font-medium">{property?.name} — {property?.address}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-card border rounded-2xl p-4 shadow-sm min-w-[200px] border-l-4 border-l-primary relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Solde Mandat Actuel</span>
                        <div className="flex items-baseline gap-1">
                            <span className={cn(
                                "text-2xl font-black tracking-tighter",
                                data.current_balance >= 0 ? "text-foreground" : "text-rose-600"
                            )}>
                                {data.current_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs font-black text-muted-foreground">€</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-card border rounded-3xl overflow-hidden shadow-xl border-muted/30">
                <div className="p-6 border-b bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background shadow-sm border">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-sm tracking-tight text-foreground/80">Relevé des Opérations de Régie</h3>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-background border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-muted transition-all active:scale-95 shadow-sm disabled:opacity-50"
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                            <Download className="h-4 w-4 text-primary" />
                        )}
                        {exporting ? 'Exportation...' : 'Exporter (CSV)'}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-muted/5 border-b uppercase tracking-widest text-[10px] text-muted-foreground font-black">
                                <th className="px-6 py-4 text-left font-black">Date</th>
                                <th className="px-6 py-4 text-left font-black">Description / Note</th>
                                <th className="px-6 py-4 text-left font-black">Catégorie</th>
                                <th className="px-6 py-4 text-right font-black">Débit (-)</th>
                                <th className="px-6 py-4 text-right font-black">Crédit (+)</th>
                                <th className="px-6 py-4 text-right font-black bg-muted/10">Solde</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted/20">
                            {data.ledger.length > 0 ? (
                                data.ledger.map((row, idx) => (
                                    <tr key={row.id} className="hover:bg-muted/5 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground/80">
                                                    {format(new Date(row.date), 'dd MMM yyyy', { locale: fr })}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/60 font-medium">#{row.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                                                    row.type === 'INFLOW' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                )}>
                                                    {row.type === 'INFLOW' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                                </div>
                                                <div className="max-w-xs md:max-w-md lg:max-w-lg">
                                                    <p className="font-semibold text-foreground leading-tight">{row.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                {row.category_display || row.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-bold text-rose-600">
                                            {row.debit > 0 ? `-${row.debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€` : ''}
                                        </td>
                                        <td className="px-6 py-5 text-right font-bold text-emerald-600">
                                            {row.credit > 0 ? `+${row.credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€` : ''}
                                        </td>
                                        <td className="px-6 py-5 text-right font-black bg-muted/5 group-hover:bg-muted/10 transition-colors">
                                            {row.running_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground italic bg-muted/10">
                                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">Aucune opération enregistrée sur cette période.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 bg-muted/30 flex flex-col items-center justify-center border-t border-dashed">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-4">Fin de relevé au {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: fr })}</p>
                    <div className="h-1 w-20 bg-primary/20 rounded-full" />
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                    to={`/dashboard/finance/transactions/new?propertyId=${id}&returnToProperty=true`}
                    className="px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:-translate-y-1 transition-all active:scale-95"
                >
                    Enregistrer une transaction
                </Link>
            </div>
        </div>
    );
}
