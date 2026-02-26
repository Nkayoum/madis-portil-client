import { useState } from 'react';
import { X, DollarSign, StickyNote, Calendar, Loader2, ArrowUpRight, Info, Upload } from 'lucide-react';
import api from '../../lib/axios';

export default function SettlementModal({ propertyId, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        note: '',
        proof: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('property', propertyId);
            formData.append('amount', form.amount);
            formData.append('period_start', form.period_start);
            formData.append('period_end', form.period_end);
            formData.append('note', form.note);
            formData.append('status', 'PROCESSING');
            if (form.proof) {
                formData.append('proof', form.proof);
            }

            await api.post('/finance/settlements/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Error creating settlement', err);
            alert('Erreur lors de l\'enregistrement du reversement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                            <ArrowUpRight className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold">Nouveau Reversement</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex gap-3 text-xs text-amber-800 dark:text-amber-300">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>Le reversement est le transfert du bénéfice net vers le compte bancaire du propriétaire. Assurez-vous d'avoir assez de provision sur le Wallet.</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                                <DollarSign className="h-3 w-3 inline mr-1" />
                                Montant à verser (€)
                            </label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                placeholder="ex: 1250.00"
                                value={form.amount}
                                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    Début Période
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={form.period_start}
                                    onChange={e => setForm(p => ({ ...p, period_start: e.target.value }))}
                                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    Fin Période
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={form.period_end}
                                    onChange={e => setForm(p => ({ ...p, period_end: e.target.value }))}
                                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                                <StickyNote className="h-3 w-3 inline mr-1" />
                                Note Interne / Référence
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Référence virement ou note explicative..."
                                value={form.note}
                                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                                className="w-full rounded-xl border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                                <Upload className="h-3 w-3 inline mr-1" />
                                Justificatif de Virement (Optionnel)
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
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-rose-200 dark:shadow-rose-900/20 hover:bg-rose-700 transition-all scale-100 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                            Enregistrer le versement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
