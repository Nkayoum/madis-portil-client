import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import FinancialDashboard from '@/components/dashboard/FinancialDashboard';
import { Wallet, History, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinanceHome() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN_MADIS';

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">
                        Finance & <span className="text-primary">Rendement</span>
                    </h1>
                    <p className="text-muted-foreground">
                        {isAdmin
                            ? "Suivi global des flux financiers et des commissions MaDis."
                            : "Suivez la performance de vos investissements et vos revenus locatifs."}
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex gap-3">
                        <Link
                            to="/dashboard/finance/transactions"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                        >
                            <History className="mr-2 h-4 w-4" />
                            Historique
                        </Link>
                        <Link
                            to="/dashboard/finance/transactions/new"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Enregistrer
                        </Link>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-xl border p-6 shadow-sm">
                <FinancialDashboard isAdmin={isAdmin} />
            </div>

            {!isAdmin && (
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Derniers Revenus
                        </h3>
                        <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground border border-dashed rounded-lg">
                            <p className="text-sm">L'historique détaillé des paiements sera bientôt disponible.</p>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <ArrowRight className="h-5 w-5 text-primary" />
                            Conseils Rendement
                        </h3>
                        <div className="p-4 bg-primary/5 rounded-lg">
                            <p className="text-sm font-medium mb-1">Optimisation Fiscale</p>
                            <p className="text-xs text-muted-foreground">Contactez votre conseiller MaDis pour explorer les dispositifs de défiscalisation adaptés à votre profil.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
