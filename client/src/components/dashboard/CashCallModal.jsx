import { useState } from 'react';
import { X, DollarSign, StickyNote, Calendar, Loader2, Plus, Info, Upload } from 'lucide-react';
import api from '../../lib/axios';
import { useTranslation } from 'react-i18next';

export default function CashCallModal({ propertyId, onClose, onSuccess }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        reason: '',
        description: '',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 days from now
        proof: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('property', propertyId);
            formData.append('amount', form.amount);
            formData.append('reason', form.reason);
            formData.append('description', form.description);
            formData.append('due_date', form.due_date);
            formData.append('status', 'SENT');
            if (form.proof) {
                formData.append('proof', form.proof);
            }

            await api.post('/finance/cash-calls/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Error creating cash call', err);
            alert(t('cash_call.alert_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                            <Plus className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold">{t('cash_call.title')}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3 text-xs text-blue-800 dark:text-blue-300">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>{t('cash_call.info')}</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                                <DollarSign className="h-3 w-3 inline mr-1" />
                                {t('cash_call.amount')}
                            </label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                placeholder="ex: 500.00"
                                value={form.amount}
                                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                                <Plus className="h-3 w-3 inline mr-1" />
                                {t('cash_call.reason')}
                            </label>
                            <input
                                required
                                type="text"
                                placeholder={t('cash_call.reason_ph')}
                                value={form.reason}
                                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {t('cash_call.due_date')}
                            </label>
                            <input
                                required
                                type="date"
                                value={form.due_date}
                                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                                <StickyNote className="h-3 w-3 inline mr-1" />
                                {t('cash_call.details')}
                            </label>
                            <textarea
                                rows={2}
                                placeholder={t('cash_call.details_ph')}
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                className="w-full rounded-xl border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                                <Upload className="h-3 w-3 inline mr-1" />
                                {t('cash_call.proof')}
                            </label>
                            <input
                                type="file"
                                onChange={e => setForm(p => ({ ...p, proof: e.target.files[0] }))}
                                className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/20">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-xl border hover:bg-muted transition-colors">
                            {t('cash_call.btn_cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all scale-100 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            {t('cash_call.btn_send')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
