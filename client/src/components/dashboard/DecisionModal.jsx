import React, { useState, useEffect } from 'react';
import {
    X, TrendingUp, Home, CheckCircle2, Loader2, AlertCircle
} from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';

export default function DecisionModal() {
    const { t } = useTranslation();
    const [pendingProperties, setPendingProperties] = useState([]);
    const [currentProp, setCurrentProp] = useState(null);
    const [step, setStep] = useState('choice'); // 'choice', 'form', 'success'
    const [decision, setDecision] = useState(null); // 'SELL', 'RENT'
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        prix_vente: '',
        loyer_mensuel: '',
        charges_mensuelles: '0'
    });
    const { showToast } = useToast();

    useEffect(() => {
        fetchPendingProperties();
    }, []);

    const fetchPendingProperties = async () => {
        try {
            const res = await api.get('/properties/?pending_decision=true');
            const data = res.data.results || [];
            if (Array.isArray(data) && data.length > 0) {
                setPendingProperties(data);
                setCurrentProp(data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch pending properties", err);
        }
    };

    const handleDecisionChoice = (choice) => {
        setDecision(choice);
        setStep('form');
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const data = {
                decision: decision,
                ...formData
            };
            await api.post(`/properties/${currentProp.id}/set_decision/`, data);
            setStep('success');
            showToast({ message: t('decision_modal.toast_success'), type: 'success' });
        } catch (err) {
            console.error(err);
            showToast({ message: t('decision_modal.toast_error'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        const remaining = pendingProperties.filter(p => p.id !== currentProp.id);
        setPendingProperties(remaining);
        if (remaining.length > 0) {
            setCurrentProp(remaining[0]);
            setStep('choice');
            setDecision(null);
            setFormData({ prix_vente: '', loyer_mensuel: '', charges_mensuelles: '0' });
        } else {
            setCurrentProp(null);
        }
    };

    if (!currentProp) return null;

    const renderCommissionPreview = () => {
        const rate = Number(currentProp.commission_rate || 0);
        const fixed = Number(currentProp.commission_fixe || 0);
        const base = decision === 'SELL' ? Number(formData.prix_vente) : Number(formData.loyer_mensuel);

        if (!base || base <= 0) return null;

        const amount = currentProp.commission_type === 'POURCENTAGE'
            ? (base * rate / 100)
            : fixed;

        return (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4 text-xs">
                <div className="flex justify-between items-center text-primary font-bold mb-1">
                    <span>{t('decision_modal.commission_title')}</span>
                    <span className="text-sm">{amount.toLocaleString()}€</span>
                </div>
                <p className="text-muted-foreground uppercase font-black tracking-widest text-[8px]">
                    {currentProp.commission_type === 'POURCENTAGE'
                        ? t('decision_modal.commission_rate', { rate })
                        : t('decision_modal.commission_fixed', { fixed })}
                </p>
            </div>
        );
    };

    const inputClass = "w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-fade-in overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-black uppercase tracking-tight">
                        {step === 'choice' ? t('decision_modal.step_choice') :
                            step === 'form' ? t('decision_modal.step_form') : t('decision_modal.step_success')}
                    </h3>
                    {/* No close button to force choice on the very first purchase, or we can add one */}
                </div>

                <div className="p-6">
                    {step === 'choice' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-base text-muted-foreground">
                                    {t('decision_modal.owner_text_1')} <strong className="text-foreground">{currentProp.name}</strong>.
                                    <br /><br />
                                    {t('decision_modal.owner_text_2')}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleDecisionChoice('SELL')}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-transparent bg-muted rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <TrendingUp className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold">{t('decision_modal.btn_sell')}</span>
                                    <span className="text-[10px] text-muted-foreground mt-1 font-black uppercase tracking-widest">{t('decision_modal.btn_sell_sub')}</span>
                                </button>
                                <button
                                    onClick={() => handleDecisionChoice('RENT')}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-transparent bg-muted rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <Home className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold">{t('decision_modal.btn_rent')}</span>
                                    <span className="text-[10px] text-muted-foreground mt-1 font-black uppercase tracking-widest">{t('decision_modal.btn_rent_sub')}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('decision_modal.form_desc')} <strong>{currentProp.name}</strong>.
                            </p>

                            {decision === 'SELL' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>{t('decision_modal.target_price')}</label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 150000"
                                            required
                                            className={inputClass}
                                            value={formData.prix_vente}
                                            onChange={(e) => setFormData({ ...formData, prix_vente: e.target.value })}
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-2 italic">
                                            {t('decision_modal.purchase_price', { price: Number(currentProp.prix_acquisition || 0).toLocaleString() })}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>{t('decision_modal.target_rent')}</label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 850"
                                            required
                                            className={inputClass}
                                            value={formData.loyer_mensuel}
                                            onChange={(e) => setFormData({ ...formData, loyer_mensuel: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>{t('decision_modal.target_charges')}</label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 50"
                                            className={inputClass}
                                            value={formData.charges_mensuelles}
                                            onChange={(e) => setFormData({ ...formData, charges_mensuelles: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {renderCommissionPreview()}

                            <div className="flex items-start gap-2 text-[10px] text-muted-foreground bg-muted p-3 rounded-xl italic">
                                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                                {t('decision_modal.disclaimer')}
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setStep('choice')} className="flex-1 px-5 py-2.5 text-sm font-bold uppercase tracking-wider rounded-xl border hover:bg-muted transition-colors">
                                    {t('decision_modal.btn_back')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (decision === 'SELL' ? !formData.prix_vente : !formData.loyer_mensuel)}
                                    className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {t('decision_modal.btn_confirm')}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="py-8 text-center space-y-4">
                            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold">{t('decision_modal.step_success')}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed px-4">
                                {t('decision_modal.success_desc')}
                            </p>
                            <button className="w-full mt-6 bg-primary text-white rounded-xl py-3 font-bold uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all" onClick={handleClose}>
                                {t('decision_modal.btn_finish')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
