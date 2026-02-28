import { Download, Table, PieChart, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import FormalAnnualReport from './FormalAnnualReport';

export default function AnnualReport({ data, selectedYear, isAdmin }) {
    if (!data) return null;

    const categories = data.category_stats || [];
    const rental = data.rental_performance || {};
    const trans = data.transactional_performance || {};

    // Group categories by type for the report
    const revenueCategories = categories.filter(c =>
        ['RENT', 'PROMOTION_SALE', 'CASH_CALL'].includes(c.category)
    );

    const expenseCategories = categories.filter(c =>
        !['RENT', 'PROMOTION_SALE', 'CASH_CALL'].includes(c.category)
    );

    const totalRevenue = revenueCategories.reduce((sum, c) => sum + c.total, 0);
    const totalExpense = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const netResult = totalRevenue - totalExpense;

    return (
        <>
            {/* Professional Administrative Document (Print Only) */}
            <FormalAnnualReport data={data} selectedYear={selectedYear} />

            {/* Web UI Dashboard (Screen Only) */}
            <div className="space-y-8 animate-in fade-in duration-500 screen-only">
                {/* Header Summary */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="solaris-glass p-8 rounded-[2rem] border border-emerald-500/10 dark:border-emerald-500/20 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-3">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Revenus Totaux {selectedYear}</span>
                        </div>
                        <div className="text-4xl font-black text-foreground tracking-tighter dark:text-white whitespace-nowrap">
                            <span className="hidden xl:inline">{formatCurrency(totalRevenue)}</span>
                            <span className="xl:hidden">{formatCurrency(totalRevenue, true)}</span>
                        </div>
                    </div>

                    <div className="solaris-glass p-8 rounded-[2rem] border border-rose-500/10 dark:border-rose-500/20 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-3">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Charges Totales {selectedYear}</span>
                        </div>
                        <div className="text-4xl font-black text-foreground tracking-tighter dark:text-white whitespace-nowrap">
                            <span className="hidden xl:inline">{formatCurrency(totalExpense)}</span>
                            <span className="xl:hidden">{formatCurrency(totalExpense, true)}</span>
                        </div>
                    </div>

                    <div className={cn(
                        "solaris-glass p-8 rounded-[2rem] border group overflow-hidden relative",
                        netResult >= 0 ? "border-primary/10 dark:border-primary/20" : "border-orange-500/10 dark:border-orange-500/20"
                    )}>
                        <div className={cn(
                            "absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 blur-2xl transition-colors",
                            netResult >= 0 ? "bg-primary/5 group-hover:bg-primary/10" : "bg-orange-500/5 group-hover:bg-orange-500/10"
                        )} />
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className={cn("h-4 w-4", netResult >= 0 ? "text-primary" : "text-orange-500")} />
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest opacity-70",
                                netResult >= 0 ? "text-primary/70" : "text-orange-500/70"
                            )}>Résultat Net {selectedYear}</span>
                        </div>
                        <div className={cn(
                            "text-4xl font-black tracking-tighter whitespace-nowrap",
                            netResult >= 0 ? "text-foreground dark:text-white" : "text-orange-600 dark:text-orange-400"
                        )}>
                            <span className="hidden xl:inline">{formatCurrency(netResult)}</span>
                            <span className="xl:hidden">{formatCurrency(netResult, true)}</span>
                        </div>
                    </div>
                </div>

                {/* Detailed Breakdown Table */}
                <div className="bg-card dark:bg-black/60 border dark:border-white/5 rounded-[2.5rem] overflow-hidden solaris-glass shadow-xl">
                    <div className="px-8 py-6 border-b dark:border-white/5 bg-muted/30 dark:bg-white/[0.02] flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Table className="h-4 w-4 text-primary" />
                            Récapitulatif par Catégorie ({selectedYear})
                        </h3>
                        <div className="text-[10px] font-bold text-muted-foreground bg-background dark:bg-white/5 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/10 uppercase tracking-widest">
                            TOTAL CONSOLIDÉ
                        </div>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/10 dark:bg-white/[0.02] border-b dark:border-white/5">
                                    <th className="px-6 py-3 text-left font-bold text-[10px] uppercase text-muted-foreground">Catégorie</th>
                                    <th className="px-6 py-3 text-right font-bold text-[10px] uppercase text-muted-foreground">Montant (€)</th>
                                    <th className="px-6 py-3 text-right font-bold text-[10px] uppercase text-muted-foreground">% Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-white/5">
                                <tr className="bg-muted/5 dark:bg-white/[0.01]"><td colSpan="3" className="px-8 py-4 text-[10px] font-black uppercase text-emerald-600 tracking-widest">Encaissements (Revenus)</td></tr>
                                {revenueCategories.map(cat => (
                                    <tr key={cat.category} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-3 font-medium">{cat.label}</td>
                                        <td className="px-6 py-3 text-right font-black text-emerald-600">{cat.total.toLocaleString()}€</td>
                                        <td className="px-6 py-3 text-right text-muted-foreground text-xs font-bold">
                                            {totalRevenue > 0 ? ((cat.total / totalRevenue) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                ))}
                                {revenueCategories.length === 0 && (
                                    <tr><td colSpan="3" className="px-6 py-4 text-center text-muted-foreground italic text-xs">Aucun revenu enregistré</td></tr>
                                )}

                                <tr className="bg-muted/5"><td colSpan="3" className="px-6 py-2 text-[10px] font-black uppercase text-rose-600 tracking-widest">Décaissements (Charges)</td></tr>
                                {expenseCategories.map(cat => (
                                    <tr key={cat.category} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-3 font-medium">{cat.label}</td>
                                        <td className="px-6 py-3 text-right font-black text-rose-600">{cat.total.toLocaleString()}€</td>
                                        <td className="px-6 py-3 text-right text-muted-foreground text-xs font-bold">
                                            {totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                ))}
                                {expenseCategories.length === 0 && (
                                    <tr><td colSpan="3" className="px-6 py-4 text-center text-muted-foreground italic text-xs">Aucune charge enregistrée</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-muted/30 font-bold border-t-2 border-primary/20">
                                <tr>
                                    <td className="px-6 py-4 text-[11px] uppercase tracking-widest text-primary">BILAN ANNUEL NET</td>
                                    <td className={cn(
                                        "px-6 py-4 text-right text-lg font-black whitespace-nowrap",
                                        netResult >= 0 ? "text-primary" : "text-rose-600"
                                    )}>
                                        <span className="hidden xl:inline">{formatCurrency(netResult)}</span>
                                        <span className="xl:hidden">{formatCurrency(netResult, true)}</span>
                                    </td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Note Section for Tax prep */}
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                    <h4 className="font-bold text-blue-800 dark:text-blue-400 text-sm mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Aide à la déclaration fiscale
                    </h4>
                    <p className="text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed">
                        Ce rapport consolide l'ensemble des flux financiers pour l'année {selectedYear}. Pour une déclaration en régime réel (LMNP/Réel), les charges de maintenance, taxes et assurances sont généralement déductibles. Les commissions MaDis (Intermédiation) sont également à intégrer dans vos charges de gestion.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-white dark:bg-background border rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
                        >
                            <Download className="h-3 w-3" />
                            Imprimer le récapitulatif
                        </button>
                        <span className="text-[10px] text-muted-foreground italic">
                            Note: Les amortissements ne sont pas inclus dans ce rapport de trésorerie.
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
