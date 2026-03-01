import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import { Wallet, ArrowDownLeft, ArrowUpRight, Loader2, History, PlusSquare, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function WalletCard({ propertyId, onCashCall, onSettlement }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWallet = async () => {
        try {
            const response = await api.get(`/finance/wallets/?property=${propertyId}`);
            if (response.data.results && response.data.results.length > 0) {
                setWallet(response.data.results[0]);
            } else {
                // If no wallet exists yet (should be created by signals ideally, or create it here)
                // But normally it's created when property is created or first transaction occurs.
                setWallet(null);
            }
        } catch (err) {
            console.error('Failed to fetch wallet', err);
            setError(t('wallet_card.error_fetch'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (propertyId) {
            fetchWallet();
        }
    }, [propertyId]);

    // Handle refresh from parent if needed (e.g. after modal success)
    window.refreshWallet = fetchWallet;

    if (loading) return (
        <div className="flex flex-col gap-4 p-6 bg-card border rounded-2xl shadow-sm animate-pulse">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-10 w-40 bg-muted rounded" />
            <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="h-12 bg-muted rounded-xl" />
                <div className="h-12 bg-muted rounded-xl" />
            </div>
        </div>
    );

    if (error) return (
        <div className="p-4 bg-destructive/10 text-destructive text-xs border border-destructive/20 rounded-2xl">
            {error}
        </div>
    );

    if (!wallet) return (
        <div className="bg-card border rounded-2xl p-6 shadow-sm border-dashed text-center">
            <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
            <p className="text-xs text-muted-foreground font-medium italic">{t('wallet_card.empty_wallet')}</p>
        </div>
    );

    const balance = Number(wallet.balance);

    return (
        <div className="solaris-glass group rounded-[2rem] overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-primary/10">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner">
                            <Wallet className="h-5 w-5 transition-transform group-hover:scale-110" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold tracking-tight">{t('wallet_card.title')}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.1em] opacity-80">{t('wallet_card.subtitle')}</p>
                        </div>
                    </div>
                </div>

                <div className="relative mb-8">
                    <div className="flex items-baseline gap-2">
                        <span className={cn(
                            "text-4xl font-black tracking-tighter transition-colors",
                            balance > 0 ? "text-foreground" : balance < 0 ? "text-rose-600" : "text-muted-foreground"
                        )}>
                            {balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-lg font-black text-muted-foreground/60 transition-colors group-hover:text-primary">€</span>
                    </div>
                    {balance > 0 && (
                        <div className="absolute -right-2 top-0 h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onCashCall}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-primary/20 bg-primary/[0.02] hover:bg-primary/5 transition-all active:scale-95 group/btn overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        <ArrowDownLeft className="h-5 w-5 text-[#10B981] group-hover/btn:translate-y-0.5 transition-transform relative z-10" />
                        <span className="text-[10px] font-black uppercase tracking-wider relative z-10">{t('wallet_card.btn_call')}</span>
                    </button>
                    <button
                        onClick={onSettlement}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-rose-200/50 bg-rose-50/20 hover:bg-rose-50/50 transition-all active:scale-95 group/btn overflow-hidden relative text-rose-900 dark:text-rose-400">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        <ArrowUpRight className="h-5 w-5 text-rose-600 group-hover/btn:-translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform relative z-10" />
                        <span className="text-[10px] font-black uppercase tracking-wider relative z-10">{t('wallet_card.btn_pay')}</span>
                    </button>
                </div>
            </div>

            <div className="bg-muted/30 p-4 border-t border-dashed transition-colors group-hover:bg-muted/50">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest opacity-60">
                        <History className="h-3 w-3" />
                        {t('wallet_card.last_op')}
                    </div>
                    <span className="font-medium whitespace-nowrap">
                        {new Date(wallet.last_updated).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className="flex items-center justify-center">
                    <button
                        onClick={() => navigate(`/dashboard/properties/${propertyId}/ledger`)}
                        className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 uppercase tracking-wide"
                    >
                        {t('wallet_card.view_ledger')}
                        <ExternalLink className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
