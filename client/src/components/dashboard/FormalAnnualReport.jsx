import React from 'react';
import { cn, formatCurrency } from '../../lib/utils';

export default function FormalAnnualReport({ data, selectedYear }) {
    if (!data) return null;

    const categories = data.category_stats || [];
    const revenueCategories = categories.filter(c =>
        ['RENT', 'PROMOTION_SALE', 'CASH_CALL'].includes(c.category)
    );
    const expenseCategories = categories.filter(c =>
        !['RENT', 'PROMOTION_SALE', 'CASH_CALL'].includes(c.category)
    );

    const totalRevenue = revenueCategories.reduce((sum, c) => sum + c.total, 0);
    const totalExpense = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const netResult = totalRevenue - totalExpense;
    const dateStr = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="print-only bg-white text-black p-12 max-w-[210mm] mx-auto min-h-[297mm] font-serif">
            {/* Document Header / Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter mb-1">MADIS</h1>
                    <p className="text-xs uppercase tracking-widest font-bold text-gray-600">Investissement & Gestion Immobilière</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase underline mb-2">Rapport Annuel de Trésorerie</h2>
                    <p className="text-sm font-medium">Exercice Fiscal : {selectedYear}</p>
                    <p className="text-xs text-gray-500">Édité le {dateStr}</p>
                </div>
            </div>

            {/* Entity Information */}
            <div className="mb-10 grid grid-cols-2 gap-12 text-sm">
                <div>
                    <h3 className="font-bold border-b border-gray-200 pb-1 mb-2">Gestionnaire</h3>
                    <p className="font-bold text-emerald-600">MaDis Solaris</p>
                    <p>Département Finance & Régie</p>
                    <p>Paris, France</p>
                </div>
                <div className="text-right">
                    <h3 className="font-bold border-b border-gray-200 pb-1 mb-2 text-right">Rapport Consolidé</h3>
                    <p className="font-bold uppercase tracking-wider italic">Document Administratif</p>
                    <p>Certifié conforme aux flux bancaires</p>
                </div>
            </div>

            {/* Financial Summary Executive Section */}
            <div className="mb-12">
                <h3 className="text-sm font-bold uppercase tracking-widest bg-gray-100 p-2 mb-4 border-l-4 border-black">Résumé Exécutif ({selectedYear})</h3>
                <div className="grid grid-cols-3 border border-gray-200 text-center">
                    <div className="p-4 border-r border-gray-200">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Recettes Totales</p>
                        <p className="text-xl font-black text-emerald-700">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div className="p-4 border-r border-gray-200">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Dépenses Totales</p>
                        <p className="text-xl font-black text-rose-700">{formatCurrency(totalExpense)}</p>
                    </div>
                    <div className="p-4 bg-gray-50">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Bilan Net Annuel</p>
                        <p className={cn(
                            "text-xl font-black underline",
                            netResult >= 0 ? "text-black" : "text-rose-800"
                        )}>{formatCurrency(netResult)}</p>
                    </div>
                </div>
            </div>

            {/* Detailed Accounting Tables */}
            <div className="space-y-10 mb-12">
                {/* Revenue Table */}
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-emerald-800">1. Détail des Encaissements</h4>
                    <table className="w-full text-[11px] border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-2 text-left border-r border-gray-200 uppercase">Désignation</th>
                                <th className="p-2 text-right uppercase">Montant Consolidé</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenueCategories.map(cat => (
                                <tr key={cat.category} className="border-b border-gray-100">
                                    <td className="p-2 border-r border-gray-200">{cat.label}</td>
                                    <td className="p-2 text-right font-bold">{cat.total.toLocaleString()} €</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-black italic">
                                <td className="p-2 text-right border-r border-gray-200">SOUS-TOTAL RECETTES</td>
                                <td className="p-2 text-right text-emerald-700 underline">{totalRevenue.toLocaleString()} €</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Expense Table */}
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-rose-800">2. Détail des Décaissements</h4>
                    <table className="w-full text-[11px] border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-2 text-left border-r border-gray-200 uppercase">Désignation</th>
                                <th className="p-2 text-right uppercase">Montant Consolidé</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenseCategories.map(cat => (
                                <tr key={cat.category} className="border-b border-gray-100">
                                    <td className="p-2 border-r border-gray-200">{cat.label}</td>
                                    <td className="p-2 text-right font-bold">{cat.total.toLocaleString()} €</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-black italic">
                                <td className="p-2 text-right border-r border-gray-200">SOUS-TOTAL DÉPENSES</td>
                                <td className="p-2 text-right text-rose-700 underline">{totalExpense.toLocaleString()} €</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Certification Footer */}
            <div className="mt-auto border-t border-gray-200 pt-8 grid grid-cols-2 gap-8 text-[10px] leading-relaxed italic text-gray-500">
                <div>
                    <p className="font-bold uppercase mb-2 not-italic text-black">Notes administratives</p>
                    <p>Ce document est généré de manière automatisée par le portail MaDis à partir des historiques de transactions validés. Il ne saurait se substituer à une déclaration fiscale officielle mais constitue une aide rigoureuse à la préparation comptable.</p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="w-32 h-16 border border-gray-200 bg-gray-50 mb-1 flex items-center justify-center">
                        <span className="opacity-20 text-[8px]">Cachet MaDis Solaris</span>
                    </div>
                    <p className="font-bold text-black border-t border-black pt-1 w-48 text-center uppercase">Validation Trésorerie</p>
                </div>
            </div>

            <p className="text-center text-[8px] text-gray-400 mt-12 uppercase tracking-[0.5em]">Madis Solaris - Rapport Annuel de Performance © {new Date().getFullYear()}</p>
        </div>
    );
}


