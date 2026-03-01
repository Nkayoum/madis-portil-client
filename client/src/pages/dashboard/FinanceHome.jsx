import { useAuth } from '../../context/AuthContext';
import FinancialDashboard from '../../components/dashboard/FinancialDashboard';
import { Wallet, History, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function FinanceHome() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const isAdmin = user?.role === 'ADMIN_MADIS';

    return (
        <div className="space-y-12 animate-fade-in pb-8 md:pb-12 max-w-[1600px] mx-auto px-4">
            {/* Solaris Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-black/5">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight uppercase leading-none mb-2">
                        {t('dashboard.title').split('&')[0]} & <span className="text-primary italic">{t('dashboard.title').split('&')[1]}</span>
                    </h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">
                        {isAdmin
                            ? t('dashboard.subtitle_admin')
                            : t('dashboard.subtitle_client')}
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <Link
                            to="/dashboard/finance/transactions"
                            className="h-10 px-6 flex items-center justify-center rounded-2xl bg-black/[0.02] border border-black/5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-black/5 transition-all text-black/60 w-full sm:w-auto"
                        >
                            <History className="mr-3 h-4 w-4" />
                            {t('dashboard.history')}
                        </Link>
                        <Link
                            to="/dashboard/finance/transactions/new"
                            className="h-10 px-6 flex items-center justify-center rounded-2xl bg-primary text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all w-full sm:w-auto"
                        >
                            <Plus className="mr-3 h-4 w-4" />
                            {t('common.save')}
                        </Link>
                    </div>
                )}
            </div>

            {/* Main Analytical Dashboard Container */}
            <div className="solaris-glass rounded-[2.5rem] p-4 md:p-10 border-none shadow-2xl relative overflow-x-clip overflow-y-visible">
                <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <FinancialDashboard isAdmin={isAdmin} />
            </div>

            {!isAdmin && (
                <div className="grid gap-10 md:grid-cols-2">
                    <div className="solaris-glass rounded-[2rem] p-8 border-none shadow-xl">
                        <h3 className="text-[14px] font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                            <Plus className="h-4 w-4 text-primary" />
                            {t('finance.home.latest_revenues')}
                        </h3>
                        <div className="flex flex-col items-center justify-center h-48 text-center bg-black/[0.02] border-2 border-dashed border-black/5 rounded-2xl">
                            <History className="h-8 w-8 text-black/5 mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30">{t('finance.home.no_recent_flow')}</p>
                        </div>
                    </div>

                    <div className="solaris-glass rounded-[2rem] p-8 border-none shadow-xl">
                        <h3 className="text-[14px] font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                            <ArrowRight className="h-4 w-4 text-primary" />
                            {t('finance.home.performance_tips')}
                        </h3>
                        <div className="p-8 bg-primary/5 rounded-[1.5rem] border border-primary/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Wallet className="h-16 w-16 text-primary" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-2">{t('finance.home.yield_optimization')}</p>
                            <p className="text-[13px] font-medium leading-relaxed opacity-70">
                                {t('finance.home.contact_advisor')}
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                {t('finance.home.learn_more')}
                                <ArrowRight className="h-3 w-3" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
